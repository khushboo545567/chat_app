import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import optGenerate from "../utils/otpGenerator.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import sendOtpEmail from "../service/email.service.js";
import { sendOtpToPhoneNumber, verifySms } from "../service/twilio.service.js";
import generateToken from "../utils/generateToken.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Chatroom } from "../models/chatroom.model.js";

const sendOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;

  if (!phoneNumber && !email) {
    throw new ApiError(400, "Email or phone number is required");
  }

  if (email && phoneNumber) {
    throw new ApiError(400, "Use either email or phone number");
  }

  const otp = optGenerate();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  // EMAIL LOGIN
  if (email) {
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email });
    }

    user.emailOtp = otp;
    user.emailOtpExpiry = otpExpiry;

    await user.save();

    await sendOtpEmail(email, otp);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          _id: user._id,
          email: user.email,
        },
        `OTP sent to ${email}`,
      ),
    );
  }

  // PHONE LOGIN
  if (!phoneSuffix) {
    throw new ApiError(400, "Phone suffix is required");
  }

  const fullNumber = `${phoneSuffix}${phoneNumber}`;

  let user = await User.findOne({
    phoneNumber,
    phoneSuffix,
  });

  if (!user) {
    user = await User.create({
      phoneNumber,
      phoneSuffix,
    });
  }

  await sendOtpToPhoneNumber(fullNumber);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        phoneNumber: user.phoneNumber,
      },
      "OTP sent to mobile number",
    ),
  );
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

const getUserContacts = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.userId);

  // Get user contacts
  const user = await User.findById(userId)
    .populate({
      path: "contacts.user",
      select: "userName avatar isOnline lastSeen",
    })
    .lean();

  if (!user) {
    return res.status(404).json(new ApiError(404, "User not found"));
  }

  const contactIds = user.contacts.map((c) => c.user._id);

  // Fetch all private chatrooms in ONE query
  const chatrooms = await Chatroom.find({
    participants: userId,
    isGroup: false,
  })
    .populate({
      path: "participants",
      select: "userName avatar isOnline lastSeen",
    })
    .populate({
      path: "lastMessage",
      select: "content messageType sender status createdAt",
      populate: {
        path: "sender",
        select: "userName avatar",
      },
    })
    .lean();

  // Create room map by contactId
  const roomMap = new Map();

  chatrooms.forEach((room) => {
    const otherParticipant = room.participants.find(
      (p) => p._id.toString() !== userId.toString(),
    );

    if (otherParticipant) {
      roomMap.set(otherParticipant._id.toString(), room);
    }
  });

  // Fetch unread counts in ONE aggregation query
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        receiver: userId,
        status: { $ne: "read" },
      },
    },
    {
      $group: {
        _id: "$roomId",
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadMap = new Map();

  unreadCounts.forEach((item) => {
    unreadMap.set(item._id.toString(), item.count);
  });

  // Build final response
  const contacts = user.contacts.map((contact) => {
    const contactUser = contact.user;

    const room = roomMap.get(contactUser._id.toString());

    return {
      roomId: room?._id?.toString() || null,

      participants: room
        ? room.participants.filter(
            (p) => p._id.toString() !== userId.toString(),
          )
        : [contactUser],

      isGroup: false,

      groupName: null,

      unreadCount: room ? unreadMap.get(room._id.toString()) || 0 : 0,

      blocked: contact.blocked,

      lastMessage: room?.lastMessage
        ? {
            _id: room.lastMessage._id,
            content: room.lastMessage.content,
            messageType: room.lastMessage.messageType,
            sender: room.lastMessage.sender,
            status: room.lastMessage.status,
            createdAt: room.lastMessage.createdAt,
          }
        : null,
    };
  });

  // Sort latest message first
  contacts.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt)
      : 0;

    const bTime = b.lastMessage?.createdAt
      ? new Date(b.lastMessage.createdAt)
      : 0;

    return bTime - aTime;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, contacts, "Contacts fetched successfully"));
});

// get all users excepts each user contacts to add contacts list
const getUsersForAddContacts = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // current logged in user
  const currentUser = await User.findById(userId);

  // get all contact user ids
  const contactIds = currentUser.contacts.map((contact) =>
    contact.user.toString(),
  );

  // also exclude current user himself
  contactIds.push(userId.toString());

  // find users NOT in contacts
  const users = await User.find({
    _id: { $nin: contactIds },
  }).select("userName about avatar");

  return res.status(200).json({
    success: true,
    users,
  });
});
// add to contacts here if a added b and then in b contact a should be added in my case so implement that as well
const addToContacts = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { contactId } = req.body;

  // prevent self add
  if (userId.toString() === contactId.toString()) {
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

  let room = await Chatroom.findOne({
    participants: { $all: [userId, contactId] },
    isGroup: false,
  });

  if (!room) {
    room = await Chatroom.create({
      participants: [userId, contactId],
      isGroup: false,
      createdBy: userId,
    });
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

const deleteContacts = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json(new ApiError(400, "contactId is required"));
  }

  // Check contact exists
  const contactUser = await User.findById(contactId);
  if (!contactUser) {
    return res.status(404).json(new ApiError(404, "Contact not found"));
  }

  // Get logged-in user
  const user = await User.findById(userId);

  // Check if contact exists in user's contacts
  const contactIndex = user.contacts.findIndex(
    (c) => c.user.toString() === contactId.toString(),
  );

  if (contactIndex === -1) {
    return res.status(400).json(new ApiError(400, "Contact not in your list"));
  }

  // Remove contact
  user.contacts.splice(contactIndex, 1);
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Contact deleted successfully"));
});

export {
  sendOtp,
  verifyOtp,
  updateProfile,
  logOut,
  getUserContacts,
  getUserProfile,
  addToContacts,
  deleteContacts,
  getUsersForAddContacts,
};
