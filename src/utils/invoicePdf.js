import PDFDocument from "pdfkit";

export const generateInvoicePdf = ({
  order,
  activeItems,
  cancelledItems,
  cancelledAmount,
  activeSubtotal,
  currentTotal,
  gstAmount,
  res,
}) => {
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${order.orderNumber}.pdf`,
  );

  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(22).fillColor("#000").text("COMMONCORE", {
    align: "center",
  });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text("Premium Fashion & Apparel", {
      align: "center",
    });

  doc.moveDown(1.2);

  doc.strokeColor("#dddddd").moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  doc.moveDown(1.2);

  /* ---------- INVOICE DETAILS ---------- */

  doc.fillColor("#000").font("Helvetica-Bold").fontSize(15).text("INVOICE");

  doc.moveDown(0.6);

  doc.font("Helvetica").fontSize(10);

  doc.text(`Order Number : ${order.orderNumber}`);

  doc.text(
    `Order Date : ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
  );

  doc.text(`Order Status : ${order.orderStatus}`);

  doc.text(`Payment Status : ${order.paymentStatus}`);

  doc.text(`Payment Method : ${order.paymentMethod}`);

  /* ---------- BILL TO ---------- */

  doc.moveDown(1.5);

  doc.font("Helvetica-Bold").fontSize(11).text("BILL TO");

  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(10);

  doc.text(order.shippingAddress.fullName);

  doc.text(order.shippingAddress.line1);

  if (order.shippingAddress.line2) {
    doc.text(order.shippingAddress.line2);
  }

  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`);

  doc.text(order.shippingAddress.pincode);

  doc.text(`+91 ${order.shippingAddress.phone}`);

  /* ---------- ACTIVE ITEMS ---------- */

  doc.moveDown(1.8);

  doc.font("Helvetica-Bold").fontSize(11).text("ITEMS");

  doc.moveDown(0.8);

  let y = doc.y;

  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Product", 50, y);

  doc.text("Qty", 360, y);

  doc.text("Amount", 450, y);

  y += 12;

  doc.strokeColor("#dddddd").moveTo(50, y).lineTo(545, y).stroke();

  y += 10;

  activeItems.forEach((item) => {
    const amount = item.unitPrice * item.quantity;

    doc.font("Helvetica").fontSize(10);

    doc.text(
      `${item.productName}
${item.color} / ${item.size}`,
      50,
      y,
      {
        width: 260,
      },
    );

    doc.text(item.quantity.toString(), 360, y);

    doc.text(`Rs. ${amount.toLocaleString("en-IN")}`, 450, y);

    y += 36;
  });

  doc.y = y;

  /* ---------- CANCELLED ITEMS ---------- */

  if (cancelledItems.length > 0) {
    doc.y += 20;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#c62828")
      .text("CANCELLED ITEMS", 50, doc.y);

    doc.fillColor("#000");

    doc.moveDown(0.8);

    let cancelledY = doc.y;

    doc.font("Helvetica-Bold").fontSize(10);

    doc.text("Product", 50, cancelledY);

    doc.text("Qty", 360, cancelledY);

    doc.text("Amount", 450, cancelledY);

    cancelledY += 12;

    doc
      .strokeColor("#dddddd")
      .moveTo(50, cancelledY)
      .lineTo(545, cancelledY)
      .stroke();

    cancelledY += 10;

    cancelledItems.forEach((item) => {
      const amount = item.unitPrice * item.quantity;

      doc.font("Helvetica").fontSize(10);

      doc.text(
        `${item.productName}
${item.color} / ${item.size}`,
        50,
        cancelledY,
        {
          width: 260,
        },
      );

      doc.text(item.quantity.toString(), 360, cancelledY);

      doc.text(`Rs. ${amount.toLocaleString("en-IN")}`, 450, cancelledY);

      cancelledY += 36;
    });

    doc.y = cancelledY;
  }

  /* ---------- PAYMENT SUMMARY ---------- */

  doc.moveDown(1.2);

  doc.strokeColor("#dddddd").moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  doc.moveDown(1.2);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#000")
    .text("PAYMENT SUMMARY");

  doc.moveDown(0.8);

  const labelX = 320;
  const valueX = 460;

  let summaryY = doc.y;

  doc.font("Helvetica").fontSize(10);

  doc.text("Original Subtotal", labelX, summaryY);

  doc.text(`Rs. ${order.subtotal.toLocaleString("en-IN")}`, valueX, summaryY);

  summaryY += 22;

  if (cancelledAmount > 0) {
    doc.text("Cancelled Amount", labelX, summaryY);

    doc.text(
      `-Rs. ${cancelledAmount.toLocaleString("en-IN")}`,
      valueX,
      summaryY,
    );

    summaryY += 22;

    doc.text("Current Subtotal", labelX, summaryY);

    doc.text(`Rs. ${activeSubtotal.toLocaleString("en-IN")}`, valueX, summaryY);

    summaryY += 22;
  }

doc.text("Shipping", labelX, summaryY);

doc.text(
  order.shippingFee === 0 ? "Free" : `Rs. ${order.shippingFee}`,
  valueX,
  summaryY,
);

summaryY += 22;

doc.text("GST Included", labelX, summaryY);

doc.text(
  `Rs. ${gstAmount.toFixed(2)}`,
  valueX,
  summaryY,
);

summaryY += 28;

  doc.font("Helvetica-Bold").fontSize(11);

  doc.text("TOTAL", labelX, summaryY);

  doc.text(`Rs. ${currentTotal.toLocaleString("en-IN")}`, valueX, summaryY);

  doc.y = summaryY + 30;

  doc
  .font("Helvetica")
  .fontSize(9)
  .fillColor("#666")
  .text(
    "All prices are inclusive of GST.",
    320,
    doc.y,
    {
      width: 175,
      align: "left",
    },
  );

doc.moveDown(1);

  /* ---------- FOOTER ---------- */

  doc.moveDown(2);

  doc.strokeColor("#dddddd").moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  doc.moveDown(1);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text("Thank you for shopping with Commoncore", 50, doc.y, {
      width: 495,
      align: "center",
    });

  doc.end();
};
