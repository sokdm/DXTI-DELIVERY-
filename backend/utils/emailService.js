const axios = require('axios');

const EMAIL_FROM      = process.env.EMAIL_FROM      || 'dhld5736@gmail.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'DHL Express';
const REPLY_TO_EMAIL  = 'dhld5736@gmail.com';
const SUPPORT_EMAIL   = process.env.SUPPORT_EMAIL    || 'dhld5736@gmail.com';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS  || 'DHL Express, Charles-de-Gaulle-Str. 20, 53113 Bonn, Germany';
const FRONTEND_URL    = process.env.FRONTEND_URL     || 'https://dxti-delivery.onrender.com';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

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

const dhlStripe = () => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td height="6" style="height:6px;line-height:6px;font-size:6px;background-color:#D40511;">&nbsp;</td></tr></table>`;

const dhlHeader = () => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FFFFFF;">${dhlStripe()}<tr><td style="padding:24px 40px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:900;color:#D40511;letter-spacing:6px;line-height:1;">DHL</td><td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;background-color:#D40511;padding:6px 14px;">EXPRESS</td></tr><tr><td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#FFCC00;font-weight:700;letter-spacing:4px;text-transform:uppercase;padding-top:4px;">Express Delivery Services</td></tr></table></td></tr></table>`;

const dhlFooter = () => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1F2937;">${dhlStripe()}<tr><td style="padding:32px 40px;text-align:center;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:24px;font-weight:900;color:#FFCC00;letter-spacing:6px;text-align:center;">DHL</td></tr><tr><td style="font-size:11px;color:#9CA3AF;margin-top:6px;letter-spacing:3px;text-transform:uppercase;font-weight:700;text-align:center;padding-top:6px;">Express Worldwide</td></tr><tr><td style="padding:20px 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:#374151;">&nbsp;</td></tr></table></td></tr><tr><td style="font-size:12px;color:#9CA3AF;line-height:1.8;text-align:center;">${COMPANY_ADDRESS}<br>Customer Service: <a href="mailto:${SUPPORT_EMAIL}" style="color:#D1D5DB;text-decoration:none;">${SUPPORT_EMAIL}</a><br><a href="${FRONTEND_URL}/track" style="color:#D1D5DB;text-decoration:none;">Track Your Shipment</a> | <a href="${FRONTEND_URL}/support" style="color:#D1D5DB;text-decoration:none;">Support Center</a> | <a href="${FRONTEND_URL}/faq" style="color:#D1D5DB;text-decoration:none;">FAQ</a></td></tr><tr><td style="padding-top:16px;text-align:center;"><a href="#" style="color:#9CA3AF;text-decoration:none;font-size:11px;margin:0 14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Privacy Notice</a><a href="#" style="color:#9CA3AF;text-decoration:none;font-size:11px;margin:0 14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Terms of Use</a><a href="#" style="color:#9CA3AF;text-decoration:none;font-size:11px;margin:0 14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Cookie Settings</a><a href="#" style="color:#9CA3AF;text-decoration:none;font-size:11px;margin:0 14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Legal Notice</a></td></tr><tr><td style="font-size:11px;color:#6B7280;padding-top:20px;line-height:1.6;text-align:center;">&copy; ${new Date().getFullYear()} DHL International GmbH. All rights reserved.<br>DHL is a division of the Deutsche Post DHL Group.<br><span style="color:#6B7280;">This is an automated notification. Please do not reply directly to this email.<br>Replies are monitored at: <a href="mailto:${REPLY_TO_EMAIL}" style="color:#FFCC00;text-decoration:none;">${REPLY_TO_EMAIL}</a></span></td></tr></table></td></tr></table>`;

const btnPrimary = (text, url) => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:16px auto;"><tr><td style="background-color:#D40511;text-align:center;"><a href="${url}" target="_blank" style="display:inline-block;padding:16px 48px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;color:#FFFFFF;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">${text}</a></td></tr></table>`;

const btnSecondary = (text, url, color = '#D40511') => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:16px auto;"><tr><td style="background-color:#FFFFFF;border:2px solid ${color};text-align:center;"><a href="${url}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${color};text-decoration:none;letter-spacing:1px;text-transform:uppercase;">${text}</a></td></tr></table>`;

