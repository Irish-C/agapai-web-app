import { config as dotenvConfig } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load environment variables from the repo root, then fallback to server/.env.
dotenvConfig({ path: "./.env" });
dotenvConfig({ path: "./server/.env" });

export default defineConfig({
  schema: "server/prisma/schema.prisma",
  migrations: {
    path: "server/prisma/migrations",
  },
  // DELETE THE ENGINE LINE HERE
  datasource: {
    url: env("DATABASE_URL"),
  },
});