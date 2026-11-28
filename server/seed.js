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

async function ensureUser({ name, email, password }) {
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user = await User.create({ name, email, passwordHash });
  }
  return user;
}

async function seed() {
  await connectDB();

  const [demoUser, kojoUser] = await Promise.all(
    TEST_ACCOUNTS.map((account) => ensureUser(account)),
  );

  let marketGroup = await Group.findOne({
    name: "Market Women Circle",
    owner: demoUser._id,
  });
  if (!marketGroup) {
    marketGroup = await Group.create({
      name: "Market Women Circle",
      contributionAmount: 50,
      frequency: "weekly",
      startDate: "2026-11-01",
      currentRound: 1,
      owner: demoUser._id,
    });

    const ama = await Member.create({
      group: marketGroup._id,
      user: demoUser._id,
      name: "Ama Mensah",
      paid: true,
    });
    await Member.create({
      group: marketGroup._id,
      user: demoUser._id,
      name: "Esi Owusu",
      paid: false,
    });
    await Contribution.create({
      group: marketGroup._id,
      member: ama._id,
      amount: 50,
      date: "2026-11-15",
      round: 1,
    });
  }

  let schoolGroup = await Group.findOne({
    name: "School Friends Circle",
    owner: kojoUser._id,
  });
  if (!schoolGroup) {
    schoolGroup = await Group.create({
      name: "School Friends Circle",
      contributionAmount: 25,
      frequency: "monthly",
      startDate: "2026-11-01",
      currentRound: 1,
      owner: kojoUser._id,
    });

    await Member.create({
      group: schoolGroup._id,
      user: kojoUser._id,
      name: "Kojo Boateng",
      paid: false,
    });
  }

  console.log(
    `Seed complete in database "${mongoose.connection.name}". Test login: demo@susu.test / susu1234`,
  );
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
