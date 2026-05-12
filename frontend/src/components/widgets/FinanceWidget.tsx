import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/api'
import { Plus, Trash2, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Transaction {
  id: number
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  created_at: string
}

const EXPENSE_CATEGORIES = ['Wohnen', 'Lebensmittel', 'Transport', 'Gesundheit', 'Freizeit', 'Kleidung', 'Bildung', 'Sonstiges']
const INCOME_CATEGORIES  = ['Gehalt', 'Freelance', 'Investitionen', 'Geschenk', 'Sonstiges']

function fmt(n: number) {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function exportCSV(rows: Transaction[]) {
  const header = 'Datum,Typ,Kategorie,Beschreibung,Betrag\n'
  const body = rows.map(r =>
    `${r.date},${r.type},${r.category},"${r.description.replace(/"/g, '""')}",${r.amount}`
  ).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `finanzen-${currentMonth()}.csv`
  a.click()
}

interface BarChartProps { transactions: Transaction[] }

function BarChart({ transactions }: BarChartProps) {
  const byCategory: Record<string, number> = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  })
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6)
  if (!entries.length) return <p className="text-gray-500 text-sm text-center py-4">Keine Ausgaben</p>
  const max = entries[0][1]
  return (
    <div className="space-y-2">
      {entries.map(([cat, val]) => (
        <div key={cat} className="flex items-center gap-2 text-sm">
          <span className="w-24 text-gray-400 truncate">{cat}</span>
          <div className="flex-1 bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${(val / max) * 100}%` }}
            />
          </div>
          <span className="w-20 text-right text-gray-300">{fmt(val)}</span>
        </div>
      ))}
    </div>
  )
}

export default function FinanceWidget() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [month, setMonth]               = useState(currentMonth())
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    date: new Date().toISOString().slice(0, 10),
  })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setTransactions(await api.transactions.list({ month }))
    } catch { setError('Fehler beim Laden') }
    finally { setLoading(false) }
  }, [month])

  useEffect(() => { load() }, [load])

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount))) return
    try {
      const t = await api.transactions.create({
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        description: form.description,
        date: form.date,
      })
      setTransactions(prev => [t, ...prev])
      setShowForm(false)
      setForm(f => ({ ...f, amount: '', description: '' }))
    } catch { setError('Fehler beim Speichern') }
  }

  async function del(id: number) {
    setTransactions(prev => prev.filter(t => t.id !== id))
    try { await api.transactions.delete(id) }
    catch { load() }
  }

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" /> Finanzen
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button onClick={() => exportCSV(transactions)} className="p-1.5 text-gray-400 hover:text-white" title="CSV Export">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(v => !v)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Neu
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Einnahmen', value: income,   color: 'text-green-400', Icon: TrendingUp },
          { label: 'Ausgaben',  value: expense,  color: 'text-red-400',   Icon: TrendingDown },
          { label: 'Bilanz',    value: balance,  color: balance >= 0 ? 'text-blue-400' : 'text-orange-400', Icon: DollarSign },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-gray-700 rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
            <p className={`font-bold ${color} text-sm`}>{fmt(value)}</p>
            <p className="text-gray-400 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* New transaction form */}
      {showForm && (
        <form onSubmit={submit} className="bg-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t, category: (t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] }))}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${form.type === t ? (t === 'income' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-600 text-gray-300'}`}
              >
                {t === 'expense' ? 'Ausgabe' : 'Einnahme'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number" step="0.01" placeholder="Betrag (€)" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="bg-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <input
              type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="bg-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <input
            type="text" placeholder="Beschreibung" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Speichern</button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg text-sm">Abbrechen</button>
          </div>
        </form>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Bar chart */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Ausgaben nach Kategorie</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BarChart transactions={transactions} />
        )}
      </div>

      {/* Transaction list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transactions.length === 0 && !loading && (
          <p className="text-gray-500 text-sm text-center py-2">Keine Transaktionen</p>
        )}
        {transactions.map(t => (
          <div key={t.id} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2 group">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{t.description || t.category}</p>
              <p className="text-gray-400 text-xs">{t.category} · {t.date}</p>
            </div>
            <span className={`font-medium text-sm flex-shrink-0 ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </span>
            <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 ml-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
