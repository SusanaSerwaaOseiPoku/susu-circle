import asyncHandler from "../middleware/asyncHandler.js";
import Contribution from "../models/Contribution.js";
import { getTodayIsoDate, toPlainObject } from "../utils/request.js";

export const listContributions = asyncHandler(async (request, response) => {
  const filter = request.group ? { group: request.group._id } : {};
  const contributions = await Contribution.find(filter)
    .populate("member", "name paid")
    .populate("group", "name")
    .sort({ createdAt: -1 });
  response.json(contributions);
});

export const createContribution = asyncHandler(async (request, response) => {
  const body = toPlainObject(request.body);
  const created = await Contribution.create({
    group: request.group._id,
    member: request.member._id,
    amount: request.validatedContribution.amount,
    date:
      typeof body.date === "string" && body.date.trim()
        ? body.date.trim()
        : getTodayIsoDate(),
    round:
      Number(body.round) > 0 ? Number(body.round) : request.group.currentRound,
  });

  request.member.paid = true;
  await request.member.save();

  const populated = await Contribution.findById(created._id)
    .populate("member", "name paid")
    .populate("group", "name");

  response.status(201).json(populated || created);
});
