import { Router } from "express";
import {
  getUserContacts,
  logOut,
  sendOtp,
  updateProfile,
  verifyOtp,
} from "../controllers/auth.controller.js";
import verifyToken from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
const router = Router();

// ROUTES
router.route("/send-otp").post(sendOtp);

router.route("/verify-otp").post(verifyOtp);

// PROTECTED ROUTES
router
  .route("/update-profile")
  .put(verifyToken, upload.single("avatar"), updateProfile);

router.route("/logout").post(logOut);

router.route("/get-users").get(verifyToken, getUserContacts);

export default router;
