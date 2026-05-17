import mongoose from "mongoose";

const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    size: {
      type: String,
      required: true,
    },

    color: {
      name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    images: [
      {
        url: String,
        publicId: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sku: {
      type: String,
      required: true,
      unique:true
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Variant", variantSchema);
