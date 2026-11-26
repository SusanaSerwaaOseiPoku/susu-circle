export default function logger(request, response, next) {
  const startedAt = Date.now();
  response.on("finish", () => {
    console.log(
      `${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`,
    );
  });
  next();
}
