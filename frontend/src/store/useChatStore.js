import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";
import { Socket } from "socket.io-client";
import { getConversation } from "../services/user.service";
import useLayoutStore from "./useLayoutStore";
import useUserStore from "./useUserStore";

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

    socket.on("online_users", (users) => {
      set((state) => {
        const onlineUsers = new Map(state.onlineUsers);

        users.forEach((userId) => {
          onlineUsers.set(userId, {
            isOnline: true,
            lastSeen: null,
          });
        });

        return { onlineUsers };
      });
    });

    /* ================= RECEIVE MESSAGE ================= */

    socket.on("receive_message", (message) => {
      const { currentConversation, currentUser } = get();

      // add message to UI
      if (currentConversation === message.roomId) {
        set((state) => ({
          messages: [...state.messages, message],
        }));

        // instantly mark as read
        if (message.receiver?._id === currentUser?._id) {
          const socket = getSocket();

          // update local state immediately
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg._id === message._id ? { ...msg, status: "read" } : msg,
            ),
          }));

          // notify sender
          socket.emit("message_read", {
            messageIds: [message._id],
            senderId: message.sender?._id,
          });
        }
      }

      // update conversation last message
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.roomId === message.roomId
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

    socket.on("message_deleted", ({ messageId, roomId, lastMessage }) => {
      set((state) => {
        const updatedMessages = state.messages.filter(
          (msg) => msg._id !== messageId,
        );

        const updatedConversations = state.conversations.map((conv) =>
          conv._id === roomId
            ? {
                ...conv,
                lastMessage,
              }
            : conv,
        );

        return {
          messages: updatedMessages,
          conversations: updatedConversations,
        };
      });
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
        console.log(onlineUsers);
        return { onlineUsers };
      });
    });

    // ==============EMIT STATUS CHECK FOR ALL USERS IN CONVERSTATIONS LIST ===========
    const { conversations } = get();
    if (conversations?.length > 0) {
      conversations.forEach((conv) => {
        const otherUsers = conv.participants.find(
          (p) => p._id !== get().currentUser._id,
        );
        if (otherUsers._id) {
          socket.emit("get_user_status", otherUsers._id, (status) => {
            set((state) => {
              const newOnlineUser = new Map(state.onlineUsers);

              newOnlineUser.set(status.userId, {
                isOnline: status.isOnline,
                lastSeen: status.lastSeen,
              });

              return {
                onlineUsers: newOnlineUser,
              };
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

  getConversations: async () => {
    set({ loading: true, error: null });
    try {
      const result = await getConversation();
      if (result?.statuscode === 200) {
        set({ conversations: result.data || [], loading: false });
      }
      return result.data;
    } catch (error) {
      set({
        error: error.response ? error.response.data : error.message,
        loading: false,
      });
      return null;
    }
  },

  // FETCH MESSAGE FOR A CONVERTATION
  fetchMessage: async (receiverId, roomId) => {
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
        currentConversation: roomId,
        loading: false,
      });

      await get().MarkMsgsAsRead();
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
    const { user } = useUserStore.getState();
    const senderId = user?._id;

    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const status = formData.get("messageStatus");

    const { conversations } = get();

    let roomId = null;

    //  Find existing conversation
    if (conversations?.length > 0) {
      const conversation = conversations.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId) &&
          conv.participants.some((p) => p._id === receiverId),
      );

      if (conversation) {
        roomId = conversation._id;
      }
    }

    // set current conversation AFTER finding
    if (roomId) {
      set({ currentConversation: roomId });
    }

    // Optimistic message
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
      roomId,
      imageOrVideoUrl:
        media && typeof media !== "string" ? URL.createObjectURL(media) : null,
      content,
      messageType: media
        ? media.type.startsWith("image")
          ? "image"
          : "video"
        : "text",
      createdAt: new Date().toISOString(),
      status: "sent",
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await axiosInstance.post("message/send-msg", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const messageData = data.data;
      // EMIT SOCKET EVENT
      const socket = getSocket();

      if (socket) {
        socket.emit("send_message", messageData);
      }

      // Replace temp message
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? messageData : msg,
        ),
      }));
      return messageData;
    } catch (error) {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, status: "failed" } : msg,
        ),
      }));

      throw error;
    }
  },
  MarkMsgsAsRead: async () => {
    const { messages, currentUser } = get();

    if (!messages.length || !currentUser) {
      return;
    }

    const unreadIds = messages
      .filter(
        (msg) => msg.status !== "read" && msg.receiver?._id === currentUser._id,
      )
      .map((msg) => msg._id);

    if (unreadIds.length === 0) {
      return;
    }

    try {
      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, status: "read" } : msg,
        ),
      }));

      const socket = getSocket();

      if (socket) {
        socket.emit("message_read", {
          messageIds: unreadIds,
          senderId: messages[0]?.sender?._id,
        });
      }
    } catch (error) {
      console.error("failed to mark messages as read", error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/message/delete-message/${messageId}`);

      set((state) => ({
        messages: state.messages?.filter((msg) => msg?._id !== messageId),
      }));

      const response = await axiosInstance.delete(
        `/message/delete-message/${messageId}`,
      );
      return true;
    } catch (error) {
      console.error("error deleting message", error);

      set({
        error: error.response?.data?.message || error.message,
      });

      return false;
    }
  },

  // ===========TYPING START===================
  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing", {
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
      socket.emit("typing_stop", {
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
}));

export default useChatStore;
