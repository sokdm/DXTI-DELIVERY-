const axios = require('axios');

const EMAIL_FROM      = process.env.EMAIL_FROM      || 'dhld5736@gmail.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'DHL Express';
const REPLY_TO_EMAIL  = 'dhld5736@gmail.com';
const SUPPORT_EMAIL   = process.env.SUPPORT_EMAIL    || 'dhld5736@gmail.com';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS  || 'DHL Express, Charles-de-Gaulle-Str. 20, 53113 Bonn, Germany';
const FRONTEND_URL    = process.env.FRONTEND_URL     || 'https://dxti-delivery.onrender.com';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// DHL striped logo using CSS gradients (works in all email clients)
const DHL_LOGO_HTML = `<table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="font-size:0;line-height:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(to bottom,#D40511 0%,#D40511 14%,#FFCC00 14%,#FFCC00 28%,#D40511 28%,#D40511 42%,#FFCC00 42%,#FFCC00 56%,#D40511 56%,#D40511 70%,#FFCC00 70%,#FFCC00 84%,#D40511 84%,#D40511 100%);width:6px;height:36px;display:inline-block;vertical-align:middle;">&nbsp;</td><td style="padding-left:10px;vertical-align:middle;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:900;color:#D40511;letter-spacing:6px;line-height:1;">DHL</span></td></tr></table></td></tr></table>`;

const getGreeting = (gender, name) => {
  const hour = new Date().getHours();
  let timeGreeting = 'Good day';
  if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
  else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17 && hour < 21) timeGreeting = 'Good evening';
  else timeGreeting = 'Good night';
  const title = gender === 'female' ? 'Ms.' : gender === 'male' ? 'Mr.' : '';
  return { full: `${timeGreeting}${title ? ', ' + title : ''} ${name || ''}`.trim() };
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateShort = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (amount, currency = 'USD') => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency });
};

const getStatusMeta = (status) => {
  const map = {
    pending:     { icon: '&#9203;', color: '#D40511', bg: '#FEF2F2', border: '#FECACA', label: 'Shipment Information Received', desc: 'The shipment details have been received and the package is awaiting collection.', step: 1 },
    in_transit:  { icon: '&#128666;', color: '#FFCC00', bg: '#FFFBEB', border: '#FDE68A', label: 'In Transit', desc: 'Your shipment is on its way to the destination and moving through the DHL network.', step: 2 },
    arrived:     { icon: '&#128205;', color: '#D40511', bg: '#FEF2F2', border: '#FECACA', label: 'Arrived at Facility', desc: 'Your shipment has arrived at the destination service center and is being prepared for final delivery.', step: 3 },
    delivered:   { icon: '&#9989;', color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', label: 'Delivered', desc: 'Your shipment has been successfully delivered to the recipient.', step: 4 },
    stopped:     { icon: '&#9888;', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Shipment on Hold', desc: 'There is a temporary hold on your shipment. Please contact DHL Customer Service for assistance.', step: 0 },
    cancelled:   { icon: '&#9940;', color: '#6B7280', bg: '#F9FAFB', border: '#D1D5DB', label: 'Cancelled', desc: 'This shipment has been cancelled by the sender or DHL.', step: 0 },
  };
  return map[status] || map.pending;
};

const getEstimatedDelivery = (pkg) => {
  if (pkg.estimatedDeliveryDate) return formatDate(pkg.estimatedDeliveryDate);
  const created = new Date(pkg.createdAt || Date.now());
  const est = new Date(created);
  est.setDate(est.getDate() + 5);
  return formatDate(est);
};

const getServiceType = (pkg) => {
  const price = pkg.deliveryPrice || 0;
  if (price >= 200) return 'DHL EXPRESS WORLDWIDE';
  if (price >= 100) return 'DHL EXPRESS 12:00';
  if (price >= 50) return 'DHL EXPRESS 10:30';
  return 'DHL EXPRESS 9:00';
};

const getPieces = (pkg) => {
  const weight = pkg.packageWeight || pkg.weight || 1;
  return Math.ceil(weight / 10) || 1;
};

const getDimensions = (pkg) => {
  const weight = pkg.packageWeight || pkg.weight || 1;
  const length = Math.max(20, Math.round(weight * 3));
  const width = Math.max(15, Math.round(weight * 2));
  const height = Math.max(10, Math.round(weight * 1.5));
  return `${length} x ${width} x ${height} cm`;
};

// Generate barcode using inline SVG (works in email clients)
const generateBarcode = (code, height = 60) => {
  const bars = [];
  let x = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    const barWidth = (char % 3) + 1;
    const spaceWidth = ((char * 7) % 2) + 1;
    bars.push(`<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="#000000"/>`);
    x += barWidth + spaceWidth;
  }
  const totalWidth = x;
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background-color:#FFFFFF;padding:12px 16px;border:1px solid #D1D5DB;"><svg width="${totalWidth}" height="${height + 24}" viewBox="0 0 ${totalWidth} ${height + 24}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${bars.join('')}<text x="${totalWidth/2}" y="${height + 16}" text-anchor="middle" font-family="'Courier New',monospace" font-size="11" font-weight="700" fill="#000000">${code}</text></svg></td></tr></table>`;
};

// Generate routing barcode
const generateRoutingBarcode = (pkg) => {
  const routingCode = `(2L)${pkg.receiverCountry || 'US'}${Math.floor(Math.random() * 90000 + 10000)}+${Math.floor(Math.random() * 90000000 + 10000000)}`;
  return generateBarcode(routingCode, 50);
};

// Generate tracking barcode
const generateTrackingBarcode = (trackingCode) => {
  const formatted = `(J) ${trackingCode.replace(/(.{4})/g, '$1 ').trim()}`;
  return generateBarcode(formatted, 60);
};

const sendEmail = async (to, subject, html, options = {}) => {
  if (!SENDGRID_API_KEY) {
    console.log('SENDGRID_API_KEY not set. Skipping email to:', to);
    return { skipped: true, reason: 'SENDGRID_API_KEY missing' };
  }
  const payload = {
    personalizations: [{ to: [{ email: to }], ...(options.cc && { cc: options.cc.map(e => ({ email: e })) }), ...(options.bcc && { bcc: options.bcc.map(e => ({ email: e })) }) }],
    from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
    reply_to: { email: REPLY_TO_EMAIL, name: 'DHL Customer Service' },
    subject,
    content: [{ type: 'text/html', value: html }],
    ...(options.attachments && { attachments: options.attachments.map(att => ({ content: att.content, filename: att.filename, type: att.type || 'application/pdf', disposition: 'attachment' })) }),
    tracking_settings: { click_tracking: { enable: true }, open_tracking: { enable: true } },
  };
  try {
    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', payload, { headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 });
    console.log('Email sent to', to, '| Subject:', subject, '| Status:', response.status);
    return { success: true, status: response.status };
  } catch (error) {
    const errData = error.response?.data?.errors || error.response?.data || error.message;
    console.error('SendGrid error:', JSON.stringify(errData, null, 2));
    throw new Error(`Email failed: ${Array.isArray(errData) ? errData.map(e => e.message).join('; ') : errData}`);
  }
};

const dhlStripe = () => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td height="4" style="height:4px;line-height:4px;font-size:4px;background:linear-gradient(to right,#D40511 0%,#D40511 33%,#FFCC00 33%,#FFCC00 66%,#D40511 66%,#D40511 100%);">&nbsp;</td></tr></table>`;

const dhlHeader = () => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FFFFFF;">${dhlStripe()}<tr><td style="padding:20px 40px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td>${DHL_LOGO_HTML}</td><td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;background:linear-gradient(135deg,#D40511,#991B1B);padding:8px 18px;border-radius:2px;">EXPRESS</td></tr><tr><td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#FFCC00;font-weight:700;letter-spacing:5px;text-transform:uppercase;padding-top:6px;">Express Delivery Services</td></tr></table></td></tr>${dhlStripe()}</table>`;

const dhlFooter = () => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#1F2937,#111827);">${dhlStripe()}<tr><td style="padding:40px;text-align:center;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="text-align:center;padding-bottom:8px;">${DHL_LOGO_HTML.replace('font-size:36px','font-size:28px').replace('height:36px','height:28px')}</td></tr><tr><td style="font-size:10px;color:#9CA3AF;letter-spacing:4px;text-transform:uppercase;font-weight:700;text-align:center;padding-top:8px;">Express Worldwide</td></tr><tr><td style="padding:24px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background:linear-gradient(to right,transparent,#374151,transparent);">&nbsp;</td></tr></table></td></tr><tr><td style="font-size:12px;color:#9CA3AF;line-height:2;text-align:center;">${COMPANY_ADDRESS}<br>Customer Service: <a href="mailto:${SUPPORT_EMAIL}" style="color:#D1D5DB;text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a><br><a href="${FRONTEND_URL}/track" style="color:#D1D5DB;text-decoration:none;font-weight:600;">Track Shipment</a> &bull; <a href="${FRONTEND_URL}/support" style="color:#D1D5DB;text-decoration:none;font-weight:600;">Support</a> &bull; <a href="${FRONTEND_URL}/faq" style="color:#D1D5DB;text-decoration:none;font-weight:600;">FAQ</a></td></tr><tr><td style="padding-top:20px;text-align:center;"><a href="#" style="color:#6B7280;text-decoration:none;font-size:10px;margin:0 12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Privacy</a><a href="#" style="color:#6B7280;text-decoration:none;font-size:10px;margin:0 12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Terms</a><a href="#" style="color:#6B7280;text-decoration:none;font-size:10px;margin:0 12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Cookies</a><a href="#" style="color:#6B7280;text-decoration:none;font-size:10px;margin:0 12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Legal</a></td></tr><tr><td style="font-size:10px;color:#4B5563;padding-top:24px;line-height:1.8;text-align:center;">&copy; ${new Date().getFullYear()} DHL International GmbH. All rights reserved.<br>DHL is a division of the Deutsche Post DHL Group.<br><span style="color:#6B7280;">This is an automated notification. Please do not reply directly.<br>Replies monitored at: <a href="mailto:${REPLY_TO_EMAIL}" style="color:#FFCC00;text-decoration:none;font-weight:600;">${REPLY_TO_EMAIL}</a></span></td></tr></table></td></tr></table>`;

const btnPrimary = (text, url) => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:16px auto;"><tr><td style="background:linear-gradient(135deg,#D40511,#991B1B);text-align:center;border-radius:3px;box-shadow:0 2px 8px rgba(212,5,17,0.3);"><a href="${url}" target="_blank" style="display:inline-block;padding:16px 48px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#FFFFFF;text-decoration:none;letter-spacing:2px;text-transform:uppercase;">${text}</a></td></tr></table>`;

const btnSecondary = (text, url, color = '#D40511') => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:16px auto;"><tr><td style="background-color:#FFFFFF;border:2px solid ${color};text-align:center;border-radius:3px;"><a href="${url}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${color};text-decoration:none;letter-spacing:1px;text-transform:uppercase;">${text}</a></td></tr></table>`;

const warnBox = (text) => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;"><tr><td style="padding:18px 22px;background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border-left:4px solid #FFCC00;border-radius:0 4px 4px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#92400E;line-height:1.6;">${text}</td></tr></table></td></tr></table>`;

const infoBox = (text) => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;"><tr><td style="padding:18px 22px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-left:4px solid #3B82F6;border-radius:0 4px 4px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#1E40AF;line-height:1.6;">${text}</td></tr></table></td></tr></table>`;

const successBox = (text) => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;"><tr><td style="padding:18px 22px;background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-left:4px solid #059669;border-radius:0 4px 4px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#065F46;line-height:1.6;">${text}</td></tr></table></td></tr></table>`;

const twoCol = (items) => {
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>`;
  items.forEach(item => {
    h += `<td width="50%" valign="top" style="width:50%;padding:8px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border-left:3px solid #D40511;border-radius:0 6px 6px 0;"><tr><td style="padding:18px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:2px;padding-bottom:10px;">${item.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1F2937;line-height:1.4;">${item.value}</td></tr>`;
    if (item.sub) h += `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;font-weight:500;padding-top:4px;">${item.sub}</td></tr>`;
    h += `</table></td></tr></table></td>`;
  });
  h += `</tr></table>`;
  return h;
};
const barcodeSection = (pkg) => {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;background:linear-gradient(135deg,#FAFAFA,#F3F4F6);border:1px solid #E5E7EB;"><tr><td style="padding:28px 32px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:3px;padding-bottom:20px;text-align:center;">&#128196; Routing & Tracking Barcodes</td></tr><tr><td style="padding-bottom:16px;">${generateRoutingBarcode(pkg)}</td></tr><tr><td style="text-align:right;padding-bottom:20px;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#6B7280;font-weight:600;">Contents: FOR PERSONAL USE - DETAILED LIST ON COMMERCIAL INVOICE</span></td></tr><tr><td style="border-top:1px dashed #D1D5DB;padding-top:20px;">${generateTrackingBarcode(pkg.trackingCode)}</td></tr></table></td></tr></table>`;
};

const waybillBox = (pkg) => {
  const serviceType = getServiceType(pkg);
  const pieces = getPieces(pkg);
  const dimensions = getDimensions(pkg);
  const weight = pkg.packageWeight || pkg.weight || 0;
  const rows = [
    [{ label: 'Tracking Number', value: `<span style="font-family:'Courier New',monospace;font-weight:900;letter-spacing:1px;">${pkg.trackingCode}</span>` }, { label: 'Service', value: serviceType }],
    [{ label: 'Pieces', value: `${pieces} piece${pieces > 1 ? 's' : ''}` }, { label: 'Weight', value: `${weight} kg` }],
    [{ label: 'Dimensions', value: dimensions }, { label: 'Shipment Date', value: formatDateShort(pkg.createdAt) }],
    [{ label: 'Origin', value: `${pkg.senderCity}, ${pkg.senderCountry}` }, { label: 'Destination', value: `${pkg.receiverCity}, ${pkg.receiverCountry}` }],
    [{ label: 'Shipper', value: pkg.senderName, sub: pkg.senderAddress }, { label: 'Receiver', value: pkg.receiverName, sub: pkg.receiverAddress }],
  ];
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#D40511,#991B1B);padding:12px 20px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#FFFFFF;letter-spacing:3px;text-transform:uppercase;">&#128196; Waybill Details</td></tr><tr><td style="padding:24px 20px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">`;
  rows.forEach((row, ri) => {
    h += `<tr>`;
    row.forEach((cell, ci) => {
      const bb = (ri < rows.length - 1) ? 'border-bottom:1px solid #F3F4F6;' : '';
      h += `<td width="50%" valign="top" style="width:50%;padding:14px 16px;${bb}"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">${cell.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1F2937;">${cell.value}</td></tr>`;
      if (cell.sub) h += `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;padding-top:4px;line-height:1.4;">${cell.sub}</td></tr>`;
      h += `</table></td>`;
    });
    h += `</tr>`;
  });
  h += `</table></td></tr></table>`;
  return h;
};

const timeline = (pkg, currentStatus) => {
  const steps = [
    { key: 'pending', label: 'Shipment Info Received', desc: 'Electronic info submitted' },
    { key: 'in_transit', label: 'In Transit', desc: 'Moving through DHL network' },
    { key: 'arrived', label: 'At Destination', desc: 'Arrived at facility' },
    { key: 'delivered', label: 'Delivered', desc: 'Successfully delivered' },
  ];
  const currentStep = steps.findIndex(s => s.key === currentStatus);
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:3px;padding-bottom:20px;">&#128203; Shipment Progress</td></tr><tr><td><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">`;
  steps.forEach((step, idx) => {
    const isComp = idx < currentStep;
    const isAct = idx === currentStep;
    const dotColor = isComp ? '#059669' : isAct ? '#D40511' : '#E5E7EB';
    const lineColor = isComp ? '#059669' : '#E5E7EB';
    const textColor = isComp ? '#059669' : isAct ? '#1F2937' : '#9CA3AF';
    const bgColor = isComp ? '#ECFDF5' : isAct ? '#FEF2F2' : '#F9FAFB';
    h += `<tr><td width="36" valign="top" style="width:36px;padding-right:16px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td width="20" height="20" style="width:20px;height:20px;background-color:${dotColor};border-radius:50%;text-align:center;vertical-align:middle;"><span style="font-size:12px;color:#FFFFFF;line-height:20px;display:block;">${isComp ? '&#10003;' : idx + 1}</span></td></tr>`;
    if (idx !== steps.length - 1) h += `<tr><td width="20" style="width:20px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="2" style="width:2px;background-color:${lineColor};height:36px;margin:0 auto;">&nbsp;</td></tr></table></td></tr>`;
    h += `</table></td><td valign="top" style="padding-bottom:20px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${bgColor};padding:14px 18px;border-radius:6px;"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;font-weight:600;padding-bottom:4px;">${idx <= currentStep ? formatDateShort(pkg.createdAt) : 'Pending'}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${textColor};padding-bottom:2px;">${step.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;">${idx <= currentStep ? step.desc : 'Awaiting update'}</td></tr></table></td></tr>`;
  });
  h += `</table></td></tr></table>`;
  return h;
};

