import { toPlainObject } from "../utils/request.js";
import { createHttpError } from "./errors.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(request, _response, next) {
  const body = toPlainObject(request.body);
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const rawName = typeof body.name === "string" ? body.name.trim() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return next(createHttpError(400, "A valid email address is required."));
  }
  if (password.length < 6) {
    return next(
      createHttpError(400, "Password must be at least 6 characters."),
    );
  }

  request.validatedAuth = {
    name: rawName || email.split("@")[0],
    email,
    password,
  };
  return next();
}

export function validateLogin(request, _response, next) {
  const body = toPlainObject(request.body);
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return next(createHttpError(401, "Invalid email or password."));
  }

  request.validatedAuth = { email, password };
  return next();
}
