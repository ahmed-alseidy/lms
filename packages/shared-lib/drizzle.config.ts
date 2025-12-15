import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";

const envPath = path.join(__dirname.split("/").slice(0, 5).join("/"), ".env");
config({ path: envPath });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
