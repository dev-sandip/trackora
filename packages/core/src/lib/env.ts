import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, { message: "DATABASE_URL is required" }),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.url().default("http://localhost:3000"),
});

export const ENV = envSchema.parse(process.env);