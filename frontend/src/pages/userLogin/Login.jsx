import React, { useState } from "react";
import useLoginStore from "../../store/useLoginStore.js";
import countries from "../../utils/Countries.js";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { data, useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore.js";
import { useForm } from "react-hook-form";
import useThemeStore from "../../store/useThemeStore.js";
import { motion } from "framer-motion";
import { FaChevronDown, FaUser, FaWhatsapp } from "react-icons/fa";
import Spinner from "../../utils/Spinner";
import {
  sendOtp,
  updateProfile,
  verifyOtp,
} from "../../services/user.service.js";
import { toast } from "react-toastify";
// // ================= VALIDATIONS =================

const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .matches(/^\d+$/, "Phone number must contain only digits")
      .transform((value, originalValue) => {
        originalValue.trim() === "" ? null : value;
      }),
    email: yup
      .string()
      .nullable()
      .email("Please enter the valid email ")
      .transform((value, originalValue) => {
        originalValue.trim() === "" ? null : value;
      }),
  })
  .test(
    "atleast-one",
    "Either email or phoneNubmer is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    },
  );

const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "otp should be of minimum 6 digit")
    .required("otp is required"),
});

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  aggred: yup.bool().oneOf([true], "you must aggree to the terms"),
});

// // ================= COMPONENT =================

function Login() {
  const { step, userPhoneData, setStep, setUserPhoneData, resetLoginState } =
    useLoginStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("", "", "", "", "", "");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [avatar, setAvatar] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const [showDropDown, setDropDown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({ resolver: yupResolver(loginValidationSchema) });

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({ resolver: yupResolver(otpValidationSchema) });

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({ resolver: yupResolver(profileValidationSchema) });
  const { theme, toggleTheme } = useThemeStore();

  const ProgressBar = () => {
    return (
      <div
        className={`w-full  ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}
      >
        <div
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>
    );
  };

  const filterContires = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLocaleLowerCase()) ||
      country.dialCode.includes(searchTerm),
  );

  const onLoadingSubmit = async () => {
    try {
      setLoading(true);
      if (email) {
        const response = await sendOtp(null, null, email);
        if (response.status === "success") {
          toast.info("OTP send to your email");
          setUserPhoneData({ email });
          setStep(2);
        }
      } else {
        const response = await sendOtp(phoneNumber, selectedCountry.dialCode);
        if (response.status === "success") {
          toast.info("OTP send to your phone number");
          setUserPhoneData({
            phoneNumber,
            phoneSuffix: selectedCountry.dialCode,
          });
          setStep(2);
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Filed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async () => {
    try {
      setLoading(true);
      if (!userPhoneData) {
        throw new Error("Phone or email data is missing");
      }
      const otpString = opt.join();
      let response;
      if (userPhoneData?.email) {
        response = await verifyOtp(null, null, otp, userPhoneData.email);
      } else {
        response = await verifyOtp(
          userPhoneData.phoneNumber,
          userPhoneData.phoneSuffix,
          otpString,
        );
      }
      if (response.status === "success") {
        toast.success("OTP verified successfully ");
        const user = response.data?.user;
        if (user?.username && user?.avatar) {
          setUser(user);
          toast.success("Welcome back to Whatshapp");
          navigate("/");
          resetLoginState();
        }
      } else {
        setStep(3);
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Filed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  /////////////
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };
  const onProfileSubmit = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("aggred", data.aggred);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      await updateProfile(formData);
      toast.success("Welcome back to Whatsapp");
      navigate("/");
      resetLoginState();
    } catch (error) {
      console.log(error);
      setError(error.message || "Filed to update user profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-linear-to-br from-green-400 to-blue-400"
      } flex items-center justify-center p-4 overflow-hidden`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center "
        >
          <FaWhatsapp className="w-16 h-16 text-white"></FaWhatsapp>
        </motion.div>
        <h1
          className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
        >
          Whatsapp Login
        </h1>
        {/* // not appearing */}
        <ProgressBar />

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {step === 1 && (
          <form className="space-y-4">
            <p
              className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-6`}
            >
              Enter you phone nubmer to receive OTP
            </p>
            <div className="relative">
              <div className="flex">
                <div className="relative w-1/3 mr-4">
                  <button
                    type="button"
                    className={`flex items-center justify-between gap-2 w-full px-4 py-2 text-sm font-medium${theme === "dark" ? "text-white bg-gray-700 border-gray-600" : "text-gray-900 bg-gray-100 border-gray-300"}border rounded-lg hover:bg-gray-200 focus:outline-none`}
                    onClick={() => setDropDown(!showDropDown)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span>{selectedCountry.dialCode}</span>
                    </span>

                    <FaChevronDown className="text-xs" />
                  </button>
                  {showDropDown && (
                    <div
                      className={`absolute z-10 w-full mt-1 ${theme === "dark" ? "bg-gray-700 border-gray-600 " : "bg-white border-gray-300"} border rounded-md  shadow-lg max-h-60 overflow-auto`}
                    >
                      <div
                        className={`sticky top-0 ${theme === "dark" ? "bg-gray-700 " : "bg-white "} p-2`}
                      >
                        <input
                          type="text"
                          placeholder="search countires"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py-1 border ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"} rounded-md text-sm focus:outline-none focus: ring-2 focus: ring-green-500`}
                        />
                      </div>
                      {filterContires.map((country) => (
                        <button
                          key={country.alpha2}
                          type="boutton"
                          className={`w-full text-left px-3 py-2 ${theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-100"} focus: outline-none focus:bg-gray-100`}
                          onClick={() => {
                            setSelectedCountry(country);
                            setDropDown(false);
                          }}
                        >
                          {country.flag} ({country.dialCode}) {country.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  {...loginRegister("phoneNumber")}
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-2/3 px-4 py-2 border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 "} rounded-md focus:outline-none focus: ring-2 focus: ring-green-500 ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
                />
              </div>
              {loginErrors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {loginErrors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div className="flex items-center my-4">
              <div className="grow h-px bg-gray-300" />
              <span className="mx-3 text-gray-500 text-sm font-medium">Or</span>
              <div className="grow h-px bg-gray-300" />
            </div>
            {/* EMAIL INPUT BOX */}
            <div
              className={`flex  items-center border rounded-md px-3 py-2 ${theme === "dark" ? "bg-gray-700 border-gray-600 " : "bg-white border-gray-300"}`}
            >
              <FaUser
                className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="email"
                {...loginRegister("email")}
                placeholder="Email (Optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-2/3 px-4 py-2 outline-none ${theme === "dark" ? " text-white" : "text-black "} ${loginErrors.email ? "border-red-500" : ""}`}
              />
              {loginErrors.email && (
                <p className="text-red-500 text-sm">
                  {loginErrors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
            >
              {loading ? <Spinner /> : " Send OTP"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default Login;
