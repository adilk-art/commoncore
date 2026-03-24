const express = require("express");
const app = express();
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
