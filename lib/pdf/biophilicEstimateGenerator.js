import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 36,
};

const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
const BOTTOM_LIMIT = PAGE.height - PAGE.margin;

const C = {
  darkGreen: "#365321",
  sageGreen: "#607a43",
  paleGreen: "#eef5e8",
  gold: "#b28b2d",
  border: "#d6d9d1",
  rowAlt: "#f7f8f4",
  text: "#1f261b",
  muted: "#5d6558",
  light: "#8a9382",
  white: "#ffffff",
};

function cleanText(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rupee(value) {
  const n = numberValue(value);
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function amountInWords(value) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = n => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : ""));
  const three = n => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? ones[h] + " Hundred" : "") + (r ? (h ? " " : "") + two(r) : "");
  };

  let num = Math.round(numberValue(value));
  if (!num) return "Zero Rupees Only";

  const parts = [];
  if (num >= 10000000) {
    parts.push(three(Math.floor(num / 10000000)) + " Crore");
    num %= 10000000;
  }
  if (num >= 100000) {
    parts.push(three(Math.floor(num / 100000)) + " Lakh");
    num %= 100000;
  }
  if (num >= 1000) {
    parts.push(three(Math.floor(num / 1000)) + " Thousand");
    num %= 1000;
  }
  if (num) parts.push(three(num));
  return parts.join(" ") + " Rupees Only";
}

function itemAmount(item) {
  if (item.fixedAmt != null && item.fixedAmt !== "") return numberValue(item.fixedAmt);
  const qty = Number(item.qty);
  const rate = Number(item.rate);
  return Number.isFinite(qty) && Number.isFinite(rate) ? qty * rate : 0;
}

function totals(data) {
  const itemSubtotal = (data.lineItems || []).reduce((sum, item) => sum + itemAmount(item), 0);
  const extraTotal = (data.extraCharges || []).reduce((sum, item) => sum + numberValue(item.amount), 0);
  const subtotal = itemSubtotal + extraTotal;
  const gstPercent = numberValue(data.gstPercent ?? 18);
  const gst = Math.round(subtotal * gstPercent) / 100;
  return { itemSubtotal, extraTotal, subtotal, gstPercent, gst, grand: subtotal + gst };
}

function line(doc, x, y, width, color = C.border) {
  doc.save().moveTo(x, y).lineTo(x + width, y).strokeColor(color).lineWidth(0.6).stroke().restore();
}

function rect(doc, x, y, width, height, fill, stroke = C.border, radius = 4) {
  doc.save().roundedRect(x, y, width, height, radius).fillAndStroke(fill, stroke).restore();
}

function text(doc, value, x, y, options = {}) {
  const {
    width,
    align = "left",
    size = 9,
    font = "Helvetica",
    color = C.text,
    lineGap = 1.5,
  } = options;

  doc.font(font).fontSize(size).fillColor(color).text(cleanText(value), x, y, {
    width,
    align,
    lineGap,
  });
  return doc.y;
}

function height(doc, value, width, options = {}) {
  const {
    size = 9,
    font = "Helvetica",
    lineGap = 1.5,
  } = options;

  doc.font(font).fontSize(size);
  return doc.heightOfString(cleanText(value), { width, lineGap });
}

function addPage(doc, data) {
  doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawPageHeader(doc, data, true);
  return 72;
}

function ensureSpace(doc, y, needed, data) {
  return y + needed > BOTTOM_LIMIT ? addPage(doc, data) : y;
}

function drawPageHeader(doc, data, compact = false) {
  const y = compact ? 26 : 28;
  text(doc, data.companyName || "KarmYog Vatika", PAGE.margin, y, {
    width: 240,
    size: compact ? 13 : 18,
    font: "Helvetica-Bold",
    color: C.darkGreen,
  });
  text(doc, data.companySubtitle || "Biophilic Learning Garden Initiative", PAGE.margin, y + (compact ? 17 : 23), {
    width: 260,
    size: compact ? 7 : 8,
    color: C.sageGreen,
  });
  text(doc, compact ? `Estimate Ref: ${data.projectRef || ""}` : "ESTIMATE", PAGE.margin + 275, y + (compact ? 2 : -3), {
    width: CONTENT_WIDTH - 275,
    align: "right",
    size: compact ? 8 : 24,
    font: compact ? "Helvetica" : "Helvetica-BoldOblique",
    color: compact ? C.muted : C.gold,
  });
  if (!compact) {
    text(doc, `Ref: ${data.projectRef || ""}`, PAGE.margin + 275, y + 26, {
      width: CONTENT_WIDTH - 275,
      align: "right",
      size: 8,
      color: C.muted,
    });
  }
  line(doc, PAGE.margin, compact ? 62 : 64, CONTENT_WIDTH);
}

