import React, { useState } from "react";
import Layout from "../components/Layout";
import useUserStore from "../store/useUserStore";
import useThemeStore from "../store/useThemeStore";
import { toast } from "react-toastify";
import axiosInstance from "../services/url.service";
import { FaEdit, FaCamera, FaSave } from "react-icons/fa";
import Spinner from "../utils/Spinner";
import Loader from "../utils/Loder";

const UserDetails = () => {
  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();

  const [userName, setUserName] = useState(user?.userName || "");
  const [about, setAbout] = useState(user?.about || "");
  const [avatar, setAvatar] = useState(null);

  const [previewImage, setPreviewImage] = useState(user?.avatar || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setAvatar(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("userName", userName);
      formData.append("about", about);

      if (avatar) {
        formData.append("avatar", avatar);
      }
      const response = await axiosInstance.put(
        "/auth/update-profile",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setUser(response.data.data);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Layout showChatRoom={false}>
      <div className={`w-125 p-6 `}>
        <div className={`max-w-2xl mx-auto `}>
          {/* Header */}
          <div className="p-6 ">
            <h1 className="text-2xl text-center font-semibold">Profile</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={previewImage}
                  alt="profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-500"
                />

                <label
                  htmlFor="avatarInput"
                  className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-600 p-3 rounded-full cursor-pointer transition"
                >
                  <FaCamera className="text-white text-sm" />
                </label>

                <input
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="text-sm text-gray-600">Username</label>

              <div
                className={`mt-2 flex items-center justify-between rounded-lg p-4 ${
                  theme === "dark" ? "bg-[#202122]" : "bg-gray-200"
                }`}
              >
                {isEditingName ? (
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-transparent outline-none w-full"
                  />
                ) : (
                  <span>{userName}</span>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingName(!isEditingName)}
                >
                  <FaEdit className="text-gray-400 hover:text-green-500 transition" />
                </button>
              </div>
            </div>

            {/* About */}
            <div>
              <label className="text-sm text-gray-600">About</label>

              <div
                className={`mt-2 flex items-start justify-between rounded-lg p-4 ${
                  theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"
                }`}
              >
                {isEditingAbout ? (
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows="3"
                    className="bg-transparent outline-none w-full resize-none"
                  />
                ) : (
                  <span>{about}</span>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingAbout(!isEditingAbout)}
                >
                  <FaEdit className="text-gray-400 hover:text-green-500 transition" />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 items-center justify-center text-lg ${loading ? "opacity-50 cursor-not-allowed" : " "}`}
            >
              {loading ? <Spinner /> : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetails;
