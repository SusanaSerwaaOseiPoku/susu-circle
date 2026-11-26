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

  if (error?.code === 11000) {
    return response
      .status(409)
      .json({ message: "An account with this email already exists." });
  }

  const status =
    Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
      ? error.status
      : Number.isInteger(error?.statusCode) &&
          error.statusCode >= 400 &&
          error.statusCode < 600
        ? error.statusCode
        : 500;
  const message = status >= 500 ? "Internal server error." : error.message;
  return response.status(status).json({ message });
}
