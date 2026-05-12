import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Check, CheckSquare, Loader2 } from 'lucide-react'
import { api } from '../../api/api'

interface Todo {
  id: number
  title: string
  completed: 0 | 1
  created_at: string
}

type Filter = 'all' | 'open' | 'done'

export default function TodoWidget() {
  const [todos,   setTodos]   = useState<Todo[]>([])
  const [input,   setInput]   = useState('')
  const [filter,  setFilter]  = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [adding,  setAdding]  = useState(false)
  const [error,   setError]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    api.todos.list()
      .then(setTodos)
      .catch(() => setError('Verbindung zum Backend fehlgeschlagen'))
      .finally(() => setLoading(false))
  }, [])

  // ── Add ───────────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || adding) return
    setAdding(true)
    setError('')
    try {
      const todo = await api.todos.create(input.trim())
      setTodos(t => [todo, ...t])
      setInput('')
      inputRef.current?.focus()
    } catch {
      setError('Aufgabe konnte nicht gespeichert werden')
    } finally {
      setAdding(false)
    }
  }

  // ── Toggle ────────────────────────────────────────────────────────────────
  async function handleToggle(todo: Todo) {
    const next = todo.completed ? 0 : 1
    // optimistic
    setTodos(t => t.map(x => x.id === todo.id ? { ...x, completed: next as 0 | 1 } : x))
    try {
      await api.todos.update(todo.id, { completed: next as 0 | 1 })
    } catch {
      // revert
      setTodos(t => t.map(x => x.id === todo.id ? { ...x, completed: todo.completed } : x))
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    setTodos(t => t.filter(x => x.id !== id))
    try {
      await api.todos.delete(id)
    } catch {
      setError('Löschen fehlgeschlagen')
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = todos.filter(t =>
    filter === 'all'  ? true :
    filter === 'open' ? !t.completed :
                        !!t.completed
  )

  const counts = {
    all:  todos.length,
    open: todos.filter(t => !t.completed).length,
    done: todos.filter(t =>  t.completed).length,
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',  label: `Alle (${counts.all})` },
    { key: 'open', label: `Offen (${counts.open})` },
    { key: 'done', label: `Erledigt (${counts.done})` },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <CheckSquare size={15} className="text-indigo-400" strokeWidth={2} />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">ToDo</span>
        </div>
        {todos.length > 0 && (
          <span className="text-xs text-gray-500">
            {counts.done}/{counts.all} erledigt
          </span>
        )}
      </div>

      {/* Progress bar */}
      {todos.length > 0 && (
        <div className="h-1 bg-gray-700">
          <div
            className="h-1 bg-indigo-500 transition-all duration-500"
            style={{ width: `${Math.round((counts.done / counts.all) * 100)}%` }}
          />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleAdd} className="flex gap-2 px-4 pt-4 pb-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Neue Aufgabe…"
          className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || adding}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        </button>
      </form>

      {/* Error */}
      {error && (
        <p className="mx-4 mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 pb-3">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium ${
              filter === key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 max-h-80">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-600" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-8">
            {filter === 'done' ? 'Noch nichts erledigt.' :
             filter === 'open' ? 'Alles erledigt! 🎉' :
             'Keine Aufgaben. Füge eine hinzu.'}
          </p>
        )}

        {filtered.map(todo => (
          <div
            key={todo.id}
            className="group flex items-center gap-3 bg-gray-750 hover:bg-gray-700/50 border border-gray-700 rounded-lg px-3 py-2.5 transition-colors"
          >
            {/* Checkbox */}
            <button
              onClick={() => handleToggle(todo)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                ${todo.completed
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'border-gray-500 hover:border-indigo-400'
                }`}
            >
              {!!todo.completed && <Check size={10} className="text-white" strokeWidth={3} />}
            </button>

            {/* Title */}
            <span className={`flex-1 text-sm leading-snug ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-100'
            }`}>
              {todo.title}
            </span>

            {/* Delete */}
            <button
              onClick={() => handleDelete(todo.id)}
              className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