function drawCardTitle(doc, title, x, y, width) {
  text(doc, title, x + 12, y + 10, {
    width: width - 24,
    size: 9,
    font: "Helvetica-Bold",
    color: C.darkGreen,
  });
  line(doc, x + 12, y + 26, width - 24);
}

function drawClientCards(doc, data, y) {
  const gap = 12;
  const cardWidth = (CONTENT_WIDTH - gap) / 2;
  const cardHeight = 112;

  rect(doc, PAGE.margin, y, cardWidth, cardHeight, C.white);
  drawCardTitle(doc, "Prepared For", PAGE.margin, y, cardWidth);
  text(doc, data.clientName || "Client Name", PAGE.margin + 12, y + 36, {
    width: cardWidth - 24,
    size: 12,
    font: "Helvetica-Bold",
  });
  text(doc, data.siteAddress || data.projectLocation || "", PAGE.margin + 12, y + 56, {
    width: cardWidth - 24,
    size: 8.5,
    color: C.muted,
  });
  text(doc, data.projectName || "", PAGE.margin + 12, y + 82, {
    width: cardWidth - 24,
    size: 8.5,
    color: C.muted,
  });

  const rx = PAGE.margin + cardWidth + gap;
  rect(doc, rx, y, cardWidth, cardHeight, C.white);
  drawCardTitle(doc, "Estimate Details", rx, y, cardWidth);
  const rows = [
    ["Date", data.estimateDate],
    ["Valid Until", data.validUntil],
    ["Prepared By", data.preparedBy],
    ["Project Type", data.projectType],
  ];
  let rowY = y + 38;
  for (const [label, value] of rows) {
    text(doc, label, rx + 12, rowY, { width: 72, size: 8, color: C.light });
    text(doc, value || "-", rx + 88, rowY, { width: cardWidth - 100, size: 8, font: "Helvetica-Bold" });
    rowY += 17;
  }

  return y + cardHeight + 18;
}

function drawOverview(doc, data, y, total) {
  const h = 78;
  rect(doc, PAGE.margin, y, CONTENT_WIDTH, h, C.paleGreen, "#c8d7bd");
  text(doc, "Project Overview", PAGE.margin + 14, y + 12, {
    width: CONTENT_WIDTH - 28,
    size: 8,
    font: "Helvetica-Bold",
    color: C.sageGreen,
  });
  text(doc, data.projectName || data.projectType || "Biophilic Project", PAGE.margin + 14, y + 28, {
    width: CONTENT_WIDTH - 180,
    size: 13,
    font: "Helvetica-Bold",
    color: C.darkGreen,
  });
  text(doc, data.projectLocation || data.siteAddress || "", PAGE.margin + 14, y + 49, {
    width: CONTENT_WIDTH - 180,
    size: 8.5,
    color: C.muted,
  });
  text(doc, "Grand Total", PAGE.margin + CONTENT_WIDTH - 150, y + 18, {
    width: 132,
    align: "right",
    size: 8,
    color: C.muted,
  });
  text(doc, `Rs. ${rupee(total.grand)}`, PAGE.margin + CONTENT_WIDTH - 150, y + 35, {
    width: 132,
    align: "right",
    size: 15,
    font: "Helvetica-Bold",
    color: C.darkGreen,
  });
  return y + h + 18;
}

function drawTableHeader(doc, y) {
  const x = PAGE.margin;
  const columns = tableColumns();
  doc.save().roundedRect(x, y, CONTENT_WIDTH, 28, 4).fill(C.darkGreen).restore();
  for (const col of columns) {
    text(doc, col.label, x + col.x + 5, y + 8, {
      width: col.width - 10,
      align: col.align || "left",
      size: 7.5,
      font: "Helvetica-Bold",
      color: C.white,
      lineGap: 0,
    });
  }
  return y + 28;
}

function tableColumns() {
  return [
    { label: "#", x: 0, width: 28, align: "center" },
    { label: "Zone", x: 28, width: 76 },
    { label: "Item / Description", x: 104, width: 214 },
    { label: "Qty", x: 318, width: 54, align: "right" },
    { label: "Rate", x: 372, width: 70, align: "right" },
    { label: "Amount", x: 442, width: 81, align: "right" },
  ];
}

