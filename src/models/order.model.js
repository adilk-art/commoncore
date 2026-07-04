import mongoose from "mongoose";
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  variantId: { type: Schema.Types.ObjectId, ref: "Variant" },

  productName: String,
  size: String,
  color: String,
  productImage: String,
  quantity: Number,
  unitPrice: Number,

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
  default: Date.now
},
  gstRate: {
    type: Number,
    required: true,
  },
});

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },

    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

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
    estimatedDeliveryDate: {
      type: Date,
    },

    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },

    shippingFee: { type: Number, default: 0 },

    subtotal: Number,
    total: Number,

    orderStatus: {
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
  "Refunded"
],
      default: "Placed",
    },

    deliveredAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
