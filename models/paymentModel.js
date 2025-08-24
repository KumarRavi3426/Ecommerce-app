import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // reference to your User model
      ref: "User",
      required: true,
    },

    // Razorpay order details
    razorpayOrderId: { type: String, required: true }, // from razorpay.orders.create
    razorpayPaymentId: { type: String }, // filled after payment
    razorpaySignature: { type: String }, // filled after payment verify

    amount: { type: Number, required: true }, // in paise (50000 = ₹500)
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    receipt: { type: String }, // from Razorpay or your own string

    // Optional: store full payment object for debugging/reconciliation
    paymentDetails: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
