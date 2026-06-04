"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../env");
function requireAuth(req, res, next) {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer "))
        return res.status(401).json({ message: "Unauthorized" });
    const token = header.slice("Bearer ".length);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = { id: decoded.sub, role: decoded.role };
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ message: "Forbidden" });
        next();
    };
}
