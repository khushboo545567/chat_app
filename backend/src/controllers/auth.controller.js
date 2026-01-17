import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import optGenerate from "../utils/otpGenerator.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import sendOtpEmail from "../service/email.service.js";
import { sendOtpToPhoneNumber, verifySms } from "../service/twilio.service.js";
import generateToken from "../utils/generateToken.js";

const sendOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = optGenerate();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  if (!phoneNumber && !email) {
    return res.status(400).json(new ApiError(400, "All fields are required"));
  }

  if (email) {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }
    user.emailOtp = otp;
    user.emailOtpExpiry = otpExpiry;
    await user.save();

    await sendOtpEmail(email, otp);

    return res
      .status(200)
      .json(new ApiResponse(200, user, `OTP is sent to your email ${email}`));
  } else {
    if (!phoneNumber || !phoneSuffix) {
      return res
        .status(400)
        .json(new ApiError(400, "Phone number and phone suffix are required"));
    }

    const fullNumber = `${phoneSuffix}${phoneNumber}`;
    let user = await User.findOne({ phoneNumber, phoneSuffix });
    if (!user) {
      user = await User.create({ phoneNumber, phoneSuffix });
    }

    await sendOtpToPhoneNumber(fullNumber);

    return res
      .status(200)
      .json(new ApiResponse(200, user, "OTP sent to your mobile number"));
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;
  let user;
  if (!otp) {
    return res.status(400).json(new ApiError(400, "OTP is required"));
  }

  // ---------- EMAIL OTP ----------
  if (email) {
    user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }

    const now = new Date();
    console.log("heere the email finish ");

    if (
      !user.emailOtp ||
      String(user.emailOtp) !== String(otp) ||
      now > new Date(user.emailOtpExpiry)
    ) {
      // return res.status(400).json(new ApiError(400, "Invalid or expired OTP"));
      throw new ApiError(400, "Invalid or expired OTP");
    }
    console.log("heere the email finish ");

    user.isVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    await user.save();
    console.log("heere the email finish ");

    // ---------- PHONE OTP ----------
  } else {
    if (!phoneNumber || !phoneSuffix) {
      return res
        .status(400)
        .json(new ApiError(400, "Phone number and phone suffix are required"));
    }

    const fullNumber = `${phoneSuffix}${phoneNumber}`;
    user = await User.findOne({ phoneNumber, phoneSuffix });

    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }

    const result = await verifySms(fullNumber, otp);
    if (result.status !== "approved") {
      return res.status(400).json(new ApiError(400, "Invalid or expired OTP"));
    }

    user.isVerified = true;
    await user.save();
  }

  const token = generateToken(user._id);
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP verified successfully"));
});

export { sendOtp, verifyOtp };
