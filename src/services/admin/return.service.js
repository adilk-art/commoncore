import {
  findReturns,
  countReturns,
  getReturnStats,
  findReturnDetailById,
  findReturnById,
} from "../../repositories/admin/return.repository.js";
import { increaseVariantStock } from "../../repositories/admin/variant.repository.js";

import {
  findOrderById,
  saveOrder,
} from "../../repositories/order.repository.js";

import { creditWalletService } from "../user/wallet.service.js";

export const getReturnsPageService = async ({
  limit,
  skip,
  search,
  status,
  sort,
}) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  let sortOrder = { requestedAt: -1 };

  if (sort === "oldest") {
    sortOrder = { requestedAt: 1 };
  }

  const [returns, stats] = await Promise.all([
    findReturns(limit, skip, filter, sortOrder, search),
    getReturnStats(),
  ]);

  const returnCount = await countReturns(filter, search);
  const totalPages = Math.max(1, Math.ceil(returnCount / limit));

  return {
    returns,
    returnCount,
    totalPages,
    totalReturns: stats.totalReturns,
    requestedReturns: stats.requestedReturns,
    approvedReturns: stats.approvedReturns,
    refundedReturns: stats.refundedReturns,
  };
};

export const getReturnDetailService = async (returnId) => {
  const returnRequest = await findReturnDetailById(returnId);

  if (!returnRequest) {
    const error = new Error("Return request not found");
    error.status = 404;
    throw error;
  }

  const order = returnRequest.order;
  const user = returnRequest.user;

  const item = returnRequest.returnedItem;

  if (!item) {
    const error = new Error("Returned item not found in order");
    error.status = 404;
    throw error;
  }

  return {
    returnRequest,
    order,
    user,
    item,
    pickupAddress: returnRequest.pickupAddress,
  };
};

export const updateReturnStatusService = async (returnId, status) => {
  const returnRequest = await findReturnById(returnId);

  if (!returnRequest) {
    const error = new Error("Return request not found");
    error.status = 404;
    throw error;
  }

  const currentStatus = returnRequest.status;

  const allowedTransitions = {
    Requested: ["Approved"],
    Approved: ["Picked Up"],
    "Picked Up": ["Received"],
  };

  if (!allowedTransitions[currentStatus]?.includes(status)) {
    const error = new Error(
      `Cannot change return status from ${currentStatus} to ${status}`,
    );
    error.status = 400;
    throw error;
  }

  const order = await findOrderById(returnRequest.orderId);

  if (!order) {
    const error = new Error("Order not found for this return");
    error.status = 404;
    throw error;
  }

  const item = order.items.id(returnRequest.itemId);

  if (!item) {
    const error = new Error("Returned item not found in order");
    error.status = 404;
    throw error;
  }

  returnRequest.status = status;

  if (status === "Approved") {
    returnRequest.approvedAt = new Date();
    item.status = "Return Accepted";
    item.statusUpdatedAt = new Date();
  }

  if (status === "Picked Up") {
    returnRequest.pickedUpAt = new Date();
  }

  if (status === "Received") {
    returnRequest.receivedAt = new Date();
    item.status = "Returned";
    item.statusUpdatedAt = new Date();

    await increaseVariantStock(item.variantId, item.quantity);
  }

  await returnRequest.save();
  await saveOrder(order);

  return returnRequest;
};

export const rejectReturnService = async (returnId, rejectionReason) => {
  const returnRequest = await findReturnById(returnId);

  if (!returnRequest) {
    const error = new Error("Return request not found");
    error.status = 404;
    throw error;
  }

  if (returnRequest.status !== "Requested") {
    const error = new Error("Only requested returns can be rejected");
    error.status = 400;
    throw error;
  }

  const order = await findOrderById(returnRequest.orderId);

  if (!order) {
    const error = new Error("Order not found for this return");
    error.status = 404;
    throw error;
  }

  const item = order.items.id(returnRequest.itemId);

  if (!item) {
    const error = new Error("Returned item not found in order");
    error.status = 404;
    throw error;
  }

  returnRequest.status = "Rejected";
  returnRequest.rejectionReason = rejectionReason;
  returnRequest.rejectedAt = new Date();

  item.status = "Delivered";
  item.statusUpdatedAt = new Date();

  await returnRequest.save();
  await saveOrder(order);

  return returnRequest;
};

export const processReturnRefundService = async (returnId) => {
  const returnRequest = await findReturnById(returnId);

  if (!returnRequest) {
    const error = new Error("Return request not found");
    error.status = 404;
    throw error;
  }

  if (returnRequest.status !== "Received") {
    const error = new Error(
      "Refund can only be processed after item is received",
    );
    error.status = 400;
    throw error;
  }

  const order = await findOrderById(returnRequest.orderId);

  if (!order) {
    const error = new Error("Order not found for this return");
    error.status = 404;
    throw error;
  }

  const item = order.items.id(returnRequest.itemId);

  if (!item) {
    const error = new Error("Returned item not found in order");
    error.status = 404;
    throw error;
  }

  const refundAmount = returnRequest.refundAmount;

  await creditWalletService(returnRequest.userId, {
    amount: refundAmount,
    category: "ReturnRefund",
    description: `Refund for returned ${item.productName}`,
    reference: returnRequest.returnNumber,
  });

  returnRequest.status = "Refunded";
  returnRequest.refundedAt = new Date();

  item.status = "Returned";
  item.statusUpdatedAt = new Date();

  await returnRequest.save();
  await saveOrder(order);

  return returnRequest;
};
