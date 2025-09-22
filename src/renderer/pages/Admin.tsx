import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import type { Usuario, TipoUsuario } from '../../shared/types/index.js';

interface UsuarioConPassword extends Usuario {
  PASSWORD_USUARIO: string;
  CONFIRMACION_PASSWORD?: string;
}

const Admin: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'tipos' | 'permisos'>('usuarios');
  
  // Estados para usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioConPassword | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Estados para tipos de usuario
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>([]);
  const [tipoEditando, setTipoEditando] = useState<TipoUsuario | null>(null);
  const [showTipoModal, setShowTipoModal] = useState(false);

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
  }, []);

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

    try {
      if (usuarioEditando.ID_USUARIO === 0) {
        // Crear nuevo usuario
        const response = await window.electronAPI.createUser(usuarioEditando);
        if (response.success) {
          alert(response.message);
          cargarDatos(); // Recargar datos
        } else {
          alert('Error: ' + response.error);
        }
      } else {
        // Actualizar usuario existente
        const response = await window.electronAPI.updateUser(usuarioEditando);
        if (response.success) {
          alert(response.message);
          cargarDatos(); // Recargar datos
        } else {
          alert('Error: ' + response.error);
        }
      }

      setShowUserModal(false);
      setUsuarioEditando(null);
    } catch (error) {
      alert('Error procesando usuario: ' + error);
    }
  };

  const handleTipoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoEditando) return;

    try {
      if (tipoEditando.ID_TIPOUSUARIO === 0) {
        // Crear nuevo tipo
        const response = await window.electronAPI.createUserType(tipoEditando);
        if (response.success) {
          alert(response.message);
          cargarDatos(); // Recargar datos
        } else {
          alert('Error: ' + response.error);
        }
      } else {
        // Actualizar tipo existente
        const response = await window.electronAPI.updateUserType(tipoEditando);
        if (response.success) {
          alert(response.message);
          cargarDatos(); // Recargar datos
        } else {
          alert('Error: ' + response.error);
        }
      }

      setShowTipoModal(false);
      setTipoEditando(null);
    } catch (error) {
      alert('Error procesando tipo de usuario: ' + error);
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

  const eliminarUsuario = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        const response = await window.electronAPI.deleteUser(id);
        if (response.success) {
          alert(response.message);
          cargarDatos(); // Recargar datos
        } else {
          alert('Error: ' + response.error);
        }
      } catch (error) {
        alert('Error eliminando usuario: ' + error);
      }
    }
  };

  const toggleUsuarioActivo = async (id: number) => {
    const usuario = usuarios.find(u => u.ID_USUARIO === id);
    if (usuario) {
      try {
        const usuarioActualizado = { ...usuario, ACTIVO: !usuario.ACTIVO };
        const response = await window.electronAPI.updateUser(usuarioActualizado);
        if (response.success) {
          cargarDatos(); // Recargar datos
        } else {
          alert('Error: ' + response.error);
        }
      } catch (error) {
        alert('Error actualizando usuario: ' + error);
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