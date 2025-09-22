import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/authStore';
import { prepareTicketData } from '../utils/logoUtils';
import type { Producto, ItemCarrito } from '../../shared/types/index.js';

const POS: React.FC = () => {
  const { user, sucursal } = useAuth();
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [efectivo, setEfectivo] = useState('');
  const [cambio, setCambio] = useState(0);
  
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Calcular total cuando cambie el carrito
  useEffect(() => {
    const nuevoTotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    setTotal(nuevoTotal);
  }, [carrito]);

  // Calcular cambio cuando cambie efectivo
  useEffect(() => {
    const efectivoNum = parseFloat(efectivo) || 0;
    setCambio(efectivoNum - total);
  }, [efectivo, total]);

  // Focus automático en búsqueda
  useEffect(() => {
    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  }, []);

  const buscarProductos = async (termino: string) => {
    if (!termino.trim()) {
      setProductos([]);
      return;
    }

    setLoading(true);
    try {
      // Simular búsqueda (luego conectar con la API)
      const productosSimulados: Producto[] = [
        {
          ID_PRODUCTO: 1,
          CODIGO_BARRAS: '7501234567890',
          CODIGO_PLM: 'PLM001',
          NOMBRE_PRODUCTO: 'PARACETAMOL 500mg 20 TAB',
          DESCRIPCION: 'Analgésico y antipirético',
          PRECIO_VENTA: 25.50,
          PRECIO_COMPRA: 18.00,
          STOCK_ACTUAL: 150,
          STOCK_MINIMO: 20,
          ACTIVO: true,
          SUCURSAL_ID: sucursal?.SUCURSAL_ID || '',
          FECHA_CREACION: new Date(),
          FECHA_ACTUALIZACION: new Date(),
          SINCRONIZADO: true,
          FECHA_SINCRONIZACION: new Date()
        },
        {
          ID_PRODUCTO: 2,
          CODIGO_BARRAS: '7501234567891',
          CODIGO_PLM: 'PLM002',
          NOMBRE_PRODUCTO: 'IBUPROFENO 400mg 20 CAP',
          DESCRIPCION: 'Antiinflamatorio no esteroideo',
          PRECIO_VENTA: 35.00,
          PRECIO_COMPRA: 25.00,
          STOCK_ACTUAL: 80,
          STOCK_MINIMO: 15,
          ACTIVO: true,
          SUCURSAL_ID: sucursal?.SUCURSAL_ID || '',
          FECHA_CREACION: new Date(),
          FECHA_ACTUALIZACION: new Date(),
          SINCRONIZADO: true,
          FECHA_SINCRONIZACION: new Date()
        }
      ].filter(p => 
        p.NOMBRE_PRODUCTO.toLowerCase().includes(termino.toLowerCase()) ||
        p.CODIGO_BARRAS.includes(termino) ||
        p.CODIGO_PLM.toLowerCase().includes(termino.toLowerCase())
      );

      setProductos(productosSimulados);
    } catch (error) {
      console.error('Error buscando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (producto: Producto) => {
    const itemExistente = carrito.find(item => item.ID_PRODUCTO === producto.ID_PRODUCTO);
    
    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.ID_PRODUCTO === producto.ID_PRODUCTO
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      const nuevoItem: ItemCarrito = {
        ID_PRODUCTO: producto.ID_PRODUCTO,
        CODIGO_BARRAS: producto.CODIGO_BARRAS,
        NOMBRE_PRODUCTO: producto.NOMBRE_PRODUCTO,
        precio: producto.PRECIO_VENTA,
        cantidad: 1,
        subtotal: producto.PRECIO_VENTA
      };
      setCarrito([...carrito, nuevoItem]);
    }
    
    // Limpiar búsqueda y enfocar
    setBusqueda('');
    setProductos([]);
    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  };

  const modificarCantidad = (ID_PRODUCTO: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(ID_PRODUCTO);
      return;
    }

    setCarrito(carrito.map(item =>
      item.ID_PRODUCTO === ID_PRODUCTO
        ? { ...item, cantidad: nuevaCantidad, subtotal: item.precio * nuevaCantidad }
        : item
    ));
  };

  const eliminarDelCarrito = (ID_PRODUCTO: number) => {
    setCarrito(carrito.filter(item => item.ID_PRODUCTO !== ID_PRODUCTO));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setBusqueda('');
    setProductos([]);
    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) return;

    const efectivoNum = parseFloat(efectivo) || 0;
    if (efectivoNum < total) {
      alert('El efectivo recibido es insuficiente');
      return;
    }

    try {
      // Simular procesamiento de venta
      const ventaData = {
        items: carrito,
        total,
        efectivo: efectivoNum,
        cambio,
        usuario: user?.NOMBRE_USUARIO,
        sucursal: sucursal?.NOMBRE_SUCURSAL
      };

      console.log('Procesando venta:', ventaData);

      // Preparar datos del ticket con logo
      const baseTicketData = {
        storeName: sucursal?.RAZON_SOCIAL || 'FARMACIAS MS',
        storeAddress: sucursal?.DIRECCION || 'Dirección de la farmacia',
        ticketNumber: Date.now().toString().slice(-6),
        items: carrito.map(item => ({
          name: item.NOMBRE_PRODUCTO,
          quantity: item.cantidad,
          price: item.precio
        })),
        total,
        date: new Date().toLocaleString('es-ES')
      };

      const ticketData = await prepareTicketData(baseTicketData);

      const printResult = await window.electronAPI.printTicket(ticketData);
      
      if (printResult.success) {
        alert('Venta procesada correctamente');
        limpiarCarrito();
        setShowPaymentModal(false);
        setEfectivo('');
      } else {
        alert('Error al imprimir ticket: ' + printResult.error);
      }

    } catch (error) {
      console.error('Error procesando venta:', error);
      alert('Error procesando la venta');
    }
  };

  const currentTime = new Date().toLocaleString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-2 flex justify-between items-center border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">🛒 Punto de Venta</h1>
          <span className="text-sm text-gray-600">
            Cajero: {user?.NOMBRE_USUARIO}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {currentTime}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Panel Izquierdo - Búsqueda y Productos */}
        <div className="w-1/2 p-4 border-r">
          {/* Búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <input
                ref={inputBusquedaRef}
                type="text"
                placeholder="Buscar por código, nombre o PLM..."
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  buscarProductos(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && productos.length > 0) {
                    agregarAlCarrito(productos[0]);
                  }
                }}
              />
              <div className="absolute right-3 top-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          <div className="bg-white rounded-lg shadow-sm border max-h-96 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-gray-500">
                Buscando productos...
              </div>
            )}
            
            {!loading && productos.length === 0 && busqueda && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron productos
              </div>
            )}
            
            {!loading && productos.length === 0 && !busqueda && (
              <div className="p-4 text-center text-gray-400">
                Escriba para buscar productos
              </div>
            )}

            {productos.map((producto, index) => (
              <div
                key={producto.ID_PRODUCTO}
                className={`p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer ${
                  index === 0 ? 'bg-blue-50' : ''
                }`}
                onClick={() => agregarAlCarrito(producto)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{producto.NOMBRE_PRODUCTO}</h3>
                    <p className="text-sm text-gray-600">{producto.DESCRIPCION}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">Código: {producto.CODIGO_BARRAS}</span>
                      <span className="text-xs text-gray-500">PLM: {producto.CODIGO_PLM}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        producto.STOCK_ACTUAL > producto.STOCK_MINIMO 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Stock: {producto.STOCK_ACTUAL}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${producto.PRECIO_VENTA.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Derecho - Carrito */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Carrito de Compras</h2>
            <button
              onClick={limpiarCarrito}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              disabled={carrito.length === 0}
            >
              Limpiar
            </button>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
            {carrito.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6 0a2 2 0 100-4 2 2 0 000 4zm-6 0a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <p>Carrito vacío</p>
                <p className="text-sm">Busque y agregue productos</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {carrito.map((item) => (
                  <div key={item.ID_PRODUCTO} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 flex-1 pr-2">
                        {item.NOMBRE_PRODUCTO}
                      </h4>
                      <button
                        onClick={() => eliminarDelCarrito(item.ID_PRODUCTO)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => modificarCantidad(item.ID_PRODUCTO, item.cantidad - 1)}
                          className="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.cantidad}</span>
                        <button
                          onClick={() => modificarCantidad(item.ID_PRODUCTO, item.cantidad + 1)}
                          className="w-8 h-8 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          ${item.precio.toFixed(2)} c/u
                        </div>
                        <div className="font-bold text-green-600">
                          ${item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total y acciones */}
          <div className="mt-4 space-y-3">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={carrito.length === 0}
                className="py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                💳 Cobrar
              </button>
              <button
                onClick={() => window.electronAPI.openCashDrawer()}
                className="py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                💰 Abrir Cajón
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Procesar Pago</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total a pagar:</label>
                <div className="text-2xl font-bold text-green-600">
                  ${total.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Efectivo recibido:</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={efectivo}
                  onChange={(e) => setEfectivo(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {efectivo && (
                <div>
                  <label className="block text-sm font-medium mb-1">Cambio:</label>
                  <div className={`text-xl font-bold ${
                    cambio >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    ${cambio.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEfectivo('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={procesarVenta}
                disabled={!efectivo || parseFloat(efectivo) < total}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Procesar Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;