const eventLogHtml = (events) => {
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:3px;padding-bottom:20px;">&#128205; Shipment History</td></tr>`;
  events.forEach((event, idx) => {
    const isLast = idx === events.length - 1;
    const statusColor = event.status === 'completed' ? '#059669' : '#D1D5DB';
    h += `<tr><td style="padding:16px 0;${!isLast ? 'border-bottom:1px solid #F3F4F6;' : ''}"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="90" valign="top" style="width:90px;text-align:right;padding-right:20px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#1F2937;">${formatDateShort(event.time)}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;">${formatTime(event.time)}</td></tr></table></td><td width="12" valign="top" style="width:12px;padding-right:16px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td width="10" height="10" style="width:10px;height:10px;background-color:${statusColor};border-radius:50%;margin-top:4px;border:2px solid #FFFFFF;box-shadow:0 0 0 2px ${statusColor};">&nbsp;</td></tr></table></td><td valign="top"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1F2937;">${event.event}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;padding-top:4px;">${event.location}</td></tr></table></td></tr></table></td></tr>`;
  });
  h += `</table>`;
  return h;
};
const contactSection = () => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;"><tr><td style="padding:28px 32px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border:1px solid #E5E7EB;border-radius:6px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;text-align:center;">&#128222; Need Help?</td></tr><tr><td style="text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;line-height:1.8;">Our Customer Service team is available <strong>24/7</strong> to assist you.<br><span style="color:#D40511;font-weight:700;">Email:</span> <a href="mailto:${SUPPORT_EMAIL}" style="color:#D40511;text-decoration:none;font-weight:700;">${SUPPORT_EMAIL}</a><br><span style="color:#D40511;font-weight:700;">Live Chat:</span> <a href="${FRONTEND_URL}/support" style="color:#D40511;text-decoration:none;font-weight:700;">dxti-delivery.onrender.com/support</a></td></tr></table></td></tr></table>`;

