import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { signAccessToken } from "./tokens";

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["ADMIN", "WAREHOUSE_MANAGER", "BRANCH_MANAGER"]),
});

router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input", issues: parsed.error.issues });

  const { email, password, role } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  if (user.role !== role) return res.status(401).json({ message: "Invalid role for user" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signAccessToken({ sub: user.id, role: user.role });

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

export const authRoutes = router;

