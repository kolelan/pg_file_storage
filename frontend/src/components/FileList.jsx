import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ApiService from '../services/api'

const FileList = ({ isAdmin = false }) => {
  const { token } = useAuth()
  const [files, setFiles] = useState([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Состояние фильтров и сортировки
  const [filters, setFilters] = useState({
    search: '',
    user_filter: '',
    size_from: '',
    size_to: '',
    date_from: '',
    date_to: '',
    sort_by: 'created_at',
    sort_order: 'DESC',
    page: 1,
    limit: 10
  })

  const [showFilters, setShowFilters] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState(null)

  useEffect(() => {
    // Очищаем предыдущий таймер
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Устанавливаем новый таймер с задержкой 500ms
    const timer = setTimeout(() => {
      loadFiles()
    }, 500)

    setDebounceTimer(timer)

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [filters, isAdmin])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getFiles(token, isAdmin, filters)
      if (response.success) {
        setFiles(response.data?.files || [])
        setPagination(response.data?.pagination || pagination)
      } else {
        setError(response.message || 'Ошибка загрузки файлов')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Сбрасываем на первую страницу при изменении фильтров
    }))
  }

  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'ASC' ? 'DESC' : 'ASC',
      page: 1
    }))
    // Немедленная загрузка для сортировки
    setTimeout(() => loadFiles(), 100)
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
    // Немедленная загрузка для смены страницы
    setTimeout(() => loadFiles(), 100)
  }

  const handleLimitChange = (newLimit) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }))
    // Немедленная загрузка для смены количества элементов
    setTimeout(() => loadFiles(), 100)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      user_filter: '',
      size_from: '',
      size_to: '',
      date_from: '',
      date_to: '',
      sort_by: 'created_at',
      sort_order: 'DESC',
      page: 1,
      limit: 10
    })
  }

  const handleDownload = async (file) => {
    try {
      const response = await ApiService.downloadFile(file.id, token)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.original_name
        document.body.appendChild(link)
        link.click()
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
        loadFiles()
      } else {
        setError(result.message || 'Ошибка удаления файла')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  const getSortIcon = (column) => {
    if (filters.sort_by !== column) return '↕️'
    return filters.sort_order === 'ASC' ? '↑' : '↓'
  }

  const renderPagination = () => {
    const pages = []
    const startPage = Math.max(1, pagination.current_page - 2)
    const endPage = Math.min(pagination.total_pages, pagination.current_page + 2)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={i === pagination.current_page ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ margin: '0 2px' }}
        >
          {i}
        </button>
      )
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() => handlePageChange(pagination.current_page - 1)}
          disabled={pagination.current_page <= 1}
          className="btn btn-secondary"
        >
          ←
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(pagination.current_page + 1)}
          disabled={pagination.current_page >= pagination.total_pages}
          className="btn btn-secondary"
        >
          →
        </button>
        <span style={{ marginLeft: '20px', color: '#666' }}>
          Показано {((pagination.current_page - 1) * pagination.per_page) + 1}-{Math.min(pagination.current_page * pagination.per_page, pagination.total)} из {pagination.total}
        </span>
      </div>
    )
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

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>{isAdmin ? 'Все файлы' : 'Мои файлы'}</h3>
        <div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
            style={{ marginRight: '10px' }}
          >
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>
          <select
            value={filters.limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="btn btn-secondary"
            style={{ marginRight: '10px' }}
          >
            <option value={5}>5 на странице</option>
            <option value={10}>10 на странице</option>
            <option value={20}>20 на странице</option>
            <option value={50}>50 на странице</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Поиск:</label>
              <input
                type="text"
                placeholder="Поиск по имени файла..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            
            {isAdmin && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Пользователь:</label>
                <input
                  type="text"
                  placeholder="Фильтр по пользователю..."
                  value={filters.user_filter}
                  onChange={(e) => handleFilterChange('user_filter', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Размер от (байт):</label>
              <input
                type="number"
                placeholder="Мин. размер"
                value={filters.size_from}
                onChange={(e) => handleFilterChange('size_from', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Размер до (байт):</label>
              <input
                type="number"
                placeholder="Макс. размер"
                value={filters.size_to}
                onChange={(e) => handleFilterChange('size_to', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Дата от:</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Дата до:</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '15px', textAlign: 'right' }}>
            <button onClick={clearFilters} className="btn btn-secondary" style={{ marginRight: '10px' }}>
              Очистить фильтры
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th 
                style={{ padding: '10px', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleSort('original_name')}
              >
                Имя файла {getSortIcon('original_name')}
              </th>
              <th 
                style={{ padding: '10px', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleSort('file_size')}
              >
                Размер {getSortIcon('file_size')}
              </th>
              <th 
                style={{ padding: '10px', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleSort('created_at')}
              >
                Дата загрузки {getSortIcon('created_at')}
              </th>
              {isAdmin && (
                <th 
                  style={{ padding: '10px', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => handleSort('username')}
                >
                  Пользователь {getSortIcon('username')}
                </th>
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
                  <td style={{ padding: '10px' }}>{file.username || 'Неизвестно'}</td>
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

      {files.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Файлы не найдены
        </div>
      )}

      {pagination.total_pages > 1 && renderPagination()}
    </div>
  )
}

export default FileList