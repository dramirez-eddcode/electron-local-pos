import { app } from 'electron';
import type { IpcResponse } from '../../../shared/types/index.js';

export class SystemHandler {
  async getInfo(event: any): Promise<IpcResponse<any>> {
    try {
      const info = {
        version: app.getVersion(),
        platform: process.platform,
        appPath: app.getAppPath(),
        userData: app.getPath('userData'),
        name: app.getName()
      };
      
      return {
        success: true,
        data: info
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener información del sistema'
      };
    }
  }

  async checkOnline(event: any): Promise<IpcResponse<boolean>> {
    try {
      // Verificar conectividad básica
      const isOnline = navigator.onLine;
      
      return {
        success: true,
        data: isOnline
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al verificar conectividad'
      };
    }
  }

  async getUSBDevices(event: any): Promise<IpcResponse<any[]>> {
    try {
      // TODO: Implementar detección de dispositivos USB
      return {
        success: true,
        data: [],
        message: 'Detección USB (funcionalidad pendiente)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al detectar dispositivos USB'
      };
    }
  }
}