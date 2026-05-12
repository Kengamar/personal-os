import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ClockPage from './pages/widgets/ClockPage'
import WeatherPage from './pages/widgets/WeatherPage'
import TodoPage from './pages/widgets/TodoPage'
import NotesPage from './pages/widgets/NotesPage'
import FinancePage from './pages/widgets/FinancePage'
import ContactsPage from './pages/widgets/ContactsPage'
import MediaPage from './pages/widgets/MediaPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="clock"    element={<ClockPage />} />
        <Route path="weather"  element={<WeatherPage />} />
        <Route path="todo"     element={<TodoPage />} />
        <Route path="notes"    element={<NotesPage />} />
        <Route path="finance"  element={<FinancePage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="media"    element={<MediaPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
