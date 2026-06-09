import {
  findOrders,
  countOrders,
  getOrderStats,
} from "../../repositories/admin/order.repository.js";

export const getOrdersPageService = async ({
  page,
  limit,
  skip,
  search,
  status,
  payment,
  sort,
}) => {
  const filter = {};
  if (status) {
    filter.orderStatus = status;
  }
  if (payment) {
    filter.paymentMethod = payment;
  }
  if (search) {
    filter.orderNumber = {
      $regex: search,
      $options: "i",
    };
  }
  let sortOrder = {
    createdAt: -1,
  };
  if (sort === "oldest") {
    sortOrder = {
      createdAt: 1,
    };
  }

  const [orders, stats] = await Promise.all([
    findOrders(limit, skip, filter, sortOrder),
    getOrderStats(),
  ]);

  const orderCount = await countOrders(filter);
  const totalPages = Math.max(1, Math.ceil(orderCount / limit));
  return {
    orders,
    orderCount,
    totalPages,
    totalOrders: stats.totalOrders,
    processingOrders: stats.processingOrders,
    shippedOrders: stats.shippedOrders,
    deliveredOrders: stats.deliveredOrders,
  };
};
