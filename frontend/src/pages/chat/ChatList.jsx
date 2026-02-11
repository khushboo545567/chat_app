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
    c.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
          className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none
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
            className={`p-3 cursor-pointer ${
              selectedContact?._id === contact._id
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
          >
            <div className="font-semibold">{contact.username}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
