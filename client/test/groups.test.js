import assert from "node:assert/strict";
import test from "node:test";
import {
  addMember,
  createGroup,
  recordContribution,
  removeMember,
  togglePaid,
} from "../src/state/groupOperations.js";

const groups = [
  {
    id: "circle-1",
    name: "Market Circle",
    contributionAmount: 50,
    frequency: "weekly",
    startDate: "2026-11-01",
    currentRound: 1,
    members: [{ id: "ama", name: "Ama", paid: false }],
    contributions: [],
  },
];

test("creates a group with validated schedule and empty member lists", () => {
  const created = createGroup(groups, {
    name: "School Circle",
    contributionAmount: "25",
    frequency: "monthly",
    startDate: "2026-11-15",
  }, "circle-2");

  assert.equal(created[1].id, "circle-2");
  assert.equal(created[1].contributionAmount, 25);
  assert.deepEqual(created[1].members, []);
  assert.deepEqual(created[1].contributions, []);
  assert.throws(
    () => createGroup(groups, { name: "", contributionAmount: 0 }),
    /Group name/,
  );
});

test("adds and removes a member with their contribution history", () => {
  const withMember = addMember(groups, "circle-1", "Esi", "esi");
  assert.equal(withMember[0].members.length, 2);
  assert.throws(
    () => addMember(withMember, "circle-1", "esi", "duplicate"),
    /already in this group/,
  );

  const withContribution = recordContribution(
    withMember,
    "circle-1",
    { memberId: "esi", amount: 50, date: "2026-11-10" },
    "c-1",
  );
  const withoutMember = removeMember(withContribution, "circle-1", "esi");
  assert.equal(withoutMember[0].members.length, 1);
  assert.equal(withoutMember[0].contributions.length, 1);
  assert.equal(withoutMember[0].contributions[0].memberName, "Esi");
});

test("toggle paid changes member status without changing contribution history", () => {
  const recorded = recordContribution(
    groups,
    "circle-1",
    { memberId: "ama", amount: 50, date: "2026-11-10" },
    "c-1",
  );
  const unpaid = togglePaid(recorded, "circle-1", "ama");
  assert.equal(unpaid[0].members[0].paid, false);
  assert.equal(unpaid[0].contributions.length, 1);

  const paid = togglePaid(unpaid, "circle-1", "ama");
  assert.equal(paid[0].members[0].paid, true);
  assert.equal(paid[0].contributions.length, 1);
});

test("records a contribution and rejects future or mismatched amounts", () => {
  const recorded = recordContribution(
    groups,
    "circle-1",
    { memberId: "ama", amount: 50, date: "2026-11-10" },
    "c-1",
  );
  assert.equal(recorded[0].members[0].paid, true);
  assert.equal(recorded[0].contributions[0].id, "c-1");

  assert.throws(
    () =>
      recordContribution(
        groups,
        "circle-1",
        { memberId: "ama", amount: 25, date: "2026-11-10" },
      ),
    /agreed amount/,
  );
  assert.throws(
    () =>
      recordContribution(
        groups,
        "circle-1",
        { memberId: "ama", amount: 50, date: "2999-01-01" },
      ),
    /future/,
  );
});

test("supports MongoDB _id identifiers on groups, members, and contributions", () => {
  const mongoGroups = [
    {
      _id: "6745a1b2c3d4e5f60718293a",
      name: "Atlas Circle",
      contributionAmount: 40,
      frequency: "weekly",
      startDate: "2026-11-01",
      currentRound: 1,
      members: [
        { _id: "6745a1b2c3d4e5f60718293b", name: "Ama", paid: false },
      ],
      contributions: [],
    },
  ];

  const withMember = addMember(
    mongoGroups,
    "6745a1b2c3d4e5f60718293a",
    "Esi",
    "6745a1b2c3d4e5f60718293c",
  );
  assert.equal(withMember[0].members.length, 2);

  const paid = togglePaid(
    withMember,
    "6745a1b2c3d4e5f60718293a",
    "6745a1b2c3d4e5f60718293b",
  );
  assert.equal(paid[0].members[0].paid, true);

  const recorded = recordContribution(
    paid,
    "6745a1b2c3d4e5f60718293a",
    {
      memberId: "6745a1b2c3d4e5f60718293c",
      amount: 40,
      date: "2026-11-15",
    },
    "6745a1b2c3d4e5f60718293d",
  );
  assert.equal(recorded[0].contributions.length, 1);
  assert.equal(recorded[0].contributions[0]._id, "6745a1b2c3d4e5f60718293d");

  const removed = removeMember(
    recorded,
    "6745a1b2c3d4e5f60718293a",
    "6745a1b2c3d4e5f60718293c",
  );
  assert.equal(removed[0].members.length, 1);
});
