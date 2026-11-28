import mongoose from "mongoose";
import Group from "../models/Group.js";
import asyncHandler from "./asyncHandler.js";
import { createHttpError } from "./errors.js";

function extractGroupId(request) {
  if (request.params.id !== undefined) return request.params.id;
  if (request.body?.group !== undefined) return request.body.group;
  if (request.body?.groupId !== undefined) return request.body.groupId;
  if (request.query.group !== undefined) return request.query.group;
  if (request.query.groupId !== undefined) return request.query.groupId;
  return undefined;
}

function createGroupLookupMiddleware(isRequired) {
  return asyncHandler(async (request, _response, next) => {
    const groupId = extractGroupId(request);

    if (groupId === undefined || groupId === "") {
      if (isRequired) {
        return next(createHttpError(404, "Group not found."));
      }
      return next();
    }

    if (!mongoose.isValidObjectId(groupId)) {
      return next(createHttpError(400, "Invalid group ID."));
    }

    const group = await Group.findById(groupId)
      .populate("owner", "email")
      .populate("memberCount");

    if (!group) {
      return next(createHttpError(404, "Group not found."));
    }

    request.group = group;
    return next();
  });
}

const findGroup = createGroupLookupMiddleware(false);
export const requireGroup = createGroupLookupMiddleware(true);
export default findGroup;
