import { useState, useEffect } from 'react'
import { api } from '../../api/api'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Transaction {
  id: number
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function getLastMonths(n: number): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(d.toISOString().slice(0, 7))
  }
  return result
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1)
  return date.toLocaleDateString('de-DE', { month: 'short' })
}

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────

const PIE_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#8b5cf6','#14b8a6',
]

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  if (endDeg - startDeg >= 360) endDeg = startDeg + 359.99
  const s = polarToCartesian(cx, cy, r, startDeg)
  const e = polarToCartesian(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`
}

interface PieChartProps { transactions: Transaction[] }

function PieChart({ transactions }: PieChartProps) {
  const expenses = transactions.filter(t => t.type === 'expense')
  const byCategory: Record<string, number> = {}
  expenses.forEach(t => { byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount })

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)

  if (!entries.length) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        Keine Ausgaben diesen Monat
      </div>
    )
  }

  const CX = 80, CY = 80, R = 68
  let angle = 0
  const slices = entries.map(([cat, val], i) => {
    const deg = (val / total) * 360
    const path = slicePath(CX, CY, R, angle, angle + deg)
    const mid = angle + deg / 2
    angle += deg
    return { cat, val, path, color: PIE_COLORS[i % PIE_COLORS.length], mid }
  })

  return (
    <div className="flex items-start gap-4">
      <svg width={160} height={160} viewBox="0 0 160 160" className="shrink-0">
        {slices.map(s => (
          <path key={s.cat} d={s.path} fill={s.color} stroke="#1f2937" strokeWidth={1.5}>
            <title>{s.cat}: {fmt(s.val)}</title>
          </path>
        ))}
        {/* Donut hole */}
        <circle cx={CX} cy={CY} r={34} fill="#1f2937" />
        <text x={CX} y={CY - 6} textAnchor="middle" fill="#9ca3af" fontSize={9}>Gesamt</text>
        <text x={CX} y={CY + 8} textAnchor="middle" fill="#f9fafb" fontSize={10} fontWeight="600">
          {fmt(total).replace('€', '')}€
        </text>
      </svg>

      {/* Legend */}
      <div className="flex-1 space-y-1.5 pt-1 min-w-0">
        {slices.map(s => (
          <div key={s.cat} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-gray-300 truncate flex-1">{s.cat}</span>
            <span className="text-gray-400 tabular-nums shrink-0">{Math.round((s.val / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

interface MonthData { month: string; income: number; expense: number }

interface LineChartProps { data: MonthData[] }

function LineChart({ data }: LineChartProps) {
  if (!data.length) return null

  const W = 300, H = 120, PAD_L = 45, PAD_B = 24, PAD_T = 12, PAD_R = 12
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const allVals = data.flatMap(d => [d.income, d.expense])
  const maxVal  = Math.max(...allVals, 1)

  function xPos(i: number) { return PAD_L + (i / (data.length - 1 || 1)) * innerW }
  function yPos(v: number) { return PAD_T + innerH - (v / maxVal) * innerH }

  function polyline(key: 'income' | 'expense') {
    return data.map((d, i) => `${xPos(i).toFixed(1)},${yPos(d[key]).toFixed(1)}`).join(' ')
  }

  function area(key: 'income' | 'expense') {
    const pts = data.map((d, i) => `${xPos(i).toFixed(1)},${yPos(d[key]).toFixed(1)}`).join(' ')
    const last = xPos(data.length - 1)
    const first = xPos(0)
    const base = yPos(0)
    return `${first},${base} ${pts} ${last},${base}`
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxVal * f, y: yPos(maxVal * f) }))

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {/* Grid lines */}
      {yTicks.map(t => (
        <g key={t.v}>
          <line x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y} stroke="#374151" strokeWidth={0.5} />
          <text x={PAD_L - 4} y={t.y + 3.5} textAnchor="end" fill="#6b7280" fontSize={7}>
            {t.v >= 1000 ? `${(t.v / 1000).toFixed(0)}k` : t.v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Area fills */}
      <polygon points={area('income')}  fill="#10b981" fillOpacity={0.08} />
      <polygon points={area('expense')} fill="#ef4444" fillOpacity={0.08} />

      {/* Lines */}
      <polyline points={polyline('income')}  fill="none" stroke="#10b981" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={polyline('expense')} fill="none" stroke="#ef4444" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots + tooltips */}
      {data.map((d, i) => (
        <g key={d.month}>
          <circle cx={xPos(i)} cy={yPos(d.income)}  r={2.5} fill="#10b981">
            <title>{monthLabel(d.month)} Einnahmen: {fmt(d.income)}</title>
          </circle>
          <circle cx={xPos(i)} cy={yPos(d.expense)} r={2.5} fill="#ef4444">
            <title>{monthLabel(d.month)} Ausgaben: {fmt(d.expense)}</title>
          </circle>
          <text x={xPos(i)} y={H - 4} textAnchor="middle" fill="#6b7280" fontSize={7.5}>
            {monthLabel(d.month)}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FinanceStatsWidget() {
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [currentTxs, setCurrentTxs]  = useState<Transaction[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  useEffect(() => {
    async function load() {
      try {
        const months = getLastMonths(6)
        const currentMonth = months[months.length - 1]

        const results = await Promise.all(months.map(m => api.transactions.list({ month: m })))

        const data: MonthData[] = months.map((month, i) => ({
          month,
          income:  results[i].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: results[i].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        }))

        setMonthlyData(data)
        setCurrentTxs(results[months.indexOf(currentMonth)])
      } catch {
        setError('Statistiken konnten nicht geladen werden')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalIncome  = monthlyData.reduce((s, d) => s + d.income, 0)
  const totalExpense = monthlyData.reduce((s, d) => s + d.expense, 0)
  const balance      = totalIncome - totalExpense

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-5 flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-2xl p-5 text-red-400 text-sm">{error}</div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-5 space-y-5">
      <h2 className="text-lg font-semibold text-white">Finanz-Statistik</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Einnahmen (6 Mo.)', value: totalIncome,  color: 'text-green-400', Icon: TrendingUp   },
          { label: 'Ausgaben (6 Mo.)',  value: totalExpense, color: 'text-red-400',   Icon: TrendingDown },
          { label: 'Saldo',             value: balance,      color: balance >= 0 ? 'text-blue-400' : 'text-orange-400', Icon: DollarSign },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-gray-700 rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
            <p className={`font-bold text-sm ${color}`}>{fmt(value)}</p>
            <p className="text-gray-400 text-xs mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300">Trend (6 Monate)</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> Einnahmen</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Ausgaben</span>
          </div>
        </div>
        <LineChart data={monthlyData} />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700" />

      {/* Pie chart */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Ausgaben nach Kategorie (aktueller Monat)</h3>
        <PieChart transactions={currentTxs} />
      </div>
    </div>
  )
}
