import jwt from "jsonwebtoken";
import { createHttpError } from "./errors.js";

const BEARER_HEADER_PATTERN = /^Bearer\s+(.+)$/i;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw createHttpError(500, "JWT_SECRET is not configured.");
  }
  return secret;
}

export default function requireAuth(request, _response, next) {
  const authorizationHeader = request.headers.authorization;
  const bearerTokenMatch =
    typeof authorizationHeader === "string"
      ? BEARER_HEADER_PATTERN.exec(authorizationHeader.trim())
      : null;

  if (!bearerTokenMatch) {
    return next(createHttpError(401, "Authentication required."));
  }

  try {
    const tokenPayload = jwt.verify(bearerTokenMatch[1], getJwtSecret());
    request.user = {
      id: String(tokenPayload.sub),
      email: tokenPayload.email,
      name: tokenPayload.name,
    };
    return next();
  } catch (error) {
    if (error.status === 500) {
      return next(error);
    }
    return next(createHttpError(401, "Invalid or expired token."));
  }
}
