import mongoose from "mongoose";
import Member from "../models/Member.js";
import asyncHandler from "./asyncHandler.js";
import { createHttpError } from "./errors.js";

const validateContribution = asyncHandler(async (request, _response, next) => {
  const group = request.group;
  if (!group) {
    return next(createHttpError(404, "Group not found."));
  }

  const memberId = request.body?.member ?? request.body?.memberId;
  if (!memberId) {
    return next(createHttpError(404, "Member not found in this group."));
  }
  if (!mongoose.isValidObjectId(memberId)) {
    return next(createHttpError(400, "Invalid member ID."));
  }

  const member = await Member.findById(memberId);
  if (!member || String(member.group) !== String(group._id)) {
    return next(createHttpError(404, "Member not found in this group."));
  }

  const amount = Number(request.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return next(
      createHttpError(400, "Contribution amount must be greater than 0."),
    );
  }

  request.member = member;
  request.validatedContribution = { amount };
  return next();
});

export default validateContribution;
