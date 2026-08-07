import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Megaphone, FileText } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  addAdvertisementIncome,
  deleteAdvertisementIncome,
  getAllAdvertisementIncomesDesc,
  getAllEventsDesc,
  nextAdvertisementReceiptNo,
  updateAdvertisementIncome,
  type AdvertisementIncome as AdvertisementIncomeRecord,
  type PaymentMode,
} from '../db/db'
import { useQuery } from '../hooks/useQuery'
import { useI18n } from '../i18n/I18nContext'
import { formatDate, formatINR, todayISO } from '../lib/format'
import Modal from '../components/Modal'
import BilingualInput from '../components/BilingualInput'
import PaymentSelect from '../components/PaymentSelect'

const empty = () => ({
  date: todayISO(),
  eventId: '' as number | '',
  advertiser_en: '',
  advertiser_gu: '',
  description_en: '',
  description_gu: '',
  amount: '',
  paymentMode: 'cash' as PaymentMode,
})

export default function AdvertisementIncome() {
  const { t, lang, pick } = useI18n()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(empty())
  const incomes = useQuery('advertisementIncomes', getAllAdvertisementIncomesDesc, [])
  const events = useQuery('events', getAllEventsDesc, [])

  useEffect(() => {
    const editId = Number(params.get('edit'))
    const income = incomes?.find((item) => item.id === editId)
    if (!income) return
    openEdit(income)
    params.delete('edit')
    setParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomes])

  function openNew() {
    setEditId(null)
    setForm(empty())
    setOpen(true)
  }

  function openEdit(income: AdvertisementIncomeRecord) {
    setEditId(income.id!)
    setForm({
      date: income.date,
      eventId: income.eventId ?? '',
      advertiser_en: income.advertiser_en,
      advertiser_gu: income.advertiser_gu,
      description_en: income.description_en,
      description_gu: income.description_gu,
      amount: String(income.amount),
      paymentMode: income.paymentMode,
    })
    setOpen(true)
  }

  async function save() {
    const amount = parseFloat(form.amount)
    if (!form.advertiser_en.trim() && !form.advertiser_gu.trim()) return alert(t('advertiser'))
    if (!amount || amount <= 0) return alert(t('amount'))

    const payload = {
      date: form.date,
      eventId: form.eventId || undefined,
      advertiser_en: form.advertiser_en.trim(),
      advertiser_gu: form.advertiser_gu.trim(),
      description_en: form.description_en.trim(),
      description_gu: form.description_gu.trim(),
      amount,
      paymentMode: form.paymentMode,
    }
    try {
      if (editId) {
        await updateAdvertisementIncome(editId, payload)
      } else {
        const receiptNo = await nextAdvertisementReceiptNo(form.date)
        const id = await addAdvertisementIncome({ ...payload, receiptNo, createdAt: new Date().toISOString() })
        setOpen(false)
        nav(`/advertising-income/${id}`)
        return
      }
      setOpen(false)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  async function remove(id: number) {
    if (!confirm(t('deleteConfirm'))) return
    await deleteAdvertisementIncome(id)
  }

  if (!incomes || !events) return <div className="py-10 text-center text-stone-400">…</div>
  const total = incomes.reduce((sum, income) => sum + income.amount, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">{t('nav_advertisementIncome')}</h1>
        <button onClick={openNew} className="btn-primary py-2">
          <Plus size={18} /> {t('add')}
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2 text-sm ring-1 ring-emerald-100">
        <span className="text-stone-600">{incomes.length} {t('resultsFound')}</span>
        <span className="font-bold tabular-nums text-emerald-600">{formatINR(total)}</span>
      </div>

      {incomes.length === 0 ? (
        <div className="card py-10 text-center text-sm text-stone-400">{t('noData')}</div>
      ) : (
        <div className="space-y-2">
          {incomes.map((income) => {
            const event = events.find((item) => item.id === income.eventId)
            return (
              <div key={income.id} className="card flex items-center justify-between !p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Megaphone size={15} className="shrink-0 text-emerald-600" />
                    <div className="truncate text-sm font-semibold text-stone-800">{pick(income, 'advertiser')}</div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-stone-400">
                    <span>{event ? pick(event, 'name') : '—'}</span>
                    <span>· {formatDate(income.date, lang)}</span>
                    {pick(income, 'description') && <span>· {pick(income, 'description')}</span>}
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-1">
                  <div className="text-sm font-bold tabular-nums text-emerald-600">{formatINR(income.amount)}</div>
                  <button onClick={() => nav(`/advertising-income/${income.id}`)} className="p-1 text-stone-400 hover:text-emerald-600" aria-label={t('receipt')}><FileText size={15} /></button>
                  <button onClick={() => openEdit(income)} className="p-1 text-stone-400 hover:text-saffron-600" aria-label={t('edit')}><Pencil size={15} /></button>
                  <button onClick={() => remove(income.id!)} className="p-1 text-stone-400 hover:text-red-600" aria-label={t('delete')}><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        title={editId ? t('edit') : t('addAdvertisementIncome')}
        onClose={() => setOpen(false)}
        footer={<><button onClick={() => setOpen(false)} className="btn-ghost flex-1">{t('cancel')}</button><button onClick={save} className="btn-primary flex-1">{t('save')}</button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('date')} *</label><input type="date" className="field" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
            <div><label className="label">{t('amount')} (₹) *</label><input type="number" inputMode="decimal" min="0" className="field" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></div>
          </div>

          {events.length > 0 && (
            <div>
              <label className="label">{t('event')} ({t('optional')})</label>
              <select className="field" value={form.eventId} onChange={(event) => setForm({ ...form, eventId: event.target.value ? Number(event.target.value) : '' })}>
                <option value="">—</option>
                {events.map((event) => <option key={event.id} value={event.id}>{event.name_en} / {event.name_gu}</option>)}
              </select>
            </div>
          )}

          <BilingualInput label={`${t('advertiser')} *`} valueEn={form.advertiser_en} valueGu={form.advertiser_gu} onEn={(value) => setForm({ ...form, advertiser_en: value })} onGu={(value) => setForm({ ...form, advertiser_gu: value })} />
          <BilingualInput label={`${t('description')} (${t('optional')})`} valueEn={form.description_en} valueGu={form.description_gu} onEn={(value) => setForm({ ...form, description_en: value })} onGu={(value) => setForm({ ...form, description_gu: value })} />
          <div><label className="label">{t('paymentMode')}</label><PaymentSelect value={form.paymentMode} onChange={(paymentMode) => setForm({ ...form, paymentMode })} /></div>
        </div>
      </Modal>
    </div>
  )
}
