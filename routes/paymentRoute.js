import express from "express";
import {
  checkout,
  paymentVerification,
  webHookUpdate,
} from "../controllers/paymentController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.get("/getKey", (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID })
);

router.post("/checkout", requireSignIn, checkout);
router.post("/paymentverification", paymentVerification);
router.post("/webhook", webHookUpdate);

export default router;
