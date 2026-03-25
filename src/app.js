import express from "express";
const app = express();
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "./src/views");
app.use(express.static("public"));
app.use("/user", userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
