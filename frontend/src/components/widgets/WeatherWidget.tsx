import { useState, useEffect, useCallback } from 'react'
import { MapPin, Wind, Droplets, Search, RefreshCw, Settings, Umbrella } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Location {
  name: string
  country: string
  lat: number
  lon: number
}

interface WeatherData {
  location: Location
  current: {
    temp: number
    windspeed: number
    humidity: number
    code: number
    precipProb: number
  }
  daily: {
    date: string
    code: number
    max: number
    min: number
    precipProb: number
  }[]
}

// ─── WMO code helpers ─────────────────────────────────────────────────────────

function weatherEmoji(code: number): string {
  if (code === 0)   return '☀️'
  if (code <= 2)    return '⛅'
  if (code === 3)   return '☁️'
  if (code <= 48)   return '🌫️'
  if (code <= 55)   return '🌦️'
  if (code <= 57)   return '🌨️'
  if (code <= 65)   return '🌧️'
  if (code <= 67)   return '🌧️'
  if (code <= 75)   return '❄️'
  if (code === 77)  return '🌨️'
  if (code <= 82)   return '🌦️'
  if (code <= 86)   return '🌨️'
  if (code <= 99)   return '⛈️'
  return '🌡️'
}

function weatherDesc(code: number): string {
  if (code === 0)  return 'Klarer Himmel'
  if (code === 1)  return 'Überwiegend klar'
  if (code === 2)  return 'Teilweise bewölkt'
  if (code === 3)  return 'Bedeckt'
  if (code <= 48)  return 'Neblig'
  if (code <= 55)  return 'Nieselregen'
  if (code <= 57)  return 'Gefrierender Nieselregen'
  if (code <= 63)  return 'Regen'
  if (code <= 65)  return 'Starker Regen'
  if (code <= 67)  return 'Gefrierender Regen'
  if (code <= 75)  return 'Schneefall'
  if (code === 77) return 'Schneegriesel'
  if (code <= 82)  return 'Regenschauer'
  if (code <= 86)  return 'Schneeschauer'
  if (code === 95) return 'Gewitter'
  if (code <= 99)  return 'Gewitter mit Hagel'
  return 'Unbekannt'
}

function shortDay(dateStr: string, index: number): string {
  if (index === 0) return 'Heute'
  if (index === 1) return 'Morgen'
  return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short' })
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchByCoords(loc: Location): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=temperature_2m,windspeed_10m,weathercode,relativehumidity_2m` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=5`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Wetterdaten konnten nicht geladen werden')
  const wx = await res.json()

  const precipProbToday: number = wx.daily.precipitation_probability_max?.[0] ?? 0

  return {
    location: loc,
    current: {
      temp:       Math.round(wx.current.temperature_2m),
      windspeed:  Math.round(wx.current.windspeed_10m),
      humidity:   wx.current.relativehumidity_2m,
      code:       wx.current.weathercode,
      precipProb: precipProbToday,
    },
    daily: wx.daily.time.map((date: string, i: number) => ({
      date,
      code:       wx.daily.weathercode[i],
      max:        Math.round(wx.daily.temperature_2m_max[i]),
      min:        Math.round(wx.daily.temperature_2m_min[i]),
      precipProb: wx.daily.precipitation_probability_max?.[i] ?? 0,
    })),
  }
}

async function geocode(city: string): Promise<Location> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de`
  )
  const data = await res.json()
  if (!data.results?.length) throw new Error(`Ort "${city}" nicht gefunden`)
  const { name, country, latitude, longitude } = data.results[0]
  return { name, country, lat: latitude, lon: longitude }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'weather-location'

const DEFAULT_LOCATION: Location = {
  name: 'Berlin', country: 'Deutschland', lat: 52.52, lon: 13.41,
}

function loadSavedLocation(): Location {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_LOCATION
    const parsed = JSON.parse(raw)
    if (parsed.lat && parsed.lon && parsed.name) return parsed
  } catch { /* ignore */ }
  return DEFAULT_LOCATION
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeatherWidget() {
  const [location, setLocation] = useState<Location>(loadSavedLocation)
  const [data, setData]         = useState<WeatherData | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [settings, setSettings] = useState(false)
  const [input, setInput]       = useState('')

  const load = useCallback(async (loc: Location) => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchByCoords(loc)
      setData(result)
      setLocation(loc)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(location) }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      const loc = await geocode(input.trim())
      setInput('')
      setSettings(false)
      await load(loc)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ort nicht gefunden')
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-indigo-400" strokeWidth={2} />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Wetter</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => load(location)}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 p-1 rounded transition-colors disabled:opacity-40"
            title="Aktualisieren"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setSettings(s => !s); setInput('') }}
            className={`p-1 rounded transition-colors ${settings ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
            title="Standort ändern"
          >
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* City search */}
      {settings && (
        <form onSubmit={handleSearch} className="px-5 py-3 border-b border-gray-700 flex gap-2">
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Stadt eingeben…"
            className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Search size={14} />
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="px-6 py-8 flex flex-col items-center gap-3 animate-pulse">
          <div className="w-16 h-16 bg-gray-700 rounded-full" />
          <div className="w-32 h-8 bg-gray-700 rounded" />
          <div className="w-24 h-4 bg-gray-700 rounded" />
        </div>
      )}

      {/* Weather content */}
      {data && (
        <>
          {/* Current weather */}
          <div className="px-6 pt-5 pb-4">
            <p className="text-gray-400 text-sm flex items-center gap-1 mb-2">
              <MapPin size={12} /> {data.location.name}, {data.location.country}
            </p>

            <div className="flex items-start justify-between">
              {/* Left: temp + description */}
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-light text-white tabular-nums leading-none">
                    {data.current.temp}°
                  </span>
                  <span className="text-3xl mb-1">{weatherEmoji(data.current.code)}</span>
                </div>
                <p className="text-gray-300 text-sm mt-1.5">{weatherDesc(data.current.code)}</p>
              </div>

              {/* Right: stats */}
              <div className="flex flex-col gap-2 text-right mt-1">
                <div className="flex items-center justify-end gap-1.5 text-sm text-gray-400">
                  <Wind size={13} />
                  <span>{data.current.windspeed} km/h</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-sm text-gray-400">
                  <Droplets size={13} />
                  <span>{data.current.humidity}%</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-sm text-gray-400">
                  <Umbrella size={13} />
                  <span>{data.current.precipProb}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-5 border-t border-gray-700" />

          {/* 5-day forecast */}
          <div className="grid grid-cols-5 divide-x divide-gray-700">
            {data.daily.map((day, i) => (
              <div key={day.date} className="flex flex-col items-center py-3 gap-1">
                <span className="text-xs text-gray-500 font-medium">{shortDay(day.date, i)}</span>
                <span className="text-lg leading-none">{weatherEmoji(day.code)}</span>
                <span className="text-xs text-white font-medium">{day.max}°</span>
                <span className="text-xs text-gray-600">{day.min}°</span>
                <div className="flex items-center gap-0.5 text-gray-500">
                  <Umbrella size={9} />
                  <span className="text-xs">{day.precipProb}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
