import asyncHandler from "../middleware/asyncHandler.js";
import Contribution from "../models/Contribution.js";
import Group from "../models/Group.js";
import Member from "../models/Member.js";
import { calculateContributionTotal } from "../utils/contributions.js";
import { getTodayIsoDate } from "../utils/request.js";

function findPopulatedGroupById(groupId) {
  return Group.findById(groupId)
    .populate("owner", "email")
    .populate("memberCount");
}

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  name_asc: { name: 1 },
  "-name": { name: -1 },
  name_desc: { name: -1 },
  amount: { contributionAmount: 1 },
  amount_asc: { contributionAmount: 1 },
  "-amount": { contributionAmount: -1 },
  amount_desc: { contributionAmount: -1 },
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseGroupQuery(query, baseFilter = {}) {
  const filter = { ...baseFilter };
  const rawSearch = query.search ?? query.q ?? "";
  const search = typeof rawSearch === "string" ? rawSearch.trim() : "";
  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: "i" };
  }

  const rawSort = typeof query.sort === "string" ? query.sort.trim() : "newest";
  const sortSpec = SORT_OPTIONS[rawSort] || SORT_OPTIONS.newest;

  const parsedPage = Number.parseInt(query.page, 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const parsedLimit = Number.parseInt(query.limit, 10);
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 50)
      : 6;

  return { filter, sortSpec, page, limit };
}

async function queryPaginatedGroups(query, baseFilter = {}) {
  const { filter, sortSpec, page, limit } = parseGroupQuery(query, baseFilter);
  const skip = (page - 1) * limit;

  const [total, groups] = await Promise.all([
    Group.countDocuments(filter),
    Group.find(filter)
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .populate("owner", "email")
      .populate("memberCount"),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    groups,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  };
}

export const listGroups = asyncHandler(async (request, response) => {
  const result = await queryPaginatedGroups(request.query);
  response.json(result);
});

export const listMyGroups = asyncHandler(async (request, response) => {
  const result = await queryPaginatedGroups(request.query, {
    owner: request.user.id,
  });
  response.json(result);
});

export function getGroup(request, response) {
  response.json(request.group);
}

export const listGroupMembers = asyncHandler(async (request, response) => {
  const members = await Member.find({ group: request.group._id })
    .populate("user", "email")
    .sort({ createdAt: 1 });
  response.json(members);
});

export const listGroupContributions = asyncHandler(
  async (request, response) => {
    const contributions = await Contribution.find({ group: request.group._id })
      .populate("member", "name paid")
      .sort({ createdAt: -1 });

    const totalSaved = calculateContributionTotal(contributions);

    response.json({
      group: request.group,
      contributions,
      totalSaved,
    });
  },
);

export const createGroup = asyncHandler(async (request, response) => {
  const body = request.validatedGroup;
  const created = await Group.create({
    name: body.name,
    contributionAmount: body.contributionAmount,
    frequency: body.frequency || "weekly",
    startDate: body.startDate || getTodayIsoDate(),
    currentRound: Number(body.currentRound) > 0 ? Number(body.currentRound) : 1,
    owner: request.user.id,
  });

  const populated = await findPopulatedGroupById(created._id);
  response.status(201).json(populated || created);
});

export const updateGroup = asyncHandler(async (request, response) => {
  Object.assign(request.group, request.validatedGroupUpdate);
  await request.group.save();

  const populated = await findPopulatedGroupById(request.group._id);
  response.json(populated || request.group);
});

export const deleteGroup = asyncHandler(async (request, response) => {
  const groupId = request.group._id;
  await Promise.all([
    Member.deleteMany({ group: groupId }),
    Contribution.deleteMany({ group: groupId }),
    Group.findByIdAndDelete(groupId),
  ]);
  response.status(204).end();
});
