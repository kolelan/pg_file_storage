import React, { createContext, useContext, useState, useEffect } from 'react'
import ApiService from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      // Проверяем валидность токена
      validateToken()
    } else {
      setLoading(false)
    }
  }, [])

  const validateToken = async () => {
    try {
      // Здесь можно добавить запрос для проверки токена
      // Пока просто устанавливаем пользователя
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setUser(userData)
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await ApiService.login(username, password)
      if (response.success && response.data && response.data.token) {
        setToken(response.data.token)
        setUser(response.data.user)
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return { success: true }
      } else {
        return { success: false, error: response.message || 'Ошибка входа' }
      }
    } catch (error) {
      return { success: false, error: 'Ошибка соединения с сервером' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await ApiService.register(userData)
      if (response.success) {
        return { success: true, message: 'Регистрация успешна' }
      } else {
        return { success: false, error: response.message || 'Ошибка регистрации' }
      }
    } catch (error) {
      return { success: false, error: 'Ошибка соединения с сервером' }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isAdmin = () => {
    return user && user.role === 'admin'
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAdmin,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
