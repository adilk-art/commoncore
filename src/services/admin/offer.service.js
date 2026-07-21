import {
  getAllOffers,
  countOffers,
  getTotalOffersCount,
  getActiveOffersCount,
  getUpcomingOffersCount,
  getExpiredOffersCount,
} from "../../repositories/admin/offer.repository.js";

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
    filter.Title = {
      $regex: search,
      $options: "i",
    };
  }

  if (scope !== "all") {
    filter.OfferScope = scope.toUpperCase();
  }

  if (discount !== "all") {
    filter.DiscountType = discount.toUpperCase();
  }

  const now = new Date();

  switch (status) {
    case "active":
      filter.IsActive = true;
      filter.StartDate = { $lte: now };
      filter.EndDate = { $gte: now };
      break;

    case "upcoming":
      filter.StartDate = { $gt: now };
      break;

    case "expired":
      filter.EndDate = { $lt: now };
      break;

    case "disabled":
      filter.IsActive = false;
      break;
  }

  let sortOption = { CreatedAt: -1 };

  switch (sort) {
    case "oldest":
      sortOption = { CreatedAt: 1 };
      break;

    case "endingSoon":
      sortOption = { EndDate: 1 };
      break;

    default:
      sortOption = { CreatedAt: -1 };
  }

  const offers = await getAllOffers(filter, sortOption, skip, limit);
  const offerCount = await countOffers(filter);

  return {
    offers,
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
