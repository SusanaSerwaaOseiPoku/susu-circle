import mongoose from "mongoose";
import Group from "../models/Group.js";
import asyncHandler from "./asyncHandler.js";
import { createHttpError } from "./errors.js";

function createLookupGroup(required) {
  return asyncHandler(async (request, _response, next) => {
    let id;
    if (request.params.id !== undefined) {
      id = request.params.id;
    } else if (request.body?.group !== undefined) {
      id = request.body.group;
    } else if (request.body?.groupId !== undefined) {
      id = request.body.groupId;
    } else if (request.query.group !== undefined) {
      id = request.query.group;
    } else if (request.query.groupId !== undefined) {
      id = request.query.groupId;
    }

    if (id === undefined || id === "") {
      if (required) {
        return next(createHttpError(404, "Group not found."));
      }
      return next();
    }

    if (!mongoose.isValidObjectId(id)) {
      return next(createHttpError(400, "Invalid group ID."));
    }

    const group = await Group.findById(id)
      .populate("owner", "email")
      .populate("memberCount");

    if (!group) {
      return next(createHttpError(404, "Group not found."));
    }

    request.group = group;
    return next();
  });
}

const findGroup = createLookupGroup(false);
export const requireGroup = createLookupGroup(true);
export default findGroup;
