import { supabase } from '../db/supabase'
import { invalidate } from '../hooks/useQuery'

function strip<T extends Record<string, unknown>>(arr: T[]): Omit<T, 'user_id'>[] {
  return arr.map(({ user_id: _, ...rest }) => rest as Omit<T, 'user_id'>)
}

export async function exportBackup() {
  const [settings, purposes, donors, donations, events, expenses, advertisementIncomes] = await Promise.all([
    supabase.from('settings').select('*'),
    supabase.from('purposes').select('*'),
    supabase.from('donors').select('*'),
    supabase.from('donations').select('*'),
    supabase.from('events').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('advertisement_incomes').select('*'),
  ])
  const data = {
    _app: 'hanuman_dal',
    _version: 1,
    _exportedAt: new Date().toISOString(),
    settings: strip(settings.data ?? []),
    purposes: strip(purposes.data ?? []),
    donors: strip(donors.data ?? []),
    donations: strip(donations.data ?? []),
    events: strip(events.data ?? []),
    expenses: strip(expenses.data ?? []),
    advertisementIncomes: strip(advertisementIncomes.data ?? []),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hanuman-dal-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File) {
  const text = await file.text()
  const data = JSON.parse(text)
  if (data._app !== 'hanuman_dal') {
    throw new Error('Not a valid Hanuman Dal backup file')
  }

  // Clear all tables (order matters for foreign keys)
  await supabase.from('donations').delete().gte('id', 0)
  await supabase.from('advertisement_incomes').delete().gte('id', 0)
  await supabase.from('expenses').delete().gte('id', 0)
  await supabase.from('events').delete().gte('id', 0)
  await supabase.from('donors').delete().gte('id', 0)
  await supabase.from('purposes').delete().gte('id', 0)
  await supabase.from('settings').delete().gte('id', 0)

  // Re-insert (strip user_id so the DB default assigns the current user)
  if (data.settings?.length) await supabase.from('settings').insert(strip(data.settings))
  if (data.purposes?.length) await supabase.from('purposes').insert(strip(data.purposes))
  if (data.donors?.length) await supabase.from('donors').insert(strip(data.donors))
  if (data.events?.length) await supabase.from('events').insert(strip(data.events))
  if (data.donations?.length) await supabase.from('donations').insert(strip(data.donations))
  if (data.expenses?.length) await supabase.from('expenses').insert(strip(data.expenses))
  if (data.advertisementIncomes?.length) await supabase.from('advertisement_incomes').insert(strip(data.advertisementIncomes))

  // Reset identity sequences so future auto-IDs don't collide
  await supabase.rpc('reset_sequences')

  invalidate('settings', 'purposes', 'donors', 'donations', 'events', 'expenses', 'advertisementIncomes')
}
