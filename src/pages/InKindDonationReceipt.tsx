import { useRef, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Share2, Pencil, Trash2 } from 'lucide-react'
import { deleteInKindDonation, getInKindDonation, getSettings, valueInKindDonation, type InKindDonation, type InKindItem } from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatDate, formatINRGujarati, numberToWordsGujarati } from '../lib/format'
import { strings, type StringKey } from '../i18n/strings'
import { downloadElementPdf, elementToPngFile } from '../lib/pdf'
import { shareFile, shareOnWhatsApp } from '../lib/whatsapp'
import Logo from '../components/Logo'
import Modal from '../components/Modal'

const G = (key: StringKey) => strings[key].gu
function gpick(obj: InKindDonation, base: 'donorName' | 'note'): string {
  const gu = obj[`${base}_gu`]
  const en = obj[`${base}_en`]
  return (gu && gu.trim()) || en || ''
}

export default function InKindDonationReceipt() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const receiptRef = useRef<HTMLDivElement>(null)
  const [working, setWorking] = useState<'pdf' | 'share' | null>(null)
  const [showValuation, setShowValuation] = useState(false)

  const inkind = useQuery('inKindDonations', () => getInKindDonation(Number(id)), [id])
  const settings = useQuery('settings', getSettings, [])

  if (!inkind) return <div className="py-10 text-center text-stone-400">…</div>

  const orgName = (settings?.orgName_gu?.trim() || settings?.orgName_en || 'હનુમાન દળ') as string
  const orgAddr = settings?.address_gu?.trim() || settings?.address_en || ''
  const isValued = inkind.status === 'valued'
  const total = isValued ? inkind.items.reduce((s, i) => s + (i.amount ?? 0), 0) : 0

  async function download() {
    if (!receiptRef.current) return
    setWorking('pdf')
    try {
      await downloadElementPdf(receiptRef.current, `Receipt-${inkind!.receiptNo}`)
    } finally {
      setWorking(null)
    }
  }

  function caption(): string {
    const itemList = inkind!.items.map((i) => `${i.name_gu || i.name_en} ×${i.quantity}`).join(', ')
    return (
      `🚩 ${orgName}\n${G('inKindDonation')}: ${inkind!.receiptNo}\n` +
      `${G('donorName')}: ${gpick(inkind!, 'donorName')}\n` +
      `${G('items')}: ${itemList}\n` +
      (isValued ? `${G('amount')}: ${formatINRGujarati(total)}\n` : '') +
      `${G('date')}: ${formatDate(inkind!.date, 'gu')}\n\n🙏 ${G('itemsReceivedFrom')}`
    )
  }

  async function share() {
    if (!receiptRef.current) return
    setWorking('share')
    try {
      const file = await elementToPngFile(receiptRef.current, `Receipt-${inkind!.receiptNo}`)
      const shared = await shareFile(file, caption(), `${orgName} ${G('receipt')}`)
      if (!shared) {
        await downloadElementPdf(receiptRef.current, `Receipt-${inkind!.receiptNo}`)
        shareOnWhatsApp(caption(), inkind!.phone)
      }
    } finally {
      setWorking(null)
    }
  }

  async function remove() {
    if (!confirm(t('deleteConfirm'))) return
    await deleteInKindDonation(Number(id))
    nav('/in-kind')
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
            <span className="text-sm font-bold uppercase tracking-wide text-saffron-700">
              {isValued ? G('inKindReceipt') : G('inKindReceiptProvisional')}
            </span>
            <div className="text-right">
              <div className="text-xs text-stone-400">{G('receiptNo')}</div>
              <div className="text-sm font-bold text-stone-700">{inkind.receiptNo}</div>
            </div>
          </div>

          <Row label={G('date')} value={formatDate(inkind.date, 'gu')} />
          <Row label={G('itemsReceivedFrom')} value={gpick(inkind, 'donorName')} strong />
          {inkind.phone && <Row label={G('phone')} value={inkind.phone} />}
          {(inkind.note_en || inkind.note_gu) && <Row label={G('note')} value={gpick(inkind, 'note')} />}

          {/* Items table */}
          <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-stone-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-left text-xs font-semibold text-stone-500">
                  <th className="px-3 py-2">{G('item')}</th>
                  <th className="px-3 py-2 text-right">{G('quantity')}</th>
                  {isValued && <th className="px-3 py-2 text-right">{G('amount')}</th>}
                </tr>
              </thead>
              <tbody>
                {inkind.items.map((it, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="px-3 py-2 text-stone-700">{it.name_gu || it.name_en}</td>
                    <td className="px-3 py-2 text-right text-stone-600">
                      {it.quantity} {it.unit_gu || it.unit_en}
                    </td>
                    {isValued && (
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-stone-700">
                        {formatINRGujarati(it.amount ?? 0)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {isValued && (
                <tfoot>
                  <tr className="border-t-2 border-stone-200 bg-saffron-50">
                    <td className="px-3 py-2 font-semibold text-stone-600" colSpan={2}>{G('total')}</td>
                    <td className="px-3 py-2 text-right text-lg font-bold tabular-nums text-saffron-700">
                      {formatINRGujarati(total)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {isValued && (
            <div className="mt-2 text-xs italic text-stone-500">{numberToWordsGujarati(total)}</div>
          )}

          <div className="mt-8 flex items-end justify-between">
            <div className="text-[10px] text-stone-400">{G('inKindReceipt')} · {orgName}</div>
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

      {/* Valuation / Edit / Delete */}
      {!isValued && (
        <button onClick={() => setShowValuation(true)} className="btn-primary w-full !bg-amber-500 hover:!bg-amber-600">
          {t('addAmounts')}
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        {!isValued && (
          <button onClick={() => nav(`/in-kind/${id}/edit`)} className="btn-ghost">
            <Pencil size={18} /> {t('edit')}
          </button>
        )}
        <button onClick={remove} className={`btn-danger ${isValued ? 'col-span-2' : ''}`}>
          <Trash2 size={18} /> {t('delete')}
        </button>
      </div>

      {/* Valuation modal */}
      {showValuation && (
        <ValuationModal
          inkind={inkind}
          onClose={() => setShowValuation(false)}
        />
      )}
    </div>
  )
}

function ValuationModal({ inkind, onClose }: { inkind: InKindDonation; onClose: () => void }) {
  const { t } = useI18n()
  const [items, setItems] = useState<InKindItem[]>(
    inkind.items.map((it) => ({ ...it, amount: it.amount ?? 0 })),
  )
  const [saving, setSaving] = useState(false)

  function updateAmount(idx: number, val: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, amount: parseFloat(val) || 0 } : it)))
  }

  const total = items.reduce((s, i) => s + (i.amount ?? 0), 0)

  async function save() {
    if (total <= 0) return alert(t('amount'))
    setSaving(true)
    try {
      await valueInKindDonation(inkind, items)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={t('addAmounts')}>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-stone-700">{it.name_gu || it.name_en}</div>
              <div className="text-xs text-stone-400">
                {it.quantity} {it.unit_gu || it.unit_en}
              </div>
            </div>
            <div className="w-28 shrink-0">
              <input
                type="number"
                inputMode="decimal"
                className="field text-right"
                placeholder="₹ 0"
                value={it.amount || ''}
                onChange={(e) => updateAmount(idx, e.target.value)}
              />
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between rounded-xl bg-saffron-50 px-4 py-3 ring-1 ring-saffron-100">
          <span className="text-sm font-semibold text-stone-600">{t('total')}</span>
          <span className="text-xl font-bold tabular-nums text-saffron-700">₹{total.toLocaleString('en-IN')}</span>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? '…' : t('saveAmounts')}
        </button>
      </div>
    </Modal>
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
