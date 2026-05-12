import { X, GripVertical } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import type { Theme, WidgetSize, WidgetId } from '../context/SettingsContext'

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: 'default', label: 'Standard', color: '#6366f1' },
  { id: 'ocean',   label: 'Ocean',    color: '#3b82f6' },
  { id: 'forest',  label: 'Forest',   color: '#10b981' },
  { id: 'sunset',  label: 'Sunset',   color: '#f97316' },
]

const WIDGET_LABELS: Record<WidgetId, string> = {
  clock:    'Uhr & Datum',
  weather:  'Wetter',
  todo:     'ToDo-Liste',
  notes:    'Notizen',
  finance:  'Finanzen',
  contacts: 'Kontakte',
  media:    'Medien',
}

const SIZE_OPTIONS: { key: WidgetSize; label: string }[] = [
  { key: 'sm', label: 'S' },
  { key: 'md', label: 'M' },
  { key: 'lg', label: 'L' },
]

interface Props { onClose: () => void }

export default function SettingsPanel({ onClose }: Props) {
  const { theme, setTheme, widgets, setWidgetSize } = useSettings()

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-14 right-0 bottom-0 w-72 bg-gray-800 border-l border-gray-700 z-50 flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
          <h2 className="text-white font-semibold text-sm">Einstellungen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-6">

          {/* ── Theme picker ────────────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Design / Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    theme === t.id
                      ? 'border-white/30 bg-gray-700 text-white'
                      : 'border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ background: t.color }}
                  />
                  {t.label}
                  {theme === t.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Widget sizes ────────────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Widget-Größen</h3>
            <p className="text-xs text-gray-600 mb-3">S = ⅓ Breite · M = ½ Breite · L = Volle Breite</p>
            <div className="space-y-2">
              {widgets.map(w => (
                <div key={w.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <GripVertical size={12} />
                  </div>
                  <span className="flex-1 text-sm text-gray-300 truncate">{WIDGET_LABELS[w.id]}</span>
                  <div className="flex gap-1">
                    {SIZE_OPTIONS.map(s => (
                      <button
                        key={s.key}
                        onClick={() => setWidgetSize(w.id, s.key)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                          w.size === s.key
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Drag hint ───────────────────────────────────────────── */}
          <section className="bg-gray-700/50 rounded-xl p-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="text-gray-300 font-medium">Reihenfolge ändern:</span>{' '}
              Widgets im Dashboard per Drag & Drop verschieben.
            </p>
          </section>

        </div>
      </div>
    </>
  )
}
