import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/authStore';

// Componentes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  const { 
    isAuthenticated, 
    verifyToken, 
    isLoading: authLoading 
  } = useAuth();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Inicializando aplicación...');
        
        // 1. Inicializar base de datos
        console.log('Inicializando base de datos...');
        const dbResponse = await window.electronAPI.dbInitialize();
        
        if (dbResponse.success) {
          console.log('Base de datos inicializada correctamente');
          setDbInitialized(true);
        } else {
          console.error('Error inicializando base de datos:', dbResponse.error);
          // Continuar aunque falle la DB para mostrar error
          setDbInitialized(false);
        }

        // 2. Verificar token si existe
        if (isAuthenticated) {
          console.log('Verificando token existente...');
          await verifyToken();
        }

        console.log('Aplicación inicializada');
        setIsInitialized(true);

      } catch (error) {
        console.error('Error inicializando aplicación:', error);
        setIsInitialized(true); // Continuar para mostrar error
      }
    };

    initializeApp();
  }, [isAuthenticated, verifyToken]);

  // Mostrar pantalla de carga mientras inicializa
  if (!isInitialized || authLoading) {
    return <LoadingScreen message="Inicializando Sistema POS..." />;
  }

  // Mostrar error si la base de datos no se pudo inicializar
  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error de Base de Datos</h3>
          <p className="text-gray-600 mb-4">
            No se pudo inicializar la base de datos local.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Ruta de login - solo accesible si NO está autenticado */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Login />
            } 
          />

          {/* Rutas protegidas */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Rutas futuras del sistema */}
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Módulo POS</h1>
                    <p className="text-gray-600 mt-2">
                      FASE 3 - Punto de Venta (En desarrollo)
                    </p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute requiredPermission="inventario">
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Inventario</h1>
                    <p className="text-gray-600 mt-2">
                      Gestión de productos (En desarrollo)
                    </p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/reports" 
            element={
              <ProtectedRoute requiredPermission="reportes">
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Reportes</h1>
                    <p className="text-gray-600 mt-2">
                      Reportes y estadísticas (En desarrollo)
                    </p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole={1}>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Administración</h1>
                    <p className="text-gray-600 mt-2">
                      Panel de administrador (En desarrollo)
                    </p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Redirección por defecto */}
          <Route 
            path="/" 
            element={
              <Navigate 
                to={isAuthenticated ? "/dashboard" : "/login"} 
                replace 
              />
            } 
          />

          {/* Página 404 */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Página no encontrada</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Volver
                  </button>
                </div>
              </div>
            } 
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;