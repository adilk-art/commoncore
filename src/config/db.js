const mongoose = require("mongoose");
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Database connected successfully");
  } catch (error) {
    console.error(`Database connection failed ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDb;
