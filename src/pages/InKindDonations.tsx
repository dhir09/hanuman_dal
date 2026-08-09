import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useQuery } from '../hooks/useQuery'
import { getAllInKindDonationsDesc } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatDate, formatINR } from '../lib/format'

export default function InKindDonations() {
  const { t, lang, pick } = useI18n()
  const data = useQuery('inKindDonations', getAllInKindDonationsDesc, [])
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'valued'>('all')

  const filtered = (data ?? []).filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (q) {
      const s = q.toLowerCase()
      return (
        d.donorName_en.toLowerCase().includes(s) ||
        d.donorName_gu.includes(s) ||
        d.receiptNo.toLowerCase().includes(s)
      )
    }
    return true
  })

  const valuedTotal = filtered.filter((d) => d.status === 'valued').reduce((s, d) => s + d.items.reduce((a, i) => a + (i.amount ?? 0), 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">{t('nav_inKindDonations')}</h1>
        <Link to="/in-kind/new" className="btn-primary py-2 text-xs">
          <Plus size={16} /> {t('add')}
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          className="field pl-9"
          placeholder={t('search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5">
        {(['all', 'pending', 'valued'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`chip ${statusFilter === s ? 'bg-saffron-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}
          >
            {s === 'all' ? t('all') : s === 'pending' ? t('pending') : t('valued')}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl bg-saffron-50 px-3 py-2 text-sm ring-1 ring-saffron-100">
        <span className="text-stone-600">{filtered.length} {t('resultsFound')}</span>
        {valuedTotal > 0 && <span className="font-bold text-saffron-700">{formatINR(valuedTotal)}</span>}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((d) => (
          <Link key={d.id} to={`/in-kind/${d.id}`} className="card flex items-center justify-between !p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-stone-800">{pick(d, 'donorName')}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-400">
                <span className="font-medium text-saffron-600">{d.receiptNo}</span>
                <span>{formatDate(d.date, lang)}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {d.items.slice(0, 3).map((it, i) => (
                  <span key={i} className="chip bg-stone-100 text-stone-600">
                    {it.name_gu || it.name_en} ×{it.quantity}
                  </span>
                ))}
                {d.items.length > 3 && <span className="chip bg-stone-100 text-stone-400">+{d.items.length - 3}</span>}
              </div>
            </div>
            <span className={`chip ml-2 shrink-0 ${d.status === 'valued' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {d.status === 'valued' ? t('valued') : t('pending')}
            </span>
          </Link>
        ))}
        {data && filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-stone-400">{t('noData')}</div>
        )}
      </div>
    </div>
  )
}
