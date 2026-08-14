import { getActiveOffers } from "../../repositories/admin/offer.repository.js";

export const buildActiveOfferLookup = async () => {
  const offers = await getActiveOffers();

  const productOffers = {};
  const categoryOffers = {};

  for (const offer of offers) {
    const targetId = offer.appliesTo.toString();

    if (offer.offerScope === "PRODUCT") {
      productOffers[targetId] = offer;
    } else {
      categoryOffers[targetId] = offer;
    }
  }

  return {
    productOffers,
    categoryOffers,
  };
};

const calculateDiscount = (price,offer) => {
  if (!offer) {
    return {
      discount: 0,
      finalPrice: price,
    };
  }

  let discount = 0;

  if (offer.discountType === "PERCENTAGE") {
    discount =
      (price * Number(offer.discountValue)) / 100;

    if (
      offer.maxDiscountAmount &&
      discount > Number(offer.maxDiscountAmount)
    ) {
      discount = Number(offer.maxDiscountAmount);
    }
  } else {
    discount = Number(offer.discountValue);
  }

  discount = Math.min(discount,price);

  return {
    discount,
    finalPrice: price - discount,
  };
};

export const getBestOfferPricing = (
  product,
  variant,
  offerLookup,
) => {
  const originalPrice = Number(variant.price);

  const productId = String(product._id);

  const categoryId = String(
    product.categoryId?._id ??
    product.categoryId,
  );

  const productOffer =
    offerLookup.productOffers[productId];

  const categoryOffer =
    offerLookup.categoryOffers[categoryId];

  const productPricing = calculateDiscount(
    originalPrice,
    productOffer,
  );

  const categoryPricing = calculateDiscount(
    originalPrice,
    categoryOffer,
  );

  let appliedOffer = null;

  let selectedPricing = {
    discount: 0,
    finalPrice: originalPrice,
  };

  if (
    productOffer &&
    productPricing.discount >=
    categoryPricing.discount
  ) {
    appliedOffer = productOffer;
    selectedPricing = productPricing;
  } else if (categoryOffer) {
    appliedOffer = categoryOffer;
    selectedPricing = categoryPricing;
  }

  return {
    originalPrice,
    finalPrice: selectedPricing.finalPrice,
    discountAmount:
      selectedPricing.discount,
    hasOffer:
      Boolean(appliedOffer),
    offerId:
      appliedOffer?._id ?? null,
    offerTitle:
      appliedOffer?.title ?? null,
    offerType:
      appliedOffer?.offerScope ?? null,
    discountType:
      appliedOffer?.discountType ?? null,
    discountValue:
      appliedOffer?.discountValue != null
        ? Number(appliedOffer.discountValue)
        : null,
    maxDiscountAmount:
      appliedOffer?.maxDiscountAmount != null
        ? Number(appliedOffer.maxDiscountAmount)
        : null,
  };
};

export const getCheckoutAgainItemPricing = (
  product,
  variant,
  quantity,
  offerLookup,
) => {
  const qty = Number(quantity);

  if (!Number.isInteger(qty) || qty < 1) {
    const error = new Error("Invalid product quantity");
    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";
    throw error;
  }

  if (!variant) {
    const error = new Error("Selected product variant is unavailable");
    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";
    throw error;
  }

  if (!variant.isActive) {
    const error = new Error("Selected product variant is unavailable");
    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";
    throw error;
  }

  if (!product || product.isActive === false) {
    const error = new Error("This product is currently unavailable");
    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";
    throw error;
  }

  if (product.categoryId?.isActive === false) {
    const error = new Error("This product category is currently unavailable");
    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";
    throw error;
  }

  if (Number(variant.stock) < qty) {
    const error = new Error(
      Number(variant.stock) > 0
        ? `Only ${variant.stock} available`
        : "This product is out of stock",
    );

    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";
    throw error;
  }

  const pricing = getBestOfferPricing(
    product,
    variant,
    offerLookup,
  );

  const originalPrice =
    Number(pricing.originalPrice);

  const finalPrice =
    Number(pricing.finalPrice);

  return {
    product,
    variant,
    quantity: qty,
    originalPrice,
    finalPrice,
    lineOriginalTotal:
      originalPrice * qty,
    lineTotal:
      finalPrice * qty,
    discountAmount:
      Number(pricing.discountAmount || 0),
    hasOffer:
      Boolean(pricing.hasOffer),
    offerId:
      pricing.offerId || null,
    offerTitle:
      pricing.offerTitle || null,
    offerType:
      pricing.offerType || null,
    discountType:
      pricing.discountType || null,
    discountValue:
      pricing.discountValue ?? null,
    maxDiscountAmount:
      pricing.maxDiscountAmount ?? null,
  };
};