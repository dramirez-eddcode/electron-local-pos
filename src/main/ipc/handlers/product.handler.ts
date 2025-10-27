import { db } from '../../database/connection.js';
import type { IpcResponse, Producto } from '../../../shared/types/index.js';

export class ProductHandler {
  async search(event: any, searchParams: any): Promise<IpcResponse<Producto[]>> {
    try {
      console.log('Searching products with params:', searchParams);

      // Soportar diferentes formatos de parámetros
      let term: string;
      let sucursalId: string | undefined;
      let limit = 50;

      if (typeof searchParams === 'string') {
        // Formato simple: solo el término de búsqueda
        term = searchParams;
      } else if (searchParams.query) {
        // Formato del POS: { query: 'término', sucursalId: 'id' }
        term = searchParams.query;
        sucursalId = searchParams.sucursalId;
        limit = searchParams.limit || 50;
      } else if (searchParams.term) {
        // Formato original: { term: 'término', type: 'tipo' }
        term = searchParams.term;
        limit = searchParams.limit || 50;
      } else {
        return {
          success: false,
          error: 'Parámetros de búsqueda inválidos'
        };
      }

      if (!term || term.trim().length < 1) {
        return {
          success: true,
          data: []
        };
      }

      let sql = `
        SELECT p.*, l.nombre_laboratorio
        FROM PRODUCTO p
        LEFT JOIN LABORATORIO l ON p.ID_LABORATORIO = l.id_laboratorio
        WHERE p.ACTIVO = 1
      `;

      let params: any[] = [];

      // Filtrar por sucursal si se proporciona
      if (sucursalId) {
        sql += ' AND p.SUCURSAL_ID = ?';
        params.push(sucursalId);
      }

      // Búsqueda flexible en múltiples campos
      sql += ` AND (
        p.NOMBRE_PRODUCTO LIKE ? OR
        p.CODIGO_PRODUCTO LIKE ? OR
        p.SUSTANCIA_PRODUCTO LIKE ?
      )`;

      const searchTerm = `%${term}%`;
      params.push(searchTerm, searchTerm, searchTerm);

      sql += ' ORDER BY p.NOMBRE_PRODUCTO LIMIT ?';
      params.push(limit);

      console.log('Executing query:', sql);
      console.log('With params:', params);

      const productos = await db.query(sql, params);

      console.log(`Found ${productos?.length || 0} products`);

      return {
        success: true,
        data: productos || []
      };

    } catch (error) {
      console.error('Error buscando productos:', error);
      return {
        success: false,
        error: `Error al buscar productos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  async getByCode(event: any, codigo: string): Promise<IpcResponse<Producto | null>> {
    try {
      const productos = await db.query(`
        SELECT p.*, l.nombre_laboratorio
        FROM PRODUCTO p
        LEFT JOIN LABORATORIO l ON p.ID_LABORATORIO = l.id_laboratorio
        WHERE p.CODIGO_PRODUCTO = ? AND p.ACTIVO = 1
        LIMIT 1
      `, [codigo]);
      
      return {
        success: true,
        data: productos.length > 0 ? productos[0] : null
      };
      
    } catch (error) {
      console.error('Error obteniendo producto por código:', error);
      return {
        success: false,
        error: 'Error al obtener producto'
      };
    }
  }

  async getById(event: any, id: number): Promise<IpcResponse<Producto | null>> {
    try {
      const productos = await db.query(`
        SELECT p.*, l.nombre_laboratorio
        FROM PRODUCTO p
        LEFT JOIN LABORATORIO l ON p.ID_LABORATORIO = l.id_laboratorio
        WHERE p.ID_PRODUCTO = ? AND p.ACTIVO = 1
        LIMIT 1
      `, [id]);
      
      return {
        success: true,
        data: productos.length > 0 ? productos[0] : null
      };
      
    } catch (error) {
      console.error('Error obteniendo producto por ID:', error);
      return {
        success: false,
        error: 'Error al obtener producto'
      };
    }
  }

  async updateStock(event: any, data: { 
    productId: number; 
    quantity: number; 
    operation: 'add' | 'subtract' 
  }): Promise<IpcResponse<void>> {
    try {
      const { productId, quantity, operation } = data;
      
      // Verificar producto existe
      const producto = await db.query(
        'SELECT CANTIDAD_PRODUCTO FROM PRODUCTO WHERE ID_PRODUCTO = ? AND ACTIVO = 1',
        [productId]
      );
      
      if (producto.length === 0) {
        return {
          success: false,
          error: 'Producto no encontrado'
        };
      }
      
      const currentStock = producto[0].CANTIDAD_PRODUCTO;
      let newStock: number;
      
      if (operation === 'add') {
        newStock = currentStock + quantity;
      } else {
        newStock = currentStock - quantity;
        if (newStock < 0) {
          return {
            success: false,
            error: 'Stock insuficiente'
          };
        }
      }
      
      await db.execute(
        'UPDATE PRODUCTO SET CANTIDAD_PRODUCTO = ? WHERE ID_PRODUCTO = ?',
        [newStock, productId]
      );
      
      return {
        success: true,
        message: 'Stock actualizado correctamente'
      };
      
    } catch (error) {
      console.error('Error actualizando stock:', error);
      return {
        success: false,
        error: 'Error al actualizar stock'
      };
    }
  }

  async checkStock(event: any, productId: number, requiredQuantity: number): Promise<IpcResponse<boolean>> {
    try {
      const producto = await db.query(
        'SELECT CANTIDAD_PRODUCTO FROM PRODUCTO WHERE ID_PRODUCTO = ? AND ACTIVO = 1',
        [productId]
      );
      
      if (producto.length === 0) {
        return {
          success: false,
          error: 'Producto no encontrado'
        };
      }
      
      const available = producto[0].CANTIDAD_PRODUCTO >= requiredQuantity;
      
      return {
        success: true,
        data: available
      };
      
    } catch (error) {
      console.error('Error verificando stock:', error);
      return {
        success: false,
        error: 'Error al verificar stock'
      };
    }
  }
}