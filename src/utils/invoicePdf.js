import PDFDocument from "pdfkit";
import { REFUNDED_STATUSES } from "./orderItemStatus.js";

const PAGE_BOTTOM = 780;

const COL = {
  product: 50,
  productWidth: 270,

  qty: 330,
  qtyWidth: 40,

  amount: 390,
  amountWidth: 100,

  status: 500,
  statusWidth: 45,
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const drawLine = (
  doc,
  y,
  start = 50,
  end = 545,
  color = "#e5e7eb",
) => {
  doc
    .strokeColor(color)
    .lineWidth(0.7)
    .moveTo(start, y)
    .lineTo(end, y)
    .stroke();
};

const drawSectionTitle = (
  doc,
  title,
  x = 50,
  y = doc.y,
) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111827")
    .text(title, x, y);
};

const getItemAmounts = (item) => {
  const quantity =
    Number(item.quantity) || 0;

  const originalUnitPrice =
    Number(item.originalUnitPrice) ||
    Number(item.unitPrice) ||
    0;

  const unitPrice =
    Number(item.unitPrice) || 0;

  const originalAmount =
    originalUnitPrice * quantity;

  const offerAmount =
    unitPrice * quantity;

  const offerDiscount =
    Math.max(
      originalAmount - offerAmount,
      0,
    );

  const couponDiscount =
    Number(item.couponDiscountAmount) || 0;

  const finalAmount =
    Math.max(
      offerAmount - couponDiscount,
      0,
    );

  return {
    quantity,
    originalAmount,
    offerAmount,
    offerDiscount,
    couponDiscount,
    finalAmount,
  };
};

const drawItemsHeader = (
  doc,
  y,
) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#6b7280");

  doc.text(
    "PRODUCT",
    COL.product,
    y,
  );

  doc.text(
    "QTY",
    COL.qty,
    y,
    {
      width: COL.qtyWidth,
      align: "center",
    },
  );

  doc.text(
    "AMOUNT",
    COL.amount,
    y,
    {
      width: COL.amountWidth,
      align: "right",
    },
  );

  doc.text(
    "STATUS",
    COL.status,
    y,
    {
      width: COL.statusWidth,
      align: "right",
    },
  );

  drawLine(
    doc,
    y + 15,
  );

  return y + 25;
};

const getItemStatus = (item) => {
  if (item.status === "Cancelled") {
    return "Cancelled";
  }

  if (REFUNDED_STATUSES.has(item.status)) {
    return "Returned";
  }

  return item.status || "Placed";
};

const getStatusColor = (status) => {
  if (status === "Cancelled") {
    return "#b91c1c";
  }

  if (
    status === "Returned" ||
    REFUNDED_STATUSES.has(status)
  ) {
    return "#7c3aed";
  }

  if (
    status === "Delivered"
  ) {
    return "#15803d";
  }

  if (
    status === "Shipped" ||
    status === "Out for Delivery"
  ) {
    return "#2563eb";
  }

  if (
    status === "Pending" ||
    status === "Placed" ||
    status === "Processing"
  ) {
    return "#b45309";
  }

  return "#4b5563";
};

const measureItemHeight = (
  item,
) => {
  const status =
    getItemStatus(item);

  if (
    status === "Cancelled" ||
    status === "Returned"
  ) {
    return 50;
  }

  return 40;
};

