import { ApiError } from "./apiError";
import "../config/cloudnary.config.js";

const uploadOnCloudinary = async (localPath) => {
  try {
    if (!localPath) return null;
    const upload = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }

    return upload;
  } catch (error) {
    console.log(error);
  }
};

export default uploadOnCloudinary;
