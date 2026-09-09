import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Database connected successfully");
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    throw error;
  }
};

export default connectDb;