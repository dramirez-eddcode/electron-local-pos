import type { IpcResponse } from '../../../shared/types/index.js';
import type { DatabaseService } from '../../database/connection.js';

export class ReportHandler {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async getSalesReport(event: any, params: {
    startDate: string;
    endDate: string;
    sucursalId: string
  }): Promise<IpcResponse<any>> {
    try {
      const { startDate, endDate, sucursalId } = params;

      // Obtener ventas del período
      const ventas = await this.db.query(`
        SELECT
          s.ID_SALIDA,
          s.FOLIO_SALIDA,
          s.FECHA_SALIDA,
          s.TOTAL_SALIDA,
          s.TIPO_PAGO,
          s.MONTO_EFECTIVO,
          s.MONTO_TARJETA,
          s.ID_USUARIO,
          u.NOMBRE_USUARIO
        FROM SALIDA s
        LEFT JOIN USUARIO u ON s.ID_USUARIO = u.ID_USUARIO
        WHERE DATE(s.FECHA_SALIDA) BETWEEN DATE(?) AND DATE(?)
          AND s.SUCURSAL_ID = ?
          AND s.CANCELADA = 0
        ORDER BY s.FECHA_SALIDA DESC
      `, [startDate, endDate, sucursalId]);

      // Calcular estadísticas
      const totalVentas = ventas.reduce((sum: number, v: any) => sum + (v.TOTAL_SALIDA || 0), 0);
      const totalEfectivo = ventas.reduce((sum: number, v: any) => sum + (v.MONTO_EFECTIVO || 0), 0);
      const totalTarjeta = ventas.reduce((sum: number, v: any) => sum + (v.MONTO_TARJETA || 0), 0);
      const cantidadVentas = ventas.length;
      const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

      // Obtener productos más vendidos del período
      const productosVendidos = await this.db.query(`
        SELECT
          p.ID_PRODUCTO,
          p.CODIGO_PRODUCTO,
          p.NOMBRE_PRODUCTO,
          SUM(ms.CANTIDAD_SALIDA) as cantidad_vendida,
          SUM(ms.CANTIDAD_SALIDA * ms.PRECIO_UNITARIO) as total_vendido,
          p.PRECIO_PRODUCTO as precio_actual
        FROM MOVSALIDA ms
        INNER JOIN SALIDA s ON ms.ID_SALIDA = s.ID_SALIDA
        INNER JOIN PRODUCTO p ON ms.ID_PRODUCTO = p.ID_PRODUCTO
        WHERE DATE(s.FECHA_SALIDA) BETWEEN DATE(?) AND DATE(?)
          AND s.SUCURSAL_ID = ?
          AND s.CANCELADA = 0
        GROUP BY p.ID_PRODUCTO, p.CODIGO_PRODUCTO, p.NOMBRE_PRODUCTO, p.PRECIO_PRODUCTO
        ORDER BY cantidad_vendida DESC
        LIMIT 10
      `, [startDate, endDate, sucursalId]);

      // Ventas por día
      const ventasPorDia = await this.db.query(`
        SELECT
          DATE(FECHA_SALIDA) as fecha,
          COUNT(*) as num_ventas,
          SUM(TOTAL_SALIDA) as total,
          SUM(MONTO_EFECTIVO) as efectivo,
          SUM(MONTO_TARJETA) as tarjeta
        FROM SALIDA
        WHERE DATE(FECHA_SALIDA) BETWEEN DATE(?) AND DATE(?)
          AND SUCURSAL_ID = ?
          AND CANCELADA = 0
        GROUP BY DATE(FECHA_SALIDA)
        ORDER BY DATE(FECHA_SALIDA) ASC
      `, [startDate, endDate, sucursalId]);

      return {
        success: true,
        data: {
          resumen: {
            totalVentas,
            totalEfectivo,
            totalTarjeta,
            cantidadVentas,
            ticketPromedio
          },
          ventas,
          productosVendidos,
          ventasPorDia
        }
      };
    } catch (error: any) {
      console.error('Error generando reporte de ventas:', error);
      return {
        success: false,
        error: error.message || 'Error al generar reporte de ventas'
      };
    }
  }

  async dailyClose(event: any, date: string): Promise<IpcResponse<any>> {
    try {
      // TODO: Implementar corte diario
      return {
        success: true,
        data: {},
        message: 'Corte diario (funcionalidad pendiente)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al generar corte diario'
      };
    }
  }

  async sales(event: any, filters: any): Promise<IpcResponse<any[]>> {
    try {
      // TODO: Implementar reporte de ventas
      return {
        success: true,
        data: [],
        message: 'Reporte de ventas (funcionalidad pendiente)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al generar reporte de ventas'
      };
    }
  }

  async inventory(event: any): Promise<IpcResponse<any[]>> {
    try {
      // TODO: Implementar reporte de inventario
      return {
        success: true,
        data: [],
        message: 'Reporte de inventario (funcionalidad pendiente)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al generar reporte de inventario'
      };
    }
  }
}