import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,

      trim: true,
    },

    phoneNumber: {
      type: String,
      unique: true,
    },

    phoneSuffix: {
      type: String,
    },

    email: {
      type: String,

      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },

    emailOtp: {
      type: String, // preferably hashed
    },

    emailOtpExpiry: {
      type: Date,
    },

    avatar: {
      type: String,
    },

    about: {
      type: String,
      maxlength: 150,
    },

    lastSeen: {
      type: Date,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isAgreed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
