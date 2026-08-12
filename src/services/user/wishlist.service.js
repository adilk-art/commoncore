import {
  findWishlistByUserId,
  createWishlist,
  saveWishlist,
  findWishlistProducts,
  findWishlistPreviewVariant,
  findMovableWishlistVariant,
  hasProductStock,
  findPurchasableVariants,
} from "../../repositories/wishlist.repository.js";

import { addToCartService } from "./cart.service.js";
import {
  buildActiveOfferLookup,
  getBestOfferPricing,
} from "../shared/pricing.service.js";

const prepareWishlistVariantsWithPricing = async (productId) => {
  const variants =
    await findPurchasableVariants(productId);

  if (!variants.length) {
    return [];
  }

  const offerLookup =
    await buildActiveOfferLookup();

  return variants.map((variant) => {
    const product =
      variant.productId;

    const pricing =
      getBestOfferPricing(
        product,
        variant,
        offerLookup,
      );

    const variantObject =
      typeof variant.toObject === "function"
        ? variant.toObject()
        : variant;

    return {
      ...variantObject,

      originalPrice: Number(
        pricing?.originalPrice ??
          variant.price ??
          0,
      ),

      finalPrice: Number(
        pricing?.finalPrice ??
          variant.price ??
          0,
      ),

      discountAmount: Number(
        pricing?.discountAmount ?? 0,
      ),

      hasOffer: Boolean(
        pricing?.hasOffer,
      ),

      offerId:
        pricing?.offerId ?? null,

      offerTitle:
        pricing?.offerTitle ?? null,

      offerType:
        pricing?.offerType ?? null,

      discountType:
        pricing?.discountType ?? null,

      discountValue:
        pricing?.discountValue ?? null,

      maxDiscountAmount:
        pricing?.maxDiscountAmount ??
        null,
    };
  });
};

export const getWishlistService = async (userId) => {
  let wishlist = await findWishlistByUserId(userId);

  if (!wishlist) {
    wishlist = await createWishlist(userId);
  }

  const products = await findWishlistProducts(wishlist.products);

  const wishlistItems = [];

  const offerLookup = await buildActiveOfferLookup();

  for (const product of products) {
    const variant = await findWishlistPreviewVariant(product._id);

    const hasStock = await hasProductStock(product._id);

    const hasActiveVariant = Boolean(variant && variant.isActive);

    const unavailable =
      !product.isActive || !product.categoryId?.isActive || !hasActiveVariant;

    let pricing = {
      originalPrice: Number(variant?.price || 0),

      finalPrice: Number(variant?.price || 0),

      discountAmount: 0,

      hasOffer: false,

      offerId: null,

      offerTitle: null,

      offerType: null,

      discountType: null,

      discountValue: null,

      maxDiscountAmount: null,
    };

    if (variant && !unavailable) {
      pricing = getBestOfferPricing(product, variant, offerLookup);
    }

    wishlistItems.push({
      product,
      variant,

      unavailable,

      inStock: !unavailable && Boolean(hasStock),

      originalPrice: Number(pricing?.originalPrice ?? variant?.price ?? 0),

      finalPrice: Number(pricing?.finalPrice ?? variant?.price ?? 0),

      discountAmount: Number(pricing?.discountAmount ?? 0),

      hasOffer: Boolean(pricing?.hasOffer),

      offerId: pricing?.offerId ?? null,

      offerTitle: pricing?.offerTitle ?? null,

      offerType: pricing?.offerType ?? null,

      discountType: pricing?.discountType ?? null,

      discountValue: pricing?.discountValue ?? null,

      maxDiscountAmount: pricing?.maxDiscountAmount ?? null,
    });
  }

  return wishlistItems;
};

export const addToWishlistService = async ({ userId, productId }) => {
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
      wishlistCount: wishlist.products.length,
    };
  }

  wishlist.products.unshift(productId);

  await saveWishlist(wishlist);

  return {
    success: true,
    message: "Added to wishlist",
    wishlistCount: wishlist.products.length,
  };
};

export const removeWishlistItemService = async ({ userId, productId }) => {
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
    message: "Removed from wishlist",
    wishlistCount: wishlist.products.length,
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

export const addAllWishlistToCartService = async (userId) => {
  const wishlist =
    await findWishlistByUserId(userId);

  if (
    !wishlist ||
    wishlist.products.length === 0
  ) {
    throw new Error(
      "Wishlist empty",
    );
  }

  const removable = [];

  const requiresSelection = [];

  for (
    const productId of
    wishlist.products
  ) {
    const variants =
      await prepareWishlistVariantsWithPricing(
        productId,
      );

    if (
      variants.length === 0
    ) {
      continue;
    }

    if (
      variants.length === 1
    ) {
      try {
        await addToCartService({
          userId,

          variantId:
            variants[0]._id,

          quantity: 1,
        });

        removable.push(
          String(productId),
        );
      } catch {
        continue;
      }
    } else {
      const product =
        variants[0].productId;

      requiresSelection.push({
        productId,

        productName:
          product?.name,

        variants,
      });
    }
  }

  wishlist.products =
    wishlist.products.filter(
      (id) =>
        !removable.includes(
          String(id),
        ),
    );

  await saveWishlist(
    wishlist,
  );

  return {
    success: true,
    requiresSelection,
  };
};

export const getWishlistVariantsService = async (productId) => {
  return await prepareWishlistVariantsWithPricing(
    productId,
  );
};