function drawLineItems(doc, data, y) {
  text(doc, "Detailed Cost Breakdown", PAGE.margin, y, {
    width: CONTENT_WIDTH,
    size: 9,
    font: "Helvetica-Bold",
    color: C.darkGreen,
  });
  y += 17;
  y = drawTableHeader(doc, y);

  const columns = tableColumns();
  const allRows = [
    ...(data.lineItems || []).map((item, index) => ({ type: "item", item, index: index + 1 })),
    ...(data.extraCharges || []).filter(item => item.description || item.amount).map(item => ({ type: "extra", item })),
  ];

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    const item = row.item;
    const amount = row.type === "item" ? itemAmount(item) : numberValue(item.amount);
    const itemTitle = row.type === "item" ? item.itemName || "-" : item.description || "Extra Charge";
    const itemSub = row.type === "item" ? item.subText || item.description || "" : "";
    const zone = row.type === "item" ? [item.zone, item.zoneSub].filter(Boolean).join("\n") : "";
    const qty = row.type === "item" ? item.qtyStr || (item.qty ? `${item.qty} ${item.unit || ""}` : "-") : "-";
    const rate = row.type === "item" && item.rate != null ? `Rs. ${rupee(item.rate)}` : "-";

    const itemHeight = height(doc, itemTitle, columns[2].width - 10, { size: 8.5, font: "Helvetica-Bold" }) +
      (itemSub ? height(doc, itemSub, columns[2].width - 10, { size: 7.5 }) + 4 : 0);
    const zoneHeight = height(doc, zone, columns[1].width - 10, { size: 7.5 });
    const rowHeight = Math.max(34, itemHeight + 16, zoneHeight + 14);

    if (y + rowHeight > BOTTOM_LIMIT - 110) {
      y = addPage(doc, data);
      y = drawTableHeader(doc, y);
    }

    if (i % 2 === 1) {
      doc.save().rect(PAGE.margin, y, CONTENT_WIDTH, rowHeight).fill(C.rowAlt).restore();
    }
    line(doc, PAGE.margin, y + rowHeight, CONTENT_WIDTH);

    text(doc, row.type === "item" ? row.index : "", PAGE.margin + columns[0].x + 5, y + 10, {
      width: columns[0].width - 10,
      align: "center",
      size: 8,
      color: C.muted,
    });
    text(doc, zone, PAGE.margin + columns[1].x + 5, y + 9, {
      width: columns[1].width - 10,
      size: 7.5,
      color: C.muted,
    });
    text(doc, itemTitle, PAGE.margin + columns[2].x + 5, y + 8, {
      width: columns[2].width - 10,
      size: 8.5,
      font: "Helvetica-Bold",
    });
    if (itemSub) {
      text(doc, itemSub, PAGE.margin + columns[2].x + 5, y + 21, {
        width: columns[2].width - 10,
        size: 7.5,
        color: C.muted,
      });
    }
    text(doc, qty, PAGE.margin + columns[3].x + 5, y + 9, {
      width: columns[3].width - 10,
      align: "right",
      size: 8,
      color: C.muted,
    });
    text(doc, rate, PAGE.margin + columns[4].x + 5, y + 9, {
      width: columns[4].width - 10,
      align: "right",
      size: 8,
      color: C.muted,
    });
    text(doc, `Rs. ${rupee(amount)}`, PAGE.margin + columns[5].x + 5, y + 9, {
      width: columns[5].width - 10,
      align: "right",
      size: 8.5,
      font: "Helvetica-Bold",
    });

    y += rowHeight;
  }

  return y + 12;
}