const drawItem = (
  doc,
  item,
  y,
) => {
  const {
    quantity,
    finalAmount,
  } = getItemAmounts(item);

  const status =
    getItemStatus(item);

  const statusColor =
    getStatusColor(status);

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor("#111827")
    .text(
      item.productName || "Product",
      COL.product,
      y,
      {
        width: COL.productWidth,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#6b7280")
    .text(
      `${item.color || ""} / ${item.size || ""}`,
      COL.product,
      y + 14,
      {
        width: COL.productWidth,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#111827")
    .text(
      String(quantity),
      COL.qty,
      y,
      {
        width: COL.qtyWidth,
        align: "center",
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(
      status === "Cancelled" ||
      status === "Returned"
        ? "#9ca3af"
        : "#111827",
    )
    .text(
      `Rs. ${formatMoney(finalAmount)}`,
      COL.amount,
      y,
      {
        width: COL.amountWidth,
        align: "right",
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(statusColor)
    .text(
      status,
      COL.status,
      y,
      {
        width: COL.statusWidth,
        align: "right",
      },
    );

  const rowHeight =
    measureItemHeight(item);

  const nextY =
    y + rowHeight;

  drawLine(
    doc,
    nextY - 5,
  );

  return nextY;
};

const drawSummaryRow = (
  doc,
  label,
  value,
  y,
  options = {},
) => {
  const {
    bold = false,
    color = "#111827",
    fontSize = 9,
  } = options;

  doc
    .font(
      bold
        ? "Helvetica-Bold"
        : "Helvetica",
    )
    .fontSize(fontSize)
    .fillColor(color)
    .text(
      label,
      320,
      y,
      {
        width: 135,
      },
    );

  doc
    .font(
      bold
        ? "Helvetica-Bold"
        : "Helvetica",
    )
    .fontSize(fontSize)
    .fillColor(color)
    .text(
      value,
      455,
      y,
      {
        width: 90,
        align: "right",
      },
    );

  return y + 19;
};

const ensureSpace = (
  doc,
  required,
) => {
  if (
    doc.y >
    PAGE_BOTTOM - required
  ) {
    doc.addPage();
    doc.y = 50;
  }
};

const formatPaymentMethod = (
  method,
) => {
  if (
    method ===
    "CashOnDelivery"
  ) {
    return "Cash on Delivery";
  }

  if (method === "Razorpay") {
    return "Razorpay";
  }

  if (method === "Wallet") {
    return "Wallet";
  }

  return String(
    method || "Not specified",
  ).replace(
    /([a-z])([A-Z])/g,
    "$1 $2",
  );
};

export const generateInvoicePdf = ({
  order,
  items,

  originalSubtotal,
  offerDiscountTotal,
  couponDiscountTotal,

  originalGstAmount,
  originalShippingFee,
  originalOrderTotal,

  cancelledAmount,
  returnedAmount,

  currentSubtotal,
  currentGstAmount,
  currentShippingFee,
  currentTotal,

  fullyCancelled,
  hasAdjustments,

  res,
}) => {
  const doc =
    new PDFDocument({
      margin: 50,
      size: "A4",
    });

  res.setHeader(
    "Content-Type",
    "application/pdf",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${order.orderNumber}.pdf"`,
  );

  doc.pipe(res);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#111827")
    .text(
      "COMMONCORE",
      50,
      50,
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6b7280")
    .text(
      "Premium Fashion & Apparel",
      50,
      75,
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#111827")
    .text(
      "INVOICE",
      430,
      50,
      {
        width: 115,
        align: "right",
      },
    );

  doc.y = 105;

  drawLine(
    doc,
    doc.y,
  );

  doc.y += 20;

  const paymentMethod =
    formatPaymentMethod(
      order.paymentMethod,
    );

  const detailsY =
    doc.y;

  drawSectionTitle(
    doc,
    "ORDER INFORMATION",
    50,
    detailsY,
  );

  drawSectionTitle(
    doc,
    "DELIVERY ADDRESS",
    315,
    detailsY,
  );

  let leftY =
    detailsY + 22;

  const drawOrderMeta = (
    label,
    value,
  ) => {
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#6b7280")
      .text(
        label,
        50,
        leftY,
        {
          width: 75,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#111827")
      .text(
        value,
        130,
        leftY,
        {
          width: 150,
        },
      );

    leftY += 18;
  };

  drawOrderMeta(
    "Order No.",
    order.orderNumber,
  );

  drawOrderMeta(
    "Date",
    new Date(
      order.createdAt,
    ).toLocaleDateString(
      "en-IN",
    ),
  );

  drawOrderMeta(
    "Payment",
    paymentMethod,
  );

  drawOrderMeta(
    "Status",
    order.paymentStatus ||
      "Pending",
  );

  let billY =
    detailsY + 22;

  const address =
    order.shippingAddress || {};

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor("#111827")
    .text(
      address.fullName || "",
      315,
      billY,
      {
        width: 230,
      },
    );

  billY += 16;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#4b5563");

  if (address.line1) {
    doc.text(
      address.line1,
      315,
      billY,
      {
        width: 230,
      },
    );

    billY += 14;
  }

  if (address.line2) {
    doc.text(
      address.line2,
      315,
      billY,
      {
        width: 230,
      },
    );

    billY += 14;
  }

  if (
    address.city ||
    address.state ||
    address.pincode
  ) {
    doc.text(
      `${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}`,
      315,
      billY,
      {
        width: 230,
      },
    );

    billY += 14;
  }

  if (address.phone) {
    doc.text(
      `+91 ${address.phone}`,
      315,
      billY,
      {
        width: 230,
      },
    );

    billY += 14;
  }

  doc.y =
    Math.max(
      leftY,
      billY,
    ) + 14;

  drawLine(
    doc,
    doc.y,
  );

  doc.y += 18;

  drawSectionTitle(
    doc,
    "ORDERED ITEMS",
  );

  doc.y += 12;

  let y =
    drawItemsHeader(
      doc,
      doc.y,
    );

  for (
    const item of items
  ) {
    const rowHeight =
      measureItemHeight(item);

    if (
      y + rowHeight >
      PAGE_BOTTOM
    ) {
      doc.addPage();

      y =
        drawItemsHeader(
          doc,
          50,
        );
    }

    y =
      drawItem(
        doc,
        item,
        y,
      );
  }

  doc.y =
    y + 18;

  ensureSpace(
    doc,
    hasAdjustments
      ? 220
      : 160,
  );

  drawSectionTitle(
    doc,
    "PAYMENT SUMMARY",
    320,
    doc.y,
  );

  let summaryY =
    doc.y + 20;

  const discountedSubtotal =
    Math.max(
      Number(
        originalSubtotal || 0,
      ) -
        Number(
          offerDiscountTotal || 0,
        ) -
        Number(
          couponDiscountTotal || 0,
        ),
      0,
    );

  summaryY =
    drawSummaryRow(
      doc,
      "Items",
      `Rs. ${formatMoney(
        originalSubtotal,
      )}`,
      summaryY,
    );

  if (
    Number(
      offerDiscountTotal,
    ) > 0
  ) {
    summaryY =
      drawSummaryRow(
        doc,
        "Offer discount",
        `-Rs. ${formatMoney(
          offerDiscountTotal,
        )}`,
        summaryY,
        {
          color:
            "#15803d",
        },
      );
  }

  if (
    Number(
      couponDiscountTotal,
    ) > 0
  ) {
    const couponLabel =
      order.coupon?.code
        ? `Coupon (${order.coupon.code})`
        : "Coupon discount";

    summaryY =
      drawSummaryRow(
        doc,
        couponLabel,
        `-Rs. ${formatMoney(
          couponDiscountTotal,
        )}`,
        summaryY,
        {
          color:
            "#15803d",
        },
      );
  }

  summaryY =
    drawSummaryRow(
      doc,
      "Subtotal",
      `Rs. ${formatMoney(
        discountedSubtotal,
      )}`,
      summaryY,
    );

  summaryY =
    drawSummaryRow(
      doc,
      "GST included",
      `Rs. ${formatMoney(
        originalGstAmount,
      )}`,
      summaryY,
      {
        color:
          "#6b7280",
      },
    );

  summaryY =
    drawSummaryRow(
      doc,
      "Shipping",
      Number(
        originalShippingFee,
      ) === 0
        ? "Free"
        : `Rs. ${formatMoney(
            originalShippingFee,
          )}`,
      summaryY,
    );

  drawLine(
    doc,
    summaryY + 1,
    320,
    545,
  );

  summaryY += 12;

  summaryY =
    drawSummaryRow(
      doc,
      "TOTAL",
      `Rs. ${formatMoney(
        originalOrderTotal,
      )}`,
      summaryY,
      {
        bold: true,
        fontSize: 11,
      },
    );

  if (hasAdjustments) {
    summaryY += 16;

    drawSectionTitle(
      doc,
      "ORDER ADJUSTMENT",
      320,
      summaryY,
    );

    summaryY += 20;

    const totalRefund =
      Number(
        cancelledAmount || 0,
      ) +
      Number(
        returnedAmount || 0,
      );

    if (totalRefund > 0) {
      summaryY =
        drawSummaryRow(
          doc,
          "Refunded",
          `-Rs. ${formatMoney(
            totalRefund,
          )}`,
          summaryY,
          {
            color:
              "#b91c1c",
          },
        );
    }

    if (fullyCancelled) {
      drawLine(
        doc,
        summaryY + 1,
        320,
        545,
      );

      summaryY += 12;

      summaryY =
        drawSummaryRow(
          doc,
          "FINAL ORDER VALUE",
          "Rs. 0.00",
          summaryY,
          {
            bold: true,
            fontSize: 10.5,
          },
        );
    } else {
      if (
        Number(
          currentSubtotal,
        ) > 0
      ) {
        summaryY =
          drawSummaryRow(
            doc,
            "Updated subtotal",
            `Rs. ${formatMoney(
              currentSubtotal,
            )}`,
            summaryY,
          );
      }

      summaryY =
        drawSummaryRow(
          doc,
          "Shipping",
          Number(
            currentShippingFee,
          ) === 0
            ? "Free"
            : `Rs. ${formatMoney(
                currentShippingFee,
              )}`,
          summaryY,
        );

      drawLine(
        doc,
        summaryY + 1,
        320,
        545,
      );

      summaryY += 12;

      summaryY =
        drawSummaryRow(
          doc,
          "CURRENT ORDER VALUE",
          `Rs. ${formatMoney(
            currentTotal,
          )}`,
          summaryY,
          {
            bold: true,
            fontSize: 10.5,
          },
        );
    }
  }

  doc.y =
    summaryY + 14;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6b7280")
    .text(
      "All prices include GST.",
      320,
      doc.y,
      {
        width: 225,
        align: "right",
      },
    );

  doc.y += 34;

  if (
    doc.y >
    PAGE_BOTTOM - 30
  ) {
    doc.addPage();
    doc.y = 50;
  }

  drawLine(
    doc,
    doc.y,
  );

  doc.y += 10;

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#6b7280")
    .text(
      "Thank you for shopping with Commoncore",
      50,
      doc.y,
      {
        width: 495,
        align: "center",
      },
    );

  doc.end();
};