import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario, Sucursal, IpcResponse } from '../../shared/types/index.js';

interface LoginCredentials {
  usuario: string;
  password: string;
}

interface AuthState {
  // Estado
  user: Usuario | null;
  sucursal: Sucursal | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  login: (credentials: LoginCredentials) => Promise<IpcResponse<{ user: Usuario; token: string }>>;
  logout: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
  clearError: () => void;
  updateUser: (user: Partial<Usuario>) => void;
  updateSucursal: (sucursal: Partial<Sucursal>) => void;
  
  // Helpers
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isCajero: () => boolean;
  isSupervisor: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      sucursal: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acción de login
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          // Llamar al IPC para autenticar
          const response = await window.electronAPI.login(credentials);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Obtener información de sucursal
            const sucursalResponse = await window.electronAPI.getSucursal();
            
            set({
              user,
              token,
              sucursal: sucursalResponse.success ? sucursalResponse.data : null,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            console.log('Login exitoso:', user.NOMBRE_USUARIO);
            
            return response;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Error de autenticación'
            });
            
            return response;
          }
        } catch (error) {
          const errorMessage = 'Error de conexión con la aplicación';
          console.error('Error en login:', error);
          
          set({
            isLoading: false,
            error: errorMessage
          });

          return {
            success: false,
            error: errorMessage
          };
        }
      },

      // Acción de logout
      logout: async () => {
        const { user } = get();
        
        try {
          if (user) {
            await window.electronAPI.logout(user.ID_USUARIO);
          }
        } catch (error) {
          console.error('Error en logout:', error);
        } finally {
          // Limpiar estado siempre
          set({
            user: null,
            sucursal: null,
            token: null,
            isAuthenticated: false,
            error: null
          });
          
          // Limpiar localStorage
          localStorage.removeItem('farmacia-auth-storage');
          
          console.log('Sesión cerrada correctamente');
        }
      },

      // Verificar token válido
      verifyToken: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        try {
          const response = await window.electronAPI.verifyToken(token);
          
          if (response.success && response.data) {
            // Token válido, actualizar usuario
            set({
              user: response.data,
              isAuthenticated: true,
              error: null
            });
            
            return true;
          } else {
            // Token inválido, limpiar sesión
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              error: null
            });
            
            return false;
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: 'Error de verificación de sesión'
          });
          
          return false;
        }
      },

      // Limpiar error
      clearError: () => {
        set({ error: null });
      },

      // Actualizar usuario
      updateUser: (userUpdate: Partial<Usuario>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userUpdate } });
        }
      },

      // Actualizar sucursal
      updateSucursal: (sucursalUpdate: Partial<Sucursal>) => {
        const { sucursal } = get();
        if (sucursal) {
          set({ sucursal: { ...sucursal, ...sucursalUpdate } });
        }
      },

      // Verificar permisos
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user || !user.PERMISOS) return false;
        
        // Los admin tienen todos los permisos
        if (user.ID_TIPOUSUARIO === 1) return true;
        
        return user.PERMISOS.includes(permission);
      },

      // Verificar si es administrador
      isAdmin: () => {
        const { user } = get();
        return user?.ID_TIPOUSUARIO === 1;
      },

      // Verificar si es cajero
      isCajero: () => {
        const { user } = get();
        return user?.ID_TIPOUSUARIO === 2;
      },

      // Verificar si es supervisor
      isSupervisor: () => {
        const { user } = get();
        return user?.ID_TIPOUSUARIO === 3;
      }
    }),
    {
      name: 'farmacia-auth-storage',
      partialize: (state) => ({
        user: state.user,
        sucursal: state.sucursal,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Hook personalizado para facilitar el uso
export const useAuth = () => {
  const authState = useAuthStore();
  
  return {
    ...authState,
    
    // Métodos de conveniencia
    getUserName: () => authState.user?.NOMBRE_USUARIO || '',
    getUserType: () => {
      if (authState.isAdmin()) return 'Administrador';
      if (authState.isSupervisor()) return 'Supervisor';
      if (authState.isCajero()) return 'Cajero';
      return 'Usuario';
    },
    getSucursalName: () => authState.sucursal?.NOMBRE_SUCURSAL || '',
    getRazonSocial: () => authState.sucursal?.RAZON_SOCIAL || '',
    
    // Verificación de permisos específicos
    canManageUsers: () => authState.hasPermission('usuarios'),
    canViewReports: () => authState.hasPermission('reportes'),
    canManageInventory: () => authState.hasPermission('inventario'),
    canCancelSales: () => authState.hasPermission('cancelar_ventas'),
    canBackup: () => authState.hasPermission('backup'),
    canSync: () => authState.hasPermission('sincronizacion'),
    canViewPLM: () => authState.hasPermission('plm'),
    canManageConfig: () => authState.hasPermission('configuracion')
  };
};