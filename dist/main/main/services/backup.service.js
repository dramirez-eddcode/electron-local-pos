import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import archiver from 'archiver';
import extract from 'extract-zip';
import crypto from 'crypto';
export class BackupService {
    constructor(db) {
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: db
        });
        Object.defineProperty(this, "backupPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.backupPath = path.join(app.getPath('userData'), 'backups');
        this.ensureBackupDirectory();
    }
    async ensureBackupDirectory() {
        await fs.ensureDir(this.backupPath);
    }
    /**
     * Crear respaldo completo de la base de datos
     */
    async createBackup(description) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `farmacia-backup-${timestamp}`;
            const tempDir = path.join(this.backupPath, 'temp', backupName);
            await fs.ensureDir(tempDir);
            // 1. Obtener información de la sucursal
            const sucursalInfo = await this.getSucursalInfo();
            // 2. Exportar base de datos completa
            const dbPath = path.join(app.getPath('userData'), 'farmacia.db');
            const dbBackupPath = path.join(tempDir, 'database.db');
            if (await fs.pathExists(dbPath)) {
                await fs.copy(dbPath, dbBackupPath);
            }
            else {
                throw new Error('Base de datos no encontrada');
            }
            // 3. Generar metadata
            const metadata = await this.generateMetadata(dbBackupPath, sucursalInfo, description);
            await fs.writeJson(path.join(tempDir, 'metadata.json'), metadata, { spaces: 2 });
            // 4. Crear archivo de respaldo comprimido
            const backupFilePath = path.join(this.backupPath, `${backupName}.fmsbackup`);
            await this.createZipFile(tempDir, backupFilePath);
            // 5. Limpiar directorio temporal
            await fs.remove(tempDir);
            // 6. Registrar el respaldo
            await this.registerBackup(metadata, backupFilePath);
            return {
                success: true,
                filePath: backupFilePath,
                metadata
            };
        }
        catch (error) {
            console.error('Error creando respaldo:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Restaurar desde archivo de respaldo
     */
    async restoreBackup(backupFilePath) {
        try {
            const tempDir = path.join(this.backupPath, 'temp', 'restore');
            await fs.ensureDir(tempDir);
            // 1. Extraer archivo de respaldo
            await this.extractZipFile(backupFilePath, tempDir);
            // 2. Validar integridad
            const metadataPath = path.join(tempDir, 'metadata.json');
            if (!await fs.pathExists(metadataPath)) {
                throw new Error('Archivo de respaldo inválido: falta metadata.json');
            }
            const metadata = await fs.readJson(metadataPath);
            const dbPath = path.join(tempDir, 'database.db');
            if (!await fs.pathExists(dbPath)) {
                throw new Error('Archivo de respaldo inválido: falta database.db');
            }
            // 3. Verificar checksum
            const currentChecksum = await this.calculateChecksum(dbPath);
            if (currentChecksum !== metadata.checksum) {
                throw new Error('El archivo de respaldo está corrupto (checksum inválido)');
            }
            // 4. Crear respaldo de seguridad de la DB actual
            await this.createSafetyBackup();
            // 5. Cerrar conexión actual
            await this.db.close();
            // 6. Reemplazar base de datos
            const targetDbPath = path.join(app.getPath('userData'), 'farmacia.db');
            await fs.copy(dbPath, targetDbPath, { overwrite: true });
            // 7. Reconectar a la base de datos
            await this.db.initialize();
            // 8. Limpiar directorio temporal
            await fs.remove(tempDir);
            return {
                success: true,
                restoredTables: metadata.tables,
                recordCount: metadata.recordCount
            };
        }
        catch (error) {
            console.error('Error restaurando respaldo:', error);
            // Intentar restaurar la DB de seguridad si falló
            try {
                await this.restoreSafetyBackup();
                await this.db.initialize();
            }
            catch (restoreError) {
                console.error('Error restaurando DB de seguridad:', restoreError);
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Exportar respaldo a dispositivo USB
     */
    async exportToUSB(usbPath, backupFilePath) {
        try {
            let sourceFile;
            if (backupFilePath && await fs.pathExists(backupFilePath)) {
                sourceFile = backupFilePath;
            }
            else {
                // Crear nuevo respaldo
                const backupResult = await this.createBackup('Exportación USB');
                if (!backupResult.success || !backupResult.filePath) {
                    return backupResult;
                }
                sourceFile = backupResult.filePath;
            }
            // Crear directorio de destino en USB
            const usbBackupDir = path.join(usbPath, 'FarmaciasMS_Backup');
            await fs.ensureDir(usbBackupDir);
            // Copiar archivo al USB
            const fileName = path.basename(sourceFile);
            const destinationPath = path.join(usbBackupDir, fileName);
            await fs.copy(sourceFile, destinationPath);
            return {
                success: true,
                filePath: destinationPath
            };
        }
        catch (error) {
            console.error('Error exportando a USB:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Obtener lista de respaldos disponibles
     */
    async getAvailableBackups() {
        try {
            const files = await fs.readdir(this.backupPath);
            const backups = [];
            for (const file of files) {
                if (file.endsWith('.fmsbackup')) {
                    const filePath = path.join(this.backupPath, file);
                    const stats = await fs.stat(filePath);
                    // Intentar obtener metadata sin extraer todo el archivo
                    let metadata;
                    try {
                        metadata = await this.getBackupMetadata(filePath);
                    }
                    catch (error) {
                        console.warn('No se pudo obtener metadata para:', file);
                    }
                    backups.push({
                        name: file,
                        path: filePath,
                        date: stats.mtime,
                        size: stats.size,
                        metadata
                    });
                }
            }
            // Ordenar por fecha (más reciente primero)
            return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
        }
        catch (error) {
            console.error('Error obteniendo lista de respaldos:', error);
            return [];
        }
    }
    /**
     * Detectar dispositivos USB disponibles
     */
    async detectUSBDevices() {
        const devices = [];
        try {
            // En Windows, buscar drives removibles
            if (process.platform === 'win32') {
                const drives = ['D:', 'E:', 'F:', 'G:', 'H:', 'I:'];
                for (const drive of drives) {
                    try {
                        const drivePath = `${drive}\\`;
                        if (await fs.pathExists(drivePath)) {
                            const stats = await fs.stat(drivePath);
                            if (stats.isDirectory()) {
                                devices.push({
                                    path: drivePath,
                                    name: `Unidad ${drive}`
                                });
                            }
                        }
                    }
                    catch (error) {
                        // Drive no disponible, continuar
                    }
                }
            }
            // TODO: Implementar detección para macOS y Linux
        }
        catch (error) {
            console.error('Error detectando dispositivos USB:', error);
        }
        return devices;
    }
    /**
     * Generar metadata del respaldo
     */
    async generateMetadata(dbPath, sucursalInfo, description) {
        const checksum = await this.calculateChecksum(dbPath);
        const tables = await this.getTableList();
        const recordCount = await this.getTotalRecordCount();
        return {
            version: app.getVersion(),
            date: new Date().toISOString(),
            sucursalId: sucursalInfo?.SUCURSAL_ID || 'unknown',
            sucursalName: sucursalInfo?.NOMBRE_SUCURSAL || 'Farmacia',
            checksum,
            tables,
            recordCount
        };
    }
    /**
     * Calcular checksum SHA256 de un archivo
     */
    async calculateChecksum(filePath) {
        const fileBuffer = await fs.readFile(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    }
    /**
     * Crear archivo ZIP
     */
    async createZipFile(sourceDir, targetPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(targetPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));
            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }
    /**
     * Extraer archivo ZIP
     */
    async extractZipFile(zipPath, targetDir) {
        await fs.ensureDir(targetDir);
        await extract(zipPath, { dir: targetDir });
    }
    /**
     * Obtener información de la sucursal
     */
    async getSucursalInfo() {
        try {
            const result = await this.db.query('SELECT * FROM SUCURSAL LIMIT 1');
            return result || { SUCURSAL_ID: 'default', NOMBRE_SUCURSAL: 'Farmacia' };
        }
        catch (error) {
            return { SUCURSAL_ID: 'default', NOMBRE_SUCURSAL: 'Farmacia' };
        }
    }
    /**
     * Obtener lista de tablas
     */
    async getTableList() {
        try {
            const result = await this.db.query(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
            return Array.isArray(result) ? result.map(row => row.name) : [];
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Obtener conteo total de registros
     */
    async getTotalRecordCount() {
        try {
            const tables = await this.getTableList();
            let totalCount = 0;
            for (const table of tables) {
                const result = await this.db.query(`SELECT COUNT(*) as count FROM ${table}`);
                if (Array.isArray(result) && result.length > 0 && typeof result[0].count === 'number') {
                    totalCount += result[0].count;
                }
            }
            return totalCount;
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Crear respaldo de seguridad antes de restaurar
     */
    async createSafetyBackup() {
        const dbPath = path.join(app.getPath('userData'), 'farmacia.db');
        const safetyPath = path.join(this.backupPath, 'safety-backup.db');
        if (await fs.pathExists(dbPath)) {
            await fs.copy(dbPath, safetyPath, { overwrite: true });
        }
    }
    /**
     * Restaurar respaldo de seguridad
     */
    async restoreSafetyBackup() {
        const safetyPath = path.join(this.backupPath, 'safety-backup.db');
        const dbPath = path.join(app.getPath('userData'), 'farmacia.db');
        if (await fs.pathExists(safetyPath)) {
            await fs.copy(safetyPath, dbPath, { overwrite: true });
        }
    }
    /**
     * Registrar respaldo en la base de datos
     */
    async registerBackup(metadata, filePath) {
        try {
            await this.db.execute(`
        INSERT OR REPLACE INTO BACKUP_LOG (
          archivo, fecha, sucursal_id, checksum, tablas, registros, tamano
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
                path.basename(filePath),
                metadata.date,
                metadata.sucursalId,
                metadata.checksum,
                JSON.stringify(metadata.tables),
                metadata.recordCount,
                (await fs.stat(filePath)).size
            ]);
        }
        catch (error) {
            console.warn('No se pudo registrar el respaldo en la DB:', error);
        }
    }
    /**
     * Obtener metadata de un archivo de respaldo sin extraer todo
     */
    async getBackupMetadata(backupPath) {
        const tempDir = path.join(this.backupPath, 'temp', 'metadata-read');
        await fs.ensureDir(tempDir);
        try {
            await this.extractZipFile(backupPath, tempDir);
            const metadataPath = path.join(tempDir, 'metadata.json');
            const metadata = await fs.readJson(metadataPath);
            await fs.remove(tempDir);
            return metadata;
        }
        catch (error) {
            await fs.remove(tempDir);
            throw error;
        }
    }
}
