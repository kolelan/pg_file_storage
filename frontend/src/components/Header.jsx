import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      padding: '15px 0',
      marginBottom: '20px'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{
          textDecoration: 'none',
          color: '#333',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          PG File Storage
        </Link>

        {user ? (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333' }}>
              Мои файлы
            </Link>
            {isAdmin() && (
              <Link to="/admin" style={{ textDecoration: 'none', color: '#333' }}>
                Админ панель
              </Link>
            )}
            <span style={{ color: '#666' }}>
              Привет, {user.username}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Выйти
            </button>
          </nav>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Войти
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header
