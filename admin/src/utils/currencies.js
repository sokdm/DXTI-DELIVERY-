const currencyCountries = [
  ['Afghanistan', 'AFN'], ['Albania', 'ALL'], ['Algeria', 'DZD'], ['Argentina', 'ARS'],
  ['Armenia', 'AMD'], ['Australia', 'AUD'], ['Austria', 'EUR'], ['Azerbaijan', 'AZN'],
  ['Bahamas', 'BSD'], ['Bahrain', 'BHD'], ['Bangladesh', 'BDT'], ['Barbados', 'BBD'],
  ['Belarus', 'BYN'], ['Belgium', 'EUR'], ['Belize', 'BZD'], ['Benin', 'XOF'],
  ['Bolivia', 'BOB'], ['Bosnia and Herzegovina', 'BAM'], ['Botswana', 'BWP'], ['Brazil', 'BRL'],
  ['Bulgaria', 'BGN'], ['Burkina Faso', 'XOF'], ['Cambodia', 'KHR'], ['Cameroon', 'XAF'],
  ['Canada', 'CAD'], ['Chile', 'CLP'], ['China', 'CNY'], ['Colombia', 'COP'],
  ['Costa Rica', 'CRC'], ['Croatia', 'EUR'], ['Cyprus', 'EUR'], ['Czech Republic', 'CZK'],
  ['Denmark', 'DKK'], ['Dominican Republic', 'DOP'], ['Ecuador', 'USD'], ['Egypt', 'EGP'],
  ['Estonia', 'EUR'], ['Ethiopia', 'ETB'], ['Finland', 'EUR'], ['France', 'EUR'],
  ['Georgia', 'GEL'], ['Germany', 'EUR'], ['Ghana', 'GHS'], ['Greece', 'EUR'],
  ['Guatemala', 'GTQ'], ['Hong Kong', 'HKD'], ['Hungary', 'HUF'], ['Iceland', 'ISK'],
  ['India', 'INR'], ['Indonesia', 'IDR'], ['Ireland', 'EUR'], ['Israel', 'ILS'],
  ['Italy', 'EUR'], ['Jamaica', 'JMD'], ['Japan', 'JPY'], ['Jordan', 'JOD'],
  ['Kazakhstan', 'KZT'], ['Kenya', 'KES'], ['Kuwait', 'KWD'], ['Latvia', 'EUR'],
  ['Lebanon', 'LBP'], ['Lithuania', 'EUR'], ['Luxembourg', 'EUR'], ['Malaysia', 'MYR'],
  ['Malta', 'EUR'], ['Mexico', 'MXN'], ['Morocco', 'MAD'], ['Netherlands', 'EUR'],
  ['New Zealand', 'NZD'], ['Nigeria', 'NGN'], ['Norway', 'NOK'], ['Oman', 'OMR'],
  ['Pakistan', 'PKR'], ['Panama', 'PAB'], ['Peru', 'PEN'], ['Philippines', 'PHP'],
  ['Poland', 'PLN'], ['Portugal', 'EUR'], ['Qatar', 'QAR'], ['Romania', 'RON'],
  ['Saudi Arabia', 'SAR'], ['Senegal', 'XOF'], ['Serbia', 'RSD'], ['Singapore', 'SGD'],
  ['Slovakia', 'EUR'], ['Slovenia', 'EUR'], ['South Africa', 'ZAR'], ['South Korea', 'KRW'],
  ['Spain', 'EUR'], ['Sri Lanka', 'LKR'], ['Sweden', 'SEK'], ['Switzerland', 'CHF'],
  ['Taiwan', 'TWD'], ['Tanzania', 'TZS'], ['Thailand', 'THB'], ['Tunisia', 'TND'],
  ['Turkey', 'TRY'], ['Uganda', 'UGX'], ['Ukraine', 'UAH'], ['United Arab Emirates', 'AED'],
  ['United Kingdom', 'GBP'], ['United States', 'USD'], ['Uruguay', 'UYU'], ['Vietnam', 'VND'],
  ['Zambia', 'ZMW'],
];

const currencySymbols = {
  AED: 'د.إ', AFN: '؋', ALL: 'L', AMD: '֏', ARS: '$', AUD: '$', AZN: '₼',
  BAM: 'KM', BBD: '$', BDT: '৳', BGN: 'лв', BHD: '.د.ب', BOB: 'Bs', BRL: 'R$',
  BSD: '$', BWP: 'P', BYN: 'Br', BZD: '$', CAD: '$', CHF: 'CHF', CLP: '$',
  CNY: '¥', COP: '$', CRC: '₡', CZK: 'Kč', DKK: 'kr', DOP: 'RD$', DZD: 'دج',
  EGP: 'E£', ETB: 'Br', EUR: '€', GBP: '£', GEL: '₾', GHS: '₵', GTQ: 'Q',
  HKD: '$', HUF: 'Ft', IDR: 'Rp', ILS: '₪', INR: '₹', ISK: 'kr', JMD: 'J$',
  JOD: 'JD', JPY: '¥', KES: 'KSh', KHR: '៛', KRW: '₩', KWD: 'KD', KZT: '₸',
  LBP: 'ل.ل', LKR: 'Rs', MAD: 'DH', MXN: '$', MYR: 'RM', NGN: '₦', NOK: 'kr',
  NZD: '$', OMR: 'OMR', PAB: 'B/.', PEN: 'S/', PHP: '₱', PKR: 'Rs', PLN: 'zł',
  QAR: 'QR', RON: 'lei', RSD: 'дин', SAR: '﷼', SEK: 'kr', SGD: '$', THB: '฿',
  TND: 'د.ت', TRY: '₺', TWD: 'NT$', TZS: 'TSh', UAH: '₴', UGX: 'USh',
  USD: '$', UYU: '$U', VND: '₫', XAF: 'FCFA', XOF: 'CFA', ZAR: 'R', ZMW: 'ZK',
};

export const currencyOptions = currencyCountries.map(([country, code]) => ({
  country,
  code,
  symbol: currencySymbols[code] || code,
}));

export const defaultCurrency = currencyOptions.find((item) => item.country === 'United States');

export const findCurrencyByCountry = (country) =>
  currencyOptions.find((item) => item.country === country) || defaultCurrency;

export const formatMoney = (value, symbol = '$', code = 'USD') => {
  const amount = Number.parseFloat(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${safeAmount.toFixed(2)} ${code}`;
};
