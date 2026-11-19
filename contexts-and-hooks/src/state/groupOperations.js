function createId() {
  return globalThis.crypto.randomUUID();
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
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) throw new Error("Group not found.");
  return group;
}

function updateGroup(groups, groupId, update) {
  getGroup(groups, groupId);
  return groups.map((group) =>
    group.id === groupId ? update(group) : group,
  );
}

export function createGroup(groups, details, id = createId()) {
  const name = details.name.trim();
  const contributionAmount = Number(details.contributionAmount);
  if (name.length < 3 || name.length > 60) {
    throw new Error("Group name must be 3 to 60 characters.");
  }
  if (!Number.isSafeInteger(contributionAmount) || contributionAmount <= 0) {
    throw new Error("Contribution amount must be a positive whole number.");
  }
  if (!["weekly", "monthly"].includes(details.frequency)) {
    throw new Error("Choose a weekly or monthly frequency.");
  }
  if (!isDateOnly(details.startDate)) {
    throw new Error("Choose a valid start date.");
  }

  return [
    ...groups,
    {
      id,
      name,
      contributionAmount,
      frequency: details.frequency,
      startDate: details.startDate,
      currentRound: 1,
      members: [],
      contributions: [],
    },
  ];
}

export function addMember(groups, groupId, name, memberId = createId()) {
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 60) {
    throw new Error("Member name must be 2 to 60 characters.");
  }

  return updateGroup(groups, groupId, (group) => {
    if (
      group.members.some(
        (member) => member.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase(),
      )
    ) {
      throw new Error("That member is already in this group.");
    }

    return {
      ...group,
      members: [...group.members, { id: memberId, name: cleanName, paid: false }],
    };
  });
}

export function removeMember(groups, groupId, memberId) {
  return updateGroup(groups, groupId, (group) => {
    if (!group.members.some((member) => member.id === memberId)) {
      throw new Error("Member not found.");
    }

    return {
      ...group,
      members: group.members.filter((member) => member.id !== memberId),
      contributions: group.contributions.filter(
        (contribution) => contribution.memberId !== memberId,
      ),
    };
  });
}

export function togglePaid(
  groups,
  groupId,
  memberId,
  contributionId = createId(),
  date = todayDateOnly(),
) {
  return updateGroup(groups, groupId, (group) => {
    const member = group.members.find((entry) => entry.id === memberId);
    if (!member) throw new Error("Member not found.");

    const alreadyPaid = group.contributions.some(
      (contribution) =>
        contribution.memberId === memberId &&
        contribution.round === group.currentRound,
    );
    const contributions = group.contributions.filter(
      (contribution) =>
        contribution.memberId !== memberId ||
        contribution.round !== group.currentRound,
    );

    if (member.paid || alreadyPaid) {
      return {
        ...group,
        members: group.members.map((entry) =>
          entry.id === memberId ? { ...entry, paid: false } : entry,
        ),
        contributions,
      };
    }

    return {
      ...group,
      members: group.members.map((entry) =>
        entry.id === memberId ? { ...entry, paid: true } : entry,
      ),
      contributions: [
        ...contributions,
        {
          id: contributionId,
          memberId,
          amount: group.contributionAmount,
          date,
          round: group.currentRound,
        },
      ],
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
  const member = group.members.find((entry) => entry.id === details.memberId);
  if (!member) throw new Error("Choose a member of this group.");

  const amount = Number(details.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Contribution amount must be a positive whole number.");
  }
  if (amount !== group.contributionAmount) {
    throw new Error(`Contribution must match the agreed amount of ${group.contributionAmount}.`);
  }
  if (!isDateOnly(details.date)) {
    throw new Error("Choose a valid contribution date.");
  }
  if (details.date > todayDateOnly()) {
    throw new Error("Contribution date cannot be in the future.");
  }
  if (
    group.contributions.some(
      (contribution) =>
        contribution.memberId === details.memberId &&
        contribution.round === group.currentRound,
    )
  ) {
    throw new Error("This member has already contributed this round.");
  }

  return updateGroup(groups, groupId, (currentGroup) => ({
    ...currentGroup,
    members: currentGroup.members.map((entry) =>
      entry.id === details.memberId ? { ...entry, paid: true } : entry,
    ),
    contributions: [
      ...currentGroup.contributions,
      {
        id: contributionId,
        memberId: details.memberId,
        amount,
        date: details.date,
        round: currentGroup.currentRound,
      },
    ],
  }));
}
