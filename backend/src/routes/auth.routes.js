import { Router } from "express";
import {
  logOut,
  sendOtp,
  updateProfile,
  verifyOtp,
} from "../controllers/auth.controller.js";
import verifyToken from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
const router = Router();

router.route("/send-otp").post(sendOtp);
router.route("/verify-otp").post(verifyOtp);
router
  .route("/update-profile")
  .put(verifyToken, upload.single("avatar"), updateProfile);
router.route("/logout").post(logOut);

export default router;
