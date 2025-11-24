const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");
const archiver = require("archiver");
require('dotenv').config();

// Importar funciones de CloudConvert
const { 
  convertZipToRar, 
  convertZipToArc, 
  convertZipTo7z,
  convertRarToZip,
  convertRarToArc,
  convertRarTo7z,
  convertArcToZip,
  convertArcToRar,
  convertArcTo7z,
  convert7zToZip,
  convert7zToRar,
  convert7zToArc,
  checkCloudConvertStatus 
} = require('./cloudconvert');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar multer para subir archivos
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
const upload = multer({ dest: "uploads/" });

// Crear directorio de conversiones si no existe
const convertedDir = path.join(__dirname, "converted");
if (!fs.existsSync(convertedDir)) {
  fs.mkdirSync(convertedDir);
}

app.get("/", (req, res) => {
  res.send("Servidor de conversión activo");
});

// Endpoint para verificar el estado de CloudConvert
app.get("/api/status", async (req, res) => {
  try {
    const status = await checkCloudConvertStatus();
    res.json({
      server: 'Activo',
      cloudconvert: status
    });
  } catch (error) {
    res.json({
      server: 'Activo',
      cloudconvert: {
        configured: false,
        error: 'Error al verificar CloudConvert'
      }
    });
  }
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se subió archivo" });
  res.json({ message: "Archivo recibido", file: req.file });
});

