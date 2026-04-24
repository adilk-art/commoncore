import User from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/user/login");
  }

  const user = await User.findById(req.session.userId);

  if (!user) {
    delete req.session?.userId
    return res.redirect("/user/login");
  }

  if (user.isBlocked) {
   delete req.session?.userId
    return res.render("user/blocked.ejs");
  }

  next();
};

export const isNotAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    next();
  } else {
    res.redirect("/");
  }
};
