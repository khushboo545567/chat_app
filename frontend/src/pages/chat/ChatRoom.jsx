import React, { isValidElement, useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/useThemeStore";
import useUserStore from "../../store/useUserStore";
import useChatStore from "../../store/useChatStore.js";
import useLayoutStore from "../../store/useLayoutStore";
import { isToday, isYesterday, format, isValid } from "date-fns";
import MessageBubble from "./MessageBubble.jsx";
import {
  FaArrowLeft,
  FaVideo,
  FaEllipsisV,
  FaSmile,
  FaPaperclip,
  FaFile,
  FaPaperPlane,
  FaTimes,
  FaImage,
} from "react-icons/fa";

const isValidateDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const ChatRoom = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showFileMenu, setFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimerOutRef = useRef(null);
  const messageScroll = useRef(null);
  const fileInputRef = useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const {
    messages,
    loading,
    fetchConvertation,
    fetchMessage,
    sendMessage,
    startTyping,
    stopTyping,
    isUserTyping,
    isUserOnline,
    getUserLastseen,
    cleanup,
    deleteMessage,
    conversations,
  } = useChatStore();

  // GET ONLINE STATUS AND LAST SEEN ===========
  const receiver =
    selectedContact?.participants?.find((p) => p._id !== user?._id) || null;

  const online = isUserOnline(receiver?._id);
  const lastseen = getUserLastseen(receiver?._id);
  const isTyping = isUserTyping(receiver?._id);

  useEffect(() => {
    if (selectedContact?.roomId) {
      const receiver = selectedContact.participants.find(
        (r) => r._id !== user._id,
      );

      fetchMessage(receiver._id, selectedContact.roomId);
    }
  }, [selectedContact]);

  // automatically scroll when user chat or message
  const scrollToBottom = () => {
    messageScroll.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // useEffect(() => {
  //   if (message && selectedContact) {
  //     startTyping(receiver?._id);
  //     if (typingTimerOutRef.current) {
  //       clearTimeout(typingTimerOutRef.current);
  //     }
  //     typingTimerOutRef.current = setTimeout(() => {
  //       stopTyping(receiver?._id);
  //     }, 2000);
  //   }
  //   return () => {
  //     if (typingTimerOutRef.current) {
  //       clearTimeout(typingTimerOutRef.current);
  //     }
  //   };
  // }, [message, selectedContact, startTyping, stopTyping]);

  useEffect(() => {
    if (!selectedContact || !message.trim()) return;

    startTyping(receiver?._id);

    if (typingTimerOutRef.current) {
      clearTimeout(typingTimerOutRef.current);
    }

    typingTimerOutRef.current = setTimeout(() => {
      stopTyping(receiver?._id);
    }, 2000);

    return () => clearTimeout(typingTimerOutRef.current);
  }, [message]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileMenu(false);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  // send message
  const handleSendMessage = async () => {
    if (!selectedContact) return;
    setFilePreview(null);

    try {
      const formData = new FormData();
      formData.append("roomId", selectedContact.roomId);
      formData.append("receiverId", receiver?._id);
      // const status = online ? "delivered" : "sent";
      // formData.append("messageStatus", status);
      if (message.trim()) {
        formData.append("content", message.trim());
      }

      // accept file if there is any
      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name);
      }
      if (!message.trim() && !selectedFile) return;
      const resutt = await sendMessage(formData);

      // stop typing indicator
      stopTyping(receiver?._id);
      setMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      setFileMenu(false);
    } catch (error) {
      console.error("failed to send message", error);
    }
  };

  const renderDateSeparator = (date) => {
    const dateObj = new Date(date);

    if (isNaN(dateObj)) return null;

    let label;

    if (isToday(dateObj)) {
      label = "Today";
    } else if (isYesterday(dateObj)) {
      label = "Yesterday";
    } else {
      label = format(dateObj, "EEEE, MMMM d");
    }

    return (
      <div className="justify-center my-4 flex">
        <span
          className={`px-4 py-2 rounded-full text-sm ${
            theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-white text-black"
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  // grouping message date wise
  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, message) => {
        if (!message.createdAt) return acc;

        const date = new Date(message.createdAt);

        if (!isValid(date)) return acc;

        const dateKey = format(date, "yyyy-MM-dd");

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }

        acc[dateKey].push(message);

        return acc;
      }, {})
    : {};

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
        <div className="max-w-md ">
          {/* <img src={whatsappImage} alt="chat-app" className=""w-full h-auto/> */}
          <h2 className={`text-3xl font-semibold mb-4`}>
            select a conversation to start chating.
          </h2>
          <p className="mb-6">
            Choose a contact from the list on the left to began messaging
          </p>
          <p className="text-sm mt-8 flex items-center justify-center">
            YOur personal messages are end-to-end encrypted
          </p>
          {/* inside src ther is image folder import the whatshap from there */}
        </div>
      </div>
    );
  }

  // when the contact is selected
  return (
    <div className="flex-1 h-screen w-full flex flex-col">
      <div
        className={`p-4 ${theme === "dark" ? "bg-[#303430] text-white" : "bg-[rgb(239,242,245)] text-gray-600"} flex items-center`}
      >
        <button
          className="mr-2 focus:outline"
          onClick={() => setSelectedContact(null)}
        >
          <FaArrowLeft className="" />
        </button>
        <img
          src={receiver?.avatar}
          alt={receiver?.userName}
          className="w-10 h-10 rounded-full"
        />

        <div className="ml-3 flex flex-col grow">
          <h2 className="font-semibold">
            {receiver?.userName || "Loading..."}
          </h2>

          {isTyping ? (
            <div className="text-sm">Typing...</div>
          ) : (
            <p
              className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              {/* check is user online */}
              {/* {isUserOnline */}
              {online
                ? "Online"
                : lastseen
                  ? `last seen ${format(new Date(lastseen), "HH:mm")}`
                  : "Offline"}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button className="focus:outline-none ">
            <FaVideo className="h-5 w-5" />
          </button>
          <button className="focus:outline-none">
            <FaEllipsisV className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className={`flex-1 p-4 overflow-y-auto ${
          theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,238)]"
        }`}
      >
        {Object.entries(groupedMessages).map(([date, msgs]) => {
          return (
            <React.Fragment key={date}>
              {renderDateSeparator(date)}

              {msgs
                .filter((msg) => msg.roomId === selectedContact?.roomId)
                .map((msg) => {
                  return (
                    <MessageBubble
                      key={msg._id || msg.tempId}
                      message={msg}
                      theme={theme}
                      currentUser={user}
                      deleteMessage={deleteMessage}
                    />
                  );
                })}
            </React.Fragment>
          );
        })}

        <div ref={messageScroll} />
      </div>

      {filePreview && (
        <div className="relative p-2">
          <img
            src={filePreview}
            alt=""
            className="w-80 object-cover rounded shadow-lg mx-auto"
          />
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="absolute top-1 right-1 bg-red-500 hover:red-600 text-white rounded-full p-1"
          >
            <FaTimes className="h-4 w-4 " />
          </button>
        </div>
      )}

      <div className="relative flex gap-5 p-4 bg-[rgb(239,242,245)]">
        <button
          className="focus:outline-none "
          onClick={() => setFileMenu(!showFileMenu)}
        >
          <FaPaperclip className={`h-6 w-6 mt-2 `} />
        </button>
        {showFileMenu && (
          <div className="absolute bottom-full left-0 mb-2 rounded-lg shadow-lg">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center px-4 py-2 w-full "
            >
              <FaImage className="mr-2 " />
              Image/Video
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center px-4 py-2 w-full "
            >
              <FaFile className="mr-2 " />
              Documents
            </button>
          </div>
        )}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          placeholder="Type a message"
          className={`grow px-4 py-2 border rounded-full focus:outline-none focus:ring-green-500`}
        />
        <button
          onClick={() => handleSendMessage()}
          className="focus:outline-none"
        >
          <FaPaperPlane className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
