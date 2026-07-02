import { getOrdersPageService,getOrderDetailService,markCodAsPaidService,updateItemStatusService } from "../../services/admin/order.service.js";
import {canMarkCodPaid } from "../../utils/orderStatus.js";

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

export const getOrderDetailPage = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const result = await getOrderDetailService(orderId);

    res.render("admin/order-details.ejs", {
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const markCodAsPaid = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    await markCodAsPaidService(orderId);

    res.json({
      success: true,
      message: "COD marked as paid"
    });

  } catch (err) {
    next(err);
  }
};

export const updateItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId, status } = req.body;

    const result = await updateItemStatusService({
      orderId,
      itemId,
      status,
    });
    

    res.json({
  success: true,
  message: "Item status updated",
  orderStatus: result.orderStatus,
  showCodButton: result.showCodButton
});
  } catch (err) {
    next(err);
  }
};