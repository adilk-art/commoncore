
import Cart from "../models/cart.model.js";

export const cartCountMiddleware = async (req, res, next) => {
  try {

    if (!req.session.userId) {
      res.locals.cartCount = 0;
      return next();
    }

    const cart = await Cart.findOne({
      userId: req.session.userId,
    });

    const count = cart
      ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;

    res.locals.cartCount = count;

    next();

  } catch {
    res.locals.cartCount = 0;
    next();
  }
};