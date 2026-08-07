import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { Download, FileSpreadsheet } from 'lucide-react'
import { getAllDonationsAsc, getAllEventsDesc, getAllExpensesAsc, getAllPurposes, getSettings, type Settings, type PaymentMode } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatINR, formatINRGujarati, formatDate, todayISO, toGujaratiDigits } from '../lib/format'
import { strings, type Lang, type StringKey } from '../i18n/strings'
import { renderPagesToPdf } from '../lib/pdf'
import { exportRowsToExcel } from '../lib/excel'

type DataType = 'donations' | 'expenses'
type Row = Record<string, unknown> & { id?: number; date: string; amount: number; paymentMode: string }
const PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'bank', 'cheque']

// Language-parameterised helpers (report language is independent of the app UI).
const tr = (lang: Lang, key: StringKey) => strings[key][lang]
function pk(lang: Lang, obj: object, base: string): string {
  const rec = obj as Record<string, string | undefined>
  const gu = rec[`${base}_gu`]
  const en = rec[`${base}_en`]
  return lang === 'gu' ? (gu?.trim() || en || '') : (en?.trim() || gu || '')
}
const mn = (lang: Lang, n: number) => (lang === 'gu' ? formatINRGujarati(n) : formatINR(n))
const guNum = (lang: Lang, n: number) => (lang === 'gu' ? toGujaratiDigits(String(n)) : String(n))

// How many rows fit on one A4 page (the band repeats on each page). renderPagesToPdf
// also scales any over-tall page down to fit, so this is a comfortable, safe target.
const ROWS_PER_PAGE = 28

