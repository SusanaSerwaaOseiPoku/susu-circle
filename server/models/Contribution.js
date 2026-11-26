import mongoose from "mongoose";

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

const contributionSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group reference is required."],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Member reference is required."],
    },
    amount: {
      type: Number,
      required: [true, "Contribution amount is required."],
      min: [0.01, "Contribution amount must be greater than 0."],
    },
    date: {
      type: String,
      default: todayDateOnly,
    },
    round: {
      type: Number,
      default: 1,
      min: [1, "Round must be at least 1."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Contribution =
  mongoose.models.Contribution ||
  mongoose.model("Contribution", contributionSchema);

export default Contribution;
