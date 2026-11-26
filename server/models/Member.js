import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group reference is required."],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Member name is required."],
      trim: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Member = mongoose.models.Member || mongoose.model("Member", memberSchema);

export default Member;
