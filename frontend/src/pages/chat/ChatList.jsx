import { useState } from "react";
import useLayoutStore from "../../store/useLayoutStore";
import useThemeStore from "../../store/useThemeStore";
import useThemeStore from "../store/useThemeStore";
import { FaSearch } from "react-icons/fa";

const ChatList = ({ constacts }) => {
  const setSelectedContet = useLayoutStore((state) => state.selectedContet);
  const selectedContet = useLayoutStore((state) => state.selectedContet);
  const { theme } = useThemeStore();
  const { user } = useThemeStore();
  const [searchTerms, setSearchTerms] = useState();
  const filteredContacts = constacts?.filter((contact) =>
    contact?.username?.toLowerCase().includes(searchTerms.toLowerCase()),
  );

  console.log(filteredContacts);

  return (
    <div
      className={`w-full border-r h-screen ${
        theme === "dark"
          ? "bg-[rgb[17,27,33]] border-gray-600"
          : "bg-white border-gray-200"
      }`}
    >
      <div
        className={`p-4 flex justify-between ${theme === "dark" ? "text-white" : "text-gray-800"}`}
      >
        <h2 className="text-xl font-semibold"> Chats</h2>
        <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"></button>
      </div>
      <div className="relative">
        <div className="p-2">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-800"}`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus: bg-green-500 ${theme === "dark" ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500" : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"}`}
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-[clac(100vh -20px)]">
        {filteredContacts.map((contact) => (
          <motion.div
            key={contact._id}
            onClick={() => setSelectedContet(contact)}
            className={`p-3 flex items-center cursor-pointer ${theme === "dark" ? (selectedContet?._id === contact._id ? "bg-gray-700 " : "hover:bg-gray-800") : selectedContet?._id === contact?._id ? "bg-gray-200" : "hover:bg-gray-100"}`}
          >
            <img
              src={`contact.avatar`}
              alt={`contact.username`}
              className="w-full h-full  rounded-full"
            />
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-baseline">
                <h2
                  className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                  {contact.username}
                </h2>
                {contact?.converstaion && (
                  <span
                    className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {/* need to find out that these fileds are exists or not  */}
                    {formatTimeStamp(
                      contact?.converstaion?.lastMessage?.createdAt,
                    )}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-baseline">
                <p
                  className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"} truncate`}
                >
                  {contact?.converstaion?.lastMessage?.content}
                </p>
                <p
                  className={`text-sm font-semibold w-6 h-6 flex items-center justify-center bg-green-500  ${theme === "dark" ? "text-gray-800" : "text-gray-500"}  rounded-full truncate`}
                >
                  {contact?.converstaion &&
                    contact?.converstaion.unreadCount > 0 &&
                    constact?.converstaion?.lastMessage.receiver ===
                      user._id && <p>{contact?.converstaion?.unreadCount}</p>}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
