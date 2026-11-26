import "dotenv/config";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import logger from "./middleware/logger.js";
import authRouter from "./routes/auth.js";
import contributionsRouter from "./routes/contributions.js";
import groupsRouter from "./routes/groups.js";
import membersRouter from "./routes/members.js";

const PORT = Number(process.env.PORT) || 3001;

export function getCorsOptions(clientUrl = process.env.CLIENT_URL) {
  const allowedOrigins = typeof clientUrl === "string"
    ? clientUrl
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  };
}

export function createApp() {
  const app = express();

  app.use(logger);
  app.use(cors(getCorsOptions()));
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/groups", groupsRouter);
  app.use("/members", membersRouter);
  app.use("/contributions", contributionsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export async function startServer() {
  await connectDB();
  const app = createApp();
  return app.listen(PORT, () => {
    console.log(`Susu Circle API listening on port ${PORT}`);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer().catch((error) => {
    console.error("Failed to start Susu Circle API:", error.message);
    process.exit(1);
  });
}
