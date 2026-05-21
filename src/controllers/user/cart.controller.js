import { addToCartService,getCartService,updateCartQuantityService,removeCartItemService } from "../../services/user/cart.service.js";

export const addToCart = async (req, res) => {
  try {

    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const { variantId, quantity } = req.body;

    const result = await addToCartService({
      userId,
      variantId,
      quantity,
    });

    return res.status(200).json(result);

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add to cart",
    });

  }
};

export const loadCart = async (req, res) => {
  try {

    const userId = req.session.userId;

    let cart = await getCartService(userId);

    if (!cart) {
      cart = { items: [] };
    }

    res.render("user/cart", { cart });

  } catch {
    res.redirect("/");
  }
};

export const updateCartQuantity = async (req, res) => {
  try {

    const userId = req.session.userId;
    const { itemId, action } = req.body;

    const result = await updateCartQuantityService({
      userId,
      itemId,
      action,
    });

    res.json(result);

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

export const removeCartItem = async (req, res) => {
  try {

    const userId = req.session.userId;
    const { itemId } = req.params;

    await removeCartItemService({
      userId,
      itemId,
    });

    res.json({
      success: true,
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};