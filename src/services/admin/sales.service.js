import {
  getSalesReportData,
  getSalesReportRows,
  countSalesReportOrders,
  getSalesReportExportRows,
} from "../../repositories/admin/sales.repository.js";

const REPORT_LIMIT = 10;

const getStartOfDay = (date) => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
};

const getEndOfDay = (date) => {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
};

export const getSalesDateRange = ({ filter, startDate, endDate }) => {
  const now = new Date();

  if (filter === "daily") {
    return {
      startDate: getStartOfDay(now),
      endDate: getEndOfDay(now),
    };
  }

  if (filter === "weekly") {
    const start = new Date(now);

    start.setDate(start.getDate() - 6);

    return {
      startDate: getStartOfDay(start),
      endDate: getEndOfDay(now),
    };
  }

  if (filter === "monthly") {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),

      endDate: new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    };
  }

  if (filter === "yearly") {
    return {
      startDate: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),

      endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }

  if (filter === "custom") {
    if (!startDate || !endDate) {
      const error = new Error("Start date and end date are required");

      error.status = 400;

      throw error;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      const error = new Error("Invalid date range");

      error.status = 400;

      throw error;
    }

    if (start > end) {
      const error = new Error("Start date cannot be after end date");

      error.status = 400;

      throw error;
    }

    return {
      startDate: getStartOfDay(start),
      endDate: getEndOfDay(end),
    };
  }

  return {
    startDate: getStartOfDay(now),
    endDate: getEndOfDay(now),
  };
};

const normalizeReport = (report) => ({
  grossSales: Number(Number(report.grossSales || 0).toFixed(2)),

  offerDiscount: Number(Number(report.offerDiscount || 0).toFixed(2)),

  couponDiscount: Number(Number(report.couponDiscount || 0).toFixed(2)),

  totalDiscount: Number(Number(report.totalDiscount || 0).toFixed(2)),

  netSales: Number(Number(report.netSales || 0).toFixed(2)),

  salesQuantity: Number(report.salesQuantity || 0),

  orderCount: Number(report.orderCount || 0),
});

const normalizeRow = (row) => ({
  ...row,

  username: row.username || "Unknown User",

  paymentMethod: row.paymentMethod || "Not specified",

  grossAmount: Number(Number(row.grossAmount || 0).toFixed(2)),

  offerDiscount: Number(Number(row.offerDiscount || 0).toFixed(2)),

  couponDiscount: Number(Number(row.couponDiscount || 0).toFixed(2)),

  totalDiscount: Number(Number(row.totalDiscount || 0).toFixed(2)),

  netAmount: Number(Number(row.netAmount || 0).toFixed(2)),
});

export const getSalesReportService = async ({
  filter = "daily",
  startDate,
  endDate,
  page = 1,
}) => {
  const allowedFilters = ["daily", "weekly", "monthly", "yearly", "custom"];

  if (!allowedFilters.includes(filter)) {
    const error = new Error("Invalid sales report filter");

    error.status = 400;

    throw error;
  }

  const dateRange = getSalesDateRange({
    filter,
    startDate,
    endDate,
  });

  page = Math.max(1, Number(page) || 1);

  let skip = (page - 1) * REPORT_LIMIT;

  const [result, rows, totalRows] = await Promise.all([
    getSalesReportData(dateRange),

    getSalesReportRows({
      ...dateRange,
      skip,
      limit: REPORT_LIMIT,
    }),

    countSalesReportOrders(dateRange),
  ]);

  const report = normalizeReport(result[0] || {});

  const totalPages = Math.max(1, Math.ceil(totalRows / REPORT_LIMIT));

  if (page > totalPages) {
    page = totalPages;

    skip = (page - 1) * REPORT_LIMIT;
  }
  return {
    report,

    rows: rows.map(normalizeRow),

    pagination: {
      currentPage: page,
      totalPages,
      totalRows,
      limit: REPORT_LIMIT,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },

    filter,

    startDate: dateRange.startDate,

    endDate: dateRange.endDate,
  };
};

export const getSalesReportExportService = async ({
  filter = "daily",
  startDate,
  endDate,
}) => {
  const allowedFilters = ["daily", "weekly", "monthly", "yearly", "custom"];

  if (!allowedFilters.includes(filter)) {
    const error = new Error("Invalid sales report filter");

    error.status = 400;

    throw error;
  }

  const dateRange = getSalesDateRange({
    filter,
    startDate,
    endDate,
  });

  const [result, rows] = await Promise.all([
    getSalesReportData(dateRange),

    getSalesReportExportRows(dateRange),
  ]);

  const report = normalizeReport(result[0] || {});

  return {
    report,

    rows: rows.map(normalizeRow),

    filter,

    startDate: dateRange.startDate,

    endDate: dateRange.endDate,
  };
};
