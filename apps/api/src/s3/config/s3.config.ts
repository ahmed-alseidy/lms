import { registerAs } from "@nestjs/config";

export default registerAs("s3", () => ({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  bucket: process.env.S3_BUCKET_NAME,
}));
