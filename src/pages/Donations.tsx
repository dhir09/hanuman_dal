import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Receipt as ReceiptIcon, SlidersHorizontal, X } from 'lucide-react'
import { getAllDonationsDesc, getAllPurposes, getAllEventsDesc, type PaymentMode } from '../db/db'
import { useQuery } from '../hooks/useQuery'
import { useI18n } from '../i18n/I18nContext'
import { formatINR, formatDate } from '../lib/format'

const PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'bank', 'cheque']

export default function Donations() {
  const { t, lang, pick } = useI18n()
  const [q, setQ] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [purposeIds, setPurposeIds] = useState<number[]>([])
  const [modes, setModes] = useState<PaymentMode[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [eventId, setEventId] = useState<number | ''>('')

  const donations = useQuery('donations', getAllDonationsDesc, [])
  const purposes = useQuery('purposes', getAllPurposes, [])
  const events = useQuery('events', getAllEventsDesc, [])

  const togglePurpose = (id: number) =>
    setPurposeIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const toggleMode = (m: PaymentMode) =>
    setModes((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))
  const clearFilters = () => {
    setPurposeIds([])
    setModes([])
    setFromDate('')
    setToDate('')
    setEventId('')
  }
  const anyFilter = Boolean(purposeIds.length || modes.length || fromDate || toDate || eventId !== '')
  const activeCount = [purposeIds.length > 0, modes.length > 0, Boolean(fromDate || toDate), eventId !== ''].filter(Boolean).length

  if (!donations) return <div className="py-10 text-center text-stone-400">…</div>

  const term = q.trim().toLowerCase()
  const list = donations.filter((d) => {
    if (term && !(
      d.donorName_en.toLowerCase().includes(term) ||
      d.donorName_gu.includes(q) ||
      d.receiptNo.toLowerCase().includes(term) ||
      d.purpose_en.toLowerCase().includes(term)
    )) return false
    if (purposeIds.length && !(d.purposeId !== undefined && purposeIds.includes(d.purposeId))) return false
    if (modes.length && !modes.includes(d.paymentMode)) return false
    if (fromDate && d.date < fromDate) return false
    if (toDate && d.date > toDate) return false
    if (eventId !== '' && d.eventId !== eventId) return false
    return true
  })

  const total = list.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">{t('nav_donations')}</h1>
        <Link to="/donations/new" className="btn-primary py-2">
          <Plus size={18} /> {t('add')}
        </Link>
      </div>

      {/* Search + minimal filter trigger */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className="field pl-9" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button
          onClick={() => setShowFilter(true)}
          className={`relative shrink-0 rounded-xl p-2.5 ring-1 transition ${
            activeCount ? 'bg-saffron-600 text-white ring-saffron-600' : 'bg-white text-stone-600 ring-stone-200'
          }`}
          aria-label={t('filters')}
        >
          <SlidersHorizontal size={18} />
          {activeCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-saffron-700 ring-1 ring-saffron-600">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-saffron-50 px-4 py-2 text-sm ring-1 ring-saffron-100">
        <span className="text-stone-600">{list.length} {t('resultsFound')}</span>
        <span className="font-bold tabular-nums text-saffron-700">{formatINR(total)}</span>
      </div>

      {list.length === 0 ? (
        <div className="card py-10 text-center text-sm text-stone-400">{t('noData')}</div>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <Link key={d.id} to={`/donations/${d.id}`} className="card flex items-center justify-between !p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-stone-800">{pick(d, 'donorName') || '—'}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="chip bg-stone-100 text-stone-500">{d.receiptNo}</span>
                  <span>{pick(d, 'purpose')}</span>
                  <span>· {formatDate(d.date, lang)}</span>
                </div>
              </div>
              <div className="ml-2 text-right">
                <div className="text-sm font-bold tabular-nums text-emerald-600">{formatINR(d.amount)}</div>
                <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-stone-400">
                  <ReceiptIcon size={11} /> {t(d.paymentMode)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Filter pane (bottom sheet) */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilter(false)} />
          <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 pb-6 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-800">{t('filters')}</h2>
              <div className="flex items-center gap-3">
                {anyFilter && (
                  <button onClick={clearFilters} className="text-xs font-semibold text-saffron-600 hover:text-saffron-700">
                    {t('clearFilters')}
                  </button>
                )}
                <button onClick={() => setShowFilter(false)} className="rounded-full p-1 text-stone-400 hover:bg-stone-100">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Purpose */}
              {purposes && purposes.length > 0 && (
                <div>
                  <label className="label">{t('purpose')}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {purposes.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => togglePurpose(p.id!)}
                        className={`chip ${purposeIds.includes(p.id!) ? 'bg-saffron-600 text-white' : 'bg-stone-100 text-stone-600'}`}
                      >
                        {pick(p, 'name')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment mode */}
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
            </div>

            <button onClick={() => setShowFilter(false)} className="btn-primary mt-5 w-full">
              {t('apply')} · {list.length} {t('resultsFound')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
