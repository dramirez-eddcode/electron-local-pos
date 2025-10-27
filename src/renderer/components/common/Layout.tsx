import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const {
    user,
    sucursal,
    logout,
    getUserName,
    getUserType,
    getSucursalName,
    hasPermission
  } = useAuth();
  
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      console.log('Iniciando proceso de logout...');
      await logout();
      console.log('Logout completado, redirigiendo...');
    }
  };

  const currentTime = useMemo(() => {
    return new Date().toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []); // Solo calcular una vez al montar

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <Logo size="medium" variant="horizontal" showText={false} />
              
              <div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Sistema POS
                </button>
                <p className="text-sm text-gray-600">
                  {getSucursalName()}
                </p>
              </div>
              
              {/* Botón Home explícito */}
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                title="Ir al Dashboard Principal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Dashboard</span>
              </button>
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
                          navigate('/dashboard');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        🏠 Ir al Dashboard
                      </button>
                      
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

                      {hasPermission('backup') && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/backup');
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          💾 Respaldos
                        </button>
                      )}
                      
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