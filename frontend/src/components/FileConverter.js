import React, { useState } from 'react'
import './FileConverter.css'

export default function FileConverter({ user }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [converting, setConverting] = useState(false)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
  }

  const handleConvert = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo')
      return
    }
    
    setConverting(true)
    // Aquí irá la lógica de conversión con API externa
    setTimeout(() => {
      setConverting(false)
      alert('¡Conversión completada! (Funcionalidad en desarrollo)')
    }, 2000)
  }

  return (
    <div className="file-converter">
      <div className="converter-container">
        <h2>🔄 Conversor de Archivos</h2>
        <p>Convierte tus archivos entre diferentes formatos</p>
        
        <div className="upload-area">
          <input
            type="file"
            onChange={handleFileSelect}
            className="file-input"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="upload-label">
            {selectedFile ? (
              <span>📁 {selectedFile.name}</span>
            ) : (
              <span>📁 Seleccionar archivo</span>
            )}
          </label>
        </div>

        {selectedFile && (
          <div className="file-info">
            <p><strong>Archivo:</strong> {selectedFile.name}</p>
            <p><strong>Tamaño:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
            <p><strong>Tipo:</strong> {selectedFile.type || 'Desconocido'}</p>
          </div>
        )}

        <div className="format-selection">
          <label>Convertir a:</label>
          <select>
            <option value="">Selecciona formato</option>
            <option value="pdf">PDF</option>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="zip">ZIP</option>
            <option value="rar">RAR</option>
          </select>
        </div>

        <button 
          onClick={handleConvert}
          disabled={!selectedFile || converting}
          className="convert-button"
        >
          {converting ? 'Convirtiendo...' : 'Convertir Archivo'}
        </button>

        <div className="supported-formats">
          <h3>Formatos Soportados</h3>
          <div className="format-grid">
            <div className="format-group">
              <h4>📁 Compresión</h4>
              <span>.zip .rar .7z .tar .gz</span>
            </div>
            <div className="format-group">
              <h4>📄 Documentos</h4>
              <span>.pdf .docx .txt .xlsx</span>
            </div>
            <div className="format-group">
              <h4>🖼️ Imágenes</h4>
              <span>.jpg .png .webp .svg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}