import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Message } from "../models/message.model.js";
import { Chatroom } from "../models/chatroom.model.js";
import mongoose from "mongoose";

// send message to the receiver
const messageSend = asyncHandler(async (req, res) => {
  const senderId = req.user.userId;
  const { receiverId, content, roomId } = req.body;
  console.log("sender id ", senderId);
  if (!senderId || !receiverId) {
    throw new ApiError(400, "senderId, receiverId and roomId are required");
  }

  if (senderId.toString() === receiverId.toString()) {
    throw new ApiError(400, "Sender cannot send message to themselves");
  }

  let chatroom;

  // If roomId is provided, use it
  if (roomId) {
    chatroom = await Chatroom.findById(roomId);

    if (!chatroom) {
      throw new ApiError(404, "Chatroom not found");
    }
  }
  // Else find or create chatroom (first-time message)
  else {
    chatroom = await Chatroom.findOne({
      isGroup: false,
      participants: { $all: [senderId, receiverId] },
    });

    if (!chatroom) {
      chatroom = await Chatroom.create({
        participants: [senderId, receiverId],
        createdBy: senderId,
        isGroup: false,
      });
    }
  }

  let imageOrVideoUrl = null;
  let messageType = "text";

  const filePath = req.file?.path;

  if (filePath) {
    const uploadFile = await uploadOnCloudinary(filePath);

    if (!uploadFile) {
      throw new ApiError(400, "Failed to upload file to Cloudinary");
    }

    imageOrVideoUrl = uploadFile.secure_url;

    if (uploadFile.resource_type === "image") {
      messageType = "image";
    } else if (uploadFile.resource_type === "video") {
      messageType = "video";
    } else {
      throw new ApiError(400, "Unsupported file type");
    }
  } else if (content?.trim()) {
    messageType = "text";
  } else {
    throw new ApiError(400, "Message content or file is required");
  }

  const message = await Message.create({
    roomId: chatroom._id,
    sender: senderId,
    receiver: receiverId,
    content: content || "",
    imageOrVideoUrl,
    messageType,
  });

  // update last message
  await Chatroom.findByIdAndUpdate(chatroom._id, {
    lastMessage: message._id,
  });

  // check receiver online
  // const receiverSocketId = req.socketUserMap?.get(receiverId);

  // if (receiverSocketId) {
  //   message.status = "delivered";
  //   await message.save();
  // }

  // populate once only
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username avatar")
    .populate("receiver", "username avatar");

  // emit if online
  // if (receiverSocketId) {
  //   req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
  // }

  return res
    .status(200)
    .json(new ApiResponse(200, populatedMessage, "Message sent successfully"));
});

// fetches all chatrooms where the user is a participant
const getConversation = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.userId);

  //  Find all chatrooms for this user
  const chatrooms = await Chatroom.find({
    participants: userId,
  })
    .populate({
      path: "participants",
      select: "userName avatar isOnline lastSeen",
    })
    .populate({
      path: "lastMessage",
      select: "content messageType sender status createdAt",
      populate: { path: "sender", select: "userName avatar" },
    })
    .sort({ "lastMessage.createdAt": -1 }) // most recent first
    .lean();

  //  Transform for frontend
  // const conversations = chatrooms.map((room) => {
  //   const otherParticipants = room.participants.filter(
  //     (p) => p._id.toString() !== userId,
  //   );

  //   return {
  //     roomId: room._id,
  //     participants: otherParticipants,
  //     isGroup: room.isGroup,
  //     groupName: room.groupName || null,
  //     lastMessage: room.lastMessage
  //       ? {
  //           content: room.lastMessage.content,
  //           messageType: room.lastMessage.messageType,
  //           sender: room.lastMessage.sender,
  //           status: room.lastMessage.status,
  //           createdAt: room.lastMessage.createdAt,
  //         }
  //       : null,
  //   };
  // });.

  const conversations = await Promise.all(
    chatrooms.map(async (room) => {
      const otherParticipants = room.participants.filter(
        (p) => p._id.toString() !== userId.toString(),
      );

      // unread messages count
      const unreadCount = await Message.countDocuments({
        roomId: room._id,
        receiver: userId,
        status: { $ne: "read" },
      });

      return {
        // roomId: room._id,
        roomId: room._id.toString(),
        participants: otherParticipants,
        isGroup: room.isGroup,
        groupName: room.groupName || null,
        unreadCount,

        lastMessage: room.lastMessage
          ? {
              _id: room.lastMessage._id,
              content: room.lastMessage.content,
              messageType: room.lastMessage.messageType,
              sender: room.lastMessage.sender,
              status: room.lastMessage.status,
              createdAt: room.lastMessage.createdAt,
            }
          : null,
      };
    }),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, conversations, "Conversations fetched successfully"),
    );
});

// get the messages of the particular user
const getMessages = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const userId = req.user.userId;

  if (!receiverId) {
    throw new ApiError(400, "receiverId is required");
  }

  //  Find chatroom between users
  const chatroom = await Chatroom.findOne({
    isGroup: false,
    participants: { $all: [userId, receiverId] },
  });

  if (!chatroom) {
    throw new ApiError(404, "Chat does not exist");
  }

  //  Fetch messages of that room
  const messages = await Message.find({ roomId: chatroom._id })
    .populate("sender", "userName avatar")
    .populate("receiver", "userName avatar")
    .sort({ createdAt: 1 }); // oldest → newest

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

const markAsRead = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;

  if (!roomId) {
    throw new ApiError(400, "roomId is required");
  }

  const result = await Message.updateMany(
    {
      roomId,
      receiver: userId,
      readBy: { $ne: userId }, // not already read
    },
    {
      $addToSet: { readBy: userId },
      $set: { status: "read" },
    },
  );

  // 🔌 SOCKET.IO PART
  const chatroom = await Chatroom.findById(roomId).select("participants");

  if (!chatroom) {
    throw new ApiError(404, "Chatroom not found");
  }

  // Notify OTHER user(s)
  if (req.io && req.socketUserMap) {
    for (const participantId of chatroom.participants) {
      if (participantId.toString() !== userId) {
        const socketId = req.socketUserMap.get(participantId.toString());

        if (socketId) {
          req.io.to(socketId).emit("messages_read", {
            roomId,
            readBy: userId,
          });
        }
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Messages marked as read"));
});

const deleteMsg = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, "Invalid message id");
  }

  const msg = await Message.findById(messageId);

  if (!msg) {
    throw new ApiError(404, "Message not found");
  }

  // only sender can delete
  if (msg.sender.toString() !== userId) {
    throw new ApiError(403, "You are not allowed to delete this message");
  }

  // find room
  const room = await Chatroom.findById(msg.roomId);

  // delete message
  await msg.deleteOne();

  // if deleted msg was room last message
  if (room?.lastMessage && room.lastMessage.toString() === messageId) {
    // get latest remaining message
    const previousMessage = await Message.findOne({
      roomId: msg.roomId,
    }).sort({ createdAt: -1 });

    // update last message
    room.lastMessage = previousMessage?._id || null;

    await room.save();
  }

  // 🔌 SOCKET.IO
  if (req.io && req.socketUserMap) {
    const receiverSocketId = req.socketUserMap.get(msg.receiver.toString());

    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("message_deleted", {
        messageId,
        roomId: msg.roomId,
        deletedBy: userId,
        lastMessage: room?.lastMessage || null,
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        lastMessage: room?.lastMessage || null,
      },
      "Message deleted successfully",
    ),
  );
});

export { messageSend, getMessages, markAsRead, deleteMsg, getConversation };
