import { useEffect, useRef, useState } from 'react'
import { Languages } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { transliterateToGujarati } from '../lib/transliterate'

interface Props {
  label: string
  valueEn: string
  valueGu: string
  onEn: (v: string) => void
  onGu: (v: string) => void
  required?: boolean
  placeholder?: string
  /** Auto-fill the Gujarati box by transliterating the English text. Default true. */
  autoTransliterate?: boolean
}

/** A field that captures both an English and a Gujarati value side by side. */
export default function BilingualInput({
  label,
  valueEn,
  valueGu,
  onEn,
  onGu,
  required,
  placeholder,
  autoTransliterate = true,
}: Props) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  // Remembers the last value we auto-filled, so we never clobber a manual edit.
  const lastAutoGu = useRef<string>('')

  useEffect(() => {
    if (!autoTransliterate) return
    const en = valueEn.trim()
    // Only auto-fill when the Gujarati box is empty or still holds a prior auto value.
    if (valueGu && valueGu !== lastAutoGu.current) return
    if (!en) return

    const ctrl = new AbortController()
    setBusy(true)
    const timer = setTimeout(async () => {
      const gu = await transliterateToGujarati(en, ctrl.signal)
      if (gu && (!valueGu || valueGu === lastAutoGu.current)) {
        lastAutoGu.current = gu
        onGu(gu)
      }
      setBusy(false)
    }, 450)

    return () => {
      clearTimeout(timer)
      ctrl.abort()
      setBusy(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueEn, autoTransliterate])

  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <input
            className="field"
            value={valueEn}
            onChange={(e) => onEn(e.target.value)}
            placeholder={placeholder ?? t('inEnglish')}
            dir="ltr"
          />
          <span className="mt-0.5 block text-[10px] text-stone-400">{t('inEnglish')}</span>
        </div>
        <div>
          <input
            className="field"
            value={valueGu}
            onChange={(e) => onGu(e.target.value)}
            placeholder={t('inGujarati')}
            lang="gu"
          />
          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-stone-400">
            {autoTransliterate && busy ? (
              <>
                <Languages size={11} className="animate-pulse text-saffron-500" /> {t('autoFilling')}
              </>
            ) : (
              t('inGujarati')
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
