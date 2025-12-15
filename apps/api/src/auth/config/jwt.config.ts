import { registerAs } from "@nestjs/config";
import type { JwtModuleOptions } from "@nestjs/jwt";

export default registerAs(
  "jwt",
  (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
    },
  })
);
