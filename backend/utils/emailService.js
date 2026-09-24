const nodemailer = require('nodemailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
const REPLY_TO_EMAIL = 'dhld5736@gmail.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || REPLY_TO_EMAIL;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || SUPPORT_EMAIL;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'DXTI Delivery';
const DHL_LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/DHL_Logo.svg/512px-DHL_Logo.svg.png';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

const formatDate = (date) => {
  if (!date) return 'Not scheduled';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Not scheduled';
  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusLabels = {
  pending: 'Package created',
  received: 'Package received',
  processed: 'Package processed',
  shipped: 'Package shipped',
  in_transit: 'In transit',
  stopped: 'Package on hold',
  arrived: 'Arrived at facility',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

const getStatusLabel = (status) => statusLabels[status] || String(status || 'Status updated').replace(/_/g, ' ');

const getTrackingUrl = (pkg) => `${FRONTEND_URL.replace(/\/$/, '')}/track/${encodeURIComponent(pkg.trackingCode || '')}`;

const mailTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 15000,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const detailRow = (label, value) => `
  <tr>
    <td style="padding:10px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:700;text-align:right;">${escapeHtml(value || 'N/A')}</td>
  </tr>`;

const timelineHtml = (pkg) => {
  const items = Array.isArray(pkg.statusHistory) && pkg.statusHistory.length
    ? pkg.statusHistory
    : [
        { status: 'pending', location: pkg.currentLocation?.locationName, timestamp: pkg.createdAt },
        { status: pkg.status, location: pkg.currentLocation?.locationName, timestamp: pkg.updatedAt || new Date() },
      ];

  return items.slice(-8).reverse().map((event, index) => `
    <tr>
      <td width="26" valign="top" style="padding:0 12px 18px 0;">
        <div style="width:14px;height:14px;border-radius:14px;background:${index === 0 ? '#D40511' : '#FFCC00'};border:3px solid #fff;box-shadow:0 0 0 1px #e5e7eb;"></div>
      </td>
      <td valign="top" style="padding:0 0 18px 0;">
        <div style="font-size:14px;font-weight:800;color:#111827;text-transform:capitalize;">${escapeHtml(getStatusLabel(event.status))}</div>
        <div style="font-size:13px;color:#4b5563;line-height:1.5;">${escapeHtml(event.location || event.description || pkg.currentLocation?.locationName || 'Shipment update')}</div>
        <div style="font-size:12px;color:#9ca3af;margin-top:4px;">${escapeHtml(formatDate(event.timestamp || event.date))}</div>
      </td>
    </tr>`).join('');
};

const renderPackageEmail = ({ pkg, title, intro, customMessage }) => {
  const trackingUrl = getTrackingUrl(pkg);
  const status = getStatusLabel(pkg.status);
  const currentLocation = pkg.currentLocation?.locationName || `${pkg.senderCity || ''}, ${pkg.senderCountry || ''}`.trim();
  const destination = pkg.destinationLocation?.locationName || `${pkg.receiverCity || ''}, ${pkg.receiverCountry || ''}`.trim();

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="height:6px;background:linear-gradient(90deg,#D40511 0 30%,#FFCC00 30% 70%,#D40511 70%);"></td></tr>
        <tr>
          <td style="background:#FFCC00;padding:18px 28px;">
            <img src="${DHL_LOGO_URL}" width="132" alt="DHL" style="display:block;border:0;max-width:132px;height:auto;">
          </td>
        </tr>
        <tr>
          <td style="padding:34px 28px 22px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:#D40511;font-weight:800;">Shipment notification</div>
            <h1 style="margin:10px 0 8px;font-size:28px;line-height:1.2;color:#111827;">${escapeHtml(title)}</h1>
            <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 26px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111827;border-radius:8px;">
              <tr><td style="padding:24px;text-align:center;">
                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.18em;font-weight:800;">Tracking number</div>
                <div style="font-family:'Courier New',monospace;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:.12em;margin-top:8px;word-break:break-word;">${escapeHtml(pkg.trackingCode)}</div>
                <div style="display:inline-block;margin-top:14px;padding:7px 12px;background:#FFCC00;color:#111827;font-size:12px;font-weight:900;text-transform:uppercase;">${escapeHtml(status)}</div>
              </td></tr>
            </table>
          </td>
        </tr>
        ${customMessage ? `<tr><td style="padding:0 28px 26px;"><div style="padding:18px 20px;background:#fff7ed;border-left:4px solid #FFCC00;border-radius:4px;color:#374151;font-size:15px;line-height:1.7;white-space:pre-line;">${escapeHtml(customMessage)}</div></td></tr>` : ''}
        <tr>
          <td style="padding:0 28px 28px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              ${detailRow('Package', pkg.packageName)}
              ${detailRow('Sender', pkg.senderName)}
              ${detailRow('Receiver', pkg.receiverName)}
              ${detailRow('Origin', `${pkg.senderCity || ''}${pkg.senderCountry ? ', ' + pkg.senderCountry : ''}`)}
              ${detailRow('Destination', `${pkg.receiverCity || ''}${pkg.receiverCountry ? ', ' + pkg.receiverCountry : ''}`)}
              ${detailRow('Current location', currentLocation)}
              ${detailRow('Expected delivery', formatDate(pkg.estimatedDelivery || pkg.estimatedDeliveryDate))}
              ${detailRow('Weight', pkg.packageWeight ? `${pkg.packageWeight} kg` : '')}
              ${detailRow('Latest update', formatDate(pkg.updatedAt || new Date()))}
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 28px 28px;"><table role="presentation" cellspacing="0" cellpadding="0" width="100%">${timelineHtml(pkg)}</table></td></tr>
        <tr>
          <td align="center" style="padding:0 28px 34px;">
            <a href="${trackingUrl}" style="display:inline-block;background:#D40511;color:#ffffff;text-decoration:none;padding:15px 28px;border-radius:4px;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;">Track package</a>
          </td>
        </tr>
        <tr>
          <td style="background:#111827;color:#d1d5db;padding:24px 28px;text-align:center;font-size:12px;line-height:1.7;">
            Replies go to <a href="mailto:${REPLY_TO_EMAIL}" style="color:#FFCC00;text-decoration:none;font-weight:700;">${REPLY_TO_EMAIL}</a><br>
            Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:#FFCC00;text-decoration:none;font-weight:700;">${SUPPORT_EMAIL}</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const sendEmail = async (to, subject, html, options = {}) => {
  if (!isValidEmail(to)) {
    throw new Error('Invalid recipient email address');
  }

  const transporter = mailTransporter();
  if (!transporter) {
    console.log('SMTP credentials not configured. Skipping email to:', to);
    return { skipped: true, reason: 'SMTP credentials missing' };
  }

  let info;
  try {
    info = await transporter.sendMail({
      from: { address: SMTP_FROM_EMAIL, name: SMTP_FROM_NAME },
      to,
      subject,
      html,
      replyTo: REPLY_TO_EMAIL,
      attachments: options.attachments,
    });
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      throw new Error('SMTP connection timed out. Check SMTP host, port, secure setting, and provider access.');
    }
    throw error;
  }

  console.log('Email sent to', to, '| Subject:', subject, '| Message:', info.messageId);
  return { success: true, messageId: info.messageId };
};

const sendShipmentCreatedEmail = async (pkg) => {
  const html = renderPackageEmail({
    pkg,
    title: `Package created: ${pkg.trackingCode}`,
    intro: `Hello ${pkg.receiverName || 'there'}, your shipment has been created and is ready for tracking.`,
  });
  return sendEmail(pkg.receiverEmail, `Shipment created - ${pkg.trackingCode}`, html);
};

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  const html = renderPackageEmail({
    pkg,
    title: `${getStatusLabel(pkg.status)}: ${pkg.trackingCode}`,
    intro: `Your shipment status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(pkg.status)}.`,
  });
  return sendEmail(pkg.receiverEmail, `Shipment update - ${getStatusLabel(pkg.status)} - ${pkg.trackingCode}`, html);
};

const sendPaymentReminderEmail = async (pkg) => {
  const html = renderPackageEmail({
    pkg,
    title: `Action required: ${pkg.trackingCode}`,
    intro: 'A payment or confirmation step is required before this shipment can continue.',
  });
  return sendEmail(pkg.receiverEmail, `Action required - ${pkg.trackingCode}`, html);
};

const sendCustomPackageEmail = async (pkg, subject, message) => {
  const html = renderPackageEmail({
    pkg,
    title: subject,
    intro: `A DXTI Delivery administrator sent you a message about shipment ${pkg.trackingCode}.`,
    customMessage: message,
  });
  return sendEmail(pkg.receiverEmail, subject, html);
};

module.exports = {
  sendShipmentCreatedEmail,
  sendStatusUpdateEmail,
  sendPaymentReminderEmail,
  sendCustomPackageEmail,
  sendEmail,
  renderPackageEmail,
  escapeHtml,
  isValidEmail,
};
