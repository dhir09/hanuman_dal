import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Sparkles } from 'lucide-react'
import { useQuery } from '../hooks/useQuery'
import { getAllDecorationPlansDesc, decorationItemPieces, decorationPlanTotal } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatDate, formatINR } from '../lib/format'

export default function Decorations() {
  const { t, lang, pick } = useI18n()
  const data = useQuery('decorationPlans', getAllDecorationPlansDesc, [])
  const [q, setQ] = useState('')

  const filtered = (data ?? []).filter((p) => {
    if (!q) return true
    const s = q.toLowerCase()
    return (
      p.title_en.toLowerCase().includes(s) ||
      p.title_gu.includes(s) ||
      p.items.some((it) => it.name_en.toLowerCase().includes(s) || it.name_gu.includes(s) || it.category_en.toLowerCase().includes(s) || it.category_gu.includes(s))
    )
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">{t('nav_decorations')}</h1>
        <Link to="/decorations/new" className="btn-primary py-2 text-xs">
          <Plus size={16} /> {t('add')}
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input className="field pl-9" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => {
          const totalPieces = p.items.reduce((s, it) => s + decorationItemPieces(it), 0)
          const cost = decorationPlanTotal(p)
          const cats = Array.from(new Set(p.items.map((it) => it.category_gu || it.category_en).filter(Boolean)))
          return (
            <Link key={p.id} to={`/decorations/${p.id}`} className="card flex items-center justify-between !p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-stone-800">
                  {pick(p, 'title') || t('decorationPlan')}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-400">
                  <span>{formatDate(p.date, lang)}</span>
                  <span>· {p.items.length} {t('items')}</span>
                  <span>· {totalPieces} {t('pieces')}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {cats.slice(0, 4).map((c, i) => (
                    <span key={i} className="chip bg-saffron-50 text-saffron-700">{c}</span>
                  ))}
                  {cats.length > 4 && <span className="chip bg-stone-100 text-stone-400">+{cats.length - 4}</span>}
                </div>
              </div>
              {cost > 0 && <div className="ml-2 shrink-0 text-sm font-bold tabular-nums text-saffron-700">{formatINR(cost)}</div>}
            </Link>
          )
        })}
        {data && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-stone-400">
            <Sparkles size={28} className="mx-auto mb-2 text-stone-300" />
            {t('noData')}
          </div>
        )}
      </div>
    </div>
  )
}
