// Tipos para window.electronAPI

export interface ElectronAPI {
  // Funciones existentes de impresión y cajón
  printTicket: (ticketData: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  getPrinters: () => Promise<{ success: boolean; printers?: any[]; error?: string }>;
  openCashDrawer: () => Promise<{ success: boolean; message?: string; error?: string }>;

  // Base de datos
  dbQuery: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  dbExecute: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
  dbInitialize: () => Promise<{ success: boolean; message?: string; error?: string }>;

  // Autenticación
  login: (credentials: { usuario: string; password: string }) => Promise<{
    success: boolean;
    data?: { user: any; token: string };
    error?: string;
  }>;
  logout: (userId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyToken: (token: string) => Promise<{ success: boolean; data?: any; error?: string }>;

  // Productos
  searchProducts: (query: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  getProductByCode: (codigo: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getProductById: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateStock: (data: any) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Ventas
  createSale: (saleData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  cancelSale: (saleId: number, reason: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  getSaleByFolio: (folio: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getDailySales: (date: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  
  // POS - Nuevos métodos
  procesarVenta: (ventaData: any) => Promise<{ success: boolean; folio?: string; message?: string; error?: string }>;
  getResumenVentas: (params: { fechaInicio: string; fechaFin: string }) => Promise<{ success: boolean; data?: any; error?: string }>;

  // Configuración
  getSucursal: () => Promise<{ success: boolean; data?: any; error?: string }>;
  updateSucursal: (sucursal: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  getSyncConfig: () => Promise<{ success: boolean; data?: any; error?: string }>;
  updateSyncConfig: (config: any) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Reportes
  getDailyClose: (date: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getSalesReport: (filters: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  getInventoryReport: () => Promise<{ success: boolean; data?: any[]; error?: string }>;

  // Respaldos
  createBackup: () => Promise<{ success: boolean; data?: string; error?: string }>;
  restoreBackup: (backupPath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  exportToUSB: (usbPath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  listBackups: () => Promise<{ success: boolean; data?: any[]; error?: string }>;

  // Sincronización
  startSync: (type?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  getSyncStatus: () => Promise<{ success: boolean; data?: any; error?: string }>;
  configureSync: (config: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  getSyncLogs: () => Promise<{ success: boolean; data?: any[]; error?: string }>;

  // PLM
  searchPLM: (term: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  getPLMById: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>;

  // Sistema
  getSystemInfo: () => Promise<{ success: boolean; data?: any; error?: string }>;
  checkOnline: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
  getUSBDevices: () => Promise<{ success: boolean; data?: any[]; error?: string }>;

  // Administración
  getUsers: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  getUserTypes: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  createUser: (userData: any) => Promise<{ success: boolean; data?: any; message?: string; error?: string }>;
  updateUser: (userData: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteUser: (userId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  createUserType: (typeData: any) => Promise<{ success: boolean; data?: any; message?: string; error?: string }>;
  updateUserType: (typeData: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteUserType: (typeId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}