const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDb = require("./config/db");
const PORT = process.env.PORT;

connectDb();

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
