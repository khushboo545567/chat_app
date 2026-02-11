import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import optGenerate from "../utils/otpGenerator.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import sendOtpEmail from "../service/email.service.js";
import { sendOtpToPhoneNumber, verifySms } from "../service/twilio.service.js";
import generateToken from "../utils/generateToken.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Message } from "../models/message.model.js";

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

    if (
      !user.emailOtp ||
      String(user.emailOtp) !== String(otp) ||
      now >= new Date(user.emailOtpExpiry)
    ) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    user.isVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    await user.save();

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

  const token = generateToken({ userId: user._id });
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "OTP verified successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { userName, about, isAgreed } = req.body;

  const userId = req.user.userId;

  const user = await User.findById(userId);
  const file = req.file?.path;
  if (file) {
    const uploadToCloudnary = await uploadOnCloudinary(file);

    user.avatar = uploadToCloudnary?.secure_url;
  }
  if (userName) user.userName = userName;
  if (about) user.about = about;
  if (isAgreed) user.isAgreed = isAgreed;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "profile updated successfully !"));
});

const logOut = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    })
    .json(new ApiResponse(200, {}, "user logged out successfully !"));
});

// get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId)
    .select("-emailOtp -emailOtpExpiry -contacts -lastSeen -isOnline")
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, user, "user profile fetched successfully "));
});

// get the connected users profile
const getUserContacts = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // 1. Get user with contacts
  const user = await User.findById(userId)
    .populate("contacts.user", "userName avatar isOnline lastSeen")
    .lean();

  if (!user) {
    return res.status(404).json(new ApiError(404, "User not found"));
  }

  // 2. Process contacts
  const contactsWithLastMsg = await Promise.all(
    user.contacts.map(async (contact) => {
      const contactId = contact.user._id;

      // 3. Find chatroom between users
      const room = await Chatroom.findOne({
        participants: { $all: [userId, contactId] },
        isGroup: false,
      })
        .populate({
          path: "lastMessage",
          select: "content messageType sender status createdAt",
        })
        .lean();

      return {
        _id: contact.user._id,
        userName: contact.user.userName,
        avatar: contact.user.avatar,
        isOnline: contact.user.isOnline,
        lastSeen: contact.user.lastSeen,
        blocked: contact.blocked,
        lastMessage: room?.lastMessage
          ? {
              content: room.lastMessage.content,
              messageType: room.lastMessage.messageType,
              sender: room.lastMessage.sender,
              status: room.lastMessage.status,
              time: room.lastMessage.createdAt,
            }
          : null,
      };
    }),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        contactsWithLastMsg,
        "Contacts fetched successfully",
      ),
    );
});

const addToContacts = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { contactId } = req.params;

  // prevent self add
  if (userId.toString() === contactId.toString()) {
    console.log("user id and contact id is same ");
    return res
      .status(400)
      .json(new ApiError(400, "You cannot add yourself to your contacts"));
  }

  //  Check contact exists
  const contactUser = await User.findById(contactId);
  if (!contactUser) {
    return res.status(404).json(new ApiError(404, "Contact not found"));
  }

  //  Get logged-in user
  const user = await User.findById(userId);

  //  Check if already added
  const alreadyExists = user.contacts.some(
    (c) => c.user.toString() === contactId,
  );

  if (alreadyExists) {
    return res.status(400).json(new ApiError(400, "Contact already exists"));
  }

  //  Push contact
  user.contacts.push({
    user: contactId,
    nickname: contactUser.userName,
    blocked: false,
  });

  await user.save();

  // Response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "contacts added successfully !"));
});

export {
  sendOtp,
  verifyOtp,
  updateProfile,
  logOut,
  getUserContacts,
  getUserProfile,
  addToContacts,
};
