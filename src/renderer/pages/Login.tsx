import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/common/Logo';

interface LoginCredentials {
  usuario: string;
  password: string;
}

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({ 
    usuario: '', 
    password: '' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const login = useAuthStore((state) => state.login);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.usuario.trim() || !credentials.password.trim()) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(credentials);
      
      if (!result.success) {
        setError(result.error || 'Error de autenticación');
      }
      // Si es exitoso, el store manejará la redirección
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión. Verifique que la aplicación esté funcionando correctamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header con logo */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-center">
          <Logo size="large" variant="vertical" className="mx-auto" showText={false} />
          <div className="text-white mt-4">
            <h1 className="text-2xl font-bold">FARMACIAS MS</h1>
            <p className="text-sm opacity-90 mt-1">GRUPO SIMILARES Y GENÉRICOS</p>
          </div>
          <h3 className="text-white text-xl font-semibold mt-4">SISTEMA POS</h3>
          <p className="text-blue-100 text-sm">Punto de Venta Local</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <h3 className="text-center text-2xl font-bold text-gray-800 mb-6">Iniciar Sesión</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input 
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ingrese su usuario"
                value={credentials.usuario}
                onChange={(e) => handleInputChange('usuario', e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input 
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ingrese su contraseña"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex justify-center gap-4 pt-4">
              <button 
                type="submit" 
                className={`px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg transition-all transform ${
                  isLoading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-blue-700 hover:scale-105 active:scale-95'
                } shadow-lg`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verificando...</span>
                  </div>
                ) : (
                  'INGRESAR'
                )}
              </button>
              
              <button 
                type="button" 
                className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                onClick={() => {
                  setCredentials({ usuario: '', password: '' });
                  setError('');
                }}
                disabled={isLoading}
              >
                LIMPIAR
              </button>
            </div>
          </form>

          {/* Panel de usuarios de prueba */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3 text-center">👥 Usuarios de Prueba</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded border">
                <strong className="text-red-600">🔑 Administrador:</strong> admin / admin123
                <br />
                <span className="text-gray-600">Acceso completo al sistema</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <strong className="text-blue-600">👨‍💼 Supervisor:</strong> supervisor / super123
                <br />
                <span className="text-gray-600">Ventas, inventario, reportes, PLM</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <strong className="text-green-600">💰 Cajero:</strong> cajero / cajero123
                <br />
                <span className="text-gray-600">Solo ventas y corte de caja</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <strong className="text-green-600">💰 Cajera:</strong> maria / maria123
                <br />
                <span className="text-gray-600">Solo ventas y corte de caja</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-center text-gray-500">
              🔧 Entorno de desarrollo - Todos los usuarios están disponibles
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-xs text-gray-500">
            Sistema POS Farmacias MS v1.0.0
          </p>
          <p className="text-xs text-gray-400">
            Offline-first con sincronización a la nube
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;