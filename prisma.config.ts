import "dotenv/config";
import { defineConfig, env } from "prisma/config";

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