import { createHttpError } from "./errors.js";

export default function checkOwner(request, _response, next) {
  if (!request.user) {
    return next(createHttpError(401, "Authentication required."));
  }
  if (!request.group) {
    return next(createHttpError(404, "Group not found."));
  }

  const ownerId =
    request.group.owner &&
    typeof request.group.owner === "object" &&
    "_id" in request.group.owner
      ? request.group.owner._id
      : request.group.owner;

  if (String(ownerId) !== String(request.user.id)) {
    return next(
      createHttpError(
        403,
        "Only the group owner can update or delete this group.",
      ),
    );
  }

  return next();
}
