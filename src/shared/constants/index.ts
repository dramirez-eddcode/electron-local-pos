// Constantes compartidas del sistema

// Canales IPC
export enum IpcChannels {
  // Database
  DB_QUERY = 'db:query',
  DB_EXECUTE = 'db:execute',
  DB_INITIALIZE = 'db:initialize',
  
  // Auth
  AUTH_LOGIN = 'auth:login',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_VERIFY_TOKEN = 'auth:verifyToken',
  
  // Products
  PRODUCT_SEARCH = 'product:search',
  PRODUCT_GET_BY_CODE = 'product:getByCode',
  PRODUCT_GET_BY_ID = 'product:getById',
  PRODUCT_UPDATE_STOCK = 'product:updateStock',
  
  // Sales
  SALE_CREATE = 'sale:create',
  SALE_CANCEL = 'sale:cancel',
  SALE_GET_BY_FOLIO = 'sale:getByFolio',
  SALE_GET_DAILY = 'sale:getDaily',
  
  // Cash Drawer & Printing (mantener funciones existentes)
  PRINT_TICKET = 'print-ticket',
  GET_PRINTERS = 'get-printers',
  OPEN_CASH_DRAWER = 'open-cash-drawer',
  
  // Backup
  BACKUP_CREATE = 'backup:create',
  BACKUP_RESTORE = 'backup:restore',
  BACKUP_EXPORT_USB = 'backup:exportUSB',
  BACKUP_LIST = 'backup:list',
  BACKUP_DETECT_USB = 'backup:detectUSB',
  BACKUP_SELECT_FILE = 'backup:selectFile',
  BACKUP_SELECT_DIRECTORY = 'backup:selectDirectory',
  
  // Sync
  SYNC_START = 'sync:start',
  SYNC_STATUS = 'sync:status',
  SYNC_CONFIGURE = 'sync:configure',
  SYNC_GET_LOGS = 'sync:getLogs',
  
  // Reports
  REPORT_DAILY_CLOSE = 'report:dailyClose',
  REPORT_SALES = 'report:sales',
  REPORT_INVENTORY = 'report:inventory',
  
  // Configuration
  CONFIG_GET_SUCURSAL = 'config:getSucursal',
  CONFIG_UPDATE_SUCURSAL = 'config:updateSucursal',
  CONFIG_GET_SYNC = 'config:getSync',
  CONFIG_UPDATE_SYNC = 'config:updateSync',
  
  // PLM
  PLM_SEARCH = 'plm:search',
  PLM_GET_BY_ID = 'plm:getById',
  
  // System
  SYSTEM_GET_INFO = 'system:getInfo',
  SYSTEM_CHECK_ONLINE = 'system:checkOnline',
  SYSTEM_GET_USB_DEVICES = 'system:getUSBDevices'
}

// Tipos de usuario
export enum TipoUsuario {
  ADMINISTRADOR = 1,
  CAJERO = 2,
  SUPERVISOR = 3
}

// Permisos del sistema
export enum Permisos {
  VENTAS = 'ventas',
  CANCELAR_VENTAS = 'cancelar_ventas',
  CORTE_CAJA = 'corte_caja',
  INVENTARIO = 'inventario',
  REPORTES = 'reportes',
  CONFIGURACION = 'configuracion',
  USUARIOS = 'usuarios',
  BACKUP = 'backup',
  SINCRONIZACION = 'sincronizacion',
  PLM = 'plm'
}

// Configuración por defecto de sucursal
export const DEFAULT_SUCURSAL_CONFIG = {
  SYNC_AUTO_ENABLED: false,
  SYNC_INTERVAL_MINUTES: 30,
  CASH_DRAWER_ENABLED: true,
  BACKUP_AUTO_ENABLED: true,
  BACKUP_RETENTION_DAYS: 30
};

// Atajos de teclado
export const KEYBOARD_SHORTCUTS = {
  SEARCH_PRODUCT: 'F5',
  SPECIAL_FUNCTIONS: 'F11',
  EXIT_SYSTEM: 'F12',
  FINISH_SALE: 'End',
  DELETE_ITEM: 'Delete',
  CANCEL_OPERATION: 'Escape'
};

// Configuración de la base de datos
export const DB_CONFIG = {
  DATABASE_NAME: 'farmacia.db',
  BACKUP_EXTENSION: '.fmsbackup',
  AUTO_BACKUP_TIME: '23:00'
};

// Configuración de impresión
export const PRINT_CONFIG = {
  TICKET_WIDTH: '58mm',
  FONT_SIZE: '12px',
  FONT_FAMILY: 'Courier New, monospace'
};

// Estados de sincronización
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  OFFLINE = 'offline'
}

// Intervalos de tiempo (en milisegundos)
export const INTERVALS = {
  SYNC_CHECK: 5 * 60 * 1000, // 5 minutos
  ONLINE_CHECK: 30 * 1000,   // 30 segundos
  AUTO_SAVE: 10 * 1000,      // 10 segundos
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000 // 8 horas
};

// Validaciones
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  FOLIO_LENGTH: 10,
  CODIGO_PRODUCTO_MAX_LENGTH: 50,
  NOMBRE_PRODUCTO_MAX_LENGTH: 255,
  MAX_CANTIDAD_VENTA: 9999,
  MAX_PRECIO: 999999.99
};

// Mensajes del sistema
export const MESSAGES = {
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGIN_FAILED: 'Credenciales incorrectas',
  SALE_COMPLETED: 'Venta completada exitosamente',
  SALE_CANCELLED: 'Venta cancelada',
  SYNC_SUCCESS: 'Sincronización completada',
  SYNC_ERROR: 'Error en la sincronización',
  BACKUP_SUCCESS: 'Respaldo creado exitosamente',
  BACKUP_ERROR: 'Error al crear respaldo',
  PRINTER_ERROR: 'Error de impresión',
  CASH_DRAWER_OPENED: 'Cajón de dinero abierto',
  INSUFFICIENT_STOCK: 'Stock insuficiente',
  PRODUCT_NOT_FOUND: 'Producto no encontrado'
};

// Colores del tema
export const COLORS = {
  PRIMARY: '#1E40AF',
  SECONDARY: '#64748B',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6'
};

// Rutas de la aplicación
export enum AppRoutes {
  LOGIN = '/login',
  POS = '/pos',
  INVENTORY = '/inventory',
  REPORTS = '/reports',
  ADMIN = '/admin',
  CONFIG = '/config',
  PLM = '/plm'
}