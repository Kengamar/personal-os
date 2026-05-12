import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckSquare, FileText, Users, Film, X } from 'lucide-react'
import { api } from '../api/api'

interface Result {
  id: number
  label: string
  sub: string
  path: string
  category: 'todo' | 'note' | 'contact' | 'media'
}

const CATEGORY_META = {
  todo:    { label: 'ToDo',     icon: CheckSquare, color: 'text-indigo-400' },
  note:    { label: 'Notiz',    icon: FileText,    color: 'text-yellow-400' },
  contact: { label: 'Kontakt',  icon: Users,       color: 'text-purple-400' },
  media:   { label: 'Medien',   icon: Film,        color: 'text-blue-400'   },
}

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export default function GlobalSearch() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive]   = useState(-1)

  const inputRef    = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate    = useNavigate()
  const debounced   = useDebounce(query, 200)

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Global keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const lower = q.toLowerCase()
      const [todos, notes, contacts, media] = await Promise.all([
        api.todos.list(),
        api.notes.list(),
        api.contacts.list(),
        api.media.list(),
      ])

      const out: Result[] = [
        ...todos
          .filter(t => t.title.toLowerCase().includes(lower))
          .slice(0, 3)
          .map(t => ({
            id: t.id, label: t.title,
            sub: t.completed ? 'Erledigt' : 'Offen',
            path: '/todo', category: 'todo' as const,
          })),
        ...notes
          .filter(n => n.title.toLowerCase().includes(lower) || n.content.toLowerCase().includes(lower))
          .slice(0, 3)
          .map(n => ({
            id: n.id, label: n.title || '(Kein Titel)',
            sub: n.category,
            path: '/notes', category: 'note' as const,
          })),
        ...contacts
          .filter(c =>
            c.name.toLowerCase().includes(lower) ||
            c.email.toLowerCase().includes(lower) ||
            c.phone.toLowerCase().includes(lower)
          )
          .slice(0, 3)
          .map(c => ({
            id: c.id, label: c.name,
            sub: [c.email, c.phone].filter(Boolean).join(' · '),
            path: '/contacts', category: 'contact' as const,
          })),
        ...media
          .filter(m => m.title.toLowerCase().includes(lower))
          .slice(0, 3)
          .map(m => ({
            id: m.id, label: m.title,
            sub: `${m.type === 'movie' ? 'Film' : m.type === 'series' ? 'Serie' : 'Buch'} · ${m.status === 'watched' ? 'Gesehen' : m.status === 'watching' ? 'Am Schauen' : 'Merkliste'}`,
            path: '/media', category: 'media' as const,
          })),
      ]
      setResults(out)
      setActive(-1)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { search(debounced) }, [debounced, search])

  function close() {
    setOpen(false)
    setQuery('')
    setResults([])
    setActive(-1)
  }

  function go(path: string) {
    navigate(path)
    close()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) go(results[active].path)
  }

  const showDropdown = open && (loading || query.length >= 2)

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm">
      {/* Input */}
      <div
        className={`flex items-center gap-2 bg-gray-700 border rounded-lg px-3 py-1.5 transition-colors cursor-text
          ${open ? 'border-indigo-500' : 'border-gray-600 hover:border-gray-500'}`}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Suchen… (Ctrl+K)"
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none min-w-0"
        />
        {query && (
          <button onClick={close} className="text-gray-500 hover:text-gray-300 shrink-0">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-sm">
              <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-indigo-400 rounded-full animate-spin" />
              Suche…
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="px-4 py-3 text-gray-500 text-sm">Keine Ergebnisse für „{query}"</p>
          )}

          {!loading && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((r, i) => {
                const meta = CATEGORY_META[r.category]
                const Icon = meta.icon
                return (
                  <li key={`${r.category}-${r.id}`}>
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        active === i ? 'bg-gray-700' : 'hover:bg-gray-700/60'
                      }`}
                    >
                      <Icon size={15} className={`shrink-0 ${meta.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{r.label}</p>
                        {r.sub && <p className="text-gray-500 text-xs truncate">{r.sub}</p>}
                      </div>
                      <span className={`text-xs shrink-0 ${meta.color} opacity-70`}>{meta.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Hint */}
          {!loading && results.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-700 text-xs text-gray-600">
              <span>↑↓ navigieren</span>
              <span>↵ öffnen</span>
              <span>Esc schließen</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
