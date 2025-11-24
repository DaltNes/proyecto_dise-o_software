import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import ConversionHistory from './components/ConversionHistory';
import ApiStatus from './components/ApiStatus';
import ResponsiveIndicator from './components/ResponsiveIndicator';
import { conversionHistory } from './lib/database';

// Configuración
const FORMATS = {
  zip: { name: 'ZIP', icon: '', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVxFTOq0hezd2vpI_N94YTvJywcKviQO-XSQ&s' },
  rar: { name: 'RAR', icon: '', img: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjGtYb3sh9taqKsA0M92MEop_biz3Axz5PHU59UDCzt6kUiPscgwApB_5l0o5g0oKPesLR1tCiX4U3det33vlI-BkMbvQO6cxlcH1u6v4E4tWj_S7QUTn73VRP9FWeWEgPuVDZR31dgl-8/s1600/winrar_icon_by_stumpy666davies-d5pve48.png' },
  arc: { name: 'ARC', icon: '', img: 'https://filenp.com/images/extension/256/arc.png' },
  '7z': { name: '7Z', icon: '', img: 'https://cdn-icons-png.freepik.com/512/29/29142.png' }
};

const DESCRIPTIONS = {
  zip: 'El formato ZIP es uno de los más populares para compresión de archivos.',
  rar: 'Los archivos RAR ofrecen una excelente compresión y características avanzadas.',
  arc: 'El formato ARC es un método de compresión más antiguo pero aún útil.',
  '7z': 'El formato 7Z ofrece una de las mejores tasas de compresión disponibles.'
}// Componentes compactos
const Alert = ({ message, type, onClose }) => (
  <div className={`custom-alert alert-${type}`}>
    <div className="alert-content">
      <span className="alert-message">{message}</span>
      <button className="alert-close" onClick={onClose}>X</button>
    </div>
  </div>
);

const FileSelector = ({ format, selectedFile, onFileSelect, isDragging, onDragOver, onDragLeave, onDrop }) => (
  <div className={`file-selector ${isDragging ? 'dragging' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
    <label htmlFor={`file-input-${format}`} className="file-selector-label">
      <span className="file-icon">{FORMATS[format].icon}</span>
      {selectedFile?.name || (isDragging ? 'Suelta el archivo aquí' : `Seleccionar archivo ${FORMATS[format].name} o arrástralo aquí`)}
      <span className="format-indicator">Solo archivos .{format}</span>
    </label>
    <input id={`file-input-${format}`} type="file" accept={`.${format}`} onChange={onFileSelect} style={{ display: 'none' }} />
    {selectedFile && (
      <div className="file-info">
        <small>Archivo: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</small>
      </div>
    )}
  </div>
);

const Accordion = ({ title, isExpanded, onToggle, children }) => (
  <div className="accordion-item">
    <div className="accordion-header" onClick={onToggle}>
      <h3>{title}</h3>
      <span className={`accordion-arrow ${isExpanded ? 'expanded' : ''}`}>v</span>
    </div>
    {isExpanded && <div className="accordion-content">{children}</div>}
  </div>
);

const FormatCard = ({ format, isVisible, onNavigate }) => {
  if (!isVisible) return null;
  return (
    <article className="article">
      <div className="article-content">
        <div className="article-left">
          <img src={FORMATS[format].img} width="80" height="80" alt={`Archivo ${FORMATS[format].name}`} />
          <h2>
            <button onClick={() => onNavigate(format)} className="format-link" 
              style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', color: 'inherit', textDecoration: 'underline'}}>
              FORMATO {FORMATS[format].name}
            </button>
          </h2>
          <p>Opciones de los archivos {FORMATS[format].name}</p>
        </div>
        <div className="article-center">
          <p>{DESCRIPTIONS[format]}</p>
        </div>
      </div>
    </article>
  );
};

const ConversionOptions = ({ fromFormat, selectedFile, isConverting, onConvert }) => (
  <div className="conversion-options">
    {Object.keys(FORMATS).filter(f => f !== fromFormat).map(target => (
      <div key={target} className="conversion-option" onClick={() => onConvert(`${fromFormat}-to-${target}`)}>
        <div className="option-info">
          <h4>A formato {FORMATS[target].name}</h4>
          <p>{DESCRIPTIONS[target].split('.')[0]}</p>
        </div>
        <button className={`option-btn ${!selectedFile ? 'disabled' : ''}`} disabled={!selectedFile || isConverting}>
          {isConverting ? 'Convirtiendo...' : 'Convertir'}
        </button>
      </div>
    ))}
  </div>
);

const ExtractionResult = ({ result }) => (
  <div className="operation-result">
    <div className="result-header"><h3>Extracción Completada</h3></div>
    <div className="result-content">
      <p>{result.message}</p>
      <p>Archivos extraídos: {result.extractedFiles?.length || 0}</p>
      {result.extractedFiles && (
        <div className="extracted-files">
          <h4>Archivos encontrados:</h4>
          <ul>
            {result.extractedFiles.slice(0, 10).map((file, i) => (
              <li key={i}>
                {typeof file === 'object' ? 
                  `${file.type === 'directory' ? '[DIR]' : '[FILE]'} ${file.name}${file.size ? ` (${(file.size / 1024).toFixed(1)} KB)` : ''}` 
                  : file}
              </li>
            ))}
            {result.extractedFiles.length > 10 && <li>... y {result.extractedFiles.length - 10} elementos más</li>}
          </ul>
        </div>
      )}
      {result.downloadUrl && (
        <a href={`http://localhost:3001${result.downloadUrl}`} download className="download-btn">
          Descargar archivos extraídos (ZIP)
        </a>
      )}
    </div>
  </div>
);

const FormatTools = ({ format, selectedFile, isConverting, onFileSelect, onConvert, onExtract, onBack, 
  expandedSections, onToggleAccordion, conversionResult, isDragging, onDragOver, onDragLeave, onDrop }) => (
  <div className="tools-section">
    <div className="section-header">
      <button onClick={onBack} className="back-btn">Volver al inicio</button>
      <h1>Herramientas para archivos {FORMATS[format].name}</h1>
    </div>
    
    <FileSelector {...{ format, selectedFile, onFileSelect, isDragging, onDragOver, onDragLeave, onDrop }} />
    
    <div className="accordion-container">
      <Accordion title={`Convertir ${FORMATS[format].name} a otros formatos`}
        isExpanded={expandedSections[`${format}-conversion`]}
        onToggle={() => onToggleAccordion(`${format}-conversion`)}>
        <ConversionOptions {...{ fromFormat: format, selectedFile, isConverting, onConvert }} />
        {conversionResult && !conversionResult.type && (
          <div className="conversion-result">
            <p>Conversión exitosa</p>
            <a href={`http://localhost:3001/download/${conversionResult.filename}`} download className="download-btn">
              Descargar archivo convertido
            </a>
          </div>
        )}
      </Accordion>

      <Accordion title={`Extraer contenido ${FORMATS[format].name}`}
        isExpanded={expandedSections[`${format}-extract`]}
        onToggle={() => onToggleAccordion(`${format}-extract`)}>
        <div className="extraction-tools">
          <div className="tool-description">
            <p>Extrae todos los archivos de tu {FORMATS[format].name} de forma segura</p>
          </div>
          <button className={`extract-btn ${!selectedFile ? 'disabled' : ''}`}
            disabled={!selectedFile || isConverting} onClick={onExtract}>
            {isConverting ? 'Extrayendo...' : 'Extraer archivos'}
          </button>
        </div>
      </Accordion>

      {format === 'zip' && (
        <Accordion title="Crear archivo ZIP" isExpanded={expandedSections['zip-create']}
          onToggle={() => onToggleAccordion('zip-create')}>
          <div className="creation-tools">
            <div className="tool-description"><p>Selecciona múltiples archivos para crear un nuevo ZIP</p></div>
            <input id="create-zip-input" type="file" multiple
              style={{ marginBottom: '15px', padding: '10px', border: '1px solid #333', borderRadius: '5px', background: '#1a1a1a', color: 'white' }} />
            <button id="create-zip-btn" className="create-btn">Crear ZIP</button>
          </div>
        </Accordion>
      )}

      {conversionResult?.type === 'extraction' && <ExtractionResult result={conversionResult} />}
    </div>
  </div>
);

// Hook personalizado para lógica de archivo
const useFileOperations = (user, showAlert) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);

  const validateFileFormat = (file, section) => {
    const ext = file.name.toLowerCase().split('.').pop();
    const validFormats = section === 'home' ? Object.keys(FORMATS) : [section];
    
    if (!validFormats.includes(ext)) {
      return {
        isValid: false,
        message: section === 'home' 
          ? `Formato no soportado: .${ext.toUpperCase()}\nFormatos válidos: ${Object.values(FORMATS).map(f => f.name).join(', ')}`
          : `Error: Estás en ${FORMATS[section].name}, archivo es .${ext.toUpperCase()}`
      };
    }
    return { isValid: true };
  };

  const handleFileSelect = (event, currentSection) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const validation = validateFileFormat(file, currentSection);
    if (validation.isValid) {
      setSelectedFile(file);
      setConversionResult(null);
    } else {
      showAlert(validation.message, 'error');
      event.target.value = '';
      setSelectedFile(null);
    }
  };

  const convertFile = async (conversionType) => {
    if (!selectedFile) return showAlert('Selecciona un archivo primero', 'warning');

    const [from, to] = conversionType.split('-to-');
    setIsConverting(true);
    setConversionResult(null);

    let conversionRecord = null;
    try {
      const recordResult = await conversionHistory.create({
        userId: user.id, originalFilename: selectedFile.name, originalFormat: from,
        convertedFormat: to, fileSize: selectedFile.size, status: 'processing'
      });
      if (!recordResult.error) conversionRecord = recordResult.data;
    } catch (err) {
      console.error('Database error:', err);
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('convertTo', to);
      formData.append('fromFormat', from);

      console.log('🚀 Iniciando conversión:', { from, to, filename: selectedFile.name });
      console.log('📡 Enviando a: http://localhost:3001/convert');

      const response = await fetch('http://localhost:3001/convert', { 
        method: 'POST', 
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('📊 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Resultado exitoso:', result);
      setConversionResult(result);
      showAlert('Conversión completada', 'success');

      if (conversionRecord) {
        await conversionHistory.updateStatus(conversionRecord.id, 'completed', 
          `http://localhost:3001/download/${result.filename}`);
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('🔍 Tipo de error:', error.name);
      console.error('💬 Mensaje:', error.message);
      
      let errorMessage = 'Error desconocido';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en puerto 3001';
      } else if (error.name === 'NetworkError' || error.message.includes('NetworkError')) {
        errorMessage = 'Error de red. Verifica tu conexión y que el servidor esté activo';
      } else {
        errorMessage = error.message;
      }
      
      showAlert(`Error al convertir: ${errorMessage}`, 'error');

      if (conversionRecord) await conversionHistory.updateStatus(conversionRecord.id, 'failed');
    } finally {
      setIsConverting(false);
    }
  };

  const extractFile = async () => {
    if (!selectedFile) return showAlert('Selecciona un archivo primero', 'warning');

    setIsConverting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('📦 Iniciando extracción:', selectedFile.name);
      console.log('📡 Enviando a: http://localhost:3001/extract');

      const response = await fetch('http://localhost:3001/extract', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('📊 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Extracción exitosa:', result);
      setConversionResult({ ...result, type: 'extraction' });
      showAlert('Extracción completada', 'success');
    } catch (error) {
      console.error('❌ Error extracción:', error);
      console.error('🔍 Tipo de error:', error.name);
      console.error('💬 Mensaje:', error.message);
      
      let errorMessage = 'Error desconocido';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en puerto 3001';
      } else if (error.name === 'NetworkError' || error.message.includes('NetworkError')) {
        errorMessage = 'Error de red. Verifica tu conexión y que el servidor esté activo';
      } else {
        errorMessage = error.message;
      }
      
      showAlert(`Error al extraer: ${errorMessage}`, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  return { selectedFile, setSelectedFile, isConverting, conversionResult, 
    handleFileSelect, convertFile, extractFile, validateFileFormat };
};

// Componente principal
const MainApp = () => {
  const { user, signOut } = useAuth();
  const [activeLink, setActiveLink] = useState(null);
  const [currentSection, setCurrentSection] = useState('home');
  const [showHistory, setShowHistory] = useState(false);
  const [showApiStatus, setShowApiStatus] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [alertMessage, setAlertMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showAlert = (message, type = 'error') => {
    setAlertMessage({ message, type });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const { selectedFile, setSelectedFile, isConverting, conversionResult, 
    handleFileSelect, convertFile, extractFile, validateFileFormat } = useFileOperations(user, showAlert);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    const validation = validateFileFormat(file, currentSection);
    if (validation.isValid) {
      setSelectedFile(file);
      showAlert(`Archivo: ${file.name}`, 'success');
    } else {
      showAlert(validation.message, 'error');
    }
  };

  return (
    <div id="container">
      {alertMessage && <Alert {...alertMessage} onClose={() => setAlertMessage(null)} />}

      <header>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={() => setShowApiStatus(true)} className="api-btn">API</button>
          <button onClick={() => setShowHistory(true)} className="history-btn">Historial</button>
          <button onClick={signOut} className="logout-btn">Logout</button>
        </div>
        <h1>FileConverter Pro</h1>
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <nav className={mobileMenuOpen ? 'mobile-open' : ''}>
        <h3>Herramientas online para convertir archivos ZIP, RAR, ARC, 7Z</h3>
        <ul>
          {Object.keys(FORMATS).map(format => (
            <li key={format}>
              <button className={`nav-link ${activeLink === format ? 'active' : ''}`}
                onClick={() => { 
                  setActiveLink(activeLink === format ? null : format); 
                  setCurrentSection('home');
                  setMobileMenuOpen(false); // Cerrar menú en móvil
                }}
                style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                {FORMATS[format].name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <section id="content">
        {currentSection === 'home' ? (
          Object.keys(FORMATS).map(format => (
            <FormatCard key={format} format={format}
              isVisible={!activeLink || activeLink === format}
              onNavigate={setCurrentSection} />
          ))
        ) : (
          <FormatTools format={currentSection} selectedFile={selectedFile} isConverting={isConverting}
            onFileSelect={(e) => handleFileSelect(e, currentSection)} onConvert={convertFile} onExtract={extractFile}
            onBack={() => setCurrentSection('home')} expandedSections={expandedSections}
            onToggleAccordion={(s) => setExpandedSections(p => ({ ...p, [s]: !p[s] }))}
            conversionResult={conversionResult} isDragging={isDragging}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); }}
            onDrop={handleDrop}
          />
        )}
      </section>

      <div className='clearfix'></div>
      <footer>Pedro xd</footer>

      {showHistory && <ConversionHistory onClose={() => setShowHistory(false)} />}
      {showApiStatus && <ApiStatus onClose={() => setShowApiStatus(false)} />}
      
      {/* Indicador responsive para desarrollo */}
      {process.env.NODE_ENV === 'development' && <ResponsiveIndicator />}
    </div>
  );
};

const AuthComponent = () => {
  const [isLogin, setIsLogin] = useState(true);
  return isLogin ? <Login onToggleMode={() => setIsLogin(false)} /> : <Register onToggleMode={() => setIsLogin(true)} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent = () => {
  const { user } = useAuth();
  return user ? <MainApp /> : <AuthComponent />;
};

export default App;