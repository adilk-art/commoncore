const salesChartCanvas = document.getElementById("salesChart");

const salesChartFilter = document.getElementById("salesChartFilter");

const salesChartYear = document.getElementById("salesChartYear");

let salesChart = null;

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

const updateYearVisibility = () => {
  if (!salesChartYear) {
    return;
  }

  salesChartYear.style.display =
    salesChartFilter?.value === "monthly" ? "" : "none";
};

const loadSalesChart = async (filter = "monthly") => {
  try {
    const response = await axios.get("/admin/dashboard/sales-chart", {
      params: {
        filter,
        year: salesChartYear?.value || "",
      },
    });

    const data = response.data;

    if (!data.success) {
      return;
    }

    if (salesChart) {
      salesChart.destroy();
    }

    salesChart = new Chart(salesChartCanvas, {
      type: "line",

      data: {
        labels: data.labels,

        datasets: [
          {
            label: "Net Sales",

            data: data.values,

            borderColor: "#5a6474",

            backgroundColor: "rgba(90, 100, 116, 0.08)",

            borderWidth: 2,

            tension: 0.35,

            fill: true,

            pointRadius: 3,

            pointHoverRadius: 5,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        interaction: {
          intersect: false,
          mode: "index",
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            callbacks: {
              label(context) {
                return `Net Sales: ${formatCurrency(context.raw)}`;
              },
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            ticks: {
              color: "#9ca3af",
            },
          },

          y: {
            beginAtZero: true,

            border: {
              display: false,
            },

            grid: {
              color: "#f1f1f1",
            },

            ticks: {
              color: "#9ca3af",

              callback(value) {
                return formatCurrency(value);
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to load sales chart:", error);
  }
};

salesChartFilter?.addEventListener("change", () => {
  updateYearVisibility();

  loadSalesChart(salesChartFilter.value);
});

salesChartYear?.addEventListener("change", () => {
  loadSalesChart("monthly");
});

updateYearVisibility();

if (salesChartCanvas && salesChartFilter) {
  loadSalesChart(salesChartFilter.value);
}

const topProductsList = document.getElementById("topProductsList");

const topCategoriesList = document.getElementById("topCategoriesList");

const topVariantsList = document.getElementById("topVariantsList");

const renderRankingList = (container, items, getTitle, getSubtitle) => {
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="ranking-empty">
        No sales data available.
      </div>
    `;

    return;
  }

  container.innerHTML = items
    .map(
      (item, index) => `
          <div class="ranking-item">

            <span class="ranking-position">
              ${index + 1}
            </span>

            <div class="ranking-content">

              <h4>
                ${getTitle(item)}
              </h4>

              <p>
                ${getSubtitle(item)}
              </p>

            </div>

            <span class="ranking-value">
              ${item.quantitySold} sold
            </span>

          </div>
        `,
    )
    .join("");
};

const loadTopSellingData = async () => {
  try {
    const response = await axios.get("/admin/dashboard/top-selling");

    const data = response.data;

    if (!data.success) {
      throw new Error("Unable to load top selling data");
    }

    renderRankingList(
      topProductsList,
      data.products || [],
      (item) => item.productName,
      () => "Product",
    );

    renderRankingList(
      topCategoriesList,
      data.categories || [],
      (item) => item.categoryName,
      () => "Category",
    );

    renderRankingList(
      topVariantsList,
      data.variants || [],
      (item) => item.productName,
      (item) => `${item.color || "—"} / ${item.size || "—"}`,
    );
  } catch (error) {
    console.error("Failed to load top selling data:", error);

    [topProductsList, topCategoriesList, topVariantsList].forEach(
      (container) => {
        if (container) {
          container.innerHTML = `
              <div class="ranking-empty">
                Unable to load data.
              </div>
            `;
        }
      },
    );
  }
};

loadTopSellingData();
