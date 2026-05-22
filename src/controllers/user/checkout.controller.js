import {
  getCheckoutPageService,
  validateBuyNowService,
  getBuyNowCheckoutService,
} from "../../services/user/checkout.service.js";

export const loadCheckout = async (req, res) => {
  try {
    const data = await getCheckoutPageService(req.session.userId);
    res.render("user/checkout", data);
  } catch (error) {
    res.redirect("/user/cart");
  }
};

export const loadBuyNowCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Please login to checkout item" });
    }

    const { variantId, quantity } = req.body;
    if (!variantId || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    const { qty } = await validateBuyNowService(variantId, quantity);

    req.session.buyNow = { variantId, quantity: qty };

    res.json({ success: true, redirect: "/user/checkout/buy-now" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const renderBuyNowCheckout = async (req, res) => {
  try {
    const { variantId, quantity } = req.session.buyNow || {};
    if (!variantId) return res.redirect("/user/shop");

    const data = await getBuyNowCheckoutService(
      req.session.userId,
      variantId,
      quantity,
    );

    res.render("user/checkout", data);
  } catch (error) {
    res.redirect("/user/shop");
  }
};
