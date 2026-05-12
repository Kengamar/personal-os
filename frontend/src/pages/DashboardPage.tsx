import { useState, useRef } from 'react'
import { GripVertical } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import type { WidgetSize, WidgetId } from '../context/SettingsContext'
import ClockWidget    from '../components/widgets/ClockWidget'
import WeatherWidget  from '../components/widgets/WeatherWidget'
import TodoWidget     from '../components/widgets/TodoWidget'
import NotesWidget    from '../components/widgets/NotesWidget'
import FinanceWidget  from '../components/widgets/FinanceWidget'
import ContactsWidget from '../components/widgets/ContactsWidget'
import MediaWidget    from '../components/widgets/MediaWidget'

const WIDGET_COMPONENTS: Record<WidgetId, React.ComponentType> = {
  clock:    ClockWidget,
  weather:  WeatherWidget,
  todo:     TodoWidget,
  notes:    NotesWidget,
  finance:  FinanceWidget,
  contacts: ContactsWidget,
  media:    MediaWidget,
}

const SIZE_COLS: Record<WidgetSize, string> = {
  sm: 'col-span-6 sm:col-span-3 xl:col-span-2',
  md: 'col-span-6 xl:col-span-3',
  lg: 'col-span-6',
}

export default function DashboardPage() {
  const { widgets, reorderWidgets } = useSettings()
  const dragIndex  = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  function onDragStart(i: number) {
    dragIndex.current = i
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    setOverIndex(i)
  }

  function onDrop(i: number) {
    if (dragIndex.current !== null && dragIndex.current !== i) {
      reorderWidgets(dragIndex.current, i)
    }
    dragIndex.current = null
    setOverIndex(null)
  }

  function onDragEnd() {
    dragIndex.current = null
    setOverIndex(null)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Widgets per Drag & Drop verschieben · Größen in den Einstellungen ändern</p>
      </div>

      <div className="grid grid-cols-6 gap-4 items-start">
        {widgets.map((w, i) => {
          const Component = WIDGET_COMPONENTS[w.id]
          const isOver = overIndex === i && dragIndex.current !== i
          return (
            <div
              key={w.id}
              className={`${SIZE_COLS[w.size]} relative group transition-all duration-150 ${isOver ? 'widget-drag-over' : ''}`}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={() => onDrop(i)}
              onDragEnd={onDragEnd}
            >
              {/* Drag handle */}
              <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 touch-none">
                <GripVertical size={14} />
              </div>
              <Component />
            </div>
          )
        })}
      </div>
    </div>
  )
}
