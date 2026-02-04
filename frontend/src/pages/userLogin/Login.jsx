import React, { useState } from "react";
import useLoginStore from "../../store/useLoginStore.js";
import countries from "../../utils/Countries.js";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore.js";
import { useForm } from "react-hook-form";
import useThemeStore from "../../store/useThemeStore.js";

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

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-linear-to-br from-green-400 to-blue-400"
      } flex items-center justify-center p-4 overflow-hidden`}
    >
      Login
    </div>
  );
}

export default Login;
