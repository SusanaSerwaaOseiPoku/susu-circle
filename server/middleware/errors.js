const MONGO_DUPLICATE_KEY_CODE = 11000;
const MIN_HTTP_ERROR_STATUS = 400;
const MAX_HTTP_ERROR_STATUS = 600;
const INTERNAL_SERVER_ERROR_STATUS = 500;

function isValidHttpErrorStatus(status) {
  return (
    Number.isInteger(status) &&
    status >= MIN_HTTP_ERROR_STATUS &&
    status < MAX_HTTP_ERROR_STATUS
  );
}

export function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function notFound(_request, _response, next) {
  next(createHttpError(404, "Endpoint not found."));
}

export function errorHandler(error, _request, response, _next) {
  if (error?.name === "CastError") {
    return response.status(400).json({ message: "Invalid ID format." });
  }

  if (error?.name === "ValidationError") {
    const firstMessage =
      Object.values(error.errors || {})[0]?.message || "Validation failed.";
    return response.status(400).json({ message: firstMessage });
  }

  if (error?.code === MONGO_DUPLICATE_KEY_CODE) {
    return response
      .status(409)
      .json({ message: "An account with this email already exists." });
  }

  const status = isValidHttpErrorStatus(error?.status)
    ? error.status
    : isValidHttpErrorStatus(error?.statusCode)
      ? error.statusCode
      : INTERNAL_SERVER_ERROR_STATUS;
  const message =
    status >= INTERNAL_SERVER_ERROR_STATUS
      ? "Internal server error."
      : error.message;
  return response.status(status).json({ message });
}
