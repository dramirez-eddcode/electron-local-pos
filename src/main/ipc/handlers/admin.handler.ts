import bcrypt from 'bcrypt';
import { db } from '../../database/connection.js';
import type { IpcResponse, Usuario, TipoUsuario } from '../../../shared/types/index.js';

export class AdminHandler {
  /**
   * Obtener todos los usuarios
   */
  async getUsers(event: any): Promise<IpcResponse<Usuario[]>> {
    try {
      const users = await db.query(`
        SELECT
          u.ID_USUARIO,
          u.LOGIN_USUARIO,
          u.NOMBRE_USUARIO,
          u.ID_TIPOUSUARIO,
          u.SUCURSAL_ID,
          u.ACTIVO,
          u.FECHA_CREACION,
          u.ULTIMO_LOGIN,
          t.NOMBRE_TIPO,
          t.PERMISOS
        FROM USUARIO u
        INNER JOIN TIPOUSUARIO t ON u.ID_TIPOUSUARIO = t.ID_TIPOUSUARIO
        ORDER BY u.NOMBRE_USUARIO
      `);

      // Parsear permisos de JSON string a array
      const usersWithPermisos = users.map((user: any) => ({
        ...user,
        PERMISOS: JSON.parse(user.PERMISOS || '[]')
      }));

      return {
        success: true,
        data: usersWithPermisos
      };
    } catch (error: any) {
      console.error('Error obteniendo usuarios:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener usuarios'
      };
    }
  }

