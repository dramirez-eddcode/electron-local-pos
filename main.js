import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // En desarrollo, carga desde el servidor de Vite
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // En producción, carga el archivo HTML construido
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handler para imprimir tickets
ipcMain.handle('print-ticket', async (event, ticketData) => {
  try {
    const { createTicketHTML } = await import('./src/services/printerService.js')
    const htmlContent = createTicketHTML(ticketData)
    
    console.log('Creating print window...')
    
    // Crear una ventana invisible para imprimir
    const printWindow = new BrowserWindow({
      width: 400,
      height: 700,
      show: false, // Ventana invisible para impresión automática
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    console.log('Loading HTML content...')
    // Cargar el contenido HTML
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
    
    console.log('Starting print process...')
    
    // Esperar un momento para que el contenido se cargue
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Usar un Promise para manejar la impresión correctamente
    const printResult = await new Promise((resolve, reject) => {
      printWindow.webContents.print({
        silent: true, // Imprimir directamente sin diálogo
        printBackground: true,
        deviceName: '', // Usar impresora predeterminada
        margins: {
          marginType: 'custom',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
      }, (success, failureReason) => {
        console.log('Print callback - Success:', success, 'Reason:', failureReason)
        
        if (success) {
          resolve({ success: true, message: 'Ticket enviado a impresora' })
        } else {
          resolve({ success: false, error: failureReason || 'Error desconocido al imprimir' })
        }
      })
    })

    // Cerrar la ventana después de imprimir
    setTimeout(() => {
      printWindow.close()
    }, 500)
    
    return printResult
  } catch (error) {
    console.error('Error al imprimir:', error)
    return { success: false, error: error.message }
  }
})

// IPC Handler para obtener impresoras disponibles
ipcMain.handle('get-printers', async () => {
  try {
    const { webContents } = BrowserWindow.getFocusedWindow()
    const printers = await webContents.getPrinters()
    return { success: true, printers }
  } catch (error) {
    console.error('Error al obtener impresoras:', error)
    return { success: false, error: error.message }
  }
})

// IPC Handler para abrir cajón de dinero
ipcMain.handle('open-cash-drawer', async () => {
  try {
    const { createCashDrawerCommand } = await import('./src/services/printerService.js')
    const command = createCashDrawerCommand()
    
    console.log('Opening cash drawer...')
    
    // Crear una ventana invisible para enviar el comando
    const printWindow = new BrowserWindow({
      width: 1,
      height: 1,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // Crear contenido HTML mínimo para poder imprimir
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Cash Drawer Command</title></head>
      <body style="margin:0;padding:0;"><div style="width:1px;height:1px;"></div></body>
      </html>
    `
    
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Enviar comando raw a la impresora
    const result = await new Promise((resolve, reject) => {
      printWindow.webContents.print({
        silent: true,
        printBackground: false,
        deviceName: '', // Usar impresora predeterminada
      }, (success, failureReason) => {
        console.log('Cash drawer command - Success:', success, 'Reason:', failureReason)
        
        if (success) {
          resolve({ success: true, message: 'Comando enviado al cajón de dinero' })
        } else {
          resolve({ success: false, error: failureReason || 'Error al enviar comando al cajón' })
        }
      })
    })

    // Cerrar la ventana
    setTimeout(() => {
      printWindow.close()
    }, 500)
    
    return result
  } catch (error) {
    console.error('Error al abrir cajón de dinero:', error)
    return { success: false, error: error.message }
  }
})