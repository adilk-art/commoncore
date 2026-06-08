import {
  placeOrderService,
  getOrderSuccessService,
  getOrderDetailService,
  cancelOrderItemService,
  cancelOrderService,
  downloadInvoiceService,
} from "../../services/user/order.service.js";

export const placeOrder = async (req, res, next) => {
  try {
    const order = await placeOrderService(req.session.userId, req.body);
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const loadOrderSuccessPage = async (req, res, next) => {
  try {

    const data = await getOrderSuccessService(
      req.params.orderId,
      req.session.userId,
    );

    res.render("user/order-success.ejs", data);

  } catch (error) {
    next(error);
  }
};

export const loadOrderDetail = async (req, res, next) => {
  try {
const {
  order,
  cancelledAmount,
  activeSubtotal,
  currentValue,
  gstAmount,
  fullyCancelled,
  partiallyCancelled
} = await getOrderDetailService(req.params.orderId, req.session.userId);

res.render("user/order-detail", {
  order,
  cancelledAmount,
  activeSubtotal,
  currentValue,
  gstAmount,
  fullyCancelled,
  partiallyCancelled
});

  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const result = await cancelOrderService({
      userId: req.session.userId,
      orderId: req.params.orderId,
    });

    res.json({
      success: true,
      message: "Order cancelled",
      orderStatus: result.orderStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderItem = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const result = await cancelOrderItemService({
      userId: req.session.userId,
      orderId,
      itemId,
    });

    res.json({
      success: true,
      message: "Item cancelled",
      orderStatus: result.orderStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req, res, next) => {
  try {
    await downloadInvoiceService({
      userId: req.session.userId,
      orderId: req.params.orderId,
      res,
    });
  } catch (error) {
    next(error);
  }
};
