"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(20),
    JWT_EXPIRES_IN: zod_1.z.string().min(1).default("7d"),
    CORS_ORIGIN: zod_1.z.string().min(1).default("http://localhost:5173"),
});
exports.env = EnvSchema.parse(process.env);
