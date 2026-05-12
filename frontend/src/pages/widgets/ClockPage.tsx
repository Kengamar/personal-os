import ClockWidget from '../../components/widgets/ClockWidget'

export default function ClockPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Uhr & Datum</h1>
      <ClockWidget />
    </div>
  )
}
