import "dotenv/config";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import Contribution from "../models/Contribution.js";
import Group from "../models/Group.js";
import Member from "../models/Member.js";
import User from "../models/User.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "susu-test-only-jwt-secret-9c8b7a6d5e4f3a2b";

let usingRealMongo = false;
let originalReadyState;
let originalDbName;
const memoryCollections = {
  users: [],
  groups: [],
  members: [],
  contributions: [],
};

function isRealTestUri(uri) {
  return (
    typeof uri === "string" &&
    uri.trim().length > 0 &&
    !uri.includes("<username>") &&
    !uri.includes("<password>") &&
    !uri.includes("<cluster>")
  );
}

function assertTestDatabaseName(dbName) {
  if (!dbName || !dbName.endsWith("-test")) {
    throw new Error(
      `Refusing to run tests against database "${dbName}". Test database name MUST end in "-test" (for example, "susu-test").`,
    );
  }
}

function matchesFilter(doc, filter = {}) {
  return Object.entries(filter).every(([field, expected]) => {
    const actual = doc[field];
    if (
      expected &&
      typeof expected === "object" &&
      expected.$regex !== undefined
    ) {
      const regex = new RegExp(expected.$regex, expected.$options || "");
      return regex.test(String(actual ?? ""));
    }
    return String(actual) === String(expected);
  });
}

function compareValues(left, right, direction) {
  const a =
    left instanceof Date
      ? left.getTime()
      : typeof left === "string"
        ? left.toLowerCase()
        : left ?? 0;
  const b =
    right instanceof Date
      ? right.getTime()
      : typeof right === "string"
        ? right.toLowerCase()
        : right ?? 0;
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
      result.memberCount = memoryCollections.members.filter(
        (member) => String(member.group) === String(doc._id),
      ).length;
    } else if (path === "owner") {
      const owner = memoryCollections.users.find(
        (user) => String(user._id) === String(doc.owner),
      );
      result.owner = projectDoc(owner, select);
    } else if (path === "user") {
      const user = memoryCollections.users.find(
        (entry) => String(entry._id) === String(doc.user),
      );
      result.user = projectDoc(user, select);
    } else if (path === "group") {
      const group = memoryCollections.groups.find(
        (entry) => String(entry._id) === String(doc.group),
      );
      result.group = projectDoc(group, select);
    } else if (path === "member") {
      const member = memoryCollections.members.find(
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
          if (
            [
              "name",
              "contributionAmount",
              "frequency",
              "startDate",
              "currentRound",
              "paid",
            ].includes(key)
          ) {
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

function wireInMemoryModel(Model, key) {
  let clock = 1;

  vi.spyOn(Model, "find").mockImplementation((filter = {}) => {
    const matches = memoryCollections[key].filter((doc) =>
      matchesFilter(doc, filter),
    );
    return makeListQuery(matches);
  });

  vi.spyOn(Model, "countDocuments").mockImplementation(async (filter = {}) => {
    return memoryCollections[key].filter((doc) => matchesFilter(doc, filter))
      .length;
  });

  vi.spyOn(Model, "findOne").mockImplementation(async (filter = {}) => {
    return (
      memoryCollections[key].find((doc) => matchesFilter(doc, filter)) || null
    );
  });

  vi.spyOn(Model, "findById").mockImplementation((id) => {
    const doc =
      memoryCollections[key].find(
        (entry) => String(entry._id) === String(id),
      ) || null;
    return makeSingleQuery(doc);
  });

  vi.spyOn(Model, "create").mockImplementation(async (payload) => {
    const doc = new Model(payload);
    doc.createdAt = new Date(Date.now() + clock++ * 1000);
    doc.updatedAt = doc.createdAt;
    await doc.validate();
    doc.save = async function saveMock() {
      this.updatedAt = new Date(Date.now() + clock++ * 1000);
      await this.validate();
      return this;
    };
    memoryCollections[key].push(doc);
    return doc;
  });

  vi.spyOn(Model, "findByIdAndDelete").mockImplementation(async (id) => {
    const index = memoryCollections[key].findIndex(
      (doc) => String(doc._id) === String(id),
    );
    if (index === -1) return null;
    const [removed] = memoryCollections[key].splice(index, 1);
    return removed;
  });

  vi.spyOn(Model, "deleteMany").mockImplementation(async (filter = {}) => {
    const beforeCount = memoryCollections[key].length;
    memoryCollections[key] = memoryCollections[key].filter(
      (doc) => !matchesFilter(doc, filter),
    );
    return { deletedCount: beforeCount - memoryCollections[key].length };
  });
}

beforeAll(async () => {
  const testUri = process.env.MONGO_URI_TEST?.trim() || "";

  if (isRealTestUri(testUri)) {
    usingRealMongo = true;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testUri);
    }
    assertTestDatabaseName(mongoose.connection.name);
    return;
  }

  originalReadyState = Object.getOwnPropertyDescriptor(
    mongoose.connection,
    "readyState",
  );
  originalDbName = Object.getOwnPropertyDescriptor(mongoose.connection, "name");
  Object.defineProperty(mongoose.connection, "readyState", {
    configurable: true,
    value: 1,
  });
  Object.defineProperty(mongoose.connection, "name", {
    configurable: true,
    value: "susu-test",
  });
  assertTestDatabaseName(mongoose.connection.name);

  wireInMemoryModel(User, "users");
  wireInMemoryModel(Group, "groups");
  wireInMemoryModel(Member, "members");
  wireInMemoryModel(Contribution, "contributions");
});

afterEach(async () => {
  if (usingRealMongo) {
    assertTestDatabaseName(mongoose.connection.name);
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(
      collections.map((collection) => collection.deleteMany({})),
    );
    return;
  }

  memoryCollections.users = [];
  memoryCollections.groups = [];
  memoryCollections.members = [];
  memoryCollections.contributions = [];
});

afterAll(async () => {
  if (usingRealMongo) {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    return;
  }

  vi.restoreAllMocks();
  if (originalReadyState) {
    Object.defineProperty(
      mongoose.connection,
      "readyState",
      originalReadyState,
    );
  } else {
    delete mongoose.connection.readyState;
  }
  if (originalDbName) {
    Object.defineProperty(mongoose.connection, "name", originalDbName);
  } else {
    delete mongoose.connection.name;
  }
});