// Endpoint para conversión de archivos
app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error('❌ No se recibió archivo');
      return res.status(400).json({ error: "No se subió archivo" });
    }

    const { convertTo, fromFormat } = req.body;
    const sourceFile = req.file.path;
    const originalName = req.file.originalname;
    const nameWithoutExt = path.parse(originalName).name;

    console.log(`🚀 Iniciando conversión: ${originalName} → ${convertTo}`);
    console.log(`🗂 Archivo temporal: ${sourceFile}`);
    console.log(`🔍 Parámetros: from=${fromFormat}, to=${convertTo}`);

    let conversionResult;

    // Intentar usar CloudConvert primero
    if (process.env.CLOUDCONVERT_API_KEY && process.env.CLOUDCONVERT_API_KEY !== 'your-api-key-here') {
      console.log('🌐 Usando CloudConvert para conversión real...');
      
      try {
        // Determinar función de conversión basada en formatos
        const originalExt = path.extname(originalName).slice(1).toLowerCase();
        const conversionKey = `${originalExt}_to_${convertTo}`;
        
        console.log(`🔑 Clave de conversión: ${conversionKey}`);
        
        const conversions = {
          'zip_to_rar': () => convertZipToRar(sourceFile),
          'zip_to_arc': () => convertZipToArc(sourceFile),
          'zip_to_7z': () => convertZipTo7z(sourceFile),
          'rar_to_zip': () => convertRarToZip(sourceFile),
          'rar_to_arc': () => convertRarToArc(sourceFile),
          'rar_to_7z': () => convertRarTo7z(sourceFile),
          'arc_to_zip': () => convertArcToZip(sourceFile),
          'arc_to_rar': () => convertArcToRar(sourceFile),
          'arc_to_7z': () => convertArcTo7z(sourceFile),
          '7z_to_zip': () => convert7zToZip(sourceFile),
          '7z_to_rar': () => convert7zToRar(sourceFile),
          '7z_to_arc': () => convert7zToArc(sourceFile)
        };

        if (conversions[conversionKey]) {
          console.log(`⏳ Ejecutando conversión ${conversionKey}...`);
          conversionResult = await conversions[conversionKey]();
          console.log('✅ CloudConvert result:', conversionResult);
        } else {
          console.error(`❌ Conversión no soportada: ${conversionKey}`);
          return res.status(400).json({ 
            error: `Conversión ${originalExt.toUpperCase()} → ${convertTo.toUpperCase()} no soportada`,
            supportedConversions: Object.keys(conversions)
          });
        }

        if (conversionResult && conversionResult.success) {
          console.log('✅ Conversión exitosa con CloudConvert');
          
          // Limpiar archivo temporal solo si la conversión fue exitosa
          if (fs.existsSync(sourceFile)) {
            fs.unlinkSync(sourceFile);
            console.log('🗑️ Archivo temporal eliminado');
          }
          
          return res.json({
            success: true,
            message: conversionResult.message,
            filename: conversionResult.filename,
            downloadUrl: conversionResult.downloadUrl,
            originalName: originalName,
            convertedFormat: convertTo.toUpperCase(),
            size: conversionResult.size,
            method: 'CloudConvert API'
          });
        } else {
          console.warn('⚠️ CloudConvert falló, intentando método local...');
          // Continuar con fallback local
        }
        
      } catch (cloudConvertError) {
        console.error('❌ Error en CloudConvert:', cloudConvertError);
        console.log('🔄 Intentando método local como fallback...');
        // Continuar con fallback local
      }
    } 
    
    // Si CloudConvert no está configurado o falló, usar método local
    if (!conversionResult || !conversionResult.success) {
      console.log('🔧 Usando método local como fallback...');
      
      // Fallback: usar el método local (soporte ampliado)
      const originalExt = path.extname(originalName).slice(1).toLowerCase();
      const supportedFormats = ['zip', 'rar', 'arc', '7z'];
      
      if (supportedFormats.includes(originalExt) && supportedFormats.includes(convertTo)) {
        console.log(`🔄 Conversión local ${originalExt.toUpperCase()} → ${convertTo.toUpperCase()}`);
        console.log(`📁 Archivo fuente: ${sourceFile}`);
        
        // Verificar que el archivo fuente existe
        if (!fs.existsSync(sourceFile)) {
          throw new Error('Archivo fuente no encontrado');
        }
        
        // Definir variables fuera del try para poder usarlas después
        const outputFileName = `${nameWithoutExt}.${convertTo}`;
        const outputPath = path.join(convertedDir, outputFileName);
        
        try {
          let extractSuccess = false;
          const tempDir = path.join(__dirname, "temp", Date.now().toString());
          fs.mkdirSync(tempDir, { recursive: true });

          console.log('📦 Extrayendo archivo temporal...');
          
          // Extraer según el formato de origen
          if (originalExt === 'zip') {
            const zip = new AdmZip(sourceFile);
            zip.extractAllTo(tempDir, true);
            extractSuccess = true;
          } else if (['rar', 'arc', '7z'].includes(originalExt)) {
            // Intentar usar node-7z primero, con fallback si no está disponible
            try {
              const _7z = require('node-7z');
              
              await new Promise((resolve, reject) => {
                const extractStream = _7z.extractFull(sourceFile, tempDir);
                
                extractStream.on('data', (data) => {
                  console.log('📁 Extrayendo:', data.file);
                });
                
                extractStream.on('end', () => {
                  console.log(`✅ Extracción ${originalExt.toUpperCase()} completada`);
                  extractSuccess = true;
                  resolve();
                });
                
                extractStream.on('error', (err) => {
                  console.log(`❌ Error extrayendo ${originalExt}:`, err);
                  reject(err);
                });
              });
            } catch (sevenZipError) {
              console.log(`⚠️  7-Zip no disponible: ${sevenZipError.message}`);
              
              // Fallback: tratarlo como ZIP si es posible
              if (originalExt !== 'zip') {
                try {
                  console.log('🔄 Intentando extraer como ZIP...');
                  const zip = new AdmZip(sourceFile);
                  zip.extractAllTo(tempDir, true);
                  extractSuccess = true;
                  console.log('✅ Extracción como ZIP exitosa');
                } catch (zipError) {
                  console.log('❌ También falló extracción como ZIP:', zipError.message);
                  throw new Error(`No se puede extraer archivo ${originalExt.toUpperCase()}. Instala 7-Zip o usa archivos ZIP.`);
                }
              } else {
                throw sevenZipError;
              }
            }
          }

          if (extractSuccess) {
            console.log(`📝 Creando archivo: ${outputPath}`);
            
            // Crear archivo de salida (siempre en formato ZIP para compatibilidad)
            const output = fs.createWriteStream(outputPath);
            const archive = archiver("zip", {
              zlib: { level: 9 }
            });

            // Manejar errores del archiver
            archive.on('error', (err) => {
              throw err;
            });

            archive.pipe(output);
            archive.directory(tempDir, false);
            
            await new Promise((resolve, reject) => {
              output.on('close', resolve);
              output.on('error', reject);
              archive.finalize();
            });

            console.log('✅ Archivo creado exitosamente');
            
            // Limpiar directorio temporal
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
          
        } catch (conversionError) {
          console.error('❌ Error en conversión local:', conversionError);
          throw new Error(`Error en conversión local: ${conversionError.message}`);
        }

        // Limpiar archivo temporal
        fs.unlinkSync(sourceFile);

        res.json({
          success: true,
          message: `Conversión local de ${originalExt.toUpperCase()} a ${convertTo.toUpperCase()} completada`,
          filename: outputFileName,
          originalName: originalName,
          convertedFormat: convertTo.toUpperCase(),
          method: 'Local (formato ZIP)',
          note: 'El archivo mantiene formato ZIP internamente. Para conversión real configura CloudConvert.'
        });

      } else {
        res.status(400).json({ 
          error: `Conversión ${originalExt.toUpperCase()} → ${convertTo.toUpperCase()} no soportada`,
          supported: 'Formatos soportados: ZIP, RAR, ARC, 7Z ↔ ZIP, RAR, ARC, 7Z (formato ZIP interno)',
          note: 'Para conversiones reales configura CloudConvert API'
        });
      }
    }

  } catch (error) {
    console.error("Error en conversión:", error);
    res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
});