const sendShipmentCreatedEmail = async (pkg) => {
  const trackingUrl = `${FRONTEND_URL}/track/${pkg.trackingCode}`;
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const meta = getStatusMeta('pending');
  const estDelivery = getEstimatedDelivery(pkg);
  const serviceType = getServiceType(pkg);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>DHL Shipment Notification — ${pkg.trackingCode}</title></head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<center style="width:100%;background-color:#F3F4F6;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:20px 0;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
${dhlHeader()}
<tr><td style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#FEF2F2,#FEE2E2);border-top:4px solid #D40511;"><tr><td style="padding:32px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:56px;text-align:center;padding-bottom:16px;">${meta.icon}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:900;color:#1F2937;letter-spacing:1px;text-transform:uppercase;text-align:center;padding-bottom:10px;">${meta.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;font-weight:500;text-align:center;line-height:1.7;max-width:480px;">${meta.desc}</td></tr></table></td></tr></table></td></tr>
<tr><td style="background:linear-gradient(135deg,#1F2937,#111827);padding:36px 40px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:4px;text-align:center;padding-bottom:14px;">DHL Express Tracking Number</td></tr><tr><td style="font-family:'Courier New',monospace;font-size:34px;font-weight:900;color:#FFFFFF;letter-spacing:8px;text-align:center;word-break:break-all;text-shadow:0 2px 4px rgba(0,0,0,0.3);">${pkg.trackingCode}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9CA3AF;text-align:center;padding-top:10px;font-weight:500;">${serviceType} &bull; Estimated Delivery: ${estDelivery}</td></tr><tr><td style="text-align:center;padding-top:24px;">${btnPrimary('TRACK SHIPMENT', trackingUrl).replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr>
<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:22px 26px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border-left:4px solid #D40511;border-radius:0 8px 8px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;font-weight:600;line-height:1.5;">${greeting.full},</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:#D40511;padding-top:6px;">${pkg.receiverName}</td></tr></table></td></tr><tr><td height="24" style="height:24px;line-height:24px;font-size:24px;">&nbsp;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;line-height:1.8;">A shipment from <strong style="color:#1F2937;">${pkg.senderName}</strong> (${pkg.senderCity}, ${pkg.senderCountry}) is being sent to you via <strong style="color:#D40511;">DHL Express</strong>. We will notify you of any status updates as your shipment moves through our global network.</td></tr></table></td></tr>
<tr><td style="padding:0 40px;">${waybillBox(pkg)}</td></tr>
<tr><td style="padding:0 40px;border-bottom:1px solid #F3F4F6;">${timeline(pkg, 'pending')}</td></tr>
<tr><td style="padding:0 40px;">${barcodeSection(pkg)}</td></tr>
<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:20px;">&#128311; Customs Information</td></tr><tr><td><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;"><tr><th style="background:linear-gradient(135deg,#F8FAFC,#F1F5F9);color:#6B7280;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:12px 14px;text-align:left;border-bottom:2px solid #E5E7EB;">Description</th><th style="background:linear-gradient(135deg,#F8FAFC,#F1F5F9);color:#6B7280;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:12px 14px;text-align:left;border-bottom:2px solid #E5E7EB;">Quantity</th><th style="background:linear-gradient(135deg,#F8FAFC,#F1F5F9);color:#6B7280;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:12px 14px;text-align:left;border-bottom:2px solid #E5E7EB;">Value</th></tr><tr><td style="padding:12px 14px;border-bottom:1px solid #F3F4F6;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1F2937;font-weight:600;">${pkg.packageDescription || 'General Goods'}</td><td style="padding:12px 14px;border-bottom:1px solid #F3F4F6;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1F2937;font-weight:600;">${getPieces(pkg)} piece(s)</td><td style="padding:12px 14px;border-bottom:1px solid #F3F4F6;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1F2937;font-weight:600;">${formatCurrency((pkg.deliveryPrice||0)*0.7)}</td></tr><tr><td colspan="2" style="padding:12px 14px;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#6B7280;background-color:#FAFAFA;">Total Declared Value:</td><td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:900;color:#D40511;background-color:#FAFAFA;">${formatCurrency((pkg.deliveryPrice||0)*0.7)}</td></tr></table></td></tr><tr><td>${infoBox('<strong>Customs Notice:</strong> For international shipments, customs duties and taxes may apply based on the destination country\'s regulations. The recipient is responsible for any applicable charges. All required customs documentation is attached to the shipment.')}</td></tr></table></td></tr>
<tr><td style="background:linear-gradient(135deg,#FEF2F2,#FEE2E2);padding:32px 40px;text-align:center;border-top:3px solid #D40511;border-bottom:3px solid #D40511;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#991B1B;text-transform:uppercase;letter-spacing:3px;text-align:center;padding-bottom:10px;">Shipping Charges Due</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:46px;font-weight:900;color:#D40511;letter-spacing:-1px;text-align:center;text-shadow:0 2px 4px rgba(0,0,0,0.1);">${formatCurrency(pkg.deliveryPrice)}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;text-align:center;padding-top:10px;font-weight:500;">Payment required before dispatch. Contact Customer Service to arrange payment.</td></tr><tr><td style="text-align:center;padding-top:20px;">${btnSecondary('ARRANGE PAYMENT', `${FRONTEND_URL}/payment/${pkg.trackingCode}`).replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr>
<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:20px;">&#128230; Delivery Information</td></tr><tr><td>${twoCol([{label:'Estimated Delivery',value:estDelivery,sub:'By end of business day'},{label:'Delivery Address',value:`${pkg.receiverCity}, ${pkg.receiverCountry}`,sub:pkg.receiverAddress},{label:'Signature Required',value:'Yes — Adult Signature',sub:'Valid ID required at delivery'},{label:'Delivery Options',value:`<a href="${FRONTEND_URL}/manage/${pkg.trackingCode}" style="color:#D40511;text-decoration:none;font-weight:800;">Manage Delivery</a>`,sub:'Redirect, hold, or reschedule'}])}</td></tr><tr><td>${warnBox('<strong>&#9888; Action Required:</strong> This shipment requires payment of shipping charges before dispatch. Please contact our Customer Service team or use the payment link above to complete your payment and avoid delivery delays.')}</td></tr></table></td></tr>
${contactSection()}
${dhlFooter()}
</table></td></tr></table></center></body></html>`;

  return await sendEmail(pkg.receiverEmail, `DHL Shipment Notification — ${pkg.trackingCode}`, html);
};
const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  const trackingUrl = `${FRONTEND_URL}/track/${pkg.trackingCode}`;
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const meta = getStatusMeta(pkg.status);
  const oldMeta = getStatusMeta(oldStatus);
  const estDelivery = getEstimatedDelivery(pkg);
  const serviceType = getServiceType(pkg);

  const eventLogData = [];
  const created = new Date(pkg.createdAt);
  eventLogData.push({ time: created, location: `${pkg.senderCity}, ${pkg.senderCountry}`, event: 'Shipment information received', status: 'completed' });
  if (pkg.status !== 'pending' || pkg.movementProgress > 0) {
    eventLogData.push({ time: new Date(created.getTime() + 24*60*60*1000), location: 'DHL Sort Facility', event: 'Processed at DHL facility', status: 'completed' });
  }
  if (['arrived','delivered'].includes(pkg.status)) {
    eventLogData.push({ time: new Date(created.getTime() + 3*24*60*60*1000), location: `${pkg.receiverCity}, ${pkg.receiverCountry}`, event: 'Arrived at destination facility', status: 'completed' });
  }
  if (pkg.status === 'delivered') {
    eventLogData.push({ time: new Date(created.getTime() + 4*24*60*60*1000), location: pkg.receiverAddress, event: `Delivered — Signed by ${pkg.receiverName}`, status: 'completed' });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>DHL Status Update: ${meta.label} — ${pkg.trackingCode}</title></head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<center style="width:100%;background-color:#F3F4F6;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:20px 0;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
${dhlHeader()}
<tr><td style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:${meta.bg};border-top:4px solid ${meta.color};"><tr><td style="padding:32px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:56px;text-align:center;padding-bottom:16px;">${meta.icon}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:900;color:${meta.color};letter-spacing:1px;text-transform:uppercase;text-align:center;padding-bottom:10px;">${meta.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;font-weight:500;text-align:center;line-height:1.7;max-width:480px;">${meta.desc}</td></tr></table></td></tr></table></td></tr>
<tr><td style="background:linear-gradient(135deg,#1F2937,#111827);padding:36px 40px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:4px;text-align:center;padding-bottom:14px;">DHL Express Tracking Number</td></tr><tr><td style="font-family:'Courier New',monospace;font-size:34px;font-weight:900;color:#FFFFFF;letter-spacing:8px;text-align:center;word-break:break-all;text-shadow:0 2px 4px rgba(0,0,0,0.3);">${pkg.trackingCode}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9CA3AF;text-align:center;padding-top:10px;font-weight:500;">${serviceType} &bull; Last Updated: ${formatDateShort(new Date())} at ${formatTime(new Date())}</td></tr><tr><td style="text-align:center;padding-top:24px;">${btnPrimary('TRACK LIVE STATUS', trackingUrl).replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr>
<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:22px 26px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border-left:4px solid ${meta.color};border-radius:0 8px 8px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;font-weight:600;line-height:1.5;">${greeting.full},</td></tr></table></td></tr><tr><td height="24" style="height:24px;line-height:24px;font-size:24px;">&nbsp;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;line-height:1.8;">There has been an update to your <strong style="color:#D40511;">DHL Express</strong> shipment. Your shipment status has changed from <strong style="color:#6B7280;">${oldMeta.label}</strong> to <strong style="color:${meta.color};">${meta.label}</strong>.</td></tr></table></td></tr>
<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:20px;">&#128202; Status Change</td></tr><tr><td style="padding:24px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border:1px solid #E5E7EB;border-radius:8px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="40%" style="width:40%;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#9CA3AF;font-weight:800;text-transform:uppercase;letter-spacing:2px;padding-bottom:10px;">Previous</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#9CA3AF;">${oldMeta.icon} ${oldMeta.label}</td></tr></table></td><td width="20%" style="width:20%;text-align:center;font-size:28px;color:#D40511;font-weight:900;">&#8594;</td><td width="40%" style="width:40%;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:${meta.color};font-weight:800;text-transform:uppercase;letter-spacing:2px;padding-bottom:10px;">Current</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;color:${meta.color};">${meta.icon} ${meta.label}</td></tr></table></td></tr><tr><td colspan="3" style="text-align:center;padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9CA3AF;">Updated: ${formatDate(new Date())}</td></tr></table></td></tr></table></td></tr>
<tr><td style="padding:0 40px;border-bottom:1px solid #F3F4F6;">${timeline(pkg, pkg.status)}</td></tr>
<tr><td style="padding:0 40px;border-bottom:1px solid #F3F4F6;">${eventLogHtml(eventLogData)}</td></tr>
<tr><td style="padding:0 40px;">${barcodeSection(pkg)}</td></tr>
${pkg.status === 'stopped' ? `<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:20px 24px;background:linear-gradient(135deg,#FEF2F2,#FEE2E2);border-left:4px solid #DC2626;border-radius:0 8px 8px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#991B1B;line-height:1.7;"><strong>&#9888; Shipment on Hold</strong><br><br>Your shipment is currently on hold. This may be due to customs clearance, incomplete documentation, or payment requirements. Please contact DHL Customer Service immediately with your tracking number <strong style="font-family:monospace;">${pkg.trackingCode}</strong> to resolve this issue.${pkg.stopReason ? `<br><br><strong>Reason:</strong> ${pkg.stopReason}` : ''}</td></tr></table></td></tr></table></td></tr>` : ''}
${pkg.status === 'delivered' ? `<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border:1px solid #6EE7B7;border-radius:8px;padding:32px;"><tr><td style="text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:56px;text-align:center;padding-bottom:16px;">&#127881;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:900;color:#065F46;text-transform:uppercase;letter-spacing:2px;text-align:center;">Delivery Complete</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#047857;text-align:center;padding-top:10px;font-weight:500;">Your shipment was delivered on ${formatDate(new Date())} at ${formatTime(new Date())}<br>Signed by: <strong>${pkg.receiverName}</strong></td></tr><tr><td style="text-align:center;padding-top:20px;">${btnSecondary('RATE YOUR DELIVERY', `${FRONTEND_URL}/feedback/${pkg.trackingCode}`, '#059669').replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr></table></td></tr>` : ''}
<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:20px;">&#128230; Delivery Details</td></tr><tr><td>${twoCol([{label:'Estimated Delivery',value:pkg.status==='delivered'?'Delivered':estDelivery},{label:'Receiver',value:pkg.receiverName,sub:pkg.receiverAddress},{label:'Service Type',value:getServiceType(pkg)},{label:'Weight',value:`${pkg.packageWeight||pkg.weight||0} kg`}])}</td></tr></table></td></tr>
${contactSection()}
${dhlFooter()}
</table></td></tr></table></center></body></html>`;

  return await sendEmail(pkg.receiverEmail, `DHL Status Update: ${meta.label} — ${pkg.trackingCode}`, html);
};
const sendPaymentReminderEmail = async (pkg) => {
  const trackingUrl = `${FRONTEND_URL}/track/${pkg.trackingCode}`;
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const daysElapsed = Math.floor((Date.now() - new Date(pkg.createdAt)) / 86400000);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>DHL Payment Reminder — ${pkg.trackingCode}</title></head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<center style="width:100%;background-color:#F3F4F6;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:20px 0;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
${dhlHeader()}
<tr><td style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border-top:4px solid #FFCC00;"><tr><td style="padding:32px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:56px;text-align:center;padding-bottom:16px;">&#9200;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:900;color:#92400E;letter-spacing:1px;text-transform:uppercase;text-align:center;padding-bottom:10px;">Payment Reminder</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;font-weight:500;text-align:center;line-height:1.7;max-width:480px;">Your shipment is awaiting payment before dispatch. Please arrange payment as soon as possible to avoid delivery delays.</td></tr></table></td></tr></table></td></tr>
<tr><td style="background:linear-gradient(135deg,#1F2937,#111827);padding:36px 40px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:4px;text-align:center;padding-bottom:14px;">DHL Express Tracking Number</td></tr><tr><td style="font-family:'Courier New',monospace;font-size:34px;font-weight:900;color:#FFFFFF;letter-spacing:8px;text-align:center;word-break:break-all;text-shadow:0 2px 4px rgba(0,0,0,0.3);">${pkg.trackingCode}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9CA3AF;text-align:center;padding-top:10px;font-weight:500;">Days elapsed: ${daysElapsed} &bull; Please arrange payment immediately</td></tr><tr><td style="text-align:center;padding-top:24px;">${btnPrimary('PAY NOW', `${FRONTEND_URL}/payment/${pkg.trackingCode}`).replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr>
<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:22px 26px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border-left:4px solid #FFCC00;border-radius:0 8px 8px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;font-weight:600;line-height:1.5;">${greeting.full},</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:#D40511;padding-top:6px;">${pkg.receiverName}</td></tr></table></td></tr><tr><td height="24" style="height:24px;line-height:24px;font-size:24px;">&nbsp;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;line-height:1.8;">A shipment from <strong style="color:#1F2937;">${pkg.senderName}</strong> (${pkg.senderCity}, ${pkg.senderCountry}) is being sent to you via <strong style="color:#D40511;">DHL Express</strong>. Payment is required before your shipment can be dispatched.</td></tr></table></td></tr>
<tr><td style="padding:0 40px;">${waybillBox(pkg)}</td></tr>
<tr><td style="padding:0 40px;">${barcodeSection(pkg)}</td></tr>
<tr><td style="padding:36px 40px;border-bottom:1px solid #F3F4F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:20px;">&#128179; How to Pay</td></tr><tr><td style="padding:24px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border:1px solid #E5E7EB;border-radius:8px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1F2937;font-weight:700;padding-bottom:14px;">Payment Instructions:</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:2.4;">1. Click the <strong style="color:#D40511;">"Pay Now"</strong> button above or contact Customer Service<br>2. Provide your tracking number: <strong style="color:#D40511;font-family:monospace;">${pkg.trackingCode}</strong><br>3. Our team will guide you through the secure payment process<br>4. Receive instant confirmation and dispatch notification</td></tr></table></td></tr><tr><td>${warnBox('<strong>&#9200; Important:</strong> Failure to complete payment within 7 days of shipment creation may result in automatic cancellation and return of the shipment to the sender. A cancellation fee may apply.')}</td></tr></table></td></tr>
${contactSection()}
${dhlFooter()}
</table></td></tr></table></center></body></html>`;

  return await sendEmail(pkg.receiverEmail, `DHL Payment Reminder — ${pkg.trackingCode}`, html);
};

module.exports = {
  sendShipmentCreatedEmail,
  sendStatusUpdateEmail,
  sendPaymentReminderEmail,
  sendEmail,
};
