import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { NewRun } from './pages/NewRun'
import { RunDetail } from './pages/RunDetail'
import { ExecutionDetail } from './pages/ExecutionDetail'
import { Reports } from './pages/Reports'
import { Targets } from './pages/Targets'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="targets" element={<Targets />} />
          <Route path="runs/:id" element={<RunDetail />} />
          <Route path="executions/:id" element={<ExecutionDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
