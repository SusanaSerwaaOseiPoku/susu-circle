import mongoose from "mongoose";
import { createHttpError } from "./errors.js";

export default function checkId(resourceLabel = "resource", paramName = "id") {
  return function validateObjectIdParam(request, _response, next) {
    const rawId = request.params[paramName];
    if (!mongoose.isValidObjectId(rawId)) {
      return next(createHttpError(400, `Invalid ${resourceLabel} ID.`));
    }
    return next();
  };
}
