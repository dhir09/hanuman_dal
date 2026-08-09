import { useEffect, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import {
  addDonor,
  addInKindDonation,
  deleteInKindDonation,
  getAllDonorsSorted,
  getAllEventsDesc,
  getInKindDonation,
  nextInKindReceiptNo,
  updateInKindDonation,
  type InKindItem,
} from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { todayISO } from '../lib/format'
import BilingualInput from '../components/BilingualInput'

const COMMON_ITEMS: Array<[string, string]> = [
  ['Curd', 'દહીં'],
  ['Water', 'પાણી'],
  ['Matki', 'માટકી'],
  ['Milk', 'દૂધ'],
  ['Ghee', 'ઘી'],
  ['Sugar', 'ખાંડ'],
  ['Rice', 'ચોખા'],
  ['Flowers', 'ફૂલ'],
  ['Fruits', 'ફળ'],
  ['Oil', 'તેલ'],
]

function emptyItem(): InKindItem {
  return { name_en: '', name_gu: '', quantity: 1, unit_en: '', unit_gu: '' }
}

export default function InKindDonationForm() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)

  const donors = useQuery('donors', getAllDonorsSorted, [])
  const events = useQuery('events', getAllEventsDesc, [])

  const [date, setDate] = useState(todayISO())
  const [donorId, setDonorId] = useState<number | ''>('')
  const [nameEn, setNameEn] = useState('')
  const [nameGu, setNameGu] = useState('')
  const [phone, setPhone] = useState('')
  const [eventId, setEventId] = useState<number | ''>('')
  const [noteEn, setNoteEn] = useState('')
  const [noteGu, setNoteGu] = useState('')
  const [saveDonor, setSaveDonor] = useState(false)
  const [items, setItems] = useState<InKindItem[]>([emptyItem()])

  useEffect(() => {
    if (!id) return
    getInKindDonation(Number(id)).then((d) => {
      if (!d) return
      setDate(d.date)
      setDonorId(d.donorId ?? '')
      setNameEn(d.donorName_en)
      setNameGu(d.donorName_gu)
      setPhone(d.phone)
      setEventId(d.eventId ?? '')
      setNoteEn(d.note_en)
      setNoteGu(d.note_gu)
      setItems(d.items.length ? d.items : [emptyItem()])
    })
  }, [id])

  function onPickDonor(v: string) {
    const did = v ? Number(v) : ''
    setDonorId(did)
    if (did && donors) {
      const dn = donors.find((x) => x.id === did)
      if (dn) {
        setNameEn(dn.name_en)
        setNameGu(dn.name_gu)
        setPhone(dn.phone)
      }
    }
  }

  function updateItem(idx: number, patch: Partial<InKindItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function removeItem(idx: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
  }

  function pickCommon(en: string, gu: string) {
    const firstEmpty = items.findIndex((it) => !it.name_en && !it.name_gu)
    if (firstEmpty >= 0) {
      updateItem(firstEmpty, { name_en: en, name_gu: gu })
    } else {
      setItems((prev) => [...prev, { name_en: en, name_gu: gu, quantity: 1, unit_en: '', unit_gu: '' }])
    }
  }

  async function save() {
    if (!nameEn.trim() && !nameGu.trim()) return alert(t('donorName'))
    const validItems = items.filter((it) => (it.name_en.trim() || it.name_gu.trim()) && it.quantity > 0)
    if (!validItems.length) return alert(t('items'))

    let finalDonorId = donorId || undefined
    if (!finalDonorId && saveDonor) {
      finalDonorId = await addDonor({
        name_en: nameEn.trim(),
        name_gu: nameGu.trim(),
        phone: phone.trim(),
        address_en: '',
        address_gu: '',
        createdAt: new Date().toISOString(),
      })
    }

    const base = {
      date,
      donorId: finalDonorId,
      donorName_en: nameEn.trim(),
      donorName_gu: nameGu.trim(),
      phone: phone.trim(),
      items: validItems,
      eventId: eventId || undefined,
      note_en: noteEn.trim(),
      note_gu: noteGu.trim(),
    }

    if (editing) {
      await updateInKindDonation(Number(id), base)
      nav(`/in-kind/${id}`)
    } else {
      const receiptNo = await nextInKindReceiptNo(date)
      const newId = await addInKindDonation({
        ...base,
        receiptNo,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      nav(`/in-kind/${newId}`)
    }
  }

  async function remove() {
    if (!id || !confirm(t('deleteConfirm'))) return
    await deleteInKindDonation(Number(id))
    nav('/in-kind')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-800">{editing ? t('edit') : t('addInKindDonation')}</h1>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">{t('date')} *</label>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {donors && donors.length > 0 && (
          <div>
            <label className="label">{t('nav_donors')} ({t('optional')})</label>
            <select className="field" value={donorId} onChange={(e) => onPickDonor(e.target.value)}>
              <option value="">— {t('donorName')} —</option>
              {donors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_en} {d.name_gu ? `/ ${d.name_gu}` : ''} {d.phone ? `(${d.phone})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <BilingualInput label={t('donorName')} valueEn={nameEn} valueGu={nameGu} onEn={setNameEn} onGu={setNameGu} required />

        <div>
          <label className="label">{t('phone')} ({t('optional')})</label>
          <input className="field" value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
        </div>

        {!donorId && (
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={saveDonor} onChange={(e) => setSaveDonor(e.target.checked)} className="h-4 w-4 accent-saffron-600" />
            {t('addDonor')} → {t('nav_donors')}
          </label>
        )}

        {events && events.length > 0 && (
          <div>
            <label className="label">{t('event')} ({t('optional')})</label>
            <select className="field" value={eventId} onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">—</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name_en} / {ev.name_gu}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <label className="label !mb-0">{t('items')} *</label>
          <button type="button" onClick={() => setItems((p) => [...p, emptyItem()])} className="text-xs font-semibold text-saffron-600 hover:text-saffron-700">
            <Plus size={14} className="mr-0.5 inline" /> {t('addItem')}
          </button>
        </div>

        {/* Quick-pick chips */}
        <div className="flex flex-wrap gap-1.5">
          {COMMON_ITEMS.map(([en, gu]) => (
            <button
              key={en}
              type="button"
              onClick={() => pickCommon(en, gu)}
              className="chip bg-saffron-50 text-saffron-700 ring-1 ring-saffron-200 hover:bg-saffron-100"
            >
              {gu}
            </button>
          ))}
        </div>

        {/* Item rows */}
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">{t('item')} {idx + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="text-stone-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                )}
              </div>
              <BilingualInput
                label={t('name')}
                valueEn={it.name_en}
                valueGu={it.name_gu}
                onEn={(v) => updateItem(idx, { name_en: v })}
                onGu={(v) => updateItem(idx, { name_gu: v })}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="label">{t('quantity')}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="field"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <BilingualInput
                  label={t('unit')}
                  valueEn={it.unit_en}
                  valueGu={it.unit_gu}
                  onEn={(v) => updateItem(idx, { unit_en: v })}
                  onGu={(v) => updateItem(idx, { unit_gu: v })}
                  placeholder="kg, L, pcs…"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <BilingualInput
          label={`${t('note')} (${t('optional')})`}
          valueEn={noteEn}
          valueGu={noteGu}
          onEn={setNoteEn}
          onGu={setNoteGu}
        />
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
