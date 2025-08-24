import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "Product", // Use "Product" if your product model is named "Product"
      },
    ],
    payment: {
      type: mongoose.ObjectId, // razorpayOrderId
      ref: "Payment",
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "delivered", "cancel"],
      // Processing: after payment
      // cancel: if payment failed
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
