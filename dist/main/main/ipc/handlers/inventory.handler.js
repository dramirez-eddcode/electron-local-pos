export class InventoryHandler {
    constructor(db) {
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.db = db;
    }
    async getProducts(event, params) {
        try {
            const { sucursalId, search, limit = 50, offset = 0, lowStock = false } = params;
            let query = `
        SELECT
          p.ID_PRODUCTO,
          p.CODIGO_PRODUCTO,
          p.NOMBRE_PRODUCTO,
          p.SUSTANCIA_PRODUCTO,
          p.CANTIDAD_PRODUCTO,
          p.PRECIO_PRODUCTO,
          p.COSTO_PRODUCTO,
          p.MAX_PRODUCTO,
          p.MIN_PRODUCTO,
          p.IVA_PRODUCTO,
          p.ID_LABORATORIO,
          l.nombre_laboratorio as NOMBRE_LABORATORIO,
          p.ACTIVO,
          p.FECHA_CREACION,
          p.FECHA_MODIFICACION
        FROM PRODUCTO p
        LEFT JOIN LABORATORIO l ON p.ID_LABORATORIO = l.id_laboratorio
        WHERE p.SUCURSAL_ID = ?
      `;
            const queryParams = [sucursalId];
            // Filtro de búsqueda
            if (search && search.trim()) {
                query += ` AND (
          p.CODIGO_PRODUCTO LIKE ? OR
          p.NOMBRE_PRODUCTO LIKE ? OR
          p.SUSTANCIA_PRODUCTO LIKE ?
        )`;
                const searchParam = `%${search.trim()}%`;
                queryParams.push(searchParam, searchParam, searchParam);
            }
            // Filtro de stock bajo
            if (lowStock) {
                query += ` AND p.CANTIDAD_PRODUCTO <= p.MIN_PRODUCTO`;
            }
            // Obtener total de registros
            const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
            const countResult = await this.db.query(countQuery, queryParams);
            const total = countResult[0]?.total || 0;
            // Agregar ordenamiento y paginación
            query += ` ORDER BY p.NOMBRE_PRODUCTO ASC LIMIT ? OFFSET ?`;
            queryParams.push(limit, offset);
            const productos = await this.db.query(query, queryParams);
            return {
                success: true,
                data: {
                    productos,
                    total,
                    limit,
                    offset
                }
            };
        }
        catch (error) {
            console.error('Error obteniendo productos:', error);
            return {
                success: false,
                error: error.message || 'Error al obtener productos'
            };
        }
    }
    async createProduct(event, productData) {
        try {
            const { CODIGO_PRODUCTO, NOMBRE_PRODUCTO, SUSTANCIA_PRODUCTO, CANTIDAD_PRODUCTO, PRECIO_PRODUCTO, COSTO_PRODUCTO, MAX_PRODUCTO, MIN_PRODUCTO, IVA_PRODUCTO, ID_LABORATORIO, SUCURSAL_ID } = productData;
            // Verificar que no exista el código de producto
            const existing = await this.db.query('SELECT ID_PRODUCTO FROM PRODUCTO WHERE CODIGO_PRODUCTO = ? AND SUCURSAL_ID = ?', [CODIGO_PRODUCTO, SUCURSAL_ID]);
            if (existing.length > 0) {
                return {
                    success: false,
                    error: 'Ya existe un producto con ese código'
                };
            }
            const result = await this.db.execute(`
        INSERT INTO PRODUCTO (
          CODIGO_PRODUCTO,
          NOMBRE_PRODUCTO,
          SUSTANCIA_PRODUCTO,
          CANTIDAD_PRODUCTO,
          PRECIO_PRODUCTO,
          COSTO_PRODUCTO,
          MAX_PRODUCTO,
          MIN_PRODUCTO,
          IVA_PRODUCTO,
          ID_LABORATORIO,
          SUCURSAL_ID,
          ACTIVO,
          SINCRONIZADO,
          FECHA_CREACION,
          FECHA_MODIFICACION
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))
      `, [
                CODIGO_PRODUCTO,
                NOMBRE_PRODUCTO,
                SUSTANCIA_PRODUCTO || null,
                CANTIDAD_PRODUCTO || 0,
                PRECIO_PRODUCTO,
                COSTO_PRODUCTO || 0,
                MAX_PRODUCTO || 100,
                MIN_PRODUCTO || 5,
                IVA_PRODUCTO ? 1 : 0,
                ID_LABORATORIO || null,
                SUCURSAL_ID
            ]);
            return {
                success: true,
                data: { id: result.lastID },
                message: 'Producto creado correctamente'
            };
        }
        catch (error) {
            console.error('Error creando producto:', error);
            return {
                success: false,
                error: error.message || 'Error al crear producto'
            };
        }
    }
    async updateProduct(event, params) {
        try {
            const { ID_PRODUCTO, productData } = params;
            const { CODIGO_PRODUCTO, NOMBRE_PRODUCTO, SUSTANCIA_PRODUCTO, CANTIDAD_PRODUCTO, PRECIO_PRODUCTO, COSTO_PRODUCTO, MAX_PRODUCTO, MIN_PRODUCTO, IVA_PRODUCTO, ID_LABORATORIO, ACTIVO } = productData;
            // Verificar que no exista otro producto con el mismo código
            const existing = await this.db.query('SELECT ID_PRODUCTO FROM PRODUCTO WHERE CODIGO_PRODUCTO = ? AND ID_PRODUCTO != ?', [CODIGO_PRODUCTO, ID_PRODUCTO]);
            if (existing.length > 0) {
                return {
                    success: false,
                    error: 'Ya existe otro producto con ese código'
                };
            }
            await this.db.execute(`
        UPDATE PRODUCTO SET
          CODIGO_PRODUCTO = ?,
          NOMBRE_PRODUCTO = ?,
          SUSTANCIA_PRODUCTO = ?,
          CANTIDAD_PRODUCTO = ?,
          PRECIO_PRODUCTO = ?,
          COSTO_PRODUCTO = ?,
          MAX_PRODUCTO = ?,
          MIN_PRODUCTO = ?,
          IVA_PRODUCTO = ?,
          ID_LABORATORIO = ?,
          ACTIVO = ?,
          SINCRONIZADO = 0,
          FECHA_MODIFICACION = datetime('now')
        WHERE ID_PRODUCTO = ?
      `, [
                CODIGO_PRODUCTO,
                NOMBRE_PRODUCTO,
                SUSTANCIA_PRODUCTO || null,
                CANTIDAD_PRODUCTO,
                PRECIO_PRODUCTO,
                COSTO_PRODUCTO || 0,
                MAX_PRODUCTO,
                MIN_PRODUCTO,
                IVA_PRODUCTO ? 1 : 0,
                ID_LABORATORIO || null,
                ACTIVO ? 1 : 0,
                ID_PRODUCTO
            ]);
            return {
                success: true,
                message: 'Producto actualizado correctamente'
            };
        }
        catch (error) {
            console.error('Error actualizando producto:', error);
            return {
                success: false,
                error: error.message || 'Error al actualizar producto'
            };
        }
    }
    async deleteProduct(event, ID_PRODUCTO) {
        try {
            // Desactivar en lugar de eliminar (soft delete)
            await this.db.execute('UPDATE PRODUCTO SET ACTIVO = 0, FECHA_MODIFICACION = datetime("now") WHERE ID_PRODUCTO = ?', [ID_PRODUCTO]);
            return {
                success: true,
                message: 'Producto desactivado correctamente'
            };
        }
        catch (error) {
            console.error('Error eliminando producto:', error);
            return {
                success: false,
                error: error.message || 'Error al eliminar producto'
            };
        }
    }
    async getLaboratorios(event) {
        try {
            const laboratorios = await this.db.query('SELECT * FROM LABORATORIO ORDER BY nombre_laboratorio ASC');
            return {
                success: true,
                data: laboratorios
            };
        }
        catch (error) {
            console.error('Error obteniendo laboratorios:', error);
            return {
                success: false,
                error: error.message || 'Error al obtener laboratorios'
            };
        }
    }
    async getProductStats(event, sucursalId) {
        try {
            // Estadísticas generales
            const stats = await this.db.query(`
        SELECT
          COUNT(*) as total_productos,
          SUM(CANTIDAD_PRODUCTO) as total_stock,
          SUM(CASE WHEN CANTIDAD_PRODUCTO <= MIN_PRODUCTO THEN 1 ELSE 0 END) as productos_bajo_stock,
          SUM(CASE WHEN CANTIDAD_PRODUCTO = 0 THEN 1 ELSE 0 END) as productos_sin_stock,
          SUM(CANTIDAD_PRODUCTO * COSTO_PRODUCTO) as valor_inventario_costo,
          SUM(CANTIDAD_PRODUCTO * PRECIO_PRODUCTO) as valor_inventario_venta
        FROM PRODUCTO
        WHERE SUCURSAL_ID = ? AND ACTIVO = 1
      `, [sucursalId]);
            return {
                success: true,
                data: stats[0] || {}
            };
        }
        catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                success: false,
                error: error.message || 'Error al obtener estadísticas'
            };
        }
    }
    async exportToCSV(event, params) {
        try {
            const { sucursalId, search, lowStock = false } = params;
            let query = `
        SELECT
          p.CODIGO_PRODUCTO,
          p.NOMBRE_PRODUCTO,
          p.SUSTANCIA_PRODUCTO,
          p.CANTIDAD_PRODUCTO,
          p.PRECIO_PRODUCTO,
          p.COSTO_PRODUCTO,
          p.MAX_PRODUCTO,
          p.MIN_PRODUCTO,
          p.IVA_PRODUCTO,
          l.nombre_laboratorio as NOMBRE_LABORATORIO,
          p.ACTIVO
        FROM PRODUCTO p
        LEFT JOIN LABORATORIO l ON p.ID_LABORATORIO = l.id_laboratorio
        WHERE p.SUCURSAL_ID = ?
      `;
            const queryParams = [sucursalId];
            // Filtro de búsqueda
            if (search && search.trim()) {
                query += ` AND (
          p.CODIGO_PRODUCTO LIKE ? OR
          p.NOMBRE_PRODUCTO LIKE ? OR
          p.SUSTANCIA_PRODUCTO LIKE ?
        )`;
                const searchParam = `%${search.trim()}%`;
                queryParams.push(searchParam, searchParam, searchParam);
            }
            // Filtro de stock bajo
            if (lowStock) {
                query += ` AND p.CANTIDAD_PRODUCTO <= p.MIN_PRODUCTO`;
            }
            query += ` ORDER BY p.NOMBRE_PRODUCTO ASC`;
            const productos = await this.db.query(query, queryParams);
            // Generar CSV
            const headers = [
                'CODIGO',
                'NOMBRE',
                'SUSTANCIA',
                'CANTIDAD',
                'PRECIO',
                'COSTO',
                'MAX',
                'MIN',
                'IVA',
                'LABORATORIO',
                'ACTIVO'
            ];
            let csv = headers.join(',') + '\n';
            productos.forEach((p) => {
                const row = [
                    `"${p.CODIGO_PRODUCTO || ''}"`,
                    `"${(p.NOMBRE_PRODUCTO || '').replace(/"/g, '""')}"`,
                    `"${(p.SUSTANCIA_PRODUCTO || '').replace(/"/g, '""')}"`,
                    p.CANTIDAD_PRODUCTO || 0,
                    p.PRECIO_PRODUCTO || 0,
                    p.COSTO_PRODUCTO || 0,
                    p.MAX_PRODUCTO || 0,
                    p.MIN_PRODUCTO || 0,
                    p.IVA_PRODUCTO || 0,
                    `"${(p.NOMBRE_LABORATORIO || '').replace(/"/g, '""')}"`,
                    p.ACTIVO || 0
                ];
                csv += row.join(',') + '\n';
            });
            return {
                success: true,
                data: csv,
                message: `${productos.length} productos exportados`
            };
        }
        catch (error) {
            console.error('Error exportando CSV:', error);
            return {
                success: false,
                error: error.message || 'Error al exportar CSV'
            };
        }
    }
    async importFromCSV(event, params) {
        try {
            const { csvData, sucursalId, userId } = params;
            // Parsear CSV
            const lines = csvData.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                return {
                    success: false,
                    error: 'El archivo CSV está vacío o no tiene datos'
                };
            }
            // Validar headers
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const expectedHeaders = ['CODIGO', 'NOMBRE', 'SUSTANCIA', 'CANTIDAD', 'PRECIO', 'COSTO', 'MAX', 'MIN', 'IVA', 'LABORATORIO', 'ACTIVO'];
            const hasValidHeaders = expectedHeaders.every(h => headers.includes(h));
            if (!hasValidHeaders) {
                return {
                    success: false,
                    error: 'El archivo CSV no tiene el formato correcto. Headers esperados: ' + expectedHeaders.join(', ')
                };
            }
            let created = 0;
            let updated = 0;
            let errors = [];
            // Procesar cada línea
            for (let i = 1; i < lines.length; i++) {
                try {
                    const line = lines[i];
                    if (!line.trim())
                        continue;
                    // Parsear línea respetando comillas
                    const values = [];
                    let current = '';
                    let inQuotes = false;
                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];
                        if (char === '"') {
                            if (inQuotes && line[j + 1] === '"') {
                                current += '"';
                                j++;
                            }
                            else {
                                inQuotes = !inQuotes;
                            }
                        }
                        else if (char === ',' && !inQuotes) {
                            values.push(current.trim());
                            current = '';
                        }
                        else {
                            current += char;
                        }
                    }
                    values.push(current.trim());
                    const codigo = values[0]?.replace(/"/g, '') || '';
                    const nombre = values[1]?.replace(/"/g, '') || '';
                    const sustancia = values[2]?.replace(/"/g, '') || null;
                    const cantidad = parseFloat(values[3]) || 0;
                    const precio = parseFloat(values[4]) || 0;
                    const costo = parseFloat(values[5]) || 0;
                    const max = parseFloat(values[6]) || 100;
                    const min = parseFloat(values[7]) || 5;
                    const iva = parseInt(values[8]) || 0;
                    const laboratorioNombre = values[9]?.replace(/"/g, '') || null;
                    const activo = parseInt(values[10]) || 1;
                    if (!codigo || !nombre) {
                        errors.push(`Línea ${i + 1}: Código y nombre son obligatorios`);
                        continue;
                    }
                    // Buscar laboratorio si se especificó
                    let idLaboratorio = null;
                    if (laboratorioNombre) {
                        const labResult = await this.db.query('SELECT id_laboratorio FROM LABORATORIO WHERE nombre_laboratorio = ?', [laboratorioNombre]);
                        if (labResult.length > 0) {
                            idLaboratorio = labResult[0].id_laboratorio;
                        }
                    }
                    // Verificar si existe
                    const existing = await this.db.query('SELECT ID_PRODUCTO FROM PRODUCTO WHERE CODIGO_PRODUCTO = ? AND SUCURSAL_ID = ?', [codigo, sucursalId]);
                    if (existing.length > 0) {
                        // Actualizar
                        await this.db.execute(`
              UPDATE PRODUCTO SET
                NOMBRE_PRODUCTO = ?,
                SUSTANCIA_PRODUCTO = ?,
                CANTIDAD_PRODUCTO = ?,
                PRECIO_PRODUCTO = ?,
                COSTO_PRODUCTO = ?,
                MAX_PRODUCTO = ?,
                MIN_PRODUCTO = ?,
                IVA_PRODUCTO = ?,
                ID_LABORATORIO = ?,
                ACTIVO = ?,
                FECHA_MODIFICACION = datetime('now')
              WHERE ID_PRODUCTO = ?
            `, [nombre, sustancia, cantidad, precio, costo, max, min, iva, idLaboratorio, activo, existing[0].ID_PRODUCTO]);
                        updated++;
                    }
                    else {
                        // Crear
                        await this.db.execute(`
              INSERT INTO PRODUCTO (
                CODIGO_PRODUCTO, NOMBRE_PRODUCTO, SUSTANCIA_PRODUCTO,
                CANTIDAD_PRODUCTO, PRECIO_PRODUCTO, COSTO_PRODUCTO,
                MAX_PRODUCTO, MIN_PRODUCTO, IVA_PRODUCTO,
                ID_LABORATORIO, SUCURSAL_ID, ACTIVO,
                SINCRONIZADO, FECHA_CREACION, FECHA_MODIFICACION
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
            `, [codigo, nombre, sustancia, cantidad, precio, costo, max, min, iva, idLaboratorio, sucursalId, activo]);
                        created++;
                    }
                }
                catch (error) {
                    errors.push(`Línea ${i + 1}: ${error.message}`);
                }
            }
            return {
                success: true,
                data: {
                    created,
                    updated,
                    errors,
                    total: created + updated
                },
                message: `Importación completa: ${created} creados, ${updated} actualizados, ${errors.length} errores`
            };
        }
        catch (error) {
            console.error('Error importando CSV:', error);
            return {
                success: false,
                error: error.message || 'Error al importar CSV'
            };
        }
    }
    async adjustStock(event, params) {
        try {
            const { ID_PRODUCTO, CANTIDAD_AJUSTE, TIPO_AJUSTE, MOTIVO, ID_USUARIO } = params;
            // Obtener producto actual
            const producto = await this.db.query('SELECT CANTIDAD_PRODUCTO FROM PRODUCTO WHERE ID_PRODUCTO = ?', [ID_PRODUCTO]);
            if (producto.length === 0) {
                return {
                    success: false,
                    error: 'Producto no encontrado'
                };
            }
            const cantidadActual = producto[0].CANTIDAD_PRODUCTO;
            let nuevaCantidad = cantidadActual;
            if (TIPO_AJUSTE === 'ENTRADA') {
                nuevaCantidad = cantidadActual + CANTIDAD_AJUSTE;
            }
            else if (TIPO_AJUSTE === 'SALIDA') {
                nuevaCantidad = cantidadActual - CANTIDAD_AJUSTE;
                if (nuevaCantidad < 0) {
                    return {
                        success: false,
                        error: 'La cantidad resultante no puede ser negativa'
                    };
                }
            }
            else if (TIPO_AJUSTE === 'AJUSTE') {
                nuevaCantidad = CANTIDAD_AJUSTE;
            }
            // Actualizar stock
            await this.db.execute('UPDATE PRODUCTO SET CANTIDAD_PRODUCTO = ?, FECHA_MODIFICACION = datetime("now") WHERE ID_PRODUCTO = ?', [nuevaCantidad, ID_PRODUCTO]);
            // Registrar en audit log
            await this.db.execute(`
        INSERT INTO AUDIT_LOG (
          TABLA_AFECTADA,
          ID_REGISTRO_AFECTADO,
          ACCION,
          DATOS_ANTERIORES,
          DATOS_NUEVOS,
          ID_USUARIO,
          FECHA_ACCION
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
                'PRODUCTO',
                ID_PRODUCTO,
                `AJUSTE_STOCK_${TIPO_AJUSTE}`,
                JSON.stringify({ cantidad: cantidadActual }),
                JSON.stringify({ cantidad: nuevaCantidad, motivo: MOTIVO }),
                ID_USUARIO
            ]);
            return {
                success: true,
                data: { cantidadAnterior: cantidadActual, cantidadNueva: nuevaCantidad },
                message: 'Stock ajustado correctamente'
            };
        }
        catch (error) {
            console.error('Error ajustando stock:', error);
            return {
                success: false,
                error: error.message || 'Error al ajustar stock'
            };
        }
    }
}
