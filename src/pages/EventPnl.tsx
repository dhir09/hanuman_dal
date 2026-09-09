import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { useQuery } from '../hooks/useQuery'
import {
  getAdvertisementIncomesByEvent,
  getDonationsByEvent,
  getEvent,
  getExpensesByEvent,
  getSettings,
  type AdvertisementIncome,
  type Donation,
  type EventItem,
  type Expense,
  type Settings,
} from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { strings, type Lang, type StringKey } from '../i18n/strings'
import {
  formatINR,
  formatINRGujarati,
  formatDate,
  todayISO,
  numberToWordsINR,
  numberToWordsGujarati,
} from '../lib/format'
import { renderPagesToPdf } from '../lib/pdf'

// Language-parameterised helpers (statement language is independent of the app UI).
const tr = (lang: Lang, key: StringKey) => strings[key][lang]
function pk(lang: Lang, obj: object, base: string): string {
  const rec = obj as Record<string, string | undefined>
  const gu = rec[`${base}_gu`]
  const en = rec[`${base}_en`]
  return lang === 'gu' ? gu?.trim() || en || '' : en?.trim() || gu || ''
}
const mn = (lang: Lang, n: number) => (lang === 'gu' ? formatINRGujarati(n) : formatINR(n))
const words = (lang: Lang, n: number) => (lang === 'gu' ? numberToWordsGujarati(n) : numberToWordsINR(n))

interface Line {
  label: string
  amount: number
}

/** Group amounts by a translated label, preserving first-seen order. */
function groupBy<T>(rows: T[], label: (r: T) => string, amount: (r: T) => number): Line[] {
  const map = new Map<string, number>()
  for (const r of rows) {
    const key = label(r) || '—'
    map.set(key, (map.get(key) ?? 0) + amount(r))
  }
  return Array.from(map, ([label, amount]) => ({ label, amount }))
}

