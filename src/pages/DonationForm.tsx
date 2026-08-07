import { useEffect, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { addDonation, addDonor, addPurpose, deleteDonation, getActivePurposes, getAllDonorsSorted, getAllEventsDesc, getDonation, nextReceiptNo, updateDonation, type PaymentMode } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { todayISO } from '../lib/format'
import BilingualInput from '../components/BilingualInput'
import PaymentSelect from '../components/PaymentSelect'

export default function DonationForm() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)

  const purposes = useQuery('purposes', getActivePurposes, [])
  const donors = useQuery('donors', getAllDonorsSorted, [])
  const events = useQuery('events', getAllEventsDesc, [])

  const [date, setDate] = useState(todayISO())
  const [donorId, setDonorId] = useState<number | ''>('')
  const [nameEn, setNameEn] = useState('')
  const [nameGu, setNameGu] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [purposeId, setPurposeId] = useState<number | ''>('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [eventId, setEventId] = useState<number | ''>('')
  const [noteEn, setNoteEn] = useState('')
  const [noteGu, setNoteGu] = useState('')
  const [saveDonor, setSaveDonor] = useState(false)

  // Inline "add custom purpose"
  const [addingPurpose, setAddingPurpose] = useState(false)
  const [newPurposeEn, setNewPurposeEn] = useState('')
  const [newPurposeGu, setNewPurposeGu] = useState('')

  async function addCustomPurpose() {
    if (!newPurposeEn.trim() && !newPurposeGu.trim()) return
    const newId = await addPurpose({
      name_en: newPurposeEn.trim(),
      name_gu: newPurposeGu.trim(),
      active: 1,
    })
    setPurposeId(newId)
    setNewPurposeEn('')
    setNewPurposeGu('')
    setAddingPurpose(false)
  }

  // Load existing donation when editing
  useEffect(() => {
    if (!id) return
    getDonation(Number(id)).then((d) => {
      if (!d) return
      setDate(d.date)
      setDonorId(d.donorId ?? '')
      setNameEn(d.donorName_en)
      setNameGu(d.donorName_gu)
      setPhone(d.phone)
      setAmount(String(d.amount))
      setPurposeId(d.purposeId ?? '')
      setPaymentMode(d.paymentMode)
      setEventId(d.eventId ?? '')
      setNoteEn(d.note_en)
      setNoteGu(d.note_gu)
    })
  }, [id])

  // When an existing donor is chosen, prefill their details
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

  async function save() {
    const amt = parseFloat(amount)
    if (!nameEn.trim() && !nameGu.trim()) return alert(t('donorName'))
    if (!amt || amt <= 0) return alert(t('amount'))

    const purpose = purposes?.find((p) => p.id === purposeId)
    let finalDonorId = donorId || undefined

    // Optionally add a new donor to the directory
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
      amount: amt,
      purposeId: purposeId || undefined,
      purpose_en: purpose?.name_en ?? '',
      purpose_gu: purpose?.name_gu ?? '',
      paymentMode,
      eventId: eventId || undefined,
      note_en: noteEn.trim(),
      note_gu: noteGu.trim(),
    }

    if (editing) {
      await updateDonation(Number(id), base)
      nav(`/donations/${id}`)
    } else {
      const receiptNo = await nextReceiptNo(date)
      const newId = await addDonation({
        ...base,
        receiptNo,
        createdAt: new Date().toISOString(),
      })
      nav(`/donations/${newId}`)
    }
  }

  async function remove() {
    if (!id || !confirm(t('deleteConfirm'))) return
    await deleteDonation(Number(id))
    nav('/donations')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-800">{editing ? t('edit') : t('addDonation')}</h1>
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
              className="field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
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

        <BilingualInput
          label={t('donorName')}
          valueEn={nameEn}
          valueGu={nameGu}
          onEn={setNameEn}
          onGu={setNameGu}
          required
        />

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

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="label !mb-0">{t('purpose')}</label>
            <button
              type="button"
              onClick={() => setAddingPurpose((v) => !v)}
              className="text-xs font-semibold text-saffron-600 hover:text-saffron-700"
            >
              {addingPurpose ? t('cancel') : t('addNewPurpose')}
            </button>
          </div>

          {!addingPurpose ? (
            <select className="field" value={purposeId} onChange={(e) => setPurposeId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">—</option>
              {purposes?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_en} / {p.name_gu}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2 rounded-xl bg-saffron-50 p-3 ring-1 ring-saffron-100">
              <BilingualInput
                label={t('newPurpose')}
                valueEn={newPurposeEn}
                valueGu={newPurposeGu}
                onEn={setNewPurposeEn}
                onGu={setNewPurposeGu}
              />
              <button type="button" onClick={addCustomPurpose} className="btn-primary w-full py-2">
                {t('add')}
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="label">{t('paymentMode')}</label>
          <PaymentSelect value={paymentMode} onChange={setPaymentMode} />
        </div>

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
