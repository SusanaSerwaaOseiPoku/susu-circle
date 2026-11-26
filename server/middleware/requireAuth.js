import jwt from "jsonwebtoken";
import { createHttpError } from "./errors.js";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw createHttpError(500, "JWT_SECRET is not configured.");
  }
  return secret;
}

export default function requireAuth(request, _response, next) {
  const header = request.headers.authorization;
  const match = typeof header === "string" ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  if (!match) {
    return next(createHttpError(401, "Authentication required."));
  }

  try {
    const payload = jwt.verify(match[1], getJwtSecret());
    request.user = {
      id: String(payload.sub),
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch (error) {
    if (error.status === 500) {
      return next(error);
    }
    return next(createHttpError(401, "Invalid or expired token."));
  }
}
