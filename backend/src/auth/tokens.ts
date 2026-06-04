import jwt from "jsonwebtoken";
import { env } from "../env";

export type JwtPayload = {
  sub: string;
  role: "ADMIN" | "WAREHOUSE_MANAGER" | "BRANCH_MANAGER";
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(
  payload,
  env.JWT_SECRET as string,
  {
    expiresIn: "7d",
  }
);
}