const warnBox = (text) => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;"><tr><td style="padding:16px 20px;background-color:#FFFBEB;border-left:4px solid #FFCC00;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#92400E;line-height:1.6;">${text}</td></tr></table></td></tr></table>`;

const infoBox = (text) => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;"><tr><td style="padding:16px 20px;background-color:#EFF6FF;border-left:4px solid #3B82F6;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#1E40AF;line-height:1.6;">${text}</td></tr></table></td></tr></table>`;

const twoCol = (items) => {
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>`;
  items.forEach(item => {
    h += `<td width="50%" valign="top" style="width:50%;padding:8px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;border-left:3px solid #D40511;"><tr><td style="padding:16px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">${item.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1F2937;line-height:1.4;">${item.value}</td></tr>`;
    if (item.sub) h += `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;font-weight:500;padding-top:2px;">${item.sub}</td></tr>`;
    h += `</table></td></tr></table></td>`;
  });
  h += `</tr></table>`;
  return h;
};

const waybillBox = (pkg) => {
  const serviceType = getServiceType(pkg);
  const pieces = getPieces(pkg);
  const dimensions = getDimensions(pkg);
  const weight = pkg.packageWeight || pkg.weight || 0;
  const rows = [
    [{ label: 'Tracking Number', value: `<span style="font-family:'Courier New',monospace;font-weight:900;">${pkg.trackingCode}</span>` }, { label: 'Service', value: serviceType }],
    [{ label: 'Pieces', value: `${pieces} piece${pieces > 1 ? 's' : ''}` }, { label: 'Weight', value: `${weight} kg` }],
    [{ label: 'Dimensions', value: dimensions }, { label: 'Shipment Date', value: formatDateShort(pkg.createdAt) }],
    [{ label: 'Origin', value: `${pkg.senderCity}, ${pkg.senderCountry}` }, { label: 'Destination', value: `${pkg.receiverCity}, ${pkg.receiverCountry}` }],
    [{ label: 'Shipper', value: pkg.senderName, sub: pkg.senderAddress }, { label: 'Receiver', value: pkg.receiverName, sub: pkg.receiverAddress }],
  ];
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;border:2px solid #D40511;"><tr><td style="background-color:#D40511;padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#FFFFFF;letter-spacing:3px;text-transform:uppercase;">&#128196; Waybill Details</td></tr><tr><td style="padding:20px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">`;
  rows.forEach((row, ri) => {
    h += `<tr>`;
    row.forEach((cell, ci) => {
      const bb = (ri < rows.length - 1 || ci < row.length - 1) ? 'border-bottom:1px solid #E5E7EB;' : '';
      h += `<td width="50%" valign="top" style="width:50%;padding:14px 16px;${bb}"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:2px;padding-bottom:6px;">${cell.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1F2937;">${cell.value}</td></tr>`;
      if (cell.sub) h += `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;padding-top:4px;">${cell.sub}</td></tr>`;
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
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;">&#128203; Shipment Progress</td></tr><tr><td><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">`;
  steps.forEach((step, idx) => {
    const isComp = idx < currentStep;
    const isAct = idx === currentStep;
    const dotColor = isComp ? '#059669' : isAct ? '#D40511' : '#D1D5DB';
    const shadowColor = isComp ? '#059669' : isAct ? '#D40511' : '#D1D5DB';
    const textColor = isComp ? '#059669' : isAct ? '#1F2937' : '#9CA3AF';
    h += `<tr><td width="30" valign="top" style="width:30px;padding-right:16px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td width="12" height="12" style="width:12px;height:12px;background-color:${dotColor};border-radius:50%;box-shadow:0 0 0 2px ${shadowColor};">&nbsp;</td></tr>`;
    if (idx !== steps.length - 1) h += `<tr><td width="2" style="width:2px;background-color:#E5E7EB;height:40px;margin:0 auto;">&nbsp;</td></tr>`;
    h += `</table></td><td valign="top" style="padding-bottom:24px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;font-weight:600;padding-bottom:4px;">${idx <= currentStep ? formatDateShort(pkg.createdAt) : 'Pending'}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${textColor};padding-bottom:2px;">${step.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;">${idx <= currentStep ? step.desc : 'Awaiting update'}</td></tr></table></td></tr>`;
  });
  h += `</table></td></tr></table>`;
  return h;
};

const eventLogHtml = (events) => {
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;">&#128205; Shipment History</td></tr>`;
  events.forEach((event, idx) => {
    const isLast = idx === events.length - 1;
    h += `<tr><td style="padding:14px 0;${!isLast ? 'border-bottom:1px solid #E5E7EB;' : ''}"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="80" valign="top" style="width:80px;text-align:right;padding-right:16px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#1F2937;">${formatDateShort(event.time)}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;">${formatTime(event.time)}</td></tr></table></td><td width="8" valign="top" style="width:8px;padding-right:16px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td width="8" height="8" style="width:8px;height:8px;background-color:${event.status === 'completed' ? '#059669' : '#D1D5DB'};border-radius:50%;margin-top:6px;">&nbsp;</td></tr></table></td><td valign="top"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1F2937;">${event.event}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;padding-top:2px;">${event.location}</td></tr></table></td></tr></table></td></tr>`;
  });
  h += `</table>`;
  return h;
};

const contactSection = () => {
  const contacts = [
    { icon: '&#128231;', label: 'Email Support', value: `<a href="mailto:${SUPPORT_EMAIL}" style="color:#D40511;text-decoration:none;">${SUPPORT_EMAIL}</a>` },
    { icon: '&#128172;', label: 'Live Chat', value: `<a href="${FRONTEND_URL}/support" style="color:#D40511;text-decoration:none;">Start Live Chat</a>` },
    { icon: '&#127760;', label: 'Online Tracking', value: `<a href="${FRONTEND_URL}/track" style="color:#D40511;text-decoration:none;">Track Your Shipment</a>` },
    { icon: '&#128205;', label: 'Service Point', value: `<a href="${FRONTEND_URL}/locations" style="color:#D40511;text-decoration:none;">Find a Location</a>` },
  ];
  let h = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;border-top:1px solid #E5E7EB;"><tr><td style="padding:28px 40px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;">&#128222; Customer Service</td></tr><tr><td><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">`;
  for (let i = 0; i < contacts.length; i += 2) {
    h += `<tr>`;
    for (let j = i; j < Math.min(i + 2, contacts.length); j++) {
      const c = contacts[j];
      h += `<td width="50%" valign="top" style="width:50%;padding:8px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FFFFFF;border:1px solid #E5E7EB;"><tr><td style="padding:16px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:20px;padding-bottom:10px;">${c.icon}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#9CA3AF;font-weight:800;text-transform:uppercase;letter-spacing:2px;padding-bottom:4px;">${c.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1F2937;font-weight:700;">${c.value}</td></tr></table></td></tr></table></td>`;
    }
    h += `</tr>`;
  }
  h += `</table></td></tr></table></td></tr></table>`;
  return h;
};

const sendShipmentCreatedEmail = async (pkg) => {
  const trackingUrl = `${FRONTEND_URL}/track/${pkg.trackingCode}`;
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const meta = getStatusMeta('pending');
  const estDelivery = getEstimatedDelivery(pkg);
  const serviceType = getServiceType(pkg);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>DHL Shipment Notification — ${pkg.trackingCode}</title></head>
<body style="margin:0;padding:0;background-color:#E5E7EB;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<center style="width:100%;background-color:#E5E7EB;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;background-color:#FFFFFF;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
${dhlHeader()}
<tr><td style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#FEF2F2,#FEE2E2);border:2px solid #FECACA;border-top:4px solid #D40511;"><tr><td style="padding:28px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:48px;text-align:center;padding-bottom:12px;">${meta.icon}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;color:#1F2937;letter-spacing:1px;text-transform:uppercase;text-align:center;padding-bottom:8px;">${meta.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;font-weight:500;text-align:center;line-height:1.6;">${meta.desc}</td></tr></table></td></tr></table></td></tr>
<tr><td style="background-color:#1F2937;padding:32px 40px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:4px;text-align:center;padding-bottom:12px;">DHL Express Tracking Number</td></tr><tr><td style="font-family:'Courier New',monospace;font-size:32px;font-weight:900;color:#FFFFFF;letter-spacing:6px;text-align:center;word-break:break-all;">${pkg.trackingCode}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;text-align:center;padding-top:8px;font-weight:500;">${serviceType} &#8226; Estimated Delivery: ${estDelivery}</td></tr><tr><td style="text-align:center;padding-top:20px;">${btnPrimary('TRACK SHIPMENT', trackingUrl).replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr>
<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:20px 24px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border-left:4px solid #D40511;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;font-weight:600;line-height:1.5;">${greeting.full},</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:#D40511;padding-top:4px;">${pkg.receiverName}</td></tr></table></td></tr><tr><td height="20" style="height:20px;line-height:20px;font-size:20px;">&nbsp;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;line-height:1.7;">A shipment from <strong>${pkg.senderName}</strong> (${pkg.senderCity}, ${pkg.senderCountry}) is being sent to you via DHL Express. We will notify you of any status updates as your shipment moves through our network.</td></tr></table></td></tr>
<tr><td style="padding:0 40px;">${waybillBox(pkg)}</td></tr>
<tr><td style="padding:0 40px;border-bottom:1px solid #E5E7EB;">${timeline(pkg, 'pending')}</td></tr>
<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;">&#128311; Customs Information</td></tr><tr><td><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr><th style="background-color:#F8FAFC;color:#6B7280;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:10px 12px;text-align:left;border-bottom:2px solid #E5E7EB;">Description</th><th style="background-color:#F8FAFC;color:#6B7280;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:10px 12px;text-align:left;border-bottom:2px solid #E5E7EB;">Quantity</th><th style="background-color:#F8FAFC;color:#6B7280;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:10px 12px;text-align:left;border-bottom:2px solid #E5E7EB;">Value</th></tr><tr><td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1F2937;font-weight:600;">${pkg.packageDescription || 'General Goods'}</td><td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1F2937;font-weight:600;">${getPieces(pkg)} piece(s)</td><td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1F2937;font-weight:600;">${formatCurrency((pkg.deliveryPrice||0)*0.7)}</td></tr><tr><td colspan="2" style="padding:10px 12px;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#6B7280;">Total Declared Value:</td><td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:900;color:#D40511;">${formatCurrency((pkg.deliveryPrice||0)*0.7)}</td></tr></table></td></tr><tr><td>${infoBox('<strong>Customs Notice:</strong> For international shipments, customs duties and taxes may apply based on the destination country\\'s regulations. The recipient is responsible for any applicable charges. All required customs documentation is attached to the shipment.')}</td></tr></table></td></tr>
<tr><td style="background:linear-gradient(135deg,#FEF2F2,#FEE2E2);padding:28px 40px;text-align:center;border-top:3px solid #D40511;border-bottom:3px solid #D40511;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:3px;text-align:center;padding-bottom:8px;">Shipping Charges Due</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:42px;font-weight:900;color:#D40511;letter-spacing:-1px;text-align:center;">${formatCurrency(pkg.deliveryPrice)}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;text-align:center;padding-top:8px;font-weight:500;">Payment required before dispatch. Contact Customer Service to arrange payment.</td></tr><tr><td style="text-align:center;padding-top:16px;">${btnSecondary('ARRANGE PAYMENT', `${FRONTEND_URL}/payment/${pkg.trackingCode}`).replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr>
<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;">&#128230; Delivery Information</td></tr><tr><td>${twoCol([{label:'Estimated Delivery',value:estDelivery,sub:'By end of business day'},{label:'Delivery Address',value:`${pkg.receiverCity}, ${pkg.receiverCountry}`,sub:pkg.receiverAddress},{label:'Signature Required',value:'Yes — Adult Signature',sub:'Valid ID required at delivery'},{label:'Delivery Options',value:`<a href="${FRONTEND_URL}/manage/${pkg.trackingCode}" style="color:#D40511;text-decoration:none;font-weight:800;">Manage Delivery</a>`,sub:'Redirect, hold, or reschedule'}])}</td></tr><tr><td>${warnBox('<strong>&#9888; Action Required:</strong> This shipment requires payment of shipping charges before dispatch. Please contact our Customer Service team or use the payment link above to complete your payment and avoid delivery delays.')}</td></tr></table></td></tr>
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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>DHL Status Update — ${meta.label} | ${pkg.trackingCode}</title></head>
<body style="margin:0;padding:0;background-color:#E5E7EB;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<center style="width:100%;background-color:#E5E7EB;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;background-color:#FFFFFF;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
${dhlHeader()}
<tr><td style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:${meta.bg};border:2px solid ${meta.border};border-top:4px solid ${meta.color};"><tr><td style="padding:28px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:48px;text-align:center;padding-bottom:12px;">${meta.icon}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;color:${meta.color};letter-spacing:1px;text-transform:uppercase;text-align:center;padding-bottom:8px;">${meta.label}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;font-weight:500;text-align:center;line-height:1.6;">${meta.desc}</td></tr></table></td></tr></table></td></tr>
<tr><td style="background-color:#1F2937;padding:32px 40px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:4px;text-align:center;padding-bottom:12px;">DHL Express Tracking Number</td></tr><tr><td style="font-family:'Courier New',monospace;font-size:32px;font-weight:900;color:#FFFFFF;letter-spacing:6px;text-align:center;word-break:break-all;">${pkg.trackingCode}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;text-align:center;padding-top:8px;font-weight:500;">Last Updated: ${formatDateShort(new Date())} at ${formatTime(new Date())}</td></tr><tr><td style="text-align:center;padding-top:20px;">${btnPrimary('TRACK LIVE STATUS', trackingUrl).replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr>
<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:20px 24px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border-left:4px solid ${meta.color};"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;font-weight:600;line-height:1.5;">${greeting.full},</td></tr></table></td></tr><tr><td height="20" style="height:20px;line-height:20px;font-size:20px;">&nbsp;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;line-height:1.7;">There has been an update to your DHL Express shipment. Your shipment status has changed from <strong>${oldMeta.label}</strong> to <strong style="color:${meta.color};">${meta.label}</strong>.</td></tr></table></td></tr>
<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;">&#128202; Status Change</td></tr><tr><td style="padding:20px;background-color:#F8FAFC;border:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="40%" style="width:40%;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;font-weight:800;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Previous</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#6B7280;">${oldMeta.icon} ${oldMeta.label}</td></tr></table></td><td width="20%" style="width:20%;text-align:center;font-size:24px;color:#D40511;font-weight:900;">&#8594;</td><td width="40%" style="width:40%;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#D40511;font-weight:800;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Current</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;color:${meta.color};">${meta.icon} ${meta.label}</td></tr></table></td></tr><tr><td colspan="3" style="text-align:center;padding-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9CA3AF;">Updated: ${formatDate(new Date())}</td></tr></table></td></tr></table></td></tr>
<tr><td style="padding:0 40px;border-bottom:1px solid #E5E7EB;">${timeline(pkg, pkg.status)}</td></tr>
<tr><td style="padding:0 40px;border-bottom:1px solid #E5E7EB;">${eventLogHtml(eventLogData)}</td></tr>
<tr><td style="padding:0 40px;">${waybillBox(pkg)}</td></tr>
${pkg.status === 'stopped' ? `<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:16px 20px;background-color:#FEF2F2;border-left:4px solid #DC2626;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#991B1B;line-height:1.6;"><strong>&#9888; Shipment on Hold</strong><br><br>Your shipment is currently on hold. This may be due to customs clearance, incomplete documentation, or payment requirements. Please contact DHL Customer Service immediately with your tracking number <strong>${pkg.trackingCode}</strong> to resolve this issue and prevent further delays.${pkg.stopReason ? `<br><br><strong>Reason:</strong> ${pkg.stopReason}` : ''}</td></tr></table></td></tr></table></td></tr>` : ''}
${pkg.status === 'delivered' ? `<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border:2px solid #6EE7B7;padding:28px;"><tr><td style="text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:48px;text-align:center;padding-bottom:12px;">&#127881;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;color:#065F46;text-transform:uppercase;letter-spacing:2px;text-align:center;">Delivery Complete</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#047857;text-align:center;padding-top:8px;font-weight:500;">Your shipment was delivered on ${formatDate(new Date())} at ${formatTime(new Date())}<br>Signed by: ${pkg.receiverName}</td></tr><tr><td style="text-align:center;padding-top:16px;">${btnSecondary('RATE YOUR DELIVERY', `${FRONTEND_URL}/feedback/${pkg.trackingCode}`, '#059669').replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr></table></td></tr>` : ''}
<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;">&#128230; Delivery Details</td></tr><tr><td>${twoCol([{label:'Estimated Delivery',value:pkg.status==='delivered'?'Delivered':estDelivery},{label:'Receiver',value:pkg.receiverName,sub:pkg.receiverAddress},{label:'Service Type',value:getServiceType(pkg)},{label:'Weight',value:`${pkg.packageWeight||pkg.weight||0} kg`}])}</td></tr></table></td></tr>
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
<body style="margin:0;padding:0;background-color:#E5E7EB;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<center style="width:100%;background-color:#E5E7EB;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;background-color:#FFFFFF;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
${dhlHeader()}
<tr><td style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:2px solid #F59E0B;border-top:4px solid #F59E0B;"><tr><td style="padding:28px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:48px;text-align:center;padding-bottom:12px;">&#128179;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;color:#92400E;letter-spacing:1px;text-transform:uppercase;text-align:center;padding-bottom:8px;">Payment Required</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;font-weight:500;text-align:center;line-height:1.6;">Your shipment is awaiting payment confirmation before dispatch.</td></tr></table></td></tr></table></td></tr>
<tr><td style="background-color:#1F2937;padding:32px 40px;text-align:center;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:4px;text-align:center;padding-bottom:12px;">DHL Express Tracking Number</td></tr><tr><td style="font-family:'Courier New',monospace;font-size:32px;font-weight:900;color:#FFFFFF;letter-spacing:6px;text-align:center;word-break:break-all;">${pkg.trackingCode}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;text-align:center;padding-top:8px;font-weight:500;">Shipment Created: ${formatDate(pkg.createdAt)}</td></tr></table></td></tr>
<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:20px 24px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border-left:4px solid #F59E0B;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;font-weight:600;line-height:1.5;">${greeting.full},</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:#D40511;padding-top:4px;">${pkg.receiverName}</td></tr></table></td></tr><tr><td height="20" style="height:20px;line-height:20px;font-size:20px;">&nbsp;</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;line-height:1.7;">This is a reminder that payment for your DHL Express shipment from <strong>${pkg.senderName}</strong> is still pending. Your package will not be dispatched until shipping charges are settled.</td></tr></table></td></tr>
<tr><td style="background:linear-gradient(135deg,#FEF2F2,#FEE2E2);padding:28px 40px;text-align:center;border-top:3px solid #D40511;border-bottom:3px solid #D40511;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:3px;text-align:center;padding-bottom:8px;">Outstanding Balance</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:42px;font-weight:900;color:#D40511;letter-spacing:-1px;text-align:center;">${formatCurrency(pkg.deliveryPrice)}</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;text-align:center;padding-top:8px;font-weight:500;">Days elapsed: ${daysElapsed} &#8226; Please arrange payment immediately</td></tr><tr><td style="text-align:center;padding-top:16px;">${btnPrimary('PAY NOW', `${FRONTEND_URL}/payment/${pkg.trackingCode}`).replace('margin:16px auto;','margin:0 auto;')}</td></tr></table></td></tr>
<tr><td style="padding:0 40px;">${waybillBox(pkg)}</td></tr>
<tr><td style="padding:32px 40px;border-bottom:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:#D40511;text-transform:uppercase;letter-spacing:3px;padding-bottom:16px;">&#128179; How to Pay</td></tr><tr><td style="padding:24px;background-color:#F8FAFC;border:1px solid #E5E7EB;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1F2937;font-weight:700;padding-bottom:12px;">Payment Instructions:</td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:2.2;">1. Click the <strong>"Pay Now"</strong> button above or contact Customer Service<br>2. Provide your tracking number: <strong style="color:#D40511;font-family:monospace;">${pkg.trackingCode}</strong><br>3. Our team will guide you through the secure payment process<br>4. Receive instant confirmation and dispatch notification</td></tr></table></td></tr><tr><td>${warnBox('<strong>&#9200; Important:</strong> Failure to complete payment within 7 days of shipment creation may result in automatic cancellation and return of the shipment to the sender. A cancellation fee may apply.')}</td></tr></table></td></tr>
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
