import { db } from '../../database/connection.js';
import type { IpcResponse, Producto } from '../../../shared/types/index.js';

export class ProductHandler {
  async search(event: any, query: { 
    term: string; 
    type: 'nombre' | 'sustancia' | 'codigo'; 
    limit?: number 
  }): Promise<IpcResponse<Producto[]>> {
    try {
      const { term, type, limit = 50 } = query;
      
      let sql = `
        SELECT p.*, l.nombre_laboratorio
        FROM PRODUCTO p
        LEFT JOIN LABORATORIO l ON p.ID_LABORATORIO = l.id_laboratorio
        WHERE p.ACTIVO = 1
      `;
      
      let params: any[] = [];
      
      switch (type) {
        case 'nombre':
          sql += ' AND p.NOMBRE_PRODUCTO LIKE ?';
          params.push(`%${term}%`);
          break;
        case 'sustancia':
          sql += ' AND p.SUSTANCIA_PRODUCTO LIKE ?';
          params.push(`%${term}%`);
          break;
        case 'codigo':
          sql += ' AND p.CODIGO_PRODUCTO LIKE ?';
          params.push(`%${term}%`);
          break;
      }
      
      sql += ' ORDER BY p.NOMBRE_PRODUCTO LIMIT ?';
      params.push(limit);
      
      const productos = await db.query(sql, params);
      
      return {
        success: true,
        data: productos
      };
      
    } catch (error) {
      console.error('Error buscando productos:', error);
      return {
        success: false,
        error: 'Error al buscar productos'
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