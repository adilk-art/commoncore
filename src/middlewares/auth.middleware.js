export const isAutenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  // fallback for normal page requests
  return res.redirect("/user/login");
};

export const isNotAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    next();
  } else {
    res.redirect("/");
  }
};
