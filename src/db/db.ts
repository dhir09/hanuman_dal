import { supabase } from './supabase'
import { invalidate } from '../hooks/useQuery'

// ── Types (unchanged from the Dexie era) ──────────────────────

export type PaymentMode = 'cash' | 'upi' | 'bank' | 'cheque'

export interface Settings {
  id: number
  orgName_en: string
  orgName_gu: string
  address_en: string
  address_gu: string
  phone: string
  receiptPrefix: string
}

export interface Purpose {
  id?: number
  name_en: string
  name_gu: string
  active: number
}

export interface Donor {
  id?: number
  name_en: string
  name_gu: string
  phone: string
  address_en: string
  address_gu: string
  createdAt: string
}

export interface Donation {
  id?: number
  receiptNo: string
  date: string
  donorId?: number
  donorName_en: string
  donorName_gu: string
  phone: string
  amount: number
  purposeId?: number
  purpose_en: string
  purpose_gu: string
  paymentMode: PaymentMode
  eventId?: number
  note_en: string
  note_gu: string
  createdAt: string
}

export interface EventItem {
  id?: number
  name_en: string
  name_gu: string
  date: string
  description_en: string
  description_gu: string
  createdAt: string
}

export interface Expense {
  id?: number
  date: string
  eventId?: number
  category_en: string
  category_gu: string
  description_en: string
  description_gu: string
  paidTo_en: string
  paidTo_gu: string
  amount: number
  paymentMode: PaymentMode
  createdAt: string
}

export interface AdvertisementIncome {
  id?: number
  receiptNo: string
  date: string
  eventId?: number
  advertiser_en: string
  advertiser_gu: string
  description_en: string
  description_gu: string
  amount: number
  paymentMode: PaymentMode
  createdAt: string
}

// ── Helpers ────────────────────────────────────────────────────

function unwrap<T>(result: { data: T | null; error: unknown }): NonNullable<T> {
  if (result.error) throw result.error
  return result.data as NonNullable<T>
}

// ── Settings ──────────────────────────────────────────────────

export async function getSettings(): Promise<Settings | undefined> {
  const { data } = await supabase.from('settings').select('*').maybeSingle()
  return data ?? undefined
}

export async function upsertSettings(s: Omit<Settings, 'id'>): Promise<void> {
  const existing = await getSettings()
  if (existing) {
    await supabase.from('settings').update(s).eq('id', existing.id)
  } else {
    await supabase.from('settings').insert(s)
  }
  invalidate('settings')
}

// ── Purposes ──────────────────────────────────────────────────

export async function getAllPurposes(): Promise<Purpose[]> {
  return unwrap(await supabase.from('purposes').select('*').order('id'))
}

export async function getActivePurposes(): Promise<Purpose[]> {
  return unwrap(await supabase.from('purposes').select('*').eq('active', 1).order('id'))
}

export async function addPurpose(p: Omit<Purpose, 'id'>): Promise<number> {
  const row = unwrap<{ id: number }>(await supabase.from('purposes').insert(p).select('id').single())
  invalidate('purposes')
  return row.id
}

export async function deletePurpose(id: number): Promise<void> {
  await supabase.from('purposes').delete().eq('id', id)
  invalidate('purposes')
}

// ── Donors ────────────────────────────────────────────────────

export async function getAllDonorsSorted(): Promise<Donor[]> {
  return unwrap(await supabase.from('donors').select('*').order('name_en'))
}

export async function getDonor(id: number): Promise<Donor | undefined> {
  const { data } = await supabase.from('donors').select('*').eq('id', id).maybeSingle()
  return data ?? undefined
}

export async function getDonorCount(): Promise<number> {
  const { count } = await supabase.from('donors').select('*', { count: 'exact', head: true })
  return count ?? 0
}

export async function addDonor(d: Omit<Donor, 'id'>): Promise<number> {
  const row = unwrap<{ id: number }>(await supabase.from('donors').insert(d).select('id').single())
  invalidate('donors')
  return row.id
}

export async function deleteDonor(id: number): Promise<void> {
  await supabase.from('donors').delete().eq('id', id)
  invalidate('donors')
}

// ── Events ────────────────────────────────────────────────────

export async function getAllEventsDesc(): Promise<EventItem[]> {
  return unwrap(await supabase.from('events').select('*').order('date', { ascending: false }))
}

export async function getEvent(id: number): Promise<EventItem | undefined> {
  const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
  return data ?? undefined
}

export async function addEvent(e: Omit<EventItem, 'id'>): Promise<number> {
  const row = unwrap<{ id: number }>(await supabase.from('events').insert(e).select('id').single())
  invalidate('events')
  return row.id
}

export async function deleteEvent(id: number): Promise<void> {
  await supabase.from('events').delete().eq('id', id)
  invalidate('events')
}

// ── Donations ─────────────────────────────────────────────────

export async function getAllDonations(): Promise<Donation[]> {
  return unwrap(await supabase.from('donations').select('*'))
}

export async function getAllDonationsAsc(): Promise<Donation[]> {
  return unwrap(await supabase.from('donations').select('*').order('date'))
}

export async function getAllDonationsDesc(): Promise<Donation[]> {
  return unwrap(await supabase.from('donations').select('*').order('date', { ascending: false }))
}

export async function getDonation(id: number): Promise<Donation | undefined> {
  const { data } = await supabase.from('donations').select('*').eq('id', id).maybeSingle()
  return data ?? undefined
}

export async function getDonationsByDonor(donorId: number): Promise<Donation[]> {
  return unwrap(
    await supabase.from('donations').select('*').eq('donorId', donorId).order('date', { ascending: false }),
  )
}

