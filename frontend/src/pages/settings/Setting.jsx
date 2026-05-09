import React, { useState } from "react";
import { logoutUser } from "../../services/user.service";
import useUserStore from "../../store/useUserStore";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import { Link } from "react-router-dom";
import useThemeStore from "../../store/useThemeStore";

import { FaUser, FaComment, FaSun, FaMoon, FaSignOutAlt } from "react-icons/fa";

const Setting = () => {
  const { user, clearUser } = useUserStore();
  const { theme } = useThemeStore();

  const [isThemeDialogOpen, setThemeDialogOpen] = useState(false);

  const toggleThemeDialog = () => {
    setThemeDialogOpen(!isThemeDialogOpen);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("User logout successfully");
    } catch (error) {
      console.error("Failed to logout", error);
      toast.error("Logout failed");
    }
  };

  const menuItems = [
    {
      icon: FaUser,
      label: "Account",
      href: "/user-profile",
    },
    {
      icon: FaComment,
      label: "Chats",
      href: "/",
    },
  ];

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
      showChatRoom={false}
    >
      <div
        className={`flex h-screen ${
          theme === "dark"
            ? "bg-[rgb(17,27,33)] text-white"
            : "bg-white text-black"
        } pt-16`}
      >
        {/* Sidebar */}
        <div className="w-100 ">
          {/* Heading */}
          <div className="pb-8 pl-4">
            <h1 className="text-2xl font-semibold">Settings</h1>
          </div>

          {/* User Profile */}
          <div
            className={`flex items-center gap-4 p-4 mx-3 rounded-lg cursor-pointer ${
              theme === "dark"
                ? "bg-[#202c33] hover:bg-[#2a3942]"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <img
              src={user?.avatar}
              alt="profile"
              className="w-14 h-14 rounded-full object-cover"
            />

            <div>
              <h2 className="font-semibold">{user?.userName}</h2>
              <p className="text-sm text-gray-400">{user?.about}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="mt-4 space-y-2 px-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-4 p-4 rounded-lg transition ${
                  theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
                }`}
              >
                <item.icon className="text-lg" />

                <div className=" w-full pb-2">{item.label}</div>
              </Link>
            ))}

            {/* Theme Button */}
            <button
              onClick={toggleThemeDialog}
              className={`w-full flex items-center gap-4 p-4 rounded-lg transition ${
                theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
              }`}
            >
              {theme === "dark" ? (
                <FaMoon className="text-lg" />
              ) : (
                <FaSun className="text-lg" />
              )}

              <div className="flex justify-between items-center  w-full pb-2">
                <span>Theme</span>

                <span className="text-sm text-gray-400">
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </span>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 rounded-lg text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition"
            >
              <FaSignOutAlt className="text-lg" />

              <div className=" w-full pb-2 text-left">Logout</div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setting;
