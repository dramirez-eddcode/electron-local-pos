import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db } from './database/connection.js';
import { ipcManager } from './ipc/channels.js';
// Importar servicios existentes (mantenemos la funcionalidad de impresión)
import { createTicketHTML, createCashDrawerCommand } from './services/printer.service.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
class FarmaciasPOSApp {
    constructor() {
        Object.defineProperty(this, "mainWindow", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.setupApp();
    }
    setupApp() {
        app.whenReady().then(() => {
            this.initializeDatabase()
                .then(() => {
                this.createWindow();
                this.setupIPC();
                this.setupPrintingHandlers(); // Mantener funciones existentes
            })
                .catch(console.error);
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
        app.on('before-quit', async () => {
            await db.close();
        });
    }
    async initializeDatabase() {
        try {
            await db.initialize();
            console.log('Base de datos inicializada correctamente');
        }
        catch (error) {
            console.error('Error inicializando base de datos:', error);
            throw error;
        }
    }
    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            title: 'Farmacias MS - Sistema POS',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../../../preload.js')
            },
            icon: path.join(__dirname, '../../assets/icon.png'), // TODO: Agregar icono
            show: false
        });
        // Cargar aplicación
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.loadURL('http://localhost:5177');
            this.mainWindow.webContents.openDevTools();
        }
        else {
            this.mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
        }
        // Mostrar ventana cuando esté lista
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
        });
        // Manejar cierre de ventana
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }
    setupIPC() {
        // Configurar canales IPC del nuevo sistema
        ipcManager.setupChannels();
    }
    setupPrintingHandlers() {
        // MANTENER FUNCIONALIDAD EXISTENTE - IPC Handler para imprimir tickets
        ipcMain.handle('print-ticket', async (event, ticketData) => {
            try {
                // Obtener configuración de la sucursal desde la base de datos
                const sucursal = await db.getSucursal();
                // Mezclar datos de configuración con los datos del ticket
                const ticketDataConConfig = {
                    ...ticketData,
                    storeName: sucursal?.NOMBRE_SUCURSAL || ticketData.storeName || 'FARMACIAS MS',
                    storeAddress: sucursal?.DIRECCION || ticketData.storeAddress || '',
                    rfc: sucursal?.RFC || '',
                    razonSocial: sucursal?.RAZON_SOCIAL || '',
                    telefono: sucursal?.TELEFONO || '',
                    logoPath: sucursal?.LOGO_PATH || ''
                };
                const htmlContent = createTicketHTML(ticketDataConConfig);
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
                        }
                        else {
                            resolve({ success: false, error: failureReason || 'Error desconocido al imprimir' });
                        }
                    });
                });
                setTimeout(() => {
                    printWindow.close();
                }, 500);
                return printResult;
            }
            catch (error) {
                console.error('Error al imprimir:', error);
                return { success: false, error: error.message };
            }
        });
        // MANTENER FUNCIONALIDAD EXISTENTE - IPC Handler para obtener impresoras
        ipcMain.handle('get-printers', async () => {
            try {
                const focusedWindow = BrowserWindow.getFocusedWindow();
                if (!focusedWindow) {
                    return { success: false, error: 'No hay ventana activa' };
                }
                // Usar getPrinters del webContents
                const printers = focusedWindow.webContents.getPrinters();
                return { success: true, printers };
            }
            catch (error) {
                console.error('Error al obtener impresoras:', error);
                return { success: false, error: error.message };
            }
        });
        // MANTENER FUNCIONALIDAD EXISTENTE - IPC Handler para abrir cajón de dinero
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
          <body style=\"margin:0;padding:0;\"><div style=\"width:1px;height:1px;\"></div></body>
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
                        }
                        else {
                            resolve({ success: false, error: failureReason || 'Error al enviar comando al cajón' });
                        }
                    });
                });
                setTimeout(() => {
                    printWindow.close();
                }, 500);
                return result;
            }
            catch (error) {
                console.error('Error al abrir cajón de dinero:', error);
                return { success: false, error: error.message };
            }
        });
    }
    getMainWindow() {
        return this.mainWindow;
    }
}
// Inicializar aplicación
const farmaciasPOS = new FarmaciasPOSApp();
export { farmaciasPOS };
