import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, beforeEach, mock, test } from "node:test";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Contribution from "../models/Contribution.js";
import Group from "../models/Group.js";
import Member from "../models/Member.js";
import User from "../models/User.js";
import { createApp, getCorsOptions } from "../server.js";

process.env.JWT_SECRET ||= "test-only-jwt-secret-for-susu-circle-api";

let server;
let baseUrl;
let collections;

function matchesFilter(doc, filter = {}) {
  return Object.entries(filter).every(([field, expected]) => {
    const actual = doc[field];
    if (expected && typeof expected === "object" && expected.$regex !== undefined) {
      const regex = new RegExp(expected.$regex, expected.$options || "");
      return regex.test(String(actual ?? ""));
    }
    return String(actual) === String(expected);
  });
}

function compareValues(left, right, direction) {
  const a = left instanceof Date ? left.getTime() : typeof left === "string" ? left.toLowerCase() : left ?? 0;
  const b = right instanceof Date ? right.getTime() : typeof right === "string" ? right.toLowerCase() : right ?? 0;
  if (a === b) return 0;
  return a < b ? -1 * direction : 1 * direction;
}

function projectDoc(doc, select) {
  if (!doc) return null;
  const plain = typeof doc.toJSON === "function" ? doc.toJSON() : { ...doc };
  if (!select) return plain;
  const fields = select.split(/\s+/).filter(Boolean);
  const picked = { _id: plain._id };
  for (const field of fields) {
    if (field in plain) {
      picked[field] = plain[field];
    }
  }
  return picked;
}

function applyPopulate(doc, populateSteps) {
  if (!doc) return null;
  const result = typeof doc.toJSON === "function" ? doc.toJSON() : { ...doc };

  for (const { path, select } of populateSteps) {
    if (path === "memberCount") {
      result.memberCount = collections.members.filter(
        (member) => String(member.group) === String(doc._id),
      ).length;
    } else if (path === "owner") {
      const owner = collections.users.find(
        (user) => String(user._id) === String(doc.owner),
      );
      result.owner = projectDoc(owner, select);
    } else if (path === "user") {
      const user = collections.users.find(
        (entry) => String(entry._id) === String(doc.user),
      );
      result.user = projectDoc(user, select);
    } else if (path === "group") {
      const group = collections.groups.find(
        (entry) => String(entry._id) === String(doc.group),
      );
      result.group = projectDoc(group, select);
    } else if (path === "member") {
      const member = collections.members.find(
        (entry) => String(entry._id) === String(doc.member),
      );
      result.member = projectDoc(member, select);
    }
  }

  return result;
}

function makeListQuery(items) {
  let sortSpec = null;
  let skipCount = 0;
  let limitCount = null;
  const populateSteps = [];

  const query = {
    sort(spec) {
      sortSpec = spec;
      return query;
    },
    skip(count) {
      skipCount = count;
      return query;
    },
    limit(count) {
      limitCount = count;
      return query;
    },
    populate(path, select) {
      populateSteps.push({ path, select });
      return query;
    },
    exec() {
      let list = [...items];
      if (sortSpec) {
        list.sort((left, right) => {
          for (const [field, direction] of Object.entries(sortSpec)) {
            const cmp = compareValues(left[field], right[field], direction);
            if (cmp !== 0) return cmp;
          }
          return 0;
        });
      }
      if (skipCount > 0) {
        list = list.slice(skipCount);
      }
      if (limitCount !== null) {
        list = list.slice(0, limitCount);
      }
      return Promise.resolve(
        populateSteps.length > 0
          ? list.map((doc) => applyPopulate(doc, populateSteps))
          : list,
      );
    },
    then(resolve, reject) {
      return query.exec().then(resolve, reject);
    },
  };

  return query;
}

