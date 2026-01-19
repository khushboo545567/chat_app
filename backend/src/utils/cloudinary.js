import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";

const uploadOnCloudinary = async (localPath) => {
  try {
    if (!localPath) return null;

    const uploadResult = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });

    // remove local file after upload
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }

    return uploadResult;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export default uploadOnCloudinary;
