const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER || 'dhld5736@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_PASS) {
  console.error('❌ EMAIL_PASS is not set in .env file!');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
  } else {
    console.log('✅ Email transporter ready - sending from:', EMAIL_USER);
  }
});

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

const sendShipmentCreatedEmail = async (pkg) => {
  const trackingUrl = 'https://dxti-delivery-frontend.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);
  const estDelivery = new Date(pkg.createdAt);
  estDelivery.setDate(estDelivery.getDate() + 7);
  const estDeliveryStr = estDelivery.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your DHL Shipment Has Been Created</title>
  <style>
    body { margin:0; padding:0; background:#f0f0f0; font-family:'Segoe UI',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    .container { max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.12); }
    .header { background:linear-gradient(135deg,#D40511,#BA0410); padding:45px 30px 35px; text-align:center; position:relative; overflow:hidden; }
    .header::before { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background:radial-gradient(circle,rgba(255,204,0,0.1) 0%,transparent 70%); }
    .header h1 { color:#fff; margin:0; font-size:42px; font-weight:900; letter-spacing:6px; position:relative; }
    .header .subtitle { color:#FFCC00; margin:8px 0 0; font-size:13px; font-weight:700; letter-spacing:4px; text-transform:uppercase; position:relative; }
    .header .tagline { color:rgba(255,255,255,0.7); margin-top:8px; font-size:12px; position:relative; }
    .dhl-stripe { height:6px; background:linear-gradient(90deg,#D40511 33%,#FFCC00 33%,#FFCC00 66%,#D40511 66%); }
    .content { padding:35px 30px; }
    .greeting-box { background:linear-gradient(135deg,#f8f9fa,#e9ecef); border-radius:12px; padding:20px; margin-bottom:25px; border-left:4px solid #D40511; }
    .greeting { font-size:20px; color:#1f2937; font-weight:700; margin-bottom:4px; }
    .name { font-size:26px; font-weight:800; color:#D40511; }
    .ready-box { background:linear-gradient(135deg,#d4edda,#c3e6cb); border-radius:12px; padding:18px; margin-bottom:25px; border:2px solid #28a745; text-align:center; }
    .ready-box .icon { font-size:32px; margin-bottom:8px; }
    .ready-box .title { color:#155724; font-size:16px; font-weight:800; margin-bottom:4px; }
    .ready-box .text { color:#155724; font-size:13px; }
    .confirm-box { background:#fff3cd; border-radius:10px; padding:15px; margin-bottom:20px; border:1px solid #ffc107; }
    .confirm-box .label { color:#856404; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
    .confirm-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #e0e0e0; font-size:13px; }
    .confirm-row:last-child { border-bottom:none; }
    .confirm-label { color:#6c757d; }
    .confirm-value { color:#212529; font-weight:600; }
    .tracking-box { background:linear-gradient(135deg,#FFF8E1,#FFECB3); border-radius:14px; padding:28px; text-align:center; margin-bottom:25px; border:3px dashed #FFCC00; position:relative; }
    .tracking-box::before { content:'📦'; position:absolute; top:-15px; left:50%; transform:translateX(-50%); background:#fff; padding:0 15px; font-size:20px; }
    .tracking-label { color:#B8860B; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:3px; margin-bottom:10px; }
    .tracking-code { color:#1f2937; font-size:32px; font-weight:900; letter-spacing:4px; font-family:'Courier New',monospace; }
    .status-row { display:flex; justify-content:space-between; margin:15px 0; padding:18px; background:#f8f9fa; border-radius:10px; border:1px solid #e9ecef; }
    .status-item { text-align:center; flex:1; }
    .status-label { font-size:10px; color:#6c757d; text-transform:uppercase; letter-spacing:2px; font-weight:700; margin-bottom:6px; }
    .status-value { font-size:15px; font-weight:800; color:#212529; }
    .status-value.pending { color:#D40511; }
    .amount-section { background:linear-gradient(135deg,#FFF8E1,#FFECB3); border-radius:14px; padding:25px; text-align:center; margin-bottom:25px; border:2px solid #FFCC00; position:relative; overflow:hidden; }
    .amount-section::after { content:'💰'; position:absolute; top:10px; right:15px; font-size:40px; opacity:0.15; }
    .amount-label { color:#B8860B; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }
    .amount-value { font-size:36px; font-weight:900; color:#D40511; }
    .amount-usd { font-size:14px; color:#B8860B; font-weight:600; }
    .payment-box { background:#fff; border-radius:8px; padding:15px; margin-top:15px; border:2px solid #FFCC00; }
    .payment-box .icon { font-size:24px; margin-bottom:8px; }
    .payment-box .title { color:#D40511; font-size:14px; font-weight:800; margin-bottom:6px; }
    .payment-box .text { color:#856404; font-size:13px; line-height:1.6; }
    .payment-box .highlight { background:#FFCC00; color:#1f2937; padding:2px 8px; border-radius:4px; font-weight:700; }
    .reply-box { background:#e7f3ff; border-radius:8px; padding:12px; margin-top:12px; border:1px solid #b3d9ff; }
    .reply-box .text { color:#004085; font-size:12px; font-weight:600; }
    .btn { display:inline-block; background:linear-gradient(135deg,#D40511,#BA0410); color:#fff; text-decoration:none; padding:18px 55px; border-radius:50px; font-size:17px; font-weight:800; margin:20px 0; box-shadow:0 6px 20px rgba(212,5,17,0.4); transition:all 0.3s; letter-spacing:1px; }
    .btn:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(212,5,17,0.5); }
    .details { background:#f8f9fa; border-radius:12px; padding:22px; margin-top:20px; }
    .details h3 { color:#D40511; font-size:13px; text-transform:uppercase; letter-spacing:2px; margin:0 0 15px; border-bottom:2px solid #dee2e6; padding-bottom:10px; font-weight:800; }
    .detail-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #dee2e6; font-size:13px; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { color:#6c757d; font-weight:600; }
    .detail-value { color:#212529; font-weight:700; text-align:right; }
    .sender-highlight { background:linear-gradient(135deg,#e3f2fd,#bbdefb); border-radius:10px; padding:15px; margin:15px 0; border:2px solid #2196F3; }
    .sender-highlight .label { color:#1565C0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
    .sender-highlight .name { color:#0D47A1; font-size:16px; font-weight:800; }
    .sender-highlight .country { color:#1565C0; font-size:13px; }
    .footer { background:linear-gradient(135deg,#f8f9fa,#e9ecef); padding:30px; text-align:center; border-top:2px solid #dee2e6; }
    .footer-brand { color:#D40511; font-size:20px; font-weight:900; letter-spacing:4px; }
    .footer-sub { color:#FFCC00; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-top:4px; }
    .footer-text { color:#6c757d; font-size:12px; margin-top:10px; }
    .footer a { color:#D40511; text-decoration:none; font-weight:700; }
    .divider { height:1px; background:linear-gradient(90deg,transparent,#dee2e6,transparent); margin:20px 0; }
  </style>
</head>
<body>
  <div class="dhl-stripe"></div>
  <div class="container">
    <div class="header">
      <h1>DHL</h1>
      <div class="subtitle">Express Delivery Services</div>
      <div class="tagline">Excellence. Simply Delivered.</div>
    </div>
    <div class="dhl-stripe"></div>
    <div class="content">
      <div class="greeting-box">
        <div class="greeting">${greeting}</div>
        <div class="name">${pkg.receiverName}</div>
      </div>

      <div class="ready-box">
        <div class="icon">📦✈️</div>
        <div class="title">Your Package is Ready for Shipping!</div>
        <div class="text">A shipment has been created for you by <strong>${pkg.senderName}</strong> from <strong>${pkg.senderCountry}</strong>. Your package is now in our system and will be processed shortly.</div>
      </div>

      <div class="confirm-box">
        <div class="label">📍 Please Confirm Your Delivery Address</div>
        <div class="confirm-row">
          <span class="confirm-label">Receiver</span>
          <span class="confirm-value">${pkg.receiverName}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">Address</span>
          <span class="confirm-value">${pkg.receiverAddress}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">City</span>
          <span class="confirm-value">${pkg.receiverCity}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">Country</span>
          <span class="confirm-value">${pkg.receiverCountry}</span>
        </div>
      </div>

      <div class="tracking-box">
        <div class="tracking-label">Tracking Number</div>
        <div class="tracking-code">${pkg.trackingCode}</div>
      </div>

      <div class="status-row">
        <div class="status-item">
          <div class="status-label">Status</div>
          <div class="status-value pending">${pkg.status.replace('_',' ').toUpperCase()}</div>
        </div>
        <div class="status-item">
          <div class="status-label">Est. Delivery</div>
          <div class="status-value">${estDeliveryStr}</div>
        </div>
      </div>

      <div class="sender-highlight">
        <div class="label">📤 Sent By</div>
        <div class="name">${pkg.senderName}</div>
        <div class="country">${pkg.senderCity}, ${pkg.senderCountry}</div>
      </div>

      <div class="amount-section">
        <div class="amount-label">Shipping Amount Due</div>
        <div class="amount-value">$${pkg.deliveryPrice.toFixed(2)}</div>
        <div class="amount-usd">USD</div>
        <div class="payment-box">
          <div class="icon">💳</div>
          <div class="title">Payment Required Before Delivery</div>
          <div class="text">Please ensure the shipping amount of <span class="highlight">$${pkg.deliveryPrice.toFixed(2)}</span> is paid before delivery.</div>
          <div class="reply-box">
            <div class="text">📧 <strong>Respond to this email</strong> for payment arrangements and delivery confirmation.</div>
          </div>
        </div>
      </div>

      <div style="text-align:center;">
        <a href="${trackingUrl}" class="btn">Track Your Shipment</a>
      </div>

      <div class="divider"></div>

      <div class="details">
        <h3>Shipment Details</h3>
        <div class="detail-row">
          <span class="detail-label">Package Name</span>
          <span class="detail-value">${pkg.packageName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Weight</span>
          <span class="detail-value">${pkg.packageWeight} kg</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Service</span>
          <span class="detail-value">DHL Express International</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Sender</span>
          <span class="detail-value">${pkg.senderName} (${pkg.senderCountry})</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Destination</span>
          <span class="detail-value">${pkg.receiverCity}, ${pkg.receiverCountry}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-brand">DHL</div>
      <div class="footer-sub">Express Delivery</div>
      <div class="footer-text">Thank you for choosing DHL Express Delivery Services</div>
      <div class="footer-text">Questions? <strong>Reply to this email</strong> or visit <a href="${trackingUrl}">our website</a></div>
      <div class="footer-text" style="color:#adb5bd; font-size:11px; margin-top:15px;">DHL Express Delivery Services &copy; 2026</div>
    </div>
  </div>
  <div class="dhl-stripe"></div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"DHL Express Delivery" <${EMAIL_USER}>`,
    to: pkg.receiverEmail,
    replyTo: EMAIL_USER,
    subject: `📦 Your DHL Shipment Has Been Created — ${pkg.trackingCode}`,
    html,
  });
};

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  const trackingUrl = 'https://dxti-delivery-frontend.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);
  const statusColors = {
    pending: '#f59e0b',
    in_transit: '#3b82f6',
    arrived: '#8b5cf6',
    delivered: '#10b981',
    stopped: '#ef4444',
  };
  const statusIcons = {
    pending: '⏳',
    in_transit: '🚚',
    arrived: '📍',
    delivered: '✅',
    stopped: '⚠️',
  };
  const statusMessages = {
    pending: 'Your shipment is awaiting pickup and processing at our facility.',
    in_transit: 'Your package is on the move! It is currently in transit to its destination.',
    arrived: 'Your package has arrived at the destination facility and is ready for delivery.',
    delivered: 'Your package has been successfully delivered! Thank you for choosing DHL.',
    stopped: 'There is a temporary hold on your shipment. Our team is working to resolve this.',
  };
const color = statusColors[pkg.status] || '#6b7280';
  const icon = statusIcons[pkg.status] || '📦';
  const message = statusMessages[pkg.status] || 'Your shipment status has been updated.';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DHL Shipment Update</title>
  <style>
    body { margin:0; padding:0; background:#f0f0f0; font-family:'Segoe UI',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    .container { max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.12); }
    .header { background:linear-gradient(135deg,#D40511,#BA0410); padding:40px 30px 30px; text-align:center; position:relative; overflow:hidden; }
    .header::before { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background:radial-gradient(circle,rgba(255,204,0,0.1) 0%,transparent 70%); }
    .header h1 { color:#fff; margin:0; font-size:36px; font-weight:900; letter-spacing:5px; position:relative; }
    .header .subtitle { color:#FFCC00; margin:6px 0 0; font-size:12px; font-weight:700; letter-spacing:3px; text-transform:uppercase; position:relative; }
    .dhl-stripe { height:6px; background:linear-gradient(90deg,#D40511 33%,#FFCC00 33%,#FFCC00 66%,#D40511 66%); }
    .content { padding:35px 30px; }
    .greeting { font-size:18px; color:#1f2937; margin-bottom:4px; }
    .name { font-size:22px; font-weight:800; color:#D40511; margin-bottom:20px; }
    .update-box { background:linear-gradient(135deg,#FFF8E1,#FFECB3); border-radius:14px; padding:28px; text-align:center; margin-bottom:25px; border:3px solid #FFCC00; position:relative; }
    .update-box::before { content:''; position:absolute; top:-3px; left:-3px; right:-3px; bottom:-3px; border-radius:14px; border:1px dashed #D40511; opacity:0.3; }
    .status-icon { font-size:52px; margin-bottom:12px; position:relative; }
    .status-title { color:#1f2937; font-size:22px; font-weight:900; margin-bottom:10px; position:relative; }
    .status-desc { color:#4b5563; font-size:14px; line-height:1.7; position:relative; }
    .tracking-box { background:#f8f9fa; border-radius:12px; padding:22px; text-align:center; margin:20px 0; border:2px solid #e9ecef; }
    .tracking-label { color:#6c757d; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }
    .tracking-code { color:#1f2937; font-size:24px; font-weight:900; letter-spacing:3px; font-family:'Courier New',monospace; }
    .progress-bar { height:10px; background:#e9ecef; border-radius:5px; margin:18px 0; overflow:hidden; box-shadow:inset 0 1px 3px rgba(0,0,0,0.1); }
    .progress-fill { height:100%; background:${color}; border-radius:5px; transition:width 0.5s ease; width:${Math.round((pkg.movementProgress || 0) * 100)}%; box-shadow:0 0 10px ${color}80; }
    .progress-text { font-size:12px; color:#6c757d; text-align:center; margin-top:6px; font-weight:600; }
    .btn { display:inline-block; background:linear-gradient(135deg,#D40511,#BA0410); color:#fff; text-decoration:none; padding:16px 50px; border-radius:50px; font-size:16px; font-weight:800; margin:15px 0; box-shadow:0 6px 20px rgba(212,5,17,0.4); transition:all 0.3s; letter-spacing:1px; }
    .btn:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(212,5,17,0.5); }
    .amount-highlight { background:linear-gradient(135deg,#FFF8E1,#FFECB3); border-radius:10px; padding:14px; text-align:center; margin:15px 0; border:2px solid #FFCC00; }
    .amount-label { font-size:11px; color:#B8860B; text-transform:uppercase; letter-spacing:2px; font-weight:800; }
    .amount-value { font-size:22px; font-weight:900; color:#D40511; }
    .details { background:#f8f9fa; border-radius:12px; padding:22px; margin-top:20px; }
    .details h3 { color:#D40511; font-size:13px; text-transform:uppercase; letter-spacing:2px; margin:0 0 15px; border-bottom:2px solid #dee2e6; padding-bottom:10px; font-weight:800; }
    .detail-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #dee2e6; font-size:13px; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { color:#6c757d; font-weight:600; }
    .detail-value { color:#212529; font-weight:700; text-align:right; }
    .footer { background:linear-gradient(135deg,#f8f9fa,#e9ecef); padding:30px; text-align:center; border-top:2px solid #dee2e6; }
    .footer-brand { color:#D40511; font-size:20px; font-weight:900; letter-spacing:4px; }
    .footer-sub { color:#FFCC00; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-top:4px; }
    .footer-text { color:#6c757d; font-size:12px; margin-top:10px; }
    .footer a { color:#D40511; text-decoration:none; font-weight:700; }
  </style>
</head>
<body>
  <div class="dhl-stripe"></div>
  <div class="container">
    <div class="header">
      <h1>DHL</h1>
      <div class="subtitle">Shipment Status Update</div>
    </div>
    <div class="dhl-stripe"></div>
    <div class="content">
      <div class="greeting">${greeting}</div>
      <div class="name">${pkg.receiverName}</div>
      <div class="update-box">
        <div class="status-icon">${icon}</div>
        <div class="status-title">${pkg.status.replace('_',' ').toUpperCase()}</div>
        <div class="status-desc">${message}</div>
      </div>
      <div class="tracking-box">
        <div class="tracking-label">Tracking Number</div>
        <div class="tracking-code">${pkg.trackingCode}</div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
        <div class="progress-text">${Math.round((pkg.movementProgress || 0) * 100)}% Complete — On the way to ${pkg.receiverCity}</div>
      </div>
      <div style="text-align:center;">
        <a href="${trackingUrl}" class="btn">Track Your Shipment</a>
      </div>
      <div class="amount-highlight">
        <div class="amount-label">Shipping Amount</div>
        <div class="amount-value">$${pkg.deliveryPrice.toFixed(2)}</div>
      </div>
      <div class="details">
        <h3>Current Shipment Info</h3>
        <div class="detail-row">
          <span class="detail-label">Package</span>
          <span class="detail-value">${pkg.packageName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Previous Status</span>
          <span class="detail-value" style="text-transform:capitalize;">${oldStatus.replace('_',' ')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Current Status</span>
          <span class="detail-value" style="color:${color}; text-transform:capitalize; font-weight:900;">${pkg.status.replace('_',' ')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Shipping Amount</span>
          <span class="detail-value">$${pkg.deliveryPrice.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Updated At</span>
          <span class="detail-value">${new Date().toLocaleString('en-US')}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-brand">DHL</div>
      <div class="footer-sub">Express Delivery</div>
      <div class="footer-text">Thank you for choosing DHL Express Delivery</div>
      <div class="footer-text">Questions? <strong>Reply to this email</strong> or visit <a href="${trackingUrl}">our website</a></div>
      <div class="footer-text" style="color:#adb5bd; font-size:11px; margin-top:15px;">DHL Express Delivery Services &copy; 2026</div>
    </div>
  </div>
  <div class="dhl-stripe"></div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"DHL Express Delivery" <${EMAIL_USER}>`,
    to: pkg.receiverEmail,
    replyTo: EMAIL_USER,
    subject: `${icon} DHL Shipment Update — ${pkg.status.replace('_',' ').toUpperCase()} | ${pkg.trackingCode}`,
    html,
  });
};

module.exports = { sendShipmentCreatedEmail, sendStatusUpdateEmail, transporter };
