import { db } from '../../database/connection.js';
import type { IpcResponse, Sucursal, ConfiguracionSincronizacion } from '../../../shared/types/index.js';

export class ConfigHandler {
  async getSucursal(event: any): Promise<IpcResponse<Sucursal | null>> {
    try {
      const sucursal = await db.getSucursal();
      return {
        success: true,
        data: sucursal
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener configuración de sucursal'
      };
    }
  }

  async updateSucursal(event: any, sucursal: Partial<Sucursal>): Promise<IpcResponse<void>> {
    try {
      await db.updateSucursal(sucursal);
      return {
        success: true,
        message: 'Configuración de sucursal actualizada'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al actualizar configuración'
      };
    }
  }

  async getSyncConfig(event: any): Promise<IpcResponse<ConfiguracionSincronizacion | null>> {
    try {
      // TODO: Implementar obtener configuración de sync
      return {
        success: true,
        data: null,
        message: 'Configuración de sync (pendiente)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener configuración de sincronización'
      };
    }
  }

  async updateSyncConfig(event: any, config: Partial<ConfiguracionSincronizacion>): Promise<IpcResponse<void>> {
    try {
      // TODO: Implementar actualizar configuración de sync
      return {
        success: true,
        message: 'Configuración de sync actualizada (pendiente)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al actualizar configuración de sincronización'
      };
    }
  }

  async updateTicketConfig(event: any, config: {
    NOMBRE_SUCURSAL: string;
    RAZON_SOCIAL: string;
    DIRECCION: string;
    TELEFONO?: string;
    RFC?: string;
    LOGO_PATH?: string;
  }): Promise<IpcResponse<void>> {
    try {
      // Usar el método existente updateSucursal
      await db.updateSucursal(config);
      return {
        success: true,
        message: 'Configuración del ticket actualizada correctamente'
      };
    } catch (error: any) {
      console.error('Error actualizando configuración de ticket:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar configuración del ticket'
      };
    }
  }
}