// Endpoint para extraer archivos
app.post("/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió archivo" });
    }

    const sourceFile = req.file.path;
    const originalName = req.file.originalname;
    const nameWithoutExt = path.parse(originalName).name;
    const fileExt = path.extname(originalName).slice(1).toLowerCase();

    console.log(`📦 Extrayendo archivo: ${originalName}`);

    // Crear directorio de extracción
    const extractDir = path.join(convertedDir, `extracted_${nameWithoutExt}_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    let extractedFiles = [];
    let outputZipPath; // Declarar la variable aquí

    try {
      if (fileExt === 'zip') {
        // Extraer archivo ZIP
        const zip = new AdmZip(sourceFile);
        zip.extractAllTo(extractDir, true);
        
        // Obtener lista detallada de archivos extraídos
        const getFilesRecursively = (dir, baseDir = '') => {
          const files = [];
          const items = fs.readdirSync(dir, { withFileTypes: true });
          
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            const relativePath = path.join(baseDir, item.name);
            
            if (item.isDirectory()) {
              files.push({
                name: relativePath + '/',
                type: 'directory',
                size: 0
              });
              // Recursivamente obtener archivos en subdirectorios
              files.push(...getFilesRecursively(fullPath, relativePath));
            } else {
              const stats = fs.statSync(fullPath);
              files.push({
                name: relativePath,
                type: 'file',
                size: stats.size,
                extension: path.extname(item.name).slice(1) || 'sin extensión'
              });
            }
          }
          return files;
        };
        
        extractedFiles = getFilesRecursively(extractDir);
        console.log(`📂 Archivos extraídos: ${extractedFiles.length} elementos`);
        
        // Crear un nuevo ZIP con los archivos extraídos para descarga
        outputZipPath = path.join(convertedDir, `extracted_${nameWithoutExt}_${Date.now()}.zip`);
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('error', (err) => {
          throw err;
        });
        
        archive.pipe(output);
        archive.directory(extractDir, false);
        await archive.finalize();
        
        console.log('📦 Nuevo ZIP creado con archivos extraídos');
        
      } else if (fileExt === 'rar' || fileExt === '7z' || fileExt === 'arc') {
        // Para otros formatos, usar node-7z
        const _7z = require('node-7z');
        
        await new Promise((resolve, reject) => {
          const extractStream = _7z.extractFull(sourceFile, extractDir);
          
          extractStream.on('data', (data) => {
            console.log('📁 Extrayendo:', data.file);
          });
          
          extractStream.on('end', () => {
            console.log('✅ Extracción completada con node-7z');
            resolve();
          });
          
          extractStream.on('error', reject);
        });
        
        // Obtener archivos extraídos
        const getFilesRecursively = (dir, baseDir = '') => {
          const files = [];
          const items = fs.readdirSync(dir, { withFileTypes: true });
          
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            const relativePath = path.join(baseDir, item.name);
            
            if (item.isDirectory()) {
              files.push({
                name: relativePath + '/',
                type: 'directory',
                size: 0
              });
              files.push(...getFilesRecursively(fullPath, relativePath));
            } else {
              const stats = fs.statSync(fullPath);
              files.push({
                name: relativePath,
                type: 'file',
                size: stats.size,
                extension: path.extname(item.name).slice(1) || 'sin extensión'
              });
            }
          }
          return files;
        };
        
        extractedFiles = getFilesRecursively(extractDir);
        
        // Crear ZIP con archivos extraídos
        outputZipPath = path.join(convertedDir, `extracted_${nameWithoutExt}_${Date.now()}.zip`);
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('error', (err) => {
          throw err;
        });
        
        archive.pipe(output);
        archive.directory(extractDir, false);
        await archive.finalize();
        
      } else {
        return res.status(400).json({ 
          error: `Formato ${fileExt.toUpperCase()} no soportado para extracción` 
        });
      }

      // Limpiar archivo temporal original
      fs.unlinkSync(sourceFile);

      // Enviar respuesta JSON con información de la extracción
      res.json({
        success: true,
        message: "Archivo extraído exitosamente",
        extractedFiles: extractedFiles,
        extractPath: path.basename(extractDir),
        outputFile: path.basename(outputZipPath),
        downloadUrl: `/download-extracted/${path.basename(outputZipPath)}`
      });
      
      console.log(`✅ Extracción completada: ${extractedFiles.length} elementos extraídos`);

    } catch (extractError) {
      console.error("Error durante extracción:", extractError);
      
      // Limpiar archivos temporales en caso de error
      if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }

      res.status(500).json({ 
        error: "Error durante la extracción", 
        details: extractError.message 
      });
    }

  } catch (error) {
    console.error("Error en endpoint de extracción:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para descargar archivos extraídos
app.get('/download-extracted/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(convertedDir, filename);
    
    console.log(`📥 Descargando archivo extraído: ${filename}`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const outputName = filename.replace('extracted_', '');
    res.download(filePath, outputName, (err) => {
      if (err) {
        console.error('❌ Error enviando archivo:', err);
      }
      
      // Limpiar archivo temporal después de enviarlo
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.log('⚠️  Error limpiando archivo temporal:', cleanupError);
        }
      }, 5000);
    });
    
  } catch (error) {
    console.error('❌ Error en descarga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para crear archivo ZIP desde múltiples archivos
app.post("/create-zip", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No se subieron archivos" });
    }

    const zipName = `created_archive_${Date.now()}.zip`;
    const zipPath = path.join(convertedDir, zipName);

    console.log(`🗜️ Creando archivo ZIP: ${zipName} con ${req.files.length} archivos`);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`✅ ZIP creado: ${archive.pointer()} bytes`);
        
        // Limpiar archivos temporales
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });

        res.json({
          success: true,
          message: "Archivo ZIP creado exitosamente",
          filename: zipName,
          size: archive.pointer(),
          filesCount: req.files.length,
          downloadUrl: `/download/${zipName}`
        });
        resolve();
      });

      archive.on('error', (err) => {
        console.error("Error creando ZIP:", err);
        
        // Limpiar archivos temporales en caso de error
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });

        res.status(500).json({ 
          error: "Error al crear archivo ZIP", 
          details: err.message 
        });
        reject(err);
      });

      archive.pipe(output);

      // Agregar cada archivo al ZIP
      req.files.forEach(file => {
        archive.file(file.path, { name: file.originalname });
      });

      archive.finalize();
    });

  } catch (error) {
    console.error("Error en endpoint de creación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para descargar carpeta extraída como ZIP
app.get("/download-extracted/:foldername", (req, res) => {
  const folderName = req.params.foldername;
  const folderPath = path.join(convertedDir, folderName);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: "Carpeta no encontrada" });
  }

  // Crear un ZIP temporal de la carpeta extraída
  const zipName = `${folderName}.zip`;
  const zipPath = path.join(convertedDir, zipName);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    res.download(zipPath, zipName, (err) => {
      if (err) {
        console.error("Error al descargar:", err);
        res.status(500).json({ error: "Error al descargar archivo" });
      }
      // Limpiar archivo ZIP temporal después de la descarga
      setTimeout(() => {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      }, 5000);
    });
  });

  archive.on('error', (err) => {
    console.error("Error creando ZIP de descarga:", err);
    res.status(500).json({ error: "Error al preparar descarga" });
  });

  archive.pipe(output);
  archive.directory(folderPath, false);
  archive.finalize();
});

// Endpoint para descargar archivos convertidos
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(convertedDir, filename);

  if (fs.existsSync(filepath)) {
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error("Error al descargar:", err);
        res.status(500).json({ error: "Error al descargar archivo" });
      }
    });
  } else {
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  
  // Verificar dependencias opcionales
  console.log('\n📋 Estado de dependencias:');
  console.log('✅ AdmZip (ZIP): Disponible');
  
  try {
    const { spawn } = require('child_process');
    const test7z = spawn('7z', ['--help'], { stdio: 'pipe' });
    test7z.on('error', () => {
      console.log('⚠️  7-Zip: No instalado - Solo conversiones ZIP disponibles');
      console.log('   Para soporte completo, instala 7-Zip: https://www.7-zip.org/');
    });
    test7z.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 7-Zip: Disponible - Soporte completo para RAR/ARC/7Z');
      }
    });
  } catch (e) {
    console.log('⚠️  7-Zip: No disponible - Solo conversiones ZIP');
  }
  
  console.log('✅ CloudConvert:', process.env.CLOUDCONVERT_API_KEY && process.env.CLOUDCONVERT_API_KEY !== 'your-api-key-here' ? 'Configurado' : 'No configurado');
  console.log('');
});
