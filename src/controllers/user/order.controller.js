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
  recordRazorpayFailureService,
  prepareCheckoutAgainService,
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
    const checkoutAgain = req.session.checkoutAgain || null;
    const payload = {
      ...req.body,
      checkoutAgain,
    };
    const order = await placeOrderService(
      req.session.userId,
      payload,
    );
    if (checkoutAgain) {
      delete req.session.checkoutAgain;
    }
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

export const createRazorpayOrder = async (req,res,next) => {
  try {
    const checkoutAgain = req.session.checkoutAgain || null;
    const payload = {
      ...req.body,
      checkoutAgain,
    };
    const result = await createRazorpayOrderService(
      req.session.userId,
      payload,
    );
    if (checkoutAgain) {
      delete req.session.checkoutAgain;
    }
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
    if (req.session.checkoutAgain) {
      delete req.session.checkoutAgain;
    }
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
      order.paymentStatus !== "Failed" ||
      order.orderStatus !== "Payment Failed"
    ) {
      return res.redirect(`/user/order/${order._id}`);
    }
    res.render("user/payment-failed",data);
  } catch (error) {
    next(error);
  }
};

export const prepareCheckoutAgain = async (req,res,next) => {
  try {
    const result = await prepareCheckoutAgainService(
      req.params.orderId,
      req.session.userId,
    );
    req.session.checkoutAgain = {
      orderId: result.orderId,
      items: result.items,
      shippingAddress: result.shippingAddress,
    };
    res.json({
      success: true,
      redirectUrl: "/user/checkout",
    });
  } catch (error) {
    next(error);
  }
};

export const updateCheckoutAgainItemQuantity = async (req,res,next) => {
  try {
    const checkoutAgain = req.session.checkoutAgain;
    if (!checkoutAgain?.orderId || !Array.isArray(checkoutAgain.items)) {
      const error = new Error("Checkout session not found");
      error.status = 400;
      throw error;
    }
    const variantId = req.params.variantId;
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
      const error = new Error("Invalid quantity");
      error.status = 400;
      throw error;
    }
    const item = checkoutAgain.items.find(
      (item) => String(item.variantId) === String(variantId),
    );
    if (!item) {
      const error = new Error("Checkout item not found");
      error.status = 404;
      throw error;
    }
    item.quantity = quantity;
    req.session.checkoutAgain = checkoutAgain;
    return res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const exitCheckoutAgain = async (req,res,next) => {
  try {
    delete req.session.checkoutAgain;
    res.json({
      success: true,
      redirectUrl: "/user/cart",
    });
  } catch (error) {
    next(error);
  }
};