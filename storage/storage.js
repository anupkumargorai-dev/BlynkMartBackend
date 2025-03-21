import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

import fs from "fs/promises";
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function uploadToCloudinary(localPath, folder = "main") {
  const filePathOnCloudinary = `${folder}/${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  return cloudinary.uploader
    .upload(localPath, {
      public_id: filePathOnCloudinary,
      resource_type: "auto",
    })
    .then((result) => {
      fs.unlink(localPath);
      return {
        message: "Success",
        url: result.secure_url,
        public_id: result.public_id,
      };
    })
    .catch((err) => {
      fs.unlink(localPath);
      return { message: "Fail" };
    });
}

async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (result.result === "ok") {
      return { message: "File deleted successfully" };
    } else {
      return { message: "File not found or already deleted", result };
    }
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return {
      message: "Fail",
      error: error.message,
    };
  }
}

export { uploadToCloudinary, deleteFromCloudinary };
