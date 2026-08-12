
import {
  applyCouponService,
  removeCouponService,
} from "../../services/user/coupon.service.js";

export const applyCoupon = async (req, res) => {
  try {
    const result = await applyCouponService(req.session.userId, req.body);

    return res.status(200).json({
      success: true,
      coupon: result.coupon,
      pricing: result.pricing,
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    const pricing = await removeCouponService(req.session.userId, req.body);

    return res.status(200).json({
      success: true,
      pricing,
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
};
