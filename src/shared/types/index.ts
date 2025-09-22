// Tipos compartidos entre main y renderer process

// Usuario y autenticación
export interface Usuario {
  ID_USUARIO: number;
  LOGIN_USUARIO: string;
  PASSWORD_USUARIO: string;
  NOMBRE_USUARIO: string;
  ID_TIPOUSUARIO: number;
  SUCURSAL_ID: string;
  ACTIVO: boolean;
  FECHA_CREACION: string;
  ULTIMO_LOGIN?: string;
}

export interface TipoUsuario {
  ID_TIPOUSUARIO: number;
  NOMBRE_TIPO: string;
  PERMISOS: string[];
}

// Sucursal y configuración
export interface Sucursal {
  SUCURSAL_ID: string;
  NOMBRE_SUCURSAL: string;
  RAZON_SOCIAL: string;
  DIRECCION: string;
  TELEFONO?: string;
  RFC?: string;
  LOGO_PATH?: string;
  PROPIETARIO_ID: string;
  CONFIGURACION: SucursalConfiguracion;
  FECHA_CREACION: string;
  ACTIVA: boolean;
}

export interface SucursalConfiguracion {
  SYNC_AUTO_ENABLED: boolean;
  SYNC_INTERVAL_MINUTES: number;
  PRINTER_NAME?: string;
  CASH_DRAWER_ENABLED: boolean;
  BACKUP_AUTO_ENABLED: boolean;
  BACKUP_RETENTION_DAYS: number;
}

// Productos
export interface Producto {
  ID_PRODUCTO: number;
  CODIGO_BARRAS: string;
  CODIGO_PLM: string;
  NOMBRE_PRODUCTO: string;
  DESCRIPCION?: string;
  PRECIO_VENTA: number;
  PRECIO_COMPRA: number;
  STOCK_ACTUAL: number;
  STOCK_MINIMO: number;
  ACTIVO: boolean;
  SUCURSAL_ID: string;
  FECHA_CREACION: Date;
  FECHA_ACTUALIZACION: Date;
  SINCRONIZADO: boolean;
  FECHA_SINCRONIZACION?: Date;
}

export interface Laboratorio {
  id_laboratorio: number;
  nombre_laboratorio: string;
  contacto_laboratorio?: string;
}

// Ventas
export interface Salida {
  ID_SALIDA: number;
  FOLIO_SALIDA: string;
  FECHA_SALIDA: string;
  TOTAL_SALIDA: number;
  SUBTOTAL_SALIDA: number;
  IVA_SALIDA: number;
  TIPO_PAGO: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
  MONTO_EFECTIVO?: number;
  MONTO_TARJETA?: number;
  DATOS_TARJETA?: DatosTarjeta;
  ID_USUARIO: number;
  SUCURSAL_ID: string;
  CANCELADA: boolean;
  FECHA_CANCELACION?: string;
  MOTIVO_CANCELACION?: string;
  SINCRONIZADO: boolean;
  FECHA_SINCRONIZACION?: string;
}

export interface DatosTarjeta {
  TIPO_TARJETA: 'DEBITO' | 'CREDITO';
  ULTIMOS_DIGITOS: string;
  NUMERO_AUTORIZACION: string;
  REFERENCIA_BANCARIA?: string;
}

export interface MovSalida {
  ID_MOVSALIDA: number;
  ID_SALIDA: number;
  ID_PRODUCTO: number;
  CANTIDAD_SALIDA: number;
  PRECIO_UNITARIO: number;
  SUBTOTAL: number;
  DESCUENTO?: number;
  FECHA_CADUCIDAD?: string;
}

// Carrito de compras
export interface ItemCarrito {
  ID_PRODUCTO: number;
  CODIGO_BARRAS: string;
  NOMBRE_PRODUCTO: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

// Corte de caja
export interface Corte {
  ID_CORTE: number;
  FECHA_CORTE: string;
  TIPO_CORTE: 'PARCIAL' | 'FINAL';
  FOLIOS_VENDIDOS: number;
  TOTAL_EFECTIVO: number;
  TOTAL_TARJETA: number;
  TOTAL_VENTAS: number;
  NOTAS_CANCELADAS: number;
  ENTRADAS_CAJA: number;
  SALIDAS_CAJA: number;
  ID_USUARIO: number;
  SUCURSAL_ID: string;
  OBSERVACIONES?: string;
  SINCRONIZADO: boolean;
}

// Sincronización
export interface SyncLog {
  ID_SYNC: number;
  FECHA_INICIO: string;
  FECHA_FIN?: string;
  TIPO_SYNC: 'COMPLETA' | 'INCREMENTAL' | 'MANUAL';
  ESTADO: 'INICIADA' | 'EXITOSA' | 'ERROR' | 'CANCELADA';
  REGISTROS_ENVIADOS: number;
  REGISTROS_RECIBIDOS: number;
  MENSAJE_ERROR?: string;
  SUCURSAL_ID: string;
}

export interface ConfiguracionSincronizacion {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUCURSAL_ID: string;
  SINCRONIZACION_ACTIVA: boolean;
  INTERVALO_SINCRONIZACION: number;
  ULTIMA_SINCRONIZACION?: string;
}

// Respaldos
export interface BackupMetadata {
  version: string;
  date: string;
  sucursal: Sucursal;
  checksum: string;
  tables: string[];
  recordCount: number;
}

// Eventos de IPC
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Estados de la aplicación
export interface AppState {
  usuario: Usuario | null;
  sucursal: Sucursal | null;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSync: string | null;
  pendingChanges: number;
}

// PLM (Información de medicamentos)
export interface MedicamentoPLM {
  id: number;
  nombre: string;
  sustancias: string;
  formulacion: string;
  indicaciones: string;
  farmacocinetica: string;
  laboratorio: string;
}