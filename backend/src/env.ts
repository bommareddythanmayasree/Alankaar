import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(20),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
});

export const env = EnvSchema.parse(process.env);

