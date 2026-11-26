import { createHttpError } from "./errors.js";

const VALID_FREQUENCIES = new Set(["weekly", "monthly"]);

function normalizeBody(body) {
  return body !== null && typeof body === "object" && !Array.isArray(body)
    ? body
    : {};
}

export default function validateGroup(request, _response, next) {
  const body = normalizeBody(request.body);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return next(createHttpError(400, "Group name is required."));
  }

  const contributionAmount = Number(body.contributionAmount);
  if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
    return next(
      createHttpError(400, "Contribution amount must be greater than 0."),
    );
  }

  request.validatedGroup = { ...body, name, contributionAmount };
  next();
}

export function validateGroupUpdate(request, _response, next) {
  const body = normalizeBody(request.body);
  const updates = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return next(createHttpError(400, "Group name cannot be empty."));
    }
    updates.name = name;
  }

  if (body.contributionAmount !== undefined) {
    const contributionAmount = Number(body.contributionAmount);
    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      return next(
        createHttpError(400, "Contribution amount must be greater than 0."),
      );
    }
    updates.contributionAmount = contributionAmount;
  }

  if (body.frequency !== undefined) {
    if (typeof body.frequency !== "string" || !VALID_FREQUENCIES.has(body.frequency)) {
      return next(createHttpError(400, "Frequency must be weekly or monthly."));
    }
    updates.frequency = body.frequency;
  }

  if (body.startDate !== undefined) {
    const startDate = typeof body.startDate === "string" ? body.startDate.trim() : "";
    if (!startDate) {
      return next(createHttpError(400, "Start date must be a non-empty string."));
    }
    updates.startDate = startDate;
  }

  if (body.currentRound !== undefined) {
    const currentRound = Number(body.currentRound);
    if (!Number.isInteger(currentRound) || currentRound <= 0) {
      return next(createHttpError(400, "Current round must be a positive integer."));
    }
    updates.currentRound = currentRound;
  }

  if (Object.keys(updates).length === 0) {
    return next(createHttpError(400, "Provide at least one field to update."));
  }

  request.validatedGroupUpdate = updates;
  next();
}
