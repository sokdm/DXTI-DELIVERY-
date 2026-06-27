const PDFDocument = require('pdfkit');

const generateReceiptHTML = (pkg) => {
  const createdDate = new Date(pkg.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const createdTime = new Date(pkg.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const statusColors = {
    pending: '#f59e0b',
    in_transit: '#3b82f6',
    arrived: '#8b5cf6',
    delivered: '#10b981',
    stopped: '#ef4444',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DXTI Receipt - ${pkg.receipt?.receiptId || pkg.trackingCode}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#f3f4f6; padding:20px; }
    .page { max-width:700px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.15); }
    .header { background:linear-gradient(135deg,#D40511,#E31B23); padding:40px 40px 30px; text-align:center; position:relative; }
    .header::after { content:''; position:absolute; bottom:-20px; left:0; right:0; height:40px; background:#fff; border-radius:50% 50% 0 0; }
    .logo { font-size:36px; font-weight:900; color:#fff; letter-spacing:4px; }
    .subtitle { color:#FFCC00; font-size:12px; letter-spacing:3px; text-transform:uppercase; font-weight:700; }
    .stamp { position:absolute; top:25px; right:30px; border:3px solid rgba(255,204,0,0.6); color:#FFCC00; padding:8px 16px; border-radius:8px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; transform:rotate(-12deg); }
    .content { padding:40px; padding-top:30px; }
    .receipt-id { text-align:center; margin-bottom:25px; }
    .receipt-id-label { font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:2px; }
    .receipt-id-value { font-size:14px; color:#6b7280; font-family:'Courier New',monospace; margin-top:4px; }
    .tracking-section { background:linear-gradient(135deg,#FFF8E1,#FFECB3); border-radius:12px; padding:25px; text-align:center; margin-bottom:30px; border:2px dashed #FFCC00; }
    .tracking-label { color:#B8860B; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }
    .tracking-code { color:#1f2937; font-size:32px; font-weight:800; letter-spacing:4px; font-family:'Courier New',monospace; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:25px; }
    .card { background:#f9fafb; border-radius:12px; padding:20px; border:1px solid #e5e7eb; }
    .card-title { font-size:11px; color:#D40511; text-transform:uppercase; letter-spacing:2px; font-weight:800; margin-bottom:15px; padding-bottom:10px; border-bottom:2px solid #e5e7eb; }
    .field { margin-bottom:12px; }
    .field:last-child { margin-bottom:0; }
    .field-label { font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:3px; }
    .field-value { font-size:14px; color:#1f2937; font-weight:600; line-height:1.4; }
    .package-card { background:#fff; border:2px solid #e5e7eb; border-radius:12px; padding:20px; margin-bottom:25px; }
    .package-title { font-size:11px; color:#D40511; text-transform:uppercase; letter-spacing:2px; font-weight:800; margin-bottom:15px; }
    .package-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; }
    .package-item { text-align:center; padding:15px; background:#f9fafb; border-radius:8px; }
    .package-item-label { font-size:11px; color:#9ca3af; text-transform:uppercase; margin-bottom:5px; }
    .package-item-value { font-size:16px; color:#1f2937; font-weight:700; }
    .status-badge { display:inline-block; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
    .status-pending { background:#fef3c7; color:#92400e; }
    .status-in_transit { background:#dbeafe; color:#1e40af; }
    .status-arrived { background:#ede9fe; color:#5b21b6; }
    .status-delivered { background:#d1fae5; color:#065f46; }
    .status-stopped { background:#fee2e2; color:#991b1b; }
    .amount-section { background:linear-gradient(135deg,#FFF8E1,#FFECB3); border-radius:12px; padding:25px; text-align:center; margin-bottom:25px; border:2px solid #FFCC00; }
    .amount-label { font-size:12px; color:#B8860B; text-transform:uppercase; letter-spacing:2px; font-weight:600; margin-bottom:8px; }
    .amount-value { font-size:36px; color:#D40511; font-weight:800; }
    .amount-note { font-size:12px; color:#B8860B; margin-top:10px; padding:10px; background:rgba(255,204,0,0.15); border-radius:6px; }
    .footer { text-align:center; padding:25px 40px 40px; border-top:1px solid #e5e7eb; }
    .footer-text { color:#9ca3af; font-size:13px; margin-bottom:8px; }
    .footer-brand { color:#D40511; font-size:18px; font-weight:900; letter-spacing:3px; }
    .date-created { text-align:center; margin-bottom:20px; color:#6b7280; font-size:13px; }
    .no-print { position:fixed; bottom:30px; right:30px; display:flex; gap:12px; z-index:100; }
    .btn { padding:14px 28px; border:none; border-radius:50px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 15px rgba(0,0,0,0.2); transition:all 0.2s; }
    .btn-print { background:linear-gradient(135deg,#D40511,#E31B23); color:#fff; }
    .btn-pdf { background:#1f2937; color:#fff; }
    .btn:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.25); }
    .dhl-stripe { height:6px; background:linear-gradient(90deg,#D40511 33%,#FFCC00 33%,#FFCC00 66%,#D40511 66%); }
  </style>
</head>
<body>
  <div class="dhl-stripe"></div>
  <div class="page">
    <div class="header">
      <div class="stamp">Official</div>
      <div class="logo">DXTI</div>
      <div class="subtitle">Express Delivery Services</div>
    </div>
    <div class="content">
      <div class="receipt-id">
        <div class="receipt-id-label">Receipt ID</div>
        <div class="receipt-id-value">${pkg.receipt?.receiptId || 'N/A'}</div>
      </div>
      <div class="tracking-section">
        <div class="tracking-label">Tracking Number</div>
        <div class="tracking-code">${pkg.trackingCode}</div>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-title">Sender</div>
          <div class="field"><div class="field-label">Name</div><div class="field-value">${pkg.senderName}</div></div>
          <div class="field"><div class="field-label">Phone</div><div class="field-value">${pkg.senderPhone}</div></div>
          <div class="field"><div class="field-label">Address</div><div class="field-value">${pkg.senderAddress}, ${pkg.senderCity}, ${pkg.senderCountry}</div></div>
          <div class="field"><div class="field-label">Email</div><div class="field-value">${pkg.senderEmail}</div></div>
        </div>
        <div class="card">
          <div class="card-title">Receiver</div>
          <div class="field"><div class="field-label">Name</div><div class="field-value">${pkg.receiverName}</div></div>
          <div class="field"><div class="field-label">Phone</div><div class="field-value">${pkg.receiverPhone}</div></div>
          <div class="field"><div class="field-label">Address</div><div class="field-value">${pkg.receiverAddress}, ${pkg.receiverCity}, ${pkg.receiverCountry}</div></div>
          <div class="field"><div class="field-label">Email</div><div class="field-value">${pkg.receiverEmail}</div></div>
        </div>
      </div>
      <div class="package-card">
        <div class="package-title">Package Details</div>
        <div class="package-grid">
          <div class="package-item">
            <div class="package-item-label">Weight</div>
            <div class="package-item-value">${pkg.packageWeight} kg</div>
          </div>
          <div class="package-item">
            <div class="package-item-label">Service</div>
            <div class="package-item-value">Express</div>
          </div>
          <div class="package-item">
            <div class="package-item-label">Status</div>
            <div class="package-item-value"><span class="status-badge status-${pkg.status}">${pkg.status.replace('_',' ').toUpperCase()}</span></div>
          </div>
        </div>
        <div class="field" style="margin-top:15px;">
          <div class="field-label">Description</div>
          <div class="field-value">${pkg.packageDescription}</div>
        </div>
      </div>
      <div class="amount-section">
        <div class="amount-label">Total Shipping Amount</div>
        <div class="amount-value">$${pkg.deliveryPrice.toFixed(2)}</div>
        <div class="amount-note">
          <strong>Payment Notice:</strong> Please ensure the shipping amount is paid before delivery. Contact sender for payment details.
        </div>
      </div>
      <div class="date-created">
        Created on ${createdDate} at ${createdTime}
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">Thank you for choosing</div>
      <div class="footer-brand">DXTI EXPRESS DELIVERY</div>
      <div class="footer-text" style="margin-top:10px; font-size:11px;">This is an official receipt. Keep it for your records.</div>
    </div>
  </div>
  <div class="dhl-stripe"></div>
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">Print Receipt</button>
    <button class="btn btn-pdf" onclick="downloadPDF()">Download PDF</button>
  </div>
  <script>
    function downloadPDF() {
      document.querySelector('.no-print').style.display='none';
      window.print();
      setTimeout(()=>{ document.querySelector('.no-print').style.display='flex'; },1000);
    }
  </script>
</body>
</html>`;
};

const generateReceiptPDF = (pkg) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const createdDate = new Date(pkg.createdAt).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // DHL Red Header
    doc.rect(0, 0, 595, 120).fill('#D40511');
    doc.fillColor('#fff').fontSize(32).font('Helvetica-Bold').text('DXTI', 50, 35);
    doc.fillColor('#FFCC00').fontSize(12).font('Helvetica-Bold').text('EXPRESS DELIVERY', 50, 72);
    doc.fillColor('#fff').fontSize(10).text('OFFICIAL RECEIPT', 450, 50, { align: 'right' });
    
    // Receipt ID
    doc.fillColor('#fff').fontSize(9).text('RECEIPT ID', 450, 70, { align: 'right' });
    doc.fillColor('#FFCC00').fontSize(11).font('Courier').text(pkg.receipt?.receiptId || 'N/A', 450, 85, { align: 'right' });

    // Tracking
    doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text('TRACKING NUMBER', 50, 145);
    doc.fillColor('#D40511').fontSize(24).font('Courier-Bold').text(pkg.trackingCode, 50, 162);
    doc.moveTo(50, 195).lineTo(545, 195).stroke('#e5e7eb');

    // Sender & Receiver
    const yStart = 215;
    doc.fillColor('#D40511').fontSize(10).font('Helvetica-Bold').text('SENDER', 50, yStart);
    doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold').text(pkg.senderName, 50, yStart + 18);
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(pkg.senderPhone, 50, yStart + 35);
    doc.fillColor('#4b5563').fontSize(10).text(`${pkg.senderAddress}, ${pkg.senderCity}`, 50, yStart + 50);
    doc.fillColor('#4b5563').fontSize(10).text(`${pkg.senderCountry}`, 50, yStart + 65);
    doc.fillColor('#4b5563').fontSize(10).text(pkg.senderEmail, 50, yStart + 80);

    doc.fillColor('#D40511').fontSize(10).font('Helvetica-Bold').text('RECEIVER', 320, yStart);
    doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold').text(pkg.receiverName, 320, yStart + 18);
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(pkg.receiverPhone, 320, yStart + 35);
    doc.fillColor('#4b5563').fontSize(10).text(`${pkg.receiverAddress}, ${pkg.receiverCity}`, 320, yStart + 50);
    doc.fillColor('#4b5563').fontSize(10).text(`${pkg.receiverCountry}`, 320, yStart + 65);
    doc.fillColor('#4b5563').fontSize(10).text(pkg.receiverEmail, 320, yStart + 80);

    doc.moveTo(50, yStart + 100).lineTo(545, yStart + 100).stroke('#e5e7eb');

    // Package Details
    const py = yStart + 120;
    doc.fillColor('#D40511').fontSize(10).font('Helvetica-Bold').text('PACKAGE DETAILS', 50, py);
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text('Package Name:', 50, py + 22);
    doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text(pkg.packageName, 150, py + 22);
    doc.fillColor('#4b5563').fontSize(10).text('Description:', 50, py + 40);
    doc.fillColor('#1f2937').fontSize(10).text(pkg.packageDescription, 150, py + 40, { width: 395 });
    doc.fillColor('#4b5563').fontSize(10).text('Weight:', 50, py + 70);
    doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text(`${pkg.packageWeight} kg`, 150, py + 70);
    doc.fillColor('#4b5563').fontSize(10).text('Service:', 320, py + 70);
    doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text('Express International', 380, py + 70);
    doc.fillColor('#4b5563').fontSize(10).text('Status:', 50, py + 88);
    doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text(pkg.status.replace('_', ' ').toUpperCase(), 150, py + 88);

    doc.moveTo(50, py + 110).lineTo(545, py + 110).stroke('#e5e7eb');

    // Amount
    const ay = py + 130;
    doc.rect(50, ay, 495, 70).fill('#FFF8E1');
    doc.fillColor('#B8860B').fontSize(10).font('Helvetica-Bold').text('TOTAL SHIPPING AMOUNT', 70, ay + 15);
    doc.fillColor('#D40511').fontSize(28).font('Helvetica-Bold').text(`$${pkg.deliveryPrice.toFixed(2)}`, 70, ay + 32);

    // Date
    doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text(`Created: ${createdDate}`, 50, ay + 95);

    // Footer
    doc.moveTo(50, 720).lineTo(545, 720).stroke('#e5e7eb');
    doc.fillColor('#D40511').fontSize(16).font('Helvetica-Bold').text('DXTI EXPRESS DELIVERY', 50, 735, { align: 'center' });
    doc.fillColor('#9ca3af').fontSize(9).text('Thank you for choosing us. Keep this receipt for your records.', 50, 755, { align: 'center' });

    doc.end();
  });
};

module.exports = { generateReceiptHTML, generateReceiptPDF };
