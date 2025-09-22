import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { prepareTicketData } from '../utils/logoUtils';

interface VentaResumen {
  foliosVendidos: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalGeneral: number;
  notasCanceladas: number;
  montoNotasCanceladas: number;
  primerFolio: string;
  ultimoFolio: string;
  ventasDetalle: VentaDetalle[];
}

interface VentaDetalle {
  folio: string;
  fecha: string;
  total: number;
  tipoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
  cancelada: boolean;
  usuario: string;
}

interface CorteData {
  fecha: string;
  usuario: string;
  sucursal: string;
  tipoCorte: 'PARCIAL' | 'FINAL';
  ventasResumen: VentaResumen;
  efectivoContado: number;
  diferencia: number;
  observaciones: string;
}

const CorteCaja: React.FC = () => {
  const { user, sucursal, hasPermission } = useAuth();
  const [ventasResumen, setVentasResumen] = useState<VentaResumen | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCorteModal, setShowCorteModal] = useState(false);
  const [tipoCorte, setTipoCorte] = useState<'PARCIAL' | 'FINAL'>('PARCIAL');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarResumenVentas();
  }, [fechaInicio, fechaFin]);

  const cargarResumenVentas = async () => {
    setLoading(true);
    try {
      console.log('Cargando resumen de ventas del', fechaInicio, 'al', fechaFin);
      
      // Obtener datos reales de ventas
      const result = await window.electronAPI.getResumenVentas({
        fechaInicio,
        fechaFin
      });
      
      if (!result.success) {
        console.error('Error cargando resumen de ventas:', result.error);
        setVentasResumen(null);
        return;
      }

      console.log('Datos recibidos del backend:', result.data);
      
      // Usar datos reales del backend
      const resumenVentas: VentaResumen = result.data;
      
      setVentasResumen(resumenVentas);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularDiferencia = () => {
    if (!ventasResumen || !efectivoContado) return 0;
    const efectivoNum = parseFloat(efectivoContado) || 0;
    return efectivoNum - ventasResumen.totalEfectivo;
  };

  const procesarCorte = async () => {
    if (!ventasResumen) return;

    const diferencia = calcularDiferencia();
    
    const corteData: CorteData = {
      fecha: new Date().toISOString(),
      usuario: user?.NOMBRE_USUARIO || '',
      sucursal: sucursal?.NOMBRE_SUCURSAL || '',
      tipoCorte,
      ventasResumen,
      efectivoContado: parseFloat(efectivoContado) || 0,
      diferencia,
      observaciones
    };

    try {
      console.log('Procesando corte:', corteData);

      // Imprimir reporte de corte
      await imprimirCorte(corteData);

      // Si es corte final, aquí se cerraría el turno
      if (tipoCorte === 'FINAL') {
        alert('Corte final procesado. Turno cerrado.');
      } else {
        alert('Corte parcial generado exitosamente.');
      }

      setShowCorteModal(false);
      setEfectivoContado('');
      setObservaciones('');
      
    } catch (error) {
      console.error('Error procesando corte:', error);
      alert('Error al procesar el corte');
    }
  };

  const imprimirCorte = async (corteData: CorteData) => {
    const ticketData = {
      storeName: corteData.sucursal,
      storeAddress: sucursal?.DIRECCION || '',
      ticketNumber: `CORTE-${Date.now().toString().slice(-6)}`,
      items: [], // Los cortes no tienen items
      total: corteData.ventasResumen.totalGeneral,
      date: new Date().toLocaleString('es-ES'),
      corteData // Datos específicos del corte
    };

    const ticketWithLogo = await prepareTicketData(ticketData);
    await window.electronAPI.printTicket(ticketWithLogo);
  };

  if (!hasPermission('corte_caja')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-600">No tienes permisos para realizar corte de caja.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Corte de Caja</h1>
        <p className="text-gray-600">Gestión de cortes parciales y finales</p>
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">📅 Período de Consulta</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={cargarResumenVentas}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Cargando...' : 'Consultar'}
            </button>
          </div>
        </div>
      </div>

      {/* Resumen de ventas */}
      {ventasResumen && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📊 Resumen de Ventas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Folios Vendidos</h3>
              <p className="text-2xl font-bold text-blue-600">{ventasResumen.foliosVendidos}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Total Efectivo</h3>
              <p className="text-2xl font-bold text-green-600">${ventasResumen.totalEfectivo.toFixed(2)}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">Total Tarjeta</h3>
              <p className="text-2xl font-bold text-purple-600">${ventasResumen.totalTarjeta.toFixed(2)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800">Total General</h3>
              <p className="text-2xl font-bold text-gray-600">${ventasResumen.totalGeneral.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Notas Canceladas</h3>
              <p className="text-xl font-bold text-red-600">{ventasResumen.notasCanceladas}</p>
              <p className="text-sm text-red-600">${ventasResumen.montoNotasCanceladas.toFixed(2)}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">Primer Folio</h3>
              <p className="text-lg font-bold text-yellow-600">{ventasResumen.primerFolio}</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-orange-800">Último Folio</h3>
              <p className="text-lg font-bold text-orange-600">{ventasResumen.ultimoFolio}</p>
            </div>
          </div>

          {/* Detalle de ventas */}
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3">📋 Detalle de Ventas</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo Pago</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ventasResumen.ventasDetalle.map((venta, index) => (
                    <tr key={index} className={venta.cancelada ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{venta.folio}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {new Date(venta.fecha).toLocaleString('es-ES')}
                      </td>
                      <td className="px-4 py-2 text-sm font-bold text-green-600">
                        ${venta.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          venta.tipoPago === 'EFECTIVO' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {venta.tipoPago}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          venta.cancelada 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {venta.cancelada ? 'CANCELADA' : 'ACTIVA'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{venta.usuario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Acciones de corte */}
      {ventasResumen && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">⚡ Acciones de Corte</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setTipoCorte('PARCIAL');
                setShowCorteModal(true);
              }}
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <div className="text-xl mb-2">📊</div>
              <div className="font-semibold">Corte Parcial</div>
              <div className="text-sm opacity-90">Consulta sin cerrar turno</div>
            </button>
            
            <button
              onClick={() => {
                setTipoCorte('FINAL');
                setShowCorteModal(true);
              }}
              className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <div className="text-xl mb-2">🔒</div>
              <div className="font-semibold">Corte Final</div>
              <div className="text-sm opacity-90">Cierra el turno definitivamente</div>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Corte */}
      {showCorteModal && ventasResumen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {tipoCorte === 'PARCIAL' ? '📊 Corte Parcial' : '🔒 Corte Final'}
            </h3>
            
            <div className="space-y-4">
              {/* Resumen */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Resumen de Ventas</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Total Efectivo: <strong>${ventasResumen.totalEfectivo.toFixed(2)}</strong></div>
                  <div>Total Tarjeta: <strong>${ventasResumen.totalTarjeta.toFixed(2)}</strong></div>
                  <div>Folios Vendidos: <strong>{ventasResumen.foliosVendidos}</strong></div>
                  <div>Total General: <strong>${ventasResumen.totalGeneral.toFixed(2)}</strong></div>
                </div>
              </div>

              {/* Efectivo contado */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  💵 Efectivo Contado en Caja
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={efectivoContado}
                  onChange={(e) => setEfectivoContado(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Diferencia */}
              {efectivoContado && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Diferencia en Caja:</div>
                  <div className={`text-lg font-bold ${
                    calcularDiferencia() === 0 ? 'text-green-600' :
                    calcularDiferencia() > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    ${calcularDiferencia().toFixed(2)}
                    {calcularDiferencia() > 0 && ' (Sobrante)'}
                    {calcularDiferencia() < 0 && ' (Faltante)'}
                    {calcularDiferencia() === 0 && ' (Cuadrada)'}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium mb-1">📝 Observaciones</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones adicionales (opcional)"
                />
              </div>

              {tipoCorte === 'FINAL' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-red-800">¡Atención! Corte Final</h4>
                      <p className="text-sm text-red-700">
                        Esta acción cerrará definitivamente el turno. No podrá realizar más ventas hasta abrir un nuevo turno.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCorteModal(false);
                  setEfectivoContado('');
                  setObservaciones('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={procesarCorte}
                disabled={!efectivoContado}
                className={`px-4 py-2 text-white rounded hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed ${
                  tipoCorte === 'PARCIAL' ? 'bg-blue-600' : 'bg-red-600'
                }`}
              >
                {tipoCorte === 'PARCIAL' ? 'Generar Corte Parcial' : 'Procesar Corte Final'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorteCaja;