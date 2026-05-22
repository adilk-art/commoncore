import {
  getWishlistService,
  addToWishlistService,
  removeWishlistItemService,
  moveWishlistToCartService,
  addAllWishlistToCartService,
  getWishlistVariantsService
} from "../../services/user/wishlist.service.js";

export const getWishlist = async (req, res) => {

  const items = await getWishlistService(req.session.userId);

  res.render("user/wishlist", {
    items,
  });
};

export const addToWishlist = async (req, res) => {

  try {
    if(!req.session.userId){
      return res.status(401).json({
    message: "Please login to use wishlist",
    });

    }
    const result = await addToWishlistService({
      userId: req.session.userId,
      productId: req.body.productId,
    });

    return res.status(200).json(result);

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeWishlistItem = async (req, res) => {

  try {

    const result = await removeWishlistItemService({
      userId: req.session.userId,
      productId: req.params.productId,
    });

    return res.json(result);

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const moveWishlistToCart = async (req, res) => {

  try {

    const result = await moveWishlistToCartService({
      userId: req.session.userId,
      productId: req.body.productId,
        variantId: req.body.variantId,
    });

    return res.json(result);

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const addAllWishlistToCart = async (req, res) => {

  try {

    const result = await addAllWishlistToCartService(req.session.userId);

    return res.json(result);

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWishlistVariants = async (
  req,
  res,
) => {

  try {

    const variants =
      await getWishlistVariantsService(
        req.params.productId,
      );

    return res.json({
      success: true,
      variants,
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};