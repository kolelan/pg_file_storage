import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const LoginForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(formData.username, formData.password)
    
    if (result.success) {
      if (onSuccess) {
        onSuccess()
      }
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="username" className="form-label">
          Имя пользователя
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="form-input"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Пароль
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="form-input"
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={loading}
        style={{ width: '100%' }}
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}

export default LoginForm
