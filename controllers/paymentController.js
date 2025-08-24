import { instance } from "../server.js";
import crypto from "crypto";
import { Payment } from "../models/paymentModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

export const checkout = async (req, res) => {
  const options = {
    amount: Number(req.body.amount * 100),
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };
  const order = await instance.orders.create(options);

  // Save order as paymentModel in DB here with status = "pending"
  await Payment.create({
    userId: req.user._id,
    razorpayOrderId: order.id,
    amount: options.amount,
    currency: options.currency,
    receipt: order.receipt,
    status: "pending",
  });

  // Save order only after payment

  res.status(200).json({
    success: true,
    order,
  });
};

export const paymentVerification = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user } =
    req.body;
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Update DB: order = success
    const dbOrder = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    const payment = await instance.payments.fetch(razorpay_payment_id);

    // ????? does this ensure payment is success or just captured as authentic
    // here I am changing the payment model, if payment is success, i.e. money is transferred
    // then, update orderModel.status = "Processing", else status="cancel"
    if (payment.status === "captured") {
      dbOrder.status = "success";
    } else if (payment.status === "failed") {
      dbOrder.status = "failed";
    } else {
      dbOrder.status = "pending"; // e.g. "authorized"
    }

    dbOrder.razorpayPaymentId = razorpay_payment_id;
    dbOrder.razorpaySignature = razorpay_signature;
    dbOrder.paymentDetails = payment; // optional: store full details
    await dbOrder.save();

    // orderModel save after payment success
    const existingUser = await userModel.findOne({ email: user.email });

    await new orderModel({
      products: req.body.cart,
      buyer: existingUser._id,
      payment: dbOrder._id,
    }).save();

    res.json({ status: "Order placed" });
  } else {
    // Update DB: order = failed
    const dbOrder = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    dbOrder.razorpayPaymentId = razorpay_payment_id;
    dbOrder.razorpaySignature = razorpay_signature;
    dbOrder.status = "failed"; // after signature verification
    await dbOrder.save();

    res.json({ status: "failed" });
  }
};

// ✅ Razorpay Webhook (for delayed settlements / failures)

export const webHookUpdate = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest === req.headers["x-razorpay-signature"]) {
    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;

      // Update Payment model
      const updatedPayment = await Payment.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          paymentDetails: payment,
          status: payment.status === "captured" ? "success" : "failed",
        },
        { new: true }
      );

      // Create or update order if payment is captured successfully
      if (payment.status === "captured" && updatedPayment) {
        // Check if order already exists for this payment
        const existingOrder = await orderModel.findOne({
          payment: updatedPayment._id,
        });

        if (!existingOrder) {
          // If no order exists, we need cart and buyer info from payment notes or other source
          // For now, we'll just update the order status if it exists elsewhere
          console.log(
            "✅ Payment captured but order creation requires cart data:",
            payment.id
          );
        } else {
          // Update existing order status to "Processing" since payment is captured
          existingOrder.status = "Processing";
          await existingOrder.save();
          console.log(
            "✅ Order updated to Processing for payment:",
            payment.id
          );
        }
      }

      console.log("✅ Payment captured:", payment.id);
    }

    if (event === "payment.failed") {
      const payment = req.body.payload.payment.entity;

      // Update Payment model
      const updatedPayment = await Payment.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          paymentDetails: payment,
          status: "failed",
        },
        { new: true }
      );

      // Update order status if it exists
      if (updatedPayment) {
        const existingOrder = await orderModel.findOne({
          payment: updatedPayment._id,
        });
        if (existingOrder) {
          existingOrder.status = "cancel";
          await existingOrder.save();
          console.log("❌ Order cancelled for failed payment:", payment.id);
        }
      }

      console.log("❌ Payment failed:", payment.id);
    }

    res.json({ status: "ok" });
  } else {
    res.status(400).send("Invalid signature");
  }
};
