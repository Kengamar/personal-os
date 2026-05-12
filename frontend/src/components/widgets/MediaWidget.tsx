import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/api'
import { Plus, Trash2, Edit2, X, Film, Star, Search } from 'lucide-react'

interface Media {
  id: number
  title: string
  type: 'movie' | 'series' | 'book'
  rating: number | null
  status: 'want-to-watch' | 'watching' | 'watched'
  notes: string
  created_at: string
}

type MediaType   = Media['type']
type MediaStatus = Media['status']

const TYPE_LABELS: Record<MediaType, string>     = { movie: 'Film', series: 'Serie', book: 'Buch' }
const STATUS_LABELS: Record<MediaStatus, string> = { 'want-to-watch': 'Merkliste', watching: 'Läuft', watched: 'Gesehen' }
const STATUS_COLORS: Record<MediaStatus, string> = {
  'want-to-watch': 'bg-gray-600 text-gray-300',
  watching:        'bg-blue-600 text-white',
  watched:         'bg-green-700 text-green-200',
}
const TYPE_ICONS: Record<MediaType, string> = { movie: '🎬', series: '📺', book: '📚' }

interface StarRatingProps { value: number | null; onChange?: (v: number | null) => void; readonly?: boolean }

function StarRating({ value, onChange, readonly }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button
          key={n} type="button"
          onClick={() => onChange?.(value === n ? null : n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            className={`w-4 h-4 ${n <= (hover || value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
          />
        </button>
      ))}
    </div>
  )
}

interface ModalProps {
  item?: Media
  onSave: (p: Omit<Media, 'id' | 'created_at'>) => Promise<void>
  onClose: () => void
}

function MediaModal({ item, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState({
    title:  item?.title  ?? '',
    type:   item?.type   ?? 'movie' as MediaType,
    status: item?.status ?? 'want-to-watch' as MediaStatus,
    rating: item?.rating ?? null as number | null,
    notes:  item?.notes  ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{item ? 'Bearbeiten' : 'Neuer Eintrag'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text" placeholder="Titel *" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            required autoFocus
          />
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TYPE_LABELS) as MediaType[]).map(t => (
              <button
                key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${form.type === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {TYPE_ICONS[t]} {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(STATUS_LABELS) as MediaStatus[]).map(s => (
              <button
                key={s} type="button"
                onClick={() => setForm(f => ({ ...f, status: s }))}
                className={`py-2 rounded-lg text-xs font-medium transition-colors ${form.status === s ? STATUS_COLORS[s] : 'bg-gray-700 text-gray-400'}`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Bewertung</label>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <textarea
            placeholder="Notizen" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {saving ? 'Speichere…' : 'Speichern'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg text-sm">
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MediaWidget() {
  const [items, setItems]       = useState<Media[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [typeFilter, setTypeFilter]     = useState<MediaType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<MediaStatus | 'all'>('all')
  const [query, setQuery]       = useState('')
  const [modal, setModal]       = useState<{ open: boolean; item?: Media }>({ open: false })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params: { type?: string; status?: string } = {}
      if (typeFilter !== 'all')   params.type   = typeFilter
      if (statusFilter !== 'all') params.status = statusFilter
      setItems(await api.media.list(params))
    } catch { setError('Fehler beim Laden') }
    finally { setLoading(false) }
  }, [typeFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(m => m.title.toLowerCase().includes(query.toLowerCase()))

  async function save(p: Omit<Media, 'id' | 'created_at'>) {
    if (modal.item) {
      const updated = await api.media.update(modal.item.id, p)
      setItems(prev => prev.map(m => m.id === updated.id ? updated : m))
    } else {
      const created = await api.media.create(p)
      setItems(prev => [created, ...prev])
    }
    setModal({ open: false })
  }

  async function del(id: number) {
    setItems(prev => prev.filter(m => m.id !== id))
    try { await api.media.delete(id) }
    catch { load() }
  }

  async function cycleStatus(item: Media) {
    const order: MediaStatus[] = ['want-to-watch', 'watching', 'watched']
    const next = order[(order.indexOf(item.status) + 1) % order.length]
    const updated = await api.media.update(item.id, { status: next })
    setItems(prev => prev.map(m => m.id === updated.id ? updated : m))
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-400" /> Medien
          <span className="text-sm text-gray-400 font-normal">({items.length})</span>
        </h2>
        <button
          onClick={() => setModal({ open: true })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Neu
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {(['all', ...Object.keys(TYPE_LABELS)] as (MediaType | 'all')[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            >
              {t === 'all' ? 'Alle' : `${TYPE_ICONS[t]} ${TYPE_LABELS[t]}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', ...Object.keys(STATUS_LABELS)] as (MediaStatus | 'all')[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            >
              {s === 'all' ? 'Alle Status' : STATUS_LABELS[s as MediaStatus]}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Titel suchen…" value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          {query ? 'Keine Treffer' : 'Noch keine Einträge'}
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.map(m => (
            <div key={m.id} className="flex items-center gap-3 bg-gray-700 rounded-xl px-3 py-2.5 group">
              <span className="text-xl flex-shrink-0">{TYPE_ICONS[m.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{m.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating value={m.rating} readonly />
                  {m.notes && <span className="text-gray-500 text-xs truncate">{m.notes}</span>}
                </div>
              </div>
              <button
                onClick={() => cycleStatus(m)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 cursor-pointer transition-all ${STATUS_COLORS[m.status]}`}
                title="Status wechseln"
              >
                {STATUS_LABELS[m.status]}
              </button>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setModal({ open: true, item: m })} className="text-gray-400 hover:text-blue-400 p-1">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => del(m.id)} className="text-gray-400 hover:text-red-400 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <MediaModal
          item={modal.item}
          onSave={save}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
