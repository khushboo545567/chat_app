import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useLayoutStore from "../store/useLayoutStore";
import useThemeStore from "../store/useThemeStore";
import Sidebar from "./sidebar";
import ChatRoom from "../pages/chat/ChatRoom";

const Layout = ({
  children,
  isThemeDialogOpen,
  toggleThemeDialog,
  isStatusPreviewOpen,
  statusPreviewContent,
  showChatRoom = true,
}) => {
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );

  const { theme } = useThemeStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`min-h-screen flex ${
        theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"
      }`}
    >
      {!isMobile && <Sidebar />}

      <div className="flex-1 flex overflow-hidden">
        {showChatRoom ? (
          <AnimatePresence initial={false}>
            {(!selectedContact || !isMobile) && (
              <motion.div
                key="chatlist"
                initial={{ x: isMobile ? "-100%" : 0 }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween" }}
                className="w-full md:w-2/5"
              >
                {children}
              </motion.div>
            )}

            {(selectedContact || !isMobile) && (
              <motion.div
                key="chatroom"
                initial={{ x: isMobile ? "100%" : 0 }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween" }}
                className="w-full"
              >
                <ChatRoom
                  selectedContact={selectedContact}
                  isMobile={isMobile}
                  setSelectedContact={setSelectedContact}
                />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>

      {isMobile && <Sidebar />}
    </div>
  );
};

export default Layout;
