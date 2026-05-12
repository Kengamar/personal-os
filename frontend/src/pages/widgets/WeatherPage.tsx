import WeatherWidget from '../../components/widgets/WeatherWidget'

export default function WeatherPage() {
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Wetter</h1>
      <WeatherWidget />
    </div>
  )
}