function drawTotals(doc, data, y, total) {
  y = ensureSpace(doc, y, 116, data);
  const boxWidth = 230;
  const x = PAGE.margin + CONTENT_WIDTH - boxWidth;
  rect(doc, x, y, boxWidth, 92, C.white);

  const rows = [
    ["Planters & Plants", total.itemSubtotal],
    ["Extra Charges", total.extraTotal],
    ["Subtotal", total.subtotal],
    [`GST (${total.gstPercent || 0}%)`, total.gst],
  ];

  let rowY = y + 12;
  for (const [label, value] of rows) {
    text(doc, label, x + 12, rowY, { width: 120, size: 8, color: C.muted });
    text(doc, `Rs. ${rupee(value)}`, x + 126, rowY, { width: 92, align: "right", size: 8, font: "Helvetica-Bold" });
    rowY += 15;
  }

  line(doc, x + 12, rowY + 1, boxWidth - 24);
  text(doc, "Grand Total", x + 12, rowY + 8, { width: 110, size: 9, font: "Helvetica-Bold", color: C.darkGreen });
  text(doc, `Rs. ${rupee(total.grand)}`, x + 118, rowY + 8, {
    width: 100,
    align: "right",
    size: 11,
    font: "Helvetica-Bold",
    color: C.darkGreen,
  });

  const wordsX = PAGE.margin;
  const wordsW = CONTENT_WIDTH - boxWidth - 18;
  rect(doc, wordsX, y, wordsW, 92, C.darkGreen, C.darkGreen);
  text(doc, amountInWords(total.grand), wordsX + 14, y + 18, {
    width: wordsW - 28,
    size: 9,
    font: "Helvetica-BoldOblique",
    color: C.white,
  });
  text(doc, "Total Estimate", wordsX + 14, y + 58, {
    width: wordsW - 28,
    size: 11,
    font: "Helvetica-Bold",
    color: C.white,
  });

  return y + 110;
}

function bulletListHeight(doc, items, width) {
  return items.reduce((sum, item) => sum + Math.max(12, height(doc, item, width - 18, { size: 8 }) + 3), 0);
}

function drawBulletList(doc, items, x, y, width, color = C.sageGreen) {
  let currentY = y;
  for (const item of items) {
    const h = Math.max(12, height(doc, item, width - 18, { size: 8 }) + 3);
    doc.save().circle(x + 4, currentY + 5, 2.2).fill(color).restore();
    text(doc, item, x + 14, currentY, { width: width - 18, size: 8, color: C.text });
    currentY += h;
  }
  return currentY;
}

function drawSimpleCard(doc, title, x, y, width, bodyHeight) {
  const cardHeight = bodyHeight + 42;
  rect(doc, x, y, width, cardHeight, C.white);
  drawCardTitle(doc, title, x, y, width);
  return { bodyY: y + 34, height: cardHeight };
}

