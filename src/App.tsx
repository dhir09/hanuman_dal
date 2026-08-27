import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ensureSeed } from './db/db'
import { I18nProvider } from './i18n/I18nContext'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Donations from './pages/Donations'
import DonationForm from './pages/DonationForm'
import DonationReceipt from './pages/DonationReceipt'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Donors from './pages/Donors'
import DonorDetail from './pages/DonorDetail'
import More from './pages/More'
import Settings from './pages/Settings'
import AdvertisementIncome from './pages/AdvertisementIncome'
import AdvertisementIncomeForm from './pages/AdvertisementIncomeForm'
import AdvertisementIncomeReceipt from './pages/AdvertisementIncomeReceipt'
import InKindDonations from './pages/InKindDonations'
import InKindDonationForm from './pages/InKindDonationForm'
import InKindDonationReceipt from './pages/InKindDonationReceipt'
import ImportPastRecords from './pages/ImportPastRecords'
import Decorations from './pages/Decorations'
import DecorationForm from './pages/DecorationForm'
import DecorationDetail from './pages/DecorationDetail'

function AuthGate() {
  const { user, loading } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) return
    ensureSeed().then(() => setReady(true))
  }, [user])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-100">
        <img src="/logo.png" alt="Hanuman Dal" className="h-24 w-24 animate-pulse rounded-full" />
      </div>
    )
  }

  if (!user) return <Login />

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-100">
        <img src="/logo.png" alt="Hanuman Dal" className="h-24 w-24 animate-pulse rounded-full" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="donations" element={<Donations />} />
          <Route path="donations/new" element={<DonationForm />} />
          <Route path="donations/:id" element={<DonationReceipt />} />
          <Route path="donations/:id/edit" element={<DonationForm />} />
          <Route path="reports" element={<Reports />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="donors" element={<Donors />} />
          <Route path="donors/:id" element={<DonorDetail />} />
          <Route path="more" element={<More />} />
          <Route path="settings" element={<Settings />} />
          <Route path="advertising-income" element={<AdvertisementIncome />} />
          <Route path="advertising-income/new" element={<AdvertisementIncomeForm />} />
          <Route path="advertising-income/:id" element={<AdvertisementIncomeReceipt />} />
          <Route path="advertising-income/:id/edit" element={<AdvertisementIncomeForm />} />
          <Route path="in-kind" element={<InKindDonations />} />
          <Route path="in-kind/new" element={<InKindDonationForm />} />
          <Route path="in-kind/:id" element={<InKindDonationReceipt />} />
          <Route path="in-kind/:id/edit" element={<InKindDonationForm />} />
          <Route path="import-past-records" element={<ImportPastRecords />} />
          <Route path="decorations" element={<Decorations />} />
          <Route path="decorations/new" element={<DecorationForm />} />
          <Route path="decorations/:id" element={<DecorationDetail />} />
          <Route path="decorations/:id/edit" element={<DecorationForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </I18nProvider>
  )
}
