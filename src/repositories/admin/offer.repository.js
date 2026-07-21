import Offer from "../../models/offer.model.js";

export const getAllOffers = async (filter, sort, skip, limit) => {
  return await Offer.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countOffers = async (filter) => {
  return await Offer.countDocuments(filter);
};

export const getTotalOffersCount = async () => {
  return await Offer.countDocuments();
};

export const getActiveOffersCount = async () => {
  const today = new Date();

  return await Offer.countDocuments({
    isActive: true,
    startDate: { $lte: today },
    endDate: { $gte: today },
  });
};

export const getUpcomingOffersCount = async () => {
  return await Offer.countDocuments({
    isActive: true,
    startDate: { $gt: new Date() },
  });
};

export const getExpiredOffersCount = async () => {
  return await Offer.countDocuments({
    endDate: { $lt: new Date() },
  });
};

