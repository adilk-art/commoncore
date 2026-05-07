import mongoose from "mongoose";
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    sizeType: {
      type: String,
      enum: ["Numeric", "Alpha"],
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offers",
    },  
  },
  { timestamps: true },
);

export default mongoose.model("Category", categorySchema);
