import User from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/user/login");
  }

  const user = await User.findById(req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.redirect("/user/login");
  }

  if (user.isBlocked) {
    req.session.destroy(() => {});
    return res.redirect("/user/login");
  }

  req.user = user;
  next();
};

export const isNotAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    next();
  } else {
    res.redirect("/");
  }
};
