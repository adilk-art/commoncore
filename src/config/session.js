import express from "express";
import session from "express-session";

export const userSession = session({
  name: "user.sid",
  secret: process.env.USER_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: Number(process.env.SESSION_EXPIRY),
  },
});

export const adminSession = session({
  name: "admin.sid",
  secret: process.env.ADMIN_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: Number(process.env.SESSION_EXPIRY),
  },
});
