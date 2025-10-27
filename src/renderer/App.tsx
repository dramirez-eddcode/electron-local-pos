import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './store/authStore';

// Componentes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Admin from './pages/Admin';
import CorteCaja from './pages/CorteCaja';
import Backup from './pages/Backup';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
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

  // Inicializar base de datos solo UNA vez al montar el componente
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Inicializando base de datos...');
        const dbResponse = await window.electronAPI.dbInitialize();

        if (dbResponse.success) {
          console.log('Base de datos inicializada correctamente');
          setDbInitialized(true);
        } else {
          console.error('Error inicializando base de datos:', dbResponse.error);
          setDbInitialized(false);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error inicializando aplicación:', error);
        setIsInitialized(true);
      }
    };

    initializeDatabase();
  }, []); // Solo ejecutar una vez al montar

  // Verificar token cuando está autenticado (ejecutar después de la inicialización)
  useEffect(() => {
    const checkToken = async () => {
      if (isAuthenticated && isInitialized && dbInitialized) {
        console.log('Verificando token existente...');
        await verifyToken();
      }
    };

    checkToken();
  }, [isAuthenticated, isInitialized, dbInitialized, verifyToken]);

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
    <>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
      />
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

          {/* Punto de Venta */}
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute requiredPermission="ventas">
                <Layout>
                  <POS />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute requiredPermission="inventario">
                <Layout>
                  <Inventory />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredPermission="reportes">
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredPermission="usuarios">
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route
            path="/corte-caja"
            element={
              <ProtectedRoute requiredPermission="corte_caja">
                <Layout>
                  <CorteCaja />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/backup"
            element={
              <ProtectedRoute requiredPermission="backup">
                <Layout>
                  <Backup />
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
    </>
  );
}

export default App;