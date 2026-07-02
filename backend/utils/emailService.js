const { Resend } = require('resend');

const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

let resend;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

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
  if (!resend) {
    console.log('⚠️ RESEND_API_KEY not set, skipping email');
    return;
  }

  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your DHL Shipment Has Been Created</title>
  <style>
    body { margin:0; padding:0; background:#f0f0f0; font-family:'Segoe UI',Arial,sans-serif; }
    .container { max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.12); }
    .header { background:linear-gradient(135deg,#D40511,#BA0410); padding:45px 30px 35px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:42px; font-weight:900; letter-spacing:6px; }
    .header .subtitle { color:#FFCC00; margin:8px 0 0; font-size:13px; font-weight:700; letter-spacing:4px; text-transform:uppercase; }
    .dhl-stripe { height:6px; background:linear-gradient(90deg,#D40511 33%,#FFCC00 33%,#FFCC00 66%,#D40511 66%); }
    .content { padding:35px 30px; }
    .greeting-box { background:linear-gradient(135deg,#f8f9fa,#e9ecef); border-radius:12px; padding:20px; margin-bottom:25px; border-left:4px solid #D40511; }
    .greeting { font-size:20px; color:#1f2937; font-weight:700; }
    .name { font-size:26px; font-weight:800; color:#D40511; }
    .ready-box { background:linear-gradient(135deg,#d4edda,#c3e6cb); border-radius:12px; padding:18px; margin-bottom:25px; border:2px solid #28a745; text-align:center; }
    .ready-box .title { color:#155724; font-size:16px; font-weight:800; }
    .ready-box .text { color:#155724; font-size:13px; }
    .tracking-box { background:linear-gradient(135deg,#FFF8E1,#FFECB3); border-radius:14px; padding:28px; text-align:center; margin-bottom:25px; border:3px dashed #FFCC00; }
    .tracking-label { color:#B8860B; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:3px; }
    .tracking-code { color:#1f2937; font-size:32px; font-weight:900; letter-spacing:4px; font-family:'Courier New',monospace; }
    .amount-value { font-size:36px; font-weight:900; color:#D40511; }
    .btn { display:inline-block; background:linear-gradient(135deg,#D40511,#BA0410); color:#fff; text-decoration:none; padding:18px 55px; border-radius:50px; font-size:17px; font-weight:800; margin:20px 0; }
    .footer { background:#f8f9fa; padding:30px; text-align:center; border-top:2px solid #dee2e6; }
    .footer-brand { color:#D40511; font-size:20px; font-weight:900; letter-spacing:4px; }
  </style>
</head>
<body>
  <div class="dhl-stripe"></div>
  <div class="container">
    <div class="header">
      <h1>DHL</h1>
      <div class="subtitle">Express Delivery Services</div>
    </div>
    <div class="dhl-stripe"></div>
    <div class="content">
      <div class="greeting-box">
        <div class="greeting">${greeting}</div>
        <div class="name">${pkg.receiverName}</div>
      </div>
      <div class="ready-box">
        <div class="title">Your Package is Ready for Shipping!</div>
        <div class="text">Sent by <strong>${pkg.senderName}</strong> from <strong>${pkg.senderCountry}</strong></div>
      </div>
      <div class="tracking-box">
        <div class="tracking-label">Tracking Number</div>
        <div class="tracking-code">${pkg.trackingCode}</div>
      </div>
      <div style="text-align:center;">
        <div class="amount-value">$${pkg.deliveryPrice.toFixed(2)}</div>
        <p style="color:#B8860B; font-size:14px;">Shipping Amount Due</p>
      </div>
      <div style="text-align:center;">
        <a href="${trackingUrl}/track/${pkg.trackingCode}" class="btn">Track Your Shipment</a>
      </div>
    </div>
    <div class="footer">
      <div class="footer-brand">DHL</div>
      <div class="footer-sub">Express Delivery</div>
      <p style="color:#6c757d; font-size:12px;">DHL Express Delivery Services &copy; 2026</p>
    </div>
  </div>
  <div class="dhl-stripe"></div>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `DHL Express <${EMAIL_FROM}>`,
      to: [pkg.receiverEmail],
      subject: `📦 Your DHL Shipment Has Been Created — ${pkg.trackingCode}`,
      html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }
    console.log('✅ Shipment email sent to', pkg.receiverEmail, 'ID:', data.id);
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    throw err;
  }
};

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  if (!resend) {
    console.log('⚠️ RESEND_API_KEY not set, skipping status email');
    return;
  }

  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);
  const statusIcons = {
    pending: '⏳', in_transit: '🚚', arrived: '📍', delivered: '✅', stopped: '⚠️',
  };
  const statusMessages = {
    pending: 'Your shipment is awaiting pickup.',
    in_transit: 'Your package is on the move!',
    arrived: 'Your package has arrived at the destination facility.',
    delivered: 'Your package has been successfully delivered!',
    stopped: 'There is a temporary hold on your shipment.',
  };

  const icon = statusIcons[pkg.status] || '📦';
  const message = statusMessages[pkg.status] || 'Your shipment status has been updated.';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DHL Shipment Update</title>
  <style>
    body { margin:0; padding:0; background:#f0f0f0; font-family:'Segoe UI',Arial,sans-serif; }
    .container { max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; }
    .header { background:linear-gradient(135deg,#D40511,#BA0410); padding:40px 30px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:36px; font-weight:900; letter-spacing:5px; }
    .content { padding:35px 30px; }
    .update-box { background:linear-gradient(135deg,#FFF8E1,#FFECB3); border-radius:14px; padding:28px; text-align:center; margin-bottom:25px; border:3px solid #FFCC00; }
    .status-icon { font-size:52px; margin-bottom:12px; }
    .status-title { color:#1f2937; font-size:22px; font-weight:900; }
    .tracking-code { color:#1f2937; font-size:24px; font-weight:900; letter-spacing:3px; font-family:'Courier New',monospace; }
    .btn { display:inline-block; background:linear-gradient(135deg,#D40511,#BA0410); color:#fff; text-decoration:none; padding:16px 50px; border-radius:50px; font-size:16px; font-weight:800; margin:15px 0; }
    .footer { background:#f8f9fa; padding:30px; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>DHL</h1></div>
    <div class="content">
      <div class="greeting">${greeting}</div>
      <div style="font-size:22px; font-weight:800; color:#D40511; margin-bottom:20px;">${pkg.receiverName}</div>
      <div class="update-box">
        <div class="status-icon">${icon}</div>
        <div class="status-title">${pkg.status.replace('_',' ').toUpperCase()}</div>
        <p style="color:#4b5563; font-size:14px;">${message}</p>
      </div>
      <div style="text-align:center;">
        <div class="tracking-label">Tracking Number</div>
        <div class="tracking-code">${pkg.trackingCode}</div>
      </div>
      <div style="text-align:center;">
        <a href="${trackingUrl}/track/${pkg.trackingCode}" class="btn">Track Your Shipment</a>
      </div>
    </div>
    <div class="footer">
      <div style="color:#D40511; font-size:20px; font-weight:900;">DHL</div>
      <p style="color:#6c757d; font-size:12px;">DHL Express Delivery Services &copy; 2026</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `DHL Express <${EMAIL_FROM}>`,
      to: [pkg.receiverEmail],
      subject: `${icon} DHL Shipment Update — ${pkg.status.replace('_',' ').toUpperCase()} | ${pkg.trackingCode}`,
      html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }
    console.log('✅ Status update email sent to', pkg.receiverEmail, 'ID:', data.id);
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    throw err;
  }
};

module.exports = { sendShipmentCreatedEmail, sendStatusUpdateEmail };
