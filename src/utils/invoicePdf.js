import PDFDocument from "pdfkit";
import { REFUNDED_STATUSES } from "./orderItemStatus.js";

const PAGE_BOTTOM = 780;

const COL = {
  product: 50,
  productWidth: 285,

  qty: 365,

  amount: 440,
  amountWidth: 105,
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

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
    .text(
      title,
      x,
      y,
    );
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
      originalAmount -
      offerAmount,
      0,
    );

  const couponDiscount =
    Number(
      item.couponDiscountAmount,
    ) || 0;

  const finalAmount =
    Math.max(
      offerAmount -
      couponDiscount,
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

const getItemDiscountText = (
  item,
) => {
  const {
    offerDiscount,
    couponDiscount,
  } = getItemAmounts(item);

  const parts = [];

  if (offerDiscount > 0) {
    parts.push(
      `Offer -Rs. ${formatMoney(
        offerDiscount,
      )}`,
    );
  }

  if (couponDiscount > 0) {
    parts.push(
      `Coupon -Rs. ${formatMoney(
        couponDiscount,
      )}`,
    );
  }

  return parts.join("  ·  ");
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
  );

  doc.text(
    "AMOUNT",
    COL.amount,
    y,
    {
      width:
        COL.amountWidth,
      align: "right",
    },
  );

  drawLine(
    doc,
    y + 15,
  );

  return y + 25;
};

const measureItemHeight = (
  item,
) => {
  const hasDiscount =
    Boolean(
      getItemDiscountText(item),
    );

  const adjusted =
    item.status === "Cancelled" ||
    REFUNDED_STATUSES.has(
      item.status,
    );

  if (
    hasDiscount &&
    adjusted
  ) {
    return 60;
  }

  if (
    hasDiscount ||
    adjusted
  ) {
    return 50;
  }

  return 40;
};

const drawStrikeThrough = (
  doc,
  text,
  x,
  y,
  width,
) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(9.5);

  const textWidth =
    Math.min(
      doc.widthOfString(text),
      width,
    );

  const right =
    x + width;

  const start =
    right - textWidth;

  doc
    .strokeColor("#9ca3af")
    .lineWidth(0.8)
    .moveTo(
      start,
      y + 5,
    )
    .lineTo(
      right,
      y + 5,
    )
    .stroke();
};

