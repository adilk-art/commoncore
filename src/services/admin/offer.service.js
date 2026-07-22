import {
  getAllOffers,
  countOffers,
  getTotalOffersCount,
  getActiveOffersCount,
  getUpcomingOffersCount,
  getExpiredOffersCount,
  findOfferByTitleScopeAndTarget,
  createOffer,
  findOfferById,
  updateOffer,
} from "../../repositories/admin/offer.repository.js";
import {
  getAllActiveProductsName,
  findProductById,
} from "../../repositories/admin/product.repository.js";
import {
  getAllActiveCategoriesName,
  findCategoryById,
} from "../../repositories/category.repository.js";
import { offerSchema } from "../../validators/offer.validation.js";
import mongoose from "mongoose";

export const getAllOffersService = async (
  page,
  search,
  status,
  scope,
  discount,
  sort,
) => {
  const limit = 6;
  const skip = (page - 1) * limit;

  const filter = {};

  if (search) {
    filter.title = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  if (scope && scope !== "all") {
    filter.offerScope = scope.toUpperCase();
  }

  if (discount && discount !== "all") {
    filter.discountType = discount.toUpperCase();
  }

  const now = new Date();

  switch (status) {
    case "active":
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
      break;

    case "upcoming":
      filter.isActive = true;
      filter.startDate = { $gt: now };
      break;

    case "expired":
      filter.endDate = { $lt: now };
      break;

    case "disabled":
      filter.isActive = false;
      break;
  }

  let sortOption = { createdAt: -1 };

  switch (sort) {
    case "oldest":
      sortOption = { createdAt: 1 };
      break;

    case "endingSoon":
      sortOption = { endDate: 1 };
      break;

    default:
      sortOption = { createdAt: -1 };
  }

  const offers = await getAllOffers(filter, sortOption, skip, limit);

  const formattedOffers = offers.map((offer) => {
    let offerStatus = "Disabled";

    if (offer.isActive) {
      if (now < offer.startDate) {
        offerStatus = "Scheduled";
      } else if (now > offer.endDate) {
        offerStatus = "Expired";
      } else {
        offerStatus = "Active";
      }
    }

    return {
      ...offer,

      startDate: offer.startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      endDate: offer.endDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      status: offerStatus,
    };
  });

  const offerCount = await countOffers(filter);

  return {
    offers: formattedOffers,
    offerCount,
    totalPages: Math.ceil(offerCount / limit),
    skip,
    limit,
  };
};

export const getOfferStatsService = async () => {
  return {
    totalOffers: await getTotalOffersCount(),
    activeOffers: await getActiveOffersCount(),
    upcomingOffers: await getUpcomingOffersCount(),
    expiredOffers: await getExpiredOffersCount(),
  };
};

export const getAllActiveProductsAndCategoriesService = async () => {
  const [products, categories] = await Promise.all([
    getAllActiveProductsName(),
    getAllActiveCategoriesName(),
  ]);

  return {
    products,
    categories,
  };
};

export const addOfferService = async (data) => {
  const result = offerSchema.safeParse(data);

  if (!result.success) {
    const error = new Error(result.error.issues[0].message);
    error.status = 400;
    throw error;
  }
  const validatedData = result.data;
  const {
    title,
    offerScope,
    appliesTo,
    appliesToModel,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    startDate,
    endDate,
    isActive,
  } = validatedData;

  if (offerScope === "PRODUCT") {
    const product = await findProductById(appliesTo);

    if (!product) {
      const err = new Error("Selected product not found");
      err.status = 404;
      throw err;
    }
  } else {
    const category = await findCategoryById(appliesTo);
    if (!category) {
      const err = new Error("Selected category not found");
      err.status = 404;
      throw err;
    }
  }
  const existingOffer = await findOfferByTitleScopeAndTarget(
    title,
    offerScope,
    appliesTo,
  );

  if (existingOffer) {
    const err = new Error(
      "An offer already exists for the selected target with this title",
    );
    err.status = 400;
    throw err;
  }

  const offer = await createOffer({
    title,
    offerScope,
    appliesTo,
    appliesToModel,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    startDate,
    endDate,
    isActive,
  });

  return offer;
};

export const loadEditOfferPageService = async (id) => {
  const offer = await findOfferById(id);
  if (!offer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }
  return offer;
};

export const editOfferService = async (offerId, payload) => {
  const result = offerSchema.safeParse(payload);

  if (!result.success) {
    const error = new Error(result.error.issues[0].message);
    error.status = 400;
    throw error;
  }

  const validatedData = result.data;

  const existingOffer = await findOfferById(offerId);
  if (!existingOffer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }

  const {
    title,
    offerScope,
    appliesTo,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    startDate,
    endDate,
    isActive,
  } = validatedData;

  if (offerScope === "PRODUCT") {
    const product = await findProductById(appliesTo);
    if (!product) {
      const err = new Error("Selected product not found");
      err.status = 404;
      throw err;
    }
  } else {
    const category = await findCategoryById(appliesTo);
    if (!category) {
      const err = new Error("Selected category not found");
      err.status = 404;
      throw err;
    }
  }

  const duplicate = await findOfferByTitleScopeAndTarget(
    title,
    offerScope,
    appliesTo,
  );

  if (duplicate && duplicate._id.toString() !== offerId) {
    const err = new Error("Offer already exists for this target");
    err.status = 400;
    throw err;
  }

  return await updateOffer(offerId, {
    title,
    offerScope,
    appliesTo,
    appliesToModel: offerScope === "PRODUCT" ? "Product" : "Category",
    discountType,
    discountValue,
    maxDiscountAmount: discountType === "PERCENTAGE" ? maxDiscountAmount : null,
    minOrderAmount,
    startDate,
    endDate,
    isActive,
  });
};
