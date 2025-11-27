import React, { useState, useEffect } from 'react';
import './ApiStatus.css';

const ApiStatus = ({ onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking API status:', error);
      setStatus({
        server: 'Error',
        cloudconvert: { configured: false, error: 'No se pudo conectar al servidor' }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (configured) => {
    return configured ? '✅' : '❌';
  };

  const getStatusText = (configured) => {
    return configured ? 'Configurado' : 'No configurado';
  };

  if (loading) {
    return (
      <div className="api-status-overlay">
        <div className="api-status-modal">
          <div className="loading">
            <div className="spinner"></div>
            <p>Verificando estado de APIs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="api-status-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="api-status-modal">
        <div className="api-status-header">
          <h2> Estado de APIs Externas</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="api-status-content">
          {/* Estado del servidor */}
          <div className="status-section">
            <h3>🖥️ Servidor Backend</h3>
            <div className="status-item">
              <span className="status-indicator">
                {status?.server === 'Activo' ? '✅' : '❌'}
              </span>
              <span className="status-text">
                {status?.server || 'Desconocido'}
              </span>
            </div>
          </div>

          {/* Estado de CloudConvert */}
          <div className="status-section">
            <h3> CloudConvert API</h3>
            <div className="status-item">
              <span className="status-indicator">
                {getStatusIcon(status?.cloudconvert?.configured)}
              </span>
              <span className="status-text">
                {getStatusText(status?.cloudconvert?.configured)}
              </span>
            </div>

            {status?.cloudconvert?.configured ? (
              <div className="api-details">
                <div className="detail-item">
                  <strong>Email:</strong> {status.cloudconvert.email}
                </div>
                <div className="detail-item">
                  <strong>Plan:</strong> {status.cloudconvert.plan}
                </div>
                <div className="detail-item">
                  <strong>Créditos:</strong> {status.cloudconvert.credits}
                </div>
              </div>
            ) : (
              <div className="api-setup">
                <div className="error-message">
                  {status?.cloudconvert?.error}
                </div>
                
                <div className="setup-instructions">
                  <h4>🔧 ¿Cómo configurar CloudConvert?</h4>
                  <ol>
                    <li>Ve a <a href="https://cloudconvert.com" target="_blank" rel="noopener noreferrer">cloudconvert.com</a></li>
                    <li>Crea una cuenta gratuita</li>
                    <li>Ve a Dashboard → API → Keys</li>
                    <li>Copia tu API Key</li>
                    <li>Edita el archivo <code>backend/.env</code></li>
                    <li>Reemplaza <code>your-api-key-here</code> con tu API key real</li>
                    <li>Reinicia el servidor backend</li>
                  </ol>

                  <div className="benefits">
                    <h5> Beneficios con CloudConvert:</h5>
                    <ul>
                      <li> Conversiones REALES entre formatos</li>
                      <li> Soporte para ZIP, RAR, 7Z, ARC y más</li>
                      <li> 25 conversiones gratis por día</li>
                      <li> Procesamiento rápido y confiable</li>
                    </ul>
                  </div>

                  <div className="fallback-info">
                    <h5>🔧 Modo Actual:</h5>
                    <p>Sin CloudConvert, la aplicación funciona con conversiones simuladas (ZIP → ZIP con extensión .rar). Para conversiones reales, configura CloudConvert.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="current-mode">
            <h3> Modo de Funcionamiento</h3>
            <div className={`mode-badge ${status?.cloudconvert?.configured ? 'real' : 'simulated'}`}>
              {status?.cloudconvert?.configured ? (
                <>
                  <span className="mode-icon"></span>
                  <span>Conversiones Reales con CloudConvert</span>
                </>
              ) : (
                <>
                  <span className="mode-icon">🔧</span>
                  <span>Conversiones Simuladas (Local)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="api-status-footer">
          <button onClick={checkApiStatus} className="refresh-btn">
            🔄 Actualizar Estado
          </button>
          <button onClick={onClose} className="close-button">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiStatus;