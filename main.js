// Aplicación principal de Electron - Versión temporal para desarrollo
// Esta versión incluye las funciones básicas sin TypeScript para poder probar

import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Variables globales
let mainWindow = null;

// Función para crear la ventana principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Farmacias MS - Sistema POS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  // Cargar aplicación React
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Funciones de impresión (mantenidas del original)
const createTicketHTML = (ticketData) => {
  const { 
    storeName = "FARMACIAS MS", 
    storeAddress = "Dirección de la farmacia", 
    ticketNumber = Date.now().toString().slice(-6),
    items = [],
    total = 0,
    date = new Date().toLocaleString('es-ES')
  } = ticketData;

  const itemsHTML = items.map(item => `
    <tr>
      <td style="text-align: left; padding: 2px 0;">${item.name}</td>
      <td style="text-align: center; padding: 2px 0;">${item.quantity}</td>
      <td style="text-align: right; padding: 2px 0;">$${item.price.toFixed(2)}</td>
      <td style="text-align: right; padding: 2px 0;">$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket #${ticketNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 58mm;
          background: white;
        }
        .ticket { text-align: center; }
        .header { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
        .store-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
        .store-address { font-size: 10px; margin-bottom: 4px; }
        .ticket-info { text-align: left; margin: 8px 0; }
        .items-table { width: 100%; font-size: 10px; margin: 8px 0; }
        .items-header { border-bottom: 1px solid #000; font-weight: bold; }
        .total-section { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; text-align: right; }
        .total { font-weight: bold; font-size: 14px; }
        .footer { border-top: 1px dashed #000; padding-top: 8px; margin-top: 12px; text-align: center; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <div class="store-name">${storeName}</div>
          <div class="store-address">${storeAddress}</div>
        </div>
        
        <div class="ticket-info">
          <div>Ticket: #${ticketNumber}</div>
          <div>Fecha: ${date}</div>
        </div>
        
        <table class="items-table">
          <tr class="items-header">
            <td style="text-align: left; padding: 4px 0;">Artículo</td>
            <td style="text-align: center; padding: 4px 0;">Cant.</td>
            <td style="text-align: right; padding: 4px 0;">Precio</td>
            <td style="text-align: right; padding: 4px 0;">Total</td>
          </tr>
          ${itemsHTML}
        </table>
        
        <div class="total-section">
          <div class="total">TOTAL: $${total.toFixed(2)}</div>
        </div>
        
        <div class="footer">
          <div>¡Gracias por su compra!</div>
          <div>Sistema POS Farmacias MS</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const createCashDrawerCommand = () => {
  return Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);
};

// Configurar IPC handlers básicos
function setupIPC() {
  // Handler para impresión (mantener funcionalidad existente)
  ipcMain.handle('print-ticket', async (event, ticketData) => {
    try {
      const htmlContent = createTicketHTML(ticketData);
      
      console.log('Creating print window...');
      
      const printWindow = new BrowserWindow({
        width: 400,
        height: 700,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      console.log('Loading HTML content...');
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      
      console.log('Starting print process...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const printResult = await new Promise((resolve) => {
        printWindow.webContents.print({
          silent: true,
          printBackground: true,
          deviceName: '',
          margins: {
            marginType: 'custom',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        }, (success, failureReason) => {
          console.log('Print callback - Success:', success, 'Reason:', failureReason);
          
          if (success) {
            resolve({ success: true, message: 'Ticket enviado a impresora' });
          } else {
            resolve({ success: false, error: failureReason || 'Error desconocido al imprimir' });
          }
        });
      });

      setTimeout(() => {
        printWindow.close();
      }, 500);
      
      return printResult;
    } catch (error) {
      console.error('Error al imprimir:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler para obtener impresoras
  ipcMain.handle('get-printers', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (!focusedWindow) {
        return { success: false, error: 'No hay ventana activa' };
      }
      
      const printers = await focusedWindow.webContents.getPrinters();
      return { success: true, printers };
    } catch (error) {
      console.error('Error al obtener impresoras:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler para cajón de dinero
  ipcMain.handle('open-cash-drawer', async () => {
    try {
      const command = createCashDrawerCommand();
      
      console.log('Opening cash drawer...');
      
      const printWindow = new BrowserWindow({
        width: 1,
        height: 1,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Cash Drawer Command</title></head>
        <body style="margin:0;padding:0;"><div style="width:1px;height:1px;"></div></body>
        </html>
      `;
      
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await new Promise((resolve) => {
        printWindow.webContents.print({
          silent: true,
          printBackground: false,
          deviceName: '',
        }, (success, failureReason) => {
          console.log('Cash drawer command - Success:', success, 'Reason:', failureReason);
          
          if (success) {
            resolve({ success: true, message: 'Comando enviado al cajón de dinero' });
          } else {
            resolve({ success: false, error: failureReason || 'Error al enviar comando al cajón' });
          }
        });
      });

      setTimeout(() => {
        printWindow.close();
      }, 500);
      
      return result;
    } catch (error) {
      console.error('Error al abrir cajón de dinero:', error);
      return { success: false, error: error.message };
    }
  });

  // Handlers básicos para la nueva funcionalidad (temporales)
  ipcMain.handle('auth:login', async (event, credentials) => {
    // Simulación básica de login
    if (credentials.usuario === 'admin' && credentials.password === 'admin123') {
      return {
        success: true,
        data: {
          user: {
            ID_USUARIO: 1,
            LOGIN_USUARIO: 'admin',
            NOMBRE_USUARIO: 'Administrador',
            ID_TIPOUSUARIO: 1,
            SUCURSAL_ID: 'SUCURSAL-001',
            PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'configuracion', 'usuarios', 'backup', 'sincronizacion', 'plm']
          },
          token: 'fake-jwt-token-for-development'
        }
      };
    } else {
      return {
        success: false,
        error: 'Credenciales incorrectas'
      };
    }
  });

  ipcMain.handle('auth:logout', async (event, userId) => {
    return { success: true, message: 'Sesión cerrada' };
  });

  ipcMain.handle('auth:verifyToken', async (event, token) => {
    if (token === 'fake-jwt-token-for-development') {
      return {
        success: true,
        data: {
          ID_USUARIO: 1,
          LOGIN_USUARIO: 'admin',
          NOMBRE_USUARIO: 'Administrador',
          ID_TIPOUSUARIO: 1,
          SUCURSAL_ID: 'SUCURSAL-001',
          PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'configuracion', 'usuarios', 'backup', 'sincronizacion', 'plm']
        }
      };
    } else {
      return { success: false, error: 'Token inválido' };
    }
  });

  ipcMain.handle('config:getSucursal', async () => {
    return {
      success: true,
      data: {
        SUCURSAL_ID: 'SUCURSAL-001',
        NOMBRE_SUCURSAL: 'Farmacia MS - Sucursal Principal',
        RAZON_SOCIAL: 'FARMACIAS MS S.A. DE C.V.',
        DIRECCION: 'Calle Principal #123, Ciudad',
        CONFIGURACION: {}
      }
    };
  });

  ipcMain.handle('db:initialize', async () => {
    console.log('Simulando inicialización de base de datos...');
    return { success: true, message: 'Base de datos simulada inicializada' };
  });

  ipcMain.handle('db:query', async (event, sql, params) => {
    console.log('Simulando query:', sql);
    return { success: true, data: [{ count: 0 }] };
  });

  console.log('IPC handlers configurados (versión de desarrollo)');
}

// Configuración de la aplicación
app.whenReady().then(() => {
  createWindow();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('🚀 Farmacias MS POS - Versión de desarrollo iniciada');