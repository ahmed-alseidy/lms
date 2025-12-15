import { registerAs } from "@nestjs/config";

export default registerAs("payments", () => ({
  fawaterak: {
    apiToken: process.env.FAWATERAK_API_TOKEN,
    baseUrl: process.env.FAWATERAK_API_URL,
  },
}));
