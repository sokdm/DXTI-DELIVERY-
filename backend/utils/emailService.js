const nodemailer = require('nodemailer');
const { BRAND, trxLogoDataUri } = require('./brand');
const { generateReceiptPDF } = require('./receiptService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
const REPLY_TO_EMAIL = BRAND.replyToEmail;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || REPLY_TO_EMAIL;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || SUPPORT_EMAIL;
const SMTP_FROM_NAME = BRAND.fromName;
const LOGO_URL = BRAND.logoUrl || trxLogoDataUri(false);

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

const formatCurrency = (pkg) => {
  const amount = typeof pkg.deliveryPrice === 'number' ? pkg.deliveryPrice : parseFloat(pkg.deliveryPrice) || 0;
  return `${pkg.deliveryCurrencySymbol || '$'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${pkg.deliveryCurrency || 'USD'}`;
};

const getGreeting = (gender, name) => {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const title = gender === 'female' ? 'Ms.' : gender === 'male' ? 'Mr.' : '';
  return `${timeGreeting}${title ? ', ' + title : ''} ${name || 'customer'}`.trim();
};

const getServiceType = (pkg) => {
  const price = typeof pkg.deliveryPrice === 'number' ? pkg.deliveryPrice : parseFloat(pkg.deliveryPrice) || 0;
  if (price >= 200) return 'TRX Prime Global';
  if (price >= 100) return 'TRX Priority Ledger';
  if (price >= 50) return 'TRX Secure Express';
  return 'TRX Standard Flow';
};

const getPieces = (pkg) => Math.max(1, Math.ceil(Number(pkg.packageWeight || 1) / 10));

const statusLabels = {
  pending: 'Package created',
  shipped: 'Dispatched',
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
const qrImageUrl = (pkg) => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=8&data=${encodeURIComponent(getTrackingUrl(pkg))}`;

const mailTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
    family: 4,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 15000,
    tls: {
      servername: SMTP_HOST,
    },
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

const panel = (label, value, sub = '') => `
  <td valign="top" width="50%" style="padding:8px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F8FB;border-left:4px solid #00A6A6;border-radius:8px;">
      <tr><td style="padding:16px;">
        <div style="font-size:10px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.14em;">${escapeHtml(label)}</div>
        <div style="font-size:15px;font-weight:800;color:#111827;line-height:1.45;margin-top:8px;">${escapeHtml(value || 'N/A')}</div>
        ${sub ? `<div style="font-size:12px;color:#6b7280;line-height:1.5;margin-top:5px;">${escapeHtml(sub)}</div>` : ''}
      </td></tr>
    </table>
  </td>`;

const barcodeSection = (pkg) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F8FB;border:1px solid #DCE6EF;margin-top:8px;border-radius:8px;">
    <tr><td style="padding:18px;text-align:center;">
      <img src="${qrImageUrl(pkg)}" width="128" height="128" alt="TRX tracking QR code" style="display:block;margin:0 auto 10px;border:0;">
      <div style="font-family:'Courier New',monospace;font-size:12px;font-weight:800;color:#0B1020;letter-spacing:.12em;margin-top:8px;">${escapeHtml(pkg.trackingCode)}</div>
      <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:.14em;margin-top:8px;font-weight:800;">Scan for live TRX tracking</div>
    </td></tr>
  </table>`;

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
        <div style="width:14px;height:14px;border-radius:14px;background:${index === 0 ? '#00A6A6' : '#35E0A1'};border:3px solid #fff;box-shadow:0 0 0 1px #e5e7eb;"></div>
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
  const amount = formatCurrency(pkg);
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const serviceType = getServiceType(pkg);
  const pieces = getPieces(pkg);

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EAF3F8;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:820px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #DCE6EF;">
        <tr><td style="height:6px;background:linear-gradient(90deg,#0B1020 0 34%,#00A6A6 34% 68%,#35E0A1 68%);"></td></tr>
        <tr>
          <td style="background:#ffffff;padding:20px 32px;border-bottom:1px solid #DCE6EF;">
            <img src="${LOGO_URL}" width="150" alt="TRX Logistics" style="display:block;border:0;max-width:150px;height:auto;">
          </td>
        </tr>
        <tr>
          <td style="padding:34px 28px 22px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:#00A6A6;font-weight:800;">TRX shipment notification</div>
            <h1 style="margin:10px 0 8px;font-size:28px;line-height:1.2;color:#111827;">${escapeHtml(title)}</h1>
            <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.7;"><strong>${escapeHtml(greeting)},</strong><br>${escapeHtml(intro)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 26px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B1020;border-radius:10px;">
              <tr><td style="padding:24px;text-align:center;">
                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.18em;font-weight:800;">Tracking number</div>
                <div style="font-family:'Courier New',monospace;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:.12em;margin-top:8px;word-break:break-word;">${escapeHtml(pkg.trackingCode)}</div>
                <div style="display:inline-block;margin-top:14px;padding:7px 12px;background:#35E0A1;color:#0B1020;font-size:12px;font-weight:900;text-transform:uppercase;">${escapeHtml(status)}</div>
              </td></tr>
            </table>
          </td>
        </tr>
        ${customMessage ? `<tr><td style="padding:0 28px 26px;"><div style="padding:18px 20px;background:#ECFDF5;border-left:4px solid #35E0A1;border-radius:8px;color:#374151;font-size:15px;line-height:1.7;white-space:pre-line;">${escapeHtml(customMessage)}</div></td></tr>` : ''}
        <tr>
          <td style="padding:0 20px 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                ${panel('Service', serviceType, `${pieces} piece${pieces > 1 ? 's' : ''} • ${pkg.packageWeight || 0} kg`)}
                ${panel('Shipping amount', amount, `${pkg.deliveryCurrencyCountry || 'United States'} billing currency`)}
              </tr>
              <tr>
                ${panel('Shipper', pkg.senderName, [pkg.senderAddress, pkg.senderCity, pkg.senderCountry].filter(Boolean).join(', '))}
                ${panel('Receiver', pkg.receiverName, [pkg.receiverAddress, pkg.receiverCity, pkg.receiverCountry].filter(Boolean).join(', '))}
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              ${detailRow('Package', pkg.packageName)}
              ${detailRow('Description', pkg.packageDescription)}
              ${detailRow('Sender', pkg.senderName)}
              ${detailRow('Receiver', pkg.receiverName)}
              ${detailRow('Origin', `${pkg.senderCity || ''}${pkg.senderCountry ? ', ' + pkg.senderCountry : ''}`)}
              ${detailRow('Destination', `${pkg.receiverCity || ''}${pkg.receiverCountry ? ', ' + pkg.receiverCountry : ''}`)}
              ${detailRow('Current location', currentLocation)}
              ${detailRow('Destination facility', destination)}
              ${detailRow('Expected delivery', formatDate(pkg.estimatedDelivery || pkg.estimatedDeliveryDate))}
              ${detailRow('Weight', pkg.packageWeight ? `${pkg.packageWeight} kg` : '')}
              ${detailRow('Pieces', `${pieces}`)}
              ${detailRow('Shipping amount', amount)}
              ${detailRow('Latest update', formatDate(pkg.updatedAt || new Date()))}
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 28px 28px;">${barcodeSection(pkg)}</td></tr>
        <tr><td style="padding:0 28px 28px;"><table role="presentation" cellspacing="0" cellpadding="0" width="100%">${timelineHtml(pkg)}</table></td></tr>
        <tr>
          <td style="padding:0 28px 28px;">
            <div style="background:#ECFDF5;border-left:4px solid #35E0A1;border-radius:8px;padding:16px 18px;color:#065F46;font-size:13px;line-height:1.7;">
              Keep this TRX email for your shipment records. Payment, customs, or identity checks may be required before release depending on the destination country.
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 28px 34px;">
            <a href="${trackingUrl}" style="display:inline-block;background:#00A6A6;color:#ffffff;text-decoration:none;padding:15px 28px;border-radius:8px;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;">Track package</a>
          </td>
        </tr>
        <tr>
          <td style="background:#0B1020;color:#d1d5db;padding:24px 28px;text-align:center;font-size:12px;line-height:1.7;">
            ${BRAND.name} | ${BRAND.tagline}<br>
            Replies go to <a href="mailto:${REPLY_TO_EMAIL}" style="color:#35E0A1;text-decoration:none;font-weight:700;">${REPLY_TO_EMAIL}</a><br>
            Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:#35E0A1;text-decoration:none;font-weight:700;">${SUPPORT_EMAIL}</a>
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
      text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      replyTo: REPLY_TO_EMAIL,
      headers: {
        'X-Entity-Ref-ID': `trx-${Date.now()}`,
        'List-Unsubscribe': `<mailto:${SUPPORT_EMAIL}>`,
      },
      attachments: options.attachments,
    });
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      throw new Error('SMTP connection timed out. Check SMTP host, port, secure setting, and provider access.');
    }
    throw error;
  }

  console.log('Email sent to', to, '| Subject:', subject, '| Message:', info.messageId, '| Accepted:', info.accepted, '| Rejected:', info.rejected);
  return { success: true, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
};

