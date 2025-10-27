import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../store/authStore';
import { prepareTicketData } from '../utils/logoUtils';
import type { Producto, ItemCarrito } from '../../shared/types/index.js';

// Constante para la tasa de IVA en México
const TASA_IVA = 0.16;

const POS: React.FC = () => {
  const { user, sucursal } = useAuth();
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalIVA, setTotalIVA] = useState(0);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tipoPago, setTipoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
  const [efectivo, setEfectivo] = useState('');
  const [cambio, setCambio] = useState(0);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const productListRef = useRef<HTMLDivElement>(null);

  // Función para enfocar input inmediatamente
  const enfocarInput = useCallback(() => {
    // Limpiar timeout anterior si existe
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    // Focus inmediato si el input está disponible
    if (inputBusquedaRef.current && !procesandoVenta && !showPaymentModal) {
      try {
        inputBusquedaRef.current.focus();
        inputBusquedaRef.current.select();
      } catch (error) {
        console.warn('Error enfocando input:', error);
      }
    }
  }, [procesandoVenta, showPaymentModal]);
  
  // Limpiar timeout al desmontar componente
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Calcular totales cuando cambie el carrito
  useEffect(() => {
    const nuevoSubtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0);
    const nuevoIVA = carrito.reduce((sum, item) => sum + item.iva, 0);
    const nuevoTotal = carrito.reduce((sum, item) => sum + item.totalConIVA, 0);

    setSubtotal(nuevoSubtotal);
    setTotalIVA(nuevoIVA);
    setTotal(nuevoTotal);
  }, [carrito]);

  // Calcular cambio cuando cambie efectivo (solo para efectivo)
  useEffect(() => {
    if (tipoPago === 'EFECTIVO') {
      const efectivoNum = parseFloat(efectivo) || 0;
      setCambio(efectivoNum - total);
    } else {
      setCambio(0);
    }
  }, [efectivo, total, tipoPago]);

  // Focus automático en búsqueda
  useEffect(() => {
    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  }, []);

  // Auto-focus cuando se cierra el modal de pago
  useEffect(() => {
    if (!showPaymentModal && !procesandoVenta) {
      enfocarInput();
    }
  }, [showPaymentModal, procesandoVenta, enfocarInput]);

  const buscarProductos = async (termino: string) => {
    if (!termino.trim()) {
      setProductos([]);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    try {
      // Buscar productos reales en la base de datos
      const result = await window.electronAPI.invoke('product:search', {
        query: termino,
        sucursalId: sucursal?.SUCURSAL_ID
      });

      if (result.success && result.data) {
        // Convertir los datos de la DB al formato esperado por el POS
        const productosEncontrados: Producto[] = result.data.map((p: any) => ({
          ID_PRODUCTO: p.ID_PRODUCTO,
          CODIGO_BARRAS: p.CODIGO_PRODUCTO, // El schema usa CODIGO_PRODUCTO
          CODIGO_PLM: p.CODIGO_PRODUCTO, // Usar el mismo código por ahora
          NOMBRE_PRODUCTO: p.NOMBRE_PRODUCTO,
          DESCRIPCION: p.SUSTANCIA_PRODUCTO || 'Sin descripción',
          PRECIO_VENTA: p.PRECIO_PRODUCTO,
          PRECIO_COMPRA: p.COSTO_PRODUCTO || 0,
          STOCK_ACTUAL: p.CANTIDAD_PRODUCTO,
          STOCK_MINIMO: p.MIN_PRODUCTO || 0,
          ACTIVO: p.ACTIVO,
          SUCURSAL_ID: p.SUCURSAL_ID,
          FECHA_CREACION: new Date(p.FECHA_CREACION),
          FECHA_ACTUALIZACION: new Date(p.FECHA_MODIFICACION),
          SINCRONIZADO: p.SINCRONIZADO,
          FECHA_SINCRONIZACION: p.FECHA_SINCRONIZACION ? new Date(p.FECHA_SINCRONIZACION) : undefined
        }));

        setProductos(productosEncontrados);
        setSelectedIndex(0); // Reset al primer producto
      } else {
        console.warn('No se encontraron productos:', result.error);
        setProductos([]);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
      setProductos([]);
      setSelectedIndex(0);
    } finally {
      setLoading(false);
    }
  };

  // Función para hacer scroll al producto seleccionado
  const scrollToSelected = useCallback((index: number) => {
    if (productListRef.current) {
      const items = productListRef.current.children;
      const selectedItem = items[index] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, []);

  const agregarAlCarrito = (producto: Producto, cantidadEspecifica?: number) => {
    const cantidadAAgregar = cantidadEspecifica || 1;
    const itemExistente = carrito.find(item => item.ID_PRODUCTO === producto.ID_PRODUCTO);

    // Calcular cuánto ya tenemos en el carrito
    const cantidadEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    const cantidadTotal = cantidadEnCarrito + cantidadAAgregar;

    // VALIDACIÓN CRÍTICA: Verificar stock disponible
    if (cantidadTotal > producto.STOCK_ACTUAL) {
      const disponible = producto.STOCK_ACTUAL - cantidadEnCarrito;
      if (disponible <= 0) {
        setNotificacion(`❌ Sin stock disponible de ${producto.NOMBRE_PRODUCTO}`);
      } else {
        setNotificacion(
          `⚠️ Stock insuficiente. Solo quedan ${disponible} unidad(es) disponible(s) de ${producto.NOMBRE_PRODUCTO}`
        );
      }
      setTimeout(() => setNotificacion(null), 4000);

      // Limpiar búsqueda y enfocar
      setBusqueda('');
      setProductos([]);
      setSelectedIndex(0);
      requestAnimationFrame(() => enfocarInput());
      return; // NO AGREGAR AL CARRITO
    }

    // Validación adicional: Stock debe ser mayor a 0
    if (producto.STOCK_ACTUAL <= 0) {
      setNotificacion(`❌ Producto sin stock: ${producto.NOMBRE_PRODUCTO}`);
      setTimeout(() => setNotificacion(null), 3000);

      // Limpiar búsqueda y enfocar
      setBusqueda('');
      setProductos([]);
      setSelectedIndex(0);
      requestAnimationFrame(() => enfocarInput());
      return; // NO AGREGAR AL CARRITO
    }

    // Si pasa todas las validaciones, agregar al carrito
    if (itemExistente) {
      setCarrito(carrito.map(item => {
        if (item.ID_PRODUCTO === producto.ID_PRODUCTO) {
          const nuevaCantidad = item.cantidad + cantidadAAgregar;
          const subtotalItem = item.precio * nuevaCantidad;
          const ivaItem = item.aplicaIVA ? subtotalItem * TASA_IVA : 0;
          const totalItem = subtotalItem + ivaItem;

          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: subtotalItem,
            iva: ivaItem,
            totalConIVA: totalItem
          };
        }
        return item;
      }));
    } else {
      const aplicaIVA = producto.IVA_PRODUCTO === 1;
      const subtotalItem = producto.PRECIO_VENTA * cantidadAAgregar;
      const ivaItem = aplicaIVA ? subtotalItem * TASA_IVA : 0;
      const totalItem = subtotalItem + ivaItem;

      const nuevoItem: ItemCarrito = {
        ID_PRODUCTO: producto.ID_PRODUCTO,
        CODIGO_BARRAS: producto.CODIGO_BARRAS,
        NOMBRE_PRODUCTO: producto.NOMBRE_PRODUCTO,
        precio: producto.PRECIO_VENTA,
        cantidad: cantidadAAgregar,
        subtotal: subtotalItem,
        aplicaIVA: aplicaIVA,
        iva: ivaItem,
        totalConIVA: totalItem
      };
      setCarrito([...carrito, nuevoItem]);
    }

    // Mostrar notificación de producto agregado
    const stockRestante = producto.STOCK_ACTUAL - cantidadTotal;
    setNotificacion(
      `✅ ${cantidadAAgregar}x ${producto.NOMBRE_PRODUCTO} agregado (Quedan ${stockRestante} en stock)`
    );
    setTimeout(() => setNotificacion(null), 2500);

    // Limpiar búsqueda y enfocar
    setBusqueda('');
    setProductos([]);
    setSelectedIndex(0);
    // Focus inmediato después de agregar producto
    requestAnimationFrame(() => enfocarInput());
  };

  const modificarCantidad = async (ID_PRODUCTO: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(ID_PRODUCTO);
      return;
    }

    // VALIDACIÓN CRÍTICA: Verificar stock antes de incrementar
    const itemEnCarrito = carrito.find(item => item.ID_PRODUCTO === ID_PRODUCTO);
    if (!itemEnCarrito) return;

    // Buscar el producto actual para obtener stock actualizado
    try {
      const result = await window.electronAPI.invoke('product:search', {
        query: itemEnCarrito.CODIGO_BARRAS,
        sucursalId: sucursal?.SUCURSAL_ID
      });

      if (result.success && result.data && result.data.length > 0) {
        const productoActual = result.data[0];
        const stockDisponible = productoActual.CANTIDAD_PRODUCTO;

        // Verificar si la nueva cantidad excede el stock
        if (nuevaCantidad > stockDisponible) {
          setNotificacion(
            `⚠️ Stock insuficiente. Solo hay ${stockDisponible} unidad(es) disponible(s) de ${itemEnCarrito.NOMBRE_PRODUCTO}`
          );
          setTimeout(() => setNotificacion(null), 4000);
          return; // NO PERMITIR el cambio
        }

        // Si pasa la validación, actualizar la cantidad recalculando IVA
        setCarrito(carrito.map(item => {
          if (item.ID_PRODUCTO === ID_PRODUCTO) {
            const subtotalItem = item.precio * nuevaCantidad;
            const ivaItem = item.aplicaIVA ? subtotalItem * TASA_IVA : 0;
            const totalItem = subtotalItem + ivaItem;

            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: subtotalItem,
              iva: ivaItem,
              totalConIVA: totalItem
            };
          }
          return item;
        }));
      }
    } catch (error) {
      console.error('Error verificando stock:', error);
      setNotificacion('❌ Error al verificar stock disponible');
      setTimeout(() => setNotificacion(null), 3000);
    }
  };

  const eliminarDelCarrito = (ID_PRODUCTO: number) => {
    setCarrito(carrito.filter(item => item.ID_PRODUCTO !== ID_PRODUCTO));
  };

  const limpiarCarrito = useCallback(() => {
    setCarrito([]);
    setBusqueda('');
    setProductos([]);
    // Focus inmediato después de limpiar
    requestAnimationFrame(() => enfocarInput());
  }, [enfocarInput]);

  const procesarVenta = async () => {
    if (carrito.length === 0 || procesandoVenta) return;

    // Validar pago según tipo
    if (tipoPago === 'EFECTIVO') {
      const efectivoNum = parseFloat(efectivo) || 0;
      if (efectivoNum < total) {
        alert('El efectivo recibido es insuficiente');
        return;
      }
    } else if (tipoPago === 'TARJETA') {
      // Para tarjeta no necesitamos validar efectivo
      if (!confirm('¿Confirma que el pago con tarjeta fue exitoso?')) {
        return;
      }
    }

    setProcesandoVenta(true);

    try {
      // Preparar datos de venta con desglose de IVA
      const ventaData = {
        items: carrito,
        subtotal,
        iva: totalIVA,
        total,
        tipoPago,
        efectivo: tipoPago === 'EFECTIVO' ? parseFloat(efectivo) || 0 : 0,
        cambio: tipoPago === 'EFECTIVO' ? cambio : 0,
        usuario: user?.NOMBRE_USUARIO,
        sucursal: sucursal?.NOMBRE_SUCURSAL,
        fecha: new Date().toISOString()
      };

      console.log('Procesando venta:', ventaData);

      // Guardar venta en la base de datos
      const ventaResult = await window.electronAPI.procesarVenta(ventaData);
      
      if (!ventaResult.success) {
        alert('Error guardando la venta: ' + ventaResult.error);
        return;
      }

      console.log('Venta guardada con folio:', ventaResult.folio);

      // Preparar datos del ticket con logo y desglose de IVA
      const baseTicketData = {
        storeName: sucursal?.RAZON_SOCIAL || 'FARMACIAS MS',
        storeAddress: sucursal?.DIRECCION || 'Dirección de la farmacia',
        ticketNumber: ventaResult.folio,
        items: carrito.map(item => ({
          name: item.NOMBRE_PRODUCTO,
          quantity: item.cantidad,
          price: item.precio,
          aplicaIVA: item.aplicaIVA
        })),
        subtotal,
        iva: totalIVA,
        total,
        tipoPago,
        efectivoRecibido: tipoPago === 'EFECTIVO' ? parseFloat(efectivo) || 0 : null,
        cambio: tipoPago === 'EFECTIVO' ? cambio : null,
        usuario: user?.NOMBRE_USUARIO,
        sucursal: sucursal?.NOMBRE_SUCURSAL,
        date: new Date().toLocaleString('es-ES')
      };

      const ticketData = await prepareTicketData(baseTicketData);

      const printResult = await window.electronAPI.printTicket(ticketData);

      if (printResult.success) {
        // Limpiar estados inmediatamente
        setShowPaymentModal(false);
        setEfectivo('');
        setTipoPago('EFECTIVO');
        setProcesandoVenta(false);

        // Mostrar notificación no bloqueante
        setNotificacion('✅ Venta procesada correctamente');
        setTimeout(() => setNotificacion(null), 3000);

        // Limpiar carrito inmediatamente
        limpiarCarrito();
      } else {
        setProcesandoVenta(false);
        setNotificacion('❌ Error al imprimir ticket: ' + printResult.error);
        setTimeout(() => setNotificacion(null), 5000);
      }

    } catch (error) {
      setProcesandoVenta(false);
      console.error('Error procesando venta:', error);
      setNotificacion('❌ Error procesando la venta');
      setTimeout(() => setNotificacion(null), 5000);
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
                placeholder="Buscar producto..."
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  buscarProductos(e.target.value);
                }}
                onKeyDown={async (e) => {
                  // Autocompletar código con Tab
                  if (e.key === 'Tab' && productos.length > 0) {
                    e.preventDefault();
                    const productoSeleccionado = productos[selectedIndex];
                    setBusqueda(productoSeleccionado.CODIGO_BARRAS + '*');
                    setProductos([]); // Limpiar lista de productos
                    // Posicionar cursor al final para escribir la cantidad
                    setTimeout(() => {
                      if (inputBusquedaRef.current) {
                        inputBusquedaRef.current.focus();
                        inputBusquedaRef.current.setSelectionRange(
                          inputBusquedaRef.current.value.length,
                          inputBusquedaRef.current.value.length
                        );
                      }
                    }, 0);
                    return;
                  }

                  if (e.key === 'Enter') {
                    e.preventDefault();

                    // Detectar patrón CODIGO*CANTIDAD
                    const match = busqueda.match(/^(.+)\*(\d+)$/);

                    if (match) {
                      const [, codigo, cantidadStr] = match;
                      const cantidad = parseInt(cantidadStr, 10);

                      if (cantidad > 0 && cantidad <= 999) {
                        // Buscar el producto por código exacto
                        setLoading(true);
                        try {
                          const result = await window.electronAPI.invoke('product:search', {
                            query: codigo.trim(),
                            sucursalId: sucursal?.SUCURSAL_ID
                          });

                          if (result.success && result.data && result.data.length > 0) {
                            const productoData = result.data[0];
                            const producto: Producto = {
                              ID_PRODUCTO: productoData.ID_PRODUCTO,
                              CODIGO_BARRAS: productoData.CODIGO_PRODUCTO,
                              CODIGO_PLM: productoData.CODIGO_PRODUCTO,
                              NOMBRE_PRODUCTO: productoData.NOMBRE_PRODUCTO,
                              DESCRIPCION: productoData.SUSTANCIA_PRODUCTO || 'Sin descripción',
                              PRECIO_VENTA: productoData.PRECIO_PRODUCTO,
                              PRECIO_COMPRA: productoData.COSTO_PRODUCTO || 0,
                              STOCK_ACTUAL: productoData.CANTIDAD_PRODUCTO,
                              STOCK_MINIMO: productoData.MIN_PRODUCTO || 0,
                              IVA_PRODUCTO: productoData.IVA_PRODUCTO || 0,
                              ACTIVO: productoData.ACTIVO,
                              SUCURSAL_ID: productoData.SUCURSAL_ID,
                              FECHA_CREACION: new Date(productoData.FECHA_CREACION),
                              FECHA_ACTUALIZACION: new Date(productoData.FECHA_MODIFICACION),
                              SINCRONIZADO: productoData.SINCRONIZADO,
                              FECHA_SINCRONIZACION: productoData.FECHA_SINCRONIZACION ? new Date(productoData.FECHA_SINCRONIZACION) : undefined
                            };

                            // La validación de stock se hace en agregarAlCarrito
                            // que considera lo que ya está en el carrito
                            agregarAlCarrito(producto, cantidad);
                          } else {
                            setNotificacion('❌ Producto no encontrado');
                            setTimeout(() => setNotificacion(null), 3000);
                          }
                        } catch (error) {
                          console.error('Error buscando producto:', error);
                          setNotificacion('❌ Error al buscar producto');
                          setTimeout(() => setNotificacion(null), 3000);
                        } finally {
                          setLoading(false);
                        }
                      } else {
                        setNotificacion('❌ Cantidad inválida (1-999)');
                        setTimeout(() => setNotificacion(null), 3000);
                      }
                      return;
                    }

                    // Comportamiento normal si hay productos en la lista
                    if (productos.length > 0) {
                      agregarAlCarrito(productos[selectedIndex]);
                    }
                    return;
                  }

                  // Navegación con flechas solo si hay productos
                  if (productos.length === 0) return;

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const newIndex = selectedIndex < productos.length - 1 ? selectedIndex + 1 : selectedIndex;
                    setSelectedIndex(newIndex);
                    scrollToSelected(newIndex);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : 0;
                    setSelectedIndex(newIndex);
                    scrollToSelected(newIndex);
                  }
                }}
              />
              <div className="absolute right-3 top-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500 flex items-center space-x-4">
              <span>💡 Tip: ⬆️⬇️ navegar</span>
              <span>|</span>
              <span>Tab autocompletar</span>
              <span>|</span>
              <span>CODIGO*CANTIDAD (ej: 750110*3)</span>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          <div className="bg-white rounded-lg shadow-sm border max-h-96 overflow-y-auto" ref={productListRef}>
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

            {productos.map((producto, index) => {
              // Calcular cuánto ya está en el carrito
              const enCarrito = carrito.find(item => item.ID_PRODUCTO === producto.ID_PRODUCTO);
              const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
              const stockDisponible = producto.STOCK_ACTUAL - cantidadEnCarrito;
              const sinStock = stockDisponible <= 0;

              return (
                <div
                  key={producto.ID_PRODUCTO}
                  className={`p-3 border-b border-gray-100 transition-colors ${
                    sinStock
                      ? 'bg-gray-100 cursor-not-allowed opacity-60'
                      : index === selectedIndex
                      ? 'bg-blue-100 border-l-4 border-l-blue-500 cursor-pointer'
                      : 'hover:bg-blue-50 cursor-pointer'
                  }`}
                  onClick={() => !sinStock && agregarAlCarrito(producto)}
                  onMouseEnter={() => !sinStock && setSelectedIndex(index)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        sinStock
                          ? 'text-gray-500 line-through'
                          : index === selectedIndex
                          ? 'text-blue-900'
                          : 'text-gray-900'
                      }`}>
                        {producto.NOMBRE_PRODUCTO}
                      </h3>
                      <p className="text-sm text-gray-600">{producto.DESCRIPCION}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">Código: {producto.CODIGO_BARRAS}</span>
                        <span className="text-xs text-gray-500">PLM: {producto.CODIGO_PLM}</span>
                        {cantidadEnCarrito > 0 && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {cantidadEnCarrito} en carrito
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          sinStock
                            ? 'bg-red-200 text-red-900'
                            : stockDisponible <= producto.STOCK_MINIMO
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {sinStock ? 'SIN STOCK' : `Disponible: ${stockDisponible}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        sinStock
                          ? 'text-gray-400'
                          : index === selectedIndex
                          ? 'text-blue-700'
                          : 'text-green-600'
                      }`}>
                        ${producto.PRECIO_VENTA.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-lg font-medium text-gray-600">Carrito vacío</p>
                <p className="text-sm mt-1">Busque y agregue productos</p>
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
                          ${item.precio.toFixed(2)} c/u {item.aplicaIVA && <span className="text-xs text-blue-600">(+IVA)</span>}
                        </div>
                        <div className="font-bold text-green-600">
                          ${item.totalConIVA.toFixed(2)}
                        </div>
                        {item.aplicaIVA && (
                          <div className="text-xs text-gray-500">
                            IVA: ${item.iva.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total y acciones */}
          <div className="mt-4 space-y-3">
            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {totalIVA > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">IVA (16%):</span>
                  <span className="font-medium">${totalIVA.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
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
          <div className={`bg-white rounded-lg p-6 w-96 ${procesandoVenta ? 'opacity-90' : ''}`}>
            <h3 className="text-lg font-bold mb-4">Procesar Pago</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {totalIVA > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">IVA (16%):</span>
                    <span className="font-medium">${totalIVA.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-base font-medium">Total a pagar:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Selector de tipo de pago */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de pago:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTipoPago('EFECTIVO')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      tipoPago === 'EFECTIVO'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-2xl mb-1">💵</div>
                    <div className="font-medium">Efectivo</div>
                  </button>
                  <button
                    onClick={() => setTipoPago('TARJETA')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      tipoPago === 'TARJETA'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-2xl mb-1">💳</div>
                    <div className="font-medium">Tarjeta</div>
                  </button>
                </div>
              </div>

              {/* Campo de efectivo - solo para pago en efectivo */}
              {tipoPago === 'EFECTIVO' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Efectivo recibido:</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      efectivo && parseFloat(efectivo) >= total 
                        ? 'border-green-500 bg-green-50' 
                        : efectivo && parseFloat(efectivo) < total 
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300'
                    }`}
                    value={efectivo}
                    onChange={(e) => setEfectivo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !procesandoVenta) {
                        const efectivoNum = parseFloat(efectivo) || 0;
                        if (efectivoNum > 0 && efectivoNum >= total) {
                          procesarVenta();
                        }
                      }
                    }}
                    placeholder="0.00"
                    autoFocus
                  />
                  {/* Indicador visual del estado */}
                  {efectivo && (
                    <div className="mt-1 text-sm">
                      {parseFloat(efectivo) >= total ? (
                        <span className="text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Presiona Enter para procesar
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Monto insuficiente
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cambio - solo para efectivo */}
              {tipoPago === 'EFECTIVO' && efectivo && (
                <div>
                  <label className="block text-sm font-medium mb-1">Cambio:</label>
                  <div className={`text-xl font-bold ${
                    cambio >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    ${cambio.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Instrucciones para tarjeta */}
              {tipoPago === 'TARJETA' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">
                      Use la terminal de tarjeta para procesar el pago de ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEfectivo('');
                  setTipoPago('EFECTIVO');
                  requestAnimationFrame(() => enfocarInput());
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={procesarVenta}
                disabled={
                  procesandoVenta ||
                  (tipoPago === 'EFECTIVO' 
                    ? !efectivo || parseFloat(efectivo) < total
                    : false)
                }
                className={`px-4 py-2 text-white rounded transition-colors font-medium ${
                  procesandoVenta 
                    ? 'bg-orange-500 cursor-wait'
                    : tipoPago === 'EFECTIVO' && efectivo && parseFloat(efectivo) >= total
                      ? 'bg-green-600 hover:bg-green-700 animate-pulse'
                      : tipoPago === 'TARJETA'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {procesandoVenta 
                  ? '⏳ Procesando...'
                  : tipoPago === 'EFECTIVO' 
                    ? (efectivo && parseFloat(efectivo) >= total 
                        ? '✓ Procesar Venta (Enter)' 
                        : 'Procesar Venta')
                    : 'Confirmar Pago con Tarjeta'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación no bloqueante */}
      {notificacion && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
            notificacion.startsWith('✅') ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {notificacion}
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;