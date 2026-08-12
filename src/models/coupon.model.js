import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },

    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 1,
    },

    minimumPurchaseAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    maximumDiscountAmount: {
      type: Number,
      min: 1,
      default: null,
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    usageLimit: {
      type: Number,
      min: 1,
      default: null,
    },

    usedCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);


couponSchema.index({
  isActive: 1,
  validFrom: 1,
  validUntil: 1,
});

export default mongoose.model("Coupon", couponSchema);
