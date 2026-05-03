import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";
import { Socket } from "socket.io-client";

const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,

  // userId -> { isOnline, lastSeen }
  onlineUsers: new Map(),

  // conversationId -> Set(userIds)
  typingUsers: new Map(),

  /* ================= SOCKET LISTENERS ================= */
  initSocketListeners: () => {
    const socket = getSocket();

    if (!socket) return;

    /* ---------- clear old listeners ---------- */
    socket.off("receive_message");
    socket.off("message_status");
    socket.off("message_status_updated");
    socket.off("user_typing");
    socket.off("user_status");

    /* ================= RECEIVE MESSAGE ================= */
    socket.on("receive_message", (message) => {
      const { currentConversation } = get();

      // add message only if it belongs to open conversation
      // if (currentConversation?._id === message.roomId) {

      // currentConversation is always a full object now
      if (
        currentConversation?._id === message.roomId ||
        currentConversation === message.roomId
      ) {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      }

      // update lastMessage in conversations
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv._id === message.roomId
            ? { ...conv, lastMessage: message }
            : conv,
        ),
      }));
    });

    /* ================= MESSAGE STATUS (sent/delivered) = */
    socket.on("message_status", ({ messageId, status }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status } : msg,
        ),
      }));
    });

    /* ================= MESSAGE READ ================= */
    socket.on("message_status_updated", ({ messageId, status }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status } : msg,
        ),
      }));
    });

    // ==================DELETE MSG=======================
    socket.on("message_deleted", ({ deletedMessageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deletedMessageId),
      }));
    });

    // ======== HANDLING ANY ERROR WHILE SENDING MSG ========
    socket.on("message_error", (error) => {
      console.error("message error", error);
    });

    /* ================= TYPING INDICATOR ================= */
    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        const usersSet = typingUsers.get(conversationId) || new Set();

        if (isTyping) {
          usersSet.add(userId);
        } else {
          usersSet.delete(userId);
        }

        if (usersSet.size === 0) {
          typingUsers.delete(conversationId);
        } else {
          typingUsers.set(conversationId, usersSet);
        }

        return { typingUsers };
      });
    });

    /* ================= ONLINE / OFFLINE ================= */
    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const onlineUsers = new Map(state.onlineUsers);
        onlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers };
      });
    });

    // ==============EMIT STATUS CHECK FOR ALL USERS IN CONVERSTATIONS LIST ===========
    const { conversations } = get();
    if (conversations?.data?.length > 0) {
      conversations.data.forEach((conv) => {
        const otherUsers = conv.participants.find((p) => {
          p._id !== get().currentUser._id;
        });
        if (otherUsers._id) {
          socket.emit("get_user_status", otherUsers._id, (status) => {
            set((set) => {
              const newOnlineUser = new Map(state.onlineUsers);
              newOnlineUser.set(
                set(state.userId, {
                  isOnline: state.isOnline,
                  lastSeen: state.lastSeen,
                }),
              );
              return { onlineUsers: newOnlineUser };
            });
          });
        }
      });
    }
  },

  setCurrenctUser: (user) => {
    set({ currentUser: user });
  },

  // =================== SET INFORMATATION TO THE STATES ======

  // FETCH CONVERTATION

  fetchConvertation: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/auth/get-users");
      set({ conversations: data, loading: false });
      get().initSocketListeners();
      return data;
    } catch (error) {
      set({
        error: error.response ? error.response.data : error.message,
        loading: false,
      });
      return null;
    }
  },

  // FETCH MESSAGE FOR A CONVERTATION
  fetchMessage: async (receiverId) => {
    if (!receiverId) {
      return;
    }
    set({ loading: true, error: null });

    try {
      const { data } = await axiosInstance.get(
        `message/get-messages/${receiverId}`,
      );
      const messageArray = data.data || [];
      set({
        messages: messageArray,

        // currentConversation: conversationId,
        // store the full conversation object so _id comparison works in socket listener
        currentConversation: { _id: data.data[0]?.roomId },
        loading: false,
      });

      //mark as read message
      // const { MarkMsgsAsRead } = get();
      // MarkMsgsAsRead();
      // return messageArray;
    } catch (error) {
      set({
        error: error.response ? error.response.data : error.message,
        loading: false,
      });
      return [];
    }
  },

  // send message in real time
  sendMessage: async (formData) => {
    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");

    const socket = getSocket();
    const { conversations } = get();

    let conversationId = null;

    if (conversations?.data?.length > 0) {
      const conversation = conversations.data.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId) &&
          conv.participants.some((p) => p._id === receiverId),
      );

      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }

    //  Optimistic message
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
      conversation: conversationId,
      imageOrVideoUrl:
        media && typeof media !== "string" ? URL.createObjectURL(media) : null,
      content: content,
      contentType: media
        ? media.type.startsWith("image")
          ? "image"
          : "video"
        : "text",
      createdAt: new Date().toISOString(),
      messageStatus,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await axiosInstance.post("/api", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const messageData = data.data || data;

      // Replace temp message
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? messageData : msg,
        ),
      }));

      return messageData;
    } catch (error) {
      console.log("Error sending message", error);

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg,
        ),
      }));

      throw error;
    }
  },

  // reseive message

  // receiveMessage is now handled entirely inside initSocketListeners
  // via the "receive_message" socket event — no separate action needed

  // receiveMessage: async (message) => {
  //   if (!message) return;
  //   // where do i get current user form
  //   const { currentConversation, currentUser, messages } = get();
  //   const messageExist = message.some((msg) => msg._id === message._id);
  //   if (messageExist) return;
  // },

  // ============= MARK AS READ ================
  MarkMsgsAsRead: async () => {
    const { messages, currentUser } = get();
    if ((!messages.length, !currentUser)) {
      return;
    }
    const unreadIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== "read" && msg.receiver._id === currentUser._id,
      )
      .map((msg) => msg._id)
      .filter(Boolean);
    if (unreadIds.length === 0) {
      return;
    }
    try {
      const { data } = await axiosInstance.put("/api", {
        messageId: unreadIds,
      });
      set((state) => ({
        messages: state.messages.map((msg) => {
          unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg;
        }),
      }));
      const socket = getSocket();
      if (socket) {
        socket.emit("message_read", {
          messageId: unreadIds,
          senderId: messages[0]?.sender?._id,
        });
      }
    } catch (error) {
      console.error("failed to mark messages as read", error);
    }
  },

  // ==================DELETE MESG====================
  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete("/api");
      set((state) => {
        messages: state.messages?.filter((msg) => {
          msg?._id !== messageId;
        });
      });
      return true;
    } catch (error) {
      console.error("error deleting message", error);
      set({ error: error.response?.data?.message || error.message });
      return false;
    }
  },

  // ===========TYPING START===================
  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("Typing_Start", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  // ========== STOP TYPING =========
  stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit(" typing_stop", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  // ========IS USER TYPING =============
  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    ) {
      return false;
    }
    return typingUsers.get(currentConversation).has(userId);
  },

  // ======= is user online ========
  isUserOnline: (userId) => {
    if (!userId) {
      return null;
    }
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastseen: (userId) => {
    if (!userId) {
      return null;
    }
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastSeen || null;
  },

  // ======clean up function======

  cleanup: () => {
    set({
      currentConversation: null,
      conversations: [],
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },

  /* ================= HELPERS ================= */
  //   setCurrentConversation: (conversation) =>
  //     set({ currentConversation: conversation, messages: [] }),

  //   addConversation: (conversation) =>
  //     set((state) => ({
  //       conversations: [...state.conversations, conversation],
  //     })),

  //   clearChat: () =>
  //     set({
  //       currentConversation: null,
  //       messages: [],
  //       typingUsers: new Map(),
  //     }),
}));

export default useChatStore;
