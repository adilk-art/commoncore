import session from "express-session";
import MongoStore from "connect-mongo";

const isProduction = process.env.NODE_ENV === "production";

const sessionStore = MongoStore.create({
  mongoUrl: process.env.DB_URL,
  collectionName: "sessions",
  ttl: Number(process.env.SESSION_EXPIRY) / 1000,
});

export const userSession = session({
  name: "user.sid",
  secret: process.env.USER_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: Number(process.env.SESSION_EXPIRY),
    httpOnly: true,
    secure: isProduction,
  },
});

export const adminSession = session({
  name: "admin.sid",
  secret: process.env.ADMIN_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: Number(process.env.SESSION_EXPIRY),
    httpOnly: true,
    secure: isProduction,
  },
});

