import Wishlist from "../models/wishlist.model.js";

export const wishlistCountMiddleware = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.locals.wishlistCount = 0;

      return next();
    }

    const wishlist = await Wishlist.findOne({
      userId,
    });

    res.locals.wishlistCount = wishlist?.products?.length || 0;

    next();
  } catch {
    res.locals.wishlistCount = 0;

    next();
  }
};
