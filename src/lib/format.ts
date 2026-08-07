import type { Lang } from '../i18n/strings'

/** Format a number as Indian Rupees, e.g. 125000 -> ₹1,25,000. */
export function formatINR(n: number): string {
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0)
}

const GU_DIGITS = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯']

/** Convert the ASCII digits in a string to Gujarati numerals. */
export function toGujaratiDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => GU_DIGITS[Number(d)])
}

/** Rupees with Gujarati numerals, e.g. 125000 -> ₹૧,૨૫,૦૦૦. */
export function formatINRGujarati(n: number): string {
  return toGujaratiDigits(formatINR(n))
}

/** Format an ISO date (YYYY-MM-DD) for display. */
export function formatDate(iso: string, lang: Lang = 'en'): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(lang === 'gu' ? 'gu-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Today as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7) // YYYY-MM
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigit(n: number): string {
  if (n < 20) return ONES[n]
  return (TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')).trim()
}

/** Convert a number to Indian-system words, e.g. 125000 -> "One Lakh Twenty Five Thousand Rupees Only". */
export function numberToWordsINR(num: number): string {
  num = Math.floor(num || 0)
  if (num === 0) return 'Zero Rupees Only'
  let words = ''
  const crore = Math.floor(num / 10000000)
  num %= 10000000
  const lakh = Math.floor(num / 100000)
  num %= 100000
  const thousand = Math.floor(num / 1000)
  num %= 1000
  const hundred = Math.floor(num / 100)
  num %= 100
  if (crore) words += twoDigit(crore) + ' Crore '
  if (lakh) words += twoDigit(lakh) + ' Lakh '
  if (thousand) words += twoDigit(thousand) + ' Thousand '
  if (hundred) words += ONES[hundred] + ' Hundred '
  if (num) words += (words ? 'and ' : '') + twoDigit(num) + ' '
  return words.trim() + ' Rupees Only'
}

// Gujarati words for 0-99 (Indian numbering has irregular forms, so a table is used).
const GU_ONES = [
  '', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ',
  'દસ', 'અગિયાર', 'બાર', 'તેર', 'ચૌદ', 'પંદર', 'સોળ', 'સત્તર', 'અઢાર', 'ઓગણીસ',
  'વીસ', 'એકવીસ', 'બાવીસ', 'તેવીસ', 'ચોવીસ', 'પચીસ', 'છવ્વીસ', 'સત્તાવીસ', 'અઠ્ઠાવીસ', 'ઓગણત્રીસ',
  'ત્રીસ', 'એકત્રીસ', 'બત્રીસ', 'તેત્રીસ', 'ચોત્રીસ', 'પાંત્રીસ', 'છત્રીસ', 'સડત્રીસ', 'આડત્રીસ', 'ઓગણચાળીસ',
  'ચાળીસ', 'એકતાળીસ', 'બેતાળીસ', 'તેતાળીસ', 'ચુંમાળીસ', 'પિસ્તાળીસ', 'છેતાળીસ', 'સુડતાળીસ', 'અડતાળીસ', 'ઓગણપચાસ',
  'પચાસ', 'એકાવન', 'બાવન', 'ત્રેપન', 'ચોપન', 'પંચાવન', 'છપ્પન', 'સત્તાવન', 'અઠ્ઠાવન', 'ઓગણસાઠ',
  'સાઠ', 'એકસઠ', 'બાસઠ', 'ત્રેસઠ', 'ચોસઠ', 'પાંસઠ', 'છાસઠ', 'સડસઠ', 'અડસઠ', 'અગણોસિત્તેર',
  'સિત્તેર', 'એકોતેર', 'બોતેર', 'તોતેર', 'ચુમોતેર', 'પંચોતેર', 'છોતેર', 'સિત્યોતેર', 'ઇઠ્યોતેર', 'ઓગણ્યાએંસી',
  'એંસી', 'એક્યાસી', 'બ્યાસી', 'ત્યાસી', 'ચોર્યાસી', 'પંચ્યાસી', 'છ્યાસી', 'સિત્યાસી', 'ઈઠ્યાસી', 'નેવ્યાસી',
  'નેવું', 'એકાણું', 'બાણું', 'ત્રાણું', 'ચોરાણું', 'પંચાણું', 'છન્નું', 'સત્તાણું', 'અઠ્ઠાણું', 'નવ્વાણું',
]
const GU_HUNDREDS = ['', 'એકસો', 'બસો', 'ત્રણસો', 'ચારસો', 'પાંચસો', 'છસો', 'સાતસો', 'આઠસો', 'નવસો']

function guBelowThousand(n: number): string {
  const h = Math.floor(n / 100)
  const r = n % 100
  const parts: string[] = []
  if (h) parts.push(GU_HUNDREDS[h])
  if (r) parts.push(GU_ONES[r])
  return parts.join(' ')
}

/** Convert a number to Gujarati words (Indian system), e.g. 5100 -> "પાંચ હજાર એકસો રૂપિયા પૂરા". */
export function numberToWordsGujarati(num: number): string {
  num = Math.floor(num || 0)
  if (num === 0) return 'શૂન્ય રૂપિયા પૂરા'
  const crore = Math.floor(num / 10000000)
  num %= 10000000
  const lakh = Math.floor(num / 100000)
  num %= 100000
  const thousand = Math.floor(num / 1000)
  num %= 1000
  const rest = num
  const parts: string[] = []
  if (crore) parts.push(guBelowThousand(crore) + ' કરોડ')
  if (lakh) parts.push(guBelowThousand(lakh) + ' લાખ')
  if (thousand) parts.push(guBelowThousand(thousand) + ' હજાર')
  if (rest) parts.push(guBelowThousand(rest))
  return parts.join(' ') + ' રૂપિયા પૂરા'
}
