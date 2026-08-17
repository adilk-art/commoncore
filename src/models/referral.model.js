import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    qualifyingOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    referrerReward: {
      type: Number,
      default: 150,
      min: 0,
    },

    referredUserReward: {
      type: Number,
      default: 100,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Rewarded", "Cancelled"],
      default: "Pending",
      index: true,
    },

    rewardedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Referral = mongoose.model("Referral", referralSchema);

export default Referral;