function drawPageTwo(doc, data, total) {
  doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  drawPageHeader(doc, data, true);

  const gap = 12;
  const half = (CONTENT_WIDTH - gap) / 2;
  let y = 78;

  const schedule = data.paymentSchedule?.length
    ? data.paymentSchedule
    : [
        { pct: "50%", label: "Upon Confirmation", amount: total.grand * 0.5 },
        { pct: "40%", label: "Prior to Dispatch", amount: total.grand * 0.4 },
        { pct: "10%", label: "Upon Completion", amount: total.grand * 0.1 },
      ];
  const included = data.whatsIncluded || [];

  const scheduleHeight = schedule.length * 19 + 18;
  const includedHeight = bulletListHeight(doc, included, half - 24) + 2;
  const firstHeight = Math.max(scheduleHeight, includedHeight);

  let cardInfo = drawSimpleCard(doc, "Payment Schedule", PAGE.margin, y, half, firstHeight);
  let sy = cardInfo.bodyY;
  for (const row of schedule) {
    const pct = row.pct || "";
    const computed = row.amount || total.grand * numberValue(String(pct).replace("%", "")) / 100;
    text(doc, pct, PAGE.margin + 12, sy, { width: 34, size: 8.5, font: "Helvetica-Bold", color: C.sageGreen });
    text(doc, row.label || "", PAGE.margin + 50, sy, { width: half - 132, size: 8, color: C.muted });
    text(doc, `Rs. ${rupee(computed)}`, PAGE.margin + half - 82, sy, { width: 70, align: "right", size: 8.5, font: "Helvetica-Bold" });
    sy += 19;
  }

  const rx = PAGE.margin + half + gap;
  cardInfo = drawSimpleCard(doc, "What's Included", rx, y, half, firstHeight);
  drawBulletList(doc, included, rx + 12, cardInfo.bodyY, half - 24);
  y += cardInfo.height + 12;

  const excluded = data.notIncluded || [];
  if (excluded.length) {
    const h = bulletListHeight(doc, excluded, CONTENT_WIDTH - 24);
    cardInfo = drawSimpleCard(doc, "Not Included", PAGE.margin, y, CONTENT_WIDTH, h);
    drawBulletList(doc, excluded, PAGE.margin + 12, cardInfo.bodyY, CONTENT_WIDTH - 24, C.light);
    y += cardInfo.height + 12;
  }

  const timeline = Array.isArray(data.projectTimeline) ? data.projectTimeline.join("\n") : cleanText(data.projectTimeline);
  const maintenance = cleanText(data.maintenanceSupport);
  const timelineText = [timeline, maintenance].filter(Boolean).join("\n\n");
  if (timelineText) {
    const h = height(doc, timelineText.replace(/\*\*/g, ""), CONTENT_WIDTH - 24, { size: 8.5, lineGap: 3 });
    y = ensureSpace(doc, y, h + 54, data);
    cardInfo = drawSimpleCard(doc, "Timeline & Maintenance", PAGE.margin, y, CONTENT_WIDTH, h + 4);
    text(doc, timelineText.replace(/\*\*/g, ""), PAGE.margin + 12, cardInfo.bodyY, {
      width: CONTENT_WIDTH - 24,
      size: 8.5,
      color: C.muted,
      lineGap: 3,
    });
    y += cardInfo.height + 12;
  }

  const bank = data.bankingDetails || {};
  const bankRows = [
    ["Account Holder", bank.accountHolder],
    ["Bank", bank.bank],
    ["Account No.", bank.accountNo],
    ["IFSC Code", bank.ifsc],
  ].filter(([, value]) => value);
  if (bankRows.length) {
    y = ensureSpace(doc, y, 112, data);
    cardInfo = drawSimpleCard(doc, "Banking Details for Payment", PAGE.margin, y, CONTENT_WIDTH, 58);
    let by = cardInfo.bodyY;
    for (const [label, value] of bankRows) {
      text(doc, label, PAGE.margin + 12, by, { width: 92, size: 8, color: C.light });
      text(doc, value, PAGE.margin + 112, by, { width: CONTENT_WIDTH - 124, size: 8, font: "Helvetica-Bold" });
      by += 14;
    }
    y += cardInfo.height + 12;
  }

  if (data.disclaimer) {
    y = ensureSpace(doc, y, 60, data);
    text(doc, data.disclaimer, PAGE.margin, y, {
      width: CONTENT_WIDTH,
      align: "center",
      size: 7,
      color: C.light,
      lineGap: 2,
    });
  }

  const sig = data.signatory || {};
  const fy = PAGE.height - 82;
  line(doc, PAGE.margin, fy - 14, CONTENT_WIDTH);
  text(doc, sig.name || "", PAGE.margin, fy, { width: CONTENT_WIDTH / 2, size: 9, font: "Helvetica-Bold" });
  text(doc, sig.title || "", PAGE.margin, fy + 14, { width: CONTENT_WIDTH / 2, size: 8, color: C.sageGreen });
  text(doc, sig.contact || "", PAGE.margin, fy + 27, { width: CONTENT_WIDTH / 2, size: 7.5, color: C.muted });
  text(doc, data.companyName || "KarmYog Vatika", PAGE.margin + CONTENT_WIDTH / 2, fy + 5, {
    width: CONTENT_WIDTH / 2,
    align: "right",
    size: 13,
    font: "Helvetica-BoldOblique",
    color: C.darkGreen,
  });
  text(doc, data.companyTagline || "NatureLink Education Network Pvt. Ltd.", PAGE.margin + CONTENT_WIDTH / 2, fy + 23, {
    width: CONTENT_WIDTH / 2,
    align: "right",
    size: 7,
    color: C.muted,
  });
}

export async function generateBiophilicEstimatePDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      bufferPages: true,
      info: {
        Title: `Estimate - ${data.projectRef || data.clientName || ""}`,
        Author: data.companyName || "KarmYog Vatika",
        Subject: "Biophilic Project Estimate",
      },
    });

    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", err => reject(err));

    const total = totals(data);

    drawPageHeader(doc, data);
    let y = 84;
    y = drawClientCards(doc, data, y);
    y = drawOverview(doc, data, y, total);
    y = drawLineItems(doc, data, y);
    drawTotals(doc, data, y, total);
    drawPageTwo(doc, data, total);

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      text(doc, `PAGE ${i + 1} OF ${range.count}  |  ${data.projectRef || ""}`, PAGE.margin, PAGE.height - 24, {
        width: CONTENT_WIDTH,
        align: "center",
        size: 7,
        color: C.light,
      });
    }

    doc.end();
  });
}
