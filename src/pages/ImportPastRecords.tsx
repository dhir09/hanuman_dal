import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { addDonation, getActivePurposes, nextReceiptNo, type Purpose, type PaymentMode } from '../db/db'
import { useQuery } from '../hooks/useQuery'
import { useI18n } from '../i18n/I18nContext'
import { todayISO } from '../lib/format'

interface ParsedRow {
  sr: number
  donorName: string
  amount: number
  mode: PaymentMode
  selected: boolean
}

const MODE_MAP: Record<string, PaymentMode> = {
  'રોકડા': 'cash',
  'રોકડ': 'cash',
  'cash': 'cash',
  'ઓનલાઈન': 'upi',
  'ઓનલાઇન': 'upi',
  'online': 'upi',
  'upi': 'upi',
  'બેંક': 'bank',
  'bank': 'bank',
  'ચેક': 'cheque',
  'cheque': 'cheque',
}

function parsePaymentMode(raw: string): PaymentMode {
  const key = (raw || '').trim().toLowerCase()
  for (const [pattern, mode] of Object.entries(MODE_MAP)) {
    if (key === pattern.toLowerCase() || key.includes(pattern.toLowerCase())) return mode
  }
  return 'cash'
}

export default function ImportPastRecords() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const purposes = useQuery('purposes', getActivePurposes, [])

  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [date, setDate] = useState(todayISO())
  const [purposeId, setPurposeId] = useState<number | ''>('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      const parsed: ParsedRow[] = []
      for (let i = 0; i < json.length; i++) {
        const row = json[i]
        const vals = Object.values(row)
        const keys = Object.keys(row)

        let donorName = ''
        let amount = 0
        let modeRaw = ''

        if (keys.length >= 3) {
          // Try to detect by Gujarati column headers first
          const donorKey = keys.find(k =>
            k.includes('દાતા') || k.includes('નામ') || k.includes('donor') || k.includes('name')
          )
          const amountKey = keys.find(k =>
            k.includes('રકમ') || k.includes('amount') || k.includes('Amount')
          )
          const modeKey = keys.find(k =>
            k.includes('રોકડા') || k.includes('ઓનલાઈન') || k.includes('mode') || k.includes('payment') || k.includes('ચુકવણી')
          )

          if (donorKey && amountKey) {
            donorName = String(row[donorKey] ?? '')
            amount = Number(row[amountKey]) || 0
            modeRaw = modeKey ? String(row[modeKey] ?? '') : ''
          } else {
            // Fallback: positional (skip col 0 = serial, col 1 = name, col 2 = amount, col 3 = mode)
            donorName = String(vals[1] ?? '')
            amount = Number(vals[2]) || 0
            modeRaw = String(vals[3] ?? '')
          }
        }

        if (donorName && amount > 0) {
          parsed.push({
            sr: i + 1,
            donorName: donorName.trim(),
            amount,
            mode: parsePaymentMode(modeRaw),
            selected: true,
          })
        }
      }
      setRows(parsed)
    }
    reader.readAsArrayBuffer(file)
  }

  function toggleRow(idx: number) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))
  }

  function toggleAll() {
    const allSelected = rows.every(r => r.selected)
    setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })))
  }

  async function handleImport() {
    const selected = rows.filter(r => r.selected)
    if (!selected.length || !purposeId) return

    setImporting(true)
    const purpose = (purposes ?? []).find((p: Purpose) => p.id === purposeId)
    const now = new Date().toISOString()
    let success = 0
    let failed = 0

    for (const row of selected) {
      try {
        const receiptNo = await nextReceiptNo(date)
        await addDonation({
          receiptNo,
          date,
          donorName_en: '',
          donorName_gu: row.donorName,
          phone: '',
          amount: row.amount,
          purposeId: purpose?.id,
          purpose_en: purpose?.name_en ?? '',
          purpose_gu: purpose?.name_gu ?? '',
          paymentMode: row.mode,
          note_en: 'Imported from past records',
          note_gu: 'ભૂતકાળના રેકોર્ડમાંથી આયાત',
          createdAt: now,
        })
        success++
      } catch {
        failed++
      }
    }

    setResult({ success, failed })
    setImporting(false)
  }

  const selectedCount = rows.filter(r => r.selected).length
  const selectedTotal = rows.filter(r => r.selected).reduce((s, r) => s + r.amount, 0)
  const modeLabel = (m: PaymentMode) => t(m)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-stone-800">{t('importPastRecords')}</h1>
      <p className="text-sm text-stone-500">{t('importPastRecordsDesc')}</p>

      {/* File picker */}
      <div
        onClick={() => fileRef.current?.click()}
        className="card flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed border-stone-200 py-8 transition hover:border-saffron-400 hover:bg-saffron-50"
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        {fileName ? (
          <>
            <FileSpreadsheet size={32} className="text-saffron-600" />
            <span className="text-sm font-semibold text-stone-700">{fileName}</span>
            <span className="text-xs text-stone-400">{t('tapToChange')}</span>
          </>
        ) : (
          <>
            <Upload size={32} className="text-stone-400" />
            <span className="text-sm font-semibold text-stone-600">{t('selectExcelFile')}</span>
            <span className="text-xs text-stone-400">.xlsx, .xls, .csv</span>
          </>
        )}
      </div>

      {/* Options: date + purpose */}
      {rows.length > 0 && !result && (
        <>
          <div className="card space-y-3">
            <div>
              <label className="label">{t('date')}</label>
              <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('purpose')}</label>
              <select className="field" value={purposeId} onChange={(e) => setPurposeId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">{t('selectPurpose')}</option>
                {(purposes ?? []).map((p: Purpose) => (
                  <option key={p.id} value={p.id}>
                    {lang === 'gu' ? p.name_gu : p.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview table */}
          <div className="card !p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-bold text-stone-700">
                {selectedCount} / {rows.length} {t('selected')}
              </span>
              <button onClick={toggleAll} className="text-xs font-semibold text-saffron-600">
                {rows.every(r => r.selected) ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-stone-100 bg-stone-50 text-xs uppercase text-stone-500">
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">{t('donorName')}</th>
                    <th className="px-4 py-2 font-medium">{t('amount')}</th>
                    <th className="px-4 py-2 font-medium">{t('paymentMode')}</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {rows.map((r, i) => (
                    <tr key={i} className={r.selected ? '' : 'opacity-40'}>
                      <td className="px-4 py-2.5 text-stone-400">{r.sr}</td>
                      <td className="px-4 py-2.5 font-semibold text-stone-800">{r.donorName}</td>
                      <td className="px-4 py-2.5 tabular-nums text-stone-700">₹{r.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5">
                        <span className="chip bg-stone-100 text-stone-600">{modeLabel(r.mode)}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => toggleRow(i)}
                          className={`grid h-6 w-6 place-items-center rounded-md ring-1 transition ${
                            r.selected
                              ? 'bg-saffron-600 text-white ring-saffron-600'
                              : 'bg-white text-transparent ring-stone-300'
                          }`}
                        >
                          <Check size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary + import button */}
            <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3">
              <div>
                <div className="text-xs text-stone-500">{t('total')}</div>
                <div className="text-lg font-bold tabular-nums text-saffron-700">₹{selectedTotal.toLocaleString('en-IN')}</div>
              </div>
              <button
                onClick={handleImport}
                disabled={importing || !selectedCount || !purposeId}
                className="btn-primary"
              >
                {importing ? '…' : `${t('importRecords')} (${selectedCount})`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Result */}
      {result && (
        <div className="card space-y-3 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100">
            <Check size={28} className="text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-stone-800">
            {result.success} {t('recordsImported')}
          </div>
          {result.failed > 0 && (
            <div className="flex items-center justify-center gap-1 text-sm text-red-600">
              <AlertCircle size={14} /> {result.failed} {t('recordsFailed')}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={() => { setRows([]); setFileName(''); setResult(null) }} className="btn-ghost flex-1">
              {t('importMore')}
            </button>
            <button onClick={() => navigate('/donations')} className="btn-primary flex-1">
              {t('viewDonations')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
