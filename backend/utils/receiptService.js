const PDFDocument = require('pdfkit');
const { BRAND, trxLogoDataUri } = require('./brand');

const LOGO_URL = BRAND.logoUrl || trxLogoDataUri(false);
const SUPPORT_EMAIL = BRAND.supportEmail;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (value, symbol = '$', code = 'USD') => {
  const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`;
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

const statusLabel = (status = 'pending') => {
  const labels = {
    pending: 'PENDING',
    shipped: 'DISPATCHED',
    in_transit: 'IN TRANSIT',
    arrived: 'ARRIVED',
    delivered: 'DELIVERED',
    stopped: 'ON HOLD',
  };
  return labels[status] || String(status || 'pending').replace(/_/g, ' ').toUpperCase();
};

const percent = (value) => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`;

const locationText = (location) => {
  if (!location) return 'N/A';
  return [
    location.locationName,
    Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng))
      ? `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`
      : '',
  ].filter(Boolean).join(' | ');
};

const timelineRows = (history = []) => {
  const events = Array.isArray(history) ? history.slice(-6).reverse() : [];
  if (!events.length) {
    return '<tr><td colspan="4">No status updates recorded yet.</td></tr>';
  }

  return events.map((event) => `
    <tr>
      <td>${escapeHtml(dateTime(event.timestamp))}</td>
      <td>${escapeHtml(statusLabel(event.status || 'pending'))}</td>
      <td>${escapeHtml(event.location || 'N/A')}</td>
      <td>${escapeHtml(event.description || 'Status updated')}</td>
    </tr>`).join('');
};

const serviceType = (pkg) => {
  const price = typeof pkg.deliveryPrice === 'number' ? pkg.deliveryPrice : parseFloat(pkg.deliveryPrice) || 0;
  if (price >= 200) return 'TRX Prime Global';
  if (price >= 100) return 'TRX Priority Ledger';
  if (price >= 50) return 'TRX Secure Express';
  return 'TRX Standard Flow';
};

const dimensions = (weight) => {
  const safeWeight = Number(weight) || 1;
  return `${Math.max(20, Math.round(safeWeight * 3))} x ${Math.max(15, Math.round(safeWeight * 2))} x ${Math.max(10, Math.round(safeWeight * 1.5))} cm`;
};

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

const trackingUrl = (pkg) => `${FRONTEND_URL.replace(/\/$/, '')}/track/${encodeURIComponent(pkg.trackingCode || '')}`;

