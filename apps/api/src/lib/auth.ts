import "reflect-metadata";
import {
  accounts,
  db,
  sessions,
  users,
  verifications,
} from "@lms-saas/shared-lib";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  basePath: "/auth",
  // Note: CORS is handled by NestJS in main.ts
  // trustedOrigins is for CSRF protection, list common origins here
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://teacher1.localhost:3000",
    "http://*.localhost:3000",
  ],
  database: drizzleAdapter(db, {
    schema: {
      accounts,
      sessions,
      users,
      verifications,
    },
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
    },
  },
});