export async function getDonationsByEvent(eventId: number): Promise<Donation[]> {
  return unwrap(await supabase.from('donations').select('*').eq('eventId', eventId))
}

export async function addDonation(d: Omit<Donation, 'id'>): Promise<number> {
  const row = unwrap<{ id: number }>(await supabase.from('donations').insert(d).select('id').single())
  invalidate('donations')
  return row.id
}

export async function updateDonation(id: number, d: Partial<Donation>): Promise<void> {
  await supabase.from('donations').update(d).eq('id', id)
  invalidate('donations')
}

export async function deleteDonation(id: number): Promise<void> {
  await supabase.from('donations').delete().eq('id', id)
  invalidate('donations')
}

// ── Expenses ──────────────────────────────────────────────────

export async function getAllExpenses(): Promise<Expense[]> {
  return unwrap(await supabase.from('expenses').select('*'))
}

export async function getAllExpensesAsc(): Promise<Expense[]> {
  return unwrap(await supabase.from('expenses').select('*').order('date'))
}

export async function getAllExpensesDesc(): Promise<Expense[]> {
  return unwrap(await supabase.from('expenses').select('*').order('date', { ascending: false }))
}

export async function getExpensesByEvent(eventId: number): Promise<Expense[]> {
  return unwrap(await supabase.from('expenses').select('*').eq('eventId', eventId))
}

export async function addExpense(e: Omit<Expense, 'id'>): Promise<number> {
  const row = unwrap<{ id: number }>(await supabase.from('expenses').insert(e).select('id').single())
  invalidate('expenses')
  return row.id
}

export async function updateExpense(id: number, e: Partial<Expense>): Promise<void> {
  await supabase.from('expenses').update(e).eq('id', id)
  invalidate('expenses')
}

export async function deleteExpense(id: number): Promise<void> {
  await supabase.from('expenses').delete().eq('id', id)
  invalidate('expenses')
}

// ── Advertisement income ───────────────────────────────────────────────────

export async function getAllAdvertisementIncomes(): Promise<AdvertisementIncome[]> {
  return unwrap(await supabase.from('advertisement_incomes').select('*'))
}

export async function getAllAdvertisementIncomesDesc(): Promise<AdvertisementIncome[]> {
  return unwrap(await supabase.from('advertisement_incomes').select('*').order('date', { ascending: false }))
}

export async function getAdvertisementIncomesByEvent(eventId: number): Promise<AdvertisementIncome[]> {
  return unwrap(await supabase.from('advertisement_incomes').select('*').eq('eventId', eventId))
}

export async function getAdvertisementIncome(id: number): Promise<AdvertisementIncome | undefined> {
  const { data } = await supabase.from('advertisement_incomes').select('*').eq('id', id).maybeSingle()
  return data ?? undefined
}

export async function addAdvertisementIncome(income: Omit<AdvertisementIncome, 'id'>): Promise<number> {
  const row = unwrap<{ id: number }>(await supabase.from('advertisement_incomes').insert(income).select('id').single())
  invalidate('advertisementIncomes')
  return row.id
}

export async function updateAdvertisementIncome(id: number, income: Partial<AdvertisementIncome>): Promise<void> {
  await supabase.from('advertisement_incomes').update(income).eq('id', id)
  invalidate('advertisementIncomes')
}

export async function deleteAdvertisementIncome(id: number): Promise<void> {
  await supabase.from('advertisement_incomes').delete().eq('id', id)
  invalidate('advertisementIncomes')
}

// ── Seed & Receipt ────────────────────────────────────────────

const DEFAULT_PURPOSES: Array<[string, string]> = [
  ['General Fund', 'સામાન્ય ફંડ'],
  ['Temple / Mandir', 'મંદિર'],
  ['Food Distribution / Annadan', 'અન્નદાન'],
  ['Medical Aid', 'તબીબી સહાય'],
  ['Education', 'શિક્ષણ'],
  ['Festival / Utsav', 'ઉત્સવ'],
  ['Cattle / Gaushala', 'ગૌશાળા'],
]

export async function ensureSeed() {
  const s = await getSettings()
  if (!s) {
    await supabase.from('settings').insert({
      orgName_en: 'Hanuman Dal',
      orgName_gu: 'હનુમાન દળ',
      address_en: '',
      address_gu: '',
      phone: '',
      receiptPrefix: 'HD',
    })
  }
  const { count } = await supabase.from('purposes').select('*', { count: 'exact', head: true })
  if ((count ?? 0) === 0) {
    await supabase.from('purposes').insert(
      DEFAULT_PURPOSES.map(([en, gu]) => ({ name_en: en, name_gu: gu, active: 1 })),
    )
  }
}

export async function nextReceiptNo(dateISO: string): Promise<string> {
  const s = await getSettings()
  const prefix = s?.receiptPrefix || 'HD'
  const year = dateISO.slice(0, 4)
  const { count } = await supabase
    .from('donations')
    .select('*', { count: 'exact', head: true })
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
  const seq = String((count ?? 0) + 1).padStart(4, '0')
  return `${prefix}-${year}-${seq}`
}

export async function nextAdvertisementReceiptNo(dateISO: string): Promise<string> {
  const s = await getSettings()
  const prefix = s?.receiptPrefix || 'HD'
  const year = dateISO.slice(0, 4)
  const { count } = await supabase
    .from('advertisement_incomes')
    .select('*', { count: 'exact', head: true })
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
  const seq = String((count ?? 0) + 1).padStart(4, '0')
  return `${prefix}-AD-${year}-${seq}`
}
