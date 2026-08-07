import { useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { Link } from 'react-router-dom'
import { Plus, Search, User } from 'lucide-react'
import { addDonor, getAllDonations, getAllDonorsSorted } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatINR } from '../lib/format'
import Modal from '../components/Modal'
import BilingualInput from '../components/BilingualInput'

export default function Donors() {
  const { t, pick } = useI18n()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [nameEn, setNameEn] = useState('')
  const [nameGu, setNameGu] = useState('')
  const [phone, setPhone] = useState('')
  const [addrEn, setAddrEn] = useState('')
  const [addrGu, setAddrGu] = useState('')

  const donors = useQuery('donors', getAllDonorsSorted, [])
  const donations = useQuery('donations', getAllDonations, [])

  async function save() {
    if (!nameEn.trim() && !nameGu.trim()) return alert(t('name'))
    await addDonor({
      name_en: nameEn.trim(),
      name_gu: nameGu.trim(),
      phone: phone.trim(),
      address_en: addrEn.trim(),
      address_gu: addrGu.trim(),
      createdAt: new Date().toISOString(),
    })
    setNameEn(''); setNameGu(''); setPhone(''); setAddrEn(''); setAddrGu('')
    setOpen(false)
  }

  if (!donors) return <div className="py-10 text-center text-stone-400">…</div>

  const term = q.trim().toLowerCase()
  const list = term
    ? donors.filter((d) => d.name_en.toLowerCase().includes(term) || d.name_gu.includes(q) || d.phone.includes(q))
    : donors

  const totalByDonor = (donorId?: number) =>
    (donations ?? []).filter((d) => d.donorId === donorId).reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">{t('nav_donors')}</h1>
        <button onClick={() => setOpen(true)} className="btn-primary py-2">
          <Plus size={18} /> {t('add')}
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input className="field pl-9" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {list.length === 0 ? (
        <div className="card py-10 text-center text-sm text-stone-400">{t('noData')}</div>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <Link key={d.id} to={`/donors/${d.id}`} className="card flex items-center justify-between !p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-saffron-100 text-saffron-600">
                  <User size={18} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-stone-800">{pick(d, 'name')}</div>
                  {d.phone && <div className="text-xs text-stone-400">{d.phone}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums text-emerald-600">{formatINR(totalByDonor(d.id))}</div>
                <div className="text-[10px] text-stone-400">{t('total')}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={t('addDonor')}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost flex-1">{t('cancel')}</button>
            <button onClick={save} className="btn-primary flex-1">{t('save')}</button>
          </>
        }
      >
        <div className="space-y-4">
          <BilingualInput label={t('name')} valueEn={nameEn} valueGu={nameGu} onEn={setNameEn} onGu={setNameGu} required />
          <div>
            <label className="label">{t('phone')} ({t('optional')})</label>
            <input className="field" value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
          </div>
          <BilingualInput label={`${t('address')} (${t('optional')})`} valueEn={addrEn} valueGu={addrGu} onEn={setAddrEn} onGu={setAddrGu} />
        </div>
      </Modal>
    </div>
  )
}
