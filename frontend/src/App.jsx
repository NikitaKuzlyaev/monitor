// App.jsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedApp from './ProtectedApp'
import HomeDemo from './pages/HomeDemo'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedApp />} />
        <Route path="/monitor" element={<ProtectedApp />} />
        <Route path="/monitor/demo" element={<HomeDemo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
