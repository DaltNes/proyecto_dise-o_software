import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { conversionHistory } from '../lib/database';
import './ConversionHistory.css';

const ConversionHistory = ({ onClose }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadHistoryAndStats();
    }
  }, [user]);

  const loadHistoryAndStats = async () => {
    setLoading(true);
    setError('');

    try {
      // Cargar historial y estadísticas en paralelo
      const [historyResult, statsResult] = await Promise.all([
        conversionHistory.getByUser(user.id),
        conversionHistory.getStats(user.id)
      ]);

      if (historyResult.error) {
        throw new Error('Error al cargar historial: ' + historyResult.error.message);
      }

      if (statsResult.error) {
        throw new Error('Error al cargar estadísticas: ' + statsResult.error.message);
      }

      setHistory(historyResult.data || []);
      setStats(statsResult.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversionId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      return;
    }

    try {
      const result = await conversionHistory.delete(conversionId, user.id);
      if (result.error) {
        throw new Error('Error al eliminar: ' + result.error.message);
      }

      // Actualizar la lista
      setHistory(prev => prev.filter(item => item.id !== conversionId));
      
      // Recargar estadísticas
      const statsResult = await conversionHistory.getStats(user.id);
      if (!statsResult.error) {
        setStats(statsResult.data);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { text: 'Completado', class: 'status-completed' },
      pending: { text: 'Pendiente', class: 'status-pending' },
      processing: { text: 'Procesando', class: 'status-processing' },
      failed: { text: 'Fallido', class: 'status-failed' }
    };
    
    const badge = badges[status] || badges.pending;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="history-overlay">
        <div className="history-modal">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando historial...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="history-modal">
        <div className="history-header">
          <h2>📊 Historial de Conversiones</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadHistoryAndStats} className="retry-btn">Reintentar</button>
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="stats-section">
            <h3>📈 Estadísticas</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{stats.totalConversions}</span>
                <span className="stat-label">Total Conversiones</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.successRate}%</span>
                <span className="stat-label">Tasa de Éxito</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{formatFileSize(stats.totalFileSize)}</span>
                <span className="stat-label">Datos Procesados</span>
              </div>
            </div>
            
            {/* Formatos más utilizados */}
            {Object.keys(stats.formatStats).length > 0 && (
              <div className="format-stats">
                <h4>Conversiones más frecuentes:</h4>
                <div className="format-list">
                  {Object.entries(stats.formatStats)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([format, count]) => (
                      <span key={format} className="format-item">
                        {format}: {count}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista del historial */}
        <div className="history-content">
          <h3>📋 Historial Reciente</h3>
          {history.length === 0 ? (
            <div className="empty-state">
              <p>🔄 Aún no has realizado conversiones</p>
              <p>¡Comienza convirtiendo un archivo para ver tu historial aquí!</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="item-header">
                    <div className="file-info">
                      <span className="filename">{item.original_filename}</span>
                      <span className="conversion-arrow">
                        {item.original_format.toUpperCase()} → {item.converted_format.toUpperCase()}
                      </span>
                    </div>
                    <div className="item-actions">
                      {getStatusBadge(item.status)}
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="delete-btn"
                        title="Eliminar registro"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="item-details">
                    <span className="detail">📅 {formatDate(item.created_at)}</span>
                    <span className="detail">📏 {formatFileSize(item.file_size)}</span>
                    {item.download_url && item.status === 'completed' && (
                      <a 
                        href={item.download_url}
                        download
                        className="download-link"
                      >
                        💾 Descargar
                      </a>
                    )}
                  </div>

                  {item.error_message && (
                    <div className="error-details">
                      ⚠️ {item.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="history-footer">
          <button onClick={onClose} className="close-button">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversionHistory;