import { toPlainObject } from "../utils/request.js";
import { createHttpError } from "./errors.js";

const VALID_FREQUENCIES = new Set(["weekly", "monthly"]);

function parseGroupName(value, errorMessage) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) {
    throw createHttpError(400, errorMessage);
  }
  return name;
}

function parseContributionAmount(value) {
  const contributionAmount = Number(value);
  if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
    throw createHttpError(400, "Contribution amount must be greater than 0.");
  }
  return contributionAmount;
}

function parseFrequency(value) {
  if (typeof value !== "string" || !VALID_FREQUENCIES.has(value)) {
    throw createHttpError(400, "Frequency must be weekly or monthly.");
  }
  return value;
}

function parseStartDate(value) {
  const startDate = typeof value === "string" ? value.trim() : "";
  if (!startDate) {
    throw createHttpError(400, "Start date must be a non-empty string.");
  }
  return startDate;
}

function parseCurrentRound(value) {
  const currentRound = Number(value);
  if (!Number.isInteger(currentRound) || currentRound <= 0) {
    throw createHttpError(400, "Current round must be a positive integer.");
  }
  return currentRound;
}

const GROUP_UPDATE_PARSERS = {
  name: (value) => parseGroupName(value, "Group name cannot be empty."),
  contributionAmount: parseContributionAmount,
  frequency: parseFrequency,
  startDate: parseStartDate,
  currentRound: parseCurrentRound,
};

export default function validateGroup(request, _response, next) {
  try {
    const body = toPlainObject(request.body);
    const name = parseGroupName(body.name, "Group name is required.");
    const contributionAmount = parseContributionAmount(body.contributionAmount);

    request.validatedGroup = { ...body, name, contributionAmount };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function validateGroupUpdate(request, _response, next) {
  try {
    const body = toPlainObject(request.body);
    const updates = {};

    for (const [field, parseField] of Object.entries(GROUP_UPDATE_PARSERS)) {
      if (body[field] !== undefined) {
        updates[field] = parseField(body[field]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return next(
        createHttpError(400, "Provide at least one field to update."),
      );
    }

    request.validatedGroupUpdate = updates;
    return next();
  } catch (error) {
    return next(error);
  }
}
