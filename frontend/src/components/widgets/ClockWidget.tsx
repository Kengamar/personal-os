import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const WORLD_CLOCKS = [
  { label: 'Berlin',   tz: 'Europe/Berlin',   flag: '🇩🇪' },
  { label: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
  { label: 'Tokio',    tz: 'Asia/Tokyo',       flag: '🇯🇵' },
]

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatTime(date: Date, tz?: string) {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: tz,
  })
}

function formatDate(date: Date) {
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getOffset(date: Date, tz: string) {
  const local = date.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false })
  const here  = date.toLocaleString('en-US', { timeZone: 'Europe/Berlin', hour: 'numeric', hour12: false })
  const diff  = parseInt(local) - parseInt(here)
  if (diff === 0) return null
  return diff > 0 ? `+${diff}h` : `${diff}h`
}

export default function ClockWidget() {
  const now = useClock()

  const [hh, mm, ss] = formatTime(now).split(':')

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-700">
        <Clock size={15} className="text-indigo-400" strokeWidth={2} />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Uhr & Datum</span>
      </div>

      {/* Main clock */}
      <div className="px-6 pt-6 pb-5 text-center">
        <div className="flex items-center justify-center gap-1 font-mono tabular-nums">
          <span className="text-6xl sm:text-7xl font-light text-white tracking-tight">{hh}</span>
          <span className="text-5xl sm:text-6xl font-light text-indigo-400 mb-1 animate-pulse">:</span>
          <span className="text-6xl sm:text-7xl font-light text-white tracking-tight">{mm}</span>
          <span className="text-5xl sm:text-6xl font-light text-gray-600 mb-1">:</span>
          <span className="text-3xl sm:text-4xl font-light text-gray-500 self-end mb-1">{ss}</span>
        </div>

        <p className="mt-3 text-gray-400 text-sm capitalize">
          {formatDate(now)}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-gray-700" />

      {/* World clocks */}
      <div className="grid grid-cols-3 divide-x divide-gray-700 px-0">
        {WORLD_CLOCKS.map(({ label, tz, flag }) => {
          const offset = getOffset(now, tz)
          return (
            <div key={tz} className="flex flex-col items-center py-4 gap-1">
              <span className="text-lg">{flag}</span>
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-sm font-mono tabular-nums text-gray-200">
                {formatTime(now, tz).slice(0, 5)}
              </span>
              {offset && (
                <span className="text-xs text-gray-600">{offset}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
