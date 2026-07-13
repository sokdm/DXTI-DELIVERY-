const axios = require('axios');

// ─── Config ─────────────────────────────────────────────────────────────────

const EMAIL_FROM      = process.env.EMAIL_FROM      || 'dhld5736@gmail.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'DHL Express Delivery';
const REPLY_TO_EMAIL  = 'dhld5736@gmail.com';
const SUPPORT_EMAIL   = process.env.SUPPORT_EMAIL    || 'dhld5736@gmail.com';
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER  || '+1 (555) 123-4567';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS  || 'DHL Express, 123 Logistics Way, New York, NY 10001';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// ─── Helpers ────────────────────────────────────────────────────────────────

const getGreeting = (gender, name) => {
  const hour = new Date().getHours();
  let timeGreeting = 'Good day';
  if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
  else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17 && hour < 21) timeGreeting = 'Good evening';
  else timeGreeting = 'Good night';

  const title = gender === 'female' ? 'Madam' : gender === 'male' ? 'Sir' : 'Sir/Madam';
  return { full: `${timeGreeting}, ${title} ${name || ''}`.trim(), time: timeGreeting, title };
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getStatusMeta = (status) => {
  const map = {
    pending:     { icon: '⏳', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', label: 'Pending Pickup', desc: 'Your shipment is awaiting pickup from the sender.' },
    in_transit:  { icon: '🚚', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', label: 'In Transit', desc: 'Your package is on the move and heading to its destination!' },
    arrived:     { icon: '📍', color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', label: 'Arrived at Facility', desc: 'Your package has arrived at the destination facility.' },
    delivered:   { icon: '✅', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', label: 'Delivered', desc: 'Your package has been successfully delivered!' },
    stopped:     { icon: '⚠️', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', label: 'On Hold', desc: 'There is a temporary hold on your shipment. Contact support.' },
    cancelled:   { icon: '🚫', color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', label: 'Cancelled', desc: 'This shipment has been cancelled.' },
  };
  return map[status] || { icon: '📦', color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', label: status?.replace(/_/g, ' ').toUpperCase() || 'Updated', desc: 'Your shipment status has been updated.' };
};

const getEstimatedDelivery = (pkg) => {
  if (pkg.estimatedDeliveryDate) return formatDate(pkg.estimatedDeliveryDate);
  const created = new Date(pkg.createdAt || Date.now());
  const est = new Date(created);
  est.setDate(est.getDate() + 5);
  return formatDate(est);
};

// ─── Core Send Function (SendGrid) ────────────────────────────────────────

const sendEmail = async (to, subject, html, options = {}) => {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️  SENDGRID_API_KEY not set in environment. Skipping email to:', to);
    return { skipped: true, reason: 'SENDGRID_API_KEY missing' };
  }

  const payload = {
    personalizations: [{
      to: [{ email: to }],
      ...(options.cc && { cc: options.cc.map(e => ({ email: e })) }),
      ...(options.bcc && { bcc: options.bcc.map(e => ({ email: e })) }),
    }],
    from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
    reply_to: { email: REPLY_TO_EMAIL, name: 'DHL Support Team' },
    subject,
    content: [{ type: 'text/html', value: html }],
    ...(options.attachments && {
      attachments: options.attachments.map(att => ({
        content: att.content,
        filename: att.filename,
        type: att.type || 'application/pdf',
        disposition: 'attachment'
      }))
    }),
    tracking_settings: {
      click_tracking: { enable: true },
      open_tracking: { enable: true },
    },
  };

  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    console.log('✅  Email sent to', to, '| Subject:', subject, '| Status:', response.status);
    return { success: true, status: response.status };
  } catch (error) {
    const errData = error.response?.data?.errors || error.response?.data || error.message;
    console.error('❌  SendGrid error:', JSON.stringify(errData, null, 2));
    throw new Error(`Email failed: ${Array.isArray(errData) ? errData.map(e => e.message).join('; ') : errData}`);
  }
};

// ─── Shared Email Components ───────────────────────────────────────────────

const emailHead = (title) => `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>`;

const emailStyles = () => `
<style>
  body { margin:0; padding:0; background:#f3f4f6; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; -webkit-font-smoothing:antialiased; }
  .wrapper { width:100%; background:#f3f4f6; padding:20px 0; }
  .container { max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,#D40511 0%,#9B0000 100%); padding:48px 32px 36px; text-align:center; position:relative; }
  .header::after { content:''; position:absolute; bottom:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#D40511 33%,#FFCC00 33%,#FFCC00 66%,#D40511 66%); }
  .header h1 { color:#fff; margin:0; font-size:44px; font-weight:900; letter-spacing:8px; text-shadow:0 2px 4px rgba(0,0,0,0.2); }
  .header .subtitle { color:#FFCC00; margin:10px 0 0; font-size:12px; font-weight:700; letter-spacing:5px; text-transform:uppercase; }
  .content { padding:36px 32px; }
  .greeting-box { background:linear-gradient(135deg,#f8fafc,#f1f5f9); border-radius:16px; padding:24px; margin-bottom:28px; border-left:5px solid #D40511; }
  .greeting { font-size:18px; color:#475569; font-weight:600; }
  .name { font-size:28px; font-weight:800; color:#D40511; margin-top:4px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
  .info-card { background:#f8fafc; border-radius:12px; padding:18px; border:1px solid #e2e8f0; }
  .info-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px; }
  .info-value { font-size:15px; font-weight:700; color:#1e293b; }
  .tracking-box { background:linear-gradient(135deg,#FFFBEB,#FEF3C7); border-radius:16px; padding:32px; text-align:center; margin-bottom:24px; border:3px dashed #F59E0B; position:relative; }
  .tracking-box::before { content:'📦'; font-size:28px; position:absolute; top:-16px; left:50%; transform:translateX(-50%); background:#fff; padding:0 12px; border-radius:50%; }
  .tracking-label { color:#B45309; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:4px; margin-bottom:8px; }
  .tracking-code { color:#1e293b; font-size:30px; font-weight:900; letter-spacing:5px; font-family:'SF Mono',monospace; word-break:break-all; }
  .amount-box { text-align:center; margin:24px 0; padding:24px; background:linear-gradient(135deg,#FEF2F2,#FEE2E2); border-radius:16px; border:2px solid #FECACA; }
  .amount-value { font-size:40px; font-weight:900; color:#DC2626; }
  .amount-label { color:#991B1B; font-size:13px; font-weight:700; margin-top:6px; }
  .status-box { border-radius:16px; padding:28px; text-align:center; margin-bottom:24px; border:3px solid; }
  .status-icon { font-size:56px; margin-bottom:12px; display:block; }
  .status-title { font-size:24px; font-weight:900; margin-bottom:8px; }
  .status-desc { font-size:14px; font-weight:500; max-width:400px; margin:0 auto; line-height:1.6; }
  .btn { display:inline-block; background:linear-gradient(135deg,#D40511,#9B0000); color:#fff !important; text-decoration:none; padding:18px 56px; border-radius:50px; font-size:16px; font-weight:800; margin:20px 0; box-shadow:0 4px 16px rgba(212,5,17,0.3); transition:transform 0.2s; }
  .btn:hover { transform:translateY(-2px); }
  .divider { height:1px; background:linear-gradient(90deg,transparent,#e2e8f0,transparent); margin:28px 0; }
  .contact-section { background:#f8fafc; border-radius:16px; padding:24px; margin-top:24px; border:1px solid #e2e8f0; }
  .contact-title { font-size:14px; font-weight:800; color:#1e293b; text-align:center; margin-bottom:16px; letter-spacing:1px; }
  .contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .contact-item { display:flex; align-items:center; gap:10px; padding:12px; background:#fff; border-radius:10px; border:1px solid #e2e8f0; }
  .contact-icon { font-size:20px; }
  .contact-text { font-size:13px; color:#475569; font-weight:600; }
  .contact-text a { color:#D40511; text-decoration:none; font-weight:700; }
  .warning-box { background:linear-gradient(135deg,#FEF3C7,#FDE68A); border-radius:12px; padding:16px; margin:20px 0; border-left:4px solid #F59E0B; }
  .warning-text { color:#92400E; font-size:13px; font-weight:600; line-height:1.6; }
  .footer { background:#0f172a; padding:36px 32px; text-align:center; }
  .footer-brand { color:#FFCC00; font-size:22px; font-weight:900; letter-spacing:5px; }
  .footer-sub { color:#94a3b8; font-size:12px; margin-top:6px; letter-spacing:2px; text-transform:uppercase; }
  .footer-divider { height:1px; background:#334155; margin:20px 0; }
  .footer-address { color:#64748b; font-size:12px; line-height:1.8; }
  .footer-links { margin-top:16px; }
  .footer-links a { color:#94a3b8; text-decoration:none; font-size:12px; margin:0 12px; }
  .footer-links a:hover { color:#FFCC00; }
  .copyright { color:#475569; font-size:11px; margin-top:20px; }
  @media (max-width:480px) {
    .info-grid, .contact-grid { grid-template-columns:1fr !important; }
    .header h1 { font-size:32px; letter-spacing:4px; }
    .tracking-code { font-size:22px; letter-spacing:2px; }
    .amount-value { font-size:28px; }
    .content { padding:24px 20px; }
  }
</style>`;

const emailFooter = () => `
<div class="footer">
  <div class="footer-brand">DHL</div>
  <div class="footer-sub">Express Delivery Services</div>
  <div class="footer-divider"></div>
  <div class="footer-address">
    ${COMPANY_ADDRESS}<br>
    📧 <a href="mailto:${SUPPORT_EMAIL}" style="color:#94a3b8;">${SUPPORT_EMAIL}</a><br>
    📱 <a href="https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,'')}" style="color:#94a3b8;">${WHATSAPP_NUMBER}</a>
  </div>
  <div class="footer-links">
    <a href="#">Privacy Policy</a>
    <a href="#">Terms of Service</a>
    <a href="#">Track Shipment</a>
  </div>
  <div class="copyright">
    © ${new Date().getFullYear()} DHL Express Delivery Services. All rights reserved.<br>
    <span style="color:#64748b;">This is an automated message. Replies go to: <a href="mailto:${REPLY_TO_EMAIL}" style="color:#FFCC00;">${REPLY_TO_EMAIL}</a></span>
  </div>
</div>`;

const contactSection = () => `
<div class="contact-section">
  <div class="contact-title">📞 NEED HELP? CONTACT US</div>
  <div class="contact-grid">
    <div class="contact-item">
      <span class="contact-icon">📧</span>
      <div class="contact-text">
        <div style="font-size:11px;color:#94a3b8;">Email Support</div>
        <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </div>
    </div>
    <div class="contact-item">
      <span class="contact-icon">💬</span>
      <div class="contact-text">
        <div style="font-size:11px;color:#94a3b8;">WhatsApp</div>
        <a href="https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,'')}">${WHATSAPP_NUMBER}</a>
      </div>
    </div>
    <div class="contact-item">
      <span class="contact-icon">🌐</span>
      <div class="contact-text">
        <div style="font-size:11px;color:#94a3b8;">Live Chat</div>
        <a href="#">Start Chat</a>
      </div>
    </div>
    <div class="contact-item">
      <span class="contact-icon">📍</span>
      <div class="contact-text">
        <div style="font-size:11px;color:#94a3b8;">Visit Us</div>
        <span style="color:#475569;">${COMPANY_ADDRESS.split(',')[0]}</span>
      </div>
    </div>
  </div>
</div>`;

// ─── Email: Shipment Created ────────────────────────────────────────────────

const sendShipmentCreatedEmail = async (pkg) => {
  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${emailHead('Your DHL Shipment Has Been Created')}${emailStyles()}</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <h1>DHL</h1>
      <div class="subtitle">Express Delivery Services</div>
    </div>
    <div class="content">
      <div class="greeting-box">
        <div class="greeting">${greeting.full}</div>
        <div class="name">${pkg.receiverName}</div>
      </div>

      <div style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5); border-radius:16px; padding:20px; margin-bottom:24px; border:2px solid #6EE7B7; text-align:center;">
        <div style="font-size:20px; margin-bottom:6px;">🎉</div>
        <div style="color:#065F46; font-size:16px; font-weight:800;">Your Package is Ready for Shipping!</div>
        <div style="color:#047857; font-size:13px; margin-top:6px;">Sent by <strong>${pkg.senderName}</strong> from <strong>${pkg.senderCountry || 'Unknown'}</strong></div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Sender</div>
          <div class="info-value">${pkg.senderName}</div>
        </div>
        <div class="info-card">
          <div class="info-label">From</div>
          <div class="info-value">${pkg.senderCountry || 'N/A'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Destination</div>
          <div class="info-value">${pkg.receiverCountry || pkg.receiverAddress || 'N/A'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Est. Delivery</div>
          <div class="info-value">${getEstimatedDelivery(pkg)}</div>
        </div>
      </div>

      <div class="tracking-box">
        <div class="tracking-label">Tracking Number</div>
        <div class="tracking-code">${pkg.trackingCode}</div>
      </div>

      <div class="amount-box">
        <div class="amount-value">${formatCurrency(pkg.deliveryPrice)}</div>
        <div class="amount-label">Shipping Amount Due</div>
      </div>

      <div style="text-align:center;">
        <a href="${trackingUrl}/track/${pkg.trackingCode}" class="btn">🔍 Track Your Shipment</a>
      </div>

      <div class="warning-box">
        <div class="warning-text">
          <strong>💳 Payment Required:</strong> Please contact our support team to arrange payment and confirm delivery details. Your package will not be dispatched until payment is received.
        </div>
      </div>

      ${contactSection()}

      <div class="divider"></div>

      <div style="text-align:center; color:#64748b; font-size:12px; line-height:1.8;">
        <strong>Shipment Created:</strong> ${formatDate(pkg.createdAt)}<br>
        <strong>Package Type:</strong> ${pkg.packageType || 'Standard'}<br>
        <strong>Weight:</strong> ${pkg.weight ? pkg.weight + ' kg' : 'N/A'}
      </div>
    </div>
    ${emailFooter()}
  </div>
</div>
</body>
</html>`;

  return await sendEmail(
    pkg.receiverEmail,
    `📦 Your DHL Shipment Created — ${pkg.trackingCode}`,
    html
  );
};

// ─── Email: Status Update ───────────────────────────────────────────────────
const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const meta = getStatusMeta(pkg.status);
  const oldMeta = getStatusMeta(oldStatus);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${emailHead('DHL Shipment Status Update')}${emailStyles()}</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <h1>DHL</h1>
      <div class="subtitle">Express Delivery Services</div>
    </div>
    <div class="content">
      <div class="greeting-box">
        <div class="greeting">${greeting.full}</div>
      </div>

      <div class="status-box" style="background:${meta.bg}; border-color:${meta.border};">
        <span class="status-icon">${meta.icon}</span>
        <div class="status-title" style="color:${meta.color};">${meta.label}</div>
        <div class="status-desc" style="color:${meta.color}cc;">${meta.desc}</div>
      </div>

      <div style="text-align:center; margin:20px 0;">
        <div style="color:#94a3b8; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:3px;">Tracking Number</div>
        <div class="tracking-code" style="font-size:26px; margin-top:8px;">${pkg.trackingCode}</div>
      </div>

      <div style="background:#f8fafc; border-radius:12px; padding:20px; margin:20px 0; border:1px solid #e2e8f0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="color:#94a3b8; font-size:12px; font-weight:700;">PREVIOUS STATUS</span>
          <span style="color:#94a3b8; font-size:12px; font-weight:700;">CURRENT STATUS</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#64748b; font-size:14px; font-weight:600;">${oldMeta.icon} ${oldMeta.label}</span>
          <span style="font-size:20px;">→</span>
          <span style="color:${meta.color}; font-size:14px; font-weight:800;">${meta.icon} ${meta.label}</span>
        </div>
        <div style="text-align:center; margin-top:12px; color:#94a3b8; font-size:12px;">
          Updated: ${formatDate(new Date())}
        </div>
      </div>

      <div style="text-align:center;">
        <a href="${trackingUrl}/track/${pkg.trackingCode}" class="btn">🔍 Track Your Shipment</a>
      </div>

      ${pkg.status === 'stopped' ? `
      <div class="warning-box" style="background:linear-gradient(135deg,#FEF2F2,#FECACA); border-color:#EF4444;">
        <div class="warning-text" style="color:#991B1B;">
          <strong>⚠️ Action Required:</strong> Your shipment is currently on hold. Please contact our support team immediately to resolve this issue and prevent delivery delays.
        </div>
      </div>
      ` : ''}

      ${pkg.status === 'delivered' ? `
      <div style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5); border-radius:12px; padding:20px; margin:20px 0; border:2px solid #6EE7B7; text-align:center;">
        <div style="font-size:32px; margin-bottom:8px;">🎉</div>
        <div style="color:#065F46; font-size:16px; font-weight:800;">Delivery Complete!</div>
        <div style="color:#047857; font-size:13px; margin-top:6px;">Thank you for choosing DHL Express Delivery.</div>
      </div>
      ` : ''}

      ${contactSection()}

      <div class="divider"></div>

      <div style="text-align:center; color:#64748b; font-size:12px; line-height:1.8;">
        <strong>Receiver:</strong> ${pkg.receiverName}<br>
        <strong>Destination:</strong> ${pkg.receiverCountry || pkg.receiverAddress || 'N/A'}<br>
        <strong>Estimated Delivery:</strong> ${getEstimatedDelivery(pkg)}
      </div>
    </div>
    ${emailFooter()}
  </div>
</div>
</body>
</html>`;

  return await sendEmail(
    pkg.receiverEmail,
    `${meta.icon} DHL Update: ${meta.label} — ${pkg.trackingCode}`,
    html
  );
};

// ─── Email: Payment Reminder ─────────────────────────────────────────────────

const sendPaymentReminderEmail = async (pkg) => {
  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${emailHead('Payment Reminder — DHL Shipment')}${emailStyles()}</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <h1>DHL</h1>
      <div class="subtitle">Express Delivery Services</div>
    </div>
    <div class="content">
      <div class="greeting-box" style="border-left-color:#F59E0B;">
        <div class="greeting">${greeting.full}</div>
        <div class="name">${pkg.receiverName}</div>
      </div>

      <div style="background:linear-gradient(135deg,#FEF3C7,#FDE68A); border-radius:16px; padding:24px; margin-bottom:24px; border:2px solid #F59E0B; text-align:center;">
        <div style="font-size:36px; margin-bottom:8px;">💳</div>
        <div style="color:#92400E; font-size:18px; font-weight:800;">Payment Reminder</div>
        <div style="color:#B45309; font-size:13px; margin-top:6px;">Your shipment is awaiting payment confirmation</div>
      </div>

      <div class="tracking-box">
        <div class="tracking-label">Tracking Number</div>
        <div class="tracking-code">${pkg.trackingCode}</div>
      </div>

      <div class="amount-box">
        <div class="amount-value">${formatCurrency(pkg.deliveryPrice)}</div>
        <div class="amount-label">Amount Due</div>
      </div>

      <div style="background:#f8fafc; border-radius:12px; padding:20px; margin:20px 0; border:1px solid #e2e8f0;">
        <div style="color:#1e293b; font-size:14px; font-weight:700; margin-bottom:12px;">Payment Instructions:</div>
        <ol style="color:#475569; font-size:13px; line-height:2; margin:0; padding-left:20px;">
          <li>Contact our support team via email or WhatsApp</li>
          <li>Provide your tracking number: <strong>${pkg.trackingCode}</strong></li>
          <li>Our team will guide you through the secure payment process</li>
          <li>Receive instant payment confirmation</li>
        </ol>
      </div>

      <div style="text-align:center;">
        <a href="${trackingUrl}/track/${pkg.trackingCode}" class="btn">📦 Track Shipment</a>
      </div>

      <div class="warning-box">
        <div class="warning-text">
          <strong>⏰ Important:</strong> Failure to complete payment within 7 days may result in shipment cancellation and return to sender.
        </div>
      </div>

      ${contactSection()}

      <div class="divider"></div>

      <div style="text-align:center; color:#64748b; font-size:12px;">
        <strong>Shipment Created:</strong> ${formatDate(pkg.createdAt)}<br>
        <strong>Days Elapsed:</strong> ${Math.floor((Date.now() - new Date(pkg.createdAt)) / 86400000)} days
      </div>
    </div>
    ${emailFooter()}
  </div>
</div>
</body>
</html>`;

  return await sendEmail(
    pkg.receiverEmail,
    `💳 Payment Reminder — ${pkg.trackingCode}`,
    html
  );
};

// ─── Export ─────────────────────────────────────────────────────────────────

module.exports = {
  sendShipmentCreatedEmail,
  sendStatusUpdateEmail,
  sendPaymentReminderEmail,
  sendEmail,
};
