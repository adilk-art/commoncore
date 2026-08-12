import mongoose from "mongoose";
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },

  variantId: {
    type: Schema.Types.ObjectId,
    ref: "Variant",
  },

  productName: String,
  size: String,
  color: String,
  productImage: String,

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },

  originalUnitPrice: {
    type: Number,
    required: true,
    min: 0,
  },

  couponDiscountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },

  offerId: {
    type: Schema.Types.ObjectId,
    ref: "Offer",
    default: undefined,
  },

  offerTitle: {
    type: String,
    default: undefined,
  },

  offerType: {
    type: String,
    enum: ["PRODUCT", "CATEGORY"],
    default: undefined,
  },

  discountType: {
    type: String,
    enum: ["PERCENTAGE", "FLAT"],
    default: undefined,
  },

  discountValue: {
    type: Number,
    default: undefined,
  },

  status: {
    type: String,
    enum: [
      "Placed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Return Requested",
      "Return Accepted",
      "Returned",
      "Refunded",
    ],
    default: "Placed",
  },

  statusUpdatedAt: {
    type: Date,
    default: Date.now,
  },

  gstRate: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    paymentMethod: {
      type: String,
      enum: ["CashOnDelivery", "Razorpay", "Wallet"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    paymentExpiresAt: Date,

    razorpayPaymentId: String,
    razorpayOrderId: String,
    razorpaySignature: String,
    paymentAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastPaymentAttemptAt: {
      type: Date,
      default: undefined,
    },

    paymentFailure: {
      code: {
        type: String,
        default: undefined,
      },

      description: {
        type: String,
        default: undefined,
      },

      reason: {
        type: String,
        default: undefined,
      },

      source: {
        type: String,
        default: undefined,
      },

      step: {
        type: String,
        default: undefined,
      },
    },

    estimatedDeliveryDate: Date,

    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },

    coupon: {
      couponId: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
        default: undefined,
      },

      code: {
        type: String,
        default: undefined,
      },

      name: {
        type: String,
        default: undefined,
      },

      discountType: {
        type: String,
        enum: ["PERCENTAGE", "FLAT"],
        default: undefined,
      },

      discountValue: {
        type: Number,
        default: undefined,
      },
    },

    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "Payment Pending",
        "Placed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Return Requested",
        "Return Accepted",
        "Returned",
        "Refunded",
      ],
      default: "Placed",
    },

    deliveredAt: Date,
  },
  {
    timestamps: true,
  },
);


orderSchema.index({
  userId: 1,
  "coupon.couponId": 1,
  paymentMethod: 1,
  paymentStatus: 1,
  orderStatus: 1,
});

export default mongoose.model("Order", orderSchema);