export default function Reports() {
  const { t, lang } = useI18n()

  const [dataType, setDataType] = useState<DataType>('donations')
  // Combinable filters (all applied together with AND). Empty = no constraint.
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [purposeIds, setPurposeIds] = useState<number[]>([])
  const [modes, setModes] = useState<PaymentMode[]>([])
  const [eventId, setEventId] = useState<number | ''>('')
  const [reportLang, setReportLang] = useState<Lang>(lang)
  const [exporting, setExporting] = useState(false)
  const [printPages, setPrintPages] = useState<Array<{ slice: Row[]; start: number }> | null>(null)
  const printRootRef = useRef<HTMLDivElement>(null)

  const purposes = useQuery('purposes', getAllPurposes, [])
  const events = useQuery('events', getAllEventsDesc, [])
  const donations = useQuery('donations', getAllDonationsAsc, [])
  const expenses = useQuery('expenses', getAllExpensesAsc, [])
  const settings = useQuery('settings', getSettings, [])

  const rt = (key: StringKey) => tr(reportLang, key)
  const orgName = pk(reportLang, settings ?? {}, 'orgName') || 'Hanuman Dal'
  const langTag = reportLang === 'gu' ? 'GU' : 'EN'

  const togglePurpose = (id: number) =>
    setPurposeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleMode = (m: PaymentMode) =>
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  const clearFilters = () => {
    setFromDate('')
    setToDate('')
    setPurposeIds([])
    setModes([])
    setEventId('')
  }
  const anyFilter = Boolean(fromDate || toDate || purposeIds.length || modes.length || eventId !== '')

  const rows = useMemo<Row[]>(() => {
    const src = (dataType === 'donations' ? donations ?? [] : expenses ?? []) as unknown as Row[]
    return src.filter((r) => {
      if (fromDate && r.date < fromDate) return false
      if (toDate && r.date > toDate) return false
      if (modes.length && !modes.includes(r.paymentMode as PaymentMode)) return false
      if (eventId !== '' && (r as { eventId?: number }).eventId !== eventId) return false
      if (dataType === 'donations' && purposeIds.length) {
        const pid = (r as { purposeId?: number }).purposeId
        if (pid === undefined || !purposeIds.includes(pid)) return false
      }
      return true
    })
  }, [dataType, donations, expenses, fromDate, toDate, modes, purposeIds, eventId])

  const total = rows.reduce((s, r) => s + r.amount, 0)

  // When the hidden print pages are mounted, capture each one and build the PDF.
  useEffect(() => {
    if (!printPages) return
    let cancelled = false
    ;(async () => {
      // Let the pages paint (and images resolve from cache) before capturing.
      // A timer (not requestAnimationFrame) so it still fires when the tab is backgrounded.
      await new Promise((r) => setTimeout(r, 120))
      const nodes = Array.from(printRootRef.current?.querySelectorAll<HTMLElement>('.pdf-page') ?? [])
      try {
        if (!cancelled && nodes.length) await renderPagesToPdf(nodes, `${orgName}-report-${langTag}`)
      } finally {
        if (!cancelled) {
          setPrintPages(null)
          setExporting(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printPages])

  function exportPdf() {
    if (exporting) return
    setExporting(true)
    const chunks: Array<{ slice: Row[]; start: number }> = []
    for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) chunks.push({ slice: rows.slice(i, i + ROWS_PER_PAGE), start: i })
    if (chunks.length === 0) chunks.push({ slice: [], start: 0 })
    setPrintPages(chunks)
  }

  function exportExcel() {
    const data = rows.map((r) =>
      dataType === 'donations'
        ? {
            [rt('receiptNo')]: (r as { receiptNo?: string }).receiptNo ?? '',
            [rt('date')]: r.date,
            [rt('donorName')]: pk(reportLang, r, 'donorName'),
            [rt('purpose')]: pk(reportLang, r, 'purpose'),
            [rt('paymentMode')]: strings[r.paymentMode as 'cash'][reportLang],
            [rt('amount')]: r.amount,
          }
        : {
            [rt('date')]: r.date,
            [rt('description')]: pk(reportLang, r, 'description'),
            [rt('paidTo')]: pk(reportLang, r, 'paidTo'),
            [rt('paymentMode')]: strings[r.paymentMode as 'cash'][reportLang],
            [rt('amount')]: r.amount,
          },
    )
    exportRowsToExcel(data, `${orgName}-report-${langTag}.xlsx`, dataType)
  }

  const pageCount = printPages?.length ?? 1

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-stone-800">{t('reports')}</h1>

      <div className="card space-y-3">
        {/* Data type */}
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-100 p-1">
          {(['donations', 'expenses'] as DataType[]).map((d) => (
            <button
              key={d}
              onClick={() => setDataType(d)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                dataType === d ? 'bg-white text-saffron-700 shadow-sm' : 'text-stone-500'
              }`}
            >
              {d === 'donations' ? t('nav_donations') : t('nav_expenses')}
            </button>
          ))}
        </div>

        {/* Combinable filters */}
        <div className="flex items-center justify-between">
          <label className="label !mb-0">{t('filters')}</label>
          {anyFilter && (
            <button onClick={clearFilters} className="text-xs font-semibold text-saffron-600 hover:text-saffron-700">
              {t('clearFilters')}
            </button>
          )}
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">{t('fromDate')}</label>
            <input type="date" className="field" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('toDate')}</label>
            <input type="date" className="field" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        {/* Payment mode (multi-select) */}
        <div>
          <label className="label">{t('paymentMode')}</label>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_MODES.map((m) => (
              <button
                key={m}
                onClick={() => toggleMode(m)}
                className={`chip ${modes.includes(m) ? 'bg-saffron-600 text-white' : 'bg-stone-100 text-stone-600'}`}
              >
                {t(m)}
              </button>
            ))}
          </div>
        </div>

        {/* Purpose (multi-select, donations only) */}
        {dataType === 'donations' && purposes && purposes.length > 0 && (
          <div>
            <label className="label">{t('purpose')}</label>
            <div className="flex flex-wrap gap-1.5">
              {purposes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePurpose(p.id!)}
                  className={`chip ${purposeIds.includes(p.id!) ? 'bg-saffron-600 text-white' : 'bg-stone-100 text-stone-600'}`}
                >
                  {p.name_en} / {p.name_gu}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Event */}
        {events && events.length > 0 && (
          <div>
            <label className="label">{t('event')}</label>
            <select className="field" value={eventId} onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">{t('allEvents')}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name_en} / {ev.name_gu}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Report language */}
        <div>
          <label className="label">{t('reportLanguage')}</label>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-100 p-1">
            {(['en', 'gu'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setReportLang(l)}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  reportLang === l ? 'bg-white text-saffron-700 shadow-sm' : 'text-stone-500'
                }`}
              >
                {l === 'en' ? 'English' : 'ગુજરાતી'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary + export */}
      <div className="flex items-center justify-between rounded-xl bg-saffron-50 px-4 py-3 ring-1 ring-saffron-100">
        <div>
          <div className="text-xs text-stone-500">{rows.length} {t('resultsFound')}</div>
          <div className="text-lg font-bold tabular-nums text-saffron-700">{formatINR(total)}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPdf} disabled={exporting} className="btn-primary !px-3">
            <Download size={16} /> {exporting ? '…' : 'PDF'}
          </button>
          <button onClick={exportExcel} className="btn-ghost !px-3">
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </div>

      {/* On-screen preview (single continuous document) */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-stone-200">
        <ReportDoc
          rows={rows}
          startIndex={0}
          isLast
          dataType={dataType}
          reportLang={reportLang}
          orgName={orgName}
          settings={settings}
          grandTotal={total}
          grandCount={rows.length}
        />
      </div>

      {/* Hidden, page-sized documents used only for PDF capture */}
      {printPages && (
        <div ref={printRootRef} aria-hidden className="pointer-events-none fixed -left-[10000px] top-0">
          {printPages.map((pg, i) => (
            <div className="pdf-page" key={i}>
              <ReportDoc
                rows={pg.slice}
                startIndex={pg.start}
                pageNo={i + 1}
                pageCount={pageCount}
                isLast={i === pageCount - 1}
                dataType={dataType}
                reportLang={reportLang}
                orgName={orgName}
                settings={settings}
                grandTotal={total}
                grandCount={rows.length}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ReportDocProps {
  rows: Row[]
  startIndex: number
  isLast: boolean
  dataType: DataType
  reportLang: Lang
  orgName: string
  settings?: Settings
  grandTotal: number
  grandCount: number
  pageNo?: number
  pageCount?: number
}

/** One report document/page: slim orange band with KPIs, a table slice, and (on the last page) the signature. */
function ReportDoc({
  rows,
  startIndex,
  isLast,
  dataType,
  reportLang,
  orgName,
  settings,
  grandTotal,
  grandCount,
  pageNo,
  pageCount,
}: ReportDocProps) {
  const rt = (key: StringKey) => tr(reportLang, key)
  const rpick = (obj: object, base: string) => pk(reportLang, obj, base)
  const money = (n: number) => mn(reportLang, n)
  const addr = settings?.address_gu?.trim() || settings?.address_en || ''

  return (
    <div lang={reportLang} className="w-[720px] bg-white text-stone-800">
      {/* Slim orange gradient band (inline sRGB so it always renders in the exported PDF) */}
      <div className="px-8 py-4 text-white" style={{ background: 'linear-gradient(135deg, #b8420b 0%, #ea580c 55%, #f97316 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-11 w-11 rounded-full bg-white" style={{ border: '2px solid rgba(255,255,255,0.7)' }} />
            <div className="leading-tight">
              <div className="text-lg font-extrabold">{orgName}</div>
              {(addr || settings?.phone) && (
                <div className="text-[11px] opacity-90">
                  {addr}
                  {addr && settings?.phone ? ' · ' : ''}
                  {settings?.phone ? `☎ ${settings.phone}` : ''}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest opacity-80">
                {reportLang === 'gu' ? 'નાણાકીય રિપોર્ટ' : 'Financial Report'}
              </div>
              <div className="text-sm font-bold">{dataType === 'donations' ? rt('nav_donations') : rt('nav_expenses')}</div>
            </div>
            {/* Compact KPI chips */}
            <div className="flex gap-2">
              <div className="rounded-lg px-3 py-1.5 text-right" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.32)' }}>
                <div className="text-[9px] font-semibold uppercase tracking-wide opacity-85">{rt('total')}</div>
                <div className="text-base font-extrabold tabular-nums">{money(grandTotal)}</div>
              </div>
              <div className="rounded-lg px-3 py-1.5 text-right" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.32)' }}>
                <div className="text-[9px] font-semibold uppercase tracking-wide opacity-85">
                  {dataType === 'donations' ? rt('nav_donations') : rt('nav_expenses')}
                </div>
                <div className="text-base font-extrabold tabular-nums">{guNum(reportLang, grandCount)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-5">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-amber-500 text-[11px] uppercase tracking-wide text-white">
              <th className="px-3 py-2.5 font-semibold">#</th>
              <th className="px-3 py-2.5 font-semibold">{rt('date')}</th>
              <th className="px-3 py-2.5 font-semibold">{dataType === 'donations' ? rt('donorName') : rt('description')}</th>
              <th className="px-3 py-2.5 font-semibold">{dataType === 'donations' ? rt('purpose') : rt('paidTo')}</th>
              <th className="px-3 py-2.5 font-semibold">{rt('paymentMode')}</th>
              <th className="px-3 py-2.5 text-right font-semibold">{rt('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i} className={i % 2 ? 'bg-amber-50' : 'bg-saffron-50'}>
                <td className="px-3 py-2 font-semibold text-amber-700">{guNum(reportLang, startIndex + i + 1)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-stone-500">{formatDate(r.date, 'en')}</td>
                <td className="px-3 py-2 font-semibold text-stone-800">
                  {dataType === 'donations' ? rpick(r, 'donorName') : rpick(r, 'description') || rpick(r, 'category')}
                </td>
                <td className="px-3 py-2 text-stone-600">{dataType === 'donations' ? rpick(r, 'purpose') : rpick(r, 'paidTo')}</td>
                <td className="px-3 py-2">
                  <span className="chip bg-amber-100 text-amber-700">{strings[r.paymentMode as 'cash'][reportLang]}</span>
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-stone-800">{money(r.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-stone-400">{rt('noData')}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Signature footer only on the last page */}
        {isLast && (
          <div className="mt-8 flex items-end justify-between border-t border-dashed border-stone-200 pt-4">
            <div className="text-[10px] leading-relaxed text-stone-400">
              {reportLang === 'gu' ? 'આ કમ્પ્યુટર દ્વારા જનરેટ થયેલ રિપોર્ટ છે.' : 'This is a computer-generated report.'}
              <br />
              {orgName} · {formatDate(todayISO(), 'en')}
            </div>
            <div className="text-center">
              <img src="/signature.jpg" alt="" className="mx-auto mb-1 h-12 object-contain" />
              <div className="w-36 border-t border-stone-300 pt-1 text-[10px] text-stone-500">{rt('authorisedSign')}</div>
            </div>
          </div>
        )}

        {/* Page number (PDF only) */}
        {pageNo && pageCount && (
          <div className="mt-3 text-center text-[10px] text-stone-400">
            {reportLang === 'gu' ? 'પાનું' : 'Page'} {guNum(reportLang, pageNo)} / {guNum(reportLang, pageCount)}
          </div>
        )}
      </div>
    </div>
  )
}
