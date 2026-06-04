import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./env";
import { healthRoutes } from "./api/health";
import { authRoutes } from "./auth/routes";
import { dashboardRoutes } from "./api/dashboard";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => res.json({ name: "ALANKAR ERP SYSTEM API" }));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

