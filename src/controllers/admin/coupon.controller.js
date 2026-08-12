import {
  createCouponService,
  getAdminCouponsService,
  getCreateCouponPageService,
  getEditCouponPageService,
  toggleCouponStatusService,
  updateCouponService,
} from "../../services/admin/coupon.service.js";

export const loadCouponPage = async (req, res, next) => {
  try {
    const data = await getAdminCouponsService(req.query);

    res.render("admin/coupons", data);
  } catch (err) {
    next(err);
  }
};

export const loadAddCouponPage = async (req, res, next) => {
  try {
    const data = await getCreateCouponPageService();

    res.render("admin/coupon-form", data);
  } catch (err) {
    next(err);
  }
};

export const addCoupon = async (req, res, next) => {
  try {
    await createCouponService(req.body);

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const loadEditCouponPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await getEditCouponPageService(id);

    res.render("admin/coupon-form", {
      coupon,
      isEdit: true,
    });
  } catch (err) {
    next(err);
  }
};

export const editCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    await updateCouponService(id, req.body);

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const changeCouponStatus = async (req, res, next) => {
  try {
    const message = await toggleCouponStatusService(req.params.id);

    res.status(200).json({
      success: true,
      message,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
