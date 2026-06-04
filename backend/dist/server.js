"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./env");
const health_1 = require("./api/health");
const routes_1 = require("./auth/routes");
const dashboard_1 = require("./api/dashboard");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: "2mb" }));
app.get("/", (_req, res) => res.json({ name: "ALANKAR ERP SYSTEM API" }));
app.use("/api/health", health_1.healthRoutes);
app.use("/api/auth", routes_1.authRoutes);
app.use("/api/dashboard", dashboard_1.dashboardRoutes);
app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
});
app.listen(env_1.env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env_1.env.PORT}`);
});
