import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../database/connection.js';
export class AuthHandler {
    constructor() {
        Object.defineProperty(this, "JWT_SECRET", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process.env.JWT_SECRET || 'farmacia-ms-secret-key-2024'
        });
        Object.defineProperty(this, "JWT_EXPIRES_IN", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '8h'
        });
    }
    async login(event, credentials) {
        try {
            const { usuario, password } = credentials;
            // Buscar usuario en la base de datos
            const users = await db.query(`
        SELECT u.*, t.NOMBRE_TIPO, t.PERMISOS, s.NOMBRE_SUCURSAL, s.RAZON_SOCIAL
        FROM USUARIO u
        INNER JOIN TIPOUSUARIO t ON u.ID_TIPOUSUARIO = t.ID_TIPOUSUARIO
        INNER JOIN SUCURSAL s ON u.SUCURSAL_ID = s.SUCURSAL_ID
        WHERE u.LOGIN_USUARIO = ? AND u.ACTIVO = 1
      `, [usuario]);
            if (users.length === 0) {
                return {
                    success: false,
                    error: 'Usuario no encontrado o inactivo'
                };
            }
            const user = users[0];
            // Verificar contraseña
            const passwordMatch = await bcrypt.compare(password, user.PASSWORD_USUARIO);
            if (!passwordMatch) {
                return {
                    success: false,
                    error: 'Contraseña incorrecta'
                };
            }
            // Actualizar último login
            await db.execute('UPDATE USUARIO SET ULTIMO_LOGIN = CURRENT_TIMESTAMP WHERE ID_USUARIO = ?', [user.ID_USUARIO]);
            // Generar token JWT
            const token = jwt.sign({
                id: user.ID_USUARIO,
                login: user.LOGIN_USUARIO,
                tipo: user.ID_TIPOUSUARIO,
                sucursal: user.SUCURSAL_ID
            }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
            // Preparar datos del usuario (sin contraseña)
            const { PASSWORD_USUARIO, ...userWithoutPassword } = user;
            const userData = {
                ...userWithoutPassword,
                PERMISOS: JSON.parse(user.PERMISOS || '[]')
            };
            // Log de auditoría
            await db.execute(`
        INSERT INTO AUDIT_LOG (
          USER_ID, ACTION_TYPE, TABLE_NAME, NEW_VALUE, SUCURSAL_ID
        ) VALUES (?, ?, ?, ?, ?)
      `, [
                user.ID_USUARIO,
                'LOGIN_SUCCESS',
                'USUARIO',
                JSON.stringify({ login_time: new Date().toISOString() }),
                user.SUCURSAL_ID
            ]);
            return {
                success: true,
                data: { user: userData, token },
                message: 'Inicio de sesión exitoso'
            };
        }
        catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                error: 'Error interno del servidor'
            };
        }
    }
    async logout(event, userId) {
        try {
            // Log de auditoría
            const user = await db.query('SELECT SUCURSAL_ID FROM USUARIO WHERE ID_USUARIO = ?', [userId]);
            if (user.length > 0) {
                await db.execute(`
          INSERT INTO AUDIT_LOG (
            USER_ID, ACTION_TYPE, TABLE_NAME, NEW_VALUE, SUCURSAL_ID
          ) VALUES (?, ?, ?, ?, ?)
        `, [
                    userId,
                    'LOGOUT',
                    'USUARIO',
                    JSON.stringify({ logout_time: new Date().toISOString() }),
                    user[0].SUCURSAL_ID
                ]);
            }
            return {
                success: true,
                message: 'Sesión cerrada correctamente'
            };
        }
        catch (error) {
            console.error('Error en logout:', error);
            return {
                success: false,
                error: 'Error al cerrar sesión'
            };
        }
    }
    async verifyToken(event, token) {
        try {
            // Verificar y decodificar token
            const decoded = jwt.verify(token, this.JWT_SECRET);
            // Buscar usuario actualizado
            const users = await db.query(`
        SELECT u.*, t.NOMBRE_TIPO, t.PERMISOS, s.NOMBRE_SUCURSAL, s.RAZON_SOCIAL
        FROM USUARIO u
        INNER JOIN TIPOUSUARIO t ON u.ID_TIPOUSUARIO = t.ID_TIPOUSUARIO
        INNER JOIN SUCURSAL s ON u.SUCURSAL_ID = s.SUCURSAL_ID
        WHERE u.ID_USUARIO = ? AND u.ACTIVO = 1
      `, [decoded.id]);
            if (users.length === 0) {
                return {
                    success: false,
                    error: 'Usuario no encontrado o inactivo'
                };
            }
            const { PASSWORD_USUARIO, ...userWithoutPassword } = users[0];
            const userData = {
                ...userWithoutPassword,
                PERMISOS: JSON.parse(users[0].PERMISOS || '[]')
            };
            return {
                success: true,
                data: userData
            };
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return {
                    success: false,
                    error: 'Token expirado'
                };
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                return {
                    success: false,
                    error: 'Token inválido'
                };
            }
            else {
                console.error('Error verificando token:', error);
                return {
                    success: false,
                    error: 'Error interno del servidor'
                };
            }
        }
    }
    async changePassword(event, data) {
        try {
            const { userId, currentPassword, newPassword } = data;
            // Verificar contraseña actual
            const users = await db.query('SELECT PASSWORD_USUARIO FROM USUARIO WHERE ID_USUARIO = ?', [userId]);
            if (users.length === 0) {
                return {
                    success: false,
                    error: 'Usuario no encontrado'
                };
            }
            const passwordMatch = await bcrypt.compare(currentPassword, users[0].PASSWORD_USUARIO);
            if (!passwordMatch) {
                return {
                    success: false,
                    error: 'Contraseña actual incorrecta'
                };
            }
            // Encriptar nueva contraseña
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            // Actualizar contraseña
            await db.execute('UPDATE USUARIO SET PASSWORD_USUARIO = ? WHERE ID_USUARIO = ?', [hashedNewPassword, userId]);
            // Log de auditoría
            const user = await db.query('SELECT SUCURSAL_ID FROM USUARIO WHERE ID_USUARIO = ?', [userId]);
            await db.execute(`
        INSERT INTO AUDIT_LOG (
          USER_ID, ACTION_TYPE, TABLE_NAME, NEW_VALUE, SUCURSAL_ID
        ) VALUES (?, ?, ?, ?, ?)
      `, [
                userId,
                'PASSWORD_CHANGE',
                'USUARIO',
                JSON.stringify({ change_time: new Date().toISOString() }),
                user[0].SUCURSAL_ID
            ]);
            return {
                success: true,
                message: 'Contraseña actualizada correctamente'
            };
        }
        catch (error) {
            console.error('Error cambiando contraseña:', error);
            return {
                success: false,
                error: 'Error al cambiar contraseña'
            };
        }
    }
}
