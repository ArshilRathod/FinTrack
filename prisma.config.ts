import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: "server/.env" });

export default defineConfig({
  schema: "server/prisma/schema.prisma",
  migrations: {
    path: "server/prisma/migrations"
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"]
  }
});
