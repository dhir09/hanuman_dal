// One-off seed list of real festival expenses, grouped by category, with EN + GU
// text. Consumed by the "Import festival expenses" button on the event page.
// Each item becomes one expense row (category = section, description = item).

export interface SeedExpenseItem {
  description_en: string
  description_gu: string
  amount: number
}

export interface SeedExpenseCategory {
  category_en: string
  category_gu: string
  items: SeedExpenseItem[]
}

export const FESTIVAL_EXPENSES: SeedExpenseCategory[] = [
  {
    category_en: 'Mandap, Sound & Main Setup',
    category_gu: 'મંડપ, સાઉન્ડ અને મુખ્ય સેટઅપ',
    items: [
      { description_en: 'Light and par light', description_gu: 'લાઇટ અને પારલાઇટ', amount: 30000 },
      { description_en: 'Sound system', description_gu: 'સાઉન્ડ સિસ્ટમ', amount: 28000 },
      { description_en: 'Mandap', description_gu: 'મંડપ', amount: 17000 },
      { description_en: 'Mandap cloth + extra', description_gu: 'મંડપ કપડું + વધારાનું', amount: 7840 },
      { description_en: 'Driver crane', description_gu: 'ડ્રાઇવર ક્રેન', amount: 1500 },
      { description_en: 'Nut bolt (8 kg)', description_gu: 'નટ બોલ્ટ (૮ કિલો)', amount: 800 },
      { description_en: 'POP (Plaster of Paris)', description_gu: 'POP (પ્લાસ્ટર ઓફ પેરિસ)', amount: 600 },
    ],
  },
  {
    category_en: 'Decoration & Craft Items',
    category_gu: 'સજાવટ અને હસ્તકલા વસ્તુઓ',
    items: [
      { description_en: 'Ribbon rolls (104 pcs)', description_gu: 'રિબનના રોલ (૧૦૪ નંગ)', amount: 6240 },
      { description_en: 'Baskets (bamboo tokri + parcel)', description_gu: 'ટોકરી (વાંસની ટોકરી + પાર્સલ)', amount: 3620 },
      { description_en: 'Asipi sheet', description_gu: 'અસિપિ શીટ', amount: 3300 },
      { description_en: 'Hangings (3000 latkan + courier)', description_gu: 'લટકણ (૩૦૦૦ લટકણ + કુરિયર)', amount: 3240 },
      { description_en: 'Light green strip (pati)', description_gu: 'લાઇટ ગ્રીન પટ્ટી', amount: 3000 },
      { description_en: 'Peacock-feather wig', description_gu: 'મોરના પીંછાની વિગ', amount: 1290 },
      { description_en: 'Bhutbhavani decor (paid to Viral)', description_gu: 'ભૂતભવાની ડેકોર (વિરલને આપ્યા)', amount: 930 },
      { description_en: 'Rope (dori)', description_gu: 'દોરી', amount: 750 },
      { description_en: 'Baskets (tokri)', description_gu: 'ટોકરીના', amount: 640 },
      { description_en: 'Cloth pieces', description_gu: 'કપડાના પીસ', amount: 350 },
      { description_en: 'Lace (Anjar)', description_gu: 'લેસના (અંજાર)', amount: 200 },
    ],
  },
  {
    category_en: 'Hardware, Wire & Tools',
    category_gu: 'હાર્ડવેર, વાયર અને સાધનો',
    items: [
      { description_en: 'Wire', description_gu: 'વાયર', amount: 660 },
      { description_en: 'Pliers, tester, wire tape', description_gu: 'પકડ, ટેસ્ટર, વાયર ટેપ', amount: 600 },
      { description_en: 'Tape wiring', description_gu: 'ટેપ વાયરિંગ', amount: 300 },
      { description_en: 'Full wiring wire', description_gu: 'વાયરિંગ ફૂલનો તાર', amount: 170 },
      { description_en: 'Toothpick', description_gu: 'ટૂથપીક', amount: 120 },
      { description_en: 'Motor', description_gu: 'મોટર', amount: 100 },
      { description_en: 'Screws (sucur)', description_gu: 'સ્ક્રૂ', amount: 60 },
    ],
  },
  {
    category_en: 'Colours & Brushes',
    category_gu: 'રંગ અને પીંછી',
    items: [
      { description_en: 'Colour', description_gu: 'રંગ', amount: 500 },
      { description_en: 'Colour and rubber', description_gu: 'રંગ અને રબર', amount: 220 },
      { description_en: 'Colour (Raj)', description_gu: 'રંગ (રાજ)', amount: 195 },
      { description_en: 'Colour and one brush', description_gu: 'રંગ અને એક બ્રશ', amount: 180 },
    ],
  },
  {
    category_en: 'Pooja, Prasad & Catering (Chai-Pani)',
    category_gu: 'પૂજા, પ્રસાદ અને ભોજન (ચા-પાણી)',
    items: [
      { description_en: 'Krishna idol (+courier)', description_gu: 'કૃષ્ણ ભગવાન મૂર્તિ (+કુરિયર)', amount: 2500 },
      { description_en: "Bought from Muna's shop", description_gu: 'મુનાની થેલીમાંથી લીધા', amount: 2000 },
      { description_en: 'Butter and curd', description_gu: 'માખણ અને દહીં', amount: 1550 },
      { description_en: 'Nadachhadi (sacred thread)', description_gu: 'નાડાછડી', amount: 1200 },
      { description_en: 'Tea / refreshments', description_gu: 'ચા પાણી ભૂકી', amount: 314 },
      { description_en: 'Sugar, cups, coconut, incense', description_gu: 'ખાંડ ભૂકી, કપ, નારિયેળ, અગરબત્તી', amount: 280 },
      { description_en: 'Pot / matki (from Devang Patel)', description_gu: 'માટકી (દેવાંગ પટેલ પાસેથી)', amount: 220 },
      { description_en: 'Tea powder', description_gu: 'ચા ભૂકી', amount: 197 },
      { description_en: 'Milk', description_gu: 'દૂધ', amount: 130 },
    ],
  },
  {
    category_en: 'Firecrackers (Patakha)',
    category_gu: 'ફટાકડા',
    items: [{ description_en: 'Firecrackers', description_gu: 'ફટાકડા', amount: 3000 }],
  },
]

/** Grand total of the seed list (for the confirm dialog / sanity check). */
export const FESTIVAL_EXPENSES_TOTAL = FESTIVAL_EXPENSES.reduce(
  (s, c) => s + c.items.reduce((a, i) => a + i.amount, 0),
  0,
)

/** Number of individual line items in the seed list. */
export const FESTIVAL_EXPENSES_COUNT = FESTIVAL_EXPENSES.reduce((s, c) => s + c.items.length, 0)
