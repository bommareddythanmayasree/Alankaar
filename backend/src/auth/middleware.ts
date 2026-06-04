import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

type AuthUser = {
  id: string;
  role: "ADMIN" | "WAREHOUSE_MANAGER" | "BRANCH_MANAGER";
};

declare global {
  // eslint-disable-next-line no-var
  var __authUserBrand: unknown;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  const token = header.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: AuthUser["role"] };
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

