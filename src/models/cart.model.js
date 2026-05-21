import mongoose from "mongoose";
const { Schema } = mongoose;

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [
      {
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Cart", cartSchema);
