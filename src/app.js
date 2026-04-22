import express from "express";
import session from "express-session";
import passport from "passport";
import './config/passport.js'
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import indexRoutes from "./routes/index.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import localsMiddleware from "./middlewares/locals.middleware.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "./src/views");
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 10,
    },
  }),
);

app.use(passport.initialize())
app.use(passport.session())
app.use(localsMiddleware)
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use("/", indexRoutes);
app.use("/user", userRoutes);
app.use("/admin",adminRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
