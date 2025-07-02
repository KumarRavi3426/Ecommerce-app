import express from "express";
import {
  checkout,
  paymentVerification,
} from "../controllers/paymentController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/checkout", requireSignIn, checkout);

router.post("/paymentverification", paymentVerification);

export default router;