function makeSingleQuery(doc) {
  const populateSteps = [];
  const query = {
    populate(path, select) {
      populateSteps.push({ path, select });
      return query;
    },
    exec() {
      if (!doc) return Promise.resolve(null);
      if (populateSteps.length === 0) return Promise.resolve(doc);
      const populated = applyPopulate(doc, populateSteps);
      populated.save = async function savePopulated() {
        for (const [key, value] of Object.entries(populated)) {
          if (["name", "contributionAmount", "frequency", "startDate", "currentRound"].includes(key)) {
            doc[key] = value;
          }
        }
        await doc.validate();
        return doc;
      };
      return Promise.resolve(populated);
    },
    then(resolve, reject) {
      return query.exec().then(resolve, reject);
    },
  };
  return query;
}

function wireModel(Model, key) {
  let clock = 1;

  mock.method(Model, "find", (filter = {}) => {
    const matches = collections[key].filter((doc) => matchesFilter(doc, filter));
    return makeListQuery(matches);
  });

  mock.method(Model, "countDocuments", async (filter = {}) => {
    return collections[key].filter((doc) => matchesFilter(doc, filter)).length;
  });

  mock.method(Model, "findOne", async (filter = {}) => {
    return collections[key].find((doc) => matchesFilter(doc, filter)) || null;
  });

  mock.method(Model, "findById", (id) => {
    const doc =
      collections[key].find((entry) => String(entry._id) === String(id)) ||
      null;
    return makeSingleQuery(doc);
  });

  mock.method(Model, "create", async (payload) => {
    const doc = new Model(payload);
    doc.createdAt = new Date(Date.now() + clock++ * 1000);
    doc.updatedAt = doc.createdAt;
    await doc.validate();
    doc.save = async function saveMock() {
      this.updatedAt = new Date(Date.now() + clock++ * 1000);
      await this.validate();
      return this;
    };
    collections[key].push(doc);
    return doc;
  });

  mock.method(Model, "findByIdAndDelete", async (id) => {
    const index = collections[key].findIndex(
      (doc) => String(doc._id) === String(id),
    );
    if (index === -1) return null;
    const [removed] = collections[key].splice(index, 1);
    return removed;
  });

  mock.method(Model, "deleteMany", async (filter = {}) => {
    const beforeCount = collections[key].length;
    collections[key] = collections[key].filter(
      (doc) => !matchesFilter(doc, filter),
    );
    return { deletedCount: beforeCount - collections[key].length };
  });
}

before(async () => {
  collections = { users: [], groups: [], members: [], contributions: [] };
  wireModel(User, "users");
  wireModel(Group, "groups");
  wireModel(Member, "members");
  wireModel(Contribution, "contributions");

  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  collections.users = [];
  collections.groups = [];
  collections.members = [];
  collections.contributions = [];
});

after(async () => {
  mock.restoreAll();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = response.status === 204 ? undefined : await response.json();
  return { response, payload };
}

test("models define refs (owner, group, user, member), virtual memberCount, CORS CLIENT_URL, and connectDB requires MONGO_URI", async () => {
  await assert.rejects(() => connectDB(""), /MONGO_URI/);

  const corsOptions = getCorsOptions("https://app.example.com");
  await new Promise((resolve, reject) => {
    corsOptions.origin("https://app.example.com", (err, allowed) =>
      err || !allowed ? reject(err || new Error("Expected allowed")) : resolve(),
    );
  });
  await new Promise((resolve, reject) => {
    corsOptions.origin("https://evil.example.com", (err) =>
      err ? resolve() : reject(new Error("Expected blocked origin")),
    );
  });

  const pkgPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../package.json",
  );
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  assert.equal(pkg.scripts.start, "node server.js");
  assert.ok(pkg.engines?.node);

  const degradedHealth = await request("/health");
  assert.equal(degradedHealth.response.status, 503);
  assert.equal(degradedHealth.payload.status, "degraded");
  assert.equal(degradedHealth.payload.database.status, "disconnected");

  const originalReadyState = Object.getOwnPropertyDescriptor(
    mongoose.connection,
    "readyState",
  );
  Object.defineProperty(mongoose.connection, "readyState", {
    configurable: true,
    value: 1,
  });
  try {
    const healthy = await request("/health");
    assert.equal(healthy.response.status, 200);
    assert.equal(healthy.payload.status, "ok");
    assert.equal(healthy.payload.database.status, "connected");
    assert.equal(JSON.stringify(healthy.payload).includes("JWT_SECRET"), false);
    assert.equal(JSON.stringify(healthy.payload).includes("mongodb"), false);
  } finally {
    if (originalReadyState) {
      Object.defineProperty(
        mongoose.connection,
        "readyState",
        originalReadyState,
      );
    } else {
      delete mongoose.connection.readyState;
    }
  }

  assert.equal(Group.schema.path("owner").options.ref, "User");
  assert.ok(Group.schema.virtuals.memberCount);
  assert.equal(Member.schema.path("group").options.ref, "Group");
  assert.equal(Member.schema.path("user").options.ref, "User");
  assert.equal(Contribution.schema.path("group").options.ref, "Group");
  assert.equal(Contribution.schema.path("member").options.ref, "Member");

  const user = new User({
    name: "Ama",
    email: "AMA@SUSU.TEST",
    passwordHash: "$2a$10$examplehash",
  });
  await user.validate();
  assert.equal(user.toJSON().passwordHash, undefined);
});

