import mongoose from "mongoose";

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required."],
      trim: true,
    },
    contributionAmount: {
      type: Number,
      required: [true, "Contribution amount is required."],
      min: [0.01, "Contribution amount must be greater than 0."],
    },
    frequency: {
      type: String,
      enum: ["weekly", "monthly"],
      default: "weekly",
    },
    startDate: {
      type: String,
      default: todayDateOnly,
    },
    currentRound: {
      type: Number,
      default: 1,
      min: [1, "Current round must be at least 1."],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Group owner is required."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

groupSchema.virtual("memberCount", {
  ref: "Member",
  localField: "_id",
  foreignField: "group",
  count: true,
});

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;
