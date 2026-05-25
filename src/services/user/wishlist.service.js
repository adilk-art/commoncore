

import {
  findWishlistByUserId,
  createWishlist,
  saveWishlist,
  findWishlistProducts,
  findWishlistPreviewVariant,
  findMovableWishlistVariant,
  hasProductStock,
  findPurchasableVariants
} from "../../repositories/wishlist.repository.js";

import {
  addToCartService,
} from "./cart.service.js";

export const getWishlistService = async (userId) => {

  let wishlist = await findWishlistByUserId(userId);

  if (!wishlist) {
    wishlist = await createWishlist(userId);
  }

  const products = await findWishlistProducts(
    wishlist.products,
  );

  const wishlistItems = [];

 for (const product of products) {

  const variant =
    await findWishlistPreviewVariant(product._id);

  const hasStock =
    await hasProductStock(product._id);

  const hasActiveVariant =
    variant && variant.isActive;

  const unavailable =
  !product.isActive ||
  !product.categoryId?.isActive ||
  !hasActiveVariant;

  wishlistItems.push({
    product,
    variant,
    unavailable,
    inStock:
      !unavailable && !!hasStock,
  });

}

  return wishlistItems;

};

export const addToWishlistService = async ({
  userId,
  productId,
}) => {

  let wishlist = await findWishlistByUserId(userId);

  if (!wishlist) {
    wishlist = await createWishlist(userId);
  }

  const alreadyExists = wishlist.products.some(
    (id) => String(id) === String(productId),
  );

  if (alreadyExists) {
    return {
      success: true,
      message: "Already in wishlist",
    };
  }

  wishlist.products.unshift(productId);

  await saveWishlist(wishlist);

  return {
    success: true,
    message: "Added to wishlist",
  };

};

export const removeWishlistItemService = async ({
  userId,
  productId,
}) => {

  const wishlist = await findWishlistByUserId(userId);

  if (!wishlist) {
    throw new Error("Wishlist not found");
  }

  wishlist.products = wishlist.products.filter(
    (id) => String(id) !== String(productId),
  );

  await saveWishlist(wishlist);

  return {
    success: true,
    message:"removed from wishlist"
  };

};

export const moveWishlistToCartService = async ({
  userId,
  productId,
  variantId,
}) => {

  if (!variantId) {
    throw new Error("Variant required");
  }

  await addToCartService({
    userId,
    variantId,
    quantity: 1,
  });

  const wishlist = await findWishlistByUserId(userId);

  wishlist.products = wishlist.products.filter(
    (id) => String(id) !== String(productId),
  );

  await saveWishlist(wishlist);

  return {
    success: true,
    message: "Added to cart",
  };

};

export const addAllWishlistToCartService = async (
  userId,
) => {

  const wishlist =
    await findWishlistByUserId(userId);

  if (!wishlist || wishlist.products.length === 0) {
    throw new Error("Wishlist empty");
  }

  const removable = [];

  const requiresSelection = [];

  for (const productId of wishlist.products) {

    const variants =
      await findPurchasableVariants(productId);

    if (variants.length === 0) {
      continue;
    }

    if (variants.length === 1) {

      try {

        await addToCartService({
          userId,
          variantId: variants[0]._id,
          quantity: 1,
        });

        removable.push(String(productId));

      } catch {

        continue;

      }

    } else {

      const product =
        variants[0].productId;

      requiresSelection.push({
        productId,
        productName: product?.name,
        variants,
      });

    }

  }

  wishlist.products = wishlist.products.filter(
    (id) => !removable.includes(String(id)),
  );

  await saveWishlist(wishlist);

  return {
    success: true,
    requiresSelection,
  };

};

export const getWishlistVariantsService = async (
  productId,
) => {

  const variants =
    await findPurchasableVariants(productId);

  return variants;

};