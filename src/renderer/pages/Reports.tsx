import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { toast } from 'sonner';

interface ResumenVentas {
  totalVentas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  cantidadVentas: number;
  ticketPromedio: number;
}

interface Venta {
  ID_SALIDA: number;
  FOLIO_SALIDA: string;
  FECHA_SALIDA: string;
  TOTAL_SALIDA: number;
  TIPO_PAGO_SALIDA: string;
  MONTO_EFECTIVO: number;
  MONTO_TARJETA: number;
  NOMBRE_USUARIO: string;
}

interface ProductoVendido {
  ID_PRODUCTO: number;
  CODIGO_PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  cantidad_vendida: number;
  total_vendido: number;
  precio_actual: number;
}

interface VentaPorDia {
  fecha: string;
  num_ventas: number;
  total: number;
  efectivo: number;
  tarjeta: number;
}

interface ReportData {
  resumen: ResumenVentas;
  ventas: Venta[];
  productosVendidos: ProductoVendido[];
  ventasPorDia: VentaPorDia[];
}

const Reports: React.FC = () => {
  const { sucursal } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'resumen' | 'ventas' | 'productos'>('resumen');

  // Cargar reporte del día actual al montar
  useEffect(() => {
    handleGenerateReport();
  }, []);

  const handleGenerateReport = async () => {
    if (!sucursal) {
      toast.error('No se encontró información de la sucursal');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.invoke('report:getSalesReport', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        sucursalId: sucursal.SUCURSAL_ID
      });

      if (result.success) {
        setReportData(result.data);
        toast.success('Reporte generado correctamente');
      } else {
        toast.error(result.error || 'Error al generar reporte');
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      toast.error('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Reportes de Ventas</h1>
          <p className="text-gray-600 mt-1">
            Análisis y estadísticas de ventas
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Generando...' : '🔍 Generar Reporte'}
          </button>

          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setDateRange({ startDate: today, endDate: today });
              setTimeout(handleGenerateReport, 100);
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            📅 Hoy
          </button>
        </div>
      </div>

      {/* Resumen */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(reportData.resumen.totalVentas)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Efectivo</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {formatCurrency(reportData.resumen.totalEfectivo)}
                  </p>
                </div>
                <div className="text-4xl">💵</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Tarjeta</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatCurrency(reportData.resumen.totalTarjeta)}
                  </p>
                </div>
                <div className="text-4xl">💳</div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">Cantidad Ventas</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {reportData.resumen.cantidadVentas}
                  </p>
                </div>
                <div className="text-4xl">🛒</div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">
                    {formatCurrency(reportData.resumen.ticketPromedio)}
                  </p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setSelectedTab('resumen')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === 'resumen'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📊 Resumen
                </button>
                <button
                  onClick={() => setSelectedTab('ventas')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === 'ventas'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🧾 Ventas ({reportData.ventas.length})
                </button>
                <button
                  onClick={() => setSelectedTab('productos')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === 'productos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📦 Productos Más Vendidos
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Tab: Resumen */}
              {selectedTab === 'resumen' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Ventas por Día</h3>
                  {reportData.ventasPorDia.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              # Ventas
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Efectivo
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarjeta
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.ventasPorDia.map((dia) => (
                            <tr key={dia.fecha} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatDate(dia.fecha)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                {dia.num_ventas}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                {formatCurrency(dia.efectivo)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                                {formatCurrency(dia.tarjeta)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                                {formatCurrency(dia.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No hay ventas en el período seleccionado
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Ventas */}
              {selectedTab === 'ventas' && (
                <div className="space-y-6">
                  {reportData.ventas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Folio
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cajero
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo Pago
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.ventas.map((venta) => (
                            <tr key={venta.ID_SALIDA} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                #{venta.FOLIO_SALIDA}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDateTime(venta.FECHA_SALIDA)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {venta.NOMBRE_USUARIO}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  venta.TIPO_PAGO_SALIDA === 'EFECTIVO'
                                    ? 'bg-green-100 text-green-800'
                                    : venta.TIPO_PAGO_SALIDA === 'TARJETA'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {venta.TIPO_PAGO_SALIDA}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                {formatCurrency(venta.TOTAL_SALIDA)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No hay ventas registradas en el período seleccionado
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Productos Más Vendidos */}
              {selectedTab === 'productos' && (
                <div className="space-y-6">
                  {reportData.productosVendidos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Código
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Producto
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad Vendida
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Vendido
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.productosVendidos.map((producto, index) => (
                            <tr key={producto.ID_PRODUCTO} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                {producto.CODIGO_PRODUCTO}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {producto.NOMBRE_PRODUCTO}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600">
                                {producto.cantidad_vendida}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                                {formatCurrency(producto.total_vendido)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No hay productos vendidos en el período seleccionado
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Estado inicial */}
      {!reportData && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona un rango de fechas
          </h3>
          <p className="text-gray-600">
            Genera un reporte para visualizar las estadísticas de ventas
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
