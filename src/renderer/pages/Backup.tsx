import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';

interface BackupFile {
  name: string;
  path: string;
  date: Date;
  size: number;
  metadata?: {
    version: string;
    sucursalName: string;
    recordCount: number;
  };
}

interface USBDevice {
  path: string;
  name: string;
}

const Backup: React.FC = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [usbDevices, setUSBDevices] = useState<USBDevice[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [restoreFile, setRestoreFile] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
    detectUSBDevices();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadBackups = async () => {
    try {
      const result = await window.electronAPI.invoke('backup:list');
      if (result.success) {
        setBackups(result.data || []);
      } else {
        showNotification('error', result.error || 'Error cargando respaldos');
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      showNotification('error', 'Error cargando respaldos');
    }
  };

  const detectUSBDevices = async () => {
    try {
      const result = await window.electronAPI.invoke('backup:detectUSB');
      if (result.success) {
        setUSBDevices(result.data || []);
      }
    } catch (error) {
      console.error('Error detecting USB devices:', error);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.invoke('backup:create', backupDescription || undefined);

      if (result.success && result.data.success) {
        showNotification('success', 'Respaldo creado exitosamente');
        setShowCreateModal(false);
        setBackupDescription('');
        await loadBackups();
      } else {
        showNotification('error', result.data?.error || 'Error al crear respaldo');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      showNotification('error', 'Error al crear respaldo');
    } finally {
      setLoading(false);
    }
  };

  const exportToUSB = async (usbPath: string, backupPath?: string) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.invoke('backup:exportToUSB', usbPath, backupPath);

      if (result.success && result.data.success) {
        showNotification('success', 'Respaldo exportado a USB exitosamente');
      } else {
        showNotification('error', result.data?.error || 'Error al exportar a USB');
      }
    } catch (error) {
      console.error('Error exporting to USB:', error);
      showNotification('error', 'Error al exportar a USB');
    } finally {
      setLoading(false);
    }
  };

  const selectRestoreFile = async () => {
    try {
      const result = await window.electronAPI.invoke('backup:selectFile');

      if (result.success && result.data.filePath) {
        setRestoreFile(result.data.filePath);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      showNotification('error', 'Error al seleccionar archivo');
    }
  };

  const restoreBackup = async () => {
    if (!restoreFile) return;

    if (!confirm('⚠️ ADVERTENCIA: Esta acción reemplazará todos los datos actuales. ¿Está seguro de continuar?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.invoke('backup:restore', restoreFile);

      if (result.success && result.data.success) {
        showNotification('success', 'Respaldo restaurado exitosamente. Reinicie la aplicación.');
        setShowRestoreModal(false);
        setRestoreFile(null);
      } else {
        showNotification('error', result.data?.error || 'Error al restaurar respaldo');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      showNotification('error', 'Error al restaurar respaldo');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!hasPermission('backup')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-600">No tienes permisos para acceder al sistema de respaldos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">💾 Sistema de Respaldos</h1>
        <p className="text-gray-600">Gestión de respaldos y restauración de datos</p>
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={loading}
          className="p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-semibold text-lg">Crear Respaldo</div>
          <div className="text-sm opacity-90">Generar nuevo respaldo de la base de datos</div>
        </button>

        <button
          onClick={() => setShowRestoreModal(true)}
          disabled={loading}
          className="p-6 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400"
        >
          <div className="text-3xl mb-2">⚡</div>
          <div className="font-semibold text-lg">Restaurar Respaldo</div>
          <div className="text-sm opacity-90">Restaurar datos desde archivo de respaldo</div>
        </button>

        <button
          onClick={detectUSBDevices}
          disabled={loading}
          className="p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
        >
          <div className="text-3xl mb-2">🔄</div>
          <div className="font-semibold text-lg">Detectar USB</div>
          <div className="text-sm opacity-90">Buscar dispositivos USB conectados</div>
        </button>
      </div>

      {/* Dispositivos USB */}
      {usbDevices.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🔌 Dispositivos USB Detectados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usbDevices.map((device, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.path}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToUSB(device.path)}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Nuevo
                    </button>
                    {selectedBackup && (
                      <button
                        onClick={() => exportToUSB(device.path, selectedBackup)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        Exportar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de respaldos */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">📋 Respaldos Disponibles</h2>
          <button
            onClick={loadBackups}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
          >
            🔄 Actualizar
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📁</div>
            <p>No hay respaldos disponibles</p>
            <p className="text-sm">Crea tu primer respaldo para comenzar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seleccionar</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Información</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.map((backup, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="radio"
                        name="selectedBackup"
                        value={backup.path}
                        checked={selectedBackup === backup.path}
                        onChange={(e) => setSelectedBackup(e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-sm">{backup.name}</div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(backup.date).toLocaleString('es-ES')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {formatFileSize(backup.size)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {backup.metadata ? (
                        <div>
                          <div>v{backup.metadata.version}</div>
                          <div className="text-gray-600">{backup.metadata.sucursalName}</div>
                          <div className="text-gray-500">{backup.metadata.recordCount} registros</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin información</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          setRestoreFile(backup.path);
                          setShowRestoreModal(true);
                        }}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
                      >
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Respaldo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">📦 Crear Nuevo Respaldo</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Ej: Respaldo antes de actualización, Respaldo semanal..."
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-blue-800">Información del Respaldo</h4>
                    <p className="text-sm text-blue-700">
                      Se creará un archivo comprimido que incluye toda la base de datos actual con sus productos, ventas y configuración.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setBackupDescription('');
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={createBackup}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Creando...' : 'Crear Respaldo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Restaurar Respaldo */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">⚡ Restaurar Respaldo</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Archivo de Respaldo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                    value={restoreFile ? restoreFile.split(/[/\\]/).pop() : ''}
                    readOnly
                    placeholder="Seleccione un archivo..."
                  />
                  <button
                    onClick={selectRestoreFile}
                    disabled={loading}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
                  >
                    📁
                  </button>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-red-800">⚠️ ADVERTENCIA</h4>
                    <p className="text-sm text-red-700">
                      Esta acción reemplazará TODOS los datos actuales del sistema.
                      Se recomienda crear un respaldo actual antes de continuar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreFile(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={restoreBackup}
                disabled={loading || !restoreFile}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                {loading ? 'Restaurando...' : 'Restaurar Respaldo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
            notification.type === 'success' ? 'bg-green-600' :
            notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Backup;