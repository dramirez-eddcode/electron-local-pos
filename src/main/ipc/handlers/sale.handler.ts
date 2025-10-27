import { db } from '../../database/connection.js';
import type { IpcResponse, Salida, ItemCarrito } from '../../../shared/types/index.js';

export class SaleHandler {
  async create(event: any, saleData: {
    items: ItemCarrito[];
    total: number;
    tipoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
    montoEfectivo?: number;
    montoTarjeta?: number;
    datosTarjeta?: any;
    userId: number;
    sucursalId: string;
  }): Promise<IpcResponse<{ folio: string; saleId: number }>> {
    try {
      console.log('Procesando venta:', saleData);

      // Validar que hay items
      if (!saleData.items || saleData.items.length === 0) {
        return {
          success: false,
          error: 'No hay productos en la venta'
        };
      }

      // Validar stock disponible antes de procesar
      for (const item of saleData.items) {
        const stockResult = await db.query(
          'SELECT CANTIDAD_PRODUCTO FROM PRODUCTO WHERE ID_PRODUCTO = ?',
          [item.ID_PRODUCTO]
        );

        if (!stockResult || stockResult.length === 0) {
          return {
            success: false,
            error: `Producto ${item.NOMBRE_PRODUCTO} no encontrado`
          };
        }

        const stockActual = stockResult[0].CANTIDAD_PRODUCTO;
        if (stockActual < item.cantidad) {
          return {
            success: false,
            error: `Stock insuficiente para ${item.NOMBRE_PRODUCTO}. Disponible: ${stockActual}, Solicitado: ${item.cantidad}`
          };
        }
      }

      // Generar folio único
      const timestamp = Date.now().toString();
      const folio = `POS${timestamp.slice(-8)}`;

      // Calcular subtotal e IVA (asumiendo IVA del 16%)
      const iva = saleData.total * 0.16;
      const subtotal = saleData.total - iva;

      // Insertar venta principal
      const ventaResult = await db.execute(`
        INSERT INTO SALIDA (
          FOLIO_SALIDA, FECHA_SALIDA, TOTAL_SALIDA, SUBTOTAL_SALIDA, IVA_SALIDA,
          TIPO_PAGO, MONTO_EFECTIVO, MONTO_TARJETA, ID_USUARIO, SUCURSAL_ID,
          CANCELADA, SINCRONIZADO
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `, [
        folio,
        new Date().toISOString(),
        saleData.total,
        subtotal,
        iva,
        saleData.tipoPago,
        saleData.montoEfectivo || 0,
        saleData.montoTarjeta || 0,
        saleData.userId,
        saleData.sucursalId
      ]);

      const saleId = ventaResult.lastID;

      // Insertar movimientos de salida y actualizar stock
      for (const item of saleData.items) {
        // Insertar movimiento de salida
        await db.execute(`
          INSERT INTO MOVSALIDA (
            ID_SALIDA, ID_PRODUCTO, CANTIDAD_SALIDA, PRECIO_UNITARIO, SUBTOTAL
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          saleId,
          item.ID_PRODUCTO,
          item.cantidad,
          item.precio,
          item.subtotal
        ]);

        // Actualizar stock del producto
        await db.execute(`
          UPDATE PRODUCTO
          SET CANTIDAD_PRODUCTO = CANTIDAD_PRODUCTO - ?,
              FECHA_MODIFICACION = CURRENT_TIMESTAMP
          WHERE ID_PRODUCTO = ?
        `, [item.cantidad, item.ID_PRODUCTO]);

        console.log(`Stock actualizado para producto ${item.ID_PRODUCTO}: -${item.cantidad}`);
      }

      console.log(`Venta procesada exitosamente. Folio: ${folio}, ID: ${saleId}`);

      return {
        success: true,
        data: { folio, saleId: Number(saleId) },
        message: 'Venta procesada exitosamente'
      };

    } catch (error) {
      console.error('Error procesando venta:', error);
      return {
        success: false,
        error: `Error al crear venta: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  // Método para procesar venta desde POS (compatibilidad)
  async procesarVenta(event: any, ventaData: {
    items: ItemCarrito[];
    total: number;
    tipoPago: 'EFECTIVO' | 'TARJETA';
    efectivo?: number;
    cambio?: number;
    usuario: string;
    sucursal: string;
    fecha: string;
  }): Promise<IpcResponse<{ folio: string; saleId: number }>> {
    try {
      // Obtener datos del usuario actual desde el contexto o base de datos
      const userResult = await db.query(
        'SELECT ID_USUARIO, SUCURSAL_ID FROM USUARIO WHERE NOMBRE_USUARIO = ? AND ACTIVO = 1 LIMIT 1',
        [ventaData.usuario]
      );

      if (!userResult || userResult.length === 0) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const userData = userResult[0];

      // Convertir formato de ventaData al formato de saleData
      const saleData = {
        items: ventaData.items,
        total: ventaData.total,
        tipoPago: ventaData.tipoPago,
        montoEfectivo: ventaData.tipoPago === 'EFECTIVO' ? ventaData.efectivo || ventaData.total : 0,
        montoTarjeta: ventaData.tipoPago === 'TARJETA' ? ventaData.total : 0,
        userId: userData.ID_USUARIO,
        sucursalId: userData.SUCURSAL_ID
      };

      return await this.create(event, saleData);

    } catch (error) {
      console.error('Error en procesarVenta:', error);
      return {
        success: false,
        error: `Error procesando venta: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  async cancel(event: any, saleId: number, reason: string): Promise<IpcResponse<void>> {
    try {
      // TODO: Implementar cancelación de venta
      return {
        success: true,
        message: 'Venta cancelada (funcionalidad pendiente)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al cancelar venta'
      };
    }
  }

  async getByFolio(event: any, folio: string): Promise<IpcResponse<Salida | null>> {
    try {
      // TODO: Implementar búsqueda por folio
      return {
        success: true,
        data: null,
        message: 'Búsqueda por folio (funcionalidad pendiente)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al buscar venta'
      };
    }
  }

  async getDaily(event: any, date: string): Promise<IpcResponse<Salida[]>> {
    try {
      const ventas = await db.query(`
        SELECT * FROM SALIDA
        WHERE DATE(FECHA_SALIDA) = DATE(?)
        AND CANCELADA = 0
        ORDER BY FECHA_SALIDA DESC
      `, [date]);

      return {
        success: true,
        data: ventas || [],
        message: 'Ventas del día obtenidas'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener ventas del día'
      };
    }
  }

  // Método para obtener resumen de ventas (usado por Corte de Caja)
  async getResumenVentas(event: any, params: { fechaInicio: string; fechaFin: string }): Promise<IpcResponse<any>> {
    try {
      console.log('Obteniendo resumen de ventas del', params.fechaInicio, 'al', params.fechaFin);

      // Consulta principal para el resumen
      const resumenQuery = await db.query(`
        SELECT
          COUNT(*) as foliosVendidos,
          COALESCE(SUM(CASE WHEN TIPO_PAGO = 'EFECTIVO' THEN TOTAL_SALIDA ELSE 0 END), 0) as totalEfectivo,
          COALESCE(SUM(CASE WHEN TIPO_PAGO = 'TARJETA' THEN TOTAL_SALIDA ELSE 0 END), 0) as totalTarjeta,
          COALESCE(SUM(TOTAL_SALIDA), 0) as totalGeneral,
          COUNT(CASE WHEN CANCELADA = 1 THEN 1 END) as notasCanceladas,
          COALESCE(SUM(CASE WHEN CANCELADA = 1 THEN TOTAL_SALIDA ELSE 0 END), 0) as montoNotasCanceladas,
          MIN(FOLIO_SALIDA) as primerFolio,
          MAX(FOLIO_SALIDA) as ultimoFolio
        FROM SALIDA
        WHERE DATE(FECHA_SALIDA) BETWEEN DATE(?) AND DATE(?)
      `, [params.fechaInicio, params.fechaFin]);

      // Detalle de ventas
      const ventasDetalle = await db.query(`
        SELECT
          FOLIO_SALIDA as folio,
          FECHA_SALIDA as fecha,
          TOTAL_SALIDA as total,
          TIPO_PAGO as tipoPago,
          CANCELADA as cancelada,
          u.NOMBRE_USUARIO as usuario
        FROM SALIDA s
        LEFT JOIN USUARIO u ON s.ID_USUARIO = u.ID_USUARIO
        WHERE DATE(s.FECHA_SALIDA) BETWEEN DATE(?) AND DATE(?)
        ORDER BY s.FECHA_SALIDA DESC
      `, [params.fechaInicio, params.fechaFin]);

      const resumen = resumenQuery[0] || {
        foliosVendidos: 0,
        totalEfectivo: 0,
        totalTarjeta: 0,
        totalGeneral: 0,
        notasCanceladas: 0,
        montoNotasCanceladas: 0,
        primerFolio: 'N/A',
        ultimoFolio: 'N/A'
      };

      const data = {
        ...resumen,
        ventasDetalle: ventasDetalle || []
      };

      console.log('Resumen de ventas:', data);

      return {
        success: true,
        data,
        message: 'Resumen de ventas obtenido exitosamente'
      };

    } catch (error) {
      console.error('Error obteniendo resumen de ventas:', error);
      return {
        success: false,
        error: `Error al obtener resumen de ventas: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
}