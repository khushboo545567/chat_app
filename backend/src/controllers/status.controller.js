import { Status } from "../models/status.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const createStatus = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user.userId;
  const file = req.file?.path;

  // expire date 24 hours from now
  const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let status;

  if (file) {
    const uploadFile = await uploadOnCloudinary(file);
    if (!uploadFile) {
      throw new ApiError(400, "Failed to upload file on Cloudinary!");
    }

    status = await Status.create({
      content: uploadFile.secure_url,
      expireDate: expireAt,
      contentType: uploadFile.resource_type, // image or video
      createdBy: userId,
    });
  } else if (content?.trim()) {
    status = await Status.create({
      content,
      expireDate: expireAt,
      contentType: "text",
      createdBy: userId,
    });
  } else {
    throw new ApiError(400, "Status content or file is required!");
  }

  // 🔌 emit socket
  const populatedStatus = await Status.findOne(status?._id)
    .populate("user", "userName avatar")
    .populate("viewers", "userName avatar");

  const userData = await User.findById(userId).select("contacts.user");

  if (req.io && req.socketUserMap) {
    for (const contact of userData.contacts) {
      const contactUserId = contact.user.toString();

      const socketId = req.socketUserMap.get(contactUserId);

      if (socketId) {
        req.io.to(socketId).emit("new_status", populatedStatus);
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, status, "Status created successfully!"));
});

const deleteStatus = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { statusId } = req.params;

  const status = await Status.findById(statusId);
  if (!status) {
    throw new ApiError(404, "Status not found");
  }

  if (status.createdBy.toString() !== userId) {
    throw new ApiError(403, "You are not allowed to delete this status");
  }

  await status.deleteOne();

  // 🔌 Emit socket event to contacts
  const userData = await User.findById(userId).select("contacts.user");

  if (req.io && req.socketUserMap) {
    for (const contact of userData.contacts) {
      const contactUserId = contact.user.toString();
      const socketId = req.socketUserMap.get(contactUserId);

      if (socketId) {
        req.io.to(socketId).emit("status_deleted", {
          statusId,
          deletedBy: userId,
        });
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Status deleted successfully"));
});

const viewedStatus = asyncHandler(async (req, res) => {
  const userId = req.user.userId; // viewer
  const { statusId } = req.params;

  const status = await Status.findById(statusId);
  if (!status) {
    throw new ApiError(404, "Status not found");
  }

  // add viewer if not already added
  if (!status.viewers.includes(userId)) {
    status.viewers.push(userId);
    await status.save();

    // 🔌 notify status owner
    if (req.io && req.socketUserMap) {
      const ownerSocketId = req.socketUserMap.get(status.createdBy.toString());

      if (ownerSocketId) {
        req.io.to(ownerSocketId).emit("status_viewed", {
          statusId,
          viewerId: userId,
        });
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, status.viewers, "Viewer added successfully"));
});

const getStatus = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  //  Get user and their contacts
  const user = await User.findById(userId)
    .populate("contacts.user", "userName avatar isOnline lastSeen")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = new Date();

  //  Fetch active statuses for each contact
  const statuses = await Promise.all(
    user.contacts.map(async (contact) => {
      const contactId = contact.user._id;

      const activeStatuses = await Status.find({
        createdBy: contactId,
        expireDate: { $gt: now }, // not expired
      })
        .select("content contentType viewers createdAt")
        .lean();

      if (!activeStatuses.length) return null; // no active statuses

      return {
        contact: {
          _id: contact.user._id,
          userName: contact.user.userName,
          avatar: contact.user.avatar,
        },
        statuses: activeStatuses.map((s) => ({
          _id: s._id,
          content: s.content,
          contentType: s.contentType,
          viewers: s.viewers,
          createdAt: s.createdAt,
        })),
      };
    }),
  );

  //  Filter out contacts with no active statuses
  const filteredStatuses = statuses.filter((s) => s !== null);

  return res
    .status(200)
    .json(
      new ApiResponse(200, filteredStatuses, "Statuses fetched successfully"),
    );
});

export { createStatus, deleteStatus, viewedStatus, getStatus };
