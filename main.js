// Punto de entrada principal para Electron
// Detecta si estamos en desarrollo o producción y carga el código apropiado

import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determinar si estamos en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';

console.log('🚀 Farmacias MS POS - Iniciando aplicación');
console.log(`Modo: ${isDevelopment ? 'Desarrollo' : 'Producción'}`);

// En desarrollo, usar el código TypeScript compilado
// En producción, usar el mismo código compilado
const mainPath = path.join(__dirname, 'dist', 'main', 'main', 'index.js');
const mainURL = `file://${mainPath.replace(/\\/g, '/')}`;

console.log(`Cargando aplicación desde: ${mainURL}`);

// Importar y ejecutar la aplicación principal
import(mainURL)
  .then(() => {
    console.log('✅ Aplicación cargada exitosamente');
  })
  .catch((error) => {
    console.error('❌ Error cargando aplicación:', error);
    process.exit(1);
  });