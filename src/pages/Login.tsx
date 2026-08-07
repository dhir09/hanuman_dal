import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import Logo from '../components/Logo'

export default function Login() {
  const { t } = useI18n()
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const err = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-stone-100 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Logo size={72} className="mx-auto bg-white shadow-lg ring-2 ring-saffron-200" />
          <h1 className="mt-3 text-2xl font-extrabold text-stone-800">{t('appName')}</h1>
          <p className="text-sm text-stone-500">{t('tagline')}</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">{t('email')}</label>
            <input
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">{t('password')}</label>
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? '…' : mode === 'login' ? t('login') : t('signup')}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500">
          {mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="font-semibold text-saffron-600 hover:text-saffron-700"
          >
            {mode === 'login' ? t('signup') : t('login')}
          </button>
        </p>
      </div>
    </div>
  )
}
