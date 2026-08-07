import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Megaphone, Pencil, Share2, Trash2 } from 'lucide-react'
import { deleteAdvertisementIncome, getAdvertisementIncome, getAllEventsDesc, getSettings } from '../db/db'
import { useQuery } from '../hooks/useQuery'
import { useI18n } from '../i18n/I18nContext'
import { strings, type Lang, type StringKey } from '../i18n/strings'
import { formatDate, formatINR, formatINRGujarati } from '../lib/format'
import { downloadElementPdf, elementToPngFile } from '../lib/pdf'
import { shareFile, shareOnWhatsApp } from '../lib/whatsapp'
import Logo from '../components/Logo'

export default function AdvertisementIncomeReceipt() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const receiptRef = useRef<HTMLDivElement | null>(null)
  const [working, setWorking] = useState<'pdf' | 'share' | null>(null)
  // The receipt is an official document: it is ALWAYS rendered in Gujarati,
  // regardless of the app's current UI language (same as the donation receipt).
  const receiptLang: Lang = 'gu'

  const income = useQuery('advertisementIncomes', () => getAdvertisementIncome(Number(id)), [id])
  const events = useQuery('events', getAllEventsDesc, [])
  const settings = useQuery('settings', getSettings, [])

  if (!income || !events) return null

  const incomeRecord = income
  const event = events.find((item) => item.id === incomeRecord.eventId)
  const receiptNo = incomeRecord.receiptNo || `AD-${incomeRecord.id}`
  const orgName = orgNameFor(receiptLang)

  function tr(key: StringKey, targetLang = receiptLang) {
    return strings[key]?.[targetLang] ?? String(key)
  }

  function pickLang(obj: object, base: string, targetLang = receiptLang) {
    const rec = obj as Record<string, unknown>
    const en = rec[`${base}_en`] as string | undefined
    const gu = rec[`${base}_gu`] as string | undefined
    return targetLang === 'gu' ? (gu?.trim() || en || '') : (en?.trim() || gu || '')
  }

  function orgNameFor(targetLang: Lang) {
    return pickLang(settings ?? {}, 'orgName', targetLang) || 'Hanuman Dal'
  }

  function money(targetLang = receiptLang) {
    return targetLang === 'gu' ? formatINRGujarati(incomeRecord.amount) : formatINR(incomeRecord.amount)
  }

  function caption() {
    return `${orgName}\n${tr('advertisementReceipt')}: ${receiptNo}\n${tr('advertiser')}: ${pickLang(incomeRecord, 'advertiser')}\n${tr('event')}: ${event ? pickLang(event, 'name') : '—'}\n${tr('amount')}: ${money()}`
  }

  async function download() {
    if (!receiptRef.current) return
    setWorking('pdf')
    try {
      await downloadElementPdf(receiptRef.current, `Advertisement-Receipt-${receiptNo}`)
    } finally {
      setWorking(null)
    }
  }

  async function share() {
    if (!receiptRef.current) return
    setWorking('share')
    try {
      const file = await elementToPngFile(receiptRef.current, `Advertisement-Receipt-${receiptNo}`)
      const shared = await shareFile(file, caption(), `${orgName} ${tr('advertisementReceipt')}`)
      if (!shared) {
        // Desktop / no file-share support: download the PDF and open WhatsApp with the text.
        await downloadElementPdf(receiptRef.current, `Advertisement-Receipt-${receiptNo}`)
        shareOnWhatsApp(caption())
      }
    } finally {
      setWorking(null)
    }
  }

  async function remove() {
    if (!confirm(t('deleteConfirm'))) return
    await deleteAdvertisementIncome(incomeRecord.id!)
    nav('/advertising-income')
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav(-1)}
          className="rounded-full p-1.5 text-stone-500 transition hover:bg-stone-200"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-stone-800">{t('advertisementReceipt')}</h1>
      </div>

      {/* Minimal receipt — mirrors the donation receipt, indigo theme to differentiate */}
      <div ref={receiptRef} lang={receiptLang} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <Logo size={52} className="bg-white ring-2 ring-white/70" />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold">{orgName}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium opacity-90">
                <Megaphone size={13} /> {tr('advertisementReceipt')}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between border-b border-dashed border-stone-200 pb-3">
            <span className="text-sm font-bold uppercase tracking-wide text-indigo-700">{tr('advertisementReceipt')}</span>
            <div className="text-right">
              <div className="text-xs text-stone-400">{tr('receiptNo')}</div>
              <div className="text-sm font-bold text-stone-700">{receiptNo}</div>
            </div>
          </div>

          <Row label={tr('date')} value={formatDate(incomeRecord.date, receiptLang)} />
          <Row label={tr('advertiser')} value={pickLang(incomeRecord, 'advertiser')} strong />
          <Row label={tr('event')} value={event ? pickLang(event, 'name') : '—'} />
          {pickLang(incomeRecord, 'description') && <Row label={tr('description')} value={pickLang(incomeRecord, 'description')} />}
          <Row label={tr('paymentMode')} value={tr(incomeRecord.paymentMode)} />

          <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 ring-1 ring-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-600">{tr('advertisementIncome')}</span>
              <span className="text-2xl font-bold tabular-nums text-indigo-700">{money()}</span>
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between">
            <div className="text-[10px] text-stone-400">{tr('advertisementReceipt')} · {orgName}</div>
            <div className="text-center">
              <img src="/signature.jpg" alt="" className="mx-auto mb-1 h-12 object-contain" />
              <div className="w-28 border-t border-stone-300 pt-1 text-[10px] text-stone-500">{tr('authorisedSign')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={download} disabled={working !== null} className="btn-primary !bg-indigo-700 hover:!bg-indigo-800">
          <Download size={18} /> {working === 'pdf' ? '…' : t('downloadPdf')}
        </button>
        <button onClick={share} disabled={working !== null} className="btn-ghost !bg-indigo-50 !text-indigo-700 !ring-indigo-200">
          <Share2 size={18} /> {working === 'share' ? '…' : t('shareWhatsapp')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => nav(`/advertising-income/${incomeRecord.id}/edit`)} className="btn-ghost">
          <Pencil size={18} />
          {t('edit')}
        </button>
        <button onClick={remove} className="btn-danger">
          <Trash2 size={18} />
          {t('delete')}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-stone-400">{label}</span>
      <span className={`text-right ${strong ? 'font-bold text-stone-800' : 'text-stone-700'}`}>{value}</span>
    </div>
  )
}