  /**
   * Obtener todos los tipos de usuario
   */
  async getUserTypes(event: any): Promise<IpcResponse<TipoUsuario[]>> {
    try {
      const types = await db.query(`
        SELECT ID_TIPOUSUARIO, NOMBRE_TIPO, PERMISOS
        FROM TIPOUSUARIO
        ORDER BY NOMBRE_TIPO
      `);

      // Parsear permisos de JSON string a array
      const typesWithPermisos = types.map((type: any) => ({
        ...type,
        PERMISOS: JSON.parse(type.PERMISOS || '[]')
      }));

      return {
        success: true,
        data: typesWithPermisos
      };
    } catch (error: any) {
      console.error('Error obteniendo tipos de usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener tipos de usuario'
      };
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(event: any, userData: any): Promise<IpcResponse<void>> {
    try {
      const { LOGIN_USUARIO, PASSWORD_USUARIO, NOMBRE_USUARIO, ID_TIPOUSUARIO, SUCURSAL_ID, ACTIVO } = userData;

      // Validaciones
      if (!LOGIN_USUARIO || !PASSWORD_USUARIO || !NOMBRE_USUARIO) {
        return {
          success: false,
          error: 'Login, contraseña y nombre son requeridos'
        };
      }

      // Verificar si el login ya existe
      const existingUsers = await db.query(
        'SELECT ID_USUARIO FROM USUARIO WHERE LOGIN_USUARIO = ?',
        [LOGIN_USUARIO]
      );

      if (existingUsers.length > 0) {
        return {
          success: false,
          error: 'El usuario ya existe'
        };
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(PASSWORD_USUARIO, 10);

      // Insertar usuario
      await db.execute(`
        INSERT INTO USUARIO (
          LOGIN_USUARIO, PASSWORD_USUARIO, NOMBRE_USUARIO,
          ID_TIPOUSUARIO, SUCURSAL_ID, ACTIVO
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        LOGIN_USUARIO,
        hashedPassword,
        NOMBRE_USUARIO,
        ID_TIPOUSUARIO || 2,
        SUCURSAL_ID,
        ACTIVO !== undefined ? ACTIVO : true
      ]);

      return {
        success: true,
        message: 'Usuario creado exitosamente'
      };
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al crear usuario'
      };
    }
  }

  /**
   * Actualizar usuario existente
   */
  async updateUser(event: any, userData: any): Promise<IpcResponse<void>> {
    try {
      const { ID_USUARIO, LOGIN_USUARIO, PASSWORD_USUARIO, NOMBRE_USUARIO, ID_TIPOUSUARIO, ACTIVO } = userData;

      if (!ID_USUARIO) {
        return {
          success: false,
          error: 'ID de usuario es requerido'
        };
      }

      // Construir query de actualización
      let query = `
        UPDATE USUARIO SET
          LOGIN_USUARIO = ?,
          NOMBRE_USUARIO = ?,
          ID_TIPOUSUARIO = ?,
          ACTIVO = ?
      `;

      const params: any[] = [
        LOGIN_USUARIO,
        NOMBRE_USUARIO,
        ID_TIPOUSUARIO,
        ACTIVO
      ];

      // Si se proporciona nueva contraseña, actualizarla
      if (PASSWORD_USUARIO && PASSWORD_USUARIO.trim() !== '') {
        const hashedPassword = await bcrypt.hash(PASSWORD_USUARIO, 10);
        query += ', PASSWORD_USUARIO = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE ID_USUARIO = ?';
      params.push(ID_USUARIO);

      await db.execute(query, params);

      return {
        success: true,
        message: 'Usuario actualizado exitosamente'
      };
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar usuario'
      };
    }
  }

  /**
   * Eliminar usuario (soft delete - marcar como inactivo)
   */
  async deleteUser(event: any, userId: number): Promise<IpcResponse<void>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'ID de usuario es requerido'
        };
      }

      // Verificar que el usuario existe
      const users = await db.query(
        'SELECT ID_USUARIO FROM USUARIO WHERE ID_USUARIO = ?',
        [userId]
      );

      if (users.length === 0) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // Soft delete - marcar como inactivo en lugar de eliminar
      await db.execute(
        'UPDATE USUARIO SET ACTIVO = 0 WHERE ID_USUARIO = ?',
        [userId]
      );

      return {
        success: true,
        message: 'Usuario eliminado exitosamente'
      };
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar usuario'
      };
    }
  }

  /**
   * Crear nuevo tipo de usuario
   */
  async createUserType(event: any, typeData: any): Promise<IpcResponse<void>> {
    try {
      const { NOMBRE_TIPO, PERMISOS } = typeData;

      if (!NOMBRE_TIPO) {
        return {
          success: false,
          error: 'Nombre del tipo es requerido'
        };
      }

      // Verificar si el nombre ya existe
      const existingTypes = await db.query(
        'SELECT ID_TIPOUSUARIO FROM TIPOUSUARIO WHERE NOMBRE_TIPO = ?',
        [NOMBRE_TIPO]
      );

      if (existingTypes.length > 0) {
        return {
          success: false,
          error: 'El tipo de usuario ya existe'
        };
      }

      // Convertir permisos a JSON string
      const permisosJSON = JSON.stringify(PERMISOS || []);

      await db.execute(`
        INSERT INTO TIPOUSUARIO (NOMBRE_TIPO, PERMISOS)
        VALUES (?, ?)
      `, [NOMBRE_TIPO, permisosJSON]);

      return {
        success: true,
        message: 'Tipo de usuario creado exitosamente'
      };
    } catch (error: any) {
      console.error('Error creando tipo de usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al crear tipo de usuario'
      };
    }
  }

  /**
   * Actualizar tipo de usuario existente
   */
  async updateUserType(event: any, typeData: any): Promise<IpcResponse<void>> {
    try {
      const { ID_TIPOUSUARIO, NOMBRE_TIPO, PERMISOS } = typeData;

      if (!ID_TIPOUSUARIO) {
        return {
          success: false,
          error: 'ID del tipo es requerido'
        };
      }

      // Convertir permisos a JSON string
      const permisosJSON = JSON.stringify(PERMISOS || []);

      await db.execute(`
        UPDATE TIPOUSUARIO SET
          NOMBRE_TIPO = ?,
          PERMISOS = ?
        WHERE ID_TIPOUSUARIO = ?
      `, [NOMBRE_TIPO, permisosJSON, ID_TIPOUSUARIO]);

      return {
        success: true,
        message: 'Tipo de usuario actualizado exitosamente'
      };
    } catch (error: any) {
      console.error('Error actualizando tipo de usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar tipo de usuario'
      };
    }
  }

  /**
   * Eliminar tipo de usuario
   */
  async deleteUserType(event: any, typeId: number): Promise<IpcResponse<void>> {
    try {
      if (!typeId) {
        return {
          success: false,
          error: 'ID del tipo es requerido'
        };
      }

      // Verificar si hay usuarios con este tipo
      const usersWithType = await db.query(
        'SELECT COUNT(*) as count FROM USUARIO WHERE ID_TIPOUSUARIO = ?',
        [typeId]
      );

      if (usersWithType[0].count > 0) {
        return {
          success: false,
          error: 'No se puede eliminar: hay usuarios asignados a este tipo'
        };
      }

      await db.execute(
        'DELETE FROM TIPOUSUARIO WHERE ID_TIPOUSUARIO = ?',
        [typeId]
      );

      return {
        success: true,
        message: 'Tipo de usuario eliminado exitosamente'
      };
    } catch (error: any) {
      console.error('Error eliminando tipo de usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar tipo de usuario'
      };
    }
  }
}

export const adminHandler = new AdminHandler();
