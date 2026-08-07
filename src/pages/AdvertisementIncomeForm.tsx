import { useEffect, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import {
  addAdvertisementIncome,
  deleteAdvertisementIncome,
  getAdvertisementIncome,
  getAllEventsDesc,
  nextAdvertisementReceiptNo,
  updateAdvertisementIncome,
  type PaymentMode,
} from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { todayISO } from '../lib/format'
import BilingualInput from '../components/BilingualInput'
import PaymentSelect from '../components/PaymentSelect'

export default function AdvertisementIncomeForm() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)

  const events = useQuery('events', getAllEventsDesc, [])

  const [date, setDate] = useState(todayISO())
  const [eventId, setEventId] = useState<number | ''>('')
  const [advertiserEn, setAdvertiserEn] = useState('')
  const [advertiserGu, setAdvertiserGu] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descGu, setDescGu] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')

  // Load existing record when editing
  useEffect(() => {
    if (!id) return
    getAdvertisementIncome(Number(id)).then((inc) => {
      if (!inc) return
      setDate(inc.date)
      setEventId(inc.eventId ?? '')
      setAdvertiserEn(inc.advertiser_en)
      setAdvertiserGu(inc.advertiser_gu)
      setDescEn(inc.description_en)
      setDescGu(inc.description_gu)
      setAmount(String(inc.amount))
      setPaymentMode(inc.paymentMode)
    })
  }, [id])

  async function save() {
    const amt = parseFloat(amount)
    if (!eventId) return alert(t('event'))
    if (!advertiserEn.trim() && !advertiserGu.trim()) return alert(t('advertiser'))
    if (!amt || amt <= 0) return alert(t('amount'))

    const base = {
      date,
      eventId: Number(eventId),
      advertiser_en: advertiserEn.trim(),
      advertiser_gu: advertiserGu.trim(),
      description_en: descEn.trim(),
      description_gu: descGu.trim(),
      amount: amt,
      paymentMode,
    }

    try {
      if (editing) {
        await updateAdvertisementIncome(Number(id), base)
        nav(`/advertising-income/${id}`)
      } else {
        const receiptNo = await nextAdvertisementReceiptNo(date)
        const newId = await addAdvertisementIncome({
          ...base,
          receiptNo,
          createdAt: new Date().toISOString(),
        })
        nav(`/advertising-income/${newId}`)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  async function remove() {
    if (!id || !confirm(t('deleteConfirm'))) return
    await deleteAdvertisementIncome(Number(id))
    nav('/advertising-income')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-800">{editing ? t('edit') : t('addAdvertisementIncome')}</h1>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('date')} *</label>
            <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('amount')} (₹) *</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              className="field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="label">{t('event')} *</label>
          <select className="field" value={eventId} onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">—</option>
            {events?.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name_en} / {ev.name_gu}
              </option>
            ))}
          </select>
        </div>

        <BilingualInput
          label={t('advertiser')}
          valueEn={advertiserEn}
          valueGu={advertiserGu}
          onEn={setAdvertiserEn}
          onGu={setAdvertiserGu}
          required
        />

        <BilingualInput
          label={`${t('description')} (${t('optional')})`}
          valueEn={descEn}
          valueGu={descGu}
          onEn={setDescEn}
          onGu={setDescGu}
        />

        <div>
          <label className="label">{t('paymentMode')}</label>
          <PaymentSelect value={paymentMode} onChange={setPaymentMode} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="btn-primary flex-1">{t('save')}</button>
        {editing && (
          <button onClick={remove} className="btn-danger">
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
