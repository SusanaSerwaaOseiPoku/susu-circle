export default function asyncHandler(fn) {
  return function wrappedAsyncHandler(request, response, next) {
    Promise.resolve(fn(request, response, next)).catch(next);
  };
}
