import { toPlainObject } from "../utils/request.js";
import { createHttpError } from "./errors.js";

export default function validateMember(request, _response, next) {
  const body = toPlainObject(request.body);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return next(createHttpError(400, "Member name is required."));
  }

  request.validatedMember = { ...body, name };
  next();
}
