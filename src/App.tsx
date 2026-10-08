import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import DeckAnalysis from '@/pages/DeckAnalysis'
import Events from '@/pages/Events'
import EventDetail from '@/pages/EventDetail'
import Meta from '@/pages/Meta'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/deck" element={<DeckAnalysis />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/meta" element={<Meta />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
