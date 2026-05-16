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
  currentUser: null,

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
      const { currentConversation } = get();
      const currentUser = useUserStore.getState().user;
      // add message to UI
      if (currentConversation === message.roomId) {
        set((state) => ({
          messages: [...state.messages, message],
        }));

        // instantly mark as read
        if (
          message.receiver?._id === currentUser?._id &&
          currentConversation === message.roomId
        ) {
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
      set((state) => {
        const updatedConversations = state.conversations.map((conv) =>
          conv.roomId === message.roomId
            ? {
                ...conv,
                lastMessage: {
                  ...message,
                  createdAt: message.createdAt || new Date().toISOString(),
                },
              }
            : conv,
        );

        // latest chat on top
        updatedConversations.sort(
          (a, b) =>
            new Date(b.lastMessage?.createdAt || 0) -
            new Date(a.lastMessage?.createdAt || 0),
        );

        return {
          conversations: updatedConversations,
        };
      });
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
          msg._id === messageId || msg.tempId === messageId
            ? { ...msg, status }
            : msg,
        ),

        conversations: state.conversations.map((conv) => {
          if (
            conv.lastMessage?._id === messageId ||
            conv.lastMessage?.tempId === messageId
          ) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                status,
              },
            };
          }

          return conv;
        }),
      }));
    });

    // socket.on("message_deleted", ({ messageId, roomId, lastMessage }) => {
    //   set((state) => {
    //     const updatedMessages = state.messages.filter(
    //       (msg) => msg._id !== messageId,
    //     );

    //     const updatedConversations = state.conversations.map((conv) =>
    //       conv._id === roomId
    //         ? {
    //             ...conv,
    //             lastMessage,
    //           }
    //         : conv,
    //     );

    //     return {
    //       messages: updatedMessages,
    //       conversations: updatedConversations,
    //     };
    //   });
    // });

    // ======== HANDLING ANY ERROR WHILE SENDING MSG ========

    socket.on("message_deleted", ({ messageId, roomId, lastMessage }) => {
      set((state) => {
        const updatedMessages = state.messages.filter(
          (msg) => msg._id !== messageId,
        );

        const updatedConversations = state.conversations.map((conv) =>
          conv.roomId === roomId
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

      requestAnimationFrame(() => {
        get().MarkMsgsAsRead();
      });
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
    console.log(conversations);
    let roomId = null;

    //  Find existing conversation
    if (conversations?.length > 0) {
      const conversation = conversations.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId) &&
          conv.participants.some((p) => p._id === receiverId),
      );

      if (conversation) {
        // roomId = conversation._id;
        roomId = conversation.roomId;
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
      tempId,
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

    set((state) => {
      const updatedConversations = state.conversations.map((conv) =>
        conv.roomId === roomId
          ? {
              ...conv,
              lastMessage: optimisticMessage,
            }
          : conv,
      );

      updatedConversations.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || 0) -
          new Date(a.lastMessage?.createdAt || 0),
      );

      return {
        messages: [...state.messages, optimisticMessage],
        conversations: updatedConversations,
      };
    });

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
      set((state) => {
        const updatedConversations = state.conversations.map((conv) => {
          if (conv.roomId === roomId) {
            return {
              ...conv,
              lastMessage:
                conv.lastMessage?._id === tempId
                  ? messageData
                  : conv.lastMessage,
            };
          }

          return conv;
        });

        return {
          messages: state.messages.map((msg) =>
            msg._id === tempId ? messageData : msg,
          ),
          conversations: updatedConversations,
        };
      });

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
    const { messages, currentUser, currentConversation } = get();

    if (!messages.length || !currentUser || !currentConversation) {
      return;
    }

    const unreadMessages = messages.filter(
      (msg) =>
        msg.status !== "read" &&
        msg.receiver?._id === currentUser._id &&
        msg.roomId === currentConversation,
    );

    if (unreadMessages.length === 0) {
      return;
    }

    const unreadIds = unreadMessages.map((msg) => msg._id);

    try {
      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, status: "read" } : msg,
        ),
      }));

      const socket = getSocket();

      if (socket) {
        // get actual sender from unread msgs
        const senderId = unreadMessages[0]?.sender?._id;

        socket.emit("message_read", {
          messageIds: unreadIds,
          senderId,
        });
      }
    } catch (error) {
      console.error("failed to mark messages as read", error);
    }
  },

  // deleteMessage: async (messageId) => {
  //   try {
  //     set((state) => ({
  //       messages: state.messages?.filter((msg) => msg?._id !== messageId),
  //     }));

  //     const response = await axiosInstance.delete(
  //       `/message/delete-message/${messageId}`,
  //     );
  //     return true;
  //   } catch (error) {
  //     console.error("error deleting message", error);

  //     set({
  //       error: error.response?.data?.message || error.message,
  //     });

  //     return false;
  //   }
  // },

  // ===========TYPING START===================

  deleteMessage: async (messageId) => {
    try {
      const { messages, conversations } = get();

      const messageToDelete = messages.find((msg) => msg._id === messageId);

      if (!messageToDelete) return false;

      // optimistic UI update
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));

      const response = await axiosInstance.delete(
        `/message/delete-message/${messageId}`,
      );

      const socket = getSocket();

      if (socket) {
        socket.emit("delete_message", {
          messageId,
          roomId: messageToDelete.roomId,
          receiverId: messageToDelete.receiver?._id,
        });
      }

      return true;
    } catch (error) {
      console.error("error deleting message", error);

      set({
        error: error.response?.data?.message || error.message,
      });

      return false;
    }
  },

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
