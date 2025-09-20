import React, { useState } from 'react';
import { useAuth } from '../store/authStore';

const Dashboard: React.FC = () => {
  const { 
    user, 
    sucursal, 
    getUserName, 
    getUserType,
    hasPermission,
    canViewReports,
    canManageInventory,
    canManageUsers
  } = useAuth();

  const [testResult, setTestResult] = useState<any>(null);

  // Funciones de prueba para verificar la conectividad con el backend
  const testPrintTicket = async () => {
    try {
      const testTicket = {
        storeName: "FARMACIAS MS - PRUEBA",
        storeAddress: sucursal?.DIRECCION || "Dirección de prueba",
        items: [
          { name: "Aspirina 500mg", quantity: 2, price: 15.50 },
          { name: "Paracetamol 500mg", quantity: 1, price: 12.00 }
        ],
        total: 43.00,
        tipoPago: 'EFECTIVO' as const,
        usuario: getUserName(),
        sucursal: sucursal?.NOMBRE_SUCURSAL
      };

      const result = await window.electronAPI.printTicket(testTicket);
      setTestResult({ type: 'print', result });
    } catch (error) {
      setTestResult({ type: 'print', error: error.message });
    }
  };

  const testCashDrawer = async () => {
    try {
      const result = await window.electronAPI.openCashDrawer();
      setTestResult({ type: 'drawer', result });
    } catch (error) {
      setTestResult({ type: 'drawer', error: error.message });
    }
  };

  const testDatabaseQuery = async () => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM PRODUCTO WHERE ACTIVO = 1', []);
      setTestResult({ type: 'db', result });
    } catch (error) {
      setTestResult({ type: 'db', error: error.message });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header del Dashboard */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Principal
          </h1>
          <p className="text-gray-600">
            Bienvenido al Sistema POS de Farmacias MS
          </p>
        </div>

        {/* Información del usuario y sucursal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">👤 Usuario Actual</h3>
            <p className="text-blue-800"><strong>Nombre:</strong> {getUserName()}</p>
            <p className="text-blue-800"><strong>Tipo:</strong> {getUserType()}</p>
            <p className="text-blue-800"><strong>Login:</strong> {user?.LOGIN_USUARIO}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">🏪 Sucursal</h3>
            <p className="text-green-800"><strong>Nombre:</strong> {sucursal?.NOMBRE_SUCURSAL}</p>
            <p className="text-green-800"><strong>ID:</strong> {sucursal?.SUCURSAL_ID}</p>
            <p className="text-green-800"><strong>Razón Social:</strong> {sucursal?.RAZON_SOCIAL}</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">🔐 Permisos</h3>
            <div className="space-y-1 text-sm">
              <p className={`${canViewReports() ? 'text-green-600' : 'text-red-600'}`}>
                {canViewReports() ? '✅' : '❌'} Reportes
              </p>
              <p className={`${canManageInventory() ? 'text-green-600' : 'text-red-600'}`}>
                {canManageInventory() ? '✅' : '❌'} Inventario
              </p>
              <p className={`${canManageUsers() ? 'text-green-600' : 'text-red-600'}`}>
                {canManageUsers() ? '✅' : '❌'} Usuarios
              </p>
            </div>
          </div>
        </div>

        {/* Funciones de prueba */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🧪 Pruebas del Sistema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testPrintTicket}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🖨️ Probar Impresión
            </button>
            
            <button
              onClick={testCashDrawer}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              💰 Probar Cajón
            </button>
            
            <button
              onClick={testDatabaseQuery}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              🗄️ Probar Base de Datos
            </button>
          </div>

          {/* Resultados de pruebas */}
          {testResult && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                Resultado de la prueba: {testResult.type}
              </h3>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(testResult.result || testResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Navegación rápida */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Navegación Rápida</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 transition-colors">
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-semibold">Ventas</div>
            </button>
            
            <button 
              className={`p-4 rounded-lg transition-colors ${
                canManageInventory() 
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canManageInventory()}
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-semibold">Inventario</div>
            </button>
            
            <button 
              className={`p-4 rounded-lg transition-colors ${
                canViewReports() 
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canViewReports()}
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">Reportes</div>
            </button>
            
            <button 
              className={`p-4 rounded-lg transition-colors ${
                canManageUsers() 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canManageUsers()}
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="font-semibold">Administración</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;