test("GET /groups populates owner email and memberCount with no secrets, and supports search, sort, and pagination", async () => {
  const ama = await request("/auth/register", {
    method: "POST",
    body: { name: "Ama", email: "ama@susu.test", password: "password123" },
  });
  const kojo = await request("/auth/register", {
    method: "POST",
    body: { name: "Kojo", email: "kojo@susu.test", password: "password123" },
  });

  const market = await request("/groups", {
    method: "POST",
    token: ama.payload.token,
    body: { name: "Market Women Circle", contributionAmount: 50 },
  });
  await request("/groups", {
    method: "POST",
    token: ama.payload.token,
    body: { name: "Alpha Savers", contributionAmount: 20 },
  });
  await request("/groups", {
    method: "POST",
    token: kojo.payload.token,
    body: { name: "Zebra Circle", contributionAmount: 100 },
  });

  await request("/members", {
    method: "POST",
    token: ama.payload.token,
    body: { group: market.payload._id, name: "Esi" },
  });
  await request("/members", {
    method: "POST",
    token: ama.payload.token,
    body: { group: market.payload._id, name: "Abena" },
  });

  const page1 = await request("/groups?sort=name&page=1&limit=2");
  assert.equal(page1.response.status, 200);
  assert.equal(page1.payload.groups.length, 2);
  assert.equal(page1.payload.groups[0].name, "Alpha Savers");
  assert.equal(page1.payload.groups[1].name, "Market Women Circle");
  assert.equal(page1.payload.groups[1].owner.email, "ama@susu.test");
  assert.equal(page1.payload.groups[1].owner.passwordHash, undefined);
  assert.equal(page1.payload.groups[1].memberCount, 2);
  assert.deepEqual(page1.payload.pagination, {
    page: 1,
    limit: 2,
    total: 3,
    totalPages: 2,
    hasPrev: false,
    hasNext: true,
  });

  const page2 = await request("/groups?sort=name&page=2&limit=2");
  assert.equal(page2.response.status, 200);
  assert.equal(page2.payload.groups.length, 1);
  assert.equal(page2.payload.groups[0].name, "Zebra Circle");
  assert.equal(page2.payload.groups[0].owner.email, "kojo@susu.test");
  assert.equal(page2.payload.pagination.hasPrev, true);
  assert.equal(page2.payload.pagination.hasNext, false);

  const searched = await request("/groups?search=market");
  assert.equal(searched.response.status, 200);
  assert.equal(searched.payload.groups.length, 1);
  assert.equal(searched.payload.groups[0].name, "Market Women Circle");

  const sortedByAmount = await request("/groups?sort=-amount");
  assert.equal(sortedByAmount.payload.groups[0].name, "Zebra Circle");
  assert.equal(sortedByAmount.payload.groups[2].name, "Alpha Savers");
});

