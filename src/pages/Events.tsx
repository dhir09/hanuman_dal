import { useEffect, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, CalendarDays } from 'lucide-react'
import { addEvent, getAllDonations, getAllEventsDesc, getAllExpenses } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatINR, formatDate, todayISO } from '../lib/format'
import Modal from '../components/Modal'
import BilingualInput from '../components/BilingualInput'

export default function Events() {
  const { t, lang, pick } = useI18n()
  const [open, setOpen] = useState(false)
  const [nameEn, setNameEn] = useState('')
  const [nameGu, setNameGu] = useState('')
  const [date, setDate] = useState(todayISO())
  const [descEn, setDescEn] = useState('')
  const [descGu, setDescGu] = useState('')

  const [params, setParams] = useSearchParams()
  const events = useQuery('events', getAllEventsDesc, [])
  const donations = useQuery('donations', getAllDonations, [])
  const expenses = useQuery('expenses', getAllExpenses, [])

  useEffect(() => {
    if (params.get('add') === '1') {
      setOpen(true)
      params.delete('add')
      setParams(params, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    if (!nameEn.trim() && !nameGu.trim()) return alert(t('name'))
    await addEvent({
      name_en: nameEn.trim(),
      name_gu: nameGu.trim(),
      date,
      description_en: descEn.trim(),
      description_gu: descGu.trim(),
      createdAt: new Date().toISOString(),
    })
    setNameEn(''); setNameGu(''); setDescEn(''); setDescGu(''); setDate(todayISO())
    setOpen(false)
  }

  if (!events) return <div className="py-10 text-center text-stone-400">…</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">{t('nav_events')}</h1>
        <button onClick={() => setOpen(true)} className="btn-primary py-2">
          <Plus size={18} /> {t('add')}
        </button>
      </div>

      {events.length === 0 ? (
        <div className="card py-10 text-center text-sm text-stone-400">{t('noData')}</div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => {
            const col = (donations ?? []).filter((d) => d.eventId === ev.id).reduce((s, d) => s + d.amount, 0)
            const spent = (expenses ?? []).filter((e) => e.eventId === ev.id).reduce((s, e) => s + e.amount, 0)
            const bal = col - spent
            return (
              <Link key={ev.id} to={`/events/${ev.id}`} className="card block !p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-saffron-100 text-saffron-600">
                      <CalendarDays size={18} />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-stone-800">{pick(ev, 'name')}</div>
                      <div className="text-xs text-stone-400">{formatDate(ev.date, lang)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold tabular-nums ${bal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(bal)}</div>
                    <div className="text-[10px] text-stone-400">{t('balance')}</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-3 text-[11px] text-stone-500">
                  <span className="text-emerald-600">↑ {formatINR(col)}</span>
                  <span className="text-red-500">↓ {formatINR(spent)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        title={t('addEvent')}
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
            <label className="label">{t('date')} *</label>
            <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <BilingualInput label={`${t('description')} (${t('optional')})`} valueEn={descEn} valueGu={descGu} onEn={setDescEn} onGu={setDescGu} />
        </div>
      </Modal>
    </div>
  )
}
