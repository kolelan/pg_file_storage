import React, { useState } from 'react'
import FileList from '../components/FileList'
import UserManagement from '../components/UserManagement'

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('files')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#333',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0',
    marginRight: '5px',
    fontSize: '16px',
    fontWeight: isActive ? 'bold' : 'normal'
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Админ панель</h1>
          <p style={{ color: '#666' }}>
            Управление системой
          </p>
        </div>
        <button onClick={handleRefresh} className="btn btn-secondary">
          Обновить
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          style={tabStyle(activeTab === 'files')} 
          onClick={() => setActiveTab('files')}
        >
          Управление файлами
        </button>
        <button 
          style={tabStyle(activeTab === 'users')} 
          onClick={() => setActiveTab('users')}
        >
          Управление пользователями
        </button>
      </div>

      {activeTab === 'files' && <FileList isAdmin={true} key={refreshKey} />}
      {activeTab === 'users' && <UserManagement />}
    </div>
  )
}

export default AdminPage
