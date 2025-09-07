const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  printTicket: (ticketData) => {
    console.log('Enviando ticket a impresión...')
    return ipcRenderer.invoke('print-ticket', ticketData)
  },
  getPrinters: () => ipcRenderer.invoke('get-printers')
})