const qrImageUrl = (pkg) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(trackingUrl(pkg))}`;

const receiptStamp = (pkg) => {
  if (!pkg.receipt?.stamped) return '<div class="stamp muted">Awaiting TRX Stamp</div>';
  return `<div class="stamp">
    <span>${escapeHtml(pkg.receipt?.stampLabel || 'TRX Verified')}</span>
    <small>${escapeHtml(pkg.receipt?.stampedAt ? dateTime(pkg.receipt.stampedAt) : dateTime(pkg.receipt?.updatedAt || pkg.updatedAt))}</small>
  </div>`;
};

const generateReceiptHTML = (pkg) => {
  const receiptId = pkg.receipt?.receiptId || 'N/A';
  const trackingCode = pkg.trackingCode || 'N/A';
  const weight = pkg.packageWeight || pkg.weight || 0;
  const pieces = Math.max(1, Math.ceil(Number(weight || 1) / 10));
  const currentLocation = pkg.currentLocation?.locationName || 'N/A';
  const destination = pkg.destinationLocation?.locationName || `${pkg.receiverCity || ''}, ${pkg.receiverCountry || ''}`.trim();
  const totalAmount = money(pkg.deliveryPrice, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');
  const service = serviceType(pkg);
  const declaredValue = money((parseFloat(pkg.deliveryPrice) || 0) * 0.7, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');
  const baseCharge = money((parseFloat(pkg.deliveryPrice) || 0) * 0.86, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');
  const handlingCharge = money((parseFloat(pkg.deliveryPrice) || 0) * 0.09, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');
  const documentationCharge = money((parseFloat(pkg.deliveryPrice) || 0) * 0.05, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TRX Receipt ${escapeHtml(receiptId)}</title>
  <style>
    @media print {
      body { background:#fff; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .actions { display:none !important; }
      .sheet { box-shadow:none; margin:0; max-width:none; }
    }
    * { box-sizing:border-box; }
    body { margin:0; background:#dbeafe; padding:24px; color:#111827; font-family:Arial, Helvetica, sans-serif; }
    .sheet { max-width:920px; margin:0 auto; background:#fff; box-shadow:0 22px 60px rgba(11,16,32,.24); }
    .stripe { height:8px; background:linear-gradient(90deg,#0B1020 0 34%,#00A6A6 34% 68%,#35E0A1 68%); }
    .header { background:#ffffff; padding:22px 34px; display:flex; justify-content:space-between; align-items:center; gap:20px; border-bottom:1px solid #DCE6EF; }
    .logo { width:148px; height:auto; display:block; }
    .stamp { border:2px solid #00A6A6; color:#0B1020; padding:8px 16px; font-size:12px; font-weight:900; letter-spacing:2px; text-transform:uppercase; transform:rotate(-4deg); text-align:center; }
    .stamp small { display:block; color:#64748B; font-size:9px; letter-spacing:0; margin-top:3px; text-transform:none; }
    .stamp.muted { border-color:#CBD5E1; color:#64748B; }
    .dark { background:#0B1020; color:#fff; padding:30px 34px; display:grid; grid-template-columns:1.25fr .9fr; gap:24px; }
    .eyebrow { color:#35E0A1; font-size:11px; font-weight:900; letter-spacing:3px; text-transform:uppercase; margin-bottom:8px; }
    h1 { margin:0; font-size:30px; line-height:1.1; letter-spacing:.04em; }
    .tracking { font-family:"Courier New", monospace; font-size:28px; font-weight:900; color:#35E0A1; letter-spacing:3px; word-break:break-word; }
    .meta { display:grid; gap:10px; font-size:13px; color:#d1d5db; }
    .meta strong { color:#fff; display:block; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:2px; }
    .content { padding:30px 34px; }
    .section-title { color:#00A6A6; font-size:12px; font-weight:900; letter-spacing:2px; text-transform:uppercase; margin:0 0 14px; }
    .parties { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:24px; }
    .card { border:1px solid #DCE6EF; border-top:5px solid #00A6A6; padding:18px; background:#F4F8FB; }
    .card.yellow { border-top-color:#35E0A1; }
    .party { color:#4b5563; font-size:13px; line-height:1.7; }
    .party-name { color:#111827; font-size:18px; line-height:1.2; font-weight:900; margin-bottom:8px; }
    .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    .route { display:grid; grid-template-columns:1fr auto 1fr; gap:18px; align-items:center; margin-bottom:24px; }
    .route-card { background:#f9fafb; border:1px solid #e5e7eb; padding:18px; min-height:110px; }
    .route-card strong { display:block; color:#111827; font-size:18px; margin-top:8px; }
    .route-arrow { background:#00A6A6; color:#fff; font-weight:900; padding:10px 14px; }
    .metric { background:#ECFDF5; border:1px solid #A7F3D0; padding:14px; text-align:center; }
    .metric span { display:block; color:#047857; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px; }
    .metric strong { color:#111827; font-size:18px; }
    .details { width:100%; border-collapse:collapse; margin-bottom:24px; }
    .details td { border-bottom:1px solid #e5e7eb; padding:12px 0; font-size:14px; }
    .details td:first-child { color:#6b7280; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; width:42%; }
    .details td:last-child { color:#111827; font-weight:700; text-align:right; }
    .amount { background:#0B1020; color:#fff; padding:24px; display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:24px; }
    .amount span { color:#A7F3D0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; }
    .amount strong { display:block; color:#35E0A1; font-size:34px; margin-top:4px; }
    .package-media { display:grid; grid-template-columns:180px 1fr; gap:18px; align-items:stretch; margin-bottom:24px; }
    .package-media img { width:180px; height:140px; object-fit:cover; border:1px solid #e5e7eb; background:#f3f4f6; }
    .package-media .copy { border:1px solid #e5e7eb; background:#f9fafb; padding:16px; font-size:13px; color:#4b5563; line-height:1.6; }
    .charges { width:100%; border-collapse:collapse; margin-bottom:24px; border:1px solid #e5e7eb; }
    .charges th { background:#0B1020; color:#35E0A1; font-size:10px; text-transform:uppercase; letter-spacing:1.4px; text-align:left; padding:12px; }
    .charges td { padding:12px; border-top:1px solid #e5e7eb; font-size:13px; color:#374151; }
    .charges td:last-child { text-align:right; font-weight:900; color:#111827; }
    .barcode { text-align:center; border:1px dashed #9ca3af; padding:18px; background:#f9fafb; font-family:"Courier New", monospace; margin-bottom:22px; }
    .bars { font-size:26px; letter-spacing:4px; color:#111827; }
    .timeline { width:100%; border-collapse:collapse; margin-bottom:24px; border:1px solid #e5e7eb; }
    .timeline th { background:#f9fafb; color:#6b7280; font-size:10px; text-transform:uppercase; letter-spacing:1.2px; text-align:left; padding:10px; border-bottom:1px solid #e5e7eb; }
    .timeline td { padding:10px; border-top:1px solid #e5e7eb; font-size:12px; color:#374151; vertical-align:top; }
    .qr-signature { display:grid; grid-template-columns:180px 1fr; gap:20px; align-items:center; margin-bottom:22px; }
    .qr-box { border:1px solid #DCE6EF; background:#F4F8FB; padding:14px; text-align:center; }
    .qr-box img { width:132px; height:132px; display:block; margin:0 auto 8px; }
    .signature { border:1px solid #DCE6EF; padding:18px; min-height:150px; background:#fff; }
    .signature .script { color:#0B1020; font-family:"Brush Script MT","Segoe Script",cursive; font-size:30px; margin:14px 0 4px; }
    .signature .line { height:1px; background:#CBD5E1; margin:10px 0; }
    .notice { background:#ECFDF5; border-left:5px solid #35E0A1; padding:14px 16px; color:#065F46; font-size:13px; line-height:1.6; }
    .footer { background:#0B1020; color:#94A3B8; text-align:center; padding:24px 34px; font-size:12px; line-height:1.8; }
    .footer strong { color:#35E0A1; letter-spacing:4px; font-size:18px; }
    .actions { position:fixed; right:24px; bottom:24px; display:flex; gap:10px; }
    .actions button { border:0; cursor:pointer; padding:13px 20px; border-radius:4px; font-weight:900; box-shadow:0 10px 24px rgba(0,0,0,.2); }
    .print { background:#00A6A6; color:#fff; }
    .pdf { background:#0B1020; color:#fff; }
    @media (max-width:700px) {
      body { padding:10px; }
      .header,.dark { grid-template-columns:1fr; display:block; }
      .stamp { display:inline-block; margin-top:16px; }
      .parties,.summary,.route,.qr-signature { grid-template-columns:1fr; }
      .package-media { grid-template-columns:1fr; }
      .package-media img { width:100%; height:auto; max-height:260px; }
      .route-arrow { text-align:center; }
      .details td:last-child { text-align:left; }
      .amount { display:block; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="stripe"></div>
    <div class="header">
      <img class="logo" src="${LOGO_URL}" alt="TRX Logistics">
      ${receiptStamp(pkg)}
    </div>
    <div class="dark">
      <div>
        <div class="eyebrow">TRX Logistics secure shipment receipt</div>
        <h1>Receipt, dispatch proof and waybill summary</h1>
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
        <div><strong>Service</strong>${escapeHtml(service)}</div>
      </div>
    </div>
    <div class="content">
      <div class="route">
        <div class="route-card">
          <div class="section-title">Origin</div>
          <strong>${escapeHtml([pkg.senderCity, pkg.senderCountry].filter(Boolean).join(', ') || 'N/A')}</strong>
          <div>${escapeHtml(pkg.senderAddress || 'N/A')}</div>
        </div>
        <div class="route-arrow">TO</div>
        <div class="route-card">
          <div class="section-title">Destination</div>
          <strong>${escapeHtml([pkg.receiverCity, pkg.receiverCountry].filter(Boolean).join(', ') || 'N/A')}</strong>
          <div>${escapeHtml(pkg.receiverAddress || destination || 'N/A')}</div>
        </div>
      </div>

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
        <div class="metric"><span>Amount</span><strong>${escapeHtml(totalAmount)}</strong></div>
      </div>

      <h2 class="section-title">Shipment Details</h2>
      <div class="package-media">
        ${pkg.packageImage ? `<img src="${escapeHtml(pkg.packageImage)}" alt="${escapeHtml(pkg.packageName || 'Package image')}">` : '<div></div>'}
        <div class="copy">
          <strong>${escapeHtml(pkg.packageName || 'Package')}</strong><br>
          ${escapeHtml(pkg.packageDescription || 'No package description provided.')}<br><br>
          <strong>Progress:</strong> ${escapeHtml(percent(pkg.movementProgress))}<br>
          <strong>Current coordinates:</strong> ${escapeHtml(locationText(pkg.currentLocation))}<br>
          <strong>Destination coordinates:</strong> ${escapeHtml(locationText(pkg.destinationLocation))}
          ${pkg.stopReason ? `<br><strong>Stop reason:</strong> ${escapeHtml(pkg.stopReason)}` : ''}
        </div>
      </div>
      <table class="details">
        ${row('Package Name', pkg.packageName)}
        ${row('Description', pkg.packageDescription)}
        ${row('Tracking Number', trackingCode)}
        ${row('Receipt ID', receiptId)}
        ${row('Service', service)}
        ${row('Dimensions', dimensions(weight))}
        ${row('Current Location', currentLocation)}
        ${row('Destination', destination)}
        ${row('Movement Progress', percent(pkg.movementProgress))}
        ${row('Sender Contact', [pkg.senderPhone, pkg.senderEmail].filter(Boolean).join(' | '))}
        ${row('Receiver Contact', [pkg.receiverPhone, pkg.receiverEmail].filter(Boolean).join(' | '))}
        ${row('Receiver Gender', pkg.receiverGender)}
        ${row('Created Date', dateTime(pkg.createdAt))}
        ${row('Last Updated', dateTime(pkg.updatedAt))}
        ${row('Currency', `${pkg.deliveryCurrencyCountry || 'United States'} (${pkg.deliveryCurrencySymbol || '$'} ${pkg.deliveryCurrency || 'USD'})`)}
        ${row('Receipt Generated', dateTime(new Date()))}
      </table>

      <h2 class="section-title">Charges and Declaration</h2>
      <table class="charges">
        <thead><tr><th>Description</th><th>Details</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>Express freight charge</td><td>${escapeHtml(service)}</td><td>${escapeHtml(baseCharge)}</td></tr>
          <tr><td>Handling and routing</td><td>${pieces} piece${pieces > 1 ? 's' : ''} / ${escapeHtml(weight)} kg</td><td>${escapeHtml(handlingCharge)}</td></tr>
          <tr><td>Documentation and receipt</td><td>${escapeHtml(receiptId)}</td><td>${escapeHtml(documentationCharge)}</td></tr>
          <tr><td>Declared shipment value</td><td>Estimated from admin shipment record</td><td>${escapeHtml(declaredValue)}</td></tr>
          <tr><td>Payment status</td><td>Payment may be required before release</td><td>Pending confirmation</td></tr>
        </tbody>
      </table>

      <h2 class="section-title">Recent Status Timeline</h2>
      <table class="timeline">
        <thead><tr><th>Date</th><th>Status</th><th>Location</th><th>Note</th></tr></thead>
        <tbody>${timelineRows(pkg.statusHistory)}</tbody>
      </table>

      <div class="amount">
        <div>
          <span>Total shipping amount</span>
          <strong>${escapeHtml(totalAmount)}</strong>
        </div>
        <div style="font-size:13px;line-height:1.6;color:#fee2e2;">
          Payment may be required before dispatch or release. Keep this TRX receipt for customer records.
        </div>
      </div>

      <div class="qr-signature">
        <div class="qr-box">
          <img src="${qrImageUrl(pkg)}" alt="TRX tracking QR code">
          <div style="font-size:10px;color:#64748B;font-weight:900;text-transform:uppercase;letter-spacing:1.4px;">Scan to track</div>
        </div>
        <div class="signature">
          <div class="section-title">TRX Authorized Signature</div>
          <div class="script">${escapeHtml(pkg.receipt?.signature || 'TRX Logistics')}</div>
          <div class="line"></div>
          <div style="font-size:12px;color:#64748B;line-height:1.6;">
            Digitally signed for ${escapeHtml(BRAND.name)}. Receipt stamp:
            <strong>${escapeHtml(pkg.receipt?.stamped ? (pkg.receipt?.stampLabel || 'Verified') : 'Not stamped')}</strong>.
          </div>
        </div>
      </div>

      <div class="notice">
        This receipt was generated by ${escapeHtml(BRAND.name)} administration for customer shipment records.
        For support, contact ${escapeHtml(SUPPORT_EMAIL)} and include the tracking number.
      </div>
    </div>
    <div class="footer">
      <strong>TRX</strong><br>
      ${escapeHtml(BRAND.tagline)}<br>
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

const drawTableRow = (doc, label, value, y) => {
  doc.moveTo(42, y + 16).lineTo(554, y + 16).stroke('#e5e7eb');
  doc.fillColor('#6b7280').fontSize(8).font('Helvetica-Bold').text(label.toUpperCase(), 42, y);
  doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text(String(value || 'N/A'), 220, y, { width: 330, align: 'right' });
};

const drawTrxLogo = (doc, x, y, dark = false) => {
  doc.roundedRect(x, y, 156, 48, 10).fill(dark ? BRAND.primary : '#ffffff');
  doc.fillColor(BRAND.accent).fontSize(25).font('Helvetica-Bold').text('T', x + 14, y + 13);
  doc.fillColor(dark ? '#ffffff' : BRAND.primary).text('R', x + 42, y + 13);
  doc.fillColor(BRAND.secondary).text('X', x + 70, y + 13);
  doc.fillColor(dark ? '#A7F3D0' : BRAND.muted).fontSize(7).font('Helvetica-Bold').text('LOGISTICS', x + 14, y + 37, { characterSpacing: 2 });
  doc.circle(x + 132, y + 20, 8).fill(BRAND.accent);
  doc.strokeColor(BRAND.primary).lineWidth(1.5).moveTo(x + 128, y + 20).lineTo(x + 136, y + 20).stroke();
  doc.moveTo(x + 132, y + 16).lineTo(x + 132, y + 24).stroke();
};

const drawQrPattern = (doc, value, x, y, size = 104) => {
  const cells = 21;
  const cell = size / cells;
  let hash = 0;
  for (let i = 0; i < String(value).length; i++) {
    hash = ((hash << 5) - hash) + String(value).charCodeAt(i);
    hash |= 0;
  }

  doc.rect(x, y, size, size).fill('#ffffff');
  doc.strokeColor(BRAND.line).rect(x, y, size, size).stroke();
  const finder = (fx, fy) => {
    doc.rect(x + fx * cell, y + fy * cell, cell * 7, cell * 7).fill(BRAND.primary);
    doc.rect(x + (fx + 1) * cell, y + (fy + 1) * cell, cell * 5, cell * 5).fill('#ffffff');
    doc.rect(x + (fx + 2) * cell, y + (fy + 2) * cell, cell * 3, cell * 3).fill(BRAND.secondary);
  };
  finder(1, 1);
  finder(13, 1);
  finder(1, 13);

  for (let rowIndex = 0; rowIndex < cells; rowIndex++) {
    for (let colIndex = 0; colIndex < cells; colIndex++) {
      const inFinder = (colIndex < 8 && rowIndex < 8) || (colIndex > 12 && rowIndex < 8) || (colIndex < 8 && rowIndex > 12);
      if (inFinder) continue;
      const bit = Math.abs(Math.sin((rowIndex + 1) * (colIndex + 3) * (hash || 7))) > 0.52;
      if (bit) doc.rect(x + colIndex * cell, y + rowIndex * cell, cell, cell).fill((rowIndex + colIndex) % 3 === 0 ? BRAND.secondary : BRAND.primary);
    }
  }
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
  const totalAmount = money(pkg.deliveryPrice, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');
  const service = serviceType(pkg);
  const baseCharge = money((parseFloat(pkg.deliveryPrice) || 0) * 0.86, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');
  const handlingCharge = money((parseFloat(pkg.deliveryPrice) || 0) * 0.09, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');
  const documentationCharge = money((parseFloat(pkg.deliveryPrice) || 0) * 0.05, pkg.deliveryCurrencySymbol || '$', pkg.deliveryCurrency || 'USD');

  doc.rect(0, 0, 595, 8).fill(BRAND.primary);
  doc.rect(196, 0, 199, 8).fill(BRAND.secondary);
  doc.rect(395, 0, 200, 8).fill(BRAND.accent);
  doc.rect(0, 8, 595, 94).fill('#ffffff');
  drawTrxLogo(doc, 42, 28);
  doc.fillColor(BRAND.primary).fontSize(10).font('Helvetica-Bold').text(BRAND.tagline.toUpperCase(), 42, 80, { characterSpacing: 1.4 });
  doc.strokeColor(BRAND.secondary).lineWidth(2).roundedRect(405, 28, 140, 42, 8).stroke();
  doc.fillColor(BRAND.secondary).fontSize(9).font('Helvetica-Bold').text(pkg.receipt?.stamped ? (pkg.receipt?.stampLabel || 'TRX VERIFIED') : 'AWAITING STAMP', 422, 43, { width: 108, align: 'center' });

  doc.rect(0, 102, 595, 118).fill(BRAND.primary);
  doc.fillColor(BRAND.accent).fontSize(9).font('Helvetica-Bold').text('TRACKING NUMBER', 42, 124, { characterSpacing: 2 });
  doc.fillColor('#fff').fontSize(24).font('Courier-Bold').text(trackingCode, 42, 142);
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica-Bold').text('RECEIPT ID', 42, 184);
  doc.fillColor('#fff').fontSize(10).font('Courier').text(receiptId, 42, 198);
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica-Bold').text('ISSUED', 330, 184);
  doc.fillColor('#fff').fontSize(10).font('Helvetica').text(dateTime(pkg.createdAt), 330, 198, { width: 210 });

  doc.fillColor(BRAND.secondary).fontSize(11).font('Helvetica-Bold').text('SENDER', 42, 250, { characterSpacing: 1.5 });
  doc.rect(42, 268, 240, 112).stroke('#e5e7eb');
  writePair(doc, 'Name', pkg.senderName, 56, 284);
  writePair(doc, 'Phone', pkg.senderPhone, 56, 324);
  writePair(doc, 'Address', [pkg.senderAddress, pkg.senderCity, pkg.senderCountry].filter(Boolean).join(', '), 56, 348);

  doc.fillColor(BRAND.secondary).fontSize(11).font('Helvetica-Bold').text('RECEIVER', 314, 250, { characterSpacing: 1.5 });
  doc.rect(314, 268, 240, 112).stroke('#e5e7eb');
  writePair(doc, 'Name', pkg.receiverName, 328, 284);
  writePair(doc, 'Phone', pkg.receiverPhone, 328, 324);
  writePair(doc, 'Address', [pkg.receiverAddress, pkg.receiverCity, pkg.receiverCountry].filter(Boolean).join(', '), 328, 348);

  doc.fillColor(BRAND.secondary).fontSize(11).font('Helvetica-Bold').text('SHIPMENT DETAILS', 42, 402, { characterSpacing: 1.5 });
  const rows = [
    ['Tracking Number', trackingCode],
    ['Receipt ID', receiptId],
    ['Package', pkg.packageName],
    ['Description', pkg.packageDescription],
    ['Service', service],
    ['Weight / Pieces', `${weight} kg / ${pieces}`],
    ['Dimensions', dimensions(weight)],
    ['Status', statusLabel(pkg.status)],
    ['Movement Progress', percent(pkg.movementProgress)],
    ['Current Location', currentLocation],
    ['Destination', destination],
    ['Current Coordinates', locationText(pkg.currentLocation)],
    ['Destination Coordinates', locationText(pkg.destinationLocation)],
    ['Currency', `${pkg.deliveryCurrencyCountry || 'United States'} (${pkg.deliveryCurrencySymbol || '$'} ${pkg.deliveryCurrency || 'USD'})`],
    ['Last Updated', dateTime(pkg.updatedAt)],
  ];
  let y = 420;
  rows.forEach(([label, value]) => {
    drawTableRow(doc, label, value, y);
    y += 20;
  });

  if (pkg.stopReason) {
    drawTableRow(doc, 'Stop Reason', pkg.stopReason, y);
    y += 20;
  }

  doc.fillColor(BRAND.secondary).fontSize(11).font('Helvetica-Bold').text('CHARGES', 42, y + 18, { characterSpacing: 1.5 });
  y += 38;
  [
    ['Express freight charge', baseCharge],
    ['Handling and routing', handlingCharge],
    ['Documentation and receipt', documentationCharge],
  ].forEach(([label, value]) => {
    drawTableRow(doc, label, value, y);
    y += 20;
  });

  doc.rect(42, 704, 512, 58).fill(BRAND.primary);
  doc.fillColor('#A7F3D0').fontSize(9).font('Helvetica-Bold').text('TOTAL SHIPPING AMOUNT', 62, 718, { characterSpacing: 1.5 });
  doc.fillColor(BRAND.accent).fontSize(22).font('Helvetica-Bold').text(totalAmount, 62, 732);
  doc.fillColor('#D1FAE5').fontSize(9).font('Helvetica').text('Payment may be required before dispatch or release.', 326, 724, { width: 200 });

  drawQrPattern(doc, trackingUrl(pkg), 42, 776, 48);
  doc.fillColor(BRAND.primary).fontSize(10).font('Helvetica-Bold').text('SCAN TO TRACK THIS SHIPMENT', 104, 786);
  doc.fillColor(BRAND.muted).fontSize(8).font('Courier').text(trackingCode, 104, 802, { width: 250 });
  doc.fillColor(BRAND.primary).fontSize(18).font('Helvetica-BoldOblique').text(pkg.receipt?.signature || 'TRX Logistics Authorized Signature', 350, 784, { width: 170, align: 'center' });
  doc.moveTo(350, 810).lineTo(520, 810).stroke('#CBD5E1');

  doc.addPage();
  doc.rect(0, 0, 595, 8).fill(BRAND.primary);
  doc.rect(196, 0, 199, 8).fill(BRAND.secondary);
  doc.rect(395, 0, 200, 8).fill(BRAND.accent);
  drawTrxLogo(doc, 42, 28);
  doc.fillColor(BRAND.secondary).fontSize(11).font('Helvetica-Bold').text('RECENT STATUS TIMELINE', 42, 96, { characterSpacing: 1.5 });
  doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text(`Tracking ${trackingCode} | Receipt ${receiptId}`, 42, 60);

  const history = Array.isArray(pkg.statusHistory) ? pkg.statusHistory.slice(-8).reverse() : [];
  y = 92;
  if (!history.length) {
    doc.fillColor('#111827').fontSize(10).font('Helvetica').text('No status updates recorded yet.', 42, y);
  } else {
    history.forEach((event) => {
      doc.circle(50, y + 5, 4).fill(BRAND.secondary);
      doc.moveTo(50, y + 12).lineTo(50, y + 48).stroke('#e5e7eb');
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text(statusLabel(event.status || 'pending'), 66, y);
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(dateTime(event.timestamp), 66, y + 14, { width: 190 });
      doc.fillColor('#374151').fontSize(9).font('Helvetica').text(`${event.location || 'N/A'} - ${event.description || 'Status updated'}`, 260, y, { width: 280 });
      y += 56;
    });
  }

  doc.fillColor(BRAND.secondary).fontSize(11).font('Helvetica-Bold').text('CUSTOMER RECORD NOTES', 42, 580, { characterSpacing: 1.5 });
  doc.fillColor('#374151').fontSize(10).font('Helvetica').text(
    `This receipt was generated by ${BRAND.name} administration for shipment/customer records. Contact ${SUPPORT_EMAIL} with the tracking number for support.`,
    42,
    602,
    { width: 512, lineGap: 4 }
  );

  doc.rect(0, 834, 595, 8).fill(BRAND.primary);
  doc.rect(196, 834, 199, 8).fill(BRAND.secondary);
  doc.rect(395, 834, 200, 8).fill(BRAND.accent);
  doc.end();
});

module.exports = { generateReceiptHTML, generateReceiptPDF };
