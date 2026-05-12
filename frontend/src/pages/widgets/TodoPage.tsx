import TodoWidget from '../../components/widgets/TodoWidget'

export default function TodoPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">ToDo</h1>
      <TodoWidget />
    </div>
  )
}
