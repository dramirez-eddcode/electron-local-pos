import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

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
          <div className="bg-yellow-300 rounded-full w-32 h-32 mx-auto flex items-center justify-center shadow-lg">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 leading-tight">FARMACIAS</h1>
              <h2 className="text-3xl font-bold text-blue-600 leading-tight">MS</h2>
              <p className="text-xs text-gray-700 mt-1">GRUPO</p>
              <p className="text-xs text-gray-700">SIMILARES Y GENÉRICOS</p>
            </div>
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

          {/* Información de usuario por defecto */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">👤 Usuario por defecto:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Usuario:</strong> admin</p>
              <p><strong>Contraseña:</strong> admin123</p>
              <p className="text-blue-600 mt-2">
                💡 Cambie la contraseña después del primer acceso
              </p>
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