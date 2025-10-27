import { db } from '../../database/connection.js';
export class ConfigHandler {
    async getSucursal(event) {
        try {
            const sucursal = await db.getSucursal();
            return {
                success: true,
                data: sucursal
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Error al obtener configuración de sucursal'
            };
        }
    }
    async updateSucursal(event, sucursal) {
        try {
            await db.updateSucursal(sucursal);
            return {
                success: true,
                message: 'Configuración de sucursal actualizada'
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Error al actualizar configuración'
            };
        }
    }
    async getSyncConfig(event) {
        try {
            // TODO: Implementar obtener configuración de sync
            return {
                success: true,
                data: null,
                message: 'Configuración de sync (pendiente)'
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Error al obtener configuración de sincronización'
            };
        }
    }
    async updateSyncConfig(event, config) {
        try {
            // TODO: Implementar actualizar configuración de sync
            return {
                success: true,
                message: 'Configuración de sync actualizada (pendiente)'
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Error al actualizar configuración de sincronización'
            };
        }
    }
    async updateTicketConfig(event, config) {
        try {
            // Usar el método existente updateSucursal
            await db.updateSucursal(config);
            return {
                success: true,
                message: 'Configuración del ticket actualizada correctamente'
            };
        }
        catch (error) {
            console.error('Error actualizando configuración de ticket:', error);
            return {
                success: false,
                error: error.message || 'Error al actualizar configuración del ticket'
            };
        }
    }
}
