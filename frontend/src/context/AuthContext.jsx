import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loja, setLoja] = useState(() => {
    const saved = localStorage.getItem('loja')
    return saved ? JSON.parse(saved) : null
  })

  const login = (token, lojaData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('loja', JSON.stringify(lojaData))
    setLoja(lojaData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('loja')
    setLoja(null)
  }

  return (
    <AuthContext.Provider value={{ loja, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)