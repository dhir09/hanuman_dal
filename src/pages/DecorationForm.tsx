import { useEffect, useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import {
  addDecorationPlan,
  deleteDecorationPlan,
  getAllEventsDesc,
  getDecorationPlan,
  updateDecorationPlan,
  type DecorationItem,
  type DecorationSize,
} from '../db/db'
import { useI18n } from '../i18n/I18nContext'
import { todayISO } from '../lib/format'
import BilingualInput from '../components/BilingualInput'

// Quick-pick decoration categories (bilingual). Only suggestions — categories are
// free-text, so new ones can be typed without any code change.
const COMMON_CATEGORIES: Array<[string, string]> = [
  ['Mandap', 'મંડપ'],
  ['Banner', 'બેનર'],
  ['Lights', 'લાઇટ'],
  ['Flowers', 'ફૂલ'],
  ['Stage', 'સ્ટેજ'],
  ['Gate', 'ગેટ'],
  ['Cloth', 'કાપડ'],
  ['Toran', 'તોરણ'],
]

// ── Local form model ──────────────────────────────────────────
// The plan is stored flat (each item carries its category). In the form we keep
// categories as accordion sections with nested items, then flatten on save and
// re-group on load — so the DB shape and the receipt/detail pages stay unchanged.

type ItemMode = 'pieces' | 'sizes'

interface FormItem {
  key: string
  name_en: string
  name_gu: string
  mode: ItemMode
  pieces: number
  sizes: DecorationSize[]
  rate?: number
}

interface FormCategory {
  key: string
  name_en: string
  name_gu: string
  open: boolean
  items: FormItem[]
}

let seq = 0
const uid = () => `${Date.now()}-${seq++}`

function emptyItem(): FormItem {
  return { key: uid(), name_en: '', name_gu: '', mode: 'pieces', pieces: 1, sizes: [], rate: undefined }
}

function emptySize(): DecorationSize {
  return { height: 0, width: 0, unit: 'ft', pieces: 1 }
}

function itemPieces(it: FormItem): number {
  return it.mode === 'sizes' ? it.sizes.reduce((s, z) => s + (z.pieces || 0), 0) : it.pieces || 0
}

export default function DecorationForm() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)

  const events = useQuery('events', getAllEventsDesc, [])

  const [date, setDate] = useState(todayISO())
  const [titleEn, setTitleEn] = useState('')
  const [titleGu, setTitleGu] = useState('')
  const [eventId, setEventId] = useState<number | ''>('')
  const [noteEn, setNoteEn] = useState('')
  const [noteGu, setNoteGu] = useState('')
  const [cats, setCats] = useState<FormCategory[]>([])

  // New-category input row
  const [newCatEn, setNewCatEn] = useState('')
  const [newCatGu, setNewCatGu] = useState('')

  useEffect(() => {
    if (!id) return
    getDecorationPlan(Number(id)).then((p) => {
      if (!p) return
      setDate(p.date)
      setTitleEn(p.title_en)
      setTitleGu(p.title_gu)
      setEventId(p.eventId ?? '')
      setNoteEn(p.note_en)
      setNoteGu(p.note_gu)
      setCats(groupIntoCategories(p.items))
    })
  }, [id])

  function onPickEvent(v: string) {
    const eid = v ? Number(v) : ''
    setEventId(eid)
    if (eid && events && !titleEn.trim() && !titleGu.trim()) {
      const ev = events.find((x) => x.id === eid)
      if (ev) {
        setTitleEn(ev.name_en)
        setTitleGu(ev.name_gu)
      }
    }
  }

  // ── Category actions ──
  function addCategory(name_en: string, name_gu: string) {
    const en = name_en.trim()
    const gu = name_gu.trim()
    if (!en && !gu) return
    // Merge instead of duplicating if the same category already exists.
    const existing = cats.find((c) => (c.name_gu || c.name_en) === (gu || en))
    if (existing) {
      setCats((prev) => prev.map((c) => (c.key === existing.key ? { ...c, open: true } : c)))
    } else {
      setCats((prev) => [...prev, { key: uid(), name_en: en, name_gu: gu, open: true, items: [emptyItem()] }])
    }
    setNewCatEn('')
    setNewCatGu('')
  }

  function toggleCategory(cIdx: number) {
    setCats((prev) => prev.map((c, i) => (i === cIdx ? { ...c, open: !c.open } : c)))
  }

  function removeCategory(cIdx: number) {
    setCats((prev) => prev.filter((_, i) => i !== cIdx))
  }

  // ── Item actions ──
  function patchCat(cIdx: number, fn: (c: FormCategory) => FormCategory) {
    setCats((prev) => prev.map((c, i) => (i === cIdx ? fn(c) : c)))
  }

  function addItem(cIdx: number) {
    patchCat(cIdx, (c) => ({ ...c, items: [...c.items, emptyItem()] }))
  }

  function updateItem(cIdx: number, iIdx: number, patch: Partial<FormItem>) {
    patchCat(cIdx, (c) => ({ ...c, items: c.items.map((it, j) => (j === iIdx ? { ...it, ...patch } : it)) }))
  }

  function removeItem(cIdx: number, iIdx: number) {
    patchCat(cIdx, (c) => ({ ...c, items: c.items.filter((_, j) => j !== iIdx) }))
  }

  function setMode(cIdx: number, iIdx: number, mode: ItemMode) {
    patchCat(cIdx, (c) => ({
      ...c,
      items: c.items.map((it, j) =>
        j === iIdx ? { ...it, mode, sizes: mode === 'sizes' && it.sizes.length === 0 ? [emptySize()] : it.sizes } : it,
      ),
    }))
  }

  function addSize(cIdx: number, iIdx: number) {
    patchCat(cIdx, (c) => ({
      ...c,
      items: c.items.map((it, j) => (j === iIdx ? { ...it, sizes: [...it.sizes, emptySize()] } : it)),
    }))
  }

  function updateSize(cIdx: number, iIdx: number, sIdx: number, patch: Partial<DecorationSize>) {
    patchCat(cIdx, (c) => ({
      ...c,
      items: c.items.map((it, j) =>
        j === iIdx ? { ...it, sizes: it.sizes.map((z, k) => (k === sIdx ? { ...z, ...patch } : z)) } : it,
      ),
    }))
  }

  function removeSize(cIdx: number, iIdx: number, sIdx: number) {
    patchCat(cIdx, (c) => ({
      ...c,
      items: c.items.map((it, j) => (j === iIdx ? { ...it, sizes: it.sizes.filter((_, k) => k !== sIdx) } : it)),
    }))
  }

  async function save() {
    const items = flatten(cats)
    if (!items.length) return alert(t('noItemsYet'))

    const base = {
      date,
      title_en: titleEn.trim(),
      title_gu: titleGu.trim(),
      eventId: eventId || undefined,
      items,
      note_en: noteEn.trim(),
      note_gu: noteGu.trim(),
    }

    if (editing) {
      await updateDecorationPlan(Number(id), base)
      nav(`/decorations/${id}`)
    } else {
      const newId = await addDecorationPlan({ ...base, createdAt: new Date().toISOString() })
      nav(`/decorations/${newId}`)
    }
  }

  async function remove() {
    if (!id || !confirm(t('deleteConfirm'))) return
    await deleteDecorationPlan(Number(id))
    nav('/decorations')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-800">{editing ? t('edit') : t('addDecoration')}</h1>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">{t('date')} *</label>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {events && events.length > 0 && (
          <div>
            <label className="label">{t('event')} ({t('optional')})</label>
            <select className="field" value={eventId} onChange={(e) => onPickEvent(e.target.value)}>
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
          label={`${t('decorationTitle')} (${t('optional')})`}
          valueEn={titleEn}
          valueGu={titleGu}
          onEn={setTitleEn}
          onGu={setTitleGu}
        />
      </div>

      {/* Step 1 — add a category */}
      <div className="card space-y-3">
        <label className="label !mb-0">{t('addCategory')}</label>
        <BilingualInput
          label={t('categoryName')}
          valueEn={newCatEn}
          valueGu={newCatGu}
          onEn={setNewCatEn}
          onGu={setNewCatGu}
          placeholder="Mandap, Lights…"
        />
        <div className="flex flex-wrap gap-1.5">
          {COMMON_CATEGORIES.map(([en, gu]) => (
            <button
              key={en}
              type="button"
              onClick={() => addCategory(en, gu)}
              className="chip bg-saffron-50 text-saffron-700 ring-1 ring-saffron-200 hover:bg-saffron-100"
            >
              + {gu}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addCategory(newCatEn, newCatGu)}
          disabled={!newCatEn.trim() && !newCatGu.trim()}
          className="btn-primary w-full py-2 text-sm disabled:opacity-40"
        >
          <Plus size={16} /> {t('addCategory')}
        </button>
      </div>

      {/* Step 2 — categories with their items (accordion) */}
      {cats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 py-10 text-center text-sm text-stone-400">
          {t('noCategoriesYet')}
        </div>
      ) : (
        <div className="space-y-3">
          {cats.map((c, cIdx) => {
            const catPieces = c.items.reduce((s, it) => s + itemPieces(it), 0)
            return (
              <div key={c.key} className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
                {/* Category header */}
                <div className="flex items-center gap-2 bg-saffron-50 px-3 py-2.5">
                  <button type="button" onClick={() => toggleCategory(cIdx)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    {c.open ? <ChevronDown size={18} className="shrink-0 text-saffron-600" /> : <ChevronRight size={18} className="shrink-0 text-saffron-600" />}
                    <span className="truncate text-sm font-bold text-stone-800">{c.name_gu || c.name_en}</span>
                    <span className="shrink-0 text-[11px] text-stone-400">{c.items.length} {t('items')} · {catPieces} {t('pieces')}</span>
                  </button>
                  <button type="button" onClick={() => removeCategory(cIdx)} className="shrink-0 text-stone-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>

                {c.open && (
                  <div className="space-y-3 p-3">
                    {c.items.map((it, iIdx) => (
                      <div key={it.key} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-stone-500">
                            {t('item')} {iIdx + 1}
                            {itemPieces(it) > 0 && <span className="ml-2 font-normal text-stone-400">· {itemPieces(it)} {t('pieces')}</span>}
                          </span>
                          {c.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(cIdx, iIdx)} className="text-stone-400 hover:text-red-500">
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        <BilingualInput
                          label={t('name')}
                          valueEn={it.name_en}
                          valueGu={it.name_gu}
                          onEn={(v) => updateItem(cIdx, iIdx, { name_en: v })}
                          onGu={(v) => updateItem(cIdx, iIdx, { name_gu: v })}
                          placeholder="Tables, Iron rod…"
                        />

                        {/* Mode toggle: plain pieces vs. size variants */}
                        <div className="mt-3 flex gap-1.5">
                          {(['pieces', 'sizes'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMode(cIdx, iIdx, m)}
                              className={`chip flex-1 justify-center ${it.mode === m ? 'bg-saffron-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}
                            >
                              {m === 'pieces' ? t('byPieces') : t('bySize')}
                            </button>
                          ))}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {it.mode === 'pieces' && (
                            <div>
                              <label className="label">{t('pieces')}</label>
                              <input
                                type="number"
                                inputMode="numeric"
                                className="field"
                                value={it.pieces}
                                onChange={(e) => updateItem(cIdx, iIdx, { pieces: parseInt(e.target.value) || 0 })}
                                min={0}
                              />
                            </div>
                          )}
                          <div>
                            <label className="label">{t('rate')} ({t('optional')})</label>
                            <input
                              type="number"
                              inputMode="decimal"
                              className="field"
                              value={it.rate ?? ''}
                              onChange={(e) => updateItem(cIdx, iIdx, { rate: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })}
                              min={0}
                              placeholder="₹"
                            />
                          </div>
                        </div>

                        {/* Size variant rows */}
                        {it.mode === 'sizes' && (
                          <div className="mt-3 space-y-2">
                            {it.sizes.map((z, sIdx) => (
                              <div key={sIdx} className="rounded-lg bg-white p-2 ring-1 ring-stone-200">
                                <div className="flex items-end gap-1.5">
                                  <div className="flex-1">
                                    <label className="label !text-[10px]">{t('size')}</label>
                                    <div className="flex items-center gap-1">
                                      <input type="number" inputMode="decimal" className="field !px-2 !py-1.5 text-sm" value={z.height || ''} onChange={(e) => updateSize(cIdx, iIdx, sIdx, { height: parseFloat(e.target.value) || 0 })} min={0} placeholder="0" />
                                      <span className="text-stone-400">×</span>
                                      <input type="number" inputMode="decimal" className="field !px-2 !py-1.5 text-sm" value={z.width || ''} onChange={(e) => updateSize(cIdx, iIdx, sIdx, { width: parseFloat(e.target.value) || 0 })} min={0} placeholder="0" />
                                    </div>
                                  </div>
                                  <div className="w-14">
                                    <label className="label !text-[10px]">{t('unit')}</label>
                                    <input className="field !px-2 !py-1.5 text-sm" value={z.unit} onChange={(e) => updateSize(cIdx, iIdx, sIdx, { unit: e.target.value })} placeholder="ft" />
                                  </div>
                                  <div className="w-16">
                                    <label className="label !text-[10px]">{t('pieces')}</label>
                                    <input type="number" inputMode="numeric" className="field !px-2 !py-1.5 text-sm" value={z.pieces} onChange={(e) => updateSize(cIdx, iIdx, sIdx, { pieces: parseInt(e.target.value) || 0 })} min={0} />
                                  </div>
                                  {it.sizes.length > 1 && (
                                    <button type="button" onClick={() => removeSize(cIdx, iIdx, sIdx)} className="pb-2 text-stone-400 hover:text-red-500">
                                      <X size={15} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => addSize(cIdx, iIdx)} className="text-xs font-semibold text-saffron-600 hover:text-saffron-700">
                              {t('addSize')}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    <button type="button" onClick={() => addItem(cIdx)} className="w-full rounded-xl border border-dashed border-saffron-300 py-2 text-xs font-semibold text-saffron-600 hover:bg-saffron-50">
                      <Plus size={14} className="mr-0.5 inline" /> {t('addAnotherItem')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

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

// Flatten accordion sections into the stored flat item array. Items with no name
// and no pieces are dropped; empty size rows are dropped.
function flatten(cats: FormCategory[]): DecorationItem[] {
  const out: DecorationItem[] = []
  for (const c of cats) {
    for (const it of c.items) {
      const sizes = it.mode === 'sizes' ? it.sizes.filter((z) => z.height > 0 || z.width > 0 || z.pieces > 0) : []
      const pieces = it.mode === 'pieces' ? it.pieces : 0
      const hasName = it.name_en.trim() || it.name_gu.trim()
      if (!hasName && pieces <= 0 && sizes.length === 0) continue
      out.push({
        category_en: c.name_en,
        category_gu: c.name_gu,
        name_en: it.name_en.trim(),
        name_gu: it.name_gu.trim(),
        pieces,
        sizes,
        rate: it.rate,
        note_en: '',
        note_gu: '',
      })
    }
  }
  return out
}

// Re-group a stored flat item array back into accordion sections (used on edit).
function groupIntoCategories(items: DecorationItem[]): FormCategory[] {
  const order: string[] = []
  const map = new Map<string, FormCategory>()
  for (const it of items) {
    const k = (it.category_gu || it.category_en) || '—'
    let cat = map.get(k)
    if (!cat) {
      cat = { key: uid(), name_en: it.category_en, name_gu: it.category_gu, open: true, items: [] }
      map.set(k, cat)
      order.push(k)
    }
    const sizes = it.sizes ?? []
    cat.items.push({
      key: uid(),
      name_en: it.name_en,
      name_gu: it.name_gu,
      mode: sizes.length ? 'sizes' : 'pieces',
      pieces: it.pieces,
      sizes,
      rate: it.rate,
    })
  }
  return order.map((k) => map.get(k)!)
}
