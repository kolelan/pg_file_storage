import React, { useState } from 'react'
import FileList from '../components/FileList'

const AdminPage = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Админ панель</h1>
          <p style={{ color: '#666' }}>
            Управление всеми файлами в системе
          </p>
        </div>
        <button onClick={handleRefresh} className="btn btn-secondary">
          Обновить
        </button>
      </div>

      <FileList isAdmin={true} key={refreshKey} />
    </div>
  )
}

export default AdminPage
