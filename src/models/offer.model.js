import mongoose from "mongoose";

const { Schema } = mongoose;

const offerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    offerScope: {
      type: String,
      enum: ["PRODUCT", "CATEGORY"],
      required: true,
    },

    appliesTo: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "appliesToModel",
    },

    appliesToModel: {
      type: String,
      enum: ["Product", "Category"],
      required: true,
    },

    discountType: {
      type: String,
      enum: ["FLAT", "PERCENTAGE"],
      required: true,
    },

    discountValue: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    maxDiscountAmount: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
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

export default mongoose.model("Offer", offerSchema);
