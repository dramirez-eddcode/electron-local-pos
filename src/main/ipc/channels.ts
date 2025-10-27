import { ipcMain } from 'electron';
import { db } from '../database/connection.js';
import { IpcChannels } from '../../shared/constants/index.js';
import type { IpcResponse } from '../../shared/types/index.js';

// Handlers para autenticación
import { AuthHandler } from './handlers/auth.handler.js';
import { ProductHandler } from './handlers/product.handler.js';
import { SaleHandler } from './handlers/sale.handler.js';
import { ConfigHandler } from './handlers/config.handler.js';
import { ReportHandler } from './handlers/report.handler.js';
import { BackupHandler } from './handlers/backup.handler.js';
import { SyncHandler } from './handlers/sync.handler.js';
import { PLMHandler } from './handlers/plm.handler.js';
import { SystemHandler } from './handlers/system.handler.js';
import { AdminHandler } from './handlers/admin.handler.js';
import { InventoryHandler } from './handlers/inventory.handler.js';

export class IpcChannelManager {
  private authHandler: AuthHandler;
  private productHandler: ProductHandler;
  private saleHandler: SaleHandler;
  private configHandler: ConfigHandler;
  private reportHandler: ReportHandler;
  private backupHandler: BackupHandler;
  private syncHandler: SyncHandler;
  private plmHandler: PLMHandler;
  private systemHandler: SystemHandler;
  private adminHandler: AdminHandler;
  private inventoryHandler: InventoryHandler;

  constructor() {
    this.authHandler = new AuthHandler();
    this.productHandler = new ProductHandler();
    this.saleHandler = new SaleHandler();
    this.configHandler = new ConfigHandler();
    this.reportHandler = new ReportHandler(db);
    this.backupHandler = new BackupHandler(db);
    this.syncHandler = new SyncHandler();
    this.plmHandler = new PLMHandler();
    this.systemHandler = new SystemHandler();
    this.adminHandler = new AdminHandler();
    this.inventoryHandler = new InventoryHandler(db);
  }

