import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    fit: {
      type: String,
      required: true,
    },
    material: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    washCare: {
      type: String,
      required: true,
    },
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
    },
    basePrice: {
      type: Number,
      required: true,
    },
    gstRate: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
