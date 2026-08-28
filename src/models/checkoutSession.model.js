import mongoose from "mongoose";

const checkoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: Array,
      required: true,
    },

    shippingAddress: {
      type: Object,
      required: true,
    },

    coupon: {
      type: Object,
      default: undefined,
    },

    shippingFee: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    isBuyNow: {
      type: Boolean,
      default: false,
    },

    checkoutAgain: {
      type: Boolean,
      default: false,
    },

    checkoutAgainOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

checkoutSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

export default mongoose.model(
  "CheckoutSession",
  checkoutSessionSchema,
);