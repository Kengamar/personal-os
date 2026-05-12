import { useState, useEffect, useRef } from 'react'
import { api } from '../../api/api'
import { Plus, Search, Trash2, Edit2, X, User, Mail, Phone, BookOpen, Upload } from 'lucide-react'

interface Contact {
  id: number
  name: string
  email: string
  phone: string
  notes: string
  created_at: string
}

interface ModalProps {
  contact?: Contact
  onSave: (p: Pick<Contact, 'name' | 'email' | 'phone' | 'notes'>) => Promise<void>
  onClose: () => void
}

function ContactModal({ contact, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState({
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    notes: contact?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{contact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Name *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required autoFocus
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email" placeholder="E-Mail" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel" placeholder="Telefon" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <textarea
            placeholder="Notizen" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
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

function avatar(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['bg-blue-600','bg-purple-600','bg-green-600','bg-orange-600','bg-pink-600','bg-teal-600']
function avatarColor(name: string) {
  let n = 0
  for (const c of name) n += c.charCodeAt(0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

function parseCSV(text: string): Pick<Contact, 'name' | 'email' | 'phone' | 'notes'>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const idx = (k: string) => header.indexOf(k)
  return lines.slice(1).map(line => {
    const cols = line.match(/("(?:[^"]|"")*"|[^,]*)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) ?? []
    return {
      name:  cols[idx('name')]  ?? '',
      email: cols[idx('email')] ?? '',
      phone: cols[idx('phone')] ?? cols[idx('telefon')] ?? '',
      notes: cols[idx('notes')] ?? cols[idx('notizen')] ?? '',
    }
  }).filter(c => c.name.trim())
}

export default function ContactsWidget() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [query, setQuery]       = useState('')
  const [modal, setModal]       = useState<{ open: boolean; contact?: Contact }>({ open: false })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.contacts.list()
      .then(setContacts)
      .catch(() => setError('Fehler beim Laden'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = contacts.filter(c =>
    `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(query.toLowerCase())
  )

  async function save(p: Pick<Contact, 'name' | 'email' | 'phone' | 'notes'>) {
    if (modal.contact) {
      const updated = await api.contacts.update(modal.contact.id, p)
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
    } else {
      const created = await api.contacts.create(p)
      setContacts(prev => [created, ...prev])
    }
    setModal({ open: false })
  }

  async function del(id: number) {
    setContacts(prev => prev.filter(c => c.id !== id))
    try { await api.contacts.delete(id) }
    catch { api.contacts.list().then(setContacts) }
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = parseCSV(text)
    for (const row of rows) {
      try {
        const c = await api.contacts.create(row)
        setContacts(prev => [c, ...prev])
      } catch { /* skip invalid rows */ }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" /> Kontakte
          <span className="text-sm text-gray-400 font-normal">({contacts.length})</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-1.5 text-gray-400 hover:text-white" title="CSV importieren">
            <Upload className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
          <button
            onClick={() => setModal({ open: true, contact: undefined })}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Neu
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Kontakte suchen…" value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Contact list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          {query ? 'Keine Treffer' : 'Noch keine Kontakte'}
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-gray-700 rounded-xl px-3 py-2.5 group">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(c.name)}`}>
                {avatar(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{c.name}</p>
                <div className="flex gap-3 text-xs text-gray-400">
                  {c.email && <span className="truncate">{c.email}</span>}
                  {c.phone && <span>{c.phone}</span>}
                </div>
                {c.notes && <p className="text-gray-500 text-xs truncate">{c.notes}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setModal({ open: true, contact: c })} className="text-gray-400 hover:text-blue-400 p-1">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => del(c.id)} className="text-gray-400 hover:text-red-400 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <ContactModal
          contact={modal.contact}
          onSave={save}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
