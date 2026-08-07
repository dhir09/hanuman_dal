import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { strings, type Lang, type StringKey } from './strings'

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: StringKey) => string
  /** Pick the value for the current language from an object with `_en` / `_gu` fields. */
  pick: (obj: object, base: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

const STORAGE_KEY = 'hd_lang'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'gu' ? 'gu' : 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: setLangState,
      t: (key) => strings[key]?.[lang] ?? String(key),
      pick: (obj, base) => {
        const rec = obj as Record<string, unknown>
        const gu = rec[`${base}_gu`] as string | undefined
        const en = rec[`${base}_en`] as string | undefined
        if (lang === 'gu') return (gu && gu.trim()) || en || ''
        return (en && en.trim()) || gu || ''
      },
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
