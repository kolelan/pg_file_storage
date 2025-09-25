import React, { useState } from 'react'
import FileUpload from '../components/FileUpload'
import FileList from '../components/FileList'

const DashboardPage = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadSuccess = (file) => {
    // Обновляем список файлов после успешной загрузки
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div>
      <h1>Мои файлы</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Загружайте и управляйте своими файлами
      </p>

      <FileUpload onUploadSuccess={handleUploadSuccess} />
      
      <FileList key={refreshKey} />
    </div>
  )
}

export default DashboardPage
