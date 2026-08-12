import {
  getUserOrdersService,
  placeOrderService,
  getOrderSuccessService,
  getOrderDetailService,
  cancelOrderItemService,
  cancelOrderService,
  downloadInvoiceService,
  createPendingRazorpayOrderService,
  verifyPaymentService,
  retryPaymentService,
  recordRazorpayFailureService,
} from "../../services/user/order.service.js";

export const loadOrdersPage = async (req,res,next) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";
    const data = await getUserOrdersService({
      userId: req.session.userId,
      page,
      search,
    });
    res.render("user/orders",data);
  } catch (error) {
    next(error);
  }
};

export const placeOrder = async (req,res,next) => {
  try {
    const order = await placeOrderService(
      req.session.userId,
      req.body,
    );
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const loadOrderSuccessPage = async (req,res,next) => {
  try {
    const data = await getOrderSuccessService(
      req.params.orderId,
      req.session.userId,
    );
    res.render("user/order-success.ejs",data);
  } catch (error) {
    next(error);
  }
};

export const loadOrderDetail = async (req,res,next) => {
  try {
    const data = await getOrderDetailService(
      req.params.orderId,
      req.session.userId,
    );

    res.render("user/order-detail",data);
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req,res,next) => {
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

export const cancelOrderItem = async (req,res,next) => {
  try {
    const { orderId,itemId } = req.params;
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

export const downloadInvoice = async (req,res,next) => {
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

export const createRazorpayOrderController = async (req,res,next) => {
  try {
    const result = await createPendingRazorpayOrderService(
      req.session.userId,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentController = async (req,res,next) => {
  try {
    const result = await verifyPaymentService(
      req.session.userId,
      req.body,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const retryPaymentController = async (req,res,next) => {
  try {
    const result = await retryPaymentService(
      req.session.userId,
      req.params.orderId,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const recordPaymentFailureController = async (req,res,next) => {
  try {
    const result = await recordRazorpayFailureService(
      req.session.userId,
      req.body,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getPaymentFailedPage = async (req,res,next) => {
  try {
    const data = await getOrderDetailService(
      req.params.orderId,
      req.session.userId,
    );
    const order = data.order;
    if (
      order.paymentMethod !== "Razorpay" ||
      order.paymentStatus === "Paid"
    ) {
      return res.redirect(`/user/order/${order._id}`);
    }
    res.render("user/payment-failed",{
      ...data,
      paymentExpired:
        Boolean(order.paymentExpiresAt) &&
        new Date(order.paymentExpiresAt) <= new Date(),
    });
  } catch (error) {
    next(error);
  }
};