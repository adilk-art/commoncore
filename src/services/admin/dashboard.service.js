import {
  getDashboardSalesStats,
  getTotalCustomers,
  getTotalProducts,
  getMonthlySales,
  getYearlySales,
  getWeeklySales,
  getTopSellingProducts,
  getTopSellingCategories,
  getTopSellingVariants,
} from "../../repositories/admin/dashboard.repository.js";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const getDashboardService = async () => {
  const [salesResult, totalCustomers, totalProducts] = await Promise.all([
    getDashboardSalesStats(),
    getTotalCustomers(),
    getTotalProducts(),
  ]);

  const sales = salesResult[0] || {
    totalSales: 0,
    totalOrders: 0,
  };

  return {
    stats: {
      totalSales: Number(Number(sales.totalSales || 0).toFixed(2)),

      totalOrders: Number(sales.totalOrders || 0),

      totalCustomers: Number(totalCustomers || 0),

      totalProducts: Number(totalProducts || 0),
    },
  };
};

export const getSalesChartService = async ({ filter = "monthly", year }) => {
  if (filter === "weekly") {
    const result = await getWeeklySales();

    const salesMap = new Map(
      result.map((item) => {
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);

        const key = date.toISOString().split("T")[0];

        return [key, Number(item.sales || 0)];
      }),
    );

    const labels = [];
    const values = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setDate(date.getDate() - i);

      const key = date.toISOString().split("T")[0];

      labels.push(
        date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
      );

      values.push(Number(Number(salesMap.get(key) || 0).toFixed(2)));
    }

    return {
      filter: "weekly",
      labels,
      values,
    };
  }

  if (filter === "monthly") {
    const selectedYear = Number(year) || new Date().getFullYear();

    const result = await getMonthlySales(selectedYear);

    const salesMap = new Map(
      result.map((item) => [Number(item._id), Number(item.sales || 0)]),
    );

    const values = MONTHS.map((_, index) =>
      Number(Number(salesMap.get(index + 1) || 0).toFixed(2)),
    );

    return {
      filter: "monthly",
      year: selectedYear,
      labels: MONTHS,
      values,
    };
  }

  if (filter === "yearly") {
    const result = await getYearlySales();

    return {
      filter: "yearly",

      labels: result.map((item) => String(item._id)),

      values: result.map((item) => Number(Number(item.sales || 0).toFixed(2))),
    };
  }

  const error = new Error("Invalid chart filter");

  error.status = 400;

  throw error;
};

export const getTopSellingDataService = async () => {
  const [products, categories, variants] = await Promise.all([
    getTopSellingProducts(),
    getTopSellingCategories(),
    getTopSellingVariants(),
  ]);

  return {
    products,
    categories,
    variants,
  };
};