const sendShipmentCreatedEmail = async (pkg) => {
  const html = renderPackageEmail({
    pkg,
    title: `Package created: ${pkg.trackingCode}`,
    intro: `Hello ${pkg.receiverName || 'there'}, your shipment has been created and is ready for tracking.`,
  });
  return sendEmail(pkg.receiverEmail, `TRX shipment created - ${pkg.trackingCode}`, html);
};

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  const attachments = [];
  if (['shipped', 'stopped'].includes(pkg.status)) {
    const pdfBuffer = await generateReceiptPDF(pkg);
    attachments.push({
      filename: `TRX-Receipt-${pkg.trackingCode}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  const html = renderPackageEmail({
    pkg,
    title: `${getStatusLabel(pkg.status)}: ${pkg.trackingCode}`,
    intro: pkg.status === 'shipped'
      ? `Your shipment has been dispatched by ${BRAND.name}. The official TRX receipt is attached.`
      : pkg.status === 'stopped'
        ? `Your shipment is currently on hold. Reason: ${pkg.stopReason || 'Awaiting administrative review'}. The updated TRX receipt is attached.`
        : `Your shipment status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(pkg.status)}.`,
  });
  return sendEmail(pkg.receiverEmail, `TRX update - ${getStatusLabel(pkg.status)} - ${pkg.trackingCode}`, html, { attachments });
};

const sendPaymentReminderEmail = async (pkg) => {
  const html = renderPackageEmail({
    pkg,
    title: `Action required: ${pkg.trackingCode}`,
    intro: 'A payment or confirmation step is required before this shipment can continue.',
  });
  return sendEmail(pkg.receiverEmail, `Action required - ${pkg.trackingCode}`, html);
};

const sendCustomPackageEmail = async (pkg, subject, message, recipientEmail = pkg.receiverEmail) => {
  const html = renderPackageEmail({
    pkg,
    title: subject,
    intro: `A ${BRAND.name} administrator sent you a message about shipment ${pkg.trackingCode}.`,
    customMessage: message,
  });
  return sendEmail(recipientEmail, subject, html);
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
