import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import useLayoutStore from "../../store/useLayoutStore";
import useThemeStore from "../../store/useThemeStore";
import useUserStore from "../../store/useUserStore";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import useChatStore from "../../store/useChatStore";

const ChatList = ({ contacts = [] }) => {
  const { setSelectedContact, selectedContact } = useLayoutStore();

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const [searchTerm, setSearchTerm] = useState("");

  // ===== FORMAT TIME SAFELY =====
  const formatTime = (time) => {
    if (!time) return "";

    const date = new Date(time);

    if (isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ===== FILTER CONTACTS =====
  const filteredContacts = contacts.filter((contact) => {
    const otherUser = contact.participants?.find(
      (p) => p._id.toString() !== user?._id.toString(),
    );

    if (!otherUser) return false;

    return otherUser.userName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div
      className={`h-screen border-r ${
        theme === "dark"
          ? "bg-[#111b21] border-gray-700 text-white"
          : "bg-white border-gray-300 text-black"
      }`}
    >
      {/* ===== HEADER ===== */}
      <div className="p-4 font-semibold text-2xl">Chats</div>

      {/* ===== SEARCH ===== */}
      <div className="relative p-3">
        <FaSearch
          className={`absolute left-6 top-1/2 -translate-y-1/2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        />

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search or start new chat"
          className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none
            ${
              theme === "dark"
                ? "bg-[#202c33] text-white placeholder-gray-400 focus:ring-green-500"
                : "bg-gray-100 text-black placeholder-gray-500 focus:ring-green-500"
            }
            focus:ring-2`}
        />
      </div>

      {/* ===== CHAT LIST ===== */}
      <div className="overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">No chats found</div>
        ) : (
          filteredContacts.map((chat) => {
            const otherUser = chat.participants?.find(
              (p) => p._id.toString() !== user?._id.toString(),
            );

            const lastMessage = chat.lastMessage;

            const isUserMessage =
              lastMessage?.sender?._id?.toString() === user?._id?.toString();

            if (!otherUser) return null;

            return (
              <motion.div
                key={chat.roomId}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedContact(chat)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all
                  ${
                    selectedContact?.roomId === chat.roomId
                      ? theme === "dark"
                        ? "bg-[#2a3942]"
                        : "bg-gray-200"
                      : theme === "dark"
                        ? "hover:bg-[#202c33]"
                        : "hover:bg-gray-100"
                  }
                `}
              >
                {/* ===== AVATAR ===== */}
                <img
                  src={otherUser.avatar}
                  alt={otherUser.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />

                {/* ===== MESSAGE INFO ===== */}
                <div className="flex-1 min-w-0">
                  {/* TOP */}
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold truncate">
                      {otherUser.userName}
                    </h2>

                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {chat.lastMessage?.createdAt
                        ? formatTime(chat.lastMessage.createdAt)
                        : ""}
                    </span>
                  </div>

                  {/* BOTTOM */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1 min-w-0">
                      {isUserMessage && (
                        <>
                          {lastMessage?.status === "sent" && (
                            <FaCheck size={12} />
                          )}

                          {lastMessage?.status === "delivered" && (
                            <FaCheckDouble size={12} />
                          )}

                          {lastMessage?.status === "read" && (
                            <FaCheckDouble
                              size={12}
                              className="text-blue-500"
                            />
                          )}
                        </>
                      )}

                      <p
                        className={`text-sm truncate max-w-45 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {lastMessage?.content || "No messages yet"}
                      </p>
                    </div>

                    {/* ===== UNREAD COUNT ===== */}
                    {chat.unreadCount > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
