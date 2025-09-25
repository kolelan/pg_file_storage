import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ApiService from '../services/api'

const UserManagement = () => {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getAllUsers(token)
      if (response.success) {
        setUsers(response.data?.users || [])
      } else {
        setError(response.message || 'Ошибка загрузки пользователей')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const result = await ApiService.updateUserRole(userId, newRole, token)
      
      if (result.success) {
        // Обновляем локальное состояние
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
      } else {
        setError(result.message || 'Ошибка изменения роли')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя "${username}"?`)) {
      return
    }

    try {
      const result = await ApiService.deleteUser(userId, token)
      
      if (result.success) {
        // Удаляем пользователя из локального состояния
        setUsers(users.filter(user => user.id !== userId))
      } else {
        setError(result.message || 'Ошибка удаления пользователя')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadgeStyle = (role) => {
    return {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: role === 'admin' ? '#dc3545' : '#28a745',
      color: 'white'
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка пользователей...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Управление пользователями</h2>
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Имя пользователя</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Роль</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Дата регистрации</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '15px' }}>{user.id}</td>
                <td style={{ padding: '15px', fontWeight: '500' }}>{user.username}</td>
                <td style={{ padding: '15px' }}>{user.email}</td>
                <td style={{ padding: '15px' }}>
                  <span style={getRoleBadgeStyle(user.role)}>
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </span>
                </td>
                <td style={{ padding: '15px', color: '#666' }}>{formatDate(user.created_at)}</td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{
                        padding: '5px 10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                    </select>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666' 
        }}>
          Пользователи не найдены
        </div>
      )}
    </div>
  )
}

export default UserManagement
