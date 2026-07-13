const axios = require('axios');

// ─── Config ─────────────────────────────────────────────────────────────────

const EMAIL_FROM      = process.env.EMAIL_FROM      || 'dhld5736@gmail.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'DHL Express';
const REPLY_TO_EMAIL  = 'dhld5736@gmail.com';
const SUPPORT_EMAIL   = process.env.SUPPORT_EMAIL    || 'dhld5736@gmail.com';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS  || 'DHL Express, Charles-de-Gaulle-Str. 20, 53113 Bonn, Germany';
const FRONTEND_URL    = process.env.FRONTEND_URL     || 'https://dxti-delivery.onrender.com';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// ─── Helpers ────────────────────────────────────────────────────────────────

const getGreeting = (gender, name) => {
  const hour = new Date().getHours();
  let timeGreeting = 'Good day';
  if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
  else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17 && hour < 21) timeGreeting = 'Good evening';
  else timeGreeting = 'Good night';

  const title = gender === 'female' ? 'Ms.' : gender === 'male' ? 'Mr.' : '';
  return { full: `${timeGreeting}${title ? ', ' + title : ''} ${name || ''}`.trim(), time: timeGreeting, title };
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const formatDateShort = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
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
    pending:     { 
      icon: '⏳', 
      color: '#D40511', 
      bg: '#FEF2F2', 
      border: '#FECACA', 
      label: 'Shipment Information Received', 
      desc: 'The shipment details have been received and the package is awaiting collection.',
      step: 1,
      timeline: 'Awaiting Pickup'
    },
    in_transit:{ 
      icon: '🚚', 
      color: '#FFCC00', 
      bg: '#FFFBEB', 
      border: '#FDE68A', 
      label: 'In Transit', 
      desc: 'Your shipment is on its way to the destination and moving through the DHL network.',
      step: 2,
      timeline: 'In Transit'
    },
    arrived:     { 
      icon: '📍', 
      color: '#D40511', 
      bg: '#FEF2F2', 
      border: '#FECACA', 
      label: 'Arrived at Facility', 
      desc: 'Your shipment has arrived at the destination service center and is being prepared for final delivery.',
      step: 3,
      timeline: 'At Facility'
    },
    delivered:   { 
      icon: '✅', 
      color: '#059669', 
      bg: '#ECFDF5', 
      border: '#6EE7B7', 
      label: 'Delivered', 
      desc: 'Your shipment has been successfully delivered to the recipient.',
      step: 4,
      timeline: 'Delivered'
    },
    stopped:     { 
      icon: '⚠️', 
      color: '#DC2626', 
      bg: '#FEF2F2', 
      border: '#FECACA', 
      label: 'Shipment on Hold', 
      desc: 'There is a temporary hold on your shipment. Please contact DHL Customer Service for assistance.',
      step: 0,
      timeline: 'On Hold'
    },
    cancelled:   { 
      icon: '🚫', 
      color: '#6B7280', 
      bg: '#F9FAFB', 
      border: '#D1D5DB', 
      label: 'Cancelled', 
      desc: 'This shipment has been cancelled by the sender or DHL.',
      step: 0,
      timeline: 'Cancelled'
    },
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
  // Approximate dimensions based on weight
  const length = Math.max(20, Math.round(weight * 3));
  const width = Math.max(15, Math.round(weight * 2));
  const height = Math.max(10, Math.round(weight * 1.5));
  return `${length} x ${width} x ${height} cm`;
};

// ─── Core Send Function (SendGrid) ────────────────────────────────────────

