import { Router } from "express";
import {
  sendOtp,
  updateProfile,
  verifyOtp,
} from "../controllers/auth.controller.js";
import verifyToken from "../middleware/auth.middleware.js";
import { multerStore } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/send-otp").post(sendOtp);
router.route("/verify-otp").post(verifyOtp);
router.route("/update-profile", verifyToken, multerStore, updateProfile);

export default router;
