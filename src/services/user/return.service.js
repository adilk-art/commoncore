import mongoose from "mongoose";
import {
  findUserOrderById,
  updateOrderItemStatus,
} from "../../repositories/order.repository.js";
import { getAddressesService } from "./address.service.js";
import {
  createReturn,
  findActiveReturnByOrderItemId,
  findLatestReturnByOrderItemUser,
  findReturnByIdAndUser,
  cancelReturnRequestRepo,
  getLatestReturnNumber,
} from "../../repositories/return.repository.js";

export const getReturnRequestPageService = async (orderId, itemId, userId) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const item = order.items.id(itemId);

  if (!item) {
    const error = new Error("Item not found");
    error.status = 404;
    throw error;
  }

  if (item.status !== "Delivered") {
    const error = new Error("Only delivered items can be returned.");
    error.status = 400;
    throw error;
  }

  const deliveredAt = new Date(item.statusUpdatedAt);
  const returnLastDate = new Date(deliveredAt);
  returnLastDate.setDate(returnLastDate.getDate() + 14);

  if (Date.now() > returnLastDate.getTime()) {
    const error = new Error("Return window has expired.");
    error.status = 400;
    throw error;
  }

  const existing = await findActiveReturnByOrderItemId(itemId);

  if (existing) {
    const error = new Error("Return request already exists.");
    error.status = 400;
    throw error;
  }

  const addresses = await getAddressesService(userId);

  return {
    order,
    item,
    pickupAddress: order.shippingAddress,
    addresses,
    returnLastDate,
  };
};

export const createReturnRequestService = async (payload, userId) => {
  const { orderId, itemId, reason, comments, pickupAddress } = payload;

  if (!reason?.trim()) {
    throw new Error("Return reason is required.");
  }

  if (
    !pickupAddress ||
    !pickupAddress.fullName?.trim() ||
    !pickupAddress.phone?.trim() ||
    !pickupAddress.line1?.trim() ||
    !pickupAddress.city?.trim() ||
    !pickupAddress.state?.trim() ||
    !pickupAddress.pincode?.trim()
  ) {
    throw new Error("Pickup address is required.");
  }

  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    throw new Error("Order not found.");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("Item not found.");
  }

  if (item.status !== "Delivered") {
    throw new Error("Item cannot be returned.");
  }

  const deliveredAt = new Date(item.statusUpdatedAt);
  const returnLastDate = new Date(deliveredAt);
  returnLastDate.setDate(returnLastDate.getDate() + 14);

  if (Date.now() > returnLastDate.getTime()) {
    throw new Error("Return period has expired.");
  }

  const existing = await findActiveReturnByOrderItemId(itemId);

  if (existing) {
    throw new Error("Return request already exists.");
  }

  const latestReturnNumber = await getLatestReturnNumber();

  let nextNumber = 1001;

  if (latestReturnNumber) {
    const lastNumeric = Number(latestReturnNumber.replace("RET", ""));
    if (!Number.isNaN(lastNumeric)) {
      nextNumber = lastNumeric + 1;
    }
  }

  const returnNumber = `RET${nextNumber}`;

  const returnRequest = await createReturn({
    returnNumber,
    orderId: new mongoose.Types.ObjectId(orderId),
    itemId: new mongoose.Types.ObjectId(itemId),
    userId: new mongoose.Types.ObjectId(userId),
    reason: reason.trim(),
    comments: comments?.trim() || "",
    pickupAddress: {
      fullName: pickupAddress.fullName.trim(),
      phone: pickupAddress.phone.trim(),
      line1: pickupAddress.line1.trim(),
      line2: pickupAddress.line2?.trim() || "",
      city: pickupAddress.city.trim(),
      state: pickupAddress.state.trim(),
      pincode: pickupAddress.pincode.trim(),
    },
    refundAmount: item.unitPrice * item.quantity,
    status: "Requested",
    requestedAt: new Date(),
  });

  await updateOrderItemStatus(orderId, itemId, "Return Requested");

  return returnRequest;
};

export const getReturnStatusService = async ({ orderId, itemId, userId }) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const item = order.items.id(itemId);

  if (!item) {
    const error = new Error("Order item not found");
    error.status = 404;
    throw error;
  }

  const allowedStatuses = [
    "Return Requested",
    "Return Accepted",
    "Returned",
    "Refunded",
  ];

  if (!allowedStatuses.includes(item.status)) {
    const error = new Error("No return found for this item");
    error.status = 400;
    throw error;
  }

  return { order, item };
};

const getReturnDisplayStatus = (status) => {
  if (status === "Requested") return "Return Requested";

  if (["Approved", "Picked Up", "Received"].includes(status)) {
    return "Return Accepted";
  }

  if (status === "Refunded") return "Refunded";
  if (status === "Rejected") return "Return Rejected";
  if (status === "Cancelled") return "Return Cancelled";

  return status;
};

