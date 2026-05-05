import React, { useRef, useState } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import { format } from "date-fns";

const MessageBubble = ({ message, deleteMessage, currentUser }) => {
  const messageRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);

  const isUserMessage = message?.sender?._id === currentUser?._id;

  if (!message) return null;

  return (
    <div
      className={`flex mb-3 ${isUserMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative px-3 py-2 rounded-xl max-w-[60%] shadow-sm ${
          isUserMessage
            ? "bg-green-400 text-black rounded-br-none"
            : "bg-white text-black rounded-bl-none"
        }`}
        ref={messageRef}
      >
        {/* TEXT MESSAGE */}
        {message.messageType === "text" && (
          <p className="text-sm wrap-break-words">{message.content}</p>
        )}

        {/* IMAGE MESSAGE */}
        {message.messageType === "image" && (
          <div>
            <img
              src={message.imageOrVideoUrl}
              alt="media"
              className="rounded-lg max-w-xs mb-1"
            />
            <p className="text-sm">{message.content}</p>
          </div>
        )}

        {/* TIME + STATUS */}
        <div className="flex items-center justify-end gap-1 text-[10px] mt-1 opacity-70">
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>

          {isUserMessage && (
            <>
              {message.status === "sent" && <FaCheck size={10} />}
              {message.status === "delivered" && <FaCheckDouble size={10} />}
              {message.status === "read" && (
                <FaCheckDouble size={10} className="text-blue-600" />
              )}
            </>
          )}
        </div>

        {/* OPTIONS BUTTON */}
        <div className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition">
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            className="p-1"
          >
            <HiDotsVertical size={16} />
          </button>
        </div>

        {/* DROPDOWN */}
        {showOptions && (
          <div className="absolute top-7 right-1 w-32 bg-white shadow-lg rounded-md text-sm z-50">
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                setShowOptions(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              Copy
            </button>

            {isUserMessage && (
              <button
                onClick={() => {
                  // call from usechatstore
                  deleteMessage(message._id);
                  setShowOptions(false);
                }}
                className="block w-full text-left px-3 py-2 text-red-500 hover:bg-gray-100"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
