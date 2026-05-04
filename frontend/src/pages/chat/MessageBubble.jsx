import React from "react";
import { useRef, useState } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import { format } from "date-fns";

const MessageBubble = ({ message, theme, deleteMessage, currentUser }) => {
  const messageRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false); //user can delete the message
  const optionsRef = useRef(null);

  const isUserMessage = message?.sender?._id === currentUser?._id;
  const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

  const bubbleContentClass = isUserMessage
    ? "chat-bubble md:max-w-[50%] min-w-[130px] bg-green-300"
    : "chat-bubble md:max-w-[50%] min-w-[130px] bg-white text-black";

  if (!message) return null;

  return (
    <div className={`chat ${bubbleClass}`}>
      <div className={`${bubbleContentClass} relative group`} ref={messageRef}>
        <div className="flex justify-center gap-2">
          {message.messageType === "text" && (
            <p className="mr-2">{message.content}</p>
          )}

          {message.messageType === "image" && (
            <div>
              <img
                src={message.imageOrVideoUrl}
                alt="media"
                className="rounded-lg max-w-xs"
              />
              <p className="mt-1">{message.content}</p>
            </div>
          )}
        </div>

        <div className="self-end items-center justify-end gap-1 text-xs opacity-60 mt-2 ml-2 ">
          <span>{format(new Date(message.createdAt), "HH : mm")}</span>
          {isUserMessage && (
            <>
              {message.messageStatus === "send" && <FaCheck size={12} />}
              {message.messageStatus === "delivered" && (
                <FaCheckDouble size={12} />
              )}
              {message.messageStatus === "read" && (
                <FaCheckDouble size={12} className="text-blue-900" />
              )}
            </>
          )}
        </div>
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={() => setShowOption((prev) => !prev)}
            className={`p-1 rounded-full`}
          >
            <HiDotsVertical size={18} />
          </button>
        </div>
        {showOptions && (
          <div
            ref={optionsRef}
            className={`absolute top-8 right-1 z-50 w-36 rounded-xl shadow-lg py-2 text-sm bg-amber-200`}
          >
            <button
              onClick={() => {
                if (message.contentType === "text") {
                  Navigator.clipboard.writeText(message.content);
                }
                setShowOptions(false);
              }}
              className="flex items-center w-full px-4 py-2 gap-3 rounded-lg "
            >
              <FaRegcopy size={14} />
              <span>Copy</span>
            </button>
            {isUserMessage && (
              <button
                onClick={() => {
                  deleteMessage(message?._id);
                  setShowOptions(false);
                }}
                className="flex items-center w-full px-4 py-2 gap-3 rounded-lg text-red-500"
              >
                <FaRegcopy className="text-red-500" size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default MessageBubble;
