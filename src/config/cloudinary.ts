import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "./env";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error || !result) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
};

export { cloudinary };
