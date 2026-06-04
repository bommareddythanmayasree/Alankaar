"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../db/prisma");
const tokens_1 = require("./tokens");
const router = (0, express_1.Router)();
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    role: zod_1.z.enum(["ADMIN", "WAREHOUSE_MANAGER", "BRANCH_MANAGER"]),
});
router.post("/login", async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: "Invalid input", issues: parsed.error.issues });
    const { email, password, role } = parsed.data;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== role)
        return res.status(401).json({ message: "Invalid role for user" });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: "Invalid credentials" });
    const token = (0, tokens_1.signAccessToken)({ sub: user.id, role: user.role });
    return res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
        },
    });
});
exports.authRoutes = router;
