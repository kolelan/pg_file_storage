import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ApiService from '../services/api'

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const { token } = useAuth()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setError('')
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setError('Выберите файл для загрузки')
      return
    }

    setUploading(true)
    setError('')

    try {
      const response = await ApiService.uploadFile(file, token)
      if (response.success) {
        setFile(null)
        // Сбрасываем input
        e.target.reset()
        if (onUploadSuccess) {
          onUploadSuccess(response.file)
        }
      } else {
        setError(response.message || 'Ошибка загрузки файла')
      }
    } catch (error) {
      setError('Ошибка соединения с сервером')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card">
      <h3>Загрузить файл</h3>
      <form onSubmit={handleUpload}>
        <div className="form-group">
          <input
            type="file"
            onChange={handleFileChange}
            className="form-input"
            disabled={uploading}
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
          disabled={uploading || !file}
        >
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>
      </form>
    </div>
  )
}

export default FileUpload
