import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../store/authStore';
import type { Usuario, TipoUsuario } from '../../shared/types/index.js';

interface UsuarioConPassword extends Usuario {
  PASSWORD_USUARIO: string;
  CONFIRMACION_PASSWORD?: string;
}

const Admin: React.FC = () => {
  const { user, hasPermission, sucursal } = useAuth();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'tipos' | 'permisos' | 'ticket'>('usuarios');
  
  // Estados para usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioConPassword | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Estados para tipos de usuario
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>([]);
  const [tipoEditando, setTipoEditando] = useState<TipoUsuario | null>(null);
  const [showTipoModal, setShowTipoModal] = useState(false);

  // Estados para configuración de ticket
  const [ticketConfig, setTicketConfig] = useState({
    NOMBRE_SUCURSAL: '',
    RAZON_SOCIAL: '',
    DIRECCION: '',
    TELEFONO: '',
    RFC: '',
    LOGO_PATH: ''
  });

  // Lista de todos los permisos disponibles
  const permisosDisponibles = [
    { key: 'ventas', nombre: 'Ventas', descripcion: 'Realizar ventas en el POS' },
    { key: 'cancelar_ventas', nombre: 'Cancelar Ventas', descripcion: 'Cancelar ventas realizadas' },
    { key: 'corte_caja', nombre: 'Corte de Caja', descripcion: 'Realizar cortes de caja' },
    { key: 'inventario', nombre: 'Inventario', descripcion: 'Gestionar productos e inventario' },
    { key: 'reportes', nombre: 'Reportes', descripcion: 'Ver reportes y estadísticas' },
    { key: 'configuracion', nombre: 'Configuración', descripcion: 'Configurar el sistema' },
    { key: 'usuarios', nombre: 'Usuarios', descripcion: 'Gestionar usuarios del sistema' },
    { key: 'backup', nombre: 'Respaldos', descripcion: 'Crear y restaurar respaldos' },
    { key: 'sincronizacion', nombre: 'Sincronización', descripcion: 'Configurar sincronización' },
    { key: 'plm', nombre: 'PLM', descripcion: 'Acceso a base de datos PLM' }
  ];

  useEffect(() => {
    cargarDatos();
    // Cargar configuración de ticket desde sucursal
    if (sucursal) {
      setTicketConfig({
        NOMBRE_SUCURSAL: sucursal.NOMBRE_SUCURSAL || '',
        RAZON_SOCIAL: sucursal.RAZON_SOCIAL || '',
        DIRECCION: sucursal.DIRECCION || '',
        TELEFONO: sucursal.TELEFONO || '',
        RFC: sucursal.RFC || '',
        LOGO_PATH: sucursal.LOGO_PATH || ''
      });
    }
  }, [sucursal]);

  const cargarDatos = async () => {
    try {
      // Cargar usuarios desde la API
      const usuariosResponse = await window.electronAPI.getUsers();
      if (usuariosResponse.success) {
        setUsuarios(usuariosResponse.data || []);
      }

      // Cargar tipos de usuario desde la API
      const tiposResponse = await window.electronAPI.getUserTypes();
      if (tiposResponse.success) {
        setTiposUsuario(tiposResponse.data || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const getTipoNombre = (idTipo: number) => {
    const tipo = tiposUsuario.find(t => t.ID_TIPOUSUARIO === idTipo);
    return tipo?.NOMBRE_TIPO || 'Desconocido';
  };

  const handleUsuarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    // Validar contraseñas
    if (usuarioEditando.PASSWORD_USUARIO && usuarioEditando.PASSWORD_USUARIO.trim() !== '') {
      if (usuarioEditando.PASSWORD_USUARIO.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (usuarioEditando.PASSWORD_USUARIO !== usuarioEditando.CONFIRMACION_PASSWORD) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
    } else if (usuarioEditando.ID_USUARIO === 0) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      if (usuarioEditando.ID_USUARIO === 0) {
        // Crear nuevo usuario
        const response = await window.electronAPI.createUser(usuarioEditando);
        if (response.success) {
          toast.success(response.message || 'Usuario creado exitosamente');
          await cargarDatos(); // Recargar datos
          setShowUserModal(false);
          setUsuarioEditando(null);
        } else {
          toast.error(response.error || 'Error al crear usuario');
        }
      } else {
        // Actualizar usuario existente
        const response = await window.electronAPI.updateUser(usuarioEditando);
        if (response.success) {
          toast.success(response.message || 'Usuario actualizado exitosamente');
          await cargarDatos(); // Recargar datos
          setShowUserModal(false);
          setUsuarioEditando(null);
        } else {
          toast.error(response.error || 'Error al actualizar usuario');
        }
      }
    } catch (error) {
      toast.error('Error procesando usuario: ' + error);
    }
  };

  const handleTipoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoEditando) return;

    if (!tipoEditando.NOMBRE_TIPO.trim()) {
      toast.error('El nombre del tipo es requerido');
      return;
    }

    try {
      if (tipoEditando.ID_TIPOUSUARIO === 0) {
        // Crear nuevo tipo
        const response = await window.electronAPI.createUserType(tipoEditando);
        if (response.success) {
          toast.success(response.message || 'Tipo de usuario creado exitosamente');
          await cargarDatos(); // Recargar datos
          setShowTipoModal(false);
          setTipoEditando(null);
        } else {
          toast.error(response.error || 'Error al crear tipo de usuario');
        }
      } else {
        // Actualizar tipo existente
        const response = await window.electronAPI.updateUserType(tipoEditando);
        if (response.success) {
          toast.success(response.message || 'Tipo de usuario actualizado exitosamente');
          await cargarDatos(); // Recargar datos
          setShowTipoModal(false);
          setTipoEditando(null);
        } else {
          toast.error(response.error || 'Error al actualizar tipo de usuario');
        }
      }
    } catch (error) {
      toast.error('Error procesando tipo de usuario: ' + error);
    }
  };

  const editarUsuario = (usuario: Usuario) => {
    setUsuarioEditando({ ...usuario, PASSWORD_USUARIO: '', CONFIRMACION_PASSWORD: '' });
    setShowUserModal(true);
  };

  const nuevoUsuario = () => {
    setUsuarioEditando({
      ID_USUARIO: 0,
      LOGIN_USUARIO: '',
      PASSWORD_USUARIO: '',
      CONFIRMACION_PASSWORD: '',
      NOMBRE_USUARIO: '',
      ID_TIPOUSUARIO: 2,
      SUCURSAL_ID: user?.SUCURSAL_ID || '',
      ACTIVO: true,
      FECHA_CREACION: '',
      ULTIMO_LOGIN: undefined
    });
    setShowUserModal(true);
  };

  const editarTipo = (tipo: TipoUsuario) => {
    setTipoEditando({ ...tipo });
    setShowTipoModal(true);
  };

  const nuevoTipo = () => {
    setTipoEditando({
      ID_TIPOUSUARIO: 0,
      NOMBRE_TIPO: '',
      PERMISOS: []
    });
    setShowTipoModal(true);
  };

  const togglePermiso = (permiso: string) => {
    if (!tipoEditando) return;

    const permisos = tipoEditando.PERMISOS.includes(permiso)
      ? tipoEditando.PERMISOS.filter(p => p !== permiso)
      : [...tipoEditando.PERMISOS, permiso];

    setTipoEditando({ ...tipoEditando, PERMISOS: permisos });
  };

  const handleTicketConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await window.electronAPI.invoke('config:updateTicketConfig', ticketConfig);
      if (response.success) {
        toast.success(response.message || 'Configuración del ticket actualizada correctamente');
      } else {
        toast.error(response.error || 'Error al actualizar configuración del ticket');
      }
    } catch (error) {
      toast.error('Error guardando configuración: ' + error);
    }
  };

  const eliminarUsuario = async (id: number) => {
    // En lugar de confirm(), simplemente llamar al handler directamente
    // El usuario puede desactivar si no está seguro, o eliminar para remover completamente
    try {
      const response = await window.electronAPI.deleteUser(id);
      if (response.success) {
        toast.success(response.message || 'Usuario eliminado exitosamente');
        await cargarDatos(); // Recargar datos
      } else {
        toast.error(response.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      toast.error('Error eliminando usuario: ' + error);
    }
  };

  const toggleUsuarioActivo = async (id: number) => {
    const usuario = usuarios.find(u => u.ID_USUARIO === id);
    if (usuario) {
      try {
        const usuarioActualizado = { ...usuario, ACTIVO: !usuario.ACTIVO };
        const response = await window.electronAPI.updateUser(usuarioActualizado);
        if (response.success) {
          toast.success(usuario.ACTIVO ? 'Usuario desactivado' : 'Usuario activado');
          await cargarDatos(); // Recargar datos
        } else {
          toast.error(response.error || 'Error al actualizar usuario');
        }
      } catch (error) {
        toast.error('Error actualizando usuario: ' + error);
      }
    }
  };

  if (!hasPermission('usuarios')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-600">No tienes permisos para acceder al módulo de administración.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Administración</h1>
        <p className="text-gray-600">Gestión de usuarios, tipos y permisos del sistema</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'usuarios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Usuarios
            </button>
            <button
              onClick={() => setActiveTab('tipos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tipos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🏷️ Tipos de Usuario
            </button>
            <button
              onClick={() => setActiveTab('permisos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permisos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔐 Permisos
            </button>
            <button
              onClick={() => setActiveTab('ticket')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ticket'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🎫 Ticket
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Usuarios */}
          {activeTab === 'usuarios' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
                <button
                  onClick={nuevoUsuario}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Nuevo Usuario</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Login</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.ID_USUARIO} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {usuario.LOGIN_USUARIO}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usuario.NOMBRE_USUARIO}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getTipoNombre(usuario.ID_TIPOUSUARIO)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            usuario.ACTIVO 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {usuario.ACTIVO ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {usuario.ULTIMO_LOGIN ? 
                            new Date(usuario.ULTIMO_LOGIN).toLocaleString('es-ES') : 
                            'Nunca'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => editarUsuario(usuario)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => toggleUsuarioActivo(usuario.ID_USUARIO)}
                            className={`${
                              usuario.ACTIVO ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {usuario.ACTIVO ? '🚫 Desactivar' : '✅ Activar'}
                          </button>
                          {usuario.ID_USUARIO !== user?.ID_USUARIO && (
                            <button
                              onClick={() => eliminarUsuario(usuario.ID_USUARIO)}
                              className="text-red-600 hover:text-red-900"
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Tipos de Usuario */}
          {activeTab === 'tipos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Tipos de Usuario</h2>
                <button
                  onClick={nuevoTipo}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Nuevo Tipo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiposUsuario.map((tipo) => (
                  <div key={tipo.ID_TIPOUSUARIO} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{tipo.NOMBRE_TIPO}</h3>
                      <button
                        onClick={() => editarTipo(tipo)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Permisos ({tipo.PERMISOS.length}):</p>
                      <div className="space-y-1">
                        {tipo.PERMISOS.map((permiso) => {
                          const permisoInfo = permisosDisponibles.find(p => p.key === permiso);
                          return (
                            <span key={permiso} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                              {permisoInfo?.nombre || permiso}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Permisos */}
          {activeTab === 'permisos' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Referencia de Permisos</h2>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {permisosDisponibles.map((permiso) => (
                    <div key={permiso.key} className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{permiso.nombre}</h3>
                      <p className="text-sm text-gray-600 mb-3">{permiso.descripcion}</p>
                      <div className="text-xs">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Clave: {permiso.key}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Ticket */}
          {activeTab === 'ticket' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Configuración del Ticket</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulario de configuración */}
                <form onSubmit={handleTicketConfigSubmit}>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre de la Farmacia</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={ticketConfig.NOMBRE_SUCURSAL}
                      onChange={(e) => setTicketConfig({...ticketConfig, NOMBRE_SUCURSAL: e.target.value})}
                      placeholder="Ej: Farmacia MS Centro"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Razón Social</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={ticketConfig.RAZON_SOCIAL}
                      onChange={(e) => setTicketConfig({...ticketConfig, RAZON_SOCIAL: e.target.value})}
                      placeholder="Ej: Farmacias MS S.A. de C.V."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">RFC</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={ticketConfig.RFC}
                      onChange={(e) => setTicketConfig({...ticketConfig, RFC: e.target.value.toUpperCase()})}
                      placeholder="Ej: FMS850101ABC"
                      maxLength={13}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Dirección</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={ticketConfig.DIRECCION}
                      onChange={(e) => setTicketConfig({...ticketConfig, DIRECCION: e.target.value})}
                      placeholder="Ej: Av. Principal #123, Col. Centro, CP 12345"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Teléfono</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={ticketConfig.TELEFONO}
                      onChange={(e) => setTicketConfig({...ticketConfig, TELEFONO: e.target.value})}
                      placeholder="Ej: (123) 456-7890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Ruta del Logo</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={ticketConfig.LOGO_PATH}
                      onChange={(e) => setTicketConfig({...ticketConfig, LOGO_PATH: e.target.value})}
                      placeholder="Ej: C:/logos/farmacia-logo.png"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ruta completa a la imagen del logo (opcional)
                    </p>
                  </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <span>💾</span>
                        <span>Guardar Configuración</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Preview del Ticket */}
                <div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Vista Previa del Ticket</h3>

                    {/* Simulación de ticket térmico 58mm */}
                    <div className="mx-auto bg-white border-2 border-gray-300 shadow-lg" style={{ width: '280px', fontFamily: 'monospace' }}>
                      <div className="p-4 text-center text-xs leading-tight">
                        {/* Logo placeholder */}
                        {ticketConfig.LOGO_PATH && (
                          <div className="mb-2 flex justify-center">
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                              LOGO
                            </div>
                          </div>
                        )}

                        {/* Nombre de la sucursal */}
                        <div className="font-bold text-sm mb-1">
                          {ticketConfig.NOMBRE_SUCURSAL || 'NOMBRE DE LA FARMACIA'}
                        </div>

                        {/* Razón social */}
                        <div className="text-xs mb-1">
                          {ticketConfig.RAZON_SOCIAL || 'Razón Social'}
                        </div>

                        {/* RFC */}
                        {ticketConfig.RFC && (
                          <div className="text-xs mb-1">
                            RFC: {ticketConfig.RFC}
                          </div>
                        )}

                        {/* Dirección */}
                        <div className="text-xs mb-1 whitespace-pre-wrap">
                          {ticketConfig.DIRECCION || 'Dirección de la farmacia'}
                        </div>

                        {/* Teléfono */}
                        {ticketConfig.TELEFONO && (
                          <div className="text-xs mb-2">
                            Tel: {ticketConfig.TELEFONO}
                          </div>
                        )}

                        {/* Separador */}
                        <div className="border-t border-dashed border-gray-400 my-2"></div>

                        {/* Datos de ejemplo de la venta */}
                        <div className="text-left text-xs">
                          <div className="flex justify-between mb-1">
                            <span>Fecha:</span>
                            <span>{new Date().toLocaleDateString('es-MX')}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>Hora:</span>
                            <span>{new Date().toLocaleTimeString('es-MX')}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>Folio:</span>
                            <span>001234</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>Cajero:</span>
                            <span>{user?.NOMBRE_USUARIO || 'Usuario'}</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-gray-400 my-2"></div>

                        {/* Productos de ejemplo */}
                        <div className="text-left text-xs space-y-1">
                          <div>
                            <div className="font-semibold">Paracetamol 500mg</div>
                            <div className="flex justify-between">
                              <span>2 x $25.00</span>
                              <span>$50.00</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">Ibuprofeno 400mg *</div>
                            <div className="flex justify-between">
                              <span>1 x $35.00</span>
                              <span>$35.00</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-gray-400 my-2"></div>

                        {/* Totales */}
                        <div className="text-left text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>$85.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>IVA (16%):</span>
                            <span>$5.60</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-400">
                            <span>TOTAL:</span>
                            <span>$90.60</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-gray-400 my-2"></div>

                        {/* Información adicional */}
                        <div className="text-xs text-center">
                          <div className="mb-1">¡Gracias por su compra!</div>
                          <div className="text-xs" style={{ fontSize: '10px' }}>* Productos con IVA incluido</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      Este es un ejemplo de cómo se verá el ticket con tu configuración
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Usuario */}
      {showUserModal && usuarioEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {usuarioEditando.ID_USUARIO === 0 ? 'Nuevo Usuario' : 'Editar Usuario'}
            </h3>
            
            <form onSubmit={handleUsuarioSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Login de Usuario</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={usuarioEditando.LOGIN_USUARIO}
                  onChange={(e) => setUsuarioEditando({...usuarioEditando, LOGIN_USUARIO: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={usuarioEditando.NOMBRE_USUARIO}
                  onChange={(e) => setUsuarioEditando({...usuarioEditando, NOMBRE_USUARIO: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Usuario</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={usuarioEditando.ID_TIPOUSUARIO}
                  onChange={(e) => setUsuarioEditando({...usuarioEditando, ID_TIPOUSUARIO: parseInt(e.target.value)})}
                  required
                >
                  {tiposUsuario.map((tipo) => (
                    <option key={tipo.ID_TIPOUSUARIO} value={tipo.ID_TIPOUSUARIO}>
                      {tipo.NOMBRE_TIPO}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {usuarioEditando.ID_USUARIO === 0 ? 'Contraseña' : 'Nueva Contraseña (dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={usuarioEditando.PASSWORD_USUARIO}
                  onChange={(e) => setUsuarioEditando({...usuarioEditando, PASSWORD_USUARIO: e.target.value})}
                  required={usuarioEditando.ID_USUARIO === 0}
                />
              </div>
              
              {usuarioEditando.PASSWORD_USUARIO && (
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={usuarioEditando.CONFIRMACION_PASSWORD || ''}
                    onChange={(e) => setUsuarioEditando({...usuarioEditando, CONFIRMACION_PASSWORD: e.target.value})}
                    required
                  />
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={usuarioEditando.ACTIVO}
                  onChange={(e) => setUsuarioEditando({...usuarioEditando, ACTIVO: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="activo" className="text-sm font-medium">Usuario Activo</label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setUsuarioEditando(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {usuarioEditando.ID_USUARIO === 0 ? 'Crear' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Tipo de Usuario */}
      {showTipoModal && tipoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {tipoEditando.ID_TIPOUSUARIO === 0 ? 'Nuevo Tipo de Usuario' : 'Editar Tipo de Usuario'}
            </h3>
            
            <form onSubmit={handleTipoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Tipo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={tipoEditando.NOMBRE_TIPO}
                  onChange={(e) => setTipoEditando({...tipoEditando, NOMBRE_TIPO: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-3">Permisos</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permisosDisponibles.map((permiso) => (
                    <div key={permiso.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={`permiso-${permiso.key}`}
                        checked={tipoEditando.PERMISOS.includes(permiso.key)}
                        onChange={() => togglePermiso(permiso.key)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={`permiso-${permiso.key}`} className="font-medium text-sm cursor-pointer">
                          {permiso.nombre}
                        </label>
                        <p className="text-xs text-gray-600">{permiso.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTipoModal(false);
                    setTipoEditando(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {tipoEditando.ID_TIPOUSUARIO === 0 ? 'Crear' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;