test("GET /groups/mine stays above /:id, requires auth, and returns only the logged-in user's groups", async () => {
  const unauthMine = await request("/groups/mine");
  assert.equal(unauthMine.response.status, 401);

  const ama = await request("/auth/register", {
    method: "POST",
    body: { name: "Ama", email: "ama@susu.test", password: "password123" },
  });
  const kojo = await request("/auth/register", {
    method: "POST",
    body: { name: "Kojo", email: "kojo@susu.test", password: "password123" },
  });

  await request("/groups", {
    method: "POST",
    token: ama.payload.token,
    body: { name: "Ama Circle", contributionAmount: 50 },
  });
  await request("/groups", {
    method: "POST",
    token: kojo.payload.token,
    body: { name: "Kojo Circle", contributionAmount: 30 },
  });

  const amaMine = await request("/groups/mine", { token: ama.payload.token });
  assert.equal(amaMine.response.status, 200);
  assert.equal(amaMine.payload.groups.length, 1);
  assert.equal(amaMine.payload.groups[0].name, "Ama Circle");
  assert.equal(amaMine.payload.groups[0].owner.email, "ama@susu.test");
  assert.equal(amaMine.payload.groups[0].owner.passwordHash, undefined);
});

test("checkOwner blocks non-owners with 403, and GET /groups/:id/contributions populates member names and computes totalSaved on the server", async () => {
  const ama = await request("/auth/register", {
    method: "POST",
    body: { name: "Ama", email: "ama@susu.test", password: "password123" },
  });
  const kojo = await request("/auth/register", {
    method: "POST",
    body: { name: "Kojo", email: "kojo@susu.test", password: "password123" },
  });

  const created = await request("/groups", {
    method: "POST",
    token: ama.payload.token,
    body: { name: "Market Circle", contributionAmount: 50 },
  });
  const groupId = created.payload._id;

  assert.equal((await request("/groups/bad-object-id")).response.status, 400);
  assert.equal(
    (await request(`/groups/${new mongoose.Types.ObjectId()}`)).response.status,
    404,
  );

  assert.equal(
    (
      await request(`/groups/${groupId}`, {
        method: "PATCH",
        token: kojo.payload.token,
        body: { name: "Unauthorized" },
      })
    ).response.status,
    403,
  );
  assert.equal(
    (
      await request(`/groups/${groupId}`, {
        method: "DELETE",
        token: kojo.payload.token,
      })
    ).response.status,
    403,
  );

  const memberEsi = await request("/members", {
    method: "POST",
    token: ama.payload.token,
    body: { group: groupId, name: "Esi" },
  });
  const memberAbena = await request("/members", {
    method: "POST",
    token: ama.payload.token,
    body: { group: groupId, name: "Abena" },
  });

  await request("/contributions", {
    method: "POST",
    token: ama.payload.token,
    body: {
      group: groupId,
      member: memberEsi.payload._id,
      amount: 50,
      date: "2026-11-20",
    },
  });
  await request("/contributions", {
    method: "POST",
    token: ama.payload.token,
    body: {
      group: groupId,
      member: memberAbena.payload._id,
      amount: 75,
      date: "2026-11-21",
    },
  });

  const groupContribs = await request(`/groups/${groupId}/contributions`);
  assert.equal(groupContribs.response.status, 200);
  assert.equal(groupContribs.payload.contributions.length, 2);
  assert.equal(groupContribs.payload.totalSaved, 125);
  assert.deepEqual(
    groupContribs.payload.contributions.map((entry) => entry.member.name).sort(),
    ["Abena", "Esi"],
  );
  assert.equal(groupContribs.payload.group.owner.email, "ama@susu.test");
  assert.equal(groupContribs.payload.group.owner.passwordHash, undefined);

  const groupMembers = await request(`/groups/${groupId}/members`);
  assert.equal(groupMembers.response.status, 200);
  assert.equal(groupMembers.payload.length, 2);
  assert.equal(groupMembers.payload[0].user.email, "ama@susu.test");
  assert.equal(groupMembers.payload[0].user.passwordHash, undefined);

  const deleted = await request(`/groups/${groupId}`, {
    method: "DELETE",
    token: ama.payload.token,
  });
  assert.equal(deleted.response.status, 204);
  assert.equal(collections.members.length, 0);
  assert.equal(collections.contributions.length, 0);
});
