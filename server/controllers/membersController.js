import mongoose from "mongoose";
import asyncHandler from "../middleware/asyncHandler.js";
import { createHttpError } from "../middleware/errors.js";
import Member from "../models/Member.js";

export const listMembers = asyncHandler(async (request, response) => {
  const filter = request.group ? { group: request.group._id } : {};
  const members = await Member.find(filter)
    .populate("group", "name")
    .populate("user", "email")
    .sort({ createdAt: 1 });
  response.json(members);
});

export const createMember = asyncHandler(async (request, response) => {
  const body = request.validatedMember;
  const userRef =
    body.user && mongoose.isValidObjectId(body.user)
      ? body.user
      : request.user.id;

  const created = await Member.create({
    group: request.group._id,
    user: userRef,
    name: body.name,
    paid: body.paid === true || body.status === "paid",
  });

  const populated = await Member.findById(created._id)
    .populate("group", "name")
    .populate("user", "email");

  response.status(201).json(populated || created);
});

export const updateMember = asyncHandler(async (request, response, next) => {
  const member = await Member.findById(request.params.id);
  if (!member) {
    return next(createHttpError(404, "Member not found."));
  }

  const body =
    request.body !== null &&
    typeof request.body === "object" &&
    !Array.isArray(request.body)
      ? request.body
      : {};
  if (typeof body.paid === "boolean") {
    member.paid = body.paid;
  } else if (body.status === "paid" || body.status === "pending") {
    member.paid = body.status === "paid";
  } else {
    return next(createHttpError(400, "Status must be paid or pending."));
  }

  const updatedMember = await member.save();
  return response.json(updatedMember);
});

export const deleteMember = asyncHandler(async (request, response, next) => {
  const deleted = await Member.findByIdAndDelete(request.params.id);
  if (!deleted) {
    return next(createHttpError(404, "Member not found."));
  }

  return response.status(204).end();
});
