import { registerAs } from "@nestjs/config";
import type { JwtSignOptions } from "@nestjs/jwt";

export default registerAs(
  "refresh-jwt",
  (): JwtSignOptions => ({
    secret: process.env.REFRESH_JWT_SECRET,
    expiresIn: Number(process.env.REFRESH_JWT_EXPIRES_IN) || 3600,
  })
);
