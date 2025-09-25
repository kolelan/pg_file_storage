import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ApiService from '../services/api'

const FileList = ({ isAdmin = false }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getFiles(token, isAdmin)
      if (response.success) {
        setFiles(response.data?.files || [])
      } else {
        setError(response.message || 'Ошибка загрузки файлов')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [isAdmin])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU')
  }

  const handleDownload = async (file) => {
    try {
      const response = await ApiService.downloadFile(file.id, token)

      if (response.ok) {
        // Получаем blob данных
        const blob = await response.blob()
        
        // Создаем URL для скачивания
        const url = window.URL.createObjectURL(blob)
        
        // Создаем временную ссылку для скачивания
        const link = document.createElement('a')
        link.href = url
        link.download = file.original_name
        document.body.appendChild(link)
        link.click()
        
        // Очищаем
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        const error = await response.json()
        setError(error.message || 'Ошибка скачивания файла')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    }
  }

  const handleDelete = async (fileId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      return
    }

    try {
      const result = await ApiService.deleteFile(fileId, token)
      
      if (result.success) {
        // После удаления перезагружаем список
        loadFiles()
      } else {
        setError(result.message || 'Ошибка удаления файла')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    }
  }

  if (loading) {
    return <div className="loading">Загрузка файлов...</div>
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
        <button onClick={loadFiles} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
          Повторить
        </button>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="card">
        <p>Файлы не найдены</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3>{isAdmin ? 'Все файлы' : 'Мои файлы'}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Имя файла</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Размер</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Дата загрузки</th>
              {isAdmin && (
                <th style={{ padding: '10px', textAlign: 'left' }}>Пользователь</th>
              )}
              <th style={{ padding: '10px', textAlign: 'left' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{file.original_name}</td>
                <td style={{ padding: '10px' }}>{formatFileSize(file.file_size)}</td>
                <td style={{ padding: '10px' }}>{formatDate(file.created_at)}</td>
                {isAdmin && (
                  <td style={{ padding: '10px' }}>{file.user?.username || 'Неизвестно'}</td>
                )}
                <td style={{ padding: '10px' }}>
                  <button 
                    onClick={() => handleDownload(file)}
                    className="btn btn-primary"
                    style={{ marginRight: '5px' }}
                  >
                    Скачать
                  </button>
                  <button 
                    onClick={() => handleDelete(file.id)}
                    className="btn btn-danger"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FileList
