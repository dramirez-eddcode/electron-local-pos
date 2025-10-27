// Constantes compartidas del sistema
// Canales IPC
export var IpcChannels;
(function (IpcChannels) {
    // Database
    IpcChannels["DB_QUERY"] = "db:query";
    IpcChannels["DB_EXECUTE"] = "db:execute";
    IpcChannels["DB_INITIALIZE"] = "db:initialize";
    // Auth
    IpcChannels["AUTH_LOGIN"] = "auth:login";
    IpcChannels["AUTH_LOGOUT"] = "auth:logout";
    IpcChannels["AUTH_VERIFY_TOKEN"] = "auth:verifyToken";
    // Products
    IpcChannels["PRODUCT_SEARCH"] = "product:search";
    IpcChannels["PRODUCT_GET_BY_CODE"] = "product:getByCode";
    IpcChannels["PRODUCT_GET_BY_ID"] = "product:getById";
    IpcChannels["PRODUCT_UPDATE_STOCK"] = "product:updateStock";
    // Sales
    IpcChannels["SALE_CREATE"] = "sale:create";
    IpcChannels["SALE_CANCEL"] = "sale:cancel";
    IpcChannels["SALE_GET_BY_FOLIO"] = "sale:getByFolio";
    IpcChannels["SALE_GET_DAILY"] = "sale:getDaily";
    // Cash Drawer & Printing (mantener funciones existentes)
    IpcChannels["PRINT_TICKET"] = "print-ticket";
    IpcChannels["GET_PRINTERS"] = "get-printers";
    IpcChannels["OPEN_CASH_DRAWER"] = "open-cash-drawer";
    // Backup
    IpcChannels["BACKUP_CREATE"] = "backup:create";
    IpcChannels["BACKUP_RESTORE"] = "backup:restore";
    IpcChannels["BACKUP_EXPORT_USB"] = "backup:exportUSB";
    IpcChannels["BACKUP_LIST"] = "backup:list";
    IpcChannels["BACKUP_DETECT_USB"] = "backup:detectUSB";
    IpcChannels["BACKUP_SELECT_FILE"] = "backup:selectFile";
    IpcChannels["BACKUP_SELECT_DIRECTORY"] = "backup:selectDirectory";
    // Sync
    IpcChannels["SYNC_START"] = "sync:start";
    IpcChannels["SYNC_STATUS"] = "sync:status";
    IpcChannels["SYNC_CONFIGURE"] = "sync:configure";
    IpcChannels["SYNC_GET_LOGS"] = "sync:getLogs";
    // Reports
    IpcChannels["REPORT_DAILY_CLOSE"] = "report:dailyClose";
    IpcChannels["REPORT_SALES"] = "report:sales";
    IpcChannels["REPORT_INVENTORY"] = "report:inventory";
    // Configuration
    IpcChannels["CONFIG_GET_SUCURSAL"] = "config:getSucursal";
    IpcChannels["CONFIG_UPDATE_SUCURSAL"] = "config:updateSucursal";
    IpcChannels["CONFIG_GET_SYNC"] = "config:getSync";
    IpcChannels["CONFIG_UPDATE_SYNC"] = "config:updateSync";
    // PLM
    IpcChannels["PLM_SEARCH"] = "plm:search";
    IpcChannels["PLM_GET_BY_ID"] = "plm:getById";
    // System
    IpcChannels["SYSTEM_GET_INFO"] = "system:getInfo";
    IpcChannels["SYSTEM_CHECK_ONLINE"] = "system:checkOnline";
    IpcChannels["SYSTEM_GET_USB_DEVICES"] = "system:getUSBDevices";
})(IpcChannels || (IpcChannels = {}));
// Tipos de usuario
export var TipoUsuario;
(function (TipoUsuario) {
    TipoUsuario[TipoUsuario["ADMINISTRADOR"] = 1] = "ADMINISTRADOR";
    TipoUsuario[TipoUsuario["CAJERO"] = 2] = "CAJERO";
    TipoUsuario[TipoUsuario["SUPERVISOR"] = 3] = "SUPERVISOR";
})(TipoUsuario || (TipoUsuario = {}));
// Permisos del sistema
export var Permisos;
(function (Permisos) {
    Permisos["VENTAS"] = "ventas";
    Permisos["CANCELAR_VENTAS"] = "cancelar_ventas";
    Permisos["CORTE_CAJA"] = "corte_caja";
    Permisos["INVENTARIO"] = "inventario";
    Permisos["REPORTES"] = "reportes";
    Permisos["CONFIGURACION"] = "configuracion";
    Permisos["USUARIOS"] = "usuarios";
    Permisos["BACKUP"] = "backup";
    Permisos["SINCRONIZACION"] = "sincronizacion";
    Permisos["PLM"] = "plm";
})(Permisos || (Permisos = {}));
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
export var SyncStatus;
(function (SyncStatus) {
    SyncStatus["IDLE"] = "idle";
    SyncStatus["SYNCING"] = "syncing";
    SyncStatus["SUCCESS"] = "success";
    SyncStatus["ERROR"] = "error";
    SyncStatus["OFFLINE"] = "offline";
})(SyncStatus || (SyncStatus = {}));
// Intervalos de tiempo (en milisegundos)
export const INTERVALS = {
    SYNC_CHECK: 5 * 60 * 1000, // 5 minutos
    ONLINE_CHECK: 30 * 1000, // 30 segundos
    AUTO_SAVE: 10 * 1000, // 10 segundos
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
export var AppRoutes;
(function (AppRoutes) {
    AppRoutes["LOGIN"] = "/login";
    AppRoutes["POS"] = "/pos";
    AppRoutes["INVENTORY"] = "/inventory";
    AppRoutes["REPORTS"] = "/reports";
    AppRoutes["ADMIN"] = "/admin";
    AppRoutes["CONFIG"] = "/config";
    AppRoutes["PLM"] = "/plm";
})(AppRoutes || (AppRoutes = {}));
