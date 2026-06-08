import Order from "../../models/order.model.js";
import { getCartService } from "./cart.service.js";
import { getUserAddressById } from "../../repositories/address.repository.js";
import {
  createOrderRepo,
  findUserOrderById,
  findOrderById,
  saveOrder,
} from "../../repositories/order.repository.js";
import {
  reduceVariantStock,
  increaseVariantStock,
} from "../../repositories/admin/variant.repository.js";
import { clearCart } from "../../repositories/cart.repository.js";
import { generateInvoicePdf } from "../../utils/invoicePdf.js";
import { validateBuyNowService } from "./checkout.service.js";

const generateOrderNumber = () => {
  return "ORD-" + Date.now();
};

export const placeOrderService = async (userId, payload) => {
  const { shippingAddress, paymentMethod, isBuyNow, variantId, quantity } =payload;

  if (!shippingAddress) {
    const error = new Error("Please select address");
    error.status = 400;
    throw error;
  }

  if (!paymentMethod) {
    const error = new Error("Please select payment method");
    error.status = 400;
    throw error;
  }

  const address = await getUserAddressById(shippingAddress, userId);
  if (!address) {
    const error = new Error("Address not found");
    error.status = 404;
    throw error;
  }

  let items, subtotal;

  if (isBuyNow) {
    const { variant, qty } = await validateBuyNowService(variantId, quantity);
    const product = variant.productId;

    items = [
  {
    productId: product._id,
    variantId: variant._id,
    productName: product.name,
    size: variant.size,
    color: variant.color.name,
    quantity: qty,
    unitPrice: variant.price,
    gstRate: product.gstRate,
    status: "Placed",
  },
];

    subtotal = variant.price * qty;
  } else {
    const cart = await getCartService(userId);
    if (!cart || cart.items.length === 0) {
      const error = new Error("Cart is empty");
      error.status = 400;
      error.code = "EMPTY_CART";
      throw error;
    }

    if (cart.invalid) {
      const error = new Error("Some items in your cart are unavailable");
      error.status = 400;
      error.code = "INVALID_CART";
      throw error;
    }

    items = cart.items.map((item) => ({
  productId: item.product._id,
  variantId: item.variant._id,
  productName: item.product.name,
  size: item.variant.size,
  color: item.variant.color.name,
  quantity: item.quantity,
  unitPrice: item.variant.price,
  gstRate: item.product.gstRate,
  status: "Placed",
}));
    subtotal = cart.subtotal;
  }

  const shippingFee = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shippingFee;
  const estimatedDeliveryDate = new Date();

  estimatedDeliveryDate.setDate(
  estimatedDeliveryDate.getDate() + 5
);
  const order = await createOrderRepo({
    orderNumber: generateOrderNumber(),
    userId,
    items,
    paymentMethod,
    estimatedDeliveryDate,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
    shippingFee,
    subtotal,
    total,
    paymentStatus: "Pending",
    orderStatus: "Placed",
  });

  for (const item of items) {
    await reduceVariantStock(item.variantId, item.quantity);
  }

  if (!isBuyNow) {
    await clearCart(userId);
  }

  return order;
};


export const getOrderSuccessService = async (orderId, userId) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const gstAmount = order.items.reduce((total, item) => {

    const itemSubtotal =
      item.unitPrice * item.quantity;

    const taxableValue =
      itemSubtotal / (1 + item.gstRate / 100);

    const itemGst =
      itemSubtotal - taxableValue;

    return total + itemGst;

  }, 0);

  return {
    order,
    gstAmount: Number(gstAmount.toFixed(2)),
  };
};


export const getOrderDetailService = async (orderId, userId) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const cancelledAmount = order.items
    .filter((item) => item.status === "Cancelled")
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const activeSubtotal = order.items
    .filter((item) => item.status !== "Cancelled")
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const gstAmount = order.items
  .filter((item) => item.status !== "Cancelled")
  .reduce((total, item) => {

    const itemSubtotal =
      item.unitPrice * item.quantity;

    const taxableValue =
      itemSubtotal / (1 + item.gstRate / 100);

    const itemGst =
      itemSubtotal - taxableValue;

    return total + itemGst;

  }, 0);

  const shippingFee =
    activeSubtotal >= 999 ? 0 : activeSubtotal > 0 ? order.shippingFee : 0;

  const currentValue = activeSubtotal + shippingFee;

  const fullyCancelled =
  order.items.length > 0 &&
  order.items.every(item => item.status === "Cancelled");

  const partiallyCancelled =
  cancelledAmount > 0 && !fullyCancelled;

 return {
  order,
  cancelledAmount,
  activeSubtotal,
  currentValue,
  gstAmount: Number(gstAmount.toFixed(2)),
  fullyCancelled,
  partiallyCancelled,
};
};

export const cancelOrderService = async ({ userId, orderId }) => {
  const order = await findOrderById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.userId.toString() !== userId.toString()) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  if (order.orderStatus !== "Placed" && order.orderStatus !== "Processing") {
    const error = new Error("Order cannot be cancelled");

    error.status = 400;

    throw error;
  }

  for (const item of order.items) {
    if (item.status === "Placed" || item.status === "Processing") {
      item.status = "Cancelled";

      await increaseVariantStock(item.variantId, item.quantity);
    }
  }

  order.orderStatus = "Cancelled";
  await saveOrder(order);
  return {
    orderStatus: order.orderStatus,
  };
};

export const cancelOrderItemService = async ({ userId, orderId, itemId }) => {
  const order = await findOrderById(orderId);
  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.userId.toString() !== userId.toString()) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  const item = order.items.id(itemId);
  if (!item) {
    const error = new Error("Item not found");
    error.status = 404;
    throw error;
  }

  if (item.status !== "Placed" && item.status !== "Processing") {
    const error = new Error("Item cannot be cancelled");
    error.status = 400;
    throw error;
  }

  item.status = "Cancelled";
  await increaseVariantStock(item.variantId, item.quantity);
  const allCancelled = order.items.every((item) => item.status === "Cancelled");
  if (allCancelled) {
    order.orderStatus = "Cancelled";
  }
  await saveOrder(order);
  return {
    orderStatus: order.orderStatus,
  };
};

export const downloadInvoiceService = async ({ userId, orderId, res }) => {
  const order = await findUserOrderById(orderId, userId);
  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const cancelledItems = order.items.filter(
    (item) => item.status === "Cancelled",
  );

  const activeItems = order.items.filter((item) => item.status !== "Cancelled");
  const cancelledAmount = cancelledItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const activeSubtotal = activeItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const currentTotal =
    activeSubtotal + (activeItems.length > 0 ? order.shippingFee : 0);
  const gstAmount = activeItems.reduce((total, item) => {

  const itemSubtotal =
    item.unitPrice * item.quantity;

  const taxableValue =
    itemSubtotal / (1 + item.gstRate / 100);

  const itemGst =
    itemSubtotal - taxableValue;

  return total + itemGst;

}, 0);

  generateInvoicePdf({
    order,
    activeItems,
    cancelledItems,
    cancelledAmount,
    activeSubtotal,
    currentTotal,
    gstAmount: Number(gstAmount.toFixed(2)),
    res,
  });
};
