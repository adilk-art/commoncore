import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "Users" },
    referralCode: { type: String, unique: true, sparse: true },
    isBlocked: { type: Boolean, default: false },
    googleId: { type: String, unique: true, sparse: true },
    image: { type: String },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // required only if not Google user
      },
    },
    profileImage: {
      type: String,
      default: "/images/default.png",
    },
    phone:{
      type:String,
    }
  },
  {
    timestamps: true, //second argument to the schema which creates createdAt and updatedAt and manages it automatically.
  },
);

const Users = mongoose.model("Users", userSchema);

export default Users;
