const PDFDocument = require('pdfkit');

const DHL_LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/DHL_Logo.svg/512px-DHL_Logo.svg.png';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'dhld5736@gmail.com';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (value) => {
  const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const dateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusLabel = (status = 'pending') => status.replace(/_/g, ' ').toUpperCase();

const address = (name, phone, email, street, city, country) => `
  <div class="party">
    <div class="party-name">${escapeHtml(name || 'N/A')}</div>
    <div>${escapeHtml(phone || 'N/A')}</div>
    <div>${escapeHtml(email || 'N/A')}</div>
    <div>${escapeHtml([street, city, country].filter(Boolean).join(', ') || 'N/A')}</div>
  </div>`;

const row = (label, value) => `
  <tr>
    <td>${escapeHtml(label)}</td>
    <td>${escapeHtml(value || 'N/A')}</td>
  </tr>`;

const generateReceiptHTML = (pkg) => {
  const receiptId = pkg.receipt?.receiptId || 'N/A';
  const trackingCode = pkg.trackingCode || 'N/A';
  const weight = pkg.packageWeight || pkg.weight || 0;
  const pieces = Math.max(1, Math.ceil(Number(weight || 1) / 10));
  const currentLocation = pkg.currentLocation?.locationName || 'N/A';
  const destination = pkg.destinationLocation?.locationName || `${pkg.receiverCity || ''}, ${pkg.receiverCountry || ''}`.trim();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DHL Receipt ${escapeHtml(receiptId)}</title>
  <style>
    @media print {
      body { background:#fff; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .actions { display:none !important; }
      .sheet { box-shadow:none; margin:0; max-width:none; }
    }
    * { box-sizing:border-box; }
    body { margin:0; background:#e5e7eb; padding:24px; color:#111827; font-family:Arial, Helvetica, sans-serif; }
    .sheet { max-width:880px; margin:0 auto; background:#fff; box-shadow:0 18px 50px rgba(15,23,42,.24); }
    .stripe { height:8px; background:linear-gradient(90deg,#D40511 0 32%,#FFCC00 32% 68%,#D40511 68%); }
    .header { background:#FFCC00; padding:22px 34px; display:flex; justify-content:space-between; align-items:center; gap:20px; }
    .logo { width:148px; height:auto; display:block; }
    .stamp { border:3px solid #D40511; color:#D40511; padding:8px 16px; font-size:12px; font-weight:900; letter-spacing:2px; text-transform:uppercase; transform:rotate(-5deg); }
    .dark { background:#111827; color:#fff; padding:28px 34px; display:grid; grid-template-columns:1.4fr .9fr; gap:24px; }
    .eyebrow { color:#FFCC00; font-size:11px; font-weight:900; letter-spacing:3px; text-transform:uppercase; margin-bottom:8px; }
    h1 { margin:0; font-size:30px; line-height:1.1; letter-spacing:.04em; }
    .tracking { font-family:"Courier New", monospace; font-size:28px; font-weight:900; color:#FFCC00; letter-spacing:3px; word-break:break-word; }
    .meta { display:grid; gap:10px; font-size:13px; color:#d1d5db; }
    .meta strong { color:#fff; display:block; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:2px; }
    .content { padding:30px 34px; }
    .section-title { color:#D40511; font-size:12px; font-weight:900; letter-spacing:2px; text-transform:uppercase; margin:0 0 14px; }
    .parties { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:24px; }
    .card { border:1px solid #e5e7eb; border-top:5px solid #D40511; padding:18px; background:#f9fafb; }
    .card.yellow { border-top-color:#FFCC00; }
    .party { color:#4b5563; font-size:13px; line-height:1.7; }
    .party-name { color:#111827; font-size:18px; line-height:1.2; font-weight:900; margin-bottom:8px; }
    .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    .metric { background:#fff8db; border:1px solid #facc15; padding:14px; text-align:center; }
    .metric span { display:block; color:#92400e; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px; }
    .metric strong { color:#111827; font-size:18px; }
    .details { width:100%; border-collapse:collapse; margin-bottom:24px; }
    .details td { border-bottom:1px solid #e5e7eb; padding:12px 0; font-size:14px; }
    .details td:first-child { color:#6b7280; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; width:42%; }
    .details td:last-child { color:#111827; font-weight:700; text-align:right; }
    .amount { background:#D40511; color:#fff; padding:24px; display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:24px; }
    .amount span { color:#fecaca; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; }
    .amount strong { display:block; color:#FFCC00; font-size:34px; margin-top:4px; }
    .barcode { text-align:center; border:1px dashed #9ca3af; padding:18px; background:#f9fafb; font-family:"Courier New", monospace; margin-bottom:22px; }
    .bars { font-size:26px; letter-spacing:4px; color:#111827; }
    .notice { background:#fff7ed; border-left:5px solid #FFCC00; padding:14px 16px; color:#92400e; font-size:13px; line-height:1.6; }
    .footer { background:#111827; color:#9ca3af; text-align:center; padding:24px 34px; font-size:12px; line-height:1.8; }
    .footer strong { color:#FFCC00; letter-spacing:4px; font-size:18px; }
    .actions { position:fixed; right:24px; bottom:24px; display:flex; gap:10px; }
    .actions button { border:0; cursor:pointer; padding:13px 20px; border-radius:4px; font-weight:900; box-shadow:0 10px 24px rgba(0,0,0,.2); }
    .print { background:#D40511; color:#fff; }
    .pdf { background:#111827; color:#fff; }
    @media (max-width:700px) {
      body { padding:10px; }
      .header,.dark { grid-template-columns:1fr; display:block; }
      .stamp { display:inline-block; margin-top:16px; }
      .parties,.summary { grid-template-columns:1fr; }
      .details td:last-child { text-align:left; }
      .amount { display:block; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="stripe"></div>
    <div class="header">
      <img class="logo" src="${DHL_LOGO_URL}" alt="DHL">
      <div class="stamp">Official Receipt</div>
    </div>
    <div class="dark">
      <div>
        <div class="eyebrow">DHL Express shipment receipt</div>
        <h1>Proof of shipment and payment request</h1>
      </div>
      <div>
        <div class="eyebrow">Tracking number</div>
        <div class="tracking">${escapeHtml(trackingCode)}</div>
      </div>
      <div class="meta">
        <div><strong>Receipt ID</strong>${escapeHtml(receiptId)}</div>
        <div><strong>Issued</strong>${escapeHtml(dateTime(pkg.createdAt))}</div>
      </div>
      <div class="meta">
        <div><strong>Status</strong>${escapeHtml(statusLabel(pkg.status))}</div>
        <div><strong>Service</strong>DHL Express Worldwide</div>
      </div>
    </div>
    <div class="content">
      <div class="parties">
        <div class="card">
          <h2 class="section-title">Sender</h2>
          ${address(pkg.senderName, pkg.senderPhone, pkg.senderEmail, pkg.senderAddress, pkg.senderCity, pkg.senderCountry)}
        </div>
        <div class="card yellow">
          <h2 class="section-title">Receiver</h2>
          ${address(pkg.receiverName, pkg.receiverPhone, pkg.receiverEmail, pkg.receiverAddress, pkg.receiverCity, pkg.receiverCountry)}
        </div>
      </div>

      <div class="summary">
        <div class="metric"><span>Weight</span><strong>${escapeHtml(weight)} kg</strong></div>
        <div class="metric"><span>Pieces</span><strong>${pieces}</strong></div>
        <div class="metric"><span>Status</span><strong>${escapeHtml(statusLabel(pkg.status))}</strong></div>
        <div class="metric"><span>Amount</span><strong>${escapeHtml(money(pkg.deliveryPrice))}</strong></div>
      </div>

      <h2 class="section-title">Shipment Details</h2>
      <table class="details">
        ${row('Package Name', pkg.packageName)}
        ${row('Description', pkg.packageDescription)}
        ${row('Current Location', currentLocation)}
        ${row('Destination', destination)}
        ${row('Created Date', dateTime(pkg.createdAt))}
        ${row('Last Updated', dateTime(pkg.updatedAt))}
        ${row('Receipt Generated', dateTime(new Date()))}
      </table>

      <div class="amount">
        <div>
          <span>Total shipping amount</span>
          <strong>${escapeHtml(money(pkg.deliveryPrice))}</strong>
        </div>
        <div style="font-size:13px;line-height:1.6;color:#fee2e2;">
          Payment may be required before dispatch or release. Keep this receipt for customer records.
        </div>
      </div>

      <div class="barcode">
        <div class="bars">|| | ||| || |||| | ||| || |</div>
        <div>${escapeHtml(trackingCode)}</div>
      </div>

      <div class="notice">
        This receipt was generated by DXTI Delivery administration for a DHL-styled express shipment workflow.
        For support, contact ${escapeHtml(SUPPORT_EMAIL)} and include the tracking number.
      </div>
    </div>
    <div class="footer">
      <strong>DHL</strong><br>
      Express Worldwide<br>
      Customer Service: ${escapeHtml(SUPPORT_EMAIL)}<br>
      This receipt is intended for shipment/customer records.
    </div>
    <div class="stripe"></div>
  </div>
  <div class="actions">
    <button class="print" onclick="window.print()">Print Receipt</button>
    <button class="pdf" onclick="window.print()">Save as PDF</button>
  </div>
</body>
</html>`;
};

const writePair = (doc, label, value, x, y, width = 230) => {
  doc.fillColor('#6b7280').fontSize(8).font('Helvetica-Bold').text(label.toUpperCase(), x, y);
  doc.fillColor('#111827').fontSize(10).font('Helvetica').text(String(value || 'N/A'), x, y + 12, { width });
};

const generateReceiptPDF = (pkg) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 42 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const receiptId = pkg.receipt?.receiptId || 'N/A';
  const trackingCode = pkg.trackingCode || 'N/A';
  const weight = pkg.packageWeight || pkg.weight || 0;
  const pieces = Math.max(1, Math.ceil(Number(weight || 1) / 10));
  const currentLocation = pkg.currentLocation?.locationName || 'N/A';
  const destination = pkg.destinationLocation?.locationName || `${pkg.receiverCity || ''}, ${pkg.receiverCountry || ''}`.trim();

  doc.rect(0, 0, 595, 8).fill('#D40511');
  doc.rect(190, 0, 215, 8).fill('#FFCC00');
  doc.rect(0, 8, 595, 94).fill('#FFCC00');
  doc.fillColor('#D40511').fontSize(38).font('Helvetica-Bold').text('DHL', 42, 30);
  doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text('EXPRESS WORLDWIDE', 42, 72, { characterSpacing: 2 });
  doc.strokeColor('#D40511').lineWidth(2).rect(430, 30, 112, 34).stroke();
  doc.fillColor('#D40511').fontSize(10).font('Helvetica-Bold').text('OFFICIAL RECEIPT', 443, 43);

  doc.rect(0, 102, 595, 118).fill('#111827');
  doc.fillColor('#FFCC00').fontSize(9).font('Helvetica-Bold').text('TRACKING NUMBER', 42, 124, { characterSpacing: 2 });
  doc.fillColor('#fff').fontSize(24).font('Courier-Bold').text(trackingCode, 42, 142);
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica-Bold').text('RECEIPT ID', 42, 184);
  doc.fillColor('#fff').fontSize(10).font('Courier').text(receiptId, 42, 198);
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica-Bold').text('ISSUED', 330, 184);
  doc.fillColor('#fff').fontSize(10).font('Helvetica').text(dateTime(pkg.createdAt), 330, 198, { width: 210 });

  doc.fillColor('#D40511').fontSize(11).font('Helvetica-Bold').text('SENDER', 42, 250, { characterSpacing: 1.5 });
  doc.rect(42, 268, 240, 112).stroke('#e5e7eb');
  writePair(doc, 'Name', pkg.senderName, 56, 284);
  writePair(doc, 'Phone', pkg.senderPhone, 56, 324);
  writePair(doc, 'Address', [pkg.senderAddress, pkg.senderCity, pkg.senderCountry].filter(Boolean).join(', '), 56, 348);

  doc.fillColor('#D40511').fontSize(11).font('Helvetica-Bold').text('RECEIVER', 314, 250, { characterSpacing: 1.5 });
  doc.rect(314, 268, 240, 112).stroke('#e5e7eb');
  writePair(doc, 'Name', pkg.receiverName, 328, 284);
  writePair(doc, 'Phone', pkg.receiverPhone, 328, 324);
  writePair(doc, 'Address', [pkg.receiverAddress, pkg.receiverCity, pkg.receiverCountry].filter(Boolean).join(', '), 328, 348);

  doc.fillColor('#D40511').fontSize(11).font('Helvetica-Bold').text('SHIPMENT DETAILS', 42, 410, { characterSpacing: 1.5 });
  const rows = [
    ['Package', pkg.packageName],
    ['Description', pkg.packageDescription],
    ['Weight / Pieces', `${weight} kg / ${pieces}`],
    ['Status', statusLabel(pkg.status)],
    ['Current Location', currentLocation],
    ['Destination', destination],
    ['Last Updated', dateTime(pkg.updatedAt)],
  ];
  let y = 430;
  rows.forEach(([label, value]) => {
    doc.moveTo(42, y + 20).lineTo(554, y + 20).stroke('#e5e7eb');
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica-Bold').text(label.toUpperCase(), 42, y);
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text(String(value || 'N/A'), 240, y, { width: 310, align: 'right' });
    y += 28;
  });

  doc.rect(42, 650, 512, 64).fill('#D40511');
  doc.fillColor('#fecaca').fontSize(9).font('Helvetica-Bold').text('TOTAL SHIPPING AMOUNT', 62, 666, { characterSpacing: 1.5 });
  doc.fillColor('#FFCC00').fontSize(25).font('Helvetica-Bold').text(money(pkg.deliveryPrice), 62, 680);
  doc.fillColor('#fee2e2').fontSize(9).font('Helvetica').text('Payment may be required before dispatch or release.', 326, 672, { width: 200 });

  doc.rect(42, 730, 512, 34).stroke('#9ca3af');
  doc.fillColor('#111827').fontSize(16).font('Courier-Bold').text('|| | ||| || |||| | ||| || |', 78, 740);
  doc.fillColor('#6b7280').fontSize(8).font('Courier').text(trackingCode, 42, 766, { width: 512, align: 'center' });
  doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(`Support: ${SUPPORT_EMAIL}`, 42, 786, { width: 512, align: 'center' });

  doc.rect(0, 834, 595, 8).fill('#D40511');
  doc.rect(190, 834, 215, 8).fill('#FFCC00');
  doc.end();
});

module.exports = { generateReceiptHTML, generateReceiptPDF };
