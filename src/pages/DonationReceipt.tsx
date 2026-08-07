import { useRef, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Share2, Pencil, Trash2 } from 'lucide-react'
import { deleteDonation, getDonation, getSettings, type Donation } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatDate, formatINRGujarati, numberToWordsGujarati } from '../lib/format'
import { strings, type StringKey } from '../i18n/strings'
import { downloadElementPdf, elementToPngFile } from '../lib/pdf'
import { shareFile, shareOnWhatsApp } from '../lib/whatsapp'
import Logo from '../components/Logo'

// The receipt is an official document: it is ALWAYS rendered in Gujarati,
// regardless of the app's current UI language.
const G = (key: StringKey) => strings[key].gu
function gpick(obj: Donation, base: 'donorName' | 'purpose' | 'note'): string {
  const gu = obj[`${base}_gu`]
  const en = obj[`${base}_en`]
  return (gu && gu.trim()) || en || ''
}

export default function DonationReceipt() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const receiptRef = useRef<HTMLDivElement>(null)
  const [working, setWorking] = useState<'pdf' | 'share' | null>(null)

  const donation = useQuery('donations', () => getDonation(Number(id)), [id])
  const settings = useQuery('settings', getSettings, [])

  if (!donation) return <div className="py-10 text-center text-stone-400">…</div>

  const orgName = (settings?.orgName_gu?.trim() || settings?.orgName_en || 'હનુમાન દળ') as string
  const orgAddr = settings?.address_gu?.trim() || settings?.address_en || ''

  async function download() {
    if (!receiptRef.current) return
    setWorking('pdf')
    try {
      await downloadElementPdf(receiptRef.current, `Receipt-${donation!.receiptNo}`)
    } finally {
      setWorking(null)
    }
  }

  function caption(): string {
    return (
      `🚩 ${orgName}\n${G('donationReceipt')}: ${donation!.receiptNo}\n` +
      `${G('donorName')}: ${gpick(donation!, 'donorName')}\n` +
      `${G('amount')}: ${formatINRGujarati(donation!.amount)}\n` +
      `${G('purpose')}: ${gpick(donation!, 'purpose')}\n` +
      `${G('date')}: ${formatDate(donation!.date, 'gu')}\n\n🙏 ${G('receivedWithThanks')}`
    )
  }

  async function share() {
    if (!receiptRef.current) return
    setWorking('share')
    try {
      const file = await elementToPngFile(receiptRef.current, `Receipt-${donation!.receiptNo}`)
      const shared = await shareFile(file, caption(), `${orgName} ${G('receipt')}`)
      if (!shared) {
        // Desktop / no file-share support: download the PDF and open WhatsApp with the text.
        await downloadElementPdf(receiptRef.current, `Receipt-${donation!.receiptNo}`)
        shareOnWhatsApp(caption(), donation!.phone)
      }
    } finally {
      setWorking(null)
    }
  }

  async function remove() {
    if (!confirm(t('deleteConfirm'))) return
    await deleteDonation(Number(id))
    nav('/donations')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-800">{t('receipt')}</h1>
      </div>

      {/* Printable receipt — always Gujarati */}
      <div ref={receiptRef} lang="gu" className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <div className="bg-gradient-to-r from-saffron-600 to-saffron-500 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <Logo size={52} className="bg-white ring-2 ring-white/70" />
            <div>
              <div className="text-lg font-bold">{orgName}</div>
              {orgAddr && <div className="text-xs opacity-90">{orgAddr}</div>}
              {settings?.phone && <div className="text-xs opacity-90">☎ {settings.phone}</div>}
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between border-b border-dashed border-stone-200 pb-3">
            <span className="text-sm font-bold uppercase tracking-wide text-saffron-700">{G('donationReceipt')}</span>
            <div className="text-right">
              <div className="text-xs text-stone-400">{G('receiptNo')}</div>
              <div className="text-sm font-bold text-stone-700">{donation.receiptNo}</div>
            </div>
          </div>

          <Row label={G('date')} value={formatDate(donation.date, 'gu')} />
          <Row label={G('receivedWithThanks')} value={gpick(donation, 'donorName')} strong />
          {donation.phone && <Row label={G('phone')} value={donation.phone} />}
          <Row label={G('towards')} value={gpick(donation, 'purpose') || '—'} />
          <Row label={G('paymentMode')} value={strings[donation.paymentMode].gu} />
          {(donation.note_en || donation.note_gu) && <Row label={G('note')} value={gpick(donation, 'note')} />}

          <div className="mt-4 rounded-xl bg-saffron-50 px-4 py-3 ring-1 ring-saffron-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-600">{G('amount')}</span>
              <span className="text-2xl font-bold tabular-nums text-saffron-700">{formatINRGujarati(donation.amount)}</span>
            </div>
            <div className="mt-1 text-xs italic text-stone-500">{numberToWordsGujarati(donation.amount)}</div>
          </div>

          <div className="mt-8 flex items-end justify-between">
            <div className="text-[10px] text-stone-400">{G('donationReceipt')} · {orgName}</div>
            <div className="text-center">
              <img src="/signature.jpg" alt="" className="mx-auto mb-1 h-12 object-contain" />
              <div className="w-28 border-t border-stone-300 pt-1 text-[10px] text-stone-500">{G('authorisedSign')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={download} disabled={working !== null} className="btn-primary">
          <Download size={18} /> {working === 'pdf' ? '…' : t('downloadPdf')}
        </button>
        <button onClick={share} disabled={working !== null} className="btn-ghost !bg-emerald-50 !text-emerald-700 !ring-emerald-200">
          <Share2 size={18} /> {working === 'share' ? '…' : t('shareWhatsapp')}
        </button>
      </div>

      {/* Edit / Delete */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => nav(`/donations/${id}/edit`)} className="btn-ghost">
          <Pencil size={18} /> {t('edit')}
        </button>
        <button onClick={remove} className="btn-danger">
          <Trash2 size={18} /> {t('delete')}
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