const getReturnStatusMetaText = (returnRequest) => {
  if (!returnRequest) return "";

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  switch (returnRequest.status) {
    case "Requested":
      return `Return requested on ${formatDate(returnRequest.requestedAt)}`;

    case "Approved":
      return `Return approved on ${formatDate(returnRequest.approvedAt || returnRequest.updatedAt)}`;

    case "Picked Up":
      return `Item picked up on ${formatDate(returnRequest.pickedUpAt || returnRequest.updatedAt)}`;

    case "Received":
      return `Returned item received on ${formatDate(returnRequest.receivedAt || returnRequest.updatedAt)}`;

    case "Refunded":
      return `Refund processed on ${formatDate(returnRequest.refundedAt || returnRequest.updatedAt)}`;

    case "Rejected":
      return `Return rejected on ${formatDate(returnRequest.updatedAt)}`;

    case "Cancelled":
      return `Return request cancelled on ${formatDate(returnRequest.updatedAt)}`;

    default:
      return "";
  }
};

const formatTimelineDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const buildReturnTimeline = (returnRequest) => {
  const status = returnRequest.status;

  if (status === "Rejected") {
    return [
      {
        key: "Requested",
        title: "Return Requested",
        completed: true,
        current: false,
        date: formatTimelineDate(returnRequest.requestedAt),
        note: "Your return request was submitted for review.",
      },
      {
        key: "Rejected",
        title: "Return Rejected",
        completed: true,
        current: true,
        date: formatTimelineDate(returnRequest.rejectedAt || returnRequest.updatedAt),
        note:
          returnRequest.rejectionReason ||
          "The return request was rejected by the store team.",
      },
    ];
  }

  if (status === "Cancelled") {
    return [
      {
        key: "Requested",
        title: "Return Requested",
        completed: true,
        current: false,
        date: formatTimelineDate(returnRequest.requestedAt),
        note: "Your return request was submitted for review.",
      },
      {
        key: "Cancelled",
        title: "Return Cancelled",
        completed: true,
        current: true,
        date: formatTimelineDate(returnRequest.updatedAt),
        note: "You cancelled this return request.",
      },
    ];
  }

  return [
    {
      key: "Requested",
      title: "Return Requested",
      completed: true,
      current: status === "Requested",
      date: formatTimelineDate(returnRequest.requestedAt),
      note: "Your return request has been submitted for review.",
    },
    {
      key: "Approved",
      title: "Return Approved",
      completed: ["Approved", "Picked Up", "Received", "Refunded"].includes(status),
      current: status === "Approved",
      date: formatTimelineDate(returnRequest.approvedAt),
      note: "Your return has been approved by the store team.",
    },
    {
      key: "Picked Up",
      title: "Item Picked Up",
      completed: ["Picked Up", "Received", "Refunded"].includes(status),
      current: status === "Picked Up",
      date: formatTimelineDate(returnRequest.pickedUpAt),
      note: "The returned item has been picked up.",
    },
    {
      key: "Received",
      title: "Item Received",
      completed: ["Received", "Refunded"].includes(status),
      current: status === "Received",
      date: formatTimelineDate(returnRequest.receivedAt),
      note: "The returned item has been received and verified.",
    },
    {
      key: "Refunded",
      title: "Refund Processed",
      completed: status === "Refunded",
      current: status === "Refunded",
      date: formatTimelineDate(returnRequest.refundedAt),
      note: `Refund of ₹${returnRequest.refundAmount.toLocaleString("en-IN")} has been processed.`,
    },
  ];
};

export const getReturnDetailService = async ({
  orderId,
  itemId,
  userId,
}) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const item = order.items.id(itemId);

  if (!item) {
    const error = new Error("Order item not found");
    error.status = 404;
    throw error;
  }

  const returnRequest = await findLatestReturnByOrderItemUser({
    orderId,
    itemId,
    userId,
  });

  if (!returnRequest) {
    const error = new Error("Return request not found");
    error.status = 404;
    throw error;
  }

  return {
    order,
    item,
    returnRequest,
    displayStatus: getReturnDisplayStatus(returnRequest.status),
    statusMetaText: getReturnStatusMetaText(returnRequest),
    canCancelReturn: returnRequest.status === "Requested",
    timeline: buildReturnTimeline(returnRequest),
  };
};

export const cancelReturnRequestService = async ({ returnId, userId }) => {
  const returnRequest = await findReturnByIdAndUser({
    returnId,
    userId,
  });

  if (!returnRequest) {
    const error = new Error("Return request not found");
    error.statusCode = 404;
    throw error;
  }

  if (returnRequest.status !== "Requested") {
    const error = new Error("Only requested returns can be cancelled");
    error.statusCode = 400;
    throw error;
  }

  const updatedReturn = await cancelReturnRequestRepo(returnId);

  await updateOrderItemStatus(
    returnRequest.orderId,
    returnRequest.itemId,
    "Delivered",
  );

  return updatedReturn;
};