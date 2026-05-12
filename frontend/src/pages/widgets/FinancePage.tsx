import FinanceWidget      from '../../components/widgets/FinanceWidget'
import FinanceStatsWidget from '../../components/widgets/FinanceStatsWidget'

export default function FinancePage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Finanzen</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <FinanceWidget />
        <FinanceStatsWidget />
      </div>
    </div>
  )
}
