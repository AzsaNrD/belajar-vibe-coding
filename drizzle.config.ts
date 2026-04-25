import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DATABASE_HOST!,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD || undefined,
    database: process.env.DATABASE_NAME!,
    port: Number(process.env.DATABASE_PORT!),
  },
});
