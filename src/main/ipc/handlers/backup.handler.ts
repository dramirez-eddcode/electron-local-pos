import { dialog } from 'electron';
import type { IpcResponse } from '../../../shared/types/index.js';
import { BackupService, type BackupResult, type RestoreResult } from '../../services/backup.service.js';
import { DatabaseService } from '../../database/connection.js';

export class BackupHandler {
  private backupService: BackupService;

  constructor(private db: DatabaseService) {
    this.backupService = new BackupService(db);
  }

  async create(event: any, description?: string): Promise<IpcResponse<BackupResult>> {
    try {
      const result = await this.backupService.createBackup(description);
      return {
        success: result.success,
        data: result,
        message: result.success ? 'Respaldo creado exitosamente' : result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear respaldo'
      };
    }
  }

  async restore(event: any, backupPath: string): Promise<IpcResponse<RestoreResult>> {
    try {
      const result = await this.backupService.restoreBackup(backupPath);
      return {
        success: result.success,
        data: result,
        message: result.success ? 'Respaldo restaurado exitosamente' : result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al restaurar respaldo'
      };
    }
  }

  async exportToUSB(event: any, usbPath: string, backupFilePath?: string): Promise<IpcResponse<BackupResult>> {
    try {
      const result = await this.backupService.exportToUSB(usbPath, backupFilePath);
      return {
        success: result.success,
        data: result,
        message: result.success ? 'Exportado a USB exitosamente' : result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al exportar a USB'
      };
    }
  }

  async list(event: any): Promise<IpcResponse<any[]>> {
    try {
      const backups = await this.backupService.getAvailableBackups();
      return {
        success: true,
        data: backups,
        message: 'Lista de respaldos obtenida'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al listar respaldos'
      };
    }
  }

  async detectUSB(event: any): Promise<IpcResponse<Array<{ path: string; name: string; }>>> {
    try {
      const devices = await this.backupService.detectUSBDevices();
      return {
        success: true,
        data: devices,
        message: 'Dispositivos USB detectados'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al detectar dispositivos USB'
      };
    }
  }

  async selectFile(event: any): Promise<IpcResponse<{ filePath?: string; canceled?: boolean }>> {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Seleccionar archivo de respaldo',
        filters: [
          { name: 'Respaldos Farmacias MS', extensions: ['fmsbackup'] },
          { name: 'Todos los archivos', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return {
          success: true,
          data: { canceled: true },
          message: 'Selección cancelada'
        };
      }

      return {
        success: true,
        data: { filePath: result.filePaths[0] },
        message: 'Archivo seleccionado'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al seleccionar archivo'
      };
    }
  }

  async selectDirectory(event: any): Promise<IpcResponse<{ directoryPath?: string; canceled?: boolean }>> {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Seleccionar directorio para guardar respaldo',
        properties: ['openDirectory']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return {
          success: true,
          data: { canceled: true },
          message: 'Selección cancelada'
        };
      }

      return {
        success: true,
        data: { directoryPath: result.filePaths[0] },
        message: 'Directorio seleccionado'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al seleccionar directorio'
      };
    }
  }
}