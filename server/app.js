import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { errorHandler, notFound } from "./middleware/errors.js";
import logger from "./middleware/logger.js";
import authRouter from "./routes/auth.js";
import contributionsRouter from "./routes/contributions.js";
import groupsRouter from "./routes/groups.js";
import membersRouter from "./routes/members.js";

const DB_READY_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export function getHealthPayload() {
  const readyState = mongoose.connection.readyState;
  const dbStatus = DB_READY_STATES[readyState] || "unknown";
  const connected = readyState === 1;

  return {
    httpStatus: connected ? 200 : 503,
    body: {
      status: connected ? "ok" : "degraded",
      database: {
        status: dbStatus,
        name: mongoose.connection.name || null,
      },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  };
}

function normalizeOrigin(origin) {
  return origin.trim().replace(/\/+$/, "");
}

function originMatchesRule(origin, rule) {
  const cleanOrigin = normalizeOrigin(origin);
  const cleanRule = normalizeOrigin(rule);
  if (!cleanRule.includes("*")) {
    return cleanOrigin === cleanRule;
  }
  const escaped = cleanRule
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]+");
  return new RegExp(`^${escaped}$`).test(cleanOrigin);
}

export function getCorsOptions(clientUrl = process.env.CLIENT_URL) {
  const allowedRules =
    typeof clientUrl === "string"
      ? clientUrl
          .split(",")
          .map((origin) => normalizeOrigin(origin))
          .filter(Boolean)
      : [];

  return {
    origin(origin, callback) {
      if (
        !origin ||
        allowedRules.length === 0 ||
        allowedRules.some((rule) => originMatchesRule(origin, rule))
      ) {
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
    const { httpStatus, body } = getHealthPayload();
    response.status(httpStatus).json(body);
  });

  app.use("/auth", authRouter);
  app.use("/groups", groupsRouter);
  app.use("/members", membersRouter);
  app.use("/contributions", contributionsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
