export type Lang = 'en' | 'gu'

// Every UI string keyed by name, with an English and Gujarati value.
export const strings = {
  appName: { en: 'Hanuman Dal', gu: 'હનુમાન દળ' },
  tagline: { en: 'Donation & Finance Manager', gu: 'દાન અને નાણાં વ્યવસ્થાપક' },

  // Nav
  nav_dashboard: { en: 'Home', gu: 'હોમ' },
  nav_donations: { en: 'Donations', gu: 'દાન' },
  nav_reports: { en: 'Reports', gu: 'રિપોર્ટ' },
  nav_expenses: { en: 'Expenses', gu: 'ખર્ચ' },
  nav_more: { en: 'More', gu: 'વધુ' },
  nav_events: { en: 'Events', gu: 'કાર્યક્રમો' },
  nav_donors: { en: 'Donors', gu: 'દાતાઓ' },
  nav_settings: { en: 'Settings', gu: 'સેટિંગ્સ' },
  nav_advertisementIncome: { en: 'Advertising Income', gu: 'જાહેરાત આવક' },

  // Dashboard
  totalDonations: { en: 'Total Donations', gu: 'કુલ દાન' },
  totalExpenses: { en: 'Total Expenses', gu: 'કુલ ખર્ચ' },
  netBalance: { en: 'Net Balance', gu: 'બાકી રકમ' },
  thisMonth: { en: 'This Month', gu: 'આ મહિને' },
  donationsCount: { en: 'Donations', gu: 'દાન' },
  donorsCount: { en: 'Donors', gu: 'દાતાઓ' },
  byPurpose: { en: 'By Purpose', gu: 'હેતુ પ્રમાણે' },
  last6Months: { en: 'Last 6 Months', gu: 'છેલ્લા ૬ મહિના' },
  recentDonations: { en: 'Recent Donations', gu: 'તાજેતરના દાન' },
  quickActions: { en: 'Quick Actions', gu: 'ઝડપી ક્રિયાઓ' },

  // Common
  add: { en: 'Add', gu: 'ઉમેરો' },
  addDonation: { en: 'Add Donation', gu: 'દાન ઉમેરો' },
  addExpense: { en: 'Add Expense', gu: 'ખર્ચ ઉમેરો' },
  addDonor: { en: 'Add Donor', gu: 'દાતા ઉમેરો' },
  addEvent: { en: 'Add Event', gu: 'કાર્યક્રમ ઉમેરો' },
  addAdvertisementIncome: { en: 'Add Advertising Income', gu: 'જાહેરાત આવક ઉમેરો' },
  save: { en: 'Save', gu: 'સાચવો' },
  cancel: { en: 'Cancel', gu: 'રદ કરો' },
  edit: { en: 'Edit', gu: 'સંપાદિત કરો' },
  delete: { en: 'Delete', gu: 'કાઢી નાખો' },
  deleteConfirm: { en: 'Are you sure you want to delete this?', gu: 'શું તમે ખરેખર આ કાઢી નાખવા માંગો છો?' },
  search: { en: 'Search…', gu: 'શોધો…' },
  noData: { en: 'No records yet', gu: 'હજુ કોઈ રેકોર્ડ નથી' },
  back: { en: 'Back', gu: 'પાછળ' },
  total: { en: 'Total', gu: 'કુલ' },
  actions: { en: 'Actions', gu: 'ક્રિયાઓ' },
  optional: { en: 'optional', gu: 'વૈકલ્પિક' },
  all: { en: 'All', gu: 'બધા' },

  // Fields
  date: { en: 'Date', gu: 'તારીખ' },
  amount: { en: 'Amount', gu: 'રકમ' },
  donorName: { en: 'Donor Name', gu: 'દાતાનું નામ' },
  purpose: { en: 'Purpose', gu: 'હેતુ' },
  paymentMode: { en: 'Payment Mode', gu: 'ચુકવણી રીત' },
  phone: { en: 'Phone', gu: 'ફોન' },
  address: { en: 'Address', gu: 'સરનામું' },
  note: { en: 'Note', gu: 'નોંધ' },
  receiptNo: { en: 'Receipt No.', gu: 'રસીદ નં.' },
  event: { en: 'Event', gu: 'કાર્યક્રમ' },
  category: { en: 'Category', gu: 'શ્રેણી' },
  description: { en: 'Description', gu: 'વર્ણન' },
  paidTo: { en: 'Paid To', gu: 'ને ચૂકવેલ' },
  advertiser: { en: 'Advertiser', gu: 'જાહેરાતકર્તા' },
  advertisementIncome: { en: 'Advertising Income', gu: 'જાહેરાત આવક' },
  advertisementReceipt: { en: 'Advertising Income Receipt', gu: 'જાહેરાત આવક રસીદ' },
  name: { en: 'Name', gu: 'નામ' },
  inEnglish: { en: 'in English', gu: 'અંગ્રેજીમાં' },
  inGujarati: { en: 'in Gujarati', gu: 'ગુજરાતીમાં' },
  autoFilling: { en: 'auto-filling…', gu: 'આપમેળે ભરાય છે…' },

  // Payment modes
  cash: { en: 'Cash', gu: 'રોકડ' },
  upi: { en: 'UPI', gu: 'UPI' },
  bank: { en: 'Bank', gu: 'બેંક' },
  cheque: { en: 'Cheque', gu: 'ચેક' },

  // Receipt
  receipt: { en: 'Receipt', gu: 'રસીદ' },
  donationReceipt: { en: 'Donation Receipt', gu: 'દાન રસીદ' },
  receivedWithThanks: { en: 'Received with thanks from', gu: 'આભાર સહિત પ્રાપ્ત થયું' },
  towards: { en: 'towards', gu: 'માટે' },
  amountInWords: { en: 'Amount', gu: 'રકમ' },
  authorisedSign: { en: 'Authorised Signatory', gu: 'અધિકૃત સહી' },
  downloadPdf: { en: 'Download PDF', gu: 'PDF ડાઉનલોડ' },
  shareWhatsapp: { en: 'Share on WhatsApp', gu: 'WhatsApp પર શેર કરો' },
  print: { en: 'Print', gu: 'પ્રિન્ટ' },
  viewReceipt: { en: 'View Receipt', gu: 'રસીદ જુઓ' },

  // Reports
  reports: { en: 'Reports', gu: 'રિપોર્ટ' },
  filterBy: { en: 'Filter', gu: 'ફિલ્ટર' },
  fromDate: { en: 'From', gu: 'થી' },
  toDate: { en: 'To', gu: 'સુધી' },
  apply: { en: 'Apply', gu: 'લાગુ કરો' },
  exportPdf: { en: 'Export PDF', gu: 'PDF નિકાસ' },
  exportExcel: { en: 'Export Excel', gu: 'Excel નિકાસ' },
  resultsFound: { en: 'records found', gu: 'રેકોર્ડ મળ્યા' },
  reportType: { en: 'Report Type', gu: 'રિપોર્ટ પ્રકાર' },
  reportLanguage: { en: 'Report Language', gu: 'રિપોર્ટ ભાષા' },
  filters: { en: 'Filters', gu: 'ફિલ્ટર' },
  clearFilters: { en: 'Clear all', gu: 'બધા સાફ કરો' },
  allEvents: { en: 'All events', gu: 'બધા કાર્યક્રમો' },

  // Events
  eventPnl: { en: 'Event Summary', gu: 'કાર્યક્રમ સારાંશ' },
  collected: { en: 'Collected', gu: 'એકત્ર થયું' },
  spent: { en: 'Spent', gu: 'ખર્ચાયું' },
  balance: { en: 'Balance', gu: 'બાકી' },

  // Settings
  language: { en: 'Language', gu: 'ભાષા' },
  orgDetails: { en: 'Organisation Details', gu: 'સંસ્થાની વિગતો' },
  orgName: { en: 'Organisation Name', gu: 'સંસ્થાનું નામ' },
  managePurposes: { en: 'Manage Purposes', gu: 'હેતુઓનું સંચાલન' },
  newPurpose: { en: 'New purpose', gu: 'નવો હેતુ' },
  addNewPurpose: { en: '+ Add new purpose', gu: '+ નવો હેતુ ઉમેરો' },
  dataBackup: { en: 'Data Backup', gu: 'ડેટા બેકઅપ' },
  exportBackup: { en: 'Export Backup', gu: 'બેકઅપ નિકાસ' },
  importBackup: { en: 'Import Backup', gu: 'બેકઅપ આયાત' },
  backupHint: {
    en: 'Download a backup file regularly.',
    gu: 'નિયમિત બેકઅપ ફાઇલ ડાઉનલોડ કરો.',
  },
  importWarn: {
    en: 'Importing will replace ALL current data. Continue?',
    gu: 'આયાત કરવાથી બધો વર્તમાન ડેટા બદલાઈ જશે. ચાલુ રાખવું?',
  },

  // Auth
  login: { en: 'Log in', gu: 'લૉગ ઇન' },
  signup: { en: 'Sign up', gu: 'સાઇન અપ' },
  logout: { en: 'Log out', gu: 'લૉગ આઉટ' },
  email: { en: 'Email', gu: 'ઇમેઇલ' },
  password: { en: 'Password', gu: 'પાસવર્ડ' },
  noAccount: { en: "Don't have an account?", gu: 'એકાઉન્ટ નથી?' },
  hasAccount: { en: 'Already have an account?', gu: 'પહેલેથી એકાઉન્ટ છે?' },
} as const

export type StringKey = keyof typeof strings
