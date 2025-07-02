import express from "express";
import {
  checkout,
  paymentVerification,
} from "../controllers/paymentController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.get("/getKey", (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
);

router.post("/checkout", requireSignIn, checkout);

router.post("/paymentverification", paymentVerification);

export default router;
