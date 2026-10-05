const BRAND = {
  name: 'TRX Logistics',
  shortName: 'TRX',
  tagline: 'Fintech logistics for secure global movement',
  supportEmail: process.env.SUPPORT_EMAIL || process.env.TRX_SUPPORT_EMAIL || 'support@trxlogistics.com',
  replyToEmail: process.env.REPLY_TO_EMAIL || process.env.TRX_EMAIL || process.env.SUPPORT_EMAIL || 'support@trxlogistics.com',
  fromName: process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'TRX Logistics',
  logoUrl: process.env.EMAIL_LOGO_URL || process.env.TRX_LOGO_URL || '',
  primary: '#0B1020',
  secondary: '#00A6A6',
  accent: '#35E0A1',
  blue: '#2563EB',
  ink: '#111827',
  muted: '#64748B',
  soft: '#F4F8FB',
  line: '#DCE6EF',
};

const trxLogoSvg = (dark = false) => {
  const bg = dark ? BRAND.primary : '#ffffff';
  const text = dark ? '#ffffff' : BRAND.primary;
  return `
    <svg width="176" height="54" viewBox="0 0 176 54" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TRX Logistics">
      <rect width="176" height="54" rx="12" fill="${bg}"/>
      <path d="M20 15h34v8H42v20h-9V23H20v-8Z" fill="${BRAND.accent}"/>
      <path d="M60 15h21c7 0 12 4 12 10 0 4-2 7-6 9l8 9H84l-7-8h-8v8h-9V15Zm9 8v5h11c2 0 4-1 4-3s-2-2-4-2H69Z" fill="${text}"/>
      <path d="M99 15h11l8 9 8-9h11l-14 14 15 14h-12l-8-9-8 9H98l15-14-14-14Z" fill="${BRAND.secondary}"/>
      <text x="21" y="50" fill="${dark ? '#A7F3D0' : BRAND.muted}" font-family="Arial, Helvetica, sans-serif" font-size="8" font-weight="700" letter-spacing="2">LOGISTICS</text>
      <circle cx="151" cy="20" r="8" fill="${BRAND.accent}"/>
      <path d="M147 20h8m-4-4v8" stroke="${BRAND.primary}" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
};

const trxLogoDataUri = (dark = false) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(trxLogoSvg(dark).replace(/\s+/g, ' ').trim())}`;

module.exports = { BRAND, trxLogoSvg, trxLogoDataUri };
