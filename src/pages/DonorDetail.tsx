import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Phone, MapPin, Trash2 } from 'lucide-react'
import { deleteDonor, getDonationsByDonor, getDonor } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatINR, formatDate } from '../lib/format'
import StatCard from '../components/StatCard'

export default function DonorDetail() {
  const { t, lang, pick } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const did = Number(id)

  const donor = useQuery('donors', () => getDonor(did), [id])
  const donations = useQuery('donations', () => getDonationsByDonor(did), [id])

  if (!donor) return <div className="py-10 text-center text-stone-400">…</div>

  const list = donations ?? []
  const total = list.reduce((s, d) => s + d.amount, 0)

  async function remove() {
    if (!confirm(t('deleteConfirm'))) return
    await deleteDonor(did)
    nav('/donors')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-stone-800">{pick(donor, 'name')}</h1>
        <button onClick={remove} className="rounded-full p-1.5 text-stone-400 hover:text-red-600">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="card space-y-1 text-sm text-stone-600">
        {donor.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-stone-400" /> {donor.phone}</div>}
        {(donor.address_en || donor.address_gu) && (
          <div className="flex items-center gap-2"><MapPin size={14} className="text-stone-400" /> {pick(donor, 'address')}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label={t('total')} value={formatINR(total)} tone="green" />
        <StatCard label={t('donationsCount')} value={String(list.length)} tone="saffron" />
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-stone-700">{t('nav_donations')}</div>
        <div className="space-y-2">
          {list.map((d) => (
            <Link key={d.id} to={`/donations/${d.id}`} className="card flex items-center justify-between !p-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">{pick(d, 'purpose') || '—'}</div>
                <div className="text-[11px] text-stone-400">{d.receiptNo} · {formatDate(d.date, lang)}</div>
              </div>
              <div className="text-sm font-bold tabular-nums text-emerald-600">{formatINR(d.amount)}</div>
            </Link>
          ))}
          {list.length === 0 && <div className="text-center text-xs text-stone-400">{t('noData')}</div>}
        </div>
      </div>
    </div>
  )
}
