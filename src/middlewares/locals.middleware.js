import { findUserById } from "../repositories/user.repository.js";
const localsMiddleware = async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (userId) {
      const user = await findUserById(userId);
      res.locals.user = user;
    } else {
      res.locals.user = null;
    }

    next();
  } catch (err) {
    next(err);
  }
};
export default localsMiddleware;
