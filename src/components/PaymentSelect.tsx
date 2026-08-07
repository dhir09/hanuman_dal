import { useI18n } from '../i18n/I18nContext'
import type { PaymentMode } from '../db/db'

const modes: PaymentMode[] = ['cash', 'upi', 'bank', 'cheque']

export default function PaymentSelect({
  value,
  onChange,
}: {
  value: PaymentMode
  onChange: (m: PaymentMode) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${
            value === m
              ? 'bg-saffron-600 text-white'
              : 'bg-white text-stone-600 ring-1 ring-stone-200'
          }`}
        >
          {t(m)}
        </button>
      ))}
    </div>
  )
}