  setupChannels(): void {
    // Database básico
    ipcMain.handle(IpcChannels.DB_QUERY, async (event, sql: string, params: any[]) => {
      try {
        const result = await db.query(sql, params);
        return this.createResponse(true, result);
      } catch (error) {
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle(IpcChannels.DB_EXECUTE, async (event, sql: string, params: any[]) => {
      try {
        const result = await db.execute(sql, params);
        return this.createResponse(true, result);
      } catch (error) {
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    ipcMain.handle(IpcChannels.DB_INITIALIZE, async () => {
      try {
        await db.initialize();
        return this.createResponse(true, null, 'Base de datos inicializada');
      } catch (error) {
        return this.createResponse(false, null, (error as Error).message);
      }
    });

    // Autenticación
    ipcMain.handle(IpcChannels.AUTH_LOGIN, this.authHandler.login.bind(this.authHandler));
    ipcMain.handle(IpcChannels.AUTH_LOGOUT, this.authHandler.logout.bind(this.authHandler));
    ipcMain.handle(IpcChannels.AUTH_VERIFY_TOKEN, this.authHandler.verifyToken.bind(this.authHandler));

    // Productos
    ipcMain.handle(IpcChannels.PRODUCT_SEARCH, this.productHandler.search.bind(this.productHandler));
    ipcMain.handle(IpcChannels.PRODUCT_GET_BY_CODE, this.productHandler.getByCode.bind(this.productHandler));
    ipcMain.handle(IpcChannels.PRODUCT_GET_BY_ID, this.productHandler.getById.bind(this.productHandler));
    ipcMain.handle(IpcChannels.PRODUCT_UPDATE_STOCK, this.productHandler.updateStock.bind(this.productHandler));

    // Ventas
    ipcMain.handle(IpcChannels.SALE_CREATE, this.saleHandler.create.bind(this.saleHandler));
    ipcMain.handle(IpcChannels.SALE_CANCEL, this.saleHandler.cancel.bind(this.saleHandler));
    ipcMain.handle(IpcChannels.SALE_GET_BY_FOLIO, this.saleHandler.getByFolio.bind(this.saleHandler));
    ipcMain.handle(IpcChannels.SALE_GET_DAILY, this.saleHandler.getDaily.bind(this.saleHandler));

    // POS - Compatibilidad
    ipcMain.handle('pos:procesarVenta', this.saleHandler.procesarVenta.bind(this.saleHandler));
    ipcMain.handle('pos:getResumenVentas', this.saleHandler.getResumenVentas.bind(this.saleHandler));

    // Configuración
    ipcMain.handle(IpcChannels.CONFIG_GET_SUCURSAL, this.configHandler.getSucursal.bind(this.configHandler));
    ipcMain.handle(IpcChannels.CONFIG_UPDATE_SUCURSAL, this.configHandler.updateSucursal.bind(this.configHandler));
    ipcMain.handle(IpcChannels.CONFIG_GET_SYNC, this.configHandler.getSyncConfig.bind(this.configHandler));
    ipcMain.handle(IpcChannels.CONFIG_UPDATE_SYNC, this.configHandler.updateSyncConfig.bind(this.configHandler));
    ipcMain.handle('config:updateTicketConfig', this.configHandler.updateTicketConfig.bind(this.configHandler));

    // Reportes
    ipcMain.handle(IpcChannels.REPORT_DAILY_CLOSE, this.reportHandler.dailyClose.bind(this.reportHandler));
    ipcMain.handle(IpcChannels.REPORT_SALES, this.reportHandler.sales.bind(this.reportHandler));
    ipcMain.handle(IpcChannels.REPORT_INVENTORY, this.reportHandler.inventory.bind(this.reportHandler));
    ipcMain.handle('report:getSalesReport', this.reportHandler.getSalesReport.bind(this.reportHandler));

    // Respaldos
    ipcMain.handle(IpcChannels.BACKUP_CREATE, this.backupHandler.create.bind(this.backupHandler));
    ipcMain.handle(IpcChannels.BACKUP_RESTORE, this.backupHandler.restore.bind(this.backupHandler));
    ipcMain.handle(IpcChannels.BACKUP_EXPORT_USB, this.backupHandler.exportToUSB.bind(this.backupHandler));
    ipcMain.handle(IpcChannels.BACKUP_LIST, this.backupHandler.list.bind(this.backupHandler));
    ipcMain.handle(IpcChannels.BACKUP_DETECT_USB, this.backupHandler.detectUSB.bind(this.backupHandler));
    ipcMain.handle(IpcChannels.BACKUP_SELECT_FILE, this.backupHandler.selectFile.bind(this.backupHandler));
    ipcMain.handle(IpcChannels.BACKUP_SELECT_DIRECTORY, this.backupHandler.selectDirectory.bind(this.backupHandler));

    // Sincronización
    ipcMain.handle(IpcChannels.SYNC_START, this.syncHandler.start.bind(this.syncHandler));
    ipcMain.handle(IpcChannels.SYNC_STATUS, this.syncHandler.getStatus.bind(this.syncHandler));
    ipcMain.handle(IpcChannels.SYNC_CONFIGURE, this.syncHandler.configure.bind(this.syncHandler));
    ipcMain.handle(IpcChannels.SYNC_GET_LOGS, this.syncHandler.getLogs.bind(this.syncHandler));

    // PLM
    ipcMain.handle(IpcChannels.PLM_SEARCH, this.plmHandler.search.bind(this.plmHandler));
    ipcMain.handle(IpcChannels.PLM_GET_BY_ID, this.plmHandler.getById.bind(this.plmHandler));

    // Sistema
    ipcMain.handle(IpcChannels.SYSTEM_GET_INFO, this.systemHandler.getInfo.bind(this.systemHandler));
    ipcMain.handle(IpcChannels.SYSTEM_CHECK_ONLINE, this.systemHandler.checkOnline.bind(this.systemHandler));
    ipcMain.handle(IpcChannels.SYSTEM_GET_USB_DEVICES, this.systemHandler.getUSBDevices.bind(this.systemHandler));

    // Administración
    ipcMain.handle('admin:getUsers', this.adminHandler.getUsers.bind(this.adminHandler));
    ipcMain.handle('admin:getUserTypes', this.adminHandler.getUserTypes.bind(this.adminHandler));
    ipcMain.handle('admin:createUser', this.adminHandler.createUser.bind(this.adminHandler));
    ipcMain.handle('admin:updateUser', this.adminHandler.updateUser.bind(this.adminHandler));
    ipcMain.handle('admin:deleteUser', this.adminHandler.deleteUser.bind(this.adminHandler));
    ipcMain.handle('admin:createUserType', this.adminHandler.createUserType.bind(this.adminHandler));
    ipcMain.handle('admin:updateUserType', this.adminHandler.updateUserType.bind(this.adminHandler));
    ipcMain.handle('admin:deleteUserType', this.adminHandler.deleteUserType.bind(this.adminHandler));

    // Inventario
    ipcMain.handle('inventory:getProducts', this.inventoryHandler.getProducts.bind(this.inventoryHandler));
    ipcMain.handle('inventory:createProduct', this.inventoryHandler.createProduct.bind(this.inventoryHandler));
    ipcMain.handle('inventory:updateProduct', this.inventoryHandler.updateProduct.bind(this.inventoryHandler));
    ipcMain.handle('inventory:deleteProduct', this.inventoryHandler.deleteProduct.bind(this.inventoryHandler));
    ipcMain.handle('inventory:getLaboratorios', this.inventoryHandler.getLaboratorios.bind(this.inventoryHandler));
    ipcMain.handle('inventory:getProductStats', this.inventoryHandler.getProductStats.bind(this.inventoryHandler));
    ipcMain.handle('inventory:adjustStock', this.inventoryHandler.adjustStock.bind(this.inventoryHandler));
    ipcMain.handle('inventory:exportToCSV', this.inventoryHandler.exportToCSV.bind(this.inventoryHandler));
    ipcMain.handle('inventory:importFromCSV', this.inventoryHandler.importFromCSV.bind(this.inventoryHandler));

    console.log('Canales IPC configurados correctamente');
  }

  private createResponse<T>(success: boolean, data?: T, error?: string, message?: string): IpcResponse<T> {
    return {
      success,
      data,
      error,
      message
    };
  }

  removeAllListeners(): void {
    // Remover todos los listeners de IPC
    Object.values(IpcChannels).forEach(channel => {
      ipcMain.removeAllListeners(channel);
    });
  }
}

export const ipcManager = new IpcChannelManager();