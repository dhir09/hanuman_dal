import { NavLink, Outlet } from 'react-router-dom'
import { Home, HandCoins, FileText, Receipt, MoreHorizontal } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import type { StringKey } from '../i18n/strings'
import Logo from './Logo'

const navItems: Array<{ to: string; icon: typeof Home; key: StringKey }> = [
  { to: '/', icon: Home, key: 'nav_dashboard' },
  { to: '/donations', icon: HandCoins, key: 'nav_donations' },
  { to: '/reports', icon: FileText, key: 'nav_reports' },
  { to: '/expenses', icon: Receipt, key: 'nav_expenses' },
  { to: '/more', icon: MoreHorizontal, key: 'nav_more' },
]

export default function Layout() {
  const { t, lang, setLang } = useI18n()
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-gradient-to-r from-saffron-600 to-saffron-500 px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-2">
          <Logo size={38} className="ring-2 ring-white/70" />
          <div className="leading-tight">
            <div className="text-base font-bold">{t('appName')}</div>
            <div className="text-[10px] opacity-90">{t('tagline')}</div>
          </div>
        </div>
        <button
          onClick={() => setLang(lang === 'en' ? 'gu' : 'en')}
          className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold hover:bg-white/30"
          title="Switch language"
        >
          {lang === 'en' ? 'ગુજ' : 'ENG'}
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="grid grid-cols-5">
          {navItems.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition ${
                  isActive ? 'text-saffron-600' : 'text-stone-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid place-items-center rounded-full px-4 py-1 transition ${isActive ? 'bg-saffron-100' : ''}`}>
                    <Icon size={20} />
                  </span>
                  {t(key)}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
