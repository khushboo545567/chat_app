import { User } from "../models/user.model";
import asyncHandler from "../utils/asyncHandler";
import optGenerate from "../utils/otpGenerator";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import sendOtpEmail from "../service/email.service.js";
import { sendOtpToPhoneNumber, verifySms } from "../service/twilio.service.js";

const sendOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = optGenerate();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  if (!phoneNumber && !email) {
    return res.status(400).json(new ApiError(400, "all fields are required"));
  }
  if (email) {
    const user = await User.findOne({ email });
    if (!user) {
      await user.create(email);
    }
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    await sendOtpEmail(email, otp);
    return res
      .status(200)
      .json(new ApiResponse(200, user, `Otp is sent to you email ${email}`));
  } else {
    if (!phoneNumber && !phoneSuffix) {
      return res
        .status(400)
        .json(new ApiError(400, "phone num and phone suffix are required"));
    }
    const fullNumber = `${phoneSuffix}${phoneNumber}`;
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      await user.create(phoneNumber, phoneSuffix);
    }
    await sendOtpToPhoneNumber(fullNumber);
    // we do not store the phone otp in db because we will the otp from the servies directly
    return res
      .status(200)
      .json(new ApiResponse(200, user, "otp send to you given mobile number"));
  }
});

// verify otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body();
  let user;
  if (email) {
    user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(new ApiError(404, "user not found !"));
    }
    const now = new Date();
    if (
      !user.emailOtp ||
      String(user.emailOtp) !== String(otp) ||
      now > new Date(user.emailOtpExpiry)
    ) {
      return res.status(400).json(new ApiError(400, "invalid or expired otp"));
    }
    user.isVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    await user.save();
  } else {
    if (!phoneNumber || !phoneSuffix) {
      return res.status(404).json(new ApiError(404, "User not found "));
    }
    const fullNumber = `${phoneSuffix}${phoneNumber}`;
    user = User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json(new ApiError(404, "user not found !"));
    }
    const result = await verifySms(fullNumber, otp);
    if (result.status !== "approved") {
      return res
        .status(400)
        .json(new ApiError(400, "invalid otp or unvarified or expired"));
    }
    user.isVerified = true;
    await user.save();
  }
  const token = j;
});
export { sendOtp };
