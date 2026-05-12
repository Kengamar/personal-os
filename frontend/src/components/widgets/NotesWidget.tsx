import { useState, useEffect, useMemo } from 'react'
import { FileText, Plus, Trash2, Search, X, Loader2, Save } from 'lucide-react'
import { api } from '../../api/api'

interface Note {
  id: number
  title: string
  content: string
  category: string
  created_at: string
}

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORIES = ['Allgemein', 'Arbeit', 'Privat', 'Ideen'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_COLOR: Record<string, string> = {
  Allgemein: 'bg-gray-700 text-gray-300',
  Arbeit:    'bg-blue-500/20 text-blue-300',
  Privat:    'bg-green-500/20 text-green-300',
  Ideen:     'bg-purple-500/20 text-purple-300',
}

function categoryColor(cat: string) {
  return CATEGORY_COLOR[cat] ?? CATEGORY_COLOR.Allgemein
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (min  <  1) return 'gerade eben'
  if (min  < 60) return `vor ${min} Min.`
  if (hrs  < 24) return `vor ${hrs} Std.`
  if (days <  7) return `vor ${days} Tagen`
  return new Date(iso).toLocaleDateString('de-DE')
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  note: Partial<Note> | null
  onSave: (data: Pick<Note, 'title' | 'content' | 'category'>) => Promise<void>
  onClose: () => void
}

function NoteModal({ note, onSave, onClose }: ModalProps) {
  const [title,    setTitle]    = useState(note?.title    ?? '')
  const [content,  setContent]  = useState(note?.content  ?? '')
  const [category, setCategory] = useState<string>(note?.category ?? 'Allgemein')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleSave() {
    if (!title.trim() && !content.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave({ title: title.trim(), content, category })
      onClose()
    } catch {
      setError('Speichern fehlgeschlagen')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-sm font-medium text-gray-300">
            {note?.id ? 'Notiz bearbeiten' : 'Neue Notiz'}
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 p-5">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titel…"
            className="bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Notiz schreiben…"
            rows={7}
            className="bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />

          {/* Category picker */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium
                  ${category === cat
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function NotesWidget() {
  const [notes,   setNotes]   = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [catFilter, setCatFilter] = useState<Category | 'Alle'>('Alle')
  const [modal,   setModal]   = useState<Partial<Note> | null>(null)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.notes.list()
      .then(setNotes)
      .catch(() => setError('Backend nicht erreichbar'))
      .finally(() => setLoading(false))
  }, [])

  // ── Search + filter (client-side) ─────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return notes.filter(n => {
      const matchCat = catFilter === 'Alle' || n.category === catFilter
      const matchQ   = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [notes, search, catFilter])

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  async function handleSave(data: Pick<Note, 'title' | 'content' | 'category'>) {
    if (modal?.id) {
      const updated = await api.notes.update(modal.id, data)
      setNotes(ns => ns.map(n => n.id === updated.id ? updated : n))
    } else {
      const created = await api.notes.create(data)
      setNotes(ns => [created, ...ns])
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    setNotes(ns => ns.filter(n => n.id !== id))
    try { await api.notes.delete(id) } catch { setError('Löschen fehlgeschlagen') }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {modal !== null && (
        <NoteModal note={modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-indigo-400" strokeWidth={2} />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notizen</span>
          </div>
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <Plus size={14} /> Neu
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Notizen durchsuchen…"
              className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {(['Alle', ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat as Category | 'Alle')}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                catFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {error && (
          <p className="mx-4 mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Cards */}
        <div className="overflow-y-auto px-4 pb-4 max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-gray-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <FileText size={28} className="text-gray-700" strokeWidth={1.25} />
              <p className="text-gray-500 text-sm">
                {search ? `Keine Ergebnisse für „${search}"` : 'Noch keine Notizen.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filtered.map(note => (
                <div
                  key={note.id}
                  onClick={() => setModal(note)}
                  className="group relative bg-gray-750 hover:bg-gray-700/60 border border-gray-700 hover:border-gray-600 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2"
                >
                  {/* Delete */}
                  <button
                    onClick={e => handleDelete(note.id, e)}
                    className="absolute top-3 right-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Category badge */}
                  <span className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(note.category)}`}>
                    {note.category}
                  </span>

                  {/* Title */}
                  {note.title && (
                    <p className="text-sm font-semibold text-white leading-snug pr-5 line-clamp-1">
                      {note.title}
                    </p>
                  )}

                  {/* Content preview */}
                  {note.content && (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                      {note.content}
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-600 mt-auto pt-1">{relativeDate(note.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
