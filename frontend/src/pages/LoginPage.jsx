import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Если пользователь уже авторизован, перенаправляем на dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSuccess = () => {
    // После успешного входа/регистрации перенаправляем пользователя
    if (isAdmin()) {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
        </div>

        {isLogin ? (
          <LoginForm onSuccess={handleSuccess} />
        ) : (
          <RegisterForm onSuccess={handleSuccess} />
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="btn btn-secondary"
            style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline' }}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
