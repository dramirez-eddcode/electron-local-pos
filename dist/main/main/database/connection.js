import Database from 'sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_SUCURSAL_CONFIG } from '../../shared/constants/index.js';
// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
// Configuración de SQLite
Database.verbose();
export class DatabaseService {
    constructor() {
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "dbPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.dbPath = join(app.getPath('userData'), 'farmacia.db');
    }
    async initialize() {
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
    async setupDatabase() {
        if (!this.db)
            throw new Error('Base de datos no inicializada');
        // Habilitar foreign keys
        await this.execute('PRAGMA foreign_keys = ON');
        // Crear tablas con schema embebido
        await this.createTables();
        // Inicializar datos básicos
        await this.initializeDefaultData();
        console.log('Base de datos configurada correctamente');
    }
    async initializeDefaultData() {
        // Verificar si ya existe configuración de sucursal
        const sucursalExists = await this.query('SELECT COUNT(*) as count FROM SUCURSAL');
        if (sucursalExists[0].count === 0) {
            // Crear sucursal por defecto
            const sucursalId = uuidv4();
            const sucursalConfig = DEFAULT_SUCURSAL_CONFIG;
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
            // Crear usuarios por defecto
            const bcrypt = await import('bcrypt');
            // Usuario administrador
            const adminPassword = await bcrypt.hash('admin123', 10);
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
                adminPassword,
                'Administrador',
                1,
                sucursalId
            ]);
            // Usuario cajero
            const cajeroPassword = await bcrypt.hash('admin123', 10); // Usar admin123 para ambos por simplicidad
            await this.execute(`
        INSERT INTO USUARIO (
          LOGIN_USUARIO,
          PASSWORD_USUARIO,
          NOMBRE_USUARIO,
          ID_TIPOUSUARIO,
          SUCURSAL_ID
        ) VALUES (?, ?, ?, ?, ?)
      `, [
                'cajero',
                cajeroPassword,
                'Cajero Principal',
                2,
                sucursalId
            ]);
            console.log('Datos iniciales creados');
            console.log('Usuario por defecto: admin / admin123');
            // Cargar datos de muestra (productos y laboratorios)
            await this.loadSampleData();
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
    async createTables() {
        // Schema embebido para evitar problemas de paths
        const tableQueries = [
            // Tabla SUCURSAL
            `CREATE TABLE IF NOT EXISTS SUCURSAL (
        SUCURSAL_ID VARCHAR(36) PRIMARY KEY,
        NOMBRE_SUCURSAL VARCHAR(255) NOT NULL,
        RAZON_SOCIAL VARCHAR(255) NOT NULL,
        DIRECCION TEXT,
        TELEFONO VARCHAR(20),
        RFC VARCHAR(13),
        LOGO_PATH VARCHAR(500),
        PROPIETARIO_ID VARCHAR(36) NOT NULL,
        CONFIGURACION TEXT,
        FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP,
        ACTIVA BOOLEAN DEFAULT 1
      )`,
            // Tabla LABORATORIO
            `CREATE TABLE IF NOT EXISTS LABORATORIO (
        id_laboratorio INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_laboratorio VARCHAR(255) NOT NULL,
        contacto_laboratorio VARCHAR(255),
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        sincronizado BOOLEAN DEFAULT 0,
        fecha_sincronizacion DATETIME
      )`,
            // Tabla TIPOUSUARIO
            `CREATE TABLE IF NOT EXISTS TIPOUSUARIO (
        ID_TIPOUSUARIO INTEGER PRIMARY KEY AUTOINCREMENT,
        NOMBRE_TIPO VARCHAR(50) NOT NULL,
        PERMISOS TEXT,
        FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
            // Tabla USUARIO
            `CREATE TABLE IF NOT EXISTS USUARIO (
        ID_USUARIO INTEGER PRIMARY KEY AUTOINCREMENT,
        LOGIN_USUARIO VARCHAR(50) UNIQUE NOT NULL,
        PASSWORD_USUARIO TEXT NOT NULL,
        NOMBRE_USUARIO VARCHAR(255) NOT NULL,
        ID_TIPOUSUARIO INTEGER,
        SUCURSAL_ID VARCHAR(36),
        ACTIVO BOOLEAN DEFAULT 1,
        FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP,
        ULTIMO_LOGIN DATETIME,
        FOREIGN KEY (ID_TIPOUSUARIO) REFERENCES TIPOUSUARIO(ID_TIPOUSUARIO),
        FOREIGN KEY (SUCURSAL_ID) REFERENCES SUCURSAL(SUCURSAL_ID)
      )`,
            // Tabla PRODUCTO
            `CREATE TABLE IF NOT EXISTS PRODUCTO (
        ID_PRODUCTO INTEGER PRIMARY KEY AUTOINCREMENT,
        CODIGO_PRODUCTO VARCHAR(50) NOT NULL,
        NOMBRE_PRODUCTO VARCHAR(255) NOT NULL,
        SUSTANCIA_PRODUCTO VARCHAR(255),
        CANTIDAD_PRODUCTO DECIMAL(10,2) DEFAULT 0,
        PRECIO_PRODUCTO DECIMAL(10,2) NOT NULL,
        COSTO_PRODUCTO DECIMAL(10,2),
        ID_LABORATORIO INTEGER,
        MAX_PRODUCTO INTEGER,
        MIN_PRODUCTO INTEGER,
        IVA_PRODUCTO BOOLEAN DEFAULT 0,
        SUCURSAL_ID VARCHAR(36) NOT NULL,
        FECHA_CADUCIDAD DATE,
        FECHA_CREACION DATETIME DEFAULT CURRENT_TIMESTAMP,
        FECHA_MODIFICACION DATETIME DEFAULT CURRENT_TIMESTAMP,
        ACTIVO BOOLEAN DEFAULT 1,
        SINCRONIZADO BOOLEAN DEFAULT 0,
        FECHA_SINCRONIZACION DATETIME,
        FOREIGN KEY (ID_LABORATORIO) REFERENCES LABORATORIO(id_laboratorio),
        FOREIGN KEY (SUCURSAL_ID) REFERENCES SUCURSAL(SUCURSAL_ID)
      )`,
            // Tabla CONFIGURACION_SINCRONIZACION
            `CREATE TABLE IF NOT EXISTS CONFIGURACION_SINCRONIZACION (
        ID_CONFIG INTEGER PRIMARY KEY AUTOINCREMENT,
        SUCURSAL_ID VARCHAR(36) NOT NULL,
        SUPABASE_URL VARCHAR(500),
        SUPABASE_ANON_KEY TEXT,
        SINCRONIZACION_ACTIVA BOOLEAN DEFAULT 0,
        INTERVALO_SINCRONIZACION INTEGER DEFAULT 30,
        ULTIMA_SINCRONIZACION DATETIME,
        FOREIGN KEY (SUCURSAL_ID) REFERENCES SUCURSAL(SUCURSAL_ID)
      )`,
            // Tablas de ventas
            `CREATE TABLE IF NOT EXISTS SALIDA (
        ID_SALIDA INTEGER PRIMARY KEY AUTOINCREMENT,
        FOLIO_SALIDA VARCHAR(50) UNIQUE NOT NULL,
        FECHA_SALIDA DATETIME DEFAULT CURRENT_TIMESTAMP,
        TOTAL_SALIDA DECIMAL(10,2) NOT NULL,
        SUBTOTAL_SALIDA DECIMAL(10,2),
        IVA_SALIDA DECIMAL(10,2),
        TIPO_PAGO VARCHAR(20) NOT NULL,
        MONTO_EFECTIVO DECIMAL(10,2) DEFAULT 0,
        MONTO_TARJETA DECIMAL(10,2) DEFAULT 0,
        DATOS_TARJETA TEXT,
        ID_USUARIO INTEGER,
        SUCURSAL_ID VARCHAR(36) NOT NULL,
        CANCELADA BOOLEAN DEFAULT 0,
        FECHA_CANCELACION DATETIME,
        MOTIVO_CANCELACION TEXT,
        SINCRONIZADO BOOLEAN DEFAULT 0,
        FECHA_SINCRONIZACION DATETIME,
        FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID_USUARIO),
        FOREIGN KEY (SUCURSAL_ID) REFERENCES SUCURSAL(SUCURSAL_ID)
      )`,
            `CREATE TABLE IF NOT EXISTS MOVSALIDA (
        ID_MOVSALIDA INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_SALIDA INTEGER NOT NULL,
        ID_PRODUCTO INTEGER NOT NULL,
        CANTIDAD_SALIDA DECIMAL(10,2) NOT NULL,
        PRECIO_UNITARIO DECIMAL(10,2) NOT NULL,
        SUBTOTAL DECIMAL(10,2) NOT NULL,
        DESCUENTO DECIMAL(10,2) DEFAULT 0,
        FECHA_CADUCIDAD DATE,
        FOREIGN KEY (ID_SALIDA) REFERENCES SALIDA(ID_SALIDA),
        FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTO(ID_PRODUCTO)
      )`
        ];
        // Ejecutar todas las queries de creación de tablas
        for (const query of tableQueries) {
            await this.execute(query);
        }
        console.log('✅ Todas las tablas creadas correctamente');
    }
    async loadSampleData() {
        try {
            // Verificar si ya existen productos
            const productExists = await this.query('SELECT COUNT(*) as count FROM PRODUCTO');
            if (productExists[0].count > 0) {
                console.log('Productos ya existen, omitiendo carga de datos de muestra');
                return;
            }
            console.log('Cargando datos de muestra...');
            // Obtener SUCURSAL_ID creada
            const sucursal = await this.query('SELECT SUCURSAL_ID FROM SUCURSAL LIMIT 1');
            const sucursalId = sucursal[0].SUCURSAL_ID;
            // Cargar laboratorios
            await this.execute(`
        INSERT OR IGNORE INTO LABORATORIO (id_laboratorio, nombre_laboratorio, contacto_laboratorio) VALUES
        (1, 'BAYER', 'contacto@bayer.com'),
        (2, 'PFIZER', 'contacto@pfizer.com'),
        (3, 'GENOMMA LAB', 'contacto@genommalab.com'),
        (4, 'GRÜNENTHAL', 'contacto@grunenthal.com'),
        (5, 'LIOMONT', 'contacto@liomont.com')
      `);
            // Cargar productos de muestra
            const productos = [
                // Analgésicos
                [1, '7501234567890', 'PARACETAMOL 500mg 20 TAB', 'Acetaminofén', 150, 25.50, 18.00, 1, 200, 20],
                [2, '7501234567891', 'IBUPROFENO 400mg 20 CAP', 'Ibuprofeno', 80, 35.00, 25.00, 2, 100, 15],
                [3, '7501234567892', 'ASPIRINA 500mg 10 TAB', 'Ácido acetilsalicílico', 60, 18.75, 12.50, 1, 100, 10],
                [4, '7501234567893', 'NAPROXENO 250mg 10 TAB', 'Naproxeno sódico', 45, 28.90, 20.00, 2, 80, 10],
                // Antibióticos
                [5, '7501234567894', 'AMOXICILINA 500mg 21 CAP', 'Amoxicilina', 35, 65.00, 45.00, 3, 50, 5],
                [6, '7501234567895', 'AZITROMICINA 500mg 3 TAB', 'Azitromicina', 25, 85.50, 60.00, 2, 40, 5],
                [7, '7501234567896', 'CEFALEXINA 500mg 21 CAP', 'Cefalexina', 30, 75.00, 52.00, 4, 50, 5],
                // Antigripales
                [8, '7501234567897', 'TABCIN GRIPE 12 TAB', 'Paracetamol + Fenilefrina + Clorfeniramina', 90, 42.50, 30.00, 1, 120, 15],
                [9, '7501234567898', 'DESENFRIOL-D 10 TAB', 'Paracetamol + Pseudoefedrina + Triprolidina', 75, 38.00, 26.50, 3, 100, 10],
                [10, '7501234567899', 'TYLENOL GRIPE 12 TAB', 'Paracetamol + Pseudoefedrina + Dextrometorfano', 65, 45.00, 32.00, 2, 80, 10],
                // Digestivos
                [11, '7501234567900', 'BUSCAPINA 10mg 20 DRAG', 'Hioscina', 55, 32.00, 22.50, 1, 80, 10],
                [12, '7501234567901', 'PEPTO-BISMOL 240ml', 'Subsalicilato de bismuto', 40, 68.00, 48.00, 2, 60, 8],
                [13, '7501234567902', 'LOPERAMIDA 2mg 20 CAP', 'Loperamida', 35, 28.50, 20.00, 3, 50, 5],
                // Vitaminas y suplementos
                [14, '7501234567903', 'CENTRUM MULTIVITAMINICO 30 TAB', 'Multivitamínico', 48, 95.00, 68.00, 2, 60, 8],
                [15, '7501234567904', 'VITAMINA C 500mg 30 TAB', 'Ácido ascórbico', 72, 35.50, 25.00, 1, 100, 12],
                [16, '7501234567905', 'CALCIO + VITAMINA D 60 TAB', 'Carbonato de calcio + Colecalciferol', 38, 58.00, 42.00, 4, 50, 6],
                // Productos para la piel
                [17, '7501234567906', 'DERMATOVIN CREMA 30g', 'Clotrimazol', 28, 45.50, 32.00, 3, 40, 5],
                [18, '7501234567907', 'HIRUDOID CREMA 40g', 'Heparinoides', 22, 125.00, 90.00, 4, 30, 3],
                [19, '7501234567908', 'BEPANTHEN CREMA 30g', 'Dexpantenol', 35, 78.50, 55.00, 1, 50, 5],
                // Productos para niños
                [20, '7501234567909', 'TEMPRA JARABE 120ml', 'Paracetamol pediátrico', 42, 58.00, 41.00, 2, 60, 8],
                [21, '7501234567910', 'DALSY SUSPENSION 120ml', 'Ibuprofeno pediátrico', 35, 65.50, 46.00, 3, 50, 6],
                [22, '7501234567911', 'PEDIALYTE 500ml', 'Solución rehidratante oral', 48, 32.00, 22.50, 1, 70, 10],
                // Productos de higiene personal
                [23, '7501234567912', 'ISODINE BUCAL 240ml', 'Povidona yodada', 32, 48.50, 34.00, 4, 50, 5],
                [24, '7501234567913', 'ALCOHOL 70% 250ml', 'Alcohol etílico', 85, 15.50, 10.00, 5, 120, 15],
                [25, '7501234567914', 'AGUA OXIGENADA 250ml', 'Peróxido de hidrógeno', 60, 12.00, 8.50, 5, 90, 12]
            ];
            for (const producto of productos) {
                await this.execute(`
          INSERT OR IGNORE INTO PRODUCTO (
            ID_PRODUCTO, CODIGO_PRODUCTO, NOMBRE_PRODUCTO, SUSTANCIA_PRODUCTO,
            CANTIDAD_PRODUCTO, PRECIO_PRODUCTO, COSTO_PRODUCTO, ID_LABORATORIO,
            MAX_PRODUCTO, MIN_PRODUCTO, SUCURSAL_ID, ACTIVO
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [...producto, sucursalId]);
            }
            // Simular ventas previas (reducir stock aleatoriamente)
            await this.execute(`
        UPDATE PRODUCTO
        SET CANTIDAD_PRODUCTO = CANTIDAD_PRODUCTO - (ABS(RANDOM() % 30) + 5)
        WHERE ID_PRODUCTO <= 25
      `);
            // Asegurar que no quede stock negativo
            await this.execute(`
        UPDATE PRODUCTO
        SET CANTIDAD_PRODUCTO = 5
        WHERE CANTIDAD_PRODUCTO < 0
      `);
            console.log('✅ Datos de muestra cargados: 25 productos disponibles');
        }
        catch (error) {
            console.error('Error cargando datos de muestra:', error);
        }
    }
    async query(sql, params = []) {
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
    async execute(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('Error en execute:', err, 'SQL:', sql, 'Params:', params);
                    reject(err);
                    return;
                }
                resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }
    async transaction(queries) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                let completed = 0;
                let hasError = false;
                for (const query of queries) {
                    this.db.run(query.sql, query.params || [], (err) => {
                        if (err && !hasError) {
                            hasError = true;
                            this.db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        completed++;
                        if (completed === queries.length && !hasError) {
                            this.db.run('COMMIT', (commitErr) => {
                                if (commitErr) {
                                    reject(commitErr);
                                }
                                else {
                                    resolve();
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    async getSucursal() {
        const rows = await this.query('SELECT * FROM SUCURSAL WHERE ACTIVA = 1 LIMIT 1');
        if (rows.length === 0)
            return null;
        const row = rows[0];
        return {
            ...row,
            CONFIGURACION: JSON.parse(row.CONFIGURACION || '{}')
        };
    }
    async updateSucursal(sucursal) {
        const { CONFIGURACION, ...otherFields } = sucursal;
        const setClause = Object.keys(otherFields)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = Object.values(otherFields);
        if (CONFIGURACION) {
            await this.execute(`UPDATE SUCURSAL SET ${setClause}, CONFIGURACION = ? WHERE ACTIVA = 1`, [...values, JSON.stringify(CONFIGURACION)]);
        }
        else {
            await this.execute(`UPDATE SUCURSAL SET ${setClause} WHERE ACTIVA = 1`, values);
        }
    }
    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error al cerrar la base de datos:', err);
                    }
                    else {
                        console.log('Conexión a la base de datos cerrada');
                    }
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    // Método para obtener estadísticas de la base de datos
    async getStats() {
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
