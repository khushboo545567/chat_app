import axiosInstance from "./url.service";

const sendOtp = async (phoneNumber, phoneSuffix, email) => {
  try {
    const response = await axiosInstance.post("auth/send-otp", {
      phoneNumber,
      phoneSuffix,
      email,
    });

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

const verifyOtp = async (phoneNumber, phoneSuffix, email, otp) => {
  console.log(email);
  console.log(otp);
  try {
    const response = await axiosInstance.post("/auth/verify-otp", {
      phoneNumber,
      phoneSuffix,
      email,
      otp,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

const updateProfile = async (updateData) => {
  try {
    const response = await axiosInstance.put("auth/update-profile", updateData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

const checkUserAuth = async () => {
  try {
    const response = await axiosInstance.get("/auth/get-user-profile");

    if (response.success) {
      return { isAuthenticated: true, user: response?.data?.data };
    } else if (response.status === false) {
      return response.data;
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

const logoutUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

const getContacts = async () => {
  try {
    const response = await axiosInstance.get("/auth/get-users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};
export {
  sendOtp,
  verifyOtp,
  updateProfile,
  checkUserAuth,
  logoutUser,
  getContacts,
};
