import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaWhatsapp, FaUserCircle, FaCog } from "react-icons/fa";
import { MdOutlineRadioButtonChecked } from "react-icons/md";
import { motion } from "framer-motion";
import useThemeStore from "../store/useThemeStore";
import useLayoutStore from "../store/useLayoutStore";
import useUserStore from "../store/useUserStore";

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { selectedContact, setActiveTab } = useLayoutStore();

  useEffect(() => {
    if (location.pathname === "/") setActiveTab("chats");
    else if (location.pathname === "/status") setActiveTab("status");
    else if (location.pathname === "/user-profile") setActiveTab("profile");
    else if (location.pathname === "/settings") setActiveTab("settings");
  }, [location]);

  // Hide sidebar on mobile when chat is open
  if (isMobile && selectedContact) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${
        isMobile
          ? "fixed bottom-0 left-0 right-0 h-16 flex-row"
          : "w-16 h-screen flex-col"
      } flex justify-between items-center py-6
      ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}
    >
      {/*  TOP SECTION */}
      <div
        className={`flex ${
          isMobile ? "flex-row gap-8" : "flex-col gap-8"
        } items-center`}
      >
        <Link to="/">
          <FaWhatsapp className="w-6 h-6" />
        </Link>

        <Link to="/status">
          <MdOutlineRadioButtonChecked className="w-6 h-6" />
        </Link>
      </div>

      {/*  BOTTOM SECTION */}
      <div
        className={`flex ${
          isMobile ? "flex-row gap-8" : "flex-col gap-8"
        } items-center`}
      >
        <Link to="/user-profile">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="profile"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <FaUserCircle className="w-6 h-6" />
          )}
        </Link>

        <Link to="/settings">
          <FaCog className="w-6 h-6" />
        </Link>
      </div>
    </motion.div>
  );
};

export default Sidebar;
