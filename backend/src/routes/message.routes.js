import { Router } from "express";
import verifyToken from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  deleteMsg,
  getConversation,
  getMessages,
  markAsRead,
  messageSend,
} from "../controllers/message.controller.js";
const router = Router();

router
  .route("/send_msg")
  .post(verifyToken, upload.single("image"), messageSend);
router.route("/get_conversation").get(verifyToken, getConversation);
router.route("/get_messages/:receiverId").get(verifyToken, getMessages);
router.route("/mark_as_read/:roomId").get(verifyToken, markAsRead);
router.route("/delete_message/:messageId").delete(verifyToken, deleteMsg);

export default router;
