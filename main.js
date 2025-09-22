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

// Función para crear HTML de corte de caja
const createCorteHTML = (ticketData, corteData, logoPath) => {
  const { storeName, storeAddress, ticketNumber, date } = ticketData;
  const { tipoCorte, ventasResumen, efectivoContado, diferencia, observaciones, usuario } = corteData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Corte ${tipoCorte} #${ticketNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          margin: 0;
          padding: 8px;
          width: 58mm;
          background: white;
        }
        .corte { text-align: center; }
        .header { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
        .store-name { font-weight: bold; font-size: 13px; margin-bottom: 3px; }
        .store-address { font-size: 9px; margin-bottom: 3px; }
        .corte-info { text-align: left; margin: 6px 0; }
        .section { margin: 8px 0; border-top: 1px solid #000; padding-top: 6px; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .total-row { font-weight: bold; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
        .diferencia { 
          text-align: center; 
          padding: 4px; 
          margin: 6px 0; 
          border: 1px solid #000; 
          font-weight: bold;
        }
        .footer { border-top: 1px dashed #000; padding-top: 6px; margin-top: 8px; text-align: center; font-size: 9px; }
      </style>
    </head>
    <body>
      <div class="corte">
        <div class="header">
          ${logoPath ? `<div class="logo" style="text-align: center; margin-bottom: 6px;"><img src="${logoPath}" alt="Logo" style="max-width: 60px; max-height: 60px; object-fit: contain;"></div>` : ''}
          <div class="store-name">${storeName}</div>
          <div class="store-address">${storeAddress}</div>
        </div>
        
        <div class="corte-info">
          <div><strong>CORTE DE CAJA ${tipoCorte}</strong></div>
          <div>Corte: #${ticketNumber}</div>
          <div>Fecha: ${date}</div>
          <div>Usuario: ${usuario}</div>
        </div>
        
        <div class="section">
          <div><strong>RESUMEN DE VENTAS</strong></div>
          <div class="row">
            <span>Folios Vendidos:</span>
            <span>${ventasResumen.foliosVendidos}</span>
          </div>
          <div class="row">
            <span>Rango:</span>
            <span>${ventasResumen.primerFolio} - ${ventasResumen.ultimoFolio}</span>
          </div>
        </div>

        <div class="section">
          <div><strong>DESGLOSE POR FORMA DE PAGO</strong></div>
          <div class="row">
            <span>Efectivo:</span>
            <span>$${ventasResumen.totalEfectivo.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Tarjeta:</span>
            <span>$${ventasResumen.totalTarjeta.toFixed(2)}</span>
          </div>
          <div class="total-row row">
            <span>TOTAL VENDIDO:</span>
            <span>$${ventasResumen.totalGeneral.toFixed(2)}</span>
          </div>
        </div>

        <div class="section">
          <div><strong>CANCELACIONES</strong></div>
          <div class="row">
            <span>Notas Canceladas:</span>
            <span>${ventasResumen.notasCanceladas}</span>
          </div>
          <div class="row">
            <span>Monto Cancelado:</span>
            <span>$${ventasResumen.montoNotasCanceladas.toFixed(2)}</span>
          </div>
        </div>

        <div class="section">
          <div><strong>ARQUEO DE CAJA</strong></div>
          <div class="row">
            <span>Efectivo Sistema:</span>
            <span>$${ventasResumen.totalEfectivo.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Efectivo Contado:</span>
            <span>$${efectivoContado.toFixed(2)}</span>
          </div>
          <div class="diferencia">
            DIFERENCIA: $${diferencia.toFixed(2)}
            ${diferencia > 0 ? '(SOBRANTE)' : diferencia < 0 ? '(FALTANTE)' : '(CUADRADA)'}
          </div>
        </div>

        ${observaciones ? `
          <div class="section">
            <div><strong>OBSERVACIONES</strong></div>
            <div style="text-align: left; font-size: 10px; margin-top: 4px;">
              ${observaciones}
            </div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>CORTE ${tipoCorte} GENERADO</div>
          <div>Sistema POS Farmacias MS</div>
          ${tipoCorte === 'FINAL' ? '<div style="margin-top: 4px; font-weight: bold;">** TURNO CERRADO **</div>' : ''}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Funciones de impresión (mantenidas del original)
const createTicketHTML = (ticketData) => {
  const { 
    storeName = "FARMACIAS MS", 
    storeAddress = "Dirección de la farmacia", 
    ticketNumber = Date.now().toString().slice(-6),
    items = [],
    total = 0,
    tipoPago = 'EFECTIVO',
    efectivoRecibido = null,
    cambio = null,
    date = new Date().toLocaleString('es-ES'),
    logoPath = null,
    corteData = null
  } = ticketData;

  // Si es un corte de caja, generar HTML específico
  if (corteData) {
    return createCorteHTML(ticketData, corteData, logoPath);
  }

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
          ${logoPath ? `<div class="logo" style="text-align: center; margin-bottom: 8px;"><img src="${logoPath}" alt="Logo" style="max-width: 80px; max-height: 80px; object-fit: contain;"></div>` : ''}
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
          <div style="margin-top: 8px; font-size: 12px;">
            <div><strong>FORMA DE PAGO:</strong> ${tipoPago === 'EFECTIVO' ? 'EFECTIVO' : 'TARJETA'}</div>
            ${tipoPago === 'EFECTIVO' && efectivoRecibido !== null ? `
              <div style="margin-top: 4px;">
                <div>Efectivo recibido: $${efectivoRecibido.toFixed(2)}</div>
                <div>Cambio: $${(cambio || 0).toFixed(2)}</div>
              </div>
            ` : ''}
          </div>
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
    // Base de datos de usuarios simulada
    const usuarios = {
      // Administrador - Acceso completo
      'admin': {
        password: 'admin123',
        user: {
          ID_USUARIO: 1,
          LOGIN_USUARIO: 'admin',
          NOMBRE_USUARIO: 'Ana García - Administrador',
          ID_TIPOUSUARIO: 1, // Administrador
          SUCURSAL_ID: 'SUCURSAL-001',
          PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'configuracion', 'usuarios', 'backup', 'sincronizacion', 'plm']
        },
        token: 'admin-jwt-token-dev'
      },
      
      // Cajero - Solo ventas básicas
      'cajero': {
        password: 'cajero123',
        user: {
          ID_USUARIO: 2,
          LOGIN_USUARIO: 'cajero',
          NOMBRE_USUARIO: 'Carlos Hernández - Cajero',
          ID_TIPOUSUARIO: 2, // Cajero
          SUCURSAL_ID: 'SUCURSAL-001',
          PERMISOS: ['ventas', 'corte_caja']
        },
        token: 'cajero-jwt-token-dev'
      },
      
      // Supervisor - Ventas + reportes + inventario
      'supervisor': {
        password: 'super123',
        user: {
          ID_USUARIO: 3,
          LOGIN_USUARIO: 'supervisor',
          NOMBRE_USUARIO: 'María López - Supervisor',
          ID_TIPOUSUARIO: 3, // Supervisor
          SUCURSAL_ID: 'SUCURSAL-001',
          PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'plm']
        },
        token: 'supervisor-jwt-token-dev'
      },
      
      // Cajero 2 - Otro cajero para pruebas
      'maria': {
        password: 'maria123',
        user: {
          ID_USUARIO: 4,
          LOGIN_USUARIO: 'maria',
          NOMBRE_USUARIO: 'María Rodríguez - Cajera',
          ID_TIPOUSUARIO: 2, // Cajero
          SUCURSAL_ID: 'SUCURSAL-001',
          PERMISOS: ['ventas', 'corte_caja']
        },
        token: 'maria-jwt-token-dev'
      }
    };

    const userData = usuarios[credentials.usuario];
    
    if (userData && userData.password === credentials.password) {
      return {
        success: true,
        data: {
          user: userData.user,
          token: userData.token
        }
      };
    } else {
      return {
        success: false,
        error: 'Usuario o contraseña incorrectos'
      };
    }
  });

  ipcMain.handle('auth:logout', async (event, userId) => {
    return { success: true, message: 'Sesión cerrada' };
  });

  ipcMain.handle('auth:verifyToken', async (event, token) => {
    // Mapeo de tokens a usuarios para verificación
    const tokenUsers = {
      'admin-jwt-token-dev': {
        ID_USUARIO: 1,
        LOGIN_USUARIO: 'admin',
        NOMBRE_USUARIO: 'Ana García - Administrador',
        ID_TIPOUSUARIO: 1,
        SUCURSAL_ID: 'SUCURSAL-001',
        PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'configuracion', 'usuarios', 'backup', 'sincronizacion', 'plm']
      },
      'cajero-jwt-token-dev': {
        ID_USUARIO: 2,
        LOGIN_USUARIO: 'cajero',
        NOMBRE_USUARIO: 'Carlos Hernández - Cajero',
        ID_TIPOUSUARIO: 2,
        SUCURSAL_ID: 'SUCURSAL-001',
        PERMISOS: ['ventas', 'corte_caja']
      },
      'supervisor-jwt-token-dev': {
        ID_USUARIO: 3,
        LOGIN_USUARIO: 'supervisor',
        NOMBRE_USUARIO: 'María López - Supervisor',
        ID_TIPOUSUARIO: 3,
        SUCURSAL_ID: 'SUCURSAL-001',
        PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'plm']
      },
      'maria-jwt-token-dev': {
        ID_USUARIO: 4,
        LOGIN_USUARIO: 'maria',
        NOMBRE_USUARIO: 'María Rodríguez - Cajera',
        ID_TIPOUSUARIO: 2,
        SUCURSAL_ID: 'SUCURSAL-001',
        PERMISOS: ['ventas', 'corte_caja']
      },
      // Mantener compatibilidad con token anterior
      'fake-jwt-token-for-development': {
        ID_USUARIO: 1,
        LOGIN_USUARIO: 'admin',
        NOMBRE_USUARIO: 'Ana García - Administrador',
        ID_TIPOUSUARIO: 1,
        SUCURSAL_ID: 'SUCURSAL-001',
        PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'configuracion', 'usuarios', 'backup', 'sincronizacion', 'plm']
      }
    };

    const userData = tokenUsers[token];
    
    if (userData) {
      return {
        success: true,
        data: userData
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

  // Handlers para administración de usuarios
  ipcMain.handle('admin:getUsers', async () => {
    // Simulación de usuarios de la base de datos
    const usuarios = [
      {
        ID_USUARIO: 1,
        LOGIN_USUARIO: 'admin',
        NOMBRE_USUARIO: 'Ana García - Administrador',
        ID_TIPOUSUARIO: 1,
        SUCURSAL_ID: 'SUCURSAL-001',
        ACTIVO: true,
        FECHA_CREACION: '2024-01-15',
        ULTIMO_LOGIN: '2024-01-20 10:30:00'
      },
      {
        ID_USUARIO: 2,
        LOGIN_USUARIO: 'cajero',
        NOMBRE_USUARIO: 'Carlos Hernández - Cajero',
        ID_TIPOUSUARIO: 2,
        SUCURSAL_ID: 'SUCURSAL-001',
        ACTIVO: true,
        FECHA_CREACION: '2024-01-16',
        ULTIMO_LOGIN: '2024-01-20 08:15:00'
      },
      {
        ID_USUARIO: 3,
        LOGIN_USUARIO: 'supervisor',
        NOMBRE_USUARIO: 'María López - Supervisor',
        ID_TIPOUSUARIO: 3,
        SUCURSAL_ID: 'SUCURSAL-001',
        ACTIVO: true,
        FECHA_CREACION: '2024-01-17',
        ULTIMO_LOGIN: '2024-01-19 16:45:00'
      },
      {
        ID_USUARIO: 4,
        LOGIN_USUARIO: 'maria',
        NOMBRE_USUARIO: 'María Rodríguez - Cajera',
        ID_TIPOUSUARIO: 2,
        SUCURSAL_ID: 'SUCURSAL-001',
        ACTIVO: true,
        FECHA_CREACION: '2024-01-18',
        ULTIMO_LOGIN: '2024-01-20 09:00:00'
      }
    ];
    
    return { success: true, data: usuarios };
  });

  ipcMain.handle('admin:getUserTypes', async () => {
    const tipos = [
      {
        ID_TIPOUSUARIO: 1,
        NOMBRE_TIPO: 'Administrador',
        PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'configuracion', 'usuarios', 'backup', 'sincronizacion', 'plm']
      },
      {
        ID_TIPOUSUARIO: 2,
        NOMBRE_TIPO: 'Cajero',
        PERMISOS: ['ventas', 'corte_caja']
      },
      {
        ID_TIPOUSUARIO: 3,
        NOMBRE_TIPO: 'Supervisor',
        PERMISOS: ['ventas', 'cancelar_ventas', 'corte_caja', 'inventario', 'reportes', 'plm']
      }
    ];
    
    return { success: true, data: tipos };
  });

  ipcMain.handle('admin:createUser', async (event, userData) => {
    console.log('Creando usuario:', userData);
    // Simular creación de usuario
    return { 
      success: true, 
      data: { 
        ...userData, 
        ID_USUARIO: Date.now(), 
        FECHA_CREACION: new Date().toISOString().split('T')[0] 
      },
      message: 'Usuario creado exitosamente' 
    };
  });

  ipcMain.handle('admin:updateUser', async (event, userData) => {
    console.log('Actualizando usuario:', userData);
    // Simular actualización de usuario
    return { success: true, message: 'Usuario actualizado exitosamente' };
  });

  ipcMain.handle('admin:deleteUser', async (event, userId) => {
    console.log('Eliminando usuario:', userId);
    // Simular eliminación de usuario
    return { success: true, message: 'Usuario eliminado exitosamente' };
  });

  ipcMain.handle('admin:createUserType', async (event, typeData) => {
    console.log('Creando tipo de usuario:', typeData);
    // Simular creación de tipo
    return { 
      success: true, 
      data: { 
        ...typeData, 
        ID_TIPOUSUARIO: Date.now() 
      },
      message: 'Tipo de usuario creado exitosamente' 
    };
  });

  ipcMain.handle('admin:updateUserType', async (event, typeData) => {
    console.log('Actualizando tipo de usuario:', typeData);
    // Simular actualización de tipo
    return { success: true, message: 'Tipo de usuario actualizado exitosamente' };
  });

  ipcMain.handle('admin:deleteUserType', async (event, typeId) => {
    console.log('Eliminando tipo de usuario:', typeId);
    // Simular eliminación de tipo
    return { success: true, message: 'Tipo de usuario eliminado exitosamente' };
  });

  // ============= SISTEMA DE VENTAS =============
  
  // Almacenamiento en memoria para ventas (simular base de datos)
  let ventasStorage = [];
  let folioCounter = 1001;

  // Generar datos de ventas simuladas para pruebas
  const generarVentasSimuladas = () => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const ventasSimuladas = [];
    
    for (let i = 0; i < 25; i++) {
      const fechaVenta = new Date(inicioMes.getTime() + Math.random() * (hoy.getTime() - inicioMes.getTime()));
      const tipoPago = Math.random() > 0.6 ? 'EFECTIVO' : 'TARJETA';
      const total = parseFloat((Math.random() * 500 + 20).toFixed(2));
      
      ventasSimuladas.push({
        folio: `F${String(folioCounter++).padStart(6, '0')}`,
        fecha: fechaVenta.toISOString(),
        total,
        tipoPago,
        cancelada: Math.random() > 0.95, // 5% de ventas canceladas
        usuario: ['admin', 'cajero', 'supervisor', 'maria'][Math.floor(Math.random() * 4)],
        items: [
          {
            id: 1,
            nombre: 'Paracetamol 500mg',
            cantidad: Math.floor(Math.random() * 3) + 1,
            precio: 25.50
          },
          {
            id: 2,
            nombre: 'Ibuprofeno 400mg',
            cantidad: Math.floor(Math.random() * 2) + 1,
            precio: 35.00
          }
        ]
      });
    }
    
    return ventasSimuladas;
  };

  // Inicializar con datos simulados
  ventasStorage = generarVentasSimuladas();

  // Procesar venta
  ipcMain.handle('pos:procesarVenta', async (event, ventaData) => {
    try {
      console.log('Procesando venta:', ventaData);
      
      const nuevaVenta = {
        folio: `F${String(folioCounter++).padStart(6, '0')}`,
        fecha: new Date().toISOString(),
        total: ventaData.total,
        tipoPago: ventaData.tipoPago,
        cancelada: false,
        usuario: ventaData.usuario || 'sistema',
        efectivo: ventaData.efectivo || 0,
        cambio: ventaData.cambio || 0,
        items: ventaData.items || []
      };
      
      // Agregar a storage
      ventasStorage.push(nuevaVenta);
      
      console.log('Venta guardada con folio:', nuevaVenta.folio);
      
      return { 
        success: true, 
        folio: nuevaVenta.folio,
        message: 'Venta procesada exitosamente' 
      };
      
    } catch (error) {
      console.error('Error procesando venta:', error);
      return { success: false, error: error.message };
    }
  });

  // Obtener resumen de ventas por rango de fechas
  ipcMain.handle('pos:getResumenVentas', async (event, { fechaInicio, fechaFin }) => {
    try {
      console.log('Obteniendo resumen de ventas del', fechaInicio, 'al', fechaFin);
      
      const inicio = new Date(fechaInicio + 'T00:00:00');
      const fin = new Date(fechaFin + 'T23:59:59');
      
      // Filtrar ventas por rango de fechas
      const ventasFiltradas = ventasStorage.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= inicio && fechaVenta <= fin;
      });
      
      console.log(`Encontradas ${ventasFiltradas.length} ventas en el período`);
      
      // Calcular resumen
      let totalEfectivo = 0;
      let totalTarjeta = 0;
      let notasCanceladas = 0;
      let montoNotasCanceladas = 0;
      
      const ventasValidas = ventasFiltradas.filter(v => !v.cancelada);
      const ventasCanceladas = ventasFiltradas.filter(v => v.cancelada);
      
      ventasValidas.forEach(venta => {
        if (venta.tipoPago === 'EFECTIVO') {
          totalEfectivo += venta.total;
        } else if (venta.tipoPago === 'TARJETA') {
          totalTarjeta += venta.total;
        }
      });
      
      ventasCanceladas.forEach(venta => {
        notasCanceladas++;
        montoNotasCanceladas += venta.total;
      });
      
      const ventasDetalle = ventasFiltradas.map(venta => ({
        folio: venta.folio,
        fecha: venta.fecha,
        total: venta.total,
        tipoPago: venta.tipoPago,
        cancelada: venta.cancelada,
        usuario: venta.usuario
      }));
      
      const resumen = {
        foliosVendidos: ventasValidas.length,
        totalEfectivo: parseFloat(totalEfectivo.toFixed(2)),
        totalTarjeta: parseFloat(totalTarjeta.toFixed(2)),
        totalGeneral: parseFloat((totalEfectivo + totalTarjeta).toFixed(2)),
        notasCanceladas,
        montoNotasCanceladas: parseFloat(montoNotasCanceladas.toFixed(2)),
        primerFolio: ventasValidas.length > 0 ? ventasValidas[0].folio : 'N/A',
        ultimoFolio: ventasValidas.length > 0 ? ventasValidas[ventasValidas.length - 1].folio : 'N/A',
        ventasDetalle
      };
      
      console.log('Resumen calculado:', resumen);
      
      return { success: true, data: resumen };
      
    } catch (error) {
      console.error('Error obteniendo resumen de ventas:', error);
      return { success: false, error: error.message };
    }
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