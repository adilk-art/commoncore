import { getOrdersPageService } from "../../services/admin/order.service.js";

export const getOrdersPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    const status = req.query.status || "";
    const payment = req.query.payment || "";
    const sort = req.query.sort || "latest";

    const result = await getOrdersPageService({
      page,
      limit,
      skip,
      search,
      status,
      payment,
      sort,
    });

    res.render("admin/orders.ejs", {
      orders: result.orders,
      totalOrders: result.totalOrders,
      processingOrders: result.processingOrders,
      shippedOrders: result.shippedOrders,
      deliveredOrders: result.deliveredOrders,
      orderCount: result.orderCount,
      totalPages: result.totalPages,
      currentPage: page,
      limit,
      skip,
      search,
      status,
      payment,
      sort,
    });
  } catch (error) {
    next(error);
  }
};
