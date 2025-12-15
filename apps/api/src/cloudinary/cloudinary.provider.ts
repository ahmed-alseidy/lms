import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

export const CloudinaryProvider = {
  provide: "CLOUDINARY",
  useFactory: () => {
    const c = cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return c;
  },
};
