import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  PRESETS,
  getOverride,
  setOverride,
  subscribe,
  realHour,
  phaseOf,
  formatHour,
} from '../../utils/timeOfDay'

export default function TimeSwitcher() {
  const override = useSyncExternalStore(subscribe, getOverride)
  const [now, setNow] = useState(realHour())

  useEffect(() => {
    const id = setInterval(() => setNow(realHour()), 30000)
    return () => clearInterval(id)
  }, [])

  const shown = override ?? now
  const phase = phaseOf(shown)
  const base = 'rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors'
  const on = 'bg-white text-slate-900'
  const off = 'text-white/85 hover:bg-white/15'

  return (
    <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2 md:bottom-6 md:right-8">
      <div className="rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
        {override === null ? 'Waktu nyata' : 'Pratinjau'} · {phase.label} · {formatHour(shown)}
      </div>

      <div className="flex gap-1 rounded-full bg-slate-900/70 p-1 backdrop-blur-md">
        <button
          onClick={() => setOverride(null)}
          className={`${base} ${override === null ? on : off}`}
          title="Ikuti jam perangkat"
        >
          Live
        </button>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setOverride(p.hour)}
            className={`${base} ${override === p.hour ? on : off}`}
            title={p.label}
            aria-label={p.label}
          >
            <span>{p.icon}</span>
            <span className="ml-1 hidden md:inline">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}