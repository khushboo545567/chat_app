import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import useLayoutStore from "../../store/useLayoutStore";
import useThemeStore from "../../store/useThemeStore";
import useUserStore from "../../store/useUserStore";

const ChatList = ({ contacts }) => {
  const { setSelectedContact, selectedContact } = useLayoutStore();
  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = contacts.filter((c) =>
    c.userName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="h-screen border-r border-gray-400">
      <div className="p-4 font-semibold text-xl">Chats</div>

      <div className="relative p-2">
        <FaSearch
          className={`absolute left-4 top-1/2 -translate-y-1/2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        />

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search or start new chat"
          className={`w-full pl-10 pr-4 py-2 pb-4 rounded-lg text-sm outline-none
            ${
              theme === "dark"
                ? "bg-gray-800 text-white placeholder-gray-400 focus:ring-green-400"
                : "bg-gray-100 text-black placeholder-gray-500 focus:ring-green-500"
            }
            focus:ring-2
          `}
        />
      </div>

      <div className="overflow-y-auto">
        {filteredContacts.map((contact) => (
          <motion.div
            key={contact._id}
            onClick={() => setSelectedContact(contact)}
            className={`p-3 cursor-pointer flex items-center gap-3 ${
              selectedContact?._id === contact._id
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
          >
            {/* Avatar */}
            <img
              src={contact.avatar}
              alt={contact.userName}
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* Name & Status */}
            <div className="flex-1">
              <div className="font-semibold">{contact.userName}</div>
              <div className="flex items-center justify-between">
                {/* Last message OR Online/Offline */}
                <div className="text-xs text-gray-500 truncate max-w-40">
                  {contact.lastMessage
                    ? contact.lastMessage
                    : contact.isOnline
                      ? "Online"
                      : "Offline"}
                </div>

                {/* Unread count (future-ready) */}
                {contact.unreadCount > 0 && (
                  <div className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {contact.unreadCount}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {contacts.map((userList) => {
        const userr = userList.participants.find(
          (u) => u._id.toString() !== user._id.toString(),
        );

        if (!userr) return null;

        return (
          <div
            className=" px-6 flex gap-6 items-center cursor-pointer rounded-2xl"
            onClick={() => setSelectedContact(userList)}
            key={userList.roomId}
          >
            <div>
              <img
                src={userr.avatar}
                alt="user photo"
                className="rounded-full w-12 h-12"
              />
            </div>
            <div className="w-full">
              <div className="flex justify-between">
                <span className="font-semibold">{userr.userName}</span>
                <span className="text-sm text-gray-600 truncate ">
                  {formatTime(userList.lastMessage?.time)}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-sm text-gray-600 truncate ">
                  {userList.lastMessage?.content}
                </span>
                <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                  {0}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
