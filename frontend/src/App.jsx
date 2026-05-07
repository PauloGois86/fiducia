import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import NovaEncomenda from './pages/NovaEncomenda'
import Encomendas from './pages/Encomendas'
import DetalheEncomenda from './pages/DetalheEncomenda'

function PrivateRoute({ children }) {
  const { loja } = useAuth()
  return loja ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><NovaEncomenda /></PrivateRoute>} />
      <Route path="/encomendas" element={<PrivateRoute><Encomendas /></PrivateRoute>} />
      <Route path="/encomendas/:id" element={<PrivateRoute><DetalheEncomenda /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}