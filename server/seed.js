import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Contribution from "./models/Contribution.js";
import Group from "./models/Group.js";
import Member from "./models/Member.js";
import User from "./models/User.js";

const BCRYPT_ROUNDS = 10;

const TEST_ACCOUNTS = [
  { name: "Ama Mensah (Demo)", email: "demo@susu.test", password: "susu1234" },
  { name: "Kojo Boateng", email: "kojo@susu.test", password: "susu1234" },
];

const SEED_CIRCLES = [
  {
    ownerEmail: "demo@susu.test",
    name: "Market Women Circle",
    contributionAmount: 50,
    frequency: "weekly",
    startDate: "2026-11-01",
    currentRound: 1,
    members: [
      { name: "Ama Mensah", paid: true, initialContributionDate: "2026-11-15" },
      { name: "Esi Owusu", paid: false },
    ],
  },
  {
    ownerEmail: "kojo@susu.test",
    name: "School Friends Circle",
    contributionAmount: 25,
    frequency: "monthly",
    startDate: "2026-11-01",
    currentRound: 1,
    members: [{ name: "Kojo Boateng", paid: false }],
  },
];

async function ensureUser({ name, email, password }) {
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user = await User.create({ name, email, passwordHash });
  }
  return user;
}

async function seedCircleWithMembers(owner, circleSeed) {
  const existingGroup = await Group.findOne({
    name: circleSeed.name,
    owner: owner._id,
  });
  if (existingGroup) {
    return existingGroup;
  }

  const group = await Group.create({
    name: circleSeed.name,
    contributionAmount: circleSeed.contributionAmount,
    frequency: circleSeed.frequency,
    startDate: circleSeed.startDate,
    currentRound: circleSeed.currentRound,
    owner: owner._id,
  });

  for (const memberSeed of circleSeed.members) {
    const member = await Member.create({
      group: group._id,
      user: owner._id,
      name: memberSeed.name,
      paid: memberSeed.paid,
    });

    if (memberSeed.initialContributionDate) {
      await Contribution.create({
        group: group._id,
        member: member._id,
        amount: circleSeed.contributionAmount,
        date: memberSeed.initialContributionDate,
        round: circleSeed.currentRound,
      });
    }
  }

  return group;
}

async function seed() {
  await connectDB();

  const users = await Promise.all(
    TEST_ACCOUNTS.map((account) => ensureUser(account)),
  );
  const usersByEmail = new Map(users.map((user) => [user.email, user]));

  for (const circleSeed of SEED_CIRCLES) {
    const owner = usersByEmail.get(circleSeed.ownerEmail);
    await seedCircleWithMembers(owner, circleSeed);
  }

  console.info(
    `Seed complete in database "${mongoose.connection.name}". Test login: demo@susu.test / susu1234`,
  );
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
