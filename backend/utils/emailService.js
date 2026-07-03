const sgMail = require('@sendgrid/mail');

const EMAIL_FROM = process.env.EMAIL_FROM || 'dhld5736@gmail.com';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// Helper: Get time-based greeting
const getGreeting = (gender) => {
  const hour = new Date().getHours();
  let timeGreeting = 'Good day';
  if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
  else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17 && hour < 21) timeGreeting = 'Good evening';
  else timeGreeting = 'Good night';

  const title = gender === 'female' ? 'Madam' : gender === 'male' ? 'Sir' : 'Sir/Madam';
  return `${timeGreeting}, ${title}`;
};

const sendEmail = async (to, subject, html) => {
  console.log('📧 sendEmail called');
  console.log('   To:', to);
  console.log('   From:', EMAIL_FROM);
  console.log('   SENDGRID_API_KEY set:', !!SENDGRID_API_KEY);
  console.log('   SENDGRID_API_KEY length:', SENDGRID_API_KEY ? SENDGRID_API_KEY.length : 0);

  if (!SENDGRID_API_KEY) {
    console.log('⚠️ SENDGRID_API_KEY not set, skipping email');
    return;
  }

  sgMail.setApiKey(SENDGRID_API_KEY);

  const msg = {
    to,
    from: { name: 'DHL Express Delivery', email: EMAIL_FROM },
    replyTo: EMAIL_FROM,
    subject,
    html,
  };

  try {
    console.log('🚀 Sending SendGrid API request...');
    const response = await sgMail.send(msg);
    console.log('✅ Email sent to', to);
    console.log('   Status:', response[0].statusCode);
    console.log('   Headers:', JSON.stringify(response[0].headers, null, 2));
  } catch (error) {
    console.error('❌ SENDGRID EMAIL FAILED');
    console.error('   Status:', error.code);
    console.error('   Message:', error.message);
    if (error.response) {
      console.error('   Body:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
};

const sendShipmentCreatedEmail = async (pkg) => {
  console.log('📦 sendShipmentCreatedEmail called for:', pkg.receiverEmail);
  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);
  const createdDate = new Date(pkg.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const createdTime = new Date(pkg.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your DHL Shipment Has Been Created</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body { margin:0; padding:0; background:#f5f5f5; font-family:'Inter','Segoe UI',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    .email-wrapper { max-width:680px; margin:0 auto; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
    .header { background:linear-gradient(135deg,#D40511 0%,#BA0410 50%,#8B0000 100%); padding:50px 40px 40px; text-align:center; position:relative; }
    .header::after { content:''; position:absolute; bottom:-30px; left:0; right:0; height:60px; background:#fff; border-radius:50% 50% 0 0; }
    .logo { font-size:48px; font-weight:900; color:#fff; letter-spacing:8px; text-shadow:0 2px 10px rgba(0,0,0,0.3); }
    .logo-sub { color:#FFCC00; font-size:13px; font-weight:700; letter-spacing:4px; text-transform:uppercase; margin-top:8px; }
    .dhl-stripe { height:8px; background:linear-gradient(90deg,#D40511 0%,#D40511 33%,#FFCC00 33%,#FFCC00 66%,#D40511 66%,#D40511 100%); }
    .content { padding:50px 40px 30px; }
    .greeting-section { text-align:center; margin-bottom:35px; }
    .greeting { font-size:18px; color:#6b7280; font-weight:500; letter-spacing:1px; }
    .receiver-name { font-size:36px; font-weight:900; color:#D40511; margin-top:8px; letter-spacing:-0.5px; }
    .success-banner { background:linear-gradient(135deg,#d4edda 0%,#c3e6cb 100%); border-radius:16px; padding:28px; margin-bottom:30px; border:2px solid #28a745; text-align:center; position:relative; overflow:hidden; }
    .success-banner::before { content:'✓'; position:absolute; top:-10px; right:20px; font-size:80px; color:rgba(40,167,69,0.08); font-weight:900; }
    .success-title { color:#155724; font-size:20px; font-weight:800; margin-bottom:10px; }
    .success-text { color:#155724; font-size:14px; line-height:1.6; }
    .success-text strong { font-weight:700; }
    .info-card { background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%); border-radius:16px; padding:28px; margin-bottom:25px; border-left:5px solid #D40511; }
    .info-card-title { font-size:12px; color:#D40511; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:15px; }
    .info-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #dee2e6; }
    .info-row:last-child { border-bottom:none; }
    .info-label { font-size:12px; color:#6b7280; font-weight:600; text-transform:uppercase; letter-spacing:1px; }
    .info-value { font-size:14px; color:#1f2937; font-weight:700; }
    .tracking-section { background:linear-gradient(135deg,#FFF8E1 0%,#FFECB3 100%); border-radius:16px; padding:35px; text-align:center; margin-bottom:25px; border:3px dashed #FFCC00; position:relative; }
    .tracking-label { color:#B8860B; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:3px; margin-bottom:12px; }
    .tracking-code { color:#1f2937; font-size:38px; font-weight:900; letter-spacing:6px; font-family:'Courier New',monospace; text-shadow:0 2px 4px rgba(0,0,0,0.1); }
    .tracking-hint { color:#B8860B; font-size:12px; margin-top:10px; font-weight:500; }
    .amount-section { background:linear-gradient(135deg,#fff5f5 0%,#ffe0e0 100%); border-radius:16px; padding:30px; text-align:center; margin-bottom:25px; border:2px solid #D40511; }
    .amount-label { font-size:12px; color:#D40511; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }
    .amount-value { font-size:44px; font-weight:900; color:#D40511; letter-spacing:-1px; }
    .amount-note { font-size:13px; color:#991b1b; margin-top:12px; padding:12px 16px; background:rgba(212,5,17,0.08); border-radius:8px; font-weight:600; line-height:1.5; }
    .status-alert { background:linear-gradient(135deg,#fff3cd 0%,#ffeeba 100%); border-radius:12px; padding:18px; margin-bottom:25px; border:2px solid #ffc107; text-align:center; }
    .status-alert-icon { font-size:28px; margin-bottom:8px; }
    .status-alert-text { color:#856404; font-size:14px; font-weight:600; line-height:1.5; }
    .cta-section { text-align:center; margin:30px 0; }
    .cta-text { font-size:15px; color:#4b5563; font-weight:600; margin-bottom:20px; line-height:1.6; }
    .btn-track { display:inline-block; background:linear-gradient(135deg,#D40511 0%,#BA0410 100%); color:#fff; text-decoration:none; padding:20px 60px; border-radius:50px; font-size:18px; font-weight:800; letter-spacing:1px; box-shadow:0 8px 25px rgba(212,5,17,0.35); transition:all 0.3s; }
    .btn-track:hover { transform:translateY(-3px); box-shadow:0 12px 35px rgba(212,5,17,0.45); }
    .btn-arrow { margin-left:8px; font-size:20px; }
    .reply-section { background:linear-gradient(135deg,#e7f3ff 0%,#d4e9ff 100%); border-radius:12px; padding:20px; margin-top:25px; border:2px solid #b3d9ff; text-align:center; }
    .reply-icon { font-size:24px; margin-bottom:8px; }
    .reply-text { color:#004085; font-size:14px; font-weight:600; line-height:1.5; }
    .divider { height:2px; background:linear-gradient(90deg,transparent,#dee2e6,transparent); margin:30px 0; }
    .details-grid { display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:25px; }
    .detail-card { background:#f8f9fa; border-radius:12px; padding:18px; border:1px solid #e5e7eb; }
    .detail-card-title { font-size:11px; color:#D40511; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #e5e7eb; }
    .detail-item { margin-bottom:10px; }
    .detail-item:last-child { margin-bottom:0; }
    .detail-label { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:3px; }
    .detail-value { font-size:13px; color:#1f2937; font-weight:600; line-height:1.4; }
    .footer { background:linear-gradient(135deg,#1f2937 0%,#111827 100%); padding:40px 30px; text-align:center; color:#9ca3af; }
    .footer-brand { color:#fff; font-size:24px; font-weight:900; letter-spacing:6px; margin-bottom:8px; }
    .footer-sub { color:#FFCC00; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:15px; }
    .footer-text { font-size:12px; line-height:1.6; margin-bottom:8px; }
    .footer-divider { height:1px; background:#374151; margin:20px 0; }
    .footer-copyright { font-size:11px; color:#6b7280; }
    .social-links { margin:15px 0; }
    .social-links a { display:inline-block; margin:0 8px; color:#9ca3af; text-decoration:none; font-size:12px; }
    @media (max-width:600px) {
      .content { padding:30px 20px; }
      .details-grid { grid-template-columns:1fr; }
      .tracking-code { font-size:28px; letter-spacing:3px; }
      .amount-value { font-size:36px; }
      .btn-track { padding:18px 40px; font-size:16px; }
      .receiver-name { font-size:28px; }
    }
  </style>
</head>
<body>
  <div style="background:#f5f5f5; padding:20px 10px;">
    <div class="email-wrapper">
      <div class="dhl-stripe"></div>
      <div class="header">
        <div class="logo">DHL</div>
        <div class="logo-sub">Express Delivery Services</div>
      </div>
      
      <div class="content">
        <div class="greeting-section">
          <div class="greeting">${greeting}</div>
          <div class="receiver-name">${pkg.receiverName}</div>
        </div>

        <div class="success-banner">
          <div class="success-title">✅ Shipment Created Successfully!</div>
          <div class="success-text">
            Your package <strong>"${pkg.packageName}"</strong> has been created and registered in our system.<br>
            It is currently <strong>pending</strong> and awaiting processing due to outstanding payment clearance.
          </div>
        </div>

        <div class="tracking-section">
          <div class="tracking-label">Your Tracking Number</div>
          <div class="tracking-code">${pkg.trackingCode}</div>
          <div class="tracking-hint">Use this code to track your shipment in real-time</div>
        </div>

        <div class="details-grid">
          <div class="detail-card">
            <div class="detail-card-title">📦 Package Info</div>
            <div class="detail-item">
              <div class="detail-label">Package Name</div>
              <div class="detail-value">${pkg.packageName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Weight</div>
              <div class="detail-value">${pkg.packageWeight} kg</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Service Type</div>
              <div class="detail-value">Express International</div>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-card-title">📍 Route</div>
            <div class="detail-item">
              <div class="detail-label">From</div>
              <div class="detail-value">${pkg.senderCity}, ${pkg.senderCountry}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">To</div>
              <div class="detail-value">${pkg.receiverCity}, ${pkg.receiverCountry}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Status</div>
              <div class="detail-value" style="color:#D40511; font-weight:800;">PENDING</div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-title">👤 Sender Information</div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${pkg.senderName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${pkg.senderEmail}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${pkg.senderPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address</span>
            <span class="info-value">${pkg.senderAddress}, ${pkg.senderCity}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-title">🎯 Receiver Information</div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${pkg.receiverName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${pkg.receiverEmail}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${pkg.receiverPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address</span>
            <span class="info-value">${pkg.receiverAddress}, ${pkg.receiverCity}</span>
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-label">Total Shipping Amount Due</div>
          <div class="amount-value">$${pkg.deliveryPrice.toFixed(2)}</div>
          <div class="amount-note">
            ⚠️ <strong>Payment Required:</strong> This shipment is currently on hold pending payment clearance. 
            Please contact the sender or reply to this email to arrange payment and confirm delivery details.
          </div>
        </div>

        <div class="status-alert">
          <div class="status-alert-icon">⏳</div>
          <div class="status-alert-text">
            <strong>Current Status:</strong> PENDING<br>
            Your package will remain in pending status until payment is confirmed. 
            Once cleared, it will proceed to processing and shipping.
          </div>
        </div>

        <div class="divider"></div>

        <div class="cta-section">
          <div class="cta-text">
            Track your shipment in real-time to see live updates on location, status changes, and estimated delivery time. 
            Click the button below to access your tracking page.
          </div>
          <a href="${trackingUrl}/track/${pkg.trackingCode}" class="btn-track">
            Track Your Shipment <span class="btn-arrow">→</span>
          </a>
        </div>

        <div class="reply-section">
          <div class="reply-icon">📧</div>
          <div class="reply-text">
            <strong>Need assistance?</strong> Reply directly to this email for payment arrangements, 
            delivery confirmation, or any questions about your shipment. Our support team is ready to help.
          </div>
        </div>

        <div class="info-card" style="margin-top:25px; border-left-color:#28a745;">
          <div class="info-card-title" style="color:#28a745;">📅 Shipment Details</div>
          <div class="info-row">
            <span class="info-label">Created On</span>
            <span class="info-value">${createdDate} at ${createdTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tracking Code</span>
            <span class="info-value" style="font-family:'Courier New',monospace;">${pkg.trackingCode}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Receipt ID</span>
            <span class="info-value" style="font-family:'Courier New',monospace;">${pkg.receipt?.receiptId || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-brand">DHL</div>
        <div class="footer-sub">Express Delivery Services</div>
        <div class="footer-text">
          Thank you for choosing DHL Express Delivery.<br>
          We are committed to delivering your packages safely and on time.
        </div>
        <div class="footer-divider"></div>
        <div class="footer-copyright">
          © 2026 DHL Express Delivery Services. All rights reserved.<br>
          This is an automated message. Please do not reply directly for general inquiries.
        </div>
      </div>
      <div class="dhl-stripe"></div>
    </div>
  </div>
</body>
</html>`;

  await sendEmail(pkg.receiverEmail, `📦 Your DHL Shipment Has Been Created — Tracking: ${pkg.trackingCode}`, html);
};

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  console.log('📦 sendStatusUpdateEmail called for:', pkg.receiverEmail);
  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);
  const statusIcons = {
    pending: '⏳', in_transit: '🚚', arrived: '📍', delivered: '✅', stopped: '⚠️',
  };
  const statusMessages = {
    pending: 'Your shipment is awaiting pickup and payment clearance.',
    in_transit: 'Your package is on the move! Track its journey in real-time.',
    arrived: 'Your package has arrived at the destination facility and is ready for final delivery.',
    delivered: 'Your package has been successfully delivered! Thank you for choosing DHL Express.',
    stopped: 'There is a temporary hold on your shipment. Please contact support for details.',
  };
  const statusColors = {
    pending: '#f59e0b', in_transit: '#3b82f6', arrived: '#8b5cf6', delivered: '#10b981', stopped: '#ef4444',
  };
  const statusBgColors = {
    pending: '#fffbeb', in_transit: '#eff6ff', arrived: '#f5f3ff', delivered: '#ecfdf5', stopped: '#fef2f2',
  };
  const statusBorderColors = {
    pending: '#fbbf24', in_transit: '#60a5fa', arrived: '#a78bfa', delivered: '#34d399', stopped: '#f87171',
  };

  const icon = statusIcons[pkg.status] || '📦';
  const message = statusMessages[pkg.status] || 'Your shipment status has been updated.';
  const color = statusColors[pkg.status] || '#6b7280';
  const bgColor = statusBgColors[pkg.status] || '#f9fafb';
  const borderColor = statusBorderColors[pkg.status] || '#e5e7eb';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DHL Shipment Status Update</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body { margin:0; padding:0; background:#f5f5f5; font-family:'Inter','Segoe UI',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    .email-wrapper { max-width:680px; margin:0 auto; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
    .header { background:linear-gradient(135deg,#D40511 0%,#BA0410 50%,#8B0000 100%); padding:50px 40px 40px; text-align:center; position:relative; }
    .header::after { content:''; position:absolute; bottom:-30px; left:0; right:0; height:60px; background:#fff; border-radius:50% 50% 0 0; }
    .logo { font-size:48px; font-weight:900; color:#fff; letter-spacing:8px; text-shadow:0 2px 10px rgba(0,0,0,0.3); }
    .logo-sub { color:#FFCC00; font-size:13px; font-weight:700; letter-spacing:4px; text-transform:uppercase; margin-top:8px; }
    .dhl-stripe { height:8px; background:linear-gradient(90deg,#D40511 0%,#D40511 33%,#FFCC00 33%,#FFCC00 66%,#D40511 66%,#D40511 100%); }
    .content { padding:50px 40px 30px; }
    .greeting-section { text-align:center; margin-bottom:30px; }
    .greeting { font-size:18px; color:#6b7280; font-weight:500; }
    .receiver-name { font-size:32px; font-weight:900; color:#D40511; margin-top:8px; }
    .status-banner { background:${bgColor}; border-radius:16px; padding:35px; text-align:center; margin-bottom:30px; border:3px solid ${borderColor}; position:relative; overflow:hidden; }
    .status-banner::before { content:'${icon}'; position:absolute; top:-15px; right:25px; font-size:100px; opacity:0.06; }
    .status-icon { font-size:56px; margin-bottom:15px; }
    .status-title { color:${color}; font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
    .status-message { color:#4b5563; font-size:15px; line-height:1.7; max-width:500px; margin:0 auto; }
    .old-status { display:inline-block; background:#e5e7eb; color:#6b7280; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-top:15px; }
    .arrow { color:#9ca3af; margin:0 8px; font-size:14px; }
    .new-status { display:inline-block; background:${color}; color:#fff; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
    .tracking-section { background:linear-gradient(135deg,#FFF8E1 0%,#FFECB3 100%); border-radius:16px; padding:30px; text-align:center; margin-bottom:25px; border:2px dashed #FFCC00; }
    .tracking-label { color:#B8860B; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:3px; margin-bottom:10px; }
    .tracking-code { color:#1f2937; font-size:32px; font-weight:900; letter-spacing:4px; font-family:'Courier New',monospace; }
    .package-summary { background:#f8f9fa; border-radius:12px; padding:20px; margin-bottom:25px; border:1px solid #e5e7eb; }
    .summary-title { font-size:12px; color:#D40511; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:15px; }
    .summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; text-align:center; }
    .summary-item { padding:12px; background:#fff; border-radius:8px; }
    .summary-label { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; }
    .summary-value { font-size:14px; color:#1f2937; font-weight:700; }
    .cta-section { text-align:center; margin:30px 0; }
    .cta-text { font-size:15px; color:#4b5563; font-weight:600; margin-bottom:20px; line-height:1.6; }
    .btn-track { display:inline-block; background:linear-gradient(135deg,#D40511 0%,#BA0410 100%); color:#fff; text-decoration:none; padding:18px 50px; border-radius:50px; font-size:17px; font-weight:800; letter-spacing:1px; box-shadow:0 8px 25px rgba(212,5,17,0.35); }
    .reply-section { background:linear-gradient(135deg,#e7f3ff 0%,#d4e9ff 100%); border-radius:12px; padding:20px; margin-top:25px; border:2px solid #b3d9ff; text-align:center; }
    .reply-icon { font-size:24px; margin-bottom:8px; }
    .reply-text { color:#004085; font-size:14px; font-weight:600; line-height:1.5; }
    .footer { background:linear-gradient(135deg,#1f2937 0%,#111827 100%); padding:40px 30px; text-align:center; color:#9ca3af; }
    .footer-brand { color:#fff; font-size:24px; font-weight:900; letter-spacing:6px; margin-bottom:8px; }
    .footer-sub { color:#FFCC00; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:15px; }
    .footer-text { font-size:12px; line-height:1.6; margin-bottom:8px; }
    .footer-divider { height:1px; background:#374151; margin:20px 0; }
    .footer-copyright { font-size:11px; color:#6b7280; }
    @media (max-width:600px) {
      .content { padding:30px 20px; }
      .summary-grid { grid-template-columns:1fr; }
      .tracking-code { font-size:24px; }
      .status-title { font-size:20px; }
      .receiver-name { font-size:26px; }
      .btn-track { padding:16px 35px; font-size:15px; }
    }
  </style>
</head>
<body>
  <div style="background:#f5f5f5; padding:20px 10px;">
    <div class="email-wrapper">
      <div class="dhl-stripe"></div>
      <div class="header">
        <div class="logo">DHL</div>
        <div class="logo-sub">Express Delivery Services</div>
      </div>
      
      <div class="content">
        <div class="greeting-section">
          <div class="greeting">${greeting}</div>
          <div class="receiver-name">${pkg.receiverName}</div>
        </div>

        <div class="status-banner">
          <div class="status-icon">${icon}</div>
          <div class="status-title">${pkg.status.replace('_',' ').toUpperCase()}</div>
          <div class="status-message">${message}</div>
          <div style="margin-top:15px;">
            <span class="old-status">${oldStatus.replace('_',' ').toUpperCase()}</span>
            <span class="arrow">→</span>
            <span class="new-status">${pkg.status.replace('_',' ').toUpperCase()}</span>
          </div>
        </div>

        <div class="tracking-section">
          <div class="tracking-label">Tracking Number</div>
          <div class="tracking-code">${pkg.trackingCode}</div>
        </div>

        <div class="package-summary">
          <div class="summary-title">📦 Shipment Summary</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Package</div>
              <div class="summary-value">${pkg.packageName}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Weight</div>
              <div class="summary-value">${pkg.packageWeight} kg</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Amount</div>
              <div class="summary-value">$${pkg.deliveryPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div class="cta-section">
          <div class="cta-text">
            Stay updated on your shipment's journey. Click below to track real-time location and status updates.
          </div>
          <a href="${trackingUrl}/track/${pkg.trackingCode}" class="btn-track">
            Track Your Shipment →
          </a>
        </div>

        <div class="reply-section">
          <div class="reply-icon">📧</div>
          <div class="reply-text">
            <strong>Questions?</strong> Reply to this email for any inquiries about your shipment status or delivery details.
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-brand">DHL</div>
        <div class="footer-sub">Express Delivery Services</div>
        <div class="footer-text">
          Thank you for choosing DHL Express Delivery.<br>
          Reliable shipping, delivered with care.
        </div>
        <div class="footer-divider"></div>
        <div class="footer-copyright">
          © 2026 DHL Express Delivery Services. All rights reserved.
        </div>
      </div>
      <div class="dhl-stripe"></div>
    </div>
  </div>
</body>
</html>`;

  await sendEmail(pkg.receiverEmail, `${icon} DHL Shipment Update — ${pkg.status.replace('_',' ').toUpperCase()} | ${pkg.trackingCode}`, html);
};

module.exports = { sendShipmentCreatedEmail, sendStatusUpdateEmail };
