import React, { useState } from 'react';
import { useAuth } from '../../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    user, 
    sucursal, 
    logout, 
    getUserName, 
    getUserType, 
    getSucursalName 
  } = useAuth();
  
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      console.log('Iniciando proceso de logout...');
      await logout();
      console.log('Logout completado, redirigiendo...');
    }
  };

  const currentTime = new Date().toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-300 rounded-full w-16 h-16 flex items-center justify-center shadow-md">
                <div className="text-center">
                  <h1 className="text-sm font-bold text-red-600 leading-tight">FARMACIAS</h1>
                  <h2 className="text-lg font-bold text-blue-600 leading-tight">MS</h2>
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sistema POS
                </h1>
                <p className="text-sm text-gray-600">
                  {getSucursalName()}
                </p>
              </div>
            </div>

            {/* Centro - Información del sistema */}
            <div className="hidden md:block text-center">
              <p className="text-sm text-gray-600 capitalize">
                {currentTime}
              </p>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Sistema Activo</span>
              </div>
            </div>

            {/* Usuario y acciones */}
            <div className="flex items-center space-x-4">
              {/* Información del usuario */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {getUserName()}
                </p>
                <p className="text-xs text-gray-600">
                  {getUserType()}
                </p>
              </div>

              {/* Avatar y menú */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold hover:bg-blue-700 transition-colors"
                >
                  {getUserName().charAt(0).toUpperCase()}
                </button>

                {/* Menú desplegable */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{getUserName()}</p>
                      <p className="text-sm text-gray-600">{getUserType()}</p>
                    </div>
                    
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // TODO: Abrir modal de cambio de contraseña
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        🔑 Cambiar Contraseña
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // TODO: Abrir modal de configuración
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        ⚙️ Configuración
                      </button>
                      
                      <hr className="my-1" />
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        🚪 Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <span>© 2024 Farmacias MS - Sistema POS v1.0.0</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span>Sucursal: {sucursal?.SUCURSAL_ID}</span>
              <span>•</span>
              <span>Usuario: {user?.LOGIN_USUARIO}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Overlay para cerrar menús */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default Layout;