export default function EventPnl() {
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const eid = Number(id)

  const event = useQuery('events', () => getEvent(eid), [id])
  const donations = useQuery('donations', () => getDonationsByEvent(eid), [id])
  const expenses = useQuery('expenses', () => getExpensesByEvent(eid), [id])
  const advertisementIncomes = useQuery('advertisementIncomes', () => getAdvertisementIncomesByEvent(eid), [id])
  const settings = useQuery('settings', getSettings, [])

  const [previewLang, setPreviewLang] = useState<Lang>(lang)
  const [printLang, setPrintLang] = useState<Lang | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // When a hidden print doc is mounted, capture it and build the PDF.
  useEffect(() => {
    if (!printLang) return
    let cancelled = false
    ;(async () => {
      await new Promise((r) => setTimeout(r, 120))
      const node = printRef.current?.querySelector<HTMLElement>('.pdf-page')
      try {
        const orgName = pk(printLang, settings ?? {}, 'orgName') || 'Hanuman Dal'
        const evName = event ? pk(printLang, event, 'name') : ''
        const tag = printLang === 'gu' ? 'GU' : 'EN'
        if (!cancelled && node) await renderPagesToPdf([node], `${orgName}-${evName}-P&L-${tag}`)
      } finally {
        if (!cancelled) setPrintLang(null)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printLang])

  if (!event) return <div className="py-10 text-center text-stone-400">…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-stone-800">{t('pnlStatement')}</h1>
      </div>

      {/* Preview language toggle */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-100 p-1">
        {(['en', 'gu'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setPreviewLang(l)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              previewLang === l ? 'bg-white text-saffron-700 shadow-sm' : 'text-stone-500'
            }`}
          >
            {l === 'en' ? 'English' : 'ગુજરાતી'}
          </button>
        ))}
      </div>

      {/* Download buttons — one per language */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setPrintLang('en')} disabled={printLang !== null} className="btn-primary">
          <Download size={16} /> {printLang === 'en' ? '…' : t('downloadEnglish')}
        </button>
        <button onClick={() => setPrintLang('gu')} disabled={printLang !== null} className="btn-ghost">
          <Download size={16} /> {printLang === 'gu' ? '…' : t('downloadGujarati')}
        </button>
      </div>

      {/* On-screen preview */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-stone-200">
        <PnlDoc
          docLang={previewLang}
          event={event}
          settings={settings}
          donations={donations ?? []}
          expenses={expenses ?? []}
          advertisementIncomes={advertisementIncomes ?? []}
        />
      </div>

      {/* Hidden, page-sized doc used only for PDF capture */}
      {printLang && (
        <div ref={printRef} aria-hidden className="pointer-events-none fixed -left-[10000px] top-0">
          <div className="pdf-page">
            <PnlDoc
              docLang={printLang}
              event={event}
              settings={settings}
              donations={donations ?? []}
              expenses={expenses ?? []}
              advertisementIncomes={advertisementIncomes ?? []}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface PnlDocProps {
  docLang: Lang
  event: EventItem
  settings?: Settings
  donations: Donation[]
  expenses: Expense[]
  advertisementIncomes: AdvertisementIncome[]
}

/** The professional, ITR-style Income & Expenditure statement document (720px wide). */
function PnlDoc({ docLang, event, settings, donations, expenses, advertisementIncomes }: PnlDocProps) {
  const dt = (key: StringKey) => tr(docLang, key)
  const money = (n: number) => mn(docLang, n)
  const orgName = pk(docLang, settings ?? {}, 'orgName') || 'Hanuman Dal'
  const addr = settings?.address_gu?.trim() || settings?.address_en || ''
  const evName = event ? pk(docLang, event, 'name') : ''

  // Income: donations grouped by purpose + a single advertising-income line.
  const incomeLines = useMemo<Line[]>(() => {
    const lines = groupBy(
      donations,
      (d) => pk(docLang, d, 'purpose') || dt('donationsReceived'),
      (d) => d.amount,
    )
    const adTotal = advertisementIncomes.reduce((s, a) => s + a.amount, 0)
    if (adTotal > 0) lines.push({ label: dt('advertisementIncome'), amount: adTotal })
    return lines
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donations, advertisementIncomes, docLang])

  // Expenditure: expenses grouped by category.
  const expenseLines = useMemo<Line[]>(
    () => groupBy(expenses, (e) => pk(docLang, e, 'category') || pk(docLang, e, 'description') || '—', (e) => e.amount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, docLang],
  )

  const totalIncome = incomeLines.reduce((s, l) => s + l.amount, 0)
  const totalExpenditure = expenseLines.reduce((s, l) => s + l.amount, 0)
  const net = totalIncome - totalExpenditure
  const isSurplus = net >= 0

  // Single saffron hue drives the whole document (band + tints), à la the reference.
  const BAND = '#b8420b' // deep saffron
  const SECTION_BG = '#fdf4ec' // saffron-50-ish tint for section headers
  const TOTAL_BG = '#f9e6d3' // saffron-100-ish tint for total / net rows
  const INCOME_COLOR = '#15803d' // green for income amounts
  const EXPENSE_COLOR = '#b91c1c' // red for expenditure amounts

  return (
    <div lang={docLang} className="w-[720px] bg-white px-10 py-8 text-stone-900">
      {/* Letterhead (logo + org name) */}
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-14 w-14 rounded-full object-contain" />
        <div className="text-[22px] font-bold tracking-tight">{orgName}</div>
      </div>

      {/* Header band: title left, period box right */}
      <div className="mt-5 flex items-stretch justify-between text-white" style={{ background: BAND }}>
        <div className="flex flex-col justify-center px-5 py-3.5">
          <div className="text-[16px] font-bold">{dt('incomeExpenditureStatement')}</div>
        </div>
        <div className="max-w-[45%] px-5 py-2.5 text-right" style={{ background: 'rgba(255,255,255,0.14)' }}>
          <div className="text-[9px] uppercase tracking-widest opacity-80">{dt('event')}</div>
          <div className="truncate text-[14px] font-bold leading-tight">{evName}</div>
        </div>
      </div>

      {/* Ledger table */}
      <table className="w-full border-collapse text-[13px]">
        <tbody>
          {/* INCOME */}
          <SectionRow label={dt('income')} bg={SECTION_BG} />
          {incomeLines.map((l, i) => (
            <Row key={`in-${i}`} label={l.label} amount={money(l.amount)} color={INCOME_COLOR} />
          ))}
          {incomeLines.length === 0 && <EmptyRow label={dt('noData')} />}
          <TotalRow label={dt('totalIncome')} amount={money(totalIncome)} bg={TOTAL_BG} color={INCOME_COLOR} />

          {/* Gap separating income from expenditure */}
          <tr>
            <td colSpan={2} className="h-5" />
          </tr>

          {/* EXPENDITURE */}
          <SectionRow label={dt('expenditure')} bg={SECTION_BG} />
          {expenseLines.map((l, i) => (
            <Row key={`ex-${i}`} label={l.label} amount={money(l.amount)} color={EXPENSE_COLOR} />
          ))}
          {expenseLines.length === 0 && <EmptyRow label={dt('noData')} />}
          <TotalRow label={dt('totalExpenditure')} amount={money(totalExpenditure)} bg={TOTAL_BG} color={EXPENSE_COLOR} />

          {/* Gap separating expenditure from the net result */}
          <tr>
            <td colSpan={2} className="h-5" />
          </tr>

          {/* NET */}
          <tr>
            <td className="px-3 py-3 text-[14px] font-bold text-stone-900" style={{ background: TOTAL_BG, borderTop: `2px solid ${BAND}` }}>
              {isSurplus ? dt('surplus') : dt('deficit')}
            </td>
            <td className="px-3 py-3 text-right text-[14px] font-bold tabular-nums" style={{ background: TOTAL_BG, borderTop: `2px solid ${BAND}`, color: isSurplus ? INCOME_COLOR : EXPENSE_COLOR }}>
              {money(Math.abs(net))}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words */}
      <div className="mt-4 text-[12px] text-stone-600">
        <span className="font-semibold text-stone-700">{dt('inWords')}:</span> {words(docLang, Math.abs(net))}
      </div>

      {/* Note */}
      <div className="mt-6 text-[10.5px] leading-relaxed text-stone-400">{dt('pnlNote')}</div>

      {/* Footer: place/date + signature */}
      <div className="mt-10 flex items-end justify-between">
        <div className="text-[10.5px] leading-relaxed text-stone-500">
          {dt('placeAndDate')}: {addr ? `${addr} · ` : ''}
          {formatDate(todayISO(), docLang)}
          <br />
          <span className="text-stone-400">{dt('computerGenerated')}</span>
        </div>
        <div className="text-center">
          <img src="/signature.jpg" alt="" className="mx-auto mb-1 h-8 object-contain" />
          <div className="w-40 border-t border-stone-300 pt-1 text-[10.5px] text-stone-600">{dt('authorisedSign')}</div>
        </div>
      </div>
    </div>
  )
}

function SectionRow({ label, bg }: { label: string; bg: string }) {
  return (
    <tr>
      <td colSpan={2} className="px-3 py-2 text-[13px] font-bold text-stone-800" style={{ background: bg }}>
        {label}
      </td>
    </tr>
  )
}

function Row({ label, amount, color }: { label: string; amount: string; color: string }) {
  return (
    <tr className="border-b border-stone-100">
      <td className="px-3 py-1.5 align-top text-stone-700">{label}</td>
      <td className="px-3 py-1.5 text-right align-top font-medium tabular-nums" style={{ color }}>
        {amount}
      </td>
    </tr>
  )
}

function TotalRow({ label, amount, bg, color }: { label: string; amount: string; bg: string; color: string }) {
  return (
    <tr>
      <td className="px-3 py-2 text-[13px] font-bold text-stone-900" style={{ background: bg }}>
        {label}
      </td>
      <td className="px-3 py-2 text-right text-[13px] font-bold tabular-nums" style={{ background: bg, color }}>
        {amount}
      </td>
    </tr>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={2} className="px-3 py-3 text-[12px] italic text-stone-400">
        {label}
      </td>
    </tr>
  )
}
