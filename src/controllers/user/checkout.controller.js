import {
  getCheckoutPageService,
  validateBuyNowService,
  getBuyNowCheckoutService,
  getCheckoutAgainPageService,
} from "../../services/user/checkout.service.js";

export const loadCheckout = async (req,res,next) => {
  try {
    let data;
  if (req.session.checkoutAgain?.orderId) {
  data = await getCheckoutAgainPageService(
    req.session.userId,
    req.session.checkoutAgain,
  );
} else {
      data = await getCheckoutPageService(
        req.session.userId,
      );
    }

    res.render("user/checkout",data);
  } catch (error) {
    next(error);
  }
};

export const initiateBuyNow = async (req, res) => {
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

export const getBuyNowCheckoutPage = async (req, res) => {
  try {
    const { variantId, quantity } = req.session.buyNow || {};
    if (!variantId) return res.redirect("/user/shop");
    const data = await getBuyNowCheckoutService(
      req.session.userId,
      variantId,
      quantity,
    );
  
    res.render("user/checkout.ejs", data);
  } catch (error) {
    res.redirect("/user/shop");
  }
};

export const removeCheckoutAgainItem = async (req,res,next) => {
  try {
    const checkoutAgain = req.session.checkoutAgain;

    if (!checkoutAgain?.orderId || !Array.isArray(checkoutAgain.items)) {
      const error = new Error("Checkout session not found");
      error.status = 400;
      throw error;
    }

    const variantId = req.params.variantId;

    checkoutAgain.items = checkoutAgain.items.filter(
      (item) => String(item.variantId) !== String(variantId),
    );

    if (checkoutAgain.items.length === 0) {
      const orderId = checkoutAgain.orderId;

      delete req.session.checkoutAgain;

      return res.json({
        success: true,
        empty: true,
        redirectUrl: `/user/order/${orderId}`,
      });
    }

    req.session.checkoutAgain = checkoutAgain;

    return res.json({
      success: true,
      empty: false,
    });
  } catch (error) {
    next(error);
  }
};