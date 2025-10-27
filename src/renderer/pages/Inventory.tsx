import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { toast } from 'sonner';

interface Producto {
  ID_PRODUCTO: number;
  CODIGO_PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  SUSTANCIA_PRODUCTO: string | null;
  CANTIDAD_PRODUCTO: number;
  PRECIO_PRODUCTO: number;
  COSTO_PRODUCTO: number;
  MAX_PRODUCTO: number;
  MIN_PRODUCTO: number;
  IVA_PRODUCTO: number;
  ID_LABORATORIO: number | null;
  NOMBRE_LABORATORIO: string | null;
  ACTIVO: number;
}

interface Laboratorio {
  id_laboratorio: number;
  nombre_laboratorio: string;
}

interface ProductStats {
  total_productos: number;
  total_stock: number;
  productos_bajo_stock: number;
  productos_sin_stock: number;
  valor_inventario_costo: number;
  valor_inventario_venta: number;
}

const Inventory: React.FC = () => {
  const { sucursal, user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'adjust'>('create');
  const [formData, setFormData] = useState<any>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadLaboratorios();
    loadStats();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, showLowStock, currentPage, limit]);

  const loadProducts = async () => {
    if (!sucursal) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.invoke('inventory:getProducts', {
        sucursalId: sucursal.SUCURSAL_ID,
        search,
        limit,
        offset: currentPage * limit,
        lowStock: showLowStock
      });

      if (result.success) {
        setProductos(result.data.productos);
        setTotal(result.data.total);
      } else {
        toast.error(result.error || 'Error al cargar productos');
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadLaboratorios = async () => {
    try {
      const result = await window.electronAPI.invoke('inventory:getLaboratorios');
      if (result.success) {
        setLaboratorios(result.data);
      }
    } catch (error) {
      console.error('Error cargando laboratorios:', error);
    }
  };

  const loadStats = async () => {
    if (!sucursal) return;

    try {
      const result = await window.electronAPI.invoke('inventory:getProductStats', sucursal.SUCURSAL_ID);
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleCreateProduct = () => {
    setModalMode('create');
    setSelectedProduct(null);
    setFormData({
      CODIGO_PRODUCTO: '',
      NOMBRE_PRODUCTO: '',
      SUSTANCIA_PRODUCTO: '',
      CANTIDAD_PRODUCTO: 0,
      PRECIO_PRODUCTO: 0,
      COSTO_PRODUCTO: 0,
      MAX_PRODUCTO: 100,
      MIN_PRODUCTO: 5,
      IVA_PRODUCTO: false,
      ID_LABORATORIO: null
    });
    setShowModal(true);
  };

  const handleEditProduct = (producto: Producto) => {
    setModalMode('edit');
    setSelectedProduct(producto);
    setFormData({
      CODIGO_PRODUCTO: producto.CODIGO_PRODUCTO,
      NOMBRE_PRODUCTO: producto.NOMBRE_PRODUCTO,
      SUSTANCIA_PRODUCTO: producto.SUSTANCIA_PRODUCTO || '',
      CANTIDAD_PRODUCTO: producto.CANTIDAD_PRODUCTO,
      PRECIO_PRODUCTO: producto.PRECIO_PRODUCTO,
      COSTO_PRODUCTO: producto.COSTO_PRODUCTO,
      MAX_PRODUCTO: producto.MAX_PRODUCTO,
      MIN_PRODUCTO: producto.MIN_PRODUCTO,
      IVA_PRODUCTO: producto.IVA_PRODUCTO === 1,
      ID_LABORATORIO: producto.ID_LABORATORIO,
      ACTIVO: producto.ACTIVO === 1
    });
    setShowModal(true);
  };

  const handleAdjustStock = (producto: Producto) => {
    setModalMode('adjust');
    setSelectedProduct(producto);
    setFormData({
      CANTIDAD_AJUSTE: 0,
      TIPO_AJUSTE: 'ENTRADA',
      MOTIVO: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === 'create') {
      await createProduct();
    } else if (modalMode === 'edit') {
      await updateProduct();
    } else if (modalMode === 'adjust') {
      await adjustStock();
    }
  };

  const createProduct = async () => {
    if (!sucursal) return;

    try {
      const result = await window.electronAPI.invoke('inventory:createProduct', {
        ...formData,
        SUCURSAL_ID: sucursal.SUCURSAL_ID
      });

      if (result.success) {
        toast.success('Producto creado correctamente');
        setShowModal(false);
        loadProducts();
        loadStats();
      } else {
        toast.error(result.error || 'Error al crear producto');
      }
    } catch (error) {
      console.error('Error creando producto:', error);
      toast.error('Error al crear producto');
    }
  };

  const updateProduct = async () => {
    if (!selectedProduct) return;

    try {
      const result = await window.electronAPI.invoke('inventory:updateProduct', {
        ID_PRODUCTO: selectedProduct.ID_PRODUCTO,
        productData: formData
      });

      if (result.success) {
        toast.success('Producto actualizado correctamente');
        setShowModal(false);
        loadProducts();
        loadStats();
      } else {
        toast.error(result.error || 'Error al actualizar producto');
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error('Error al actualizar producto');
    }
  };

  const adjustStock = async () => {
    if (!selectedProduct || !user) return;

    try {
      const result = await window.electronAPI.invoke('inventory:adjustStock', {
        ID_PRODUCTO: selectedProduct.ID_PRODUCTO,
        CANTIDAD_AJUSTE: parseFloat(formData.CANTIDAD_AJUSTE) || 0,
        TIPO_AJUSTE: formData.TIPO_AJUSTE,
        MOTIVO: formData.MOTIVO,
        ID_USUARIO: user.ID_USUARIO
      });

      if (result.success) {
        toast.success('Stock ajustado correctamente');
        setShowModal(false);
        loadProducts();
        loadStats();
      } else {
        toast.error(result.error || 'Error al ajustar stock');
      }
    } catch (error) {
      console.error('Error ajustando stock:', error);
      toast.error('Error al ajustar stock');
    }
  };

  const handleDeleteProduct = async (producto: Producto) => {
    if (!confirm(`¿Está seguro de desactivar el producto "${producto.NOMBRE_PRODUCTO}"?`)) {
      return;
    }

    try {
      const result = await window.electronAPI.invoke('inventory:deleteProduct', producto.ID_PRODUCTO);

      if (result.success) {
        toast.success('Producto desactivado correctamente');
        loadProducts();
        loadStats();
      } else {
        toast.error(result.error || 'Error al desactivar producto');
      }
    } catch (error) {
      console.error('Error desactivando producto:', error);
      toast.error('Error al desactivar producto');
    }
  };

  const handleExportCSV = async () => {
    if (!sucursal) return;

    try {
      const result = await window.electronAPI.invoke('inventory:exportToCSV', {
        sucursalId: sucursal.SUCURSAL_ID,
        search,
        lowStock: showLowStock
      });

      if (result.success) {
        // Crear blob y descargar
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const filename = `inventario_${sucursal.NOMBRE_SUCURSAL}_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(result.message || 'Inventario exportado correctamente');
      } else {
        toast.error(result.error || 'Error al exportar inventario');
      }
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error('Error al exportar inventario');
    }
  };

  const handleImportCSV = () => {
    setShowImportModal(true);
    setImportFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
    } else {
      toast.error('Por favor selecciona un archivo CSV válido');
      e.target.value = '';
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile || !sucursal || !user) return;

    setImporting(true);
    try {
      const text = await importFile.text();

      const result = await window.electronAPI.invoke('inventory:importFromCSV', {
        csvData: text,
        sucursalId: sucursal.SUCURSAL_ID,
        userId: user.ID_USUARIO
      });

      if (result.success) {
        const { created, updated, errors } = result.data;

        let message = `✅ Importación completa:\n`;
        message += `• ${created} productos creados\n`;
        message += `• ${updated} productos actualizados`;

        if (errors.length > 0) {
          message += `\n⚠️ ${errors.length} errores encontrados`;
          console.warn('Errores de importación:', errors);
        }

        toast.success(message);
        setShowImportModal(false);
        setImportFile(null);
        loadProducts();
        loadStats();
      } else {
        toast.error(result.error || 'Error al importar inventario');
      }
    } catch (error) {
      console.error('Error importando CSV:', error);
      toast.error('Error al leer el archivo CSV');
    } finally {
      setImporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Inventario de Productos</h1>
          <p className="text-gray-600 mt-1">
            Gestión y control de productos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={handleImportCSV}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            📤 Importar CSV
          </button>
          <button
            onClick={handleCreateProduct}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Productos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_productos}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-700">Stock Total</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total_stock}</p>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4">
            <p className="text-sm text-orange-700">Stock Bajo</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{stats.productos_bajo_stock}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <p className="text-sm text-red-700">Sin Stock</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{stats.productos_sin_stock}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-700">Valor (Costo)</p>
            <p className="text-xl font-bold text-green-900 mt-1">{formatCurrency(stats.valor_inventario_costo)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <p className="text-sm text-purple-700">Valor (Venta)</p>
            <p className="text-xl font-bold text-purple-900 mt-1">{formatCurrency(stats.valor_inventario_venta)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Buscar producto
            </label>
            <input
              type="text"
              placeholder="Buscar por código, nombre o sustancia..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>

          <label className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => {
                setShowLowStock(e.target.checked);
                setCurrentPage(0);
              }}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-orange-700">Solo productos con stock bajo</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Laboratorio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600 font-medium">Cargando productos...</p>
                    </div>
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="text-6xl">📦</div>
                      <p className="text-gray-600 font-medium">
                        {search || showLowStock
                          ? 'No se encontraron productos con los filtros aplicados'
                          : 'No hay productos registrados'}
                      </p>
                      {(search || showLowStock) && (
                        <button
                          onClick={() => {
                            setSearch('');
                            setShowLowStock(false);
                            setCurrentPage(0);
                          }}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.ID_PRODUCTO} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {producto.CODIGO_PRODUCTO}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{producto.NOMBRE_PRODUCTO}</div>
                      {producto.SUSTANCIA_PRODUCTO && (
                        <div className="text-xs text-gray-500">{producto.SUSTANCIA_PRODUCTO}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {producto.NOMBRE_LABORATORIO || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        producto.CANTIDAD_PRODUCTO === 0
                          ? 'bg-red-100 text-red-800'
                          : producto.CANTIDAD_PRODUCTO <= producto.MIN_PRODUCTO
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {producto.CANTIDAD_PRODUCTO}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(producto.COSTO_PRODUCTO)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      {formatCurrency(producto.PRECIO_PRODUCTO)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditProduct(producto)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleAdjustStock(producto)}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          title="Ajustar Stock"
                        >
                          📊
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(producto)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          title="Desactivar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info de registros y selector de límite */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-semibold">{total > 0 ? currentPage * limit + 1 : 0}</span> - <span className="font-semibold">{Math.min((currentPage + 1) * limit, total)}</span> de <span className="font-semibold">{total}</span> productos
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Mostrar:</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* Controles de paginación */}
                {/* Primera página */}
                <button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Primera página"
                >
                  ⏮️
                </button>

                {/* Página anterior */}
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>

                {/* Números de página */}
                <div className="hidden sm:flex gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

                    if (endPage - startPage < maxVisible - 1) {
                      startPage = Math.max(0, endPage - maxVisible + 1);
                    }

                    // Primera página si no está visible
                    if (startPage > 0) {
                      pages.push(
                        <button
                          key={0}
                          onClick={() => setCurrentPage(0)}
                          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          1
                        </button>
                      );
                      if (startPage > 1) {
                        pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                      }
                    }

                    // Páginas visibles
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            i === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    }

                    // Última página si no está visible
                    if (endPage < totalPages - 1) {
                      if (endPage < totalPages - 2) {
                        pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                      }
                      pages.push(
                        <button
                          key={totalPages - 1}
                          onClick={() => setCurrentPage(totalPages - 1)}
                          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                {/* Página actual (móvil) */}
                <div className="sm:hidden px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700">
                  {currentPage + 1} / {totalPages}
                </div>

                {/* Página siguiente */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>

                {/* Última página */}
                <button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Última página"
                >
                  ⏭️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {modalMode === 'create' && '➕ Crear Nuevo Producto'}
                {modalMode === 'edit' && '✏️ Editar Producto'}
                {modalMode === 'adjust' && '📊 Ajustar Stock'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {modalMode === 'adjust' ? (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="font-medium text-gray-900">{selectedProduct?.NOMBRE_PRODUCTO}</p>
                      <p className="text-sm text-gray-600">Stock actual: <span className="font-bold">{selectedProduct?.CANTIDAD_PRODUCTO}</span></p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Ajuste
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.TIPO_AJUSTE}
                        onChange={(e) => setFormData({ ...formData, TIPO_AJUSTE: e.target.value })}
                        required
                      >
                        <option value="ENTRADA">Entrada (Sumar)</option>
                        <option value="SALIDA">Salida (Restar)</option>
                        <option value="AJUSTE">Ajuste (Establecer cantidad)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.CANTIDAD_AJUSTE}
                        onChange={(e) => setFormData({ ...formData, CANTIDAD_AJUSTE: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        value={formData.MOTIVO}
                        onChange={(e) => setFormData({ ...formData, MOTIVO: e.target.value })}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código *
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.CODIGO_PRODUCTO}
                          onChange={(e) => setFormData({ ...formData, CODIGO_PRODUCTO: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.NOMBRE_PRODUCTO}
                          onChange={(e) => setFormData({ ...formData, NOMBRE_PRODUCTO: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sustancia Activa
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.SUSTANCIA_PRODUCTO}
                        onChange={(e) => setFormData({ ...formData, SUSTANCIA_PRODUCTO: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Inicial
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.CANTIDAD_PRODUCTO}
                          onChange={(e) => setFormData({ ...formData, CANTIDAD_PRODUCTO: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Mínimo
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.MIN_PRODUCTO}
                          onChange={(e) => setFormData({ ...formData, MIN_PRODUCTO: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Máximo
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.MAX_PRODUCTO}
                          onChange={(e) => setFormData({ ...formData, MAX_PRODUCTO: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Costo *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.COSTO_PRODUCTO}
                          onChange={(e) => setFormData({ ...formData, COSTO_PRODUCTO: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Precio Venta *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.PRECIO_PRODUCTO}
                          onChange={(e) => setFormData({ ...formData, PRECIO_PRODUCTO: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Laboratorio
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.ID_LABORATORIO || ''}
                        onChange={(e) => setFormData({ ...formData, ID_LABORATORIO: e.target.value ? parseInt(e.target.value) : null })}
                      >
                        <option value="">Sin laboratorio</option>
                        {laboratorios.map((lab) => (
                          <option key={lab.id_laboratorio} value={lab.id_laboratorio}>
                            {lab.nombre_laboratorio}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="iva"
                        checked={formData.IVA_PRODUCTO}
                        onChange={(e) => setFormData({ ...formData, IVA_PRODUCTO: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label htmlFor="iva" className="text-sm font-medium text-gray-700">
                        Aplica IVA
                      </label>
                    </div>

                    {modalMode === 'edit' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="activo"
                          checked={formData.ACTIVO}
                          onChange={(e) => setFormData({ ...formData, ACTIVO: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                          Producto Activo
                        </label>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {modalMode === 'create' && 'Crear Producto'}
                    {modalMode === 'edit' && 'Guardar Cambios'}
                    {modalMode === 'adjust' && 'Ajustar Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">📤 Importar Inventario desde CSV</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Formato del archivo CSV</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Headers requeridos:</strong></p>
                    <code className="block bg-white p-2 rounded text-xs mt-1">
                      CODIGO,NOMBRE,SUSTANCIA,CANTIDAD,PRECIO,COSTO,MAX,MIN,IVA,LABORATORIO,ACTIVO
                    </code>
                    <p className="mt-2"><strong>Notas:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>IVA: 0 o 1 (0=No aplica, 1=Aplica IVA)</li>
                      <li>ACTIVO: 0 o 1 (0=Inactivo, 1=Activo)</li>
                      <li>Si el código ya existe, se actualizará el producto</li>
                      <li>Los campos vacíos usarán valores por defecto</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar archivo CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {importFile && (
                    <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    disabled={importing}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={!importFile || importing}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Importando...
                      </>
                    ) : (
                      '📤 Importar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