const drawItem = (
  doc,
  item,
  y,
) => {
  const {
    quantity,
    finalAmount,
  } =
    getItemAmounts(item);

  const discountText =
    getItemDiscountText(item);

  const isCancelled =
    item.status === "Cancelled";

  const isReturned =
    REFUNDED_STATUSES.has(
      item.status,
    ) &&
    !isCancelled;

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor("#111827")
    .text(
      item.productName,
      COL.product,
      y,
      {
        width:
          COL.productWidth,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#6b7280")
    .text(
      `${item.color} / ${item.size}`,
      COL.product,
      y + 14,
      {
        width:
          COL.productWidth,
      },
    );

  let metaY =
    y + 28;

  if (discountText) {
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#15803d")
      .text(
        discountText,
        COL.product,
        metaY,
        {
          width:
            COL.productWidth,
        },
      );

    metaY += 12;
  }

  if (isCancelled) {
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#b91c1c")
      .text(
        "Cancelled",
        COL.product,
        metaY,
      );
  } else if (isReturned) {
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#7c3aed")
      .text(
        item.status,
        COL.product,
        metaY,
      );
  }

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#111827")
    .text(
      String(quantity),
      COL.qty,
      y,
    );

  const amountText =
    `Rs. ${formatMoney(
      finalAmount,
    )}`;

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(
      isCancelled ||
      isReturned
        ? "#9ca3af"
        : "#111827",
    )
    .text(
      amountText,
      COL.amount,
      y,
      {
        width:
          COL.amountWidth,
        align: "right",
      },
    );

  if (
    isCancelled ||
    isReturned
  ) {
    drawStrikeThrough(
      doc,
      amountText,
      COL.amount,
      y,
      COL.amountWidth,
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(
        isCancelled
          ? "#b91c1c"
          : "#7c3aed",
      )
      .text(
        isCancelled
          ? "Cancelled"
          : item.status,
        COL.amount,
        y + 15,
        {
          width:
            COL.amountWidth,
          align: "right",
        },
      );
  }

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
    order.paymentMethod ===
    "CashOnDelivery"
      ? "Cash On Delivery"
      : order.paymentMethod.replace(
          /([a-z])([A-Z])/g,
          "$1 $2",
        );

  const detailsY =
    doc.y;

  drawSectionTitle(
    doc,
    "ORDER DETAILS",
    50,
    detailsY,
  );

  drawSectionTitle(
    doc,
    "BILL TO",
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
          width: 70,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#111827")
      .text(
        value,
        125,
        leftY,
        {
          width: 155,
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
    "Status",
    order.orderStatus,
  );

  drawOrderMeta(
    "Payment",
    `${paymentMethod} / ${order.paymentStatus}`,
  );

  let billY =
    detailsY + 22;

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor("#111827")
    .text(
      order.shippingAddress.fullName,
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

  doc.text(
    order.shippingAddress.line1,
    315,
    billY,
    {
      width: 230,
    },
  );

  billY += 14;

  if (
    order.shippingAddress.line2
  ) {
    doc.text(
      order.shippingAddress.line2,
      315,
      billY,
      {
        width: 230,
      },
    );

    billY += 14;
  }

  doc.text(
    `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
    315,
    billY,
    {
      width: 230,
    },
  );

  billY += 14;

  doc.text(
    `+91 ${order.shippingAddress.phone}`,
    315,
    billY,
    {
      width: 230,
    },
  );

  billY += 14;

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
    "ITEMS",
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
      ? 250
      : 180,
  );

  drawSectionTitle(
    doc,
    "ORDER SUMMARY",
    320,
    doc.y,
  );

  let summaryY =
    doc.y + 20;

  summaryY =
    drawSummaryRow(
      doc,
      "Original subtotal",
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

    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor("#111827")
      .text(
        fullyCancelled
          ? "CANCELLATION"
          : "ORDER ADJUSTMENTS",
        320,
        summaryY,
      );

    summaryY += 20;

    if (
      Number(
        cancelledAmount,
      ) > 0
    ) {
      summaryY =
        drawSummaryRow(
          doc,
          fullyCancelled
            ? "Cancelled amount"
            : "Cancelled items",
          `-Rs. ${formatMoney(
            cancelledAmount,
          )}`,
          summaryY,
          {
            color:
              "#b91c1c",
          },
        );
    }

    if (
      Number(
        returnedAmount,
      ) > 0
    ) {
      summaryY =
        drawSummaryRow(
          doc,
          "Returned items",
          `-Rs. ${formatMoney(
            returnedAmount,
          )}`,
          summaryY,
          {
            color:
              "#b91c1c",
          },
        );
    }

    if (!fullyCancelled) {
      summaryY =
        drawSummaryRow(
          doc,
          "Current subtotal",
          `Rs. ${formatMoney(
            currentSubtotal,
          )}`,
          summaryY,
        );

      summaryY =
        drawSummaryRow(
          doc,
          "GST included",
          `Rs. ${formatMoney(
            currentGstAmount,
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
            currentShippingFee,
          ) === 0
            ? "Free"
            : `Rs. ${formatMoney(
                currentShippingFee,
              )}`,
          summaryY,
        );
    }

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
        fullyCancelled
          ? "Rs. 0.00"
          : `Rs. ${formatMoney(
              currentTotal,
            )}`,
        summaryY,
        {
          bold: true,
          fontSize: 10.5,
        },
      );
  }

  doc.y =
    summaryY + 12;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6b7280")
    .text(
      "All prices are inclusive of GST.",
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