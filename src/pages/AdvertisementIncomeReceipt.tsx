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
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const receiptRef = useRef<HTMLDivElement | null>(null)
  const [working, setWorking] = useState<'pdf' | 'share' | null>(null)
  const receiptLang: Lang = lang

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

  function receiptText(en: string, gu: string, targetLang = receiptLang) {
    return targetLang === 'gu' ? gu : en
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

      <div
        ref={receiptRef}
        lang={receiptLang}
        className="overflow-hidden rounded-[28px] bg-[#FFF9F0] shadow-xl ring-1 ring-[#C9973E]/40"
      >
        <div
          className="relative overflow-hidden px-5 py-6 text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, #3B0707 0%, #681313 52%, #941F16 100%)' }}
        >
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border-[18px] border-[#D6A84F]/20" />
          <div className="absolute -right-4 -top-6 h-28 w-28 rounded-full border-[10px] border-[#F59E0B]/10" />
          <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full border-[15px] border-[#D6A84F]/10" />
          <div className="absolute right-10 top-3 h-24 w-24 rounded-full bg-[#F6D365]/10 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="rounded-2xl bg-white p-1.5 shadow-lg ring-2 ring-[#D6A84F]/70">
              <Logo size={50} className="bg-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-extrabold tracking-wide">{orgName}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#F8D477]">
                <Megaphone size={13} />
                {tr('advertisementReceipt')}
              </div>
            </div>
          </div>

          <div
            className="relative mt-5 h-px"
            style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, #E6BD5A 50%, transparent 100%)' }}
          />
          <div className="relative mt-3 text-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#F8D477]">
              {receiptText('OFFICIAL RECEIPT', 'અધિકૃત રસીદ')}
            </div>
          </div>
        </div>

        <div className="relative p-5">
          <div className="pointer-events-none absolute right-3 top-16 select-none text-[100px] font-black leading-none text-[#8B1E16]/[0.025]">
            ૐ
          </div>

          <div className="relative mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#A16207]">
                {receiptText('Advertisement Booking', 'જાહેરાત બુકિંગ')}
              </div>
              <div className="mt-1.5 truncate text-base font-bold text-[#3F1D16]">
                {event ? pickLang(event, 'name') : '—'}
              </div>
            </div>

            <div
              className="shrink-0 rounded-2xl border border-[#D6A84F]/50 px-3 py-2.5 text-right shadow-sm"
              style={{ backgroundImage: 'linear-gradient(135deg, #FFF9E9 0%, #FBEBC5 100%)' }}
            >
              <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#A16207]">{tr('receiptNo')}</div>
              <div className="mt-0.5 font-mono text-[10px] font-extrabold text-[#641313]">{receiptNo}</div>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl border border-[#E8D7BC] p-4 shadow-sm"
            style={{ backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #FFF3DD 100%)' }}
          >
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#D6A84F]/10" />
            <div className="relative">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A16207]">{tr('advertiser')}</div>
              <div className="mt-1 text-xl font-extrabold text-[#3F1D16]">{pickLang(incomeRecord, 'advertiser')}</div>
              {pickLang(incomeRecord, 'description') && (
                <div className="mt-2 text-sm leading-relaxed text-[#806C61]">
                  {pickLang(incomeRecord, 'description')}
                </div>
              )}
            </div>
          </div>

          <div className="my-5 grid grid-cols-2 divide-x divide-[#E8DCCB] rounded-2xl border border-[#E8DCCB] bg-white/70 py-3">
            <ReceiptDetail label={tr('date')} value={formatDate(incomeRecord.date, receiptLang)} />
            <ReceiptDetail label={tr('paymentMode')} value={tr(incomeRecord.paymentMode)} align="right" />
          </div>

          <div
            className="relative overflow-hidden rounded-[22px] p-5 text-white shadow-lg"
            style={{ backgroundImage: 'linear-gradient(135deg, #560909 0%, #841B14 52%, #B45309 100%)' }}
          >
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border-[15px] border-[#F6D365]/15" />
            <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-[#F6D365]/10 blur-xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F8D477]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F8D477]" />
                {tr('advertisementIncome')}
              </div>
              <div className="mt-1 text-3xl font-black tracking-tight tabular-nums">{money()}</div>
              <div className="mt-1 text-[9px] font-medium text-white/60">
                {receiptText('Amount Received', 'પ્રાપ્ત રકમ')}
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-end justify-between border-t border-dashed border-[#D9C8AD] pt-4">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#9A806F]">{tr('advertisementReceipt')}</div>
              <div className="mt-1 text-xs font-semibold text-[#641313]">{orgName}</div>
            </div>
            <div className="text-center">
              <img src="/signature.jpg" alt="" className="mx-auto mb-1 h-10 object-contain" />
              <div className="w-28 border-t border-[#A99580] pt-1 text-[9px] font-medium text-[#806C61]">
                {tr('authorisedSign')}
              </div>
            </div>
          </div>

          <div
            className="mt-5 h-1 rounded-full"
            style={{ backgroundImage: 'linear-gradient(90deg, #641313 0%, #D6A84F 50%, #641313 100%)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={download} disabled={working !== null} className="btn-primary !bg-[#641313] hover:!bg-[#480909]">
          <Download size={18} /> {working === 'pdf' ? '…' : t('downloadPdf')}
        </button>
        <button onClick={share} disabled={working !== null} className="btn-ghost !bg-[#FFF3DD] !text-[#8B1E16] !ring-[#D6A84F]/50">
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

function ReceiptDetail({ label, value, align }: { label: string; value: string; align?: 'right' }) {
  return (
    <div className={align === 'right' ? 'pl-4 text-right' : 'pr-4'}>
      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A806F]">{label}</div>
      <div className="mt-1 text-sm font-bold text-[#3F1D16]">{value}</div>
    </div>
  )
}