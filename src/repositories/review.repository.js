import Review from "../models/review.model.js";

export const createReview = async (data) => {
  return await Review.create(data);
};

export const findReviewByUserAndProduct = async (userId, productId) => {
  return await Review.findOne({
    userId,
    productId,
  });
};

export const findReviewsByProduct = async (productId) => {
  return await Review.find({
    productId,
  })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .lean();
};

export const findReviewById = async (reviewId) => {
  return await Review.findById(reviewId);
};

export const deleteReviewById = async (reviewId) => {
  return await Review.findByIdAndDelete(reviewId);
};

export const getReviewSummary = async (productId) => {
  const result = await Review.aggregate([
    {
      $match: {
        productId,
      },
    },
    {
      $group: {
        _id: "$productId",
        averageRating: {
          $avg: "$rating",
        },
        totalReviews: {
          $sum: 1,
        },
      },
    },
  ]);

  return (
    result[0] || {
      averageRating: 0,
      totalReviews: 0,
    }
  );
};

export const findReviewsByUserAndProducts = async (
  userId,
  productIds,
) => {
  return await Review.find({
    userId,
    productId: { $in: productIds },
  }).lean();
};