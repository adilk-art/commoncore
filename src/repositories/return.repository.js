import Return from "../models/return.model.js";

export const createReturn = (data) => {
  return Return.create(data);
};

export const findActiveReturnByOrderItemId = (itemId) => {
  return Return.findOne({
    itemId,
    status: { $ne: "Cancelled" },
  }).sort({ createdAt: -1 });
};

export const getLatestReturnNumber = async () => {
  const latestReturn = await Return.findOne()
    .sort({ createdAt: -1 })
    .select("returnNumber");

  return latestReturn?.returnNumber || null;
};

export const findLatestReturnByOrderItemUser = ({
  orderId,
  itemId,
  userId,
}) => {
  return Return.findOne({
    orderId,
    itemId,
    userId,
  }).sort({ createdAt: -1 });
};

export const findReturnByIdAndUser = ({
  returnId,
  userId,
}) => {
  return Return.findOne({
    _id: returnId,
    userId,
  });
};

export const cancelReturnRequestRepo = (returnId) => {
  return Return.findByIdAndUpdate(
    returnId,
    {
      $set: {
        status: "Cancelled",
      },
    },
    { new: true },
  );
};