import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Clock, Cloud, CheckSquare,
  FileText, TrendingUp, Users, Film, Menu, X, Settings,
} from 'lucide-react'
import GlobalSearch  from './GlobalSearch'
import SettingsPanel from './SettingsPanel'
import { useSettings } from '../context/SettingsContext'

const navItems = [
  { path: '/',         label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/clock',    label: 'Uhr',       icon: Clock },
  { path: '/weather',  label: 'Wetter',    icon: Cloud },
  { path: '/todo',     label: 'ToDo',      icon: CheckSquare },
  { path: '/notes',    label: 'Notizen',   icon: FileText },
  { path: '/finance',  label: 'Finanzen',  icon: TrendingUp },
  { path: '/contacts', label: 'Kontakte',  icon: Users },
  { path: '/media',    label: 'Medien',    icon: Film },
]

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-gray-300 text-sm font-mono tabular-nums">
      {time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export default function Layout() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()
  const { theme } = useSettings()

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col" data-theme={theme}>

      {/* Header */}
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center gap-3 px-4 shrink-0 z-30">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-md transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-white font-semibold text-lg tracking-tight">Personal OS</span>
        </div>

        <GlobalSearch />

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <LiveClock />
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className={`p-1.5 rounded-lg transition-colors ${
              settingsOpen
                ? 'text-white bg-gray-700'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Einstellungen"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      <div className="flex flex-1 overflow-hidden">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed top-14 bottom-0 left-0 w-56 bg-gray-800 border-r border-gray-700
          z-20 flex flex-col transition-transform duration-200
          lg:static lg:translate-x-0 lg:shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {navItems.map(({ path, label, icon: Icon, exact }) => (
              <NavLink
                key={path}
                to={path}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-600 text-center">Personal OS v0.1</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
