import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🔄 FileConverter Pro</h1>
        <p>Conversor Universal de Archivos</p>
        <p>
          Sistema que permite convertir entre múltiples formatos de archivos
          y visualizar archivos con extensiones difíciles de abrir.
        </p>
        <div className="features">
          <h3>Características:</h3>
          <ul style={{textAlign: 'left', maxWidth: '400px'}}>
            <li>📁 Conversión ZIP ↔ RAR ↔ 7Z</li>
            <li>📄 Documentos PDF ↔ DOCX ↔ TXT</li>
            <li>🖼️ Imágenes PNG ↔ JPG ↔ WEBP</li>
            <li>👁️ Visualización de archivos .arc, .lzh</li>
            <li>🔐 Sistema de usuarios seguro</li>
            <li>🌍 Multilenguaje (ES/EN)</li>
          </ul>
        </div>
        <p style={{fontSize: '14px', marginTop: '20px'}}>
          Proyecto para el ramo Diseño de Software - TICS316
        </p>
      </header>
    </div>
  );
}

export default App;
