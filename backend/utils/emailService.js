const axios = require('axios');

const EMAIL_FROM = process.env.EMAIL_FROM || 'dhld5736@gmail.com';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

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

const sendEmail = async (to, subject, html) => {
  if (!BREVO_API_KEY) {
    console.log('⚠️ BREVO_API_KEY not set, skipping email');
    return { success: false, error: 'BREVO_API_KEY not set' };
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'DHL Express Delivery', email: EMAIL_FROM },
        to: [{ email: to }],
        replyTo: { email: EMAIL_FROM },
        subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Email sent to', to, 'MessageId:', response.data.messageId);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    const errMsg = error.response?.data?.message || error.response?.data || error.message;
    console.error('❌ Brevo error:', errMsg);
    return { success: false, error: errMsg };
  }
};

const sendShipmentCreatedEmail = async (pkg) => {
  const trackingUrl = process.env.FRONTEND_URL || 'https://dxti-delivery.onrender.com';
  const greeting = getGreeting(pkg.receiverGender);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your DHL Shipment Has Been Created</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <!-- DHL Stripe Top -->
          <tr>
            <td height="6" style="height:6px;background-color:#D40511;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td height="6" style="height:6px;background-color:#FFCC00;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td height="6" style="height:6px;background-color:#D40511;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#D40511;padding:45px 30px 35px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:42px;font-weight:900;color:#ffffff;letter-spacing:6px;font-family:Arial,Helvetica,sans-serif;">DHL</td>
                </tr>
                <tr>
                  <td style="font-size:13px;font-weight:700;color:#FFCC00;letter-spacing:4px;text-transform:uppercase;padding-top:8px;font-family:Arial,Helvetica,sans-serif;">Express Delivery Services</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- DHL Stripe Middle -->
          <tr>
            <td height="6" style="height:6px;background-color:#D40511;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td height="6" style="height:6px;background-color:#FFCC00;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td height="6" style="height:6px;background-color:#D40511;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:35px 30px;">
              <!-- Greeting Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;border-radius:12px;margin-bottom:25px;border-left:4px solid #D40511;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:20px;color:#1f2937;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${greeting}</td>
                      </tr>
                      <tr>
                        <td style="font-size:26px;font-weight:800;color:#D40511;padding-top:4px;font-family:Arial,Helvetica,sans-serif;">${pkg.receiverName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Ready Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#d4edda;border-radius:12px;margin-bottom:25px;border:2px solid #28a745;">
                <tr>
                  <td align="center" style="padding:18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:16px;font-weight:800;color:#155724;font-family:Arial,Helvetica,sans-serif;">Your Package is Ready for Shipping!</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#155724;padding-top:6px;font-family:Arial,Helvetica,sans-serif;">Sent by <strong>${pkg.senderName}</strong> from <strong>${pkg.senderCountry}</strong></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Pending Payment Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF8E1;border-radius:14px;margin-bottom:25px;border:2px solid #FFCC00;">
                <tr>
                  <td align="center" style="padding:22px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:16px;font-weight:800;color:#B8860B;font-family:Arial,Helvetica,sans-serif;">⏳ Pending Payment</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#B8860B;line-height:1.6;padding-top:10px;font-family:Arial,Helvetica,sans-serif;">Your shipment will begin processing immediately after payment confirmation.<br><strong>Reply to this email</strong> or <strong>message our support team</strong> to arrange payment and confirm delivery details.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Tracking Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF8E1;border-radius:14px;margin-bottom:25px;border:3px dashed #FFCC00;">
                <tr>
                  <td align="center" style="padding:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:11px;font-weight:800;color:#B8860B;text-transform:uppercase;letter-spacing:3px;font-family:Arial,Helvetica,sans-serif;">Tracking Number</td>
                      </tr>
                      <tr>
                        <td style="font-size:32px;font-weight:900;color:#1f2937;letter-spacing:4px;font-family:'Courier New',monospace;padding-top:8px;">${pkg.trackingCode}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Amount -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:25px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:36px;font-weight:900;color:#D40511;font-family:Arial,Helvetica,sans-serif;">$${pkg.deliveryPrice.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#B8860B;padding-top:4px;font-family:Arial,Helvetica,sans-serif;">Shipping Amount Due</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Track Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#D40511;border-radius:50px;">
                          <a href="${trackingUrl}/track/${pkg.trackingCode}" style="display:inline-block;background-color:#D40511;color:#ffffff;text-decoration:none;padding:18px 55px;border-radius:50px;font-size:17px;font-weight:800;font-family:Arial,Helvetica,sans-serif;">Track Your Shipment</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Reply Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e7f3ff;border-radius:8px;border:1px solid #b3d9ff;">
                <tr>
                  <td align="center" style="padding:14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:13px;font-weight:600;color:#004085;font-family:Arial,Helvetica,sans-serif;">📧 <strong>Reply to this email</strong> for payment arrangements and delivery confirmation.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f8f9fa;padding:30px;border-top:2px solid #dee2e6;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:20px;font-weight:900;color:#D40511;letter-spacing:4px;font-family:Arial,Helvetica,sans-serif;">DHL</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#6c757d;padding-top:4px;font-family:Arial,Helvetica,sans-serif;">Express Delivery</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#6c757d;padding-top:12px;font-family:Arial,Helvetica,sans-serif;">DHL Express Delivery Services &copy; 2026</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await sendEmail(pkg.receiverEmail, `📦 Your DHL Shipment Has Been Created — ${pkg.trackingCode}`, html);
};

const sendStatusUpdateEmail = async (pkg, oldStatus) => {
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

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>DHL Shipment Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#D40511;padding:40px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:36px;font-weight:900;color:#ffffff;letter-spacing:5px;font-family:Arial,Helvetica,sans-serif;">DHL</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:35px 30px;">
              <!-- Greeting -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:20px;color:#1f2937;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${greeting}</td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:800;color:#D40511;padding-top:6px;padding-bottom:20px;font-family:Arial,Helvetica,sans-serif;">${pkg.receiverName}</td>
                </tr>
              </table>
              <!-- Update Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF8E1;border-radius:14px;margin-bottom:25px;border:3px solid #FFCC00;">
                <tr>
                  <td align="center" style="padding:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:52px;text-align:center;font-family:Arial,Helvetica,sans-serif;">${icon}</td>
                      </tr>
                      <tr>
                        <td style="font-size:22px;font-weight:900;color:#1f2937;text-transform:uppercase;padding-top:12px;font-family:Arial,Helvetica,sans-serif;">${pkg.status.replace('_',' ').toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#4b5563;padding-top:8px;font-family:Arial,Helvetica,sans-serif;">${message}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Tracking -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:25px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:11px;font-weight:800;color:#B8860B;text-transform:uppercase;letter-spacing:3px;font-family:Arial,Helvetica,sans-serif;">Tracking Number</td>
                      </tr>
                      <tr>
                        <td style="font-size:24px;font-weight:900;color:#1f2937;letter-spacing:3px;font-family:'Courier New',monospace;padding-top:8px;">${pkg.trackingCode}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Track Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:15px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#D40511;border-radius:50px;">
                          <a href="${trackingUrl}/track/${pkg.trackingCode}" style="display:inline-block;background-color:#D40511;color:#ffffff;text-decoration:none;padding:16px 50px;border-radius:50px;font-size:16px;font-weight:800;font-family:Arial,Helvetica,sans-serif;">Track Your Shipment</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Reply Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e7f3ff;border-radius:8px;border:1px solid #b3d9ff;">
                <tr>
                  <td align="center" style="padding:14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:13px;font-weight:600;color:#004085;font-family:Arial,Helvetica,sans-serif;">📧 <strong>Reply to this email</strong> for any questions about your shipment.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f8f9fa;padding:30px;border-top:2px solid #dee2e6;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:20px;font-weight:900;color:#D40511;font-family:Arial,Helvetica,sans-serif;">DHL</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#6c757d;padding-top:12px;font-family:Arial,Helvetica,sans-serif;">DHL Express Delivery Services &copy; 2026</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return await sendEmail(pkg.receiverEmail, `${icon} DHL Shipment Update — ${pkg.status.replace('_',' ').toUpperCase()} | ${pkg.trackingCode}`, html);
};

module.exports = { sendShipmentCreatedEmail, sendStatusUpdateEmail };
