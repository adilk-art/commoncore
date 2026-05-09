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
   return req.session.destroy((err) => {
        if (err) return next(err);

        return res.status(403).render("user/blocked.ejs");
      });
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
