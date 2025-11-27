const CloudConvert = require('cloudconvert');

// Configuración de CloudConvert
// IMPORTANTE: Reemplaza 'your-api-key' con tu API key real de CloudConvert
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || 'your-api-key');

/**
 * Función para convertir archivos usando CloudConvert API
 * @param {string} inputPath - Ruta del archivo de entrada
 * @param {string} outputFormat - Formato de salida (rar, zip, 7z, etc.)
 * @param {string} inputFormat - Formato de entrada 
 * @returns {Promise} - Promesa con el resultado de la conversión
 */
async function convertFile(inputPath, outputFormat, inputFormat) {
  try {
    console.log(` Iniciando conversión: ${inputFormat} → ${outputFormat}`);

    // Crear un job de conversión
    const job = await cloudConvert.jobs.create({
      tasks: {
        'upload-file': {
          operation: 'import/upload'
        },
        'convert-file': {
          operation: 'convert',
          input: 'upload-file',
          output_format: outputFormat,
          some_other_option: 'value'
        },
        'export-file': {
          operation: 'export/url',
          input: 'convert-file'
        }
      }
    });

    console.log(`📋 Job creado con ID: ${job.id}`);

    // Subir el archivo
    const uploadTask = job.tasks.filter(task => task.name === 'upload-file')[0];
    
    const fs = require('fs');
    const inputFile = fs.createReadStream(inputPath);
    
    await cloudConvert.tasks.upload(uploadTask, inputFile);
    console.log('⬆ Archivo subido exitosamente');

    // Esperar a que la conversión termine
    const jobCompleted = await cloudConvert.jobs.wait(job.id);
    console.log(` Job completado: ${jobCompleted.status}`);

    // Obtener la URL del archivo convertido
    const exportTask = jobCompleted.tasks.filter(task => task.name === 'export-file')[0];
    
    if (exportTask.status === 'finished') {
      const file = exportTask.result.files[0];
      
      return {
        success: true,
        downloadUrl: file.url,
        filename: file.filename,
        size: file.size,
        jobId: job.id,
        message: `Conversión de ${inputFormat} a ${outputFormat} completada`
      };
    } else {
      throw new Error('La conversión falló: ' + exportTask.message);
    }

  } catch (error) {
    console.error(' Error en CloudConvert:', error);
    
    return {
      success: false,
      error: error.message,
      message: `Error al convertir de ${inputFormat} a ${outputFormat}`
    };
  }
}

/**
 * Función simplificada para ZIP → RAR
 */
async function convertZipToRar(inputPath) {
  return await convertFile(inputPath, 'rar', 'zip');
}

/**
 * Función simplificada para ZIP → ARC  
 */
async function convertZipToArc(inputPath) {
  return await convertFile(inputPath, 'arc', 'zip');
}

/**
 * Función simplificada para ZIP → 7Z
 */
async function convertZipTo7z(inputPath) {
  return await convertFile(inputPath, '7z', 'zip');
}

/**
 * Función simplificada para RAR → ZIP
 */
async function convertRarToZip(inputPath) {
  return await convertFile(inputPath, 'zip', 'rar');
}

/**
 * Función simplificada para RAR → ARC
 */
async function convertRarToArc(inputPath) {
  return await convertFile(inputPath, 'arc', 'rar');
}

/**
 * Función simplificada para RAR → 7Z
 */
async function convertRarTo7z(inputPath) {
  return await convertFile(inputPath, '7z', 'rar');
}

/**
 * Función simplificada para ARC → ZIP
 */
async function convertArcToZip(inputPath) {
  return await convertFile(inputPath, 'zip', 'arc');
}

/**
 * Función simplificada para ARC → RAR
 */
async function convertArcToRar(inputPath) {
  return await convertFile(inputPath, 'rar', 'arc');
}

/**
 * Función simplificada para ARC → 7Z
 */
async function convertArcTo7z(inputPath) {
  return await convertFile(inputPath, '7z', 'arc');
}

/**
 * Función simplificada para 7Z → ZIP
 */
async function convert7zToZip(inputPath) {
  return await convertFile(inputPath, 'zip', '7z');
}

/**
 * Función simplificada para 7Z → RAR
 */
async function convert7zToRar(inputPath) {
  return await convertFile(inputPath, 'rar', '7z');
}

/**
 * Función simplificada para 7Z → ARC
 */
async function convert7zToArc(inputPath) {
  return await convertFile(inputPath, 'arc', '7z');
}

/**
 * Verificar si CloudConvert está configurado correctamente
 */
async function checkCloudConvertStatus() {
  try {
    const user = await cloudConvert.users.me();
    return {
      configured: true,
      credits: user.credits,
      email: user.email,
      plan: user.subscription?.plan || 'free'
    };
  } catch (error) {
    return {
      configured: false,
      error: 'API key no configurada o inválida'
    };
  }
}

module.exports = {
  convertFile,
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
};