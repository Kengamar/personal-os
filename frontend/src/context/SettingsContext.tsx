import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Theme     = 'default' | 'ocean' | 'forest' | 'sunset'
export type WidgetSize = 'sm' | 'md' | 'lg'
export type WidgetId  =
  | 'clock' | 'weather' | 'todo' | 'notes' | 'finance' | 'contacts' | 'media'

export interface WidgetConfig {
  id:   WidgetId
  size: WidgetSize
}

interface SettingsState {
  theme:   Theme
  widgets: WidgetConfig[]
}

interface SettingsContextType extends SettingsState {
  setTheme:       (t: Theme) => void
  setWidgetSize:  (id: WidgetId, size: WidgetSize) => void
  reorderWidgets: (from: number, to: number) => void
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'clock',    size: 'sm' },
  { id: 'weather',  size: 'sm' },
  { id: 'todo',     size: 'sm' },
  { id: 'notes',    size: 'md' },
  { id: 'finance',  size: 'md' },
  { id: 'contacts', size: 'md' },
  { id: 'media',    size: 'md' },
]

const STORAGE_KEY = 'personal-os-settings'

function loadState(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { theme: 'default', widgets: DEFAULT_WIDGETS }
    const parsed = JSON.parse(raw) as Partial<SettingsState>
    return {
      theme:   parsed.theme   ?? 'default',
      widgets: parsed.widgets ?? DEFAULT_WIDGETS,
    }
  } catch {
    return { theme: 'default', widgets: DEFAULT_WIDGETS }
  }
}

const Ctx = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setTheme = (theme: Theme) => setState(s => ({ ...s, theme }))

  const setWidgetSize = (id: WidgetId, size: WidgetSize) =>
    setState(s => ({ ...s, widgets: s.widgets.map(w => w.id === id ? { ...w, size } : w) }))

  const reorderWidgets = (from: number, to: number) =>
    setState(s => {
      const ws = [...s.widgets]
      const [moved] = ws.splice(from, 1)
      ws.splice(to, 0, moved)
      return { ...s, widgets: ws }
    })

  return (
    <Ctx.Provider value={{ ...state, setTheme, setWidgetSize, reorderWidgets }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
