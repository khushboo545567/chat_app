import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useThemeStore from "../store/useThemeStore";
import useLayoutStore from "../store/useLayoutStore";
import { FaWhatsapp, FaUserCircle, FaCog } from "react-icons/fa";
import motion from "framer-motion";
import { MdOutlineRadioButtonChecked } from "react-icons/md";

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTabs, setActiveTab, selectedContet } = useLayoutStore();

  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("chats");
    } else if (location.pathname === "status") {
      setActiveTab("status");
    } else if (location.pathname === "/user-profile") {
      setActiveTab("profile");
    } else if (location.pathname === "/settings") {
      setActiveTab("settings");
    }
  }, [location, setActiveTab]);

  if (isMobile && selectedContet) {
    return null;
  }

  const sideBarContent = () => {
    <>
      <Link
        to="/"
        className={`${isMobile ? " " : "mb-8"} ${activeTabs === "chats" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
      >
        <FaWhatsapp
          className={`h-6 w-6 ${activeTabs === "chats" ? (theme === "dark" ? "text-gray-800" : "") : theme === "dark" ? "text-gray-800" : "text-gray-600"}`}
        />
      </Link>
      <Link
        to="/status"
        className={`${isMobile ? " " : "mb-8"} ${activeTabs === "chats" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
      >
        <MdOutlineRadioButtonChecked
          className={`h-6 w-6 ${activeTabs === "status" ? (theme === "dark" ? "text-gray-800" : "") : theme === "dark" ? "text-gray-800" : "text-gray-600"}`}
        />
      </Link>
      {!isMobile && <div className="grow" />}

      <Link
        to="/user-profile"
        className={`${isMobile ? " " : "mb-8"} ${activeTabs === "chats" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
      >
        {user?.avatar ? (
          <img
            src={user?.avatar}
            alt="user"
            className="h-full w-full rounded-full"
          ></img>
        ) : (
          <FaUserCircle
            className={`h-6 w-6 ${activeTabs === "profile" ? (theme === "dark" ? "text-gray-800" : "") : theme === "dark" ? "text-gray-800" : "text-gray-600"}`}
          />
        )}
      </Link>
      <Link
        to="/settings"
        className={`${isMobile ? " " : "mb-8"} ${activeTabs === "setting" && "bg-gray-300 shadow-sm p-2 rounded-full"} focus:outline-none`}
      >
        <FaCog
          className={`h-6 w-6 ${activeTabs === "setting" ? (theme === "dark" ? "text-gray-800" : "") : theme === "dark" ? "text-gray-800" : "text-gray-600"}`}
        />
      </Link>
    </>;
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${isMobile ? "fixed bottom-0 right-0 left-0 h-16" : "w-16 h-screen border-r-2"} ${theme === "dark" ? "bg-gray-800 border-gray-600 " : "bg-[rgb[239,232,245]] border-gray-300"} bg-opacity-90 flex items-center shadow-lg py-4 ${isMobile ? "flex-row justify-around" : "flex-col justify-between"}`}
    >
      {sideBarContent}
    </motion.div>
  );
};

export default Sidebar;
