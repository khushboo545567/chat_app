import { Router } from "express";
import verifyToken from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  createStatus,
  deleteStatus,
  getStatus,
  viewedStatus,
} from "../controllers/status.controller.js";

const router = Router();

router
  .route("/post-status")
  .post(verifyToken, upload.single("image"), createStatus);

router.route("/delete-status/:statusId").delete(verifyToken, deleteStatus);

router.route("/view-status/:statusId").get(verifyToken, viewedStatus);

router.route("/get-status").get(verifyToken, getStatus);

export default router;
