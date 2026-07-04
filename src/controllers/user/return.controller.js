import {
  getReturnRequestPageService,
  createReturnRequestService,
  getReturnDetailService,
  cancelReturnRequestService,
} from "../../services/user/return.service.js";

export const loadReturnRequestPage = async (req, res, next) => {
  try {
    const { order, item, pickupAddress, addresses, returnLastDate } =
      await getReturnRequestPageService(
        req.params.orderId,
        req.params.itemId,
        req.session.userId,
      );

    res.render("user/return-request", {
      order,
      item,
      pickupAddress,
      addresses,
      returnLastDate,
    });
  } catch (error) {
    next(error);
  }
};

export const requestReturn = async (req, res, next) => {
  try {
    const returnRequest = await createReturnRequestService(
      req.body,
      req.session.userId,
    );

    res.json({
      success: true,
      message: "Return request submitted successfully.",
      returnRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const loadReturnDetailPage = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const {
      order,
      item,
      returnRequest,
      displayStatus,
      statusMetaText,
      canCancelReturn,
      timeline,
    } = await getReturnDetailService({
      orderId,
      itemId,
      userId: req.session.userId,
    });

    res.render("user/return-detail", {
      order,
      item,
      returnRequest,
      displayStatus,
      statusMetaText,
      canCancelReturn,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReturnRequest = async (req, res, next) => {
  try {
    const result = await cancelReturnRequestService({
      returnId: req.params.returnId,
      userId: req.session.userId,
    });

    res.json({
      success: true,
      message: "Return request cancelled successfully.",
      returnRequest: result,
    });
  } catch (error) {
    next(error);
  }
};