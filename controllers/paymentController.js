import { instance } from "../server.js";
import crypto from "crypto";
import { Payment } from "../models/paymentModel.js";
import { configDotenv } from "dotenv";
import orderModel from "../models/orderModel.js";

configDotenv();

export const checkout = async (req, res) => {
  const options = {
    amount: Number(req.body.amount * 100),
    currency: "INR",
  };
  const order = await instance.orders.create(options);
  const newOrder = new orderModel({
    products: req.body.cart,
    buyer: req.user._id,
  }).save();


  res.status(200).json({
    success: true,
    order,
  });
};

export const paymentVerification = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_APT_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Database comes here
    
    const payment = await new Payment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }).save();

    // also find the order and update its payment
    
    res.redirect(
      // `http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}`
      `${process.env.FRONTEND_URL}/`
    );
  } else {
    // res.status(400).json({
    //   success: false,
    // });


    res.redirect(
      // `http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}`
      `${process.env.FRONTEND_URL}/`
    );
  }
};
