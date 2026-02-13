import { create } from "zustand";
import { getSocket } from "../services/chat.service";

export const useChatStore = create((set, get) => ({
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
      if (currentConversation?._id === message.roomId) {
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
  },

  /* ================= HELPERS ================= */
  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation, messages: [] }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [...state.conversations, conversation],
    })),

  clearChat: () =>
    set({
      currentConversation: null,
      messages: [],
      typingUsers: new Map(),
    }),
}));
