import Offer from "../../models/offer.model.js";

export const getAllOffers = async (filter, sort, skip, limit) => {
  return await Offer.find(filter)
    .populate("appliesTo", "name")
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

export const findOfferByTitleScopeAndTarget = async (
  title,
  offerScope,
  appliesTo,
) => {
  return await Offer.findOne({
    title: {
      $regex: new RegExp(`^${title}$`, "i"),
    },
    offerScope,
    appliesTo,
  });
};

export const createOffer = async (offerData) => {
  return await Offer.create(offerData);
};

export const findOfferById=async(id)=>{
  return await Offer.findById(id);
}

export const updateOffer = async (offerId, data) => {
  return await Offer.findByIdAndUpdate(
    offerId,
    data,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
};