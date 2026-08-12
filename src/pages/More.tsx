import { Link } from 'react-router-dom'
import { CalendarDays, Megaphone, Users, Settings as SettingsIcon, ChevronRight, FileUp } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import type { StringKey } from '../i18n/strings'

const items: Array<{ to: string; icon: typeof Users; key: StringKey }> = [
  { to: '/donors', icon: Users, key: 'nav_donors' },
  { to: '/events', icon: CalendarDays, key: 'nav_events' },
  { to: '/advertising-income', icon: Megaphone, key: 'nav_advertisementIncome' },
  { to: '/import-past-records', icon: FileUp, key: 'importPastRecords' },
  { to: '/settings', icon: SettingsIcon, key: 'nav_settings' },
]

export default function More() {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-stone-800">{t('nav_more')}</h1>
      <div className="card divide-y divide-stone-100 !p-0">
        {items.map(({ to, icon: Icon, key }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-4 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-saffron-100 text-saffron-600">
              <Icon size={18} />
            </span>
            <span className="flex-1 text-sm font-semibold text-stone-700">{t(key)}</span>
            <ChevronRight size={18} className="text-stone-300" />
          </Link>
        ))}
      </div>
    </div>
  )
}
