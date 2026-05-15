import { Server } from "socket.io";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

// online users: userId -> socketId
const onlineUsers = new Map();

// typing users: userId -> { conversationId: boolean, timeout }
const typingUsers = new Map();

const inilizeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
      methods: ["GET", "PUT", "POST", "DELETE"],
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    let userId = null;

    /* ---------------- USER CONNECT ---------------- */
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;
        onlineUsers.set(userId, socket.id);

        socket.join(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // send all currently online users to newly connected user
        socket.emit("online_users", Array.from(onlineUsers.keys()));

        // notify everyone that this user came online
        io.emit("user_status", {
          userId,
          isOnline: true,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error("user_connected error:", err);
      }
    });

    /* ---------------- USER STATUS ---------------- */
    socket.on("get_user_status", async (requestedUserId, callback) => {
      try {
        const isOnline = onlineUsers.has(requestedUserId);

        if (isOnline) {
          return callback({
            userId: requestedUserId,
            isOnline: true,
            lastSeen: null,
          });
        }

        const user = await User.findById(requestedUserId).select("lastSeen");
        callback({
          userId: requestedUserId,
          isOnline: false,
          lastSeen: user?.lastSeen || null,
        });
      } catch (err) {
        console.error("get_user_status error:", err);
      }
    });

    socket.on("send_message", async (message) => {
      try {
        const receiverSocketId = onlineUsers.get(message.receiver._id);

        if (receiverSocketId) {
          await Message.findByIdAndUpdate(message._id, {
            status: "delivered",
          });

          io.to(receiverSocketId).emit("receive_message", {
            ...message,
            status: "delivered",
          });

          socket.emit("message_status", {
            messageId: message._id,
            status: "delivered",
          });
        } else {
          socket.emit("message_status", {
            messageId: message._id,
            status: "sent",
          });
        }
      } catch (err) {
        console.error("send_message error:", err);
      }
    });

    /* ---------------- MESSAGE READ ---------------- */
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { status: "read" } },
        );

        const senderSocketId = onlineUsers.get(senderId);

        if (senderSocketId) {
          messageIds.forEach((msgId) => {
            io.to(senderSocketId).emit("message_status_updated", {
              messageId: msgId,
              status: "read",
            });
          });
        }
      } catch (err) {
        console.error("message_read error:", err);
      }
    });

    /* ---------------- TYPING ---------------- */
    socket.on("typing", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingUsers.has(userId)) {
        typingUsers.set(userId, {});
      }

      const userTyping = typingUsers.get(userId);
      userTyping[conversationId] = true;

      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: true,
        });
      }
    });

    /* ---------------- TYPING STOP ---------------- */
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }
    });

    /* ---------------- DISCONNECT ---------------- */
    socket.on("disconnect", async () => {
      try {
        if (!userId) return;

        onlineUsers.delete(userId);

        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          // Object.values(userTyping).forEach((t) => clearTimeout(t));
          Object.keys(userTyping).forEach((key) => {
            if (key.includes("_timeout")) {
              clearTimeout(userTyping[key]);
            }
          });

          typingUsers.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log(`User disconnected: ${userId}`);
      } catch (err) {
        console.error("disconnect error:", err);
      }
    });
  });

  io.socketUserMap = onlineUsers;
  return io;
};

export default inilizeSocket;
