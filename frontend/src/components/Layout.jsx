import { useLocation } from "react-router-dom";
import useLayoutStore from "../store/useLayoutStore";
import { useEffect, useState } from "react";
import useThemeStore from "../store/useThemeStore";
import Sidebar from "./sidebar";
import { AnimatePresence } from "framer-motion";

const Layout = ({
  childern,
  isThemeDialogOpen,
  toggleThemeDialog,
  isStatusPreviewOpen,
  statusPreviewContent,
}) => {
  const selectedContect = useLayoutStore((state) => state.selectedContect);
  const setSelectedContet = useLayoutStore((state) => state.selectedContet);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"} flex relative`}
    >
      {!isMobile && <Sidebar />}
      <div
        className={`flex-1 flex overflow-hidden ${isMobile ? "flex-col" : ""}`}
      >
        <AnimatePresence initial={false}>
          {(!selectedContect || !isMobile) && (
            <motion.div
              key="chatlist"
              initial={{ x: isMobile ? "-100%" : "0" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ Type: "tween" }}
              className={`w-full md:w-2/5 h-full ${isMobile ? "pb-16" : ""}`}
            >
              {childern}
            </motion.div>
          )}
          {(selectedContect || !isMobile) && (
            <motion.div
              key="chatroom"
              initial={{ x: isMobile ? "-100%" : "0" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ Type: "tween" }}
              className={`w-full h-full`}
            >
              {/* //////////////// */}
              {
                <ChatRoom
                  selectedContect={selectedContect}
                  isMobile={isMobile}
                  setSelectedContet={setSelectedContet}
                />
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {isMobile && <Sidebar />}
      {isThemeDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div
            className={`${theme === "dark" ? "bg-[#202C33] text-white" : "bg-white text-black"} p-6 rounded-lg shadow-lg max-w-sm w-full`}
          >
            <h2 className="text-2xl font-semibold mb-4  "> Chose a Theme</h2>
            <div className="space-y-4 ">
              <label
                htmlFor=""
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  value="light"
                  checked={theme === "light"}
                  onChange={() => {
                    toggleTheme(light);
                  }}
                  className="from-radio bg-blue-600"
                />
                <span>Light</span>
              </label>
              <label
                htmlFor=""
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  value="light"
                  checked={theme === "dark"}
                  onChange={() => {
                    toggleTheme("dark");
                  }}
                  className="from-radio bg-blue-600"
                />
                <span>Dark</span>
              </label>
            </div>
            <button
              onClick={toggleThemeDialog}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500 transition duration-200 "
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* status preview */}
      {isStatusPreviewOpen && (
        <div className="fiexd inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          {statusPreviewContent}
        </div>
      )}
    </div>
  );
};

export default Layout;
