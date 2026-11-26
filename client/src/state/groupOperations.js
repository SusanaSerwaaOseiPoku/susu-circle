function createId() {
  return globalThis.crypto.randomUUID();
}

export function getEntityId(entity) {
  if (!entity || typeof entity !== "object") return "";
  const value = entity._id ?? entity.id;
  return value === undefined || value === null ? "" : String(value);
}

function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function getGroup(groups, groupId) {
  const target = String(groupId);
  const group = groups.find((entry) => getEntityId(entry) === target);
  if (!group) throw new Error("Group not found.");
  return group;
}

function updateGroup(groups, groupId, update) {
  const target = String(groupId);
  getGroup(groups, target);
  return groups.map((group) =>
    getEntityId(group) === target ? update(group) : group,
  );
}

export function createGroup(groups, details, id = createId()) {
  const input = details && typeof details === "object" ? details : {};
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const contributionAmount = Number(input.contributionAmount);
  if (name.length < 3 || name.length > 60) {
    throw new Error("Group name must be 3 to 60 characters.");
  }
  if (!Number.isSafeInteger(contributionAmount) || contributionAmount <= 0) {
    throw new Error("Contribution amount must be a positive whole number.");
  }
  if (!["weekly", "monthly"].includes(input.frequency)) {
    throw new Error("Choose a weekly or monthly frequency.");
  }
  if (!isDateOnly(input.startDate)) {
    throw new Error("Choose a valid start date.");
  }

  return [
    ...groups,
    {
      _id: id,
      id,
      name,
      contributionAmount,
      frequency: input.frequency,
      startDate: input.startDate,
      currentRound: 1,
      members: [],
      contributions: [],
    },
  ];
}

export function addMember(groups, groupId, name, memberId = createId()) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (cleanName.length < 2 || cleanName.length > 60) {
    throw new Error("Member name must be 2 to 60 characters.");
  }

  return updateGroup(groups, groupId, (group) => {
    if (
      group.members.some(
        (member) =>
          member.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase(),
      )
    ) {
      throw new Error("That member is already in this group.");
    }

    return {
      ...group,
      members: [
        ...group.members,
        { _id: memberId, id: memberId, name: cleanName, paid: false },
      ],
    };
  });
}

export function removeMember(groups, groupId, memberId) {
  const target = String(memberId);
  return updateGroup(groups, groupId, (group) => {
    if (!group.members.some((member) => getEntityId(member) === target)) {
      throw new Error("Member not found.");
    }

    return {
      ...group,
      members: group.members.filter((member) => getEntityId(member) !== target),
    };
  });
}

export function togglePaid(groups, groupId, memberId) {
  const target = String(memberId);
  return updateGroup(groups, groupId, (group) => {
    const member = group.members.find((entry) => getEntityId(entry) === target);
    if (!member) throw new Error("Member not found.");

    return {
      ...group,
      members: group.members.map((entry) =>
        getEntityId(entry) === target
          ? { ...entry, paid: !member.paid }
          : entry,
      ),
    };
  });
}

export function recordContribution(
  groups,
  groupId,
  details,
  contributionId = createId(),
) {
  const group = getGroup(groups, groupId);
  const input = details && typeof details === "object" ? details : {};
  const targetMemberId = String(input.memberId ?? "");
  const member = group.members.find(
    (entry) => getEntityId(entry) === targetMemberId,
  );
  if (!member) throw new Error("Choose a member of this group.");

  const amount = Number(input.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Contribution amount must be a positive whole number.");
  }
  if (amount !== group.contributionAmount) {
    throw new Error(
      `Contribution must match the agreed amount of ${group.contributionAmount}.`,
    );
  }
  if (!isDateOnly(input.date)) {
    throw new Error("Choose a valid contribution date.");
  }
  if (input.date > todayDateOnly()) {
    throw new Error("Contribution date cannot be in the future.");
  }
  if (
    group.contributions.some(
      (contribution) =>
        String(contribution.memberId) === targetMemberId &&
        contribution.round === group.currentRound,
    )
  ) {
    throw new Error("This member has already contributed this round.");
  }

  return updateGroup(groups, groupId, (currentGroup) => ({
    ...currentGroup,
    members: currentGroup.members.map((entry) =>
      getEntityId(entry) === targetMemberId ? { ...entry, paid: true } : entry,
    ),
    contributions: [
      ...currentGroup.contributions,
      {
        _id: contributionId,
        id: contributionId,
        memberId: targetMemberId,
        memberName: member.name,
        amount,
        date: input.date,
        round: currentGroup.currentRound,
      },
    ],
  }));
}
