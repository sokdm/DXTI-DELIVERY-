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

// Timeline configuration
const getTimeline = (currentStatus) => {
  const steps = [
    { key: 'created', label: 'Shipment Created', icon: '✓' },
    { key: 'pending', label: 'Payment Pending', icon: '●' },
    { key: 'in_transit', label: 'In Transit', icon: '○' },
    { key: 'arrived', label: 'Arrived at Destination', icon: '○' },
    { key: 'delivered', label: 'Delivered', icon: '○' },
  ];
  
  const statusMap = {
    pending: 1,
    in_transit: 2,
    arrived: 3,
    delivered: 4,
    stopped: -1,
  };
  
  const currentIndex = statusMap[currentStatus] || 0;
  
  return steps.map((step, index) => {
    if (index < currentIndex) {
      return { ...step, state: 'completed', icon: '✓' };
    } else if (index === currentIndex) {
      return { ...step, state: 'current', icon: '●' };
    } else {
      return { ...step, state: 'pending', icon: '○' };
    }
  });
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

// Template variables for shipment creation email
const buildShipmentTemplate = (vars) => {
  const {
    greeting,
    receiverName,
    trackingCode,
    packageName,
    packageWeight,
    deliveryPrice,
    senderName,
    senderEmail,
    senderPhone,
    senderAddress,
    senderCity,
    senderCountry,
    receiverEmail,
    receiverPhone,
    receiverAddress,
    receiverCity,
    receiverCountry,
    createdDate,
    createdTime,
    trackingUrl,
    receiptId,
  } = vars;

  const timeline = getTimeline('pending');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your DHL Shipment - ${trackingCode}</title>
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Base */
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333333; -webkit-font-smoothing: antialiased; }
    
    /* Container */
    .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    
    /* Header */
    .header { background-color: #D40511; padding: 30px 40px; text-align: left; }
    .header-content { display: flex; align-items: center; justify-content: space-between; }
    .logo { font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: 4px; }
    .logo-sub { color: #FFCC00; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .header-badge { background-color: #FFCC00; color: #D40511; padding: 6px 14px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    
    /* Hero */
    .hero { background-color: #fafafa; padding: 40px; text-align: center; border-bottom: 3px solid #FFCC00; }
    .hero-icon { font-size: 48px; margin-bottom: 15px; }
    .hero-title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
    .hero-text { font-size: 14px; color: #666666; max-width: 400px; margin: 0 auto; line-height: 1.6; }
    
    /* Tracking Card */
    .tracking-card { background-color: #ffffff; margin: -20px 30px 0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; position: relative; z-index: 2; border: 2px solid #FFCC00; }
    .tracking-label { font-size: 11px; color: #888888; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
    .tracking-code { font-size: 28px; font-weight: 900; color: #1a1a1a; letter-spacing: 3px; font-family: 'Courier New', monospace; margin-bottom: 8px; }
    .tracking-hint { font-size: 12px; color: #888888; }
    
    /* Timeline */
    .timeline-section { padding: 40px 30px 20px; }
    .timeline-title { font-size: 12px; color: #888888; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; text-align: center; }
    .timeline { display: flex; justify-content: space-between; align-items: flex-start; position: relative; }
    .timeline::before { content: ''; position: absolute; top: 14px; left: 10%; right: 10%; height: 2px; background-color: #e5e5e5; z-index: 0; }
    .timeline-step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; flex: 1; }
    .timeline-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
    .timeline-dot.completed { background-color: #10b981; color: #ffffff; }
    .timeline-dot.current { background-color: #D40511; color: #ffffff; box-shadow: 0 0 0 4px rgba(212,5,17,0.15); }
    .timeline-dot.pending { background-color: #e5e5e5; color: #999999; }
    .timeline-label { font-size: 10px; color: #666666; text-align: center; max-width: 80px; line-height: 1.3; font-weight: 500; }
    .timeline-label.current { color: #D40511; font-weight: 700; }
    
    /* Sections */
    .section { padding: 25px 30px; border-bottom: 1px solid #f0f0f0; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 12px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
    
    /* Info Grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
    .info-value { font-size: 13px; color: #1a1a1a; font-weight: 600; line-height: 1.4; }
    
    /* Summary Card */
    .summary-card { background-color: #fafafa; border-radius: 8px; padding: 20px; border-left: 4px solid #D40511; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eeeeee; }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { font-size: 12px; color: #666666; }
    .summary-value { font-size: 13px; color: #1a1a1a; font-weight: 700; }
    .summary-value.status { color: #D40511; text-transform: uppercase; letter-spacing: 0.5px; }
    
    /* Payment Card */
    .payment-card { background-color: #fffbeb; border-radius: 8px; padding: 20px; border: 1px solid #fbbf24; text-align: center; }
    .payment-status { font-size: 16px; font-weight: 800; color: #92400e; margin-bottom: 6px; }
    .payment-text { font-size: 13px; color: #a16207; line-height: 1.5; }
    
    /* Amount */
    .amount-section { text-align: center; padding: 30px; background-color: #fafafa; }
    .amount-label { font-size: 11px; color: #888888; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .amount-value { font-size: 36px; font-weight: 900; color: #D40511; letter-spacing: -1px; }
    
    /* CTA */
    .cta-section { padding: 30px; text-align: center; background-color: #ffffff; }
    .cta-button { display: inline-block; background-color: #D40511; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 6px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .cta-button:hover { background-color: #b0040e; }
    
    /* Reply */
    .reply-section { padding: 25px 30px; background-color: #f0f7ff; border-top: 1px solid #dbeafe; }
    .reply-text { font-size: 13px; color: #1e40af; text-align: center; line-height: 1.6; }
    .reply-text strong { color: #1e3a8a; }
    
    /* Footer */
    .footer { background-color: #1a1a1a; padding: 35px 30px; text-align: center; color: #999999; }
    .footer-logo { font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 4px; margin-bottom: 6px; }
    .footer-sub { color: #FFCC00; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
    .footer-links { margin-bottom: 20px; }
    .footer-links a { color: #cccccc; text-decoration: none; font-size: 12px; margin: 0 12px; }
    .footer-text { font-size: 11px; line-height: 1.6; margin-bottom: 6px; }
    .footer-divider { height: 1px; background-color: #333333; margin: 20px 0; }
    .footer-copyright { font-size: 10px; color: #666666; }
    
    /* DHL Stripe */
    .dhl-stripe { height: 6px; background: linear-gradient(90deg, #D40511 0%, #D40511 33%, #FFCC00 33%, #FFCC00 66%, #D40511 66%, #D40511 100%); }
    
    /* Mobile */
    @media screen and (max-width: 600px) {
      .header { padding: 20px 25px; }
      .hero { padding: 30px 25px; }
      .tracking-card { margin: -15px 20px 0; padding: 20px; }
      .tracking-code { font-size: 22px; letter-spacing: 2px; }
      .section { padding: 20px 25px; }
      .info-grid { grid-template-columns: 1fr; gap: 12px; }
      .timeline-label { font-size: 9px; max-width: 60px; }
      .timeline-dot { width: 24px; height: 24px; font-size: 10px; }
      .amount-value { font-size: 28px; }
      .cta-button { padding: 14px 36px; font-size: 14px; display: block; }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td>
        <div class="email-wrapper">
          
          <!-- DHL Stripe -->
          <div class="dhl-stripe"></div>
          
          <!-- Header -->
          <div class="header">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td>
                  <div class="logo">DHL</div>
                  <div class="logo-sub">Express Delivery Services</div>
                </td>
                <td align="right">
                  <div class="header-badge">Official</div>
                </td>
              </tr>
            </table>
          </div>
                    <!-- Hero -->
          <div class="hero">
            <div class="hero-icon">📦</div>
            <div class="hero-title">Your Shipment Has Been Registered</div>
            <div class="hero-text">${greeting} <strong>${receiverName}</strong>, your package has been successfully created and is now in our system.</div>
          </div>
          
          <!-- Tracking Card -->
          <div class="tracking-card">
            <div class="tracking-label">Tracking Number</div>
            <div class="tracking-code">${trackingCode}</div>
            <div class="tracking-hint">Use this number to monitor your shipment in real time</div>
          </div>
          
          <!-- Timeline -->
          <div class="timeline-section">
            <div class="timeline-title">Shipment Progress</div>
            <div class="timeline">
              ${timeline.map(step => `
              <div class="timeline-step">
                <div class="timeline-dot ${step.state}">${step.icon}</div>
                <div class="timeline-label ${step.state}">${step.label}</div>
              </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Shipment Details -->
          <div class="section">
            <div class="section-title">📋 Shipment Details</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Tracking Number</span>
                <span class="info-value" style="font-family:'Courier New',monospace;">${trackingCode}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Package Name</span>
                <span class="info-value">${packageName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Weight</span>
                <span class="info-value">${packageWeight} kg</span>
              </div>
              <div class="info-item">
                <span class="info-label">Shipping Cost</span>
                <span class="info-value">$${deliveryPrice.toFixed(2)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date Created</span>
                <span class="info-value">${createdDate} at ${createdTime}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Receipt ID</span>
                <span class="info-value" style="font-family:'Courier New',monospace;">${receiptId}</span>
              </div>
            </div>
          </div>
          
          <!-- Summary -->
          <div class="section">
            <div class="section-title">📊 Shipment Summary</div>
            <div class="summary-card">
              <div class="summary-row">
                <span class="summary-label">Current Status</span>
                <span class="summary-value status">Pending Payment</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Origin</span>
                <span class="summary-value">${senderCity}, ${senderCountry}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Destination</span>
                <span class="summary-value">${receiverCity}, ${receiverCountry}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Service Type</span>
                <span class="summary-value">Express International</span>
              </div>
            </div>
          </div>
          
          <!-- Sender Info -->
          <div class="section">
            <div class="section-title">📤 Sender Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">${senderName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${senderEmail}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone</span>
                <span class="info-value">${senderPhone}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value">${senderAddress}, ${senderCity}</span>
              </div>
            </div>
          </div>
          
          <!-- Receiver Info -->
          <div class="section">
            <div class="section-title">📥 Receiver Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">${receiverName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${receiverEmail}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone</span>
                <span class="info-value">${receiverPhone}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value">${receiverAddress}, ${receiverCity}</span>
              </div>
            </div>
          </div>
          
          <!-- Payment -->
          <div class="section">
            <div class="section-title">💳 Payment Status</div>
            <div class="payment-card">
              <div class="payment-status">⏳ Pending Payment</div>
              <div class="payment-text">Your shipment will begin processing immediately after payment confirmation. Please contact the sender to arrange payment.</div>
            </div>
          </div>
          
          <!-- Amount -->
          <div class="amount-section">
            <div class="amount-label">Total Amount Due</div>
            <div class="amount-value">$${deliveryPrice.toFixed(2)}</div>
          </div>
          
          <!-- CTA -->
          <div class="cta-section">
            <a href="${trackingUrl}/track/${trackingCode}" class="cta-button">Track Your Shipment</a>
          </div>
          
          <!-- Reply -->
          <div class="reply-section">
            <div class="reply-text">
              <strong>Need help?</strong> Reply directly to this email for payment arrangements, delivery confirmation, or any questions about your shipment. Our support team is here to assist you.
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">DHL</div>
            <div class="footer-sub">Express Delivery Services</div>
            <div class="footer-links">
              <a href="#">Support</a>
              <a href="#">Contact Us</a>
              <a href="#">Terms</a>
            </div>
            <div class="footer-text">Thank you for choosing DHL Express Delivery.</div>
            <div class="footer-text">Reliable shipping, delivered with care.</div>
            <div class="footer-divider"></div>
            <div class="footer-text">Customer Support: <a href="mailto:${EMAIL_FROM}" style="color:#FFCC00;">${EMAIL_FROM}</a></div>
            <div class="footer-copyright">© 2026 DHL Express Delivery Services. All rights reserved.<br>This is an automated email. Please reply if you require assistance.</div>
          </div>
          
          <div class="dhl-stripe"></div>
          
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Status update template
const buildStatusUpdateTemplate = (vars) => {
  const {
    greeting,
    receiverName,
    trackingCode,
    packageName,
    packageWeight,
    deliveryPrice,
    oldStatus,
    newStatus,
    senderCity,
    senderCountry,
    receiverCity,
    receiverCountry,
    trackingUrl,
  } = vars;

  const timeline = getTimeline(newStatus);
  
  const statusConfig = {
    pending: { color: '#f59e0b', bg: '#fffbeb', label: 'Pending Payment' },
    in_transit: { color: '#3b82f6', bg: '#eff6ff', label: 'In Transit' },
    arrived: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Arrived at Destination' },
    delivered: { color: '#10b981', bg: '#ecfdf5', label: 'Delivered' },
    stopped: { color: '#ef4444', bg: '#fef2f2', label: 'On Hold' },
  };
  
  const config = statusConfig[newStatus] || statusConfig.pending;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DHL Shipment Update - ${trackingCode}</title>
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333333; -webkit-font-smoothing: antialiased; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #D40511; padding: 30px 40px; }
    .logo { font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: 4px; }
    .logo-sub { color: #FFCC00; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .dhl-stripe { height: 6px; background: linear-gradient(90deg, #D40511 0%, #D40511 33%, #FFCC00 33%, #FFCC00 66%, #D40511 66%, #D40511 100%); }
    .content { padding: 40px; }
    .greeting { font-size: 16px; color: #666666; margin-bottom: 6px; }
    .receiver-name { font-size: 28px; font-weight: 900; color: #1a1a1a; margin-bottom: 25px; }
    .status-banner { background-color: ${config.bg}; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px; border: 2px solid ${config.color}; }
    .status-icon { font-size: 48px; margin-bottom: 12px; }
    .status-title { color: ${config.color}; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .status-message { color: #4b5563; font-size: 14px; line-height: 1.6; }
    .status-change { margin-top: 15px; }
    .old-badge { display: inline-block; background-color: #e5e7eb; color: #6b7280; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .arrow { color: #9ca3af; margin: 0 8px; font-size: 14px; }
    .new-badge { display: inline-block; background-color: ${config.color}; color: #ffffff; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .tracking-section { background-color: #fafafa; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 25px; }
    .tracking-label { font-size: 11px; color: #888888; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .tracking-code { font-size: 26px; font-weight: 900; color: #1a1a1a; letter-spacing: 3px; font-family: 'Courier New', monospace; }
    .summary { background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
    .summary-title { font-size: 12px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eeeeee; }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { font-size: 12px; color: #666666; }
    .summary-value { font-size: 13px; color: #1a1a1a; font-weight: 700; }
    .cta-section { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background-color: #D40511; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 6px; font-size: 15px; font-weight: 700; text-transform: uppercase; }
    .reply-section { padding: 20px; background-color: #f0f7ff; border-top: 1px solid #dbeafe; }
    .reply-text { font-size: 13px; color: #1e40af; text-align: center; }
    .footer { background-color: #1a1a1a; padding: 30px; text-align: center; color: #999999; }
    .footer-logo { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 4px; margin-bottom: 6px; }
    .footer-sub { color: #FFCC00; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; }
    .footer-text { font-size: 11px; line-height: 1.6; margin-bottom: 6px; }
    .footer-divider { height: 1px; background-color: #333333; margin: 15px 0; }
    .footer-copyright { font-size: 10px; color: #666666; }
    @media screen and (max-width: 600px) {
      .header, .content { padding: 25px; }
      .receiver-name { font-size: 24px; }
      .tracking-code { font-size: 20px; }
      .cta-button { display: block; padding: 14px 30px; }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td>
        <div class="email-wrapper">
          <div class="dhl-stripe"></div>
          <div class="header">
            <div class="logo">DHL</div>
            <div class="logo-sub">Express Delivery Services</div>
          </div>
          <div class="content">
            <div class="greeting">${greeting}</div>
            <div class="receiver-name">${receiverName}</div>
            
            <div class="status-banner">
              <div class="status-icon">📦</div>
              <div class="status-title">${newStatus.replace('_',' ').toUpperCase()}</div>
              <div class="status-message">Your shipment status has been updated. ${newStatus === 'in_transit' ? 'Your package is now on the move!' : newStatus === 'delivered' ? 'Your package has been successfully delivered!' : 'Please check the details below.'}</div>
              <div class="status-change">
                <span class="old-badge">${oldStatus.replace('_',' ').toUpperCase()}</span>
                <span class="arrow">→</span>
                <span class="new-badge">${newStatus.replace('_',' ').toUpperCase()}</span>
              </div>
            </div>
                      <div class="tracking-section">
              <div class="tracking-label">Tracking Number</div>
              <div class="tracking-code">${trackingCode}</div>
            </div>
            
            <div class="summary">
              <div class="summary-title">Shipment Summary</div>
              <div class="summary-row">
                <span class="summary-label">Package</span>
                <span class="summary-value">${packageName}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Weight</span>
                <span class="summary-value">${packageWeight} kg</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Amount</span>
                <span class="summary-value">$${deliveryPrice.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Route</span>
                <span class="summary-value">${senderCity} → ${receiverCity}</span>
              </div>
            </div>
            
            <div class="cta-section">
              <a href="${trackingUrl}/track/${trackingCode}" class="cta-button">Track Your Shipment</a>
            </div>
          </div>
          
          <div class="reply-section">
            <div class="reply-text"><strong>Questions?</strong> Reply to this email for any inquiries about your shipment.</div>
          </div>
          
          <div class="footer">
            <div class="footer-logo">DHL</div>
            <div class="footer-sub">Express Delivery Services</div>
            <div class="footer-text">Thank you for choosing DHL Express Delivery.</div>
            <div class="footer-divider"></div>
            <div class="footer-copyright">© 2026 DHL Express Delivery Services. All rights reserved.<br>This is an automated email. Please reply if you require assistance.</div>
          </div>
          <div class="dhl-stripe"></div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

  const templateVars = {
    greeting,
    receiverName: pkg.receiverName,
    trackingCode: pkg.trackingCode,
    packageName: pkg.packageName,
    packageWeight: pkg.packageWeight,
    deliveryPrice: pkg.deliveryPrice,
    senderName: pkg.senderName,
    senderEmail: pkg.senderEmail,
    senderPhone: pkg.senderPhone,
    senderAddress: pkg.senderAddress,
    senderCity: pkg.senderCity,
    senderCountry: pkg.senderCountry,
    receiverEmail: pkg.receiverEmail,
    receiverPhone: pkg.receiverPhone,
    receiverAddress: pkg.receiverAddress,
    receiverCity: pkg.receiverCity,
    receiverCountry: pkg.receiverCountry,
    createdDate,
    createdTime,
    trackingUrl,
    receiptId: pkg.receipt?.receiptId || 'N/A',
  };

  const html = buildShipmentTemplate(templateVars);
  await sendEmail(pkg.receiverEmail, `📦 DHL Shipment Created — Tracking: ${pkg.trackingCode}`, html);
};

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  console.log('📦 sendStatusUpdateEmail called for:', pkg.receiverEmail);
  
  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);

  const templateVars = {
    greeting,
    receiverName: pkg.receiverName,
    trackingCode: pkg.trackingCode,
    packageName: pkg.packageName,
    packageWeight: pkg.packageWeight,
    deliveryPrice: pkg.deliveryPrice,
    oldStatus,
    newStatus: pkg.status,
    senderCity: pkg.senderCity,
    senderCountry: pkg.senderCountry,
    receiverCity: pkg.receiverCity,
    receiverCountry: pkg.receiverCountry,
    trackingUrl,
  };

  const html = buildStatusUpdateTemplate(templateVars);
  await sendEmail(pkg.receiverEmail, `📦 DHL Shipment Update — ${pkg.status.replace('_',' ').toUpperCase()} | ${pkg.trackingCode}`, html);
};

module.exports = { sendShipmentCreatedEmail, sendStatusUpdateEmail };
