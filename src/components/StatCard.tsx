import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
  tone?: 'green' | 'red' | 'saffron' | 'stone'
}

const tones: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  saffron: 'bg-saffron-50 text-saffron-700 ring-saffron-100',
  stone: 'bg-stone-50 text-stone-700 ring-stone-100',
}

export default function StatCard({ label, value, sub, icon, tone = 'stone' }: Props) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</span>
        {icon && <span className="grid h-7 w-7 place-items-center rounded-full bg-white/60">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs opacity-70">{sub}</div>}
    </div>
  )
}
