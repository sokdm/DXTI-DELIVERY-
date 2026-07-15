const PDFDocument = require('pdfkit');

const DHL_HERO_IMAGE = 'https://i.imgur.com/277232.jpg';

const generateReceiptHTML = (pkg) => {
  const createdDate = new Date(pkg.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const createdTime = new Date(pkg.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const statusColors = {
    pending:     { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
    in_transit:  { bg: '#dbeafe', text: '#1e40af', label: 'In Transit' },
    arrived:     { bg: '#ede9fe', text: '#5b21b6', label: 'Arrived' },
    delivered:   { bg: '#d1fae5', text: '#065f46', label: 'Delivered' },
    stopped:     { bg: '#fee2e2', text: '#991b1b', label: 'On Hold' },
    cancelled:   { bg: '#f3f4f6', text: '#374151', label: 'Cancelled' },
  };
  const st = statusColors[pkg.status] || statusColors.pending;

  const receiptId = pkg.receipt?.receiptId || 'N/A';
  const trackingCode = pkg.trackingCode || 'N/A';
  const weight = pkg.packageWeight || pkg.weight || 0;
  const price = typeof pkg.deliveryPrice === 'number' ? pkg.deliveryPrice : parseFloat(pkg.deliveryPrice) || 0;
  const priceInt = Math.floor(price);
  const priceDec = (price % 1).toFixed(2).substring(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DHL Official Receipt — ${receiptId}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; border-radius: 0 !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #f3f4f6; padding: 20px; -webkit-font-smoothing: antialiased; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    
    /* Top Stripe */
    .top-stripe { height: 8px; background: linear-gradient(90deg, #D40511 0%, #D40511 35%, #FFCC00 35%, #FFCC00 65%, #D40511 65%, #D40511 100%); }
    
    /* Header */
    .header { background: linear-gradient(135deg, #D40511, #B91C1C); padding: 30px 40px; position: relative; text-align: center; }
    .header-stamp { position: absolute; top: 20px; right: 30px; border: 3px solid rgba(255,204,0,0.7); color: #FFCC00; padding: 8px 18px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; transform: rotate(-10deg); }
    .header-logo { font-size: 42px; font-weight: 900; color: #fff; letter-spacing: 6px; }
    .header-sub { color: #FFCC00; font-size: 13px; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; margin-top: 4px; }
    .header-tag { color: rgba(255,255,255,0.6); font-size: 10px; margin-top: 8px; letter-spacing: 1px; }
    
    /* Hero Image */
    .hero { width: 100%; height: 200px; background: url('${DHL_HERO_IMAGE}') center center / cover no-repeat; position: relative; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4)); }
    .hero-title { position: absolute; bottom: 20px; left: 40px; color: #fff; font-size: 24px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.5); letter-spacing: 2px; }
    
    /* Meta Bar */
    .meta-bar { background: #1F2937; padding: 16px 40px; display: flex; justify-content: space-between; align-items: center; }
    .meta-label { font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
    .meta-value { font-size: 14px; color: #FFCC00; font-family: 'Courier New', monospace; font-weight: 700; margin-top: 2px; }
    .meta-value-white { font-size: 13px; color: #fff; font-weight: 600; margin-top: 2px; }
    
    /* Content */
    .content { padding: 35px 40px; }
    
    /* Tracking Section */
    .tracking-section { background: linear-gradient(135deg, #FFF8E1, #FFECB3); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px; border: 2px dashed #FFCC00; position: relative; }
    .tracking-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #D40511; color: #fff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 4px 16px; border-radius: 20px; }
    .tracking-label { font-size: 11px; color: #B8860B; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; margin-top: 4px; }
    .tracking-code { font-size: 32px; font-weight: 900; color: #1f2937; letter-spacing: 6px; font-family: 'Courier New', monospace; }
    .tracking-service { font-size: 12px; color: #B8860B; margin-top: 8px; font-weight: 500; }
    
    /* Grid */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
    .card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; }
    .card-red { border-top: 4px solid #D40511; }
    .card-yellow { border-top: 4px solid #FFCC00; }
    .card-title { font-size: 11px; color: #D40511; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; gap: 6px; }
    .field { margin-bottom: 12px; }
    .field:last-child { margin-bottom: 0; }
    .field-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
    .field-value { font-size: 14px; color: #1f2937; font-weight: 600; line-height: 1.4; }
    .field-value-sm { font-size: 13px; color: #1f2937; font-weight: 500; line-height: 1.4; }
    
    /* Package Card */
    .package-card { background: #fff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
    .package-title { font-size: 11px; color: #D40511; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; margin-bottom: 15px; display: flex; align-items: center; gap: 6px; }
    .package-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .package-item { text-align: center; padding: 15px; background: #f9fafb; border-radius: 8px; }
    .package-item-red { border-top: 3px solid #D40511; }
    .package-item-yellow { border-top: 3px solid #FFCC00; }
    .package-item-green { border-top: 3px solid #059669; }
    .package-item-blue { border-top: 3px solid #3B82F6; }
    .package-item-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px; }
    .package-item-value { font-size: 18px; color: #1f2937; font-weight: 800; }
    .package-item-value-sm { font-size: 14px; color: #1f2937; font-weight: 700; }
    .package-desc { margin-top: 15px; padding: 15px; background: #f9fafb; border-radius: 8px; }
    .status-badge { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: ${st.bg}; color: ${st.text}; }
    
    /* Amount Section */
    .amount-section { background: linear-gradient(135deg, #FFF8E1, #FFECB3); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 25px; border: 2px solid #FFCC00; position: relative; overflow: hidden; }
    .amount-deco { position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: rgba(212,5,17,0.1); border-radius: 0 0 0 80px; }
    .amount-label { font-size: 12px; color: #B8860B; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; margin-bottom: 10px; }
    .amount-value { font-size: 48px; color: #D40511; font-weight: 900; letter-spacing: -1px; }
    .amount-value span.big { font-size: 56px; }
    .amount-value span.small { font-size: 28px; }
    .amount-note { font-size: 12px; color: #B8860B; margin-top: 12px; padding: 10px 20px; background: rgba(255,204,0,0.2); border-radius: 6px; display: inline-block; font-weight: 600; }
    
    /* Barcode */
    .barcode-area { text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 25px; border: 1px dashed #d1d5db; }
    .barcode-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-weight: 700; }
    .barcode-lines { font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #1f2937; letter-spacing: 4px; background: #fff; padding: 10px 30px; border-radius: 4px; display: inline-block; border: 1px solid #e5e7eb; }
    .barcode-code { font-size: 11px; color: #6b7280; margin-top: 8px; font-family: 'Courier New', monospace; }
    
    /* Footer */
    .footer { background: #1F2937; padding: 30px 40px; text-align: center; position: relative; }
    .footer-stripe { height: 4px; background: linear-gradient(90deg, #D40511 0%, #D40511 35%, #FFCC00 35%, #FFCC00 65%, #D40511 65%, #D40511 100%); position: absolute; top: 0; left: 0; right: 0; }
    .footer-logo { font-size: 24px; font-weight: 900; color: #FFCC00; letter-spacing: 6px; margin-bottom: 6px; }
    .footer-sub { color: #9CA3AF; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; }
    .footer-text { color: #6b7280; font-size: 12px; margin-top: 15px; line-height: 1.8; }
    .footer-legal { color: #4b5563; font-size: 10px; margin-top: 15px; line-height: 1.6; }
    
    /* Bottom Stripe */
    .bottom-stripe { height: 8px; background: linear-gradient(90deg, #D40511 0%, #D40511 35%, #FFCC00 35%, #FFCC00 65%, #D40511 65%, #D40511 100%); }
    
    /* Print Buttons */
    .no-print { position: fixed; bottom: 30px; right: 30px; display: flex; gap: 12px; z-index: 100; }
    .btn { padding: 14px 28px; border: none; border-radius: 50px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.2s; font-family: inherit; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
    .btn-print { background: linear-gradient(135deg, #D40511, #B91C1C); color: #fff; }
    .btn-pdf { background: #1f2937; color: #fff; }
  </style>
</head>
<body>
  <div class="top-stripe"></div>
  <div class="page">
    
    <!-- HEADER -->
    <div class="header">
      <div class="header-stamp">Official Receipt</div>
      <div class="header-logo">DHL</div>
      <div class="header-sub">Express Delivery Services</div>
      <div class="header-tag">Deutsche Post DHL Group</div>
    </div>
    
    <!-- HERO IMAGE -->
    <div class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-title">SHIPMENT RECEIPT</div>
    </div>
    
    <!-- META BAR -->
    <div class="meta-bar">
      <div>
        <div class="meta-label">Receipt ID</div>
        <div class="meta-value">${receiptId}</div>
      </div>
      <div style="text-align:right;">
        <div class="meta-label">Date Issued</div>
        <div class="meta-value-white">${createdDate}</div>
      </div>
    </div>
    
    <!-- CONTENT -->
    <div class="content">
      
      <!-- TRACKING -->
      <div class="tracking-section">
        <div class="tracking-badge">Express Tracking</div>
        <div class="tracking-label">Tracking Number</div>
        <div class="tracking-code">${trackingCode}</div>
        <div class="tracking-service">DHL EXPRESS WORLDWIDE</div>
      </div>
      
      <!-- SENDER / RECEIVER -->
      <div class="grid">
        <div class="card card-red">
          <div class="card-title">&#9992; Sender Information</div>
          <div class="field"><div class="field-label">Full Name</div><div class="field-value">${pkg.senderName || 'N/A'}</div></div>
          <div class="field"><div class="field-label">Phone Number</div><div class="field-value">${pkg.senderPhone || 'N/A'}</div></div>
          <div class="field"><div class="field-label">Email Address</div><div class="field-value-sm">${pkg.senderEmail || 'N/A'}</div></div>
          <div class="field"><div class="field-label">Full Address</div><div class="field-value-sm">${pkg.senderAddress || ''}, ${pkg.senderCity || ''}, ${pkg.senderCountry || ''}</div></div>
        </div>
        <div class="card card-yellow">
          <div class="card-title">&#127758; Receiver Information</div>
          <div class="field"><div class="field-label">Full Name</div><div class="field-value">${pkg.receiverName || 'N/A'}</div></div>
          <div class="field"><div class="field-label">Phone Number</div><div class="field-value">${pkg.receiverPhone || 'N/A'}</div></div>
          <div class="field"><div class="field-label">Email Address</div><div class="field-value-sm">${pkg.receiverEmail || 'N/A'}</div></div>
          <div class="field"><div class="field-label">Full Address</div><div class="field-value-sm">${pkg.receiverAddress || ''}, ${pkg.receiverCity || ''}, ${pkg.receiverCountry || ''}</div></div>
        </div>
      </div>
      
      <!-- PACKAGE DETAILS -->
      <div class="package-card">
        <div class="package-title">&#128230; Package Details</div>
        <div class="package-grid">
          <div class="package-item package-item-red">
            <div class="package-item-label">Weight</div>
            <div class="package-item-value">${weight} <span style="font-size:12px;color:#6b7280;">kg</span></div>
          </div>
          <div class="package-item package-item-yellow">
            <div class="package-item-label">Service</div>
            <div class="package-item-value-sm">Express</div>
          </div>
          <div class="package-item package-item-green">
            <div class="package-item-label">Status</div>
            <div class="package-item-value-sm"><span class="status-badge">${st.label}</span></div>
          </div>
          <div class="package-item package-item-blue">
            <div class="package-item-label">Pieces</div>
            <div class="package-item-value">1</div>
          </div>
        </div>
        <div class="package-desc">
          <div class="field-label">Package Description</div>
          <div class="field-value" style="margin-top:5px;">${pkg.packageDescription || 'General Goods'}</div>
        </div>
      </div>
      
      <!-- AMOUNT -->
      <div class="amount-section">
        <div class="amount-deco"></div>
        <div class="amount-label">Total Shipping Amount</div>
        <div class="amount-value">$<span class="big">${priceInt}</span><span class="small">.${priceDec}</span></div>
        <div class="amount-note">
          <strong>Payment Notice:</strong> Shipping charges must be paid before dispatch. Contact Customer Service for payment options.
        </div>
      </div>
      
      <!-- BARCODE -->
      <div class="barcode-area">
        <div class="barcode-label">Scan for Digital Copy</div>
        <div class="barcode-lines">|| | ||| || | |||| ||| | || |</div>
        <div class="barcode-code">${trackingCode}</div>
      </div>
      
      <!-- ISSUED -->
      <div style="text-align:center; margin-bottom:10px; color:#6b7280; font-size:13px;">
        Issued on <strong>${createdDate}</strong> at <strong>${createdTime}</strong>
      </div>
      
    </div>
    
    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-stripe"></div>
      <div class="footer-logo">DHL</div>
      <div class="footer-sub">Express Worldwide</div>
      <div class="footer-text">
        DHL Express, Charles-de-Gaulle-Str. 20, 53113 Bonn, Germany<br>
        Customer Service: <span style="color:#D1D5DB;">dhld5736@gmail.com</span> | <span style="color:#D1D5DB;">www.dhl.com</span>
      </div>
      <div class="footer-legal">
        &copy; ${new Date().getFullYear()} DHL International GmbH. All rights reserved.<br>
        DHL is a division of the Deutsche Post DHL Group.<br>
        This is an official receipt. Please retain for your records.
      </div>
    </div>
    
    <div class="bottom-stripe"></div>
  </div>
  
  <!-- PRINT BUTTONS -->
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">&#128424; Print Receipt</button>
    <button class="btn btn-pdf" onclick="downloadPDF()">&#128190; Download PDF</button>
  </div>
  
  <script>
    function downloadPDF() {
      document.querySelector('.no-print').style.display = 'none';
      window.print();
      setTimeout(() => { document.querySelector('.no-print').style.display = 'flex'; }, 1000);
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
    const receiptId = pkg.receipt?.receiptId || 'N/A';
    const weight = pkg.packageWeight || pkg.weight || 0;
    const price = typeof pkg.deliveryPrice === 'number' ? pkg.deliveryPrice : parseFloat(pkg.deliveryPrice) || 0;

    // Top stripe
    doc.rect(0, 0, 595, 8).fill('#D40511');
    doc.rect(208, 0, 179, 8).fill('#FFCC00');

    // Header
    doc.rect(0, 8, 595, 100).fill('#D40511');
    doc.fillColor('#fff').fontSize(36).font('Helvetica-Bold').text('DHL', 50, 30);
    doc.fillColor('#FFCC00').fontSize(12).font('Helvetica-Bold').text('EXPRESS DELIVERY', 50, 70);
    doc.fillColor('rgba(255,255,255,0.6)').fontSize(9).text('Deutsche Post DHL Group', 50, 88);

    // Official stamp
    doc.save();
    doc.translate(480, 30).rotate(-10);
    doc.rect(0, 0, 90, 30).stroke('#FFCC00');
    doc.fillColor('#FFCC00').fontSize(10).font('Helvetica-Bold').text('OFFICIAL', 15, 10);
    doc.restore();

    // Receipt ID & Date
    doc.fillColor('#fff').fontSize(9).text('RECEIPT ID', 450, 30, { align: 'right' });
    doc.fillColor('#FFCC00').fontSize(11).font('Courier').text(receiptId, 450, 45, { align: 'right' });
    doc.fillColor('#fff').fontSize(9).text('DATE ISSUED', 450, 65, { align: 'right' });
    doc.fillColor('#fff').fontSize(10).text(createdDate, 450, 78, { align: 'right' });

    // Tracking section (gold box)
    const trackY = 125;
    doc.rect(50, trackY, 495, 70).fill('#FFF8E1');
    doc.strokeColor('#FFCC00').lineWidth(2).dash(5, { space: 3 }).rect(50, trackY, 495, 70).stroke();
    doc.undash();
    doc.fillColor('#B8860B').fontSize(10).font('Helvetica-Bold').text('EXPRESS TRACKING', 50, trackY + 10, { align: 'center', width: 495 });
    doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text('TRACKING NUMBER', 50, trackY + 26, { align: 'center', width: 495 });
    doc.fillColor('#D40511').fontSize(22).font('Courier-Bold').text(pkg.trackingCode || 'N/A', 50, trackY + 40, { align: 'center', width: 495 });

    // Sender
    const senderY = 215;
    doc.fillColor('#D40511').fontSize(10).font('Helvetica-Bold').text('SENDER', 50, senderY);
    doc.moveTo(50, senderY + 14).lineTo(280, senderY + 14).stroke('#e5e7eb');
    doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold').text(pkg.senderName || 'N/A', 50, senderY + 22);
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(pkg.senderPhone || 'N/A', 50, senderY + 40);
    doc.fillColor('#4b5563').fontSize(9).text(pkg.senderEmail || 'N/A', 50, senderY + 55);
    doc.fillColor('#4b5563').fontSize(9).text(`${pkg.senderAddress || ''}, ${pkg.senderCity || ''}`, 50, senderY + 68, { width: 230 });
    doc.fillColor('#4b5563').fontSize(9).text(pkg.senderCountry || '', 50, senderY + 82);

    // Receiver
    doc.fillColor('#D40511').fontSize(10).font('Helvetica-Bold').text('RECEIVER', 320, senderY);
    doc.moveTo(320, senderY + 14).lineTo(545, senderY + 14).stroke('#e5e7eb');
    doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold').text(pkg.receiverName || 'N/A', 320, senderY + 22);
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(pkg.receiverPhone || 'N/A', 320, senderY + 40);
    doc.fillColor('#4b5563').fontSize(9).text(pkg.receiverEmail || 'N/A', 320, senderY + 55);
    doc.fillColor('#4b5563').fontSize(9).text(`${pkg.receiverAddress || ''}, ${pkg.receiverCity || ''}`, 320, senderY + 68, { width: 225 });
    doc.fillColor('#4b5563').fontSize(9).text(pkg.receiverCountry || '', 320, senderY + 82);

    // Package details
    const pkgY = senderY + 100;
    doc.fillColor('#D40511').fontSize(10).font('Helvetica-Bold').text('PACKAGE DETAILS', 50, pkgY);
    doc.moveTo(50, pkgY + 14).lineTo(545, pkgY + 14).stroke('#e5e7eb');

    // Package grid boxes
    const boxY = pkgY + 24;
    const boxW = 110;
    const boxH = 50;
    const colors = ['#D40511', '#FFCC00', '#059669', '#3B82F6'];
    const labels = ['Weight', 'Service', 'Status', 'Pieces'];
    const values = [`${weight} kg`, 'Express', (pkg.status || 'pending').replace('_', ' ').toUpperCase(), '1'];

    for (let i = 0; i < 4; i++) {
      const x = 50 + i * (boxW + 12);
      doc.rect(x, boxY, boxW, boxH).fill('#f9fafb');
      doc.moveTo(x, boxY).lineTo(x + boxW, boxY).stroke(colors[i]);
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text(labels[i], x, boxY + 8, { align: 'center', width: boxW });
      doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold').text(values[i], x, boxY + 24, { align: 'center', width: boxW });
    }

    // Description
    doc.fillColor('#9ca3af').fontSize(9).text('DESCRIPTION', 50, boxY + 60);
    doc.fillColor('#1f2937').fontSize(10).font('Helvetica').text(pkg.packageDescription || 'General Goods', 50, boxY + 74, { width: 495 });

    // Amount
    const amtY = boxY + 100;
    doc.rect(50, amtY, 495, 80).fill('#FFF8E1');
    doc.fillColor('#B8860B').fontSize(10).font('Helvetica-Bold').text('TOTAL SHIPPING AMOUNT', 70, amtY + 12);
    doc.fillColor('#D40511').fontSize(32).font('Helvetica-Bold').text(`$${price.toFixed(2)}`, 70, amtY + 28);
    doc.fillColor('#B8860B').fontSize(9).text('Payment required before dispatch. Contact Customer Service.', 70, amtY + 65);

    // Footer
    doc.moveTo(50, 720).lineTo(545, 720).stroke('#e5e7eb');
    doc.fillColor('#D40511').fontSize(18).font('Helvetica-Bold').text('DHL', 50, 735, { align: 'center' });
    doc.fillColor('#9ca3af').fontSize(9).text('Express Worldwide', 50, 755, { align: 'center' });
    doc.fillColor('#6b7280').fontSize(8).text('DHL Express, Charles-de-Gaulle-Str. 20, 53113 Bonn, Germany', 50, 770, { align: 'center' });
    doc.fillColor('#6b7280').fontSize(8).text(`Created: ${createdDate}`, 50, 782, { align: 'center' });

    // Bottom stripe
    doc.rect(0, 792, 595, 8).fill('#D40511');
    doc.rect(208, 792, 179, 8).fill('#FFCC00');

    doc.end();
  });
};

module.exports = { generateReceiptHTML, generateReceiptPDF };
