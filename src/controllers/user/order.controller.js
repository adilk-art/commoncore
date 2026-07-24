import {
  getUserOrdersService,
  placeOrderService,
  getOrderSuccessService,
  getOrderDetailService,
  cancelOrderItemService,
  cancelOrderService,
  downloadInvoiceService,
  createRazorpayOrderService,
  verifyPaymentService,
  retryPaymentService
} from "../../services/user/order.service.js";

export const loadOrdersPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;

    const search = req.query.search || "";

    const data = await getUserOrdersService({
      userId: req.session.userId,
      page,
      search,
    });

    res.render("user/orders", data);
  } catch (error) {
    next(error);
  }
};

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
      originalSubtotal,
      discountTotal,
      cancelledAmount,
      activeSubtotal,
      activeOriginalSubtotal,
      activeDiscountTotal,
      currentValue,
      gstAmount,
      fullyCancelled,
      partiallyCancelled,
      canCancelAnyItem,
    } = await getOrderDetailService(
      req.params.orderId,
      req.session.userId,
    );

    res.render("user/order-detail", {
      order,
      originalSubtotal,
      discountTotal,
      cancelledAmount,
      activeSubtotal,
      activeOriginalSubtotal,
      activeDiscountTotal,
      currentValue,
      gstAmount,
      fullyCancelled,
      partiallyCancelled,
      canCancelAnyItem,
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

export const createRazorpayOrder = async (req, res, next) => {
  try {
    req.session.pendingPayment = {
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      isBuyNow: req.body.isBuyNow || false,
      variantId: req.body.variantId || null,
      quantity: req.body.quantity || null,
      createdAt: Date.now(),
    };

    const data = await createRazorpayOrderService(
      req.session.userId,
      req.body
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};


export const verifyPayment = async (req, res, next) => {
  try {
    const data = await verifyPaymentService(
      req.session.userId,
      req.body,
      req.session.pendingPayment
    );
    delete req.session.pendingPayment;
    res.json(data);
  } catch (err) {
    next(err);
  }
};


export const retryPayment = async (req, res, next) => {
  try {
    const data = await retryPaymentService(
      req.session.userId,
      req.session.pendingPayment
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getPaymentFailedPage = async (req, res, next) => {
  try {
    if (!req.session.pendingPayment) {
      return res.redirect("/user/checkout");
    }

    res.render("user/payment-failed");
  } catch (err) {
    next(err);
  }
};
