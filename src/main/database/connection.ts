import Database from 'sqlite3';
import { app } from 'electron';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Sucursal, Usuario, SucursalConfiguracion } from '../../shared/types/index.js';
import { DEFAULT_SUCURSAL_CONFIG } from '../../shared/constants/index.js';

// Configuración de SQLite
Database.verbose();

export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = join(app.getPath('userData'), 'farmacia.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new Database.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error al conectar con la base de datos:', err);
          reject(err);
          return;
        }
        
        console.log('Conectado a la base de datos SQLite');
        this.setupDatabase()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  private async setupDatabase(): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    // Habilitar foreign keys
    await this.execute('PRAGMA foreign_keys = ON');
    
    // Crear tablas desde schema.sql
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    await this.execute(schema);
    
    // Inicializar datos básicos
    await this.initializeDefaultData();
    
    console.log('Base de datos configurada correctamente');
  }

  private async initializeDefaultData(): Promise<void> {
    // Verificar si ya existe configuración de sucursal
    const sucursalExists = await this.query('SELECT COUNT(*) as count FROM SUCURSAL');
    
    if (sucursalExists[0].count === 0) {
      // Crear sucursal por defecto
      const sucursalId = uuidv4();
      const sucursalConfig: SucursalConfiguracion = DEFAULT_SUCURSAL_CONFIG;
      
      await this.execute(`
        INSERT INTO SUCURSAL (
          SUCURSAL_ID, 
          NOMBRE_SUCURSAL, 
          RAZON_SOCIAL, 
          DIRECCION, 
          PROPIETARIO_ID, 
          CONFIGURACION
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        sucursalId,
        'Farmacia MS - Nueva Sucursal',
        'FARMACIAS MS S.A. DE C.V.',
        'Configurar dirección',
        'pending-setup',
        JSON.stringify(sucursalConfig)
      ]);

      // Crear tipos de usuario
      await this.execute(`
        INSERT OR IGNORE INTO TIPOUSUARIO (ID_TIPOUSUARIO, NOMBRE_TIPO, PERMISOS) VALUES 
        (1, 'Administrador', '["ventas","cancelar_ventas","corte_caja","inventario","reportes","configuracion","usuarios","backup","sincronizacion","plm"]'),
        (2, 'Cajero', '["ventas","corte_caja","reportes"]'),
        (3, 'Supervisor', '["ventas","cancelar_ventas","corte_caja","inventario","reportes"]')
      `);

      // Crear usuario administrador por defecto
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await this.execute(`
        INSERT INTO USUARIO (
          LOGIN_USUARIO, 
          PASSWORD_USUARIO, 
          NOMBRE_USUARIO, 
          ID_TIPOUSUARIO, 
          SUCURSAL_ID
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        'admin',
        hashedPassword,
        'Administrador',
        1,
        sucursalId
      ]);

      console.log('Datos iniciales creados');
      console.log('Usuario por defecto: admin / admin123');
    }

    // Crear configuración de sincronización por defecto
    const syncConfigExists = await this.query('SELECT COUNT(*) as count FROM CONFIGURACION_SINCRONIZACION');
    
    if (syncConfigExists[0].count === 0) {
      const sucursal = await this.query('SELECT SUCURSAL_ID FROM SUCURSAL LIMIT 1');
      
      await this.execute(`
        INSERT INTO CONFIGURACION_SINCRONIZACION (
          ID_CONFIG,
          SUCURSAL_ID,
          SINCRONIZACION_ACTIVA,
          INTERVALO_SINCRONIZACION
        ) VALUES (1, ?, 0, 30)
      `, [sucursal[0].SUCURSAL_ID]);
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error en query:', err, 'SQL:', sql, 'Params:', params);
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  async execute(sql: string, params: any[] = []): Promise<{ lastID?: number; changes: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error en execute:', err, 'SQL:', sql, 'Params:', params);
          reject(err);
          return;
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      this.db.serialize(() => {
        this.db!.run('BEGIN TRANSACTION');
        
        let completed = 0;
        let hasError = false;

        for (const query of queries) {
          this.db!.run(query.sql, query.params || [], (err) => {
            if (err && !hasError) {
              hasError = true;
              this.db!.run('ROLLBACK');
              reject(err);
              return;
            }
            
            completed++;
            if (completed === queries.length && !hasError) {
              this.db!.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  reject(commitErr);
                } else {
                  resolve();
                }
              });
            }
          });
        }
      });
    });
  }

  async getSucursal(): Promise<Sucursal | null> {
    const rows = await this.query('SELECT * FROM SUCURSAL WHERE ACTIVA = 1 LIMIT 1');
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      ...row,
      CONFIGURACION: JSON.parse(row.CONFIGURACION || '{}')
    };
  }

  async updateSucursal(sucursal: Partial<Sucursal>): Promise<void> {
    const { CONFIGURACION, ...otherFields } = sucursal;
    
    const setClause = Object.keys(otherFields)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(otherFields);
    
    if (CONFIGURACION) {
      await this.execute(
        `UPDATE SUCURSAL SET ${setClause}, CONFIGURACION = ? WHERE ACTIVA = 1`,
        [...values, JSON.stringify(CONFIGURACION)]
      );
    } else {
      await this.execute(
        `UPDATE SUCURSAL SET ${setClause} WHERE ACTIVA = 1`,
        values
      );
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error al cerrar la base de datos:', err);
          } else {
            console.log('Conexión a la base de datos cerrada');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Método para obtener estadísticas de la base de datos
  async getStats(): Promise<{
    productos: number;
    usuarios: number;
    ventas_hoy: number;
    ultima_sincronizacion: string | null;
  }> {
    const [productos, usuarios, ventas, sync] = await Promise.all([
      this.query('SELECT COUNT(*) as count FROM PRODUCTO WHERE ACTIVO = 1'),
      this.query('SELECT COUNT(*) as count FROM USUARIO WHERE ACTIVO = 1'),
      this.query(`
        SELECT COUNT(*) as count FROM SALIDA 
        WHERE DATE(FECHA_SALIDA) = DATE('now') AND CANCELADA = 0
      `),
      this.query('SELECT ULTIMA_SINCRONIZACION FROM CONFIGURACION_SINCRONIZACION LIMIT 1')
    ]);

    return {
      productos: productos[0].count,
      usuarios: usuarios[0].count,
      ventas_hoy: ventas[0].count,
      ultima_sincronizacion: sync[0]?.ULTIMA_SINCRONIZACION || null
    };
  }
}

// Instancia singleton
export const db = new DatabaseService();