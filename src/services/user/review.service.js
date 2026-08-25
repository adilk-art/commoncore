import mongoose from "mongoose";
import Order from "../../models/order.model.js";

import {
  createReview,
  findReviewByUserAndProduct,
  findReviewById,
  deleteReviewById,
    findReviewsByProduct,
  getReviewSummary,
} from "../../repositories/review.repository.js";

import { reviewSchema } from "../../validators/review.validation.js";

export const createReviewService = async (userId, productId, data) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product");
  }

  const validation = reviewSchema.safeParse(data);

  if (!validation.success) {
    const error = new Error(validation.error.issues[0].message);

    error.status = 400;
    throw error;
  }

  const existingReview = await findReviewByUserAndProduct(userId, productId);

  if (existingReview) {
    const error = new Error("You have already reviewed this product");

    error.status = 400;
    throw error;
  }

  const purchasedOrder = await Order.findOne({
    userId,
    items: {
      $elemMatch: {
        productId,
        status: "Delivered",
      },
    },
  });

  if (!purchasedOrder) {
    const error = new Error(
      "You can review this product after it has been delivered",
    );

    error.status = 403;
    throw error;
  }

  const review = await createReview({
    userId,
    productId,
    rating: validation.data.rating,
    comment: validation.data.comment,
  });

  return review;
};

export const deleteReviewService = async (userId, reviewId) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new Error("Invalid review");
  }

  const review = await findReviewById(reviewId);

  if (!review) {
    const error = new Error("Review not found");

    error.status = 404;
    throw error;
  }

  if (review.userId.toString() !== userId.toString()) {
    const error = new Error("You cannot delete this review");

    error.status = 403;
    throw error;
  }

  await deleteReviewById(reviewId);

  return true;
};
export const getProductReviewsService = async (productId, userId) => {
  const objectProductId = new mongoose.Types.ObjectId(productId);

  const [reviews, summary] = await Promise.all([
    findReviewsByProduct(objectProductId),
    getReviewSummary(objectProductId),
  ]);

  let userReview = null;
  let canReview = false;

  if (userId) {
    userReview = await findReviewByUserAndProduct(
      userId,
      objectProductId,
    );

    if (!userReview) {
      const deliveredOrder = await Order.findOne({
        userId,
        items: {
          $elemMatch: {
            productId: objectProductId,
            status: "Delivered",
          },
        },
      }).select("_id");

      canReview = Boolean(deliveredOrder);
    }
  }

  return {
    reviews,
    reviewSummary: {
      averageRating: summary.averageRating || 0,
      totalReviews: summary.totalReviews || 0,
    },
    userReview,
    canReview,
  };
};