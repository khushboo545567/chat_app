import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";

const verifyToken = asyncHandler(async (req, res, next) => {
  let token;
  token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
  if (!token) {
    throw new ApiError(401, "token is missing");
  }

  const decodedtoken = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decodedtoken.userId);

  if (!user) {
    throw new ApiError(400, "Unauthorized token");
  }

  req.user = decodedtoken;

  next();
});

export default verifyToken;
