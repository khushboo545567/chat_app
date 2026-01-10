import { User } from "../models/user.model";
import asyncHandler from "../utils/asyncHandler";
import optGenerate from "../utils/otpGenerator";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const sendOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = optGenerate;
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
    // we do not store the phone otp in db because we will the otp from the servies directly
    return res
      .status(200)
      .json(new ApiResponse(200, user, "otp send to you given mobile number"));
  }
});

export { sendOtp };
