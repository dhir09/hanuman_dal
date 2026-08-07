import { useEffect, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { addExpense, deleteExpense, getAllEventsDesc, getAllExpensesDesc, updateExpense, type Expense, type PaymentMode } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatINR, formatDate, todayISO } from '../lib/format'
import Modal from '../components/Modal'
import BilingualInput from '../components/BilingualInput'
import PaymentSelect from '../components/PaymentSelect'

const empty = () => ({
  date: todayISO(),
  eventId: '' as number | '',
  category_en: '',
  category_gu: '',
  description_en: '',
  description_gu: '',
  paidTo_en: '',
  paidTo_gu: '',
  amount: '',
  paymentMode: 'cash' as PaymentMode,
})

export default function Expenses() {
  const { t, lang, pick } = useI18n()
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(empty())

  const expenses = useQuery('expenses', getAllExpensesDesc, [])
  const events = useQuery('events', getAllEventsDesc, [])

  useEffect(() => {
    if (params.get('add') === '1') {
      openNew()
      params.delete('add')
      setParams(params, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openNew() {
    setEditId(null)
    setForm(empty())
    setOpen(true)
  }

  function openEdit(e: Expense) {
    setEditId(e.id!)
    setForm({
      date: e.date,
      eventId: e.eventId ?? '',
      category_en: e.category_en,
      category_gu: e.category_gu,
      description_en: e.description_en,
      description_gu: e.description_gu,
      paidTo_en: e.paidTo_en,
      paidTo_gu: e.paidTo_gu,
      amount: String(e.amount),
      paymentMode: e.paymentMode,
    })
    setOpen(true)
  }

  async function save() {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return alert(t('amount'))
    const payload = {
      date: form.date,
      eventId: form.eventId || undefined,
      category_en: form.category_en.trim(),
      category_gu: form.category_gu.trim(),
      description_en: form.description_en.trim(),
      description_gu: form.description_gu.trim(),
      paidTo_en: form.paidTo_en.trim(),
      paidTo_gu: form.paidTo_gu.trim(),
      amount: amt,
      paymentMode: form.paymentMode,
    }
    if (editId) await updateExpense(editId, payload)
    else await addExpense({ ...payload, createdAt: new Date().toISOString() })
    setOpen(false)
  }

  async function remove(id: number) {
    if (!confirm(t('deleteConfirm'))) return
    await deleteExpense(id)
  }

  if (!expenses) return <div className="py-10 text-center text-stone-400">…</div>
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">{t('nav_expenses')}</h1>
        <button onClick={openNew} className="btn-primary py-2">
          <Plus size={18} /> {t('add')}
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-2 text-sm ring-1 ring-red-100">
        <span className="text-stone-600">{expenses.length} {t('resultsFound')}</span>
        <span className="font-bold tabular-nums text-red-600">{formatINR(total)}</span>
      </div>

      {expenses.length === 0 ? (
        <div className="card py-10 text-center text-sm text-stone-400">{t('noData')}</div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="card flex items-center justify-between !p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-stone-800">
                  {pick(e, 'description') || pick(e, 'category') || '—'}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
                  {(e.category_en || e.category_gu) && <span className="chip bg-stone-100 text-stone-500">{pick(e, 'category')}</span>}
                  <span>{formatDate(e.date, lang)}</span>
                  {e.paidTo_en && <span>· {pick(e, 'paidTo')}</span>}
                </div>
              </div>
              <div className="ml-2 flex items-center gap-1">
                <div className="text-sm font-bold tabular-nums text-red-600">{formatINR(e.amount)}</div>
                <button onClick={() => openEdit(e)} className="p-1 text-stone-400 hover:text-saffron-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(e.id!)} className="p-1 text-stone-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editId ? t('edit') : t('addExpense')}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost flex-1">{t('cancel')}</button>
            <button onClick={save} className="btn-primary flex-1">{t('save')}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('date')} *</label>
              <input type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('amount')} (₹) *</label>
              <input type="number" inputMode="decimal" className="field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>

          <BilingualInput label={t('category')} valueEn={form.category_en} valueGu={form.category_gu} onEn={(v) => setForm({ ...form, category_en: v })} onGu={(v) => setForm({ ...form, category_gu: v })} />
          <BilingualInput label={t('description')} valueEn={form.description_en} valueGu={form.description_gu} onEn={(v) => setForm({ ...form, description_en: v })} onGu={(v) => setForm({ ...form, description_gu: v })} />
          <BilingualInput label={`${t('paidTo')} (${t('optional')})`} valueEn={form.paidTo_en} valueGu={form.paidTo_gu} onEn={(v) => setForm({ ...form, paidTo_en: v })} onGu={(v) => setForm({ ...form, paidTo_gu: v })} />

          {events && events.length > 0 && (
            <div>
              <label className="label">{t('event')} ({t('optional')})</label>
              <select className="field" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value ? Number(e.target.value) : '' })}>
                <option value="">—</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name_en} / {ev.name_gu}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">{t('paymentMode')}</label>
            <PaymentSelect value={form.paymentMode} onChange={(m) => setForm({ ...form, paymentMode: m })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
