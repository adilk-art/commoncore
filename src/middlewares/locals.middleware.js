import { findUserById } from "../repositories/user.repository.js";

const localsMiddleware = async (req, res, next) => {
  if (req.session.userId) {
    const user = await findUserById(req.session.userId);
    res.locals.user = user;
  } else {
    res.locals.user = null;
  }
  next();
};

export default localsMiddleware;
