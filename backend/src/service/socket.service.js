// import { Server } from "socket.io";
// import { User } from "../models/user.model.js";
// import { Message } from "../models/message.model.js";

// // map to store online users => userId ,socketId
// const onlineUsers = new Map();

// // map to store typing status users => userId, convesation
// const typingUsers = new Map();

// const inilizeSocket = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       credentials: true,
//       methods: ["GET", "PUT", "POST", "DELETE"],
//     },
//     pingTimeout: 60000, //disconnect sockets after 60 sec. after offline
//   });

//   //   socket connection stablish

//   io.on("connection", (socket) => {
//     console.log("socket connection ");
//     let userId = null;

//     // mark user is connected and show online
//     socket.on("user_connected", async (connectingUserId) => {
//       try {
//         userId = connectingUserId;
//         onlineUsers.set(userId, socket.id); //here storing the socketId to the correspoing userId(get form the frontend) in the map
//         socket.join(userId);

//         // update in db online
//         await User.findByIdAndUpdate(userId, {
//           isOnline: true,
//           lastSeen: new Date(),
//         });

//         // notify to the frontend this user is online
//         io.emit("user_status", { userId, isOnline: true });
//       } catch (error) {
//         console.log("Error handling user connection :", error);
//       }
//     });

//     // return online status of requested user
//     socket.on("get_user_status", async (requestedUserId, callback) => {
//       const isOnline = onlineUsers.has(requestedUserId);

//       if (isOnline) {
//         callback({
//           userId: requestedUserId,
//           isOnline: true,
//           lastSeen: null,
//         });
//       } else {
//         const user = await User.findById(requestedUserId).select("lastSeen");
//         callback({
//           userId: requestedUserId,
//           isOnline: false,
//           lastSeen: user?.lastSeen || null,
//         });
//       }
//     });

//     // forward messages to receiver if online
//     socket.on("send_message", (message) => {
//       const receiverSocketId = onlineUsers.get(message.receiver._id);

//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("receive_message", message);
//         socket.emit("message_status", {
//           messageId: message._id,
//           status: "delivered",
//         });
//       } else {
//         socket.emit("message_status", {
//           messageId: message._id,
//           status: "sent",
//         });
//       }
//     });

//     // update messagse as read and notify sender
//     socket.on("message_read", async ({ messageIds, senderId }) => {
//       await Message.updateMany(
//         { _id: { $in: messageIds } },
//         { $set: { status: "read" } },
//       );
//       const senderScoketId = onlineUsers.get({ senderId });
//       if (senderScoketId) {
//         messageIds.forEach((msgId) => {
//           io.to(senderScoketId).emit("message_status_updated", {
//             msgId,
//             status: "read",
//           });
//         });
//       }
//     });

//     // handle typing status
//     socket.on("typing", ({ conversationId, receiverId }) => {
//       if (!userId || !conversationId || !receiverId) return;

//       if (!typingUsers.has(userId)) {
//         typingUsers.set(userId, {});
//       }

//       const userTyping = typingUsers.get(userId);
//       userTyping[conversationId] = true;

//       // clear previous timeout
//       if (userTyping[`${conversationId}_timeout`]) {
//         clearTimeout(userTyping[`${conversationId}_timeout`]);
//       }

//       // auto stop after 3 seconds
//       userTyping[`${conversationId}_timeout`] = setTimeout(() => {
//         userTyping[conversationId] = false;
//         socket.to(receiverId).emit("user_typing", {
//           userId,
//           conversationId,
//           isTyping: false,
//         });
//       }, 3000);

//       socket.to(receiverId).emit("user_typing", {
//         userId,
//         conversationId,
//         isTyping: true,
//       });
//     });

//     // manually to stop the typing
//     socket.on("typing_stop", ({ conversationId, receiverId }) => {
//       if (!userId || !conversationId || !receiverId) {
//         return;
//       }
//       if (typingUsers.has(userId)) {
//         const userTyping = typingUsers.get(userId);
//         userTyping[conversationId] = false;
//         if (userTyping[`${converstationId}_timeout`]) {
//           clearTimeout(userTyping[`${converstationId}_timeout`]);
//           delete userTyping[`${converstationId}_timeout`];
//         }
//       }

//       socket
//         .to(receiverId)
//         .emit("user_typing", { userId, conversationId, isTyping: false });
//     });
//     // handle disconnect
//     const handleDissconnect = async () => {
//       if (!userId) return;

//       onlineUsers.delete(userId);
//       // clear all typing time outs
//       if (typingUsers.has(userId)) {
//         const userTyping = typingUsers.get(userId);
//         Object.keys(userTyping).forEach((key) => {
//           if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
//         });
//         typingUsers.delete(userId);
//       }
//       await User.findByIdAndUpdate(userId, {
//         isOnline: false,
//         lastSeen: new Date(),
//       });
//       io.emit("user_status", { userId, isOnline: false, lastSeen: new Date() });

//       socket.leave(userId);
//       console.log(`user ${userId} disconnected `);
//     };
//     // disconnect event
//     socket.on("disconnect", handleDissconnect);
//   });

//   // attach the online user map to the socket server for external use
//   io.socketUserMap = onlineUsers;
//   return io;
// };

// export { inilizeSocket };

import { Server } from "socket.io";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

// online users: userId -> socketId
const onlineUsers = new Map();

// typing users: userId -> { conversationId: boolean, timeout }
const typingUsers = new Map();

const initializeSocket = (server) => {
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

        io.emit("user_status", { userId, isOnline: true });
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

    /* ---------------- SEND MESSAGE ---------------- */
    socket.on("send_message", async (message) => {
      try {
        const receiverSocketId = onlineUsers.get(message.receiver._id);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);

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

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
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

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    /* ---------------- DISCONNECT ---------------- */
    socket.on("disconnect", async () => {
      try {
        if (!userId) return;

        onlineUsers.delete(userId);

        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.values(userTyping).forEach((t) => clearTimeout(t));
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

export { initializeSocket };
