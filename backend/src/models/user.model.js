import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 30,
      default: "User",
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    phoneSuffix: {
      type: String,
    },

    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },

    emailOtp: {
      type: String,
    },

    emailOtpExpiry: {
      type: Date,
    },

    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },

    about: {
      type: String,
      maxlength: 150,
      default: "Hey there! I am using ChatApp.",
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

    contacts: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },

          nickname: {
            type: String,
          },

          blocked: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
