const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Funciones existentes de impresión y cajón (MANTENER)
  printTicket: (ticketData) => {
    console.log('Enviando ticket a impresión...')
    return ipcRenderer.invoke('print-ticket', ticketData)
  },
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  openCashDrawer: () => {
    console.log('Enviando comando para abrir cajón de dinero...')
    return ipcRenderer.invoke('open-cash-drawer')
  },

  // Nuevas funciones del sistema POS
  // Base de datos
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  dbExecute: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
  dbInitialize: () => ipcRenderer.invoke('db:initialize'),

  // Autenticación
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  logout: (userId) => ipcRenderer.invoke('auth:logout', userId),
  verifyToken: (token) => ipcRenderer.invoke('auth:verifyToken', token),

  // Productos
  searchProducts: (query) => ipcRenderer.invoke('product:search', query),
  getProductByCode: (codigo) => ipcRenderer.invoke('product:getByCode', codigo),
  getProductById: (id) => ipcRenderer.invoke('product:getById', id),
  updateStock: (data) => ipcRenderer.invoke('product:updateStock', data),

  // Ventas
  createSale: (saleData) => ipcRenderer.invoke('sale:create', saleData),
  cancelSale: (saleId, reason) => ipcRenderer.invoke('sale:cancel', saleId, reason),
  getSaleByFolio: (folio) => ipcRenderer.invoke('sale:getByFolio', folio),
  getDailySales: (date) => ipcRenderer.invoke('sale:getDaily', date),
  
  // POS - Nuevos métodos
  procesarVenta: (ventaData) => ipcRenderer.invoke('pos:procesarVenta', ventaData),
  getResumenVentas: (params) => ipcRenderer.invoke('pos:getResumenVentas', params),

  // Configuración
  getSucursal: () => ipcRenderer.invoke('config:getSucursal'),
  updateSucursal: (sucursal) => ipcRenderer.invoke('config:updateSucursal', sucursal),
  getSyncConfig: () => ipcRenderer.invoke('config:getSync'),
  updateSyncConfig: (config) => ipcRenderer.invoke('config:updateSync', config),

  // Reportes
  getDailyClose: (date) => ipcRenderer.invoke('report:dailyClose', date),
  getSalesReport: (filters) => ipcRenderer.invoke('report:sales', filters),
  getInventoryReport: () => ipcRenderer.invoke('report:inventory'),

  // Respaldos
  createBackup: () => ipcRenderer.invoke('backup:create'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('backup:restore', backupPath),
  exportToUSB: (usbPath) => ipcRenderer.invoke('backup:exportUSB', usbPath),
  listBackups: () => ipcRenderer.invoke('backup:list'),

  // Sincronización
  startSync: (type) => ipcRenderer.invoke('sync:start', type),
  getSyncStatus: () => ipcRenderer.invoke('sync:status'),
  configureSync: (config) => ipcRenderer.invoke('sync:configure', config),
  getSyncLogs: () => ipcRenderer.invoke('sync:getLogs'),

  // PLM
  searchPLM: (term) => ipcRenderer.invoke('plm:search', term),
  getPLMById: (id) => ipcRenderer.invoke('plm:getById', id),

  // Sistema
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
  checkOnline: () => ipcRenderer.invoke('system:checkOnline'),
  getUSBDevices: () => ipcRenderer.invoke('system:getUSBDevices'),

  // Administración
  getUsers: () => ipcRenderer.invoke('admin:getUsers'),
  getUserTypes: () => ipcRenderer.invoke('admin:getUserTypes'),
  createUser: (userData) => ipcRenderer.invoke('admin:createUser', userData),
  updateUser: (userData) => ipcRenderer.invoke('admin:updateUser', userData),
  deleteUser: (userId) => ipcRenderer.invoke('admin:deleteUser', userId),
  createUserType: (typeData) => ipcRenderer.invoke('admin:createUserType', typeData),
  updateUserType: (typeData) => ipcRenderer.invoke('admin:updateUserType', typeData),
  deleteUserType: (typeId) => ipcRenderer.invoke('admin:deleteUserType', typeId)
})