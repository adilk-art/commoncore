import {
  createReviewService,
  deleteReviewService,
} from "../../services/user/review.service.js";

export const createReview = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { productId, rating, comment } = req.body;

    await createReviewService(userId, productId, {
      rating,
      comment,
    });

    return res.json({
      success: true,
      message: "Review submitted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { reviewId } = req.params;

    await deleteReviewService(userId, reviewId);

    return res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
