import { useRef, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Share2, Pencil, Trash2 } from 'lucide-react'
import {
  decorationItemCost,
  decorationItemPieces,
  decorationPlanTotal,
  deleteDecorationPlan,
  getDecorationPlan,
  getEvent,
  type DecorationItem,
  type DecorationPlan,
} from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { formatDate, formatINR } from '../lib/format'
import { downloadElementPdf, elementToPngFile } from '../lib/pdf'
import { shareFile, shareOnWhatsApp } from '../lib/whatsapp'
import Logo from '../components/Logo'

export default function DecorationDetail() {
  const { t, lang, pick } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [working, setWorking] = useState<'pdf' | 'share' | null>(null)

  const plan = useQuery('decorationPlans', () => getDecorationPlan(Number(id)), [id])
  const event = useQuery('events', () => (plan?.eventId ? getEvent(plan.eventId) : Promise.resolve(undefined)), [plan?.eventId])

  if (!plan) return <div className="py-10 text-center text-stone-400">…</div>

  const title = pick(plan, 'title') || t('decorationPlan')
  const total = decorationPlanTotal(plan)
  const totalPieces = plan.items.reduce((s, it) => s + decorationItemPieces(it), 0)

  // Group items by category (falling back to a shared "Other" bucket).
  const groups = groupByCategory(plan, lang)

  async function download() {
    if (!sheetRef.current) return
    setWorking('pdf')
    try {
      await downloadElementPdf(sheetRef.current, `Decoration-${title}`)
    } finally {
      setWorking(null)
    }
  }

  function caption(): string {
    const lines = [`🪔 ${title}`, formatDate(plan!.date, lang)]
    for (const g of groups) {
      lines.push('', `▪ ${g.label}`)
      for (const it of g.items) {
        const name = pickItem(it, 'name', lang) || pickItem(it, 'category', lang)
        const pcs = decorationItemPieces(it)
        const sizeText = it.sizes.length
          ? ' (' + it.sizes.map((z) => `${z.height}×${z.width}${z.unit} ×${z.pieces}`).join(', ') + ')'
          : ''
        lines.push(`• ${name} — ${pcs} ${t('pieces')}${sizeText}`)
      }
    }
    lines.push('', `${t('totalPieces')}: ${totalPieces}`)
    if (total > 0) lines.push(`${t('estCost')}: ${formatINR(total)}`)
    return lines.join('\n')
  }

  async function share() {
    if (!sheetRef.current) return
    setWorking('share')
    try {
      const file = await elementToPngFile(sheetRef.current, `Decoration-${title}`)
      const shared = await shareFile(file, caption(), title)
      if (!shared) {
        await downloadElementPdf(sheetRef.current, `Decoration-${title}`)
        shareOnWhatsApp(caption())
      }
    } finally {
      setWorking(null)
    }
  }

  async function remove() {
    if (!confirm(t('deleteConfirm'))) return
    await deleteDecorationPlan(Number(id))
    nav('/decorations')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-stone-800">{title}</h1>
      </div>

      {/* Printable sheet */}
      <div ref={sheetRef} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <div className="flex items-center gap-3 bg-gradient-to-r from-saffron-600 to-saffron-500 px-5 py-4 text-white">
          <Logo size={44} className="bg-white ring-2 ring-white/70" />
          <div className="min-w-0">
            <div className="truncate text-lg font-bold">{title}</div>
            <div className="text-xs opacity-90">
              {t('decorationPlan')} · {formatDate(plan.date, lang)}
              {event && ` · ${pick(event, 'name')}`}
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="mb-1.5 flex items-center justify-between border-b border-dashed border-stone-200 pb-1">
                <span className="text-sm font-bold uppercase tracking-wide text-saffron-700">{g.label}</span>
                <span className="text-xs text-stone-400">{g.items.reduce((s, it) => s + decorationItemPieces(it), 0)} {t('pieces')}</span>
              </div>
              <div className="space-y-2">
                {g.items.map((it, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-stone-800">{pickItem(it, 'name', lang) || '—'}</span>
                      <span className="shrink-0 tabular-nums text-stone-600">
                        {decorationItemPieces(it)} {t('pieces')}
                        {decorationItemCost(it) > 0 && <span className="ml-2 font-semibold text-saffron-700">{formatINR(decorationItemCost(it))}</span>}
                      </span>
                    </div>
                    {it.sizes.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {it.sizes.map((z, j) => (
                          <span key={j} className="chip bg-stone-100 text-stone-600">
                            {z.height}×{z.width} {z.unit} · ×{z.pieces}
                          </span>
                        ))}
                      </div>
                    )}
                    {(it.note_en || it.note_gu) && <div className="mt-0.5 text-xs italic text-stone-400">{pickItem(it, 'note', lang)}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between rounded-xl bg-saffron-50 px-4 py-3 ring-1 ring-saffron-100">
            <div>
              <div className="text-sm font-semibold text-stone-600">{t('totalPieces')}</div>
              <div className="text-lg font-bold tabular-nums text-stone-800">{totalPieces}</div>
            </div>
            {total > 0 && (
              <div className="text-right">
                <div className="text-sm font-semibold text-stone-600">{t('estCost')}</div>
                <div className="text-lg font-bold tabular-nums text-saffron-700">{formatINR(total)}</div>
              </div>
            )}
          </div>

          {(plan.note_en || plan.note_gu) && (
            <div className="text-xs text-stone-500">{pick(plan, 'note')}</div>
          )}
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

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => nav(`/decorations/${id}/edit`)} className="btn-ghost">
          <Pencil size={18} /> {t('edit')}
        </button>
        <button onClick={remove} className="btn-danger">
          <Trash2 size={18} /> {t('delete')}
        </button>
      </div>
    </div>
  )
}

function pickItem(it: DecorationItem, base: 'name' | 'category' | 'note', lang: 'en' | 'gu'): string {
  const gu = it[`${base}_gu`]
  const en = it[`${base}_en`]
  if (lang === 'gu') return (gu && gu.trim()) || en || ''
  return (en && en.trim()) || gu || ''
}

type Group = { label: string; items: DecorationItem[] }

function groupByCategory(plan: DecorationPlan, lang: 'en' | 'gu'): Group[] {
  const order: string[] = []
  const map = new Map<string, DecorationItem[]>()
  for (const it of plan.items) {
    const label = pickItem(it, 'category', lang) || '—'
    if (!map.has(label)) {
      map.set(label, [])
      order.push(label)
    }
    map.get(label)!.push(it)
  }
  return order.map((label) => ({ label, items: map.get(label)! }))
}
