import { Router } from "express";
import {
  addToContacts,
  deleteContacts,
  getUserContacts,
  getUserProfile,
  getUsersForAddContacts,
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

router.route("/logout").get(logOut);

router.route("/get-users").get(verifyToken, getUserContacts);

router.route("/get-user-profile").get(verifyToken, getUserProfile);

router.route("/add-contacts").post(verifyToken, addToContacts);

router.route("/delete-contact").post(verifyToken, deleteContacts);

router
  .route("/get-all-users-for-add-to-contacts")
  .get(verifyToken, getUsersForAddContacts);

export default router;