const sendEmail = async (to, subject, html, options = {}) => {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️  SENDGRID_API_KEY not set. Skipping email to:', to);
    return { skipped: true, reason: 'SENDGRID_API_KEY missing' };
  }

  const payload = {
    personalizations: [{
      to: [{ email: to }],
      ...(options.cc && { cc: options.cc.map(e => ({ email: e })) }),
      ...(options.bcc && { bcc: options.bcc.map(e => ({ email: e })) }),
    }],
    from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
    reply_to: { email: REPLY_TO_EMAIL, name: 'DHL Customer Service' },
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
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${title}</title>`;

const emailStyles = () => `
<style>
  /* Reset */
  body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  
  body { margin: 0; padding: 0; background: #E5E7EB; font-family: 'DHL Arabic', 'Segoe UI', Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased; }
  
  .wrapper { width: 100%; background: #E5E7EB; padding: 20px 0; }
  .container { max-width: 680px; margin: 0 auto; background: #FFFFFF; border-radius: 0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
  
  /* DHL Header */
  .dhl-header { background: #FFFFFF; padding: 0; }
  .dhl-stripe { height: 6px; background: linear-gradient(90deg, #D40511 0%, #D40511 33%, #FFCC00 33%, #FFCC00 66%, #D40511 66%, #D40511 100%); }
  .dhl-logo-bar { padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; }
  .dhl-logo { font-size: 36px; font-weight: 900; color: #D40511; letter-spacing: 6px; }
  .dhl-logo-sub { font-size: 10px; color: #FFCC00; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; margin-top: 2px; }
  .dhl-express-badge { background: #D40511; color: #FFFFFF; font-size: 10px; font-weight: 800; letter-spacing: 2px; padding: 6px 14px; text-transform: uppercase; }
  
  /* Content */
  .content { padding: 0; }
  .section { padding: 32px 40px; }
  .section-border { border-bottom: 1px solid #E5E7EB; }
  
  /* Greeting */
  .greeting-box { background: linear-gradient(135deg, #F8FAFC, #F1F5F9); border-left: 4px solid #D40511; padding: 20px 24px; margin-bottom: 24px; }
  .greeting { font-size: 15px; color: #475569; font-weight: 600; line-height: 1.5; }
  .greeting-name { font-size: 22px; font-weight: 800; color: #D40511; margin-top: 4px; }
  
  /* Status Banner */
  .status-banner { background: linear-gradient(135deg, #FEF2F2, #FEE2E2); border: 2px solid #FECACA; border-radius: 0; padding: 28px; text-align: center; margin-bottom: 24px; position: relative; }
  .status-banner::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #D40511, #FFCC00); }
  .status-icon { font-size: 48px; margin-bottom: 12px; display: block; }
  .status-title { font-size: 20px; font-weight: 900; color: #1F2937; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .status-desc { font-size: 14px; color: #6B7280; font-weight: 500; max-width: 480px; margin: 0 auto; line-height: 1.6; }
  
  /* Tracking Box */
  .tracking-section { background: #1F2937; padding: 32px 40px; text-align: center; }
  .tracking-label { color: #9CA3AF; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 12px; }
  .tracking-code { color: #FFFFFF; font-size: 32px; font-weight: 900; letter-spacing: 6px; font-family: 'Courier New', monospace; word-break: break-all; }
  .tracking-sub { color: #6B7280; font-size: 12px; margin-top: 8px; font-weight: 500; }
  
  /* Waybill Style */
  .waybill-box { background: #FFFFFF; border: 2px solid #D40511; margin: 24px 40px; position: relative; }
  .waybill-header { background: #D40511; color: #FFFFFF; padding: 10px 16px; font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; }
  .waybill-content { padding: 20px; }
  .waybill-row { display: flex; border-bottom: 1px solid #E5E7EB; }
  .waybill-row:last-child { border-bottom: none; }
  .waybill-cell { flex: 1; padding: 14px 16px; border-right: 1px solid #E5E7EB; }
  .waybill-cell:last-child { border-right: none; }
  .waybill-label { font-size: 10px; color: #9CA3AF; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
  .waybill-value { font-size: 14px; color: #1F2937; font-weight: 700; }
  .waybill-value-mono { font-family: 'Courier New', monospace; font-weight: 900; }
  
  /* Info Grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .info-card { background: #F8FAFC; border-radius: 0; padding: 20px; border-left: 3px solid #D40511; }
  .info-label { font-size: 10px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
  .info-value { font-size: 15px; font-weight: 700; color: #1F2937; line-height: 1.4; }
  .info-value-light { font-size: 13px; color: #6B7280; font-weight: 500; margin-top: 2px; }
  
  /* Timeline */
  .timeline { position: relative; padding-left: 32px; margin: 24px 0; }
  .timeline::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: #E5E7EB; }
  .timeline-item { position: relative; padding-bottom: 24px; }
  .timeline-item:last-child { padding-bottom: 0; }
  .timeline-dot { position: absolute; left: -26px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: #D1D5DB; border: 2px solid #FFFFFF; box-shadow: 0 0 0 2px #D1D5DB; }
  .timeline-dot.active { background: #D40511; box-shadow: 0 0 0 2px #D40511; }
  .timeline-dot.completed { background: #059669; box-shadow: 0 0 0 2px #059669; }
  .timeline-time { font-size: 11px; color: #9CA3AF; font-weight: 600; margin-bottom: 4px; }
  .timeline-title { font-size: 14px; font-weight: 700; color: #1F2937; margin-bottom: 2px; }
  .timeline-desc { font-size: 12px; color: #6B7280; }
  
  /* Amount */
  .amount-section { background: linear-gradient(135deg, #FEF2F2, #FEE2E2); padding: 28px 40px; text-align: center; border-top: 3px solid #D40511; border-bottom: 3px solid #D40511; }
  .amount-value { font-size: 42px; font-weight: 900; color: #D40511; letter-spacing: -1px; }
  .amount-label { color: #991B1B; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px; }
  .amount-detail { color: #6B7280; font-size: 13px; margin-top: 8px; font-weight: 500; }
  
  /* Buttons */
  .btn-primary { display: inline-block; background: #D40511; color: #FFFFFF !important; text-decoration: none; padding: 16px 48px; font-size: 14px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 8px 0; border: none; cursor: pointer; transition: background 0.2s; }
  .btn-primary:hover { background: #9B0000; }
  .btn-secondary { display: inline-block; background: #FFFFFF; color: #D40511 !important; text-decoration: none; padding: 14px 40px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: 2px solid #D40511; margin: 8px 0; }
  
  /* Warning / Info Boxes */
  .warning-box { background: #FFFBEB; border-left: 4px solid #FFCC00; padding: 16px 20px; margin: 20px 0; }
  .warning-text { color: #92400E; font-size: 13px; font-weight: 600; line-height: 1.6; }
  .info-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px 20px; margin: 20px 0; }
  .info-text { color: #1E40AF; font-size: 13px; font-weight: 600; line-height: 1.6; }
  
  /* Contact */
  .contact-section { background: #F8FAFC; padding: 28px 40px; border-top: 1px solid #E5E7EB; }
  .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .contact-item { display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: #FFFFFF; border: 1px solid #E5E7EB; }
  .contact-icon { font-size: 20px; width: 24px; text-align: center; }
  .contact-label { font-size: 10px; color: #9CA3AF; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
  .contact-value { font-size: 13px; color: #1F2937; font-weight: 700; }
  .contact-value a { color: #D40511; text-decoration: none; }
  
  /* Customs Table */
  .customs-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  .customs-table th { background: #F8FAFC; color: #6B7280; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #E5E7EB; }
  .customs-table td { padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: 600; }
  .customs-table tr:last-child td { border-bottom: 2px solid #E5E7EB; }
  
  /* Footer */
  .footer { background: #1F2937; padding: 32px 40px; text-align: center; }
  .footer-brand { color: #FFCC00; font-size: 24px; font-weight: 900; letter-spacing: 6px; }
  .footer-sub { color: #9CA3AF; font-size: 11px; margin-top: 6px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; }
  .footer-divider { height: 1px; background: #374151; margin: 20px 0; }
  .footer-address { color: #9CA3AF; font-size: 12px; line-height: 1.8; }
  .footer-address a { color: #D1D5DB; text-decoration: none; }
  .footer-links { margin-top: 16px; }
  .footer-links a { color: #9CA3AF; text-decoration: none; font-size: 11px; margin: 0 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  .footer-links a:hover { color: #FFCC00; }
  .copyright { color: #6B7280; font-size: 11px; margin-top: 20px; line-height: 1.6; }
  
  /* Section Headers */
  .section-title { font-size: 13px; font-weight: 800; color: #D40511; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 16px; }
  .section-title-dark { font-size: 13px; font-weight: 800; color: #1F2937; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 16px; }
  
  /* QR Placeholder */
  .qr-box { width: 100px; height: 100px; background: #F8FAFC; border: 2px dashed #D1D5DB; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9CA3AF; text-align: center; }
  
  /* Utility */
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .mb-0 { margin-bottom: 0; }
  .mt-0 { margin-top: 0; }
  .flex { display: flex; }
  .flex-between { justify-content: space-between; }
  .items-center { align-items: center; }
  .gap-2 { gap: 8px; }
  
  @media (max-width: 600px) {
    .section { padding: 24px 20px !important; }
    .tracking-section { padding: 24px 20px !important; }
    .amount-section { padding: 24px 20px !important; }
    .contact-section { padding: 24px 20px !important; }
    .footer { padding: 24px 20px !important; }
    .dhl-logo-bar { padding: 20px 20px !important; }
    .waybill-box { margin: 16px 20px !important; }
    .info-grid { grid-template-columns: 1fr !important; }
    .contact-grid { grid-template-columns: 1fr !important; }
    .tracking-code { font-size: 22px !important; letter-spacing: 3px !important; }
    .amount-value { font-size: 32px !important; }
    .waybill-row { flex-direction: column !important; }
    .waybill-cell { border-right: none !important; border-bottom: 1px solid #E5E7EB !important; }
    .waybill-cell:last-child { border-bottom: none !important; }
  }
</style>`;

const dhlHeader = () => `
<div class="dhl-header">
  <div class="dhl-stripe"></div>
  <div class="dhl-logo-bar">
    <div>
      <div class="dhl-logo">DHL</div>
      <div class="dhl-logo-sub">Express Delivery Services</div>
    </div>
    <div class="dhl-express-badge">Express</div>
  </div>
</div>`;
const dhlFooter = () => `
<div class="footer">
  <div class="dhl-stripe"></div>
  <div class="footer-brand">DHL</div>
  <div class="footer-sub">Express Worldwide</div>
  <div class="footer-divider"></div>
  <div class="footer-address">
    ${COMPANY_ADDRESS}<br>
    Customer Service: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a><br>
    <a href="${FRONTEND_URL}/track">Track Your Shipment</a> | <a href="${FRONTEND_URL}/support">Support Center</a> | <a href="${FRONTEND_URL}/faq">FAQ</a>
  </div>
  <div class="footer-links">
    <a href="#">Privacy Notice</a>
    <a href="#">Terms of Use</a>
    <a href="#">Cookie Settings</a>
    <a href="#">Legal Notice</a>
  </div>
  <div class="copyright">
    © ${new Date().getFullYear()} DHL International GmbH. All rights reserved.<br>
    DHL is a division of the Deutsche Post DHL Group.<br>
    <span style="color: #6B7280;">This is an automated notification. Please do not reply directly to this email.<br>Replies are monitored at: <a href="mailto:${REPLY_TO_EMAIL}" style="color: #FFCC00;">${REPLY_TO_EMAIL}</a></span>
  </div>
</div>`;

const contactSection = (includeEmail = true) => `
<div class="contact-section">
  <div class="section-title">📞 Customer Service</div>
  <div class="contact-grid">
    <div class="contact-item">
      <span class="contact-icon">📧</span>
      <div>
        <div class="contact-label">Email Support</div>
        <div class="contact-value"><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></div>
      </div>
    </div>
    <div class="contact-item">
      <span class="contact-icon">💬</span>
      <div>
        <div class="contact-label">Live Chat</div>
        <div class="contact-value"><a href="${FRONTEND_URL}/support">Start Live Chat</a></div>
      </div>
    </div>
    <div class="contact-item">
      <span class="contact-icon">🌐</span>
      <div>
        <div class="contact-label">Online Tracking</div>
        <div class="contact-value"><a href="${FRONTEND_URL}/track">Track Your Shipment</a></div>
      </div>
    </div>
    <div class="contact-item">
      <span class="contact-icon">📍</span>
      <div>
        <div class="contact-label">Service Point</div>
        <div class="contact-value"><a href="${FRONTEND_URL}/locations">Find a Location</a></div>
      </div>
    </div>
  </div>
</div>`;

const shipmentTimeline = (pkg, currentStatus) => {
  const meta = getStatusMeta(currentStatus);
  const steps = [
    { key: 'pending', label: 'Shipment Info Received', desc: 'Electronic info submitted' },
    { key: 'in_transit', label: 'In Transit', desc: 'Moving through DHL network' },
    { key: 'arrived', label: 'At Destination', desc: 'Arrived at facility' },
    { key: 'delivered', label: 'Delivered', desc: 'Successfully delivered' },
  ];
  
  const currentStep = steps.findIndex(s => s.key === currentStatus);
  
  return `
<div class="section section-border">
  <div class="section-title">📋 Shipment Progress</div>
  <div class="timeline">
    ${steps.map((step, idx) => {
      let dotClass = 'timeline-dot';
      if (idx < currentStep) dotClass += ' completed';
      else if (idx === currentStep) dotClass += ' active';
      return `
    <div class="timeline-item">
      <div class="${dotClass}"></div>
      <div class="timeline-time">${idx <= currentStep ? formatDateShort(pkg.createdAt) : 'Pending'}</div>
      <div class="timeline-title">${step.label}</div>
      <div class="timeline-desc">${idx <= currentStep ? step.desc : 'Awaiting update'}</div>
    </div>`;
    }).join('')}
  </div>
</div>`;
};

const waybillDetails = (pkg) => {
  const serviceType = getServiceType(pkg);
  const pieces = getPieces(pkg);
  const dimensions = getDimensions(pkg);
  const weight = pkg.packageWeight || pkg.weight || 0;
  
  return `
<div class="waybill-box">
  <div class="waybill-header">📄 Waybill Details</div>
  <div class="waybill-content">
    <div class="waybill-row">
      <div class="waybill-cell">
        <div class="waybill-label">Tracking Number</div>
        <div class="waybill-value waybill-value-mono">${pkg.trackingCode}</div>
      </div>
      <div class="waybill-cell">
        <div class="waybill-label">Service</div>
        <div class="waybill-value">${serviceType}</div>
      </div>
    </div>
    <div class="waybill-row">
      <div class="waybill-cell">
        <div class="waybill-label">Pieces</div>
        <div class="waybill-value">${pieces} piece${pieces > 1 ? 's' : ''}</div>
      </div>
      <div class="waybill-cell">
        <div class="waybill-label">Weight</div>
        <div class="waybill-value">${weight} kg</div>
      </div>
    </div>
    <div class="waybill-row">
      <div class="waybill-cell">
        <div class="waybill-label">Dimensions</div>
        <div class="waybill-value">${dimensions}</div>
      </div>
      <div class="waybill-cell">
        <div class="waybill-label">Shipment Date</div>
        <div class="waybill-value">${formatDateShort(pkg.createdAt)}</div>
      </div>
    </div>
    <div class="waybill-row">
      <div class="waybill-cell">
        <div class="waybill-label">Origin</div>
        <div class="waybill-value">${pkg.senderCity}, ${pkg.senderCountry}</div>
      </div>
      <div class="waybill-cell">
        <div class="waybill-label">Destination</div>
        <div class="waybill-value">${pkg.receiverCity}, ${pkg.receiverCountry}</div>
      </div>
    </div>
    <div class="waybill-row">
      <div class="waybill-cell" style="flex: 2;">
        <div class="waybill-label">Shipper</div>
        <div class="waybill-value">${pkg.senderName}</div>
        <div class="info-value-light">${pkg.senderAddress}</div>
      </div>
      <div class="waybill-cell" style="flex: 2;">
        <div class="waybill-label">Receiver</div>
        <div class="waybill-value">${pkg.receiverName}</div>
        <div class="info-value-light">${pkg.receiverAddress}</div>
      </div>
    </div>
  </div>
</div>`;
};

const customsInfo = (pkg) => {
  const declaredValue = (pkg.deliveryPrice || 0) * 0.7;
  
  return `
<div class="section section-border">
  <div class="section-title">🛃 Customs Information</div>
  <table class="customs-table">
    <tr>
      <th>Description</th>
      <th>Quantity</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>${pkg.packageDescription || 'General Goods'}</td>
      <td>${getPieces(pkg)} piece(s)</td>
      <td>${formatCurrency(declaredValue)}</td>
    </tr>
    <tr>
      <td colspan="2" style="text-align: right; font-weight: 800; color: #6B7280;">Total Declared Value:</td>
      <td style="font-weight: 900; color: #D40511;">${formatCurrency(declaredValue)}</td>
    </tr>
  </table>
  <div class="info-box">
    <div class="info-text">
      <strong>Customs Notice:</strong> For international shipments, customs duties and taxes may apply based on the destination country's regulations. The recipient is responsible for any applicable charges. All required customs documentation is attached to the shipment.
    </div>
  </div>
</div>`;
};

// ─── Email: Shipment Created ────────────────────────────────────────────────

const sendShipmentCreatedEmail = async (pkg) => {
  const trackingUrl = `${FRONTEND_URL}/track/${pkg.trackingCode}`;
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const meta = getStatusMeta('pending');
  const estDelivery = getEstimatedDelivery(pkg);
  const serviceType = getServiceType(pkg);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${emailHead(`DHL Shipment Notification — ${pkg.trackingCode}`)}${emailStyles()}</head>
<body>
<div class="wrapper">
  <div class="container">
    ${dhlHeader()}
    
    <!-- Status Banner -->
    <div class="status-banner">
      <span class="status-icon">${meta.icon}</span>
      <div class="status-title">${meta.label}</div>
      <div class="status-desc">${meta.desc}</div>
    </div>
    
    <!-- Tracking Section -->
    <div class="tracking-section">
      <div class="tracking-label">DHL Express Tracking Number</div>
      <div class="tracking-code">${pkg.trackingCode}</div>
      <div class="tracking-sub">${serviceType} • Estimated Delivery: ${estDelivery}</div>
      <div style="margin-top: 20px;">
        <a href="${trackingUrl}" class="btn-primary">Track Shipment</a>
      </div>
    </div>
    
    <!-- Greeting -->
    <div class="section section-border">
      <div class="greeting-box">
        <div class="greeting">${greeting.full},</div>
        <div class="greeting-name">${pkg.receiverName}</div>
      </div>
      <p style="font-size: 15px; color: #374151; line-height: 1.7; margin: 0;">
        A shipment from <strong>${pkg.senderName}</strong> (${pkg.senderCity}, ${pkg.senderCountry}) is being sent to you via DHL Express. 
        We will notify you of any status updates as your shipment moves through our network.
      </p>
    </div>
    
    <!-- Waybill Details -->
    ${waybillDetails(pkg)}
    
    <!-- Shipment Timeline -->
    ${shipmentTimeline(pkg, 'pending')}
    
    <!-- Customs -->
    ${customsInfo(pkg)}
    
    <!-- Amount Due -->
    <div class="amount-section">
      <div class="amount-label">Shipping Charges Due</div>
      <div class="amount-value">${formatCurrency(pkg.deliveryPrice)}</div>
      <div class="amount-detail">Payment required before dispatch. Contact Customer Service to arrange payment.</div>
      <div style="margin-top: 16px;">
        <a href="${FRONTEND_URL}/payment/${pkg.trackingCode}" class="btn-secondary">Arrange Payment</a>
      </div>
    </div>
    
    <!-- Delivery Info -->
    <div class="section section-border">
      <div class="section-title">📦 Delivery Information</div>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Estimated Delivery</div>
          <div class="info-value">${estDelivery}</div>
          <div class="info-value-light">By end of business day</div>
        </div>
        <div class="info-card">
          <div class="info-label">Delivery Address</div>
          <div class="info-value">${pkg.receiverCity}, ${pkg.receiverCountry}</div>
          <div class="info-value-light">${pkg.receiverAddress}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Signature Required</div>
          <div class="info-value">Yes — Adult Signature</div>
          <div class="info-value-light">Valid ID required at delivery</div>
        </div>
        <div class="info-card">
          <div class="info-label">Delivery Options</div>
          <div class="info-value"><a href="${FRONTEND_URL}/manage/${pkg.trackingCode}" style="color: #D40511; text-decoration: none; font-weight: 800;">Manage Delivery</a></div>
          <div class="info-value-light">Redirect, hold, or reschedule</div>
        </div>
      </div>
      
      <div class="warning-box">
        <div class="warning-text">
          <strong>⚠️ Action Required:</strong> This shipment requires payment of shipping charges before dispatch. 
          Please contact our Customer Service team or use the payment link above to complete your payment and avoid delivery delays.
        </div>
      </div>
    </div>
    
    <!-- Contact -->
    ${contactSection()}
    
    ${dhlFooter()}
  </div>
</div>
</body>
</html>`;

  return await sendEmail(
    pkg.receiverEmail,
    `DHL Shipment Notification — ${pkg.trackingCode}`,
    html
  );
};

// ─── Email: Status Update ───────────────────────────────────────────────────

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  const trackingUrl = `${FRONTEND_URL}/track/${pkg.trackingCode}`;
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const meta = getStatusMeta(pkg.status);
  const oldMeta = getStatusMeta(oldStatus);
  const estDelivery = getEstimatedDelivery(pkg);

  // Build event log based on status
  const eventLog = [];
  const created = new Date(pkg.createdAt);
  
  eventLog.push({ time: created, location: pkg.senderCity + ', ' + pkg.senderCountry, event: 'Shipment information received', status: 'completed' });
  
  if (pkg.status !== 'pending' || pkg.movementProgress > 0) {
    const transitTime = new Date(created.getTime() + 24 * 60 * 60 * 1000);
    eventLog.push({ time: transitTime, location: 'DHL Sort Facility', event: 'Processed at DHL facility', status: 'completed' });
  }
  
  if (['arrived', 'delivered'].includes(pkg.status)) {
    const arriveTime = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
    eventLog.push({ time: arriveTime, location: pkg.receiverCity + ', ' + pkg.receiverCountry, event: 'Arrived at destination facility', status: 'completed' });
  }
  
  if (pkg.status === 'delivered') {
    const deliverTime = new Date(created.getTime() + 4 * 24 * 60 * 60 * 1000);
    eventLog.push({ time: deliverTime, location: pkg.receiverAddress, event: 'Delivered — Signed by ' + pkg.receiverName, status: 'completed' });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${emailHead(`DHL Status Update — ${meta.label} | ${pkg.trackingCode}`)}${emailStyles()}</head>
<body>
<div class="wrapper">
  <div class="container">
    ${dhlHeader()}
    
    <!-- Status Banner -->
    <div class="status-banner" style="background: ${meta.bg}; border-color: ${meta.border};">
      <span class="status-icon">${meta.icon}</span>
      <div class="status-title" style="color: ${meta.color};">${meta.label}</div>
      <div class="status-desc">${meta.desc}</div>
    </div>
    
    <!-- Tracking Section -->
    <div class="tracking-section">
      <div class="tracking-label">DHL Express Tracking Number</div>
      <div class="tracking-code">${pkg.trackingCode}</div>
      <div class="tracking-sub">Last Updated: ${formatDateShort(new Date())} at ${formatTime(new Date())}</div>
      <div style="margin-top: 20px;">
        <a href="${trackingUrl}" class="btn-primary">Track Live Status</a>
      </div>
    </div>
    
    <!-- Greeting -->
    <div class="section section-border">
      <div class="greeting-box" style="border-left-color: ${meta.color};">
        <div class="greeting">${greeting.full},</div>
      </div>
      <p style="font-size: 15px; color: #374151; line-height: 1.7; margin: 0;">
        There has been an update to your DHL Express shipment. Your shipment status has changed from 
        <strong>${oldMeta.label}</strong> to <strong style="color: ${meta.color};">${meta.label}</strong>.
      </p>
    </div>
    
    <!-- Status Comparison -->
    <div class="section section-border">
      <div class="section-title">📊 Status Change</div>
      <div style="display: flex; align-items: center; justify-content: center; gap: 24px; padding: 20px; background: #F8FAFC; border: 1px solid #E5E7EB;">
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #9CA3AF; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Previous</div>
          <div style="font-size: 14px; font-weight: 700; color: #6B7280;">${oldMeta.icon} ${oldMeta.label}</div>
        </div>
        <div style="font-size: 24px; color: #D40511; font-weight: 900;">→</div>
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Current</div>
          <div style="font-size: 14px; font-weight: 800; color: ${meta.color};">${meta.icon} ${meta.label}</div>
        </div>
      </div>
    </div>
    
    <!-- Shipment Timeline -->
    ${shipmentTimeline(pkg, pkg.status)}
    
    <!-- Event Log -->
    <div class="section section-border">
      <div class="section-title">📍 Shipment History</div>
      ${eventLog.map((event, idx) => `
      <div style="display: flex; align-items: flex-start; gap: 16px; padding: 14px 0; ${idx !== eventLog.length - 1 ? 'border-bottom: 1px solid #E5E7EB;' : ''}">
        <div style="min-width: 80px; text-align: right;">
          <div style="font-size: 12px; font-weight: 700; color: #1F2937;">${formatDateShort(event.time)}</div>
          <div style="font-size: 11px; color: #9CA3AF;">${formatTime(event.time)}</div>
        </div>
        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${event.status === 'completed' ? '#059669' : '#D1D5DB'}; margin-top: 6px; flex-shrink: 0;"></div>
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 700; color: #1F2937;">${event.event}</div>
          <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">${event.location}</div>
        </div>
      </div>
      `).join('')}
    </div>
        <!-- Waybill Details -->
    ${waybillDetails(pkg)}
    
    ${pkg.status === 'stopped' ? `
    <!-- Hold Notice -->
    <div class="section section-border">
      <div class="warning-box" style="background: #FEF2F2; border-left-color: #DC2626;">
        <div class="warning-text" style="color: #991B1B;">
          <strong>⚠️ Shipment on Hold</strong><br><br>
          Your shipment is currently on hold. This may be due to customs clearance, incomplete documentation, 
          or payment requirements. Please contact DHL Customer Service immediately with your tracking number 
          <strong>${pkg.trackingCode}</strong> to resolve this issue and prevent further delays.
          ${pkg.stopReason ? `<br><br><strong>Reason:</strong> ${pkg.stopReason}` : ''}
        </div>
      </div>
    </div>
    ` : ''}
    
    ${pkg.status === 'delivered' ? `
    <!-- Delivery Confirmation -->
    <div class="section section-border">
      <div style="background: linear-gradient(135deg, #ECFDF5, #D1FAE5); border: 2px solid #6EE7B7; padding: 28px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
        <div style="font-size: 20px; font-weight: 900; color: #065F46; text-transform: uppercase; letter-spacing: 2px;">Delivery Complete</div>
        <div style="font-size: 14px; color: #047857; margin-top: 8px; font-weight: 500;">
          Your shipment was delivered on ${formatDate(new Date())} at ${formatTime(new Date())}<br>
          Signed by: ${pkg.receiverName}
        </div>
        <div style="margin-top: 16px;">
          <a href="${FRONTEND_URL}/feedback/${pkg.trackingCode}" class="btn-secondary" style="border-color: #059669; color: #059669 !important;">Rate Your Delivery</a>
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Delivery Info -->
    <div class="section section-border">
      <div class="section-title">📦 Delivery Details</div>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Estimated Delivery</div>
          <div class="info-value">${pkg.status === 'delivered' ? 'Delivered' : estDelivery}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Receiver</div>
          <div class="info-value">${pkg.receiverName}</div>
          <div class="info-value-light">${pkg.receiverAddress}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Service Type</div>
          <div class="info-value">${getServiceType(pkg)}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Weight</div>
          <div class="info-value">${pkg.packageWeight || pkg.weight || 0} kg</div>
        </div>
      </div>
    </div>
    
    <!-- Contact -->
    ${contactSection()}
    
    ${dhlFooter()}
  </div>
</div>
</body>
</html>`;

  return await sendEmail(
    pkg.receiverEmail,
    `DHL Status Update: ${meta.label} — ${pkg.trackingCode}`,
    html
  );
};

// ─── Email: Payment Reminder ─────────────────────────────────────────────────

const sendPaymentReminderEmail = async (pkg) => {
  const trackingUrl = `${FRONTEND_URL}/track/${pkg.trackingCode}`;
  const greeting = getGreeting(pkg.receiverGender, pkg.receiverName);
  const daysElapsed = Math.floor((Date.now() - new Date(pkg.createdAt)) / 86400000);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${emailHead(`DHL Payment Reminder — ${pkg.trackingCode}`)}${emailStyles()}</head>
<body>
<div class="wrapper">
  <div class="container">
    ${dhlHeader()}
    
    <!-- Urgent Banner -->
    <div class="status-banner" style="background: linear-gradient(135deg, #FFFBEB, #FEF3C7); border-color: #F59E0B;">
      <span class="status-icon">💳</span>
      <div class="status-title" style="color: #92400E;">Payment Required</div>
      <div class="status-desc">Your shipment is awaiting payment confirmation before dispatch.</div>
    </div>
    
    <!-- Tracking Section -->
    <div class="tracking-section">
      <div class="tracking-label">DHL Express Tracking Number</div>
      <div class="tracking-code">${pkg.trackingCode}</div>
      <div class="tracking-sub">Shipment Created: ${formatDate(pkg.createdAt)}</div>
    </div>
    
    <!-- Greeting -->
    <div class="section section-border">
      <div class="greeting-box" style="border-left-color: #F59E0B;">
        <div class="greeting">${greeting.full},</div>
        <div class="greeting-name">${pkg.receiverName}</div>
      </div>
      <p style="font-size: 15px; color: #374151; line-height: 1.7; margin: 0;">
        This is a reminder that payment for your DHL Express shipment from <strong>${pkg.senderName}</strong> 
        is still pending. Your package will not be dispatched until shipping charges are settled.
      </p>
    </div>
    
    <!-- Amount Due -->
    <div class="amount-section" style="border-top-color: #F59E0B; border-bottom-color: #F59E0B;">
      <div class="amount-label">Outstanding Balance</div>
      <div class="amount-value">${formatCurrency(pkg.deliveryPrice)}</div>
      <div class="amount-detail">Days elapsed: ${daysElapsed} • Please arrange payment immediately</div>
      <div style="margin-top: 16px;">
        <a href="${FRONTEND_URL}/payment/${pkg.trackingCode}" class="btn-primary">Pay Now</a>
      </div>
    </div>
    
    <!-- Waybill -->
    ${waybillDetails(pkg)}
    
    <!-- Payment Instructions -->
    <div class="section section-border">
      <div class="section-title">💳 How to Pay</div>
      <div style="background: #F8FAFC; border: 1px solid #E5E7EB; padding: 24px;">
        <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2.2; font-weight: 500;">
          <li>Click the <strong>"Pay Now"</strong> button above or contact Customer Service</li>
          <li>Provide your tracking number: <strong style="color: #D40511; font-family: monospace;">${pkg.trackingCode}</strong></li>
          <li>Our team will guide you through the secure payment process</li>
          <li>Receive instant confirmation and dispatch notification</li>
        </ol>
      </div>
      
      <div class="warning-box" style="margin-top: 20px;">
        <div class="warning-text">
          <strong>⏰ Important Notice:</strong> Failure to complete payment within 7 days of shipment creation 
          may result in automatic cancellation and return of the shipment to the sender. 
          A cancellation fee may apply.
        </div>
      </div>
    </div>
    
    <!-- Contact -->
    ${contactSection()}
    
    ${dhlFooter()}
  </div>
</div>
</body>
</html>`;

  return await sendEmail(
    pkg.receiverEmail,
    `DHL Payment Reminder — ${pkg.trackingCode}`,
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
