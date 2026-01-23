import { Status } from "../models/status.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import uploadOnCloudinary from "../utils/cloudinary";

const createStatus = asyncHandler(async (req, res) => {
  const [content] = req.body;
  const userId = req.user.userId;
  const file = req.file.path;
  const expireAt = 24 * 60 * 60;
  if (file) {
    const uploadFlie = await uploadOnCloudinary(file);
    if (!uploadFlie) {
      return res
        .status(400)
        .json(new ApiError(400, "failed to upload the file on cloudinary !"));
    }

    const status = await Status.create({
      content: uploadFlie.source_url,
      expireDate: expireAt,
      contentType: uploadFlie.filetype,
      createdBy: userId,
    });
  } else {
    const status = await Status.create({
      content,
      expireDate: expireAt,
      createdBy: userId,
    });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, status, "status created successfully !"));
});

const deleteStatus = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { statusId } = req.params;
  const status = await Status.findById(statusId);
  if (!status) {
    return res.status(404).json(new ApiError(404, "status not found "));
  }
  if (status.createdBy != userId) {
    return res
      .status(409)
      .json(new ApiError(409, "you are allowed to delete this status "));
  }

  await Status.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "status deleted successsfully "));
});

const viewedStatus = asyncHandler(async (req, res) => {
  // now i have to add the viewers to the list of the status viewedby
  const { viewerId, statusId } = req.params;

  const status = await Status.findById(statusId);
  if (!status) {
    return res.status(404).json(new ApiError(404, "status not found "));
  }
  if (!status.viewers.includes(userId)) {
    status.viewers.add(viewerId);
    await status.save();
    // then we have to update the status i think by the soket  io
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "viewer added successfully to the status viewer list ",
      ),
    );
});

const getStatus = asyncHandler(async (req, res) => {
  // get the contacts of the user
  // check every user has created the status or not in the status make sure they are under 24 hours and times stamps
  // also get the every ones username and the avatar
});

export { createStatus, deleteStatus };
