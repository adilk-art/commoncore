import {
  getReturnsPageService,
  getReturnDetailService,
  updateReturnStatusService,
  rejectReturnService,
  processReturnRefundService,
} from "../../services/admin/return.service.js";

export const getReturnsPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "latest";

    const result = await getReturnsPageService({
      page,
      limit,
      skip,
      search,
      status,
      sort,
    });

    res.render("admin/returns.ejs", {
      returns: result.returns,
      totalReturns: result.totalReturns,
      requestedReturns: result.requestedReturns,
      approvedReturns: result.approvedReturns,
      refundedReturns: result.refundedReturns,
      returnCount: result.returnCount,
      totalPages: result.totalPages,
      currentPage: page,
      limit,
      skip,
      search,
      status,
      sort,
    });
  } catch (error) {
    next(error);
  }
};

export const getReturnDetailPage = async (req, res, next) => {
  try {
    const { returnRequest, order, user, item, pickupAddress } =
      await getReturnDetailService(req.params.returnId);

    res.render("admin/return-detail", {
      returnRequest,
      order,
      user,
      item,
      pickupAddress,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReturnStatus = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updatedReturn = await updateReturnStatusService(returnId, status);

    return res.status(200).json({
      success: true,
      message: `Return marked as ${updatedReturn.status}`,
      returnRequest: updatedReturn,
    });
  } catch (error) {
    console.error(error)
    next(error);
  }
};

export const rejectReturn = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const updatedReturn = await rejectReturnService(
      returnId,
      rejectionReason.trim(),
    );

    return res.status(200).json({
      success: true,
      message: "Return rejected successfully",
      returnRequest: updatedReturn,
    });
  } catch (error) {
    next(error);
  }
};

export const processReturnRefund = async (req, res, next) => {
  try {
    const { returnId } = req.params;

    const updatedReturn = await processReturnRefundService(returnId);

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      returnRequest: updatedReturn,
    });
  } catch (error) {
    next(error);
  }
};