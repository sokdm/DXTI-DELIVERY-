const sgMail = require('@sendgrid/mail');

const EMAIL_FROM = process.env.EMAIL_FROM || 'dhld5736@gmail.com';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

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

const getTimeline = (currentStatus) => {
  const steps = [
    { key: 'created', label: 'Shipment<br>Created' },
    { key: 'pending', label: 'Payment<br>Pending' },
    { key: 'in_transit', label: 'In<br>Transit' },
    { key: 'arrived', label: 'Arrived at<br>Destination' },
    { key: 'delivered', label: 'Delivered' },
  ];
  
  const statusMap = { pending: 1, in_transit: 2, arrived: 3, delivered: 4, stopped: -1 };
  const currentIndex = statusMap[currentStatus] || 0;
  
  return steps.map((step, index) => {
    if (index < currentIndex) return { ...step, state: 'completed' };
    if (index === currentIndex) return { ...step, state: 'current' };
    return { ...step, state: 'pending' };
  });
};

const sendEmail = async (to, subject, html) => {
  console.log('📧 sendEmail called');
  console.log('   To:', to);
  console.log('   From:', EMAIL_FROM);
  console.log('   SENDGRID_API_KEY set:', !!SENDGRID_API_KEY);

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
    console.log('✅ Email sent to', to, 'Status:', response[0].statusCode);
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

const buildShipmentTemplate = (vars) => {
  const {
    greeting, receiverName, trackingCode, packageName, packageWeight,
    deliveryPrice, senderName, senderEmail, senderPhone, senderAddress,
    senderCity, senderCountry, receiverEmail, receiverPhone, receiverAddress,
    receiverCity, receiverCountry, createdDate, createdTime, trackingUrl, receiptId,
  } = vars;

  const timeline = getTimeline('pending');

  const timelineHTML = timeline.map((step, i) => {
    const isLast = i === timeline.length - 1;
    const dotColor = step.state === 'completed' ? '#10b981' : step.state === 'current' ? '#D40511' : '#d1d5db';
    const textColor = step.state === 'current' ? '#D40511' : step.state === 'completed' ? '#374151' : '#9ca3af';
    const fontWeight = step.state === 'current' ? '700' : '500';
    const dotContent = step.state === 'completed' ? '&#10003;' : step.state === 'current' ? '&#9679;' : '&#9675;';
    const dotSize = step.state === 'current' ? '32' : '28';
    const dotBorder = step.state === 'current' ? 'border: 3px solid #fecaca;' : '';
    
    return `
    <td align="center" valign="top" style="padding: 0 2px; width: 20%;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center">
            <div style="width: ${dotSize}px; height: ${dotSize}px; background-color: ${dotColor}; border-radius: 50%; display: inline-block; line-height: ${dotSize}px; text-align: center; color: #ffffff; font-size: 14px; font-weight: bold; ${dotBorder}">
              ${step.state === 'completed' ? '&#10003;' : ''}
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 8px;">
            <span style="font-size: 10px; color: ${textColor}; font-weight: ${fontWeight}; line-height: 1.4; display: block;">${step.label}</span>
          </td>
        </tr>
      </table>
    </td>
    ${!isLast ? `
    <td align="center" valign="top" style="padding-top: 12px; width: 5%;">
      <div style="width: 100%; height: 2px; background-color: ${step.state === 'completed' ? '#10b981' : '#e5e7eb'};"></div>
    </td>` : ''}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your DHL Shipment - ${trackingCode}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 0; background-color: #f3f4f6 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #1f2937; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff !important; }
    .header { background-color: #D40511 !important; padding: 24px 32px; }
    .logo { font-size: 32px; font-weight: 900; color: #ffffff !important; letter-spacing: 4px; }
    .logo-sub { color: #FFCC00 !important; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .hero { background-color: #fafafa !important; padding: 32px; text-align: center; border-bottom: 3px solid #FFCC00; }
    .hero-title { font-size: 22px; font-weight: 800; color: #111827 !important; margin-bottom: 12px; }
    .hero-text { font-size: 14px; color: #4b5563 !important; line-height: 1.6; }
    .tracking-box { background-color: #ffffff !important; margin: -16px 24px 0; padding: 24px; border-radius: 12px; border: 2px solid #FFCC00; text-align: center; position: relative; z-index: 2; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .tracking-label { font-size: 11px; color: #6b7280 !important; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .tracking-code { font-size: 26px; font-weight: 900; color: #111827 !important; letter-spacing: 3px; font-family: 'Courier New', monospace; }
    .tracking-hint { font-size: 12px; color: #6b7280 !important; margin-top: 8px; }
    .section { padding: 24px 32px; border-bottom: 1px solid #e5e7eb; }
    .section-title { font-size: 13px; color: #D40511 !important; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 11px; color: #6b7280 !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
    .info-value { font-size: 14px; color: #111827 !important; font-weight: 600; }
    .summary-box { background-color: #f9fafb !important; border-radius: 10px; padding: 20px; border-left: 4px solid #D40511; }
    .summary-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { font-size: 13px; color: #4b5563 !important; }
    .summary-value { font-size: 14px; color: #111827 !important; font-weight: 700; }
    .summary-value.status { color: #D40511 !important; font-weight: 800; text-transform: uppercase; }
    .payment-box { background-color: #fffbeb !important; border-radius: 10px; padding: 20px; border: 1px solid #fbbf24; text-align: center; }
    .payment-status { font-size: 16px; font-weight: 800; color: #92400e !important; margin-bottom: 6px; }
    .payment-text { font-size: 13px; color: #a16207 !important; line-height: 1.5; }
    .amount-box { text-align: center; padding: 28px; background-color: #fafafa !important; }
    .amount-label { font-size: 11px; color: #6b7280 !important; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .amount-value { font-size: 36px; font-weight: 900; color: #D40511 !important; letter-spacing: -1px; }
    .cta-box { text-align: center; padding: 24px 32px; }
    .cta-button { display: inline-block; background-color: #D40511 !important; color: #ffffff !important; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .reply-box { padding: 20px 32px; background-color: #eff6ff !important; border-top: 1px solid #bfdbfe; }
    .reply-text { font-size: 13px; color: #1e40af !important; text-align: center; line-height: 1.6; }
    .footer { background-color: #111827 !important; padding: 32px; text-align: center; color: #9ca3af !important; }
    .footer-logo { font-size: 24px; font-weight: 900; color: #ffffff !important; letter-spacing: 4px; margin-bottom: 4px; }
    .footer-sub { color: #FFCC00 !important; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
    .footer-text { font-size: 12px; line-height: 1.6; margin-bottom: 4px; color: #d1d5db !important; }
    .footer-divider { height: 1px; background-color: #374151; margin: 16px 0; }
    .footer-copyright { font-size: 11px; color: #6b7280 !important; }
    .dhl-stripe { height: 6px; background: linear-gradient(90deg, #D40511 0%, #D40511 33%, #FFCC00 33%, #FFCC00 66%, #D40511 66%, #D40511 100%); }
    @media screen and (max-width: 600px) {
      .header, .hero, .section, .cta-box, .reply-box, .footer { padding-left: 20px !important; padding-right: 20px !important; }
      .tracking-box { margin: -16px 16px 0 !important; padding: 20px !important; }
      .tracking-code { font-size: 22px !important; letter-spacing: 2px !important; }
      .amount-value { font-size: 30px !important; }
      .cta-button { display: block !important; padding: 16px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="wrapper" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          
          <!-- DHL Stripe -->
          <tr><td><div class="dhl-stripe"></div></td></tr>
          
          <!-- Header -->
          <tr>
            <td class="header" style="background-color: #D40511; padding: 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div class="logo" style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: 4px;">DHL</div>
                    <div class="logo-sub" style="color: #FFCC00; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Express Delivery Services</div>
                  </td>
                  <td align="right">
                    <span style="background-color: #FFCC00; color: #D40511; padding: 6px 14px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Official</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Hero -->
          <tr>
            <td class="hero" style="background-color: #fafafa; padding: 32px; text-align: center; border-bottom: 3px solid #FFCC00;">
              <div style="font-size: 40px; margin-bottom: 12px;">&#128230;</div>
              <div class="hero-title" style="font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 12px;">Your Shipment Has Been Registered</div>
              <div class="hero-text" style="font-size: 14px; color: #4b5563; line-height: 1.6;">
                <strong>${greeting} ${receiverName}</strong><br>
                Your package has been successfully created and is now in our system.
              </div>
            </td>
          </tr>
          
          <!-- Tracking Card -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 0 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; border: 2px solid #FFCC00; margin-top: -16px; position: relative; z-index: 2; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <div style="font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Tracking Number</div>
                          <div style="font-size: 26px; font-weight: 900; color: #111827; letter-spacing: 3px; font-family: 'Courier New', monospace;">${trackingCode}</div>
                          <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">Use this number to monitor your shipment in real time</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Timeline -->
          <tr>
            <td style="padding: 32px 24px 16px;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; text-align: center;">Shipment Progress</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  ${timelineHTML}
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Shipment Details -->
          <tr>
            <td class="section" style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <div class="section-title" style="font-size: 13px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">&#128203; Shipment Details</div>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Tracking Number</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600; font-family: 'Courier New', monospace;">${trackingCode}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Package Name</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${packageName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Weight</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${packageWeight} kg</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Shipping Cost</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">$${deliveryPrice.toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Date Created</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${createdDate} at ${createdTime}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Receipt ID</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600; font-family: 'Courier New', monospace;">${receiptId}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Summary -->
          <tr>
            <td class="section" style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <div class="section-title" style="font-size: 13px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">&#128202; Shipment Summary</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 10px; border-left: 4px solid #D40511;">
                <tr><td style="padding: 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td><span style="font-size: 13px; color: #4b5563;">Current Status</span></td>
                            <td align="right"><span style="font-size: 14px; color: #D40511; font-weight: 800; text-transform: uppercase;">Pending Payment</span></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td><span style="font-size: 13px; color: #4b5563;">Origin</span></td>
                            <td align="right"><span style="font-size: 14px; color: #111827; font-weight: 700;">${senderCity}, ${senderCountry}</span></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td><span style="font-size: 13px; color: #4b5563;">Destination</span></td>
                            <td align="right"><span style="font-size: 14px; color: #111827; font-weight: 700;">${receiverCity}, ${receiverCountry}</span></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td><span style="font-size: 13px; color: #4b5563;">Service Type</span></td>
                            <td align="right"><span style="font-size: 14px; color: #111827; font-weight: 700;">Express International</span></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>
          
          <!-- Sender Info -->
          <tr>
            <td class="section" style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <div class="section-title" style="font-size: 13px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">&#128228; Sender Information</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Name</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${senderName}</span>
                  </td>
                  <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Email</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${senderEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Phone</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${senderPhone}</span>
                  </td>
                  <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Address</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${senderAddress}, ${senderCity}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Receiver Info -->
          <tr>
            <td class="section" style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <div class="section-title" style="font-size: 13px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">&#128229; Receiver Information</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Name</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${receiverName}</span>
                  </td>
                  <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Email</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${receiverEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Phone</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${receiverPhone}</span>
                  </td>
                  <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Address</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 600;">${receiverAddress}, ${receiverCity}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Payment -->
          <tr>
            <td class="section" style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <div class="section-title" style="font-size: 13px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">&#128179; Payment Status</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fffbeb; border-radius: 10px; border: 1px solid #fbbf24;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 16px; font-weight: 800; color: #92400e; margin-bottom: 6px;">&#9203; Pending Payment</div>
                    <div style="font-size: 13px; color: #a16207; line-height: 1.5;">Your shipment will begin processing immediately after payment confirmation. Please contact the sender to arrange payment.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Amount -->
          <tr>
            <td style="padding: 28px 32px; text-align: center; background-color: #fafafa;">
              <div style="font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Total Amount Due</div>
              <div style="font-size: 36px; font-weight: 900; color: #D40511; letter-spacing: -1px;">$${deliveryPrice.toFixed(2)}</div>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td class="cta-box" style="padding: 24px 32px; text-align: center;">
              <div style="font-size: 15px; color: #4b5563; font-weight: 600; margin-bottom: 20px; line-height: 1.6;">
                Track your shipment in real-time to see live updates on location, status changes, and estimated delivery time.
              </div>
              <a href="${trackingUrl}/track/${trackingCode}" style="display: inline-block; background-color: #D40511; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Track Your Shipment &#8594;</a>
            </td>
          </tr>
          
          <!-- Reply -->
          <tr>
            <td class="reply-box" style="padding: 20px 32px; background-color: #eff6ff; border-top: 1px solid #bfdbfe;">
              <div style="font-size: 13px; color: #1e40af; text-align: center; line-height: 1.6;">
                <strong>Need help?</strong> Reply directly to this email for payment arrangements, delivery confirmation, or any questions about your shipment. Our support team is ready to assist you.
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer" style="background-color: #111827; padding: 32px; text-align: center; color: #9ca3af;">
              <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 4px; margin-bottom: 4px;">DHL</div>
              <div style="color: #FFCC00; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;">Express Delivery Services</div>
              <div style="font-size: 12px; line-height: 1.6; margin-bottom: 4px; color: #d1d5db;">Thank you for choosing DHL Express Delivery.</div>
              <div style="font-size: 12px; line-height: 1.6; margin-bottom: 4px; color: #d1d5db;">Reliable shipping, delivered with care.</div>
              <div style="height: 1px; background-color: #374151; margin: 16px 0;"></div>
              <div style="font-size: 11px; color: #d1d5db; margin-bottom: 4px;">Customer Support: <a href="mailto:${EMAIL_FROM}" style="color: #FFCC00; text-decoration: none;">${EMAIL_FROM}</a></div>
              <div style="font-size: 10px; color: #6b7280; line-height: 1.5;">
                &copy; 2026 DHL Express Delivery Services. All rights reserved.<br>
                This is an automated email. Please reply if you require assistance.
              </div>
            </td>
          </tr>
          
          <tr><td><div class="dhl-stripe"></div></td></tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
const buildStatusUpdateTemplate = (vars) => {
  const {
    greeting, receiverName, trackingCode, packageName, packageWeight,
    deliveryPrice, oldStatus, newStatus, senderCity, senderCountry,
    receiverCity, receiverCountry, trackingUrl,
  } = vars;

  const timeline = getTimeline(newStatus);
  const statusConfig = {
    pending: { color: '#D40511', bg: '#fef2f2', label: 'Pending Payment', icon: '&#9203;' },
    in_transit: { color: '#2563eb', bg: '#eff6ff', label: 'In Transit', icon: '&#128666;' },
    arrived: { color: '#7c3aed', bg: '#f5f3ff', label: 'Arrived', icon: '&#128205;' },
    delivered: { color: '#059669', bg: '#ecfdf5', label: 'Delivered', icon: '&#9989;' },
    stopped: { color: '#dc2626', bg: '#fef2f2', label: 'On Hold', icon: '&#9888;' },
  };
  const config = statusConfig[newStatus] || statusConfig.pending;

  const timelineHTML = timeline.map((step, i) => {
    const isLast = i === timeline.length - 1;
    const dotColor = step.state === 'completed' ? '#10b981' : step.state === 'current' ? config.color : '#d1d5db';
    const textColor = step.state === 'current' ? config.color : step.state === 'completed' ? '#374151' : '#9ca3af';
    const fontWeight = step.state === 'current' ? '700' : '500';
    const dotSize = step.state === 'current' ? '32' : '28';
    const dotBorder = step.state === 'current' ? `border: 3px solid ${config.bg};` : '';
    
    return `
    <td align="center" valign="top" style="padding: 0 2px; width: 20%;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center">
            <div style="width: ${dotSize}px; height: ${dotSize}px; background-color: ${dotColor}; border-radius: 50%; display: inline-block; line-height: ${dotSize}px; text-align: center; color: #ffffff; font-size: 14px; font-weight: bold; ${dotBorder}">
              ${step.state === 'completed' ? '&#10003;' : ''}
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 8px;">
            <span style="font-size: 10px; color: ${textColor}; font-weight: ${fontWeight}; line-height: 1.4; display: block;">${step.label}</span>
          </td>
        </tr>
      </table>
    </td>
    ${!isLast ? `
    <td align="center" valign="top" style="padding-top: 12px; width: 5%;">
      <div style="width: 100%; height: 2px; background-color: ${step.state === 'completed' ? '#10b981' : '#e5e7eb'};"></div>
    </td>` : ''}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>DHL Shipment Update - ${trackingCode}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 0; background-color: #f3f4f6 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #1f2937; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff !important; }
    .header { background-color: #D40511 !important; padding: 24px 32px; }
    .logo { font-size: 32px; font-weight: 900; color: #ffffff !important; letter-spacing: 4px; }
    .logo-sub { color: #FFCC00 !important; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 32px; }
    .greeting { font-size: 16px; color: #6b7280 !important; margin-bottom: 6px; }
    .receiver-name { font-size: 28px; font-weight: 900; color: #111827 !important; margin-bottom: 20px; }
    .status-banner { background-color: ${config.bg} !important; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px; border: 2px solid ${config.color}; }
    .status-icon { font-size: 48px; margin-bottom: 12px; }
    .status-title { color: ${config.color} !important; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .status-message { color: #4b5563 !important; font-size: 14px; line-height: 1.6; }
    .old-badge { display: inline-block; background-color: #e5e7eb; color: #6b7280; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .arrow { color: #9ca3af; margin: 0 8px; font-size: 14px; }
    .new-badge { display: inline-block; background-color: ${config.color} !important; color: #ffffff !important; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .tracking-box { background-color: #fafafa !important; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .tracking-label { font-size: 11px; color: #6b7280 !important; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .tracking-code { font-size: 24px; font-weight: 900; color: #111827 !important; letter-spacing: 3px; font-family: 'Courier New', monospace; }
    .summary { background-color: #f9fafb !important; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .summary-title { font-size: 12px; color: #D40511 !important; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
    .summary-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { font-size: 12px; color: #4b5563 !important; }
    .summary-value { font-size: 13px; color: #111827 !important; font-weight: 700; }
    .cta-box { text-align: center; margin: 24px 0; }
    .cta-button { display: inline-block; background-color: #D40511 !important; color: #ffffff !important; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; text-transform: uppercase; }
    .reply-box { padding: 20px 32px; background-color: #eff6ff !important; border-top: 1px solid #bfdbfe; }
    .reply-text { font-size: 13px; color: #1e40af !important; text-align: center; }
    .footer { background-color: #111827 !important; padding: 32px; text-align: center; color: #9ca3af !important; }
    .footer-logo { font-size: 22px; font-weight: 900; color: #ffffff !important; letter-spacing: 4px; margin-bottom: 4px; }
    .footer-sub { color: #FFCC00 !important; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; }
    .footer-text { font-size: 11px; line-height: 1.6; margin-bottom: 4px; color: #d1d5db !important; }
    .footer-divider { height: 1px; background-color: #374151; margin: 15px 0; }
    .footer-copyright { font-size: 10px; color: #6b7280 !important; }
    .dhl-stripe { height: 6px; background: linear-gradient(90deg, #D40511 0%, #D40511 33%, #FFCC00 33%, #FFCC00 66%, #D40511 66%, #D40511 100%); }
    @media screen and (max-width: 600px) {
      .header, .content, .reply-box, .footer { padding-left: 20px !important; padding-right: 20px !important; }
      .tracking-code { font-size: 20px !important; letter-spacing: 2px !important; }
      .receiver-name { font-size: 24px !important; }
      .cta-button { display: block !important; padding: 16px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="wrapper" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr><td><div class="dhl-stripe"></div></td></tr>
          
          <tr>
            <td class="header" style="background-color: #D40511; padding: 24px 32px;">
              <div style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: 4px;">DHL</div>
              <div style="color: #FFCC00; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Express Delivery Services</div>
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 32px;">
              <div style="font-size: 16px; color: #6b7280; margin-bottom: 6px;">${greeting}</div>
              <div style="font-size: 28px; font-weight: 900; color: #111827; margin-bottom: 20px;">${receiverName}</div>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${config.bg}; border-radius: 12px; border: 2px solid ${config.color}; margin-bottom: 24px;">
                <tr><td style="padding: 32px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 12px;">${config.icon}</div>
                  <div style="color: ${config.color}; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${newStatus.replace('_',' ').toUpperCase()}</div>
                  <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                    ${newStatus === 'in_transit' ? 'Your package is now on the move!' : newStatus === 'delivered' ? 'Your package has been successfully delivered!' : 'Your shipment status has been updated.'}
                  </div>
                  <div style="margin-top: 15px;">
                    <span style="display: inline-block; background-color: #e5e7eb; color: #6b7280; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${oldStatus.replace('_',' ').toUpperCase()}</span>
                    <span style="color: #9ca3af; margin: 0 8px; font-size: 14px;">&#8594;</span>
                    <span style="display: inline-block; background-color: ${config.color}; color: #ffffff; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${newStatus.replace('_',' ').toUpperCase()}</span>
                  </div>
                </td></tr>
              </table>
              
              <!-- Timeline -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr><td style="font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; text-align: center; display: block;">Shipment Progress</td></tr>
                <tr>
                  ${timelineHTML}
                </tr>
              </table>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafafa; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
                <tr><td>
                  <div style="font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; text-align: center;">Tracking Number</div>
                  <div style="font-size: 24px; font-weight: 900; color: #111827; letter-spacing: 3px; font-family: 'Courier New', monospace; text-align: center;">${trackingCode}</div>
                </td></tr>
              </table>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 10px; margin-bottom: 24px;">
                <tr><td style="padding: 20px;">
                  <div style="font-size: 12px; color: #D40511; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Shipment Summary</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr><td><span style="font-size: 12px; color: #4b5563;">Package</span></td><td align="right"><span style="font-size: 13px; color: #111827; font-weight: 700;">${packageName}</span></td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr><td><span style="font-size: 12px; color: #4b5563;">Weight</span></td><td align="right"><span style="font-size: 13px; color: #111827; font-weight: 700;">${packageWeight} kg</span></td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr><td><span style="font-size: 12px; color: #4b5563;">Amount</span></td><td align="right"><span style="font-size: 13px; color: #111827; font-weight: 700;">$${deliveryPrice.toFixed(2)}</span></td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr><td><span style="font-size: 12px; color: #4b5563;">Route</span></td><td align="right"><span style="font-size: 13px; color: #111827; font-weight: 700;">${senderCity} &#8594; ${receiverCity}</span></td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
              
              <div class="cta-box" style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}/track/${trackingCode}" style="display: inline-block; background-color: #D40511; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; text-transform: uppercase;">Track Your Shipment &#8594;</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td class="reply-box" style="padding: 20px 32px; background-color: #eff6ff; border-top: 1px solid #bfdbfe;">
              <div style="font-size: 13px; color: #1e40af; text-align: center; line-height: 1.6;"><strong>Questions?</strong> Reply to this email for any inquiries about your shipment.</div>
            </td>
          </tr>
          
          <tr>
            <td class="footer" style="background-color: #111827; padding: 32px; text-align: center; color: #9ca3af;">
              <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 4px; margin-bottom: 4px;">DHL</div>
              <div style="color: #FFCC00; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px;">Express Delivery Services</div>
              <div style="font-size: 11px; line-height: 1.6; margin-bottom: 4px; color: #d1d5db;">Thank you for choosing DHL Express Delivery.</div>
              <div style="height: 1px; background-color: #374151; margin: 15px 0;"></div>
              <div style="font-size: 10px; color: #6b7280;">&copy; 2026 DHL Express Delivery Services. All rights reserved.<br>This is an automated email. Please reply if you require assistance.</div>
            </td>
          </tr>
          
          <tr><td><div class="dhl-stripe"></div></td></tr>
        </table>
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
    greeting, receiverName: pkg.receiverName, trackingCode: pkg.trackingCode,
    packageName: pkg.packageName, packageWeight: pkg.packageWeight, deliveryPrice: pkg.deliveryPrice,
    senderName: pkg.senderName, senderEmail: pkg.senderEmail, senderPhone: pkg.senderPhone,
    senderAddress: pkg.senderAddress, senderCity: pkg.senderCity, senderCountry: pkg.senderCountry,
    receiverEmail: pkg.receiverEmail, receiverPhone: pkg.receiverPhone,
    receiverAddress: pkg.receiverAddress, receiverCity: pkg.receiverCity, receiverCountry: pkg.receiverCountry,
    createdDate, createdTime, trackingUrl, receiptId: pkg.receipt?.receiptId || 'N/A',
  };

  const html = buildShipmentTemplate(templateVars);
  await sendEmail(pkg.receiverEmail, `📦 DHL Shipment Created — Tracking: ${pkg.trackingCode}`, html);
};

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
  console.log('📦 sendStatusUpdateEmail called for:', pkg.receiverEmail);
  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);

  const templateVars = {
    greeting, receiverName: pkg.receiverName, trackingCode: pkg.trackingCode,
    packageName: pkg.packageName, packageWeight: pkg.packageWeight, deliveryPrice: pkg.deliveryPrice,
    oldStatus, newStatus: pkg.status,
    senderCity: pkg.senderCity, senderCountry: pkg.senderCountry,
    receiverCity: pkg.receiverCity, receiverCountry: pkg.receiverCountry, trackingUrl,
  };

  const html = buildStatusUpdateTemplate(templateVars);
  await sendEmail(pkg.receiverEmail, `📦 DHL Shipment Update — ${pkg.status.replace('_',' ').toUpperCase()} | ${pkg.trackingCode}`, html);
};

module.exports = { sendShipmentCreatedEmail, sendStatusUpdateEmail };
