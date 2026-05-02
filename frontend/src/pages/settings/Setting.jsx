import { useState } from "react";
import { logoutUser } from "../../services/user.service";
import useUserStore from "../../store/useUserStore";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import { Link } from "react-router-dom";

const Setting = () => {
  const { user, clearUser } = useUserStore();
  const [isThemeDialogOpen, setThemeDialogOpen] = useState(false);
  const { theme } = usThemeStore();
  const toggleThemeDialog = () => {
    setThemeDialogOpen(!isThemeDialogOpen);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("user logout successfully ");
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };
  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex h-screen ${theme === "dark" ? "bg-[rgb(17,27,33 )]" : "bg-white text-black"}`}
      >
        <div className="w-[400px border-r] border-gray-700">
          <div className="p-4">
            {" "}
            <h1 className="text-xl font-semibold mb-4">Settings</h1>
          </div>
          <div className="flex items-center gap-4 p-3 bg-amber-200 hover:bg-amber-400 rounded-lg cursor-pointer">
            <img
              src={user.profilePicture}
              alt="profile"
              className="w-14 h-14 rounded-full "
            />
            <div>
              <h2 className="font-semibold">{user?.name}</h2>
              <p className="text-sm text-gray-600">{user?.about}</p>
            </div>
          </div>
          {/* menu items */}
          <div className="h-[calc(100vh-280px)] overflow-y-auto">
            <div className="space-y-1">
              {[
                { icon: FaUser, label: "Account", href: "/user-profile" },
                { icon: FaComment, label: "Chats", href: "/" },
              ].map((item) => {
                <Link
                  to={item.herf}
                  key={item.label}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-amber-400 bg-gray-500"
                >
                  <item.icon className="h-5 w-5 " />
                  <div className={`border-b border-gray-700 w-full p-4`}>
                    {item.label}
                  </div>
                </Link>;
              })}

              {/* theme btn */}
              <button
                onClick={toggleThemeDialog}
                className={`w-full flex items-center gap-3 p-2 rounded`}
              >
                {theme === "dark" ? (
                  <FaMoon className="h-5 w-5" />
                ) : (
                  <FaSun className="h-5 w-5" />
                )}
                <div className="flex flex-col  text-start border-b border-gray-600 w-full ">
                  Theme{" "}
                  <span className="ml-auto text-sm text-gray-400">
                    {theme.charAt[0].toUpperCase() + theme.slice[1]}
                  </span>
                </div>
              </button>
            </div>
            <div className="w-full items-center flex gap-3 p-2 rounded text-red-400 bg-gray-500 mt-10 md:mt-36">
              <button onClick={handleLogout}>
                <FaSignout className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setting;
