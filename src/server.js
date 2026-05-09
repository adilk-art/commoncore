import "./config/env.js"
import app from "./app.js";
import connectDb from "./config/db.js";
const PORT = process.env.PORT;

connectDb();

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
