import { Link } from 'react-router-dom'
import { HandCoins, Receipt, TrendingUp, Users, CalendarDays, ArrowDownRight, ArrowUpRight, Megaphone } from 'lucide-react'
import type { ComponentType } from 'react'
import { getAllAdvertisementIncomes, getAllDonations, getAllExpenses, getDonorCount } from '../db/db'
import { useQuery } from '../hooks/useQuery'
import { useI18n } from '../i18n/I18nContext'
import { formatINR, formatDate, monthKey } from '../lib/format'
import StatCard from '../components/StatCard'

export default function Dashboard() {
  const { t, lang, pick } = useI18n()
  const donations = useQuery('donations', getAllDonations, [])
  const expenses = useQuery('expenses', getAllExpenses, [])
  const advertisementIncomes = useQuery('advertisementIncomes', getAllAdvertisementIncomes, [])
  const donorCount = useQuery('donors', getDonorCount, [])

  if (!donations || !expenses || !advertisementIncomes) return <div className="py-10 text-center text-stone-400">…</div>

  const totalDon = donations.reduce((s, d) => s + d.amount, 0)
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0)
  const totalAdIncome = advertisementIncomes.reduce((s, income) => s + income.amount, 0)
  const net = totalDon + totalAdIncome - totalExp

  const thisMonth = monthKey(new Date().toISOString())
  const monthDon = donations.filter((d) => monthKey(d.date) === thisMonth).reduce((s, d) => s + d.amount, 0)

  // By purpose
  const byPurpose = new Map<string, number>()
  for (const d of donations) {
    const key = pick(d, 'purpose') || '—'
    byPurpose.set(key, (byPurpose.get(key) || 0) + d.amount)
  }
  const purposeRows = [...byPurpose.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxPurpose = purposeRows[0]?.[1] || 1

  // Last 6 months bars
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toISOString().slice(0, 7))
  }
  const monthTotals = months.map((m) => ({
    m,
    don: donations.filter((d) => monthKey(d.date) === m).reduce((s, d) => s + d.amount, 0),
    exp: expenses.filter((e) => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0),
  }))
  const maxMonth = Math.max(1, ...monthTotals.map((x) => Math.max(x.don, x.exp)))

  const recent = [...donations].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-saffron-600 to-saffron-500 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">{t('netBalance')}</div>
          <div className="mt-1 text-4xl font-extrabold tabular-nums">{formatINR(net)}</div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white/15 px-3 py-2 ring-1 ring-white/20">
              <div className="text-[10px] font-medium uppercase tracking-wide opacity-85">{t('totalDonations')}</div>
              <div className="mt-0.5 flex items-center gap-1 text-lg font-bold tabular-nums">
                <ArrowUpRight size={16} /> {formatINR(totalDon)}
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2 ring-1 ring-white/20">
              <div className="text-[10px] font-medium uppercase tracking-wide opacity-85">{t('totalExpenses')}</div>
              <div className="mt-0.5 flex items-center gap-1 text-lg font-bold tabular-nums">
                <ArrowDownRight size={16} /> {formatINR(totalExp)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction to="/donations/new" icon={HandCoins} label={t('addDonation')} tone="saffron" />
        <QuickAction to="/expenses?add=1" icon={Receipt} label={t('addExpense')} tone="red" />
        <QuickAction to="/events?add=1" icon={CalendarDays} label={t('addEvent')} tone="green" />
        <QuickAction to="/advertising-income" icon={Megaphone} label={t('advertisementIncome')} tone="green" />
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t('thisMonth')} value={formatINR(monthDon)} tone="green" icon={<TrendingUp size={18} />} />
        <StatCard label={t('donationsCount')} value={String(donations.length)} tone="saffron" icon={<HandCoins size={18} />} />
        <StatCard label={t('donorsCount')} value={String(donorCount ?? 0)} tone="stone" icon={<Users size={18} />} />
        <StatCard label={t('totalExpenses')} value={formatINR(totalExp)} tone="red" icon={<Receipt size={18} />} />
        <StatCard label={t('advertisementIncome')} value={formatINR(totalAdIncome)} tone="green" icon={<Megaphone size={18} />} />
      </div>

      {/* Last 6 months */}
      <div className="card">
        <div className="mb-3 text-sm font-bold text-stone-700">{t('last6Months')}</div>
        <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
          {monthTotals.map((x) => (
            <div key={x.m} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-full w-full items-end justify-center gap-0.5">
                <div
                  className="w-2.5 rounded-t bg-emerald-400"
                  style={{ height: `${(x.don / maxMonth) * 100}%` }}
                  title={formatINR(x.don)}
                />
                <div
                  className="w-2.5 rounded-t bg-red-300"
                  style={{ height: `${(x.exp / maxMonth) * 100}%` }}
                  title={formatINR(x.exp)}
                />
              </div>
              <span className="text-[9px] text-stone-400">
                {new Date(x.m + '-01').toLocaleDateString(lang === 'gu' ? 'gu-IN' : 'en-IN', { month: 'short' })}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-stone-500">
          <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded bg-emerald-400" /> {t('collected')}</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded bg-red-300" /> {t('spent')}</span>
        </div>
      </div>

      {/* By purpose */}
      {purposeRows.length > 0 && (
        <div className="card">
          <div className="mb-3 text-sm font-bold text-stone-700">{t('byPurpose')}</div>
          <div className="space-y-2.5">
            {purposeRows.map(([name, amt]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-stone-600">{name}</span>
                  <span className="font-semibold tabular-nums text-stone-700">{formatINR(amt)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-saffron-500" style={{ width: `${(amt / maxPurpose) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent donations */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-stone-700">{t('recentDonations')}</div>
          <Link to="/donations" className="text-xs font-semibold text-saffron-600">{t('all')}</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-6 text-center text-sm text-stone-400">{t('noData')}</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recent.map((d) => (
              <Link key={d.id} to={`/donations/${d.id}`} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-semibold text-stone-800">{pick(d, 'donorName') || '—'}</div>
                  <div className="text-xs text-stone-400">{pick(d, 'purpose')} · {formatDate(d.date, lang)}</div>
                </div>
                <div className="text-sm font-bold tabular-nums text-emerald-600">{formatINR(d.amount)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const quickTones: Record<string, string> = {
  saffron: 'bg-saffron-100 text-saffron-700',
  red: 'bg-red-100 text-red-600',
  green: 'bg-emerald-100 text-emerald-700',
}

function QuickAction({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string
  icon: ComponentType<{ size?: number }>
  label: string
  tone: 'saffron' | 'red' | 'green'
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-stone-100 transition active:scale-95"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-full ${quickTones[tone]}`}>
        <Icon size={20} />
      </span>
      <span className="text-[11px] font-semibold leading-tight text-stone-600">{label}</span>
    </Link>
  )
}
