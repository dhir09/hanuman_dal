import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { deleteEvent, getAdvertisementIncomesByEvent, getDecorationPlansByEvent, getDonationsByEvent, getEvent, getExpensesByEvent, getInKindDonationsByEvent, decorationItemPieces } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatINR, formatDate } from '../lib/format'
import StatCard from '../components/StatCard'

export default function EventDetail() {
  const { t, lang, pick } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const eid = Number(id)

  const event = useQuery('events', () => getEvent(eid), [id])
  const donations = useQuery('donations', () => getDonationsByEvent(eid), [id])
  const expenses = useQuery('expenses', () => getExpensesByEvent(eid), [id])
  const advertisementIncomes = useQuery('advertisementIncomes', () => getAdvertisementIncomesByEvent(eid), [id])
  const inKindDonations = useQuery('inKindDonations', () => getInKindDonationsByEvent(eid), [id])
  const decorationPlans = useQuery('decorationPlans', () => getDecorationPlansByEvent(eid), [id])

  if (!event) return <div className="py-10 text-center text-stone-400">…</div>

  const col = (donations ?? []).reduce((s, d) => s + d.amount, 0)
  const spent = (expenses ?? []).reduce((s, e) => s + e.amount, 0)
  const advertising = (advertisementIncomes ?? []).reduce((s, income) => s + income.amount, 0)
  const bal = col + advertising - spent

  async function remove() {
    if (!confirm(t('deleteConfirm'))) return
    await deleteEvent(eid)
    nav('/events')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-stone-800">{pick(event, 'name')}</h1>
        <button onClick={remove} className="rounded-full p-1.5 text-stone-400 hover:text-red-600">
          <Trash2 size={18} />
        </button>
      </div>
      <div className="text-sm text-stone-400">{formatDate(event.date, lang)}</div>
      {(event.description_en || event.description_gu) && (
        <div className="card text-sm text-stone-600">{pick(event, 'description')}</div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <StatCard label={t('collected')} value={formatINR(col)} tone="green" />
        <StatCard label={t('advertisementIncome')} value={formatINR(advertising)} tone="green" />
        <StatCard label={t('spent')} value={formatINR(spent)} tone="red" />
        <StatCard label={t('balance')} value={formatINR(bal)} tone={bal >= 0 ? 'saffron' : 'red'} />
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-stone-700">{t('advertisementIncome')} ({advertisementIncomes?.length ?? 0})</div>
        <div className="space-y-2">
          {(advertisementIncomes ?? []).map((income) => (
            <div key={income.id} className="card flex items-center justify-between !p-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{pick(income, 'advertiser')}</div>
                <div className="text-[11px] text-stone-400">{formatDate(income.date, lang)}</div>
              </div>
              <div className="text-sm font-bold tabular-nums text-indigo-600">{formatINR(income.amount)}</div>
            </div>
          ))}
          {advertisementIncomes?.length === 0 && <div className="text-center text-xs text-stone-400">{t('noData')}</div>}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-stone-700">{t('nav_donations')} ({donations?.length ?? 0})</div>
        <div className="space-y-2">
          {(donations ?? []).map((d) => (
            <Link key={d.id} to={`/donations/${d.id}`} className="card flex items-center justify-between !p-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{pick(d, 'donorName')}</div>
                <div className="text-[11px] text-stone-400">{formatDate(d.date, lang)}</div>
              </div>
              <div className="text-sm font-bold tabular-nums text-emerald-600">{formatINR(d.amount)}</div>
            </Link>
          ))}
          {donations?.length === 0 && <div className="text-center text-xs text-stone-400">{t('noData')}</div>}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-stone-700">{t('nav_expenses')} ({expenses?.length ?? 0})</div>
        <div className="space-y-2">
          {(expenses ?? []).map((e) => (
            <div key={e.id} className="card flex items-center justify-between !p-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{pick(e, 'description') || pick(e, 'category')}</div>
                <div className="text-[11px] text-stone-400">{formatDate(e.date, lang)}</div>
              </div>
              <div className="text-sm font-bold tabular-nums text-red-600">{formatINR(e.amount)}</div>
            </div>
          ))}
          {expenses?.length === 0 && <div className="text-center text-xs text-stone-400">{t('noData')}</div>}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-stone-700">{t('nav_inKindDonations')} ({inKindDonations?.length ?? 0})</div>
        <div className="space-y-2">
          {(inKindDonations ?? []).map((ik) => (
            <Link key={ik.id} to={`/in-kind/${ik.id}`} className="card flex items-center justify-between !p-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{pick(ik, 'donorName')}</div>
                <div className="text-[11px] text-stone-400">
                  {ik.items.map((it) => it.name_gu || it.name_en).join(', ')}
                </div>
              </div>
              <span className={`chip ${ik.status === 'valued' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {ik.status === 'valued' ? t('valued') : t('pending')}
              </span>
            </Link>
          ))}
          {inKindDonations?.length === 0 && <div className="text-center text-xs text-stone-400">{t('noData')}</div>}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-stone-700">{t('nav_decorations')} ({decorationPlans?.length ?? 0})</div>
        <div className="space-y-2">
          {(decorationPlans ?? []).map((p) => (
            <Link key={p.id} to={`/decorations/${p.id}`} className="card flex items-center justify-between !p-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{pick(p, 'title') || t('decorationPlan')}</div>
                <div className="text-[11px] text-stone-400">
                  {p.items.length} {t('items')} · {p.items.reduce((s, it) => s + decorationItemPieces(it), 0)} {t('pieces')}
                </div>
              </div>
              <span className="chip bg-saffron-100 text-saffron-700">{t('decoration')}</span>
            </Link>
          ))}
          {decorationPlans?.length === 0 && <div className="text-center text-xs text-stone-400">{t('noData')}</div>}
        </div>
      </div>
    </div>
  )
}
