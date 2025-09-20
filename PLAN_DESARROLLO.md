# Plan de Desarrollo - Sistema POS Farmacias MS

## 📋 Información General del Proyecto

### Cliente: Farmacias MS

### Stack Tecnológico:

- **Frontend**: Electron + React + Tailwind CSS
- **Base de Datos Local**: SQLite
- **Base de Datos Cloud**: Supabase (PostgreSQL)
- **Lenguaje**: TypeScript/JavaScript
- **Empaquetado**: Electron Builder

---

## 🎯 Objetivos del Proyecto

1. Crear un sistema POS offline-first para farmacias sin conexión permanente a internet
2. Implementar sincronización con Supabase cuando haya conectividad
3. Permitir respaldo y restauración mediante archivos USB
4. Gestionar pagos en efectivo y tarjeta con reportes separados
5. Mantener la familiaridad con el sistema anterior en la interfaz

---

## 📊 Fases de Desarrollo

### **FASE 1: Configuración Base y Arquitectura** (1 semana)

### 1.1 Estructura del Proyecto

```
farmacias-ms-pos/
├── src/
│   ├── main/              # Proceso principal Electron
│   │   ├── index.ts
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── ipc/           # Comunicación IPC
│   │   │   ├── handlers/
│   │   │   └── channels.ts
│   │   └── services/
│   │       ├── backup.service.ts
│   │       ├── sync.service.ts
│   │       └── payment.service.ts
│   ├── renderer/          # Proceso React
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── pos/
│   │   │   ├── inventory/
│   │   │   └── reports/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── POS.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Admin.tsx
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/         # Estado global (Redux/Zustand)
│   │   └── utils/
│   ├── shared/            # Código compartido
│   │   ├── types/
│   │   ├── constants/
│   │   └── validators/
│   └── assets/
│       ├── images/
│       └── styles/
├── database/
│   └── farmacia.db        # SQLite DB
├── electron-builder.yml
└── package.json
```

### 1.2 Configuración de Base de Datos SQLite

**Archivo**: `src/main/database/schema.sql`

```sql
-- Crear todas las tablas según el diagrama ER
-- Tablas principales
CREATE TABLE IF NOT EXISTS LABORATORIO (
    id_laboratorio INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_laboratorio VARCHAR(255),
    contacto_laboratorio VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS PRODUCTO (
    ID_PRODUCTO INTEGER PRIMARY KEY AUTOINCREMENT,
    CODIGO_PRODUCTO VARCHAR(50) UNIQUE NOT NULL,
    NOMBRE_PRODUCTO VARCHAR(255) NOT NULL,
    SUSTANCIA_PRODUCTO VARCHAR(255),
    CANTIDAD_PRODUCTO DECIMAL(10,2) DEFAULT 0,
    PRECIO_PRODUCTO DECIMAL(10,2) NOT NULL,
    COSTO_PRODUCTO DECIMAL(10,2),
    ID_LABORATORIO INTEGER,
    MAX_PRODUCTO INTEGER,
    MIN_PRODUCTO INTEGER,
    IVA_PRODUCTO BOOLEAN DEFAULT 0,
    FOREIGN KEY (ID_LABORATORIO) REFERENCES LABORATORIO(id_laboratorio)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_producto_codigo ON PRODUCTO(CODIGO_PRODUCTO);
CREATE INDEX idx_producto_nombre ON PRODUCTO(NOMBRE_PRODUCTO);
CREATE INDEX idx_producto_sustancia ON PRODUCTO(SUSTANCIA_PRODUCTO);

-- Continuar con todas las tablas...
```

### 1.3 Configuración IPC (Inter-Process Communication)

**Archivo**: `src/main/ipc/channels.ts`

```typescript
export enum IpcChannels {
  // Database
  DB_QUERY = 'db:query',
  DB_EXECUTE = 'db:execute',
  
  // Products
  PRODUCT_SEARCH = 'product:search',
  PRODUCT_GET_BY_CODE = 'product:getByCode',
  
  // Sales
  SALE_CREATE = 'sale:create',
  SALE_CANCEL = 'sale:cancel',
  
  // Backup
  BACKUP_CREATE = 'backup:create',
  BACKUP_RESTORE = 'backup:restore',
  
  // Sync
  SYNC_START = 'sync:start',
  SYNC_STATUS = 'sync:status',
  
  // Reports
  REPORT_DAILY_CLOSE = 'report:dailyClose',
  REPORT_SALES = 'report:sales'
}
```

---

### **FASE 2: Módulo de Autenticación y Seguridad** (3 días)

### 2.1 Sistema de Login

**Componente**: `src/renderer/pages/Login.tsx`

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ usuario: '', password: '' });
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="text-center mb-8">
          <div className="bg-yellow-300 rounded-full w-32 h-32 mx-auto flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">FARMACIAS</h1>
              <h2 className="text-3xl font-bold text-blue-600">MS</h2>
              <p className="text-xs">GRUPO</p>
              <p className="text-xs">SIMILARES Y GENÉRICOS</p>
            </div>
          </div>
        </div>
        
        <h3 className="text-center text-lg mb-4">SERVIDOR</h3>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Usuario</label>
            <input 
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              value={credentials.usuario}
              onChange={(e) => setCredentials({...credentials, usuario: e.target.value})}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <input 
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>
          
          <div className="flex justify-center gap-4">
            <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              OK
            </button>
            <button type="button" className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### 2.2 Middleware de Autenticación

```typescript
// src/main/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  async login(username: string, password: string) {
    const user = await db.query(
      'SELECT * FROM USUARIO WHERE LOGIN_USUARIO = ?',
      [username]
    );
    
    if (!user || !await bcrypt.compare(password, user.PASSWORD_USUARIO)) {
      throw new Error('Credenciales inválidas');
    }
    
    const token = jwt.sign(
      { id: user.ID_USUARIO, tipo: user.ID_TIPOUSUARIO },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    return { user, token };
  }
}
```

---

### **FASE 3: Módulo de Punto de Venta (POS)** (1.5 semanas)

### 3.1 Pantalla Principal de Ventas

**Componente**: `src/renderer/pages/POS.tsx`

```tsx
const POS: React.FC = () => {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-2 flex justify-between items-center">
        <h1 className="text-xl font-bold">VENTAS MEDICAMENTOS GRUPO MS</h1>
        <div className="flex items-center gap-4">
          <span>Folio: {folio}</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Cart */}
        <div className="flex-1 bg-white m-2 rounded-lg shadow">
          <div className="p-4">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left">CANT</th>
                  <th className="text-left">PRODUCTO</th>
                  <th className="text-right">IMPORTE</th>
                  <th className="text-center">CADUCIDAD</th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td>{item.cantidad}</td>
                    <td>{item.nombre}</td>
                    <td className="text-right">${item.importe.toFixed(2)}</td>
                    <td className="text-center">{item.caducidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Search Bar */}
          <div className="p-4 border-t">
            <input
              type="text"
              placeholder="Buscar producto (F5) o escanear código..."
              className="w-full px-4 py-2 border rounded-lg"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
        
        {/* Right Panel - Summary */}
        <div className="w-96 bg-white m-2 rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold">TOTAL</h2>
              <p className="text-4xl font-bold text-blue-600">${total.toFixed(2)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>RECIBO:</span>
                <span className="font-bold">0.00</span>
              </div>
              <div className="flex justify-between">
                <span>CAMBIO:</span>
                <span className="font-bold text-red-600">0.00</span>
              </div>
            </div>
            
            <button 
              onClick={handleCobrar}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              CERRAR VENTA
            </button>
            
            {/* Logo */}
            <div className="text-center mt-8">
              <div className="bg-yellow-300 rounded-full w-48 h-48 mx-auto flex items-center justify-center">
                <div>
                  <h3 className="text-xl font-bold text-red-600">FARMACIAS</h3>
                  <h4 className="text-2xl font-bold text-blue-600">MS</h4>
                  <p className="text-xs">SIMILARES Y GENÉRICOS</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p>CAJERO: {usuario}</p>
              <p>SUCURSAL: {sucursal}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer - Shortcuts */}
      <div className="bg-white px-4 py-2 border-t">
        <div className="flex gap-4 text-sm">
          <span className="text-orange-600">F5.- REALIZAR BÚSQUEDAS</span>
          <span className="text-orange-600">F11.- FUNCIONES ESPECIALES</span>
          <span className="text-orange-600">F12.- SALIR DEL SISTEMA</span>
          <span className="text-orange-600">FIN.- TERMINAR VENTA</span>
          <span className="text-orange-600">SUPR.- ELIMINAR DETALLE</span>
          <span className="text-orange-600">ESC.- REGRESAR VENTA</span>
        </div>
      </div>
    </div>
  );
};
```

### 3.2 Modal de Búsqueda de Productos

```tsx
const BusquedaProductos: React.FC = () => {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [tipoBusqueda, setTipoBusqueda] = useState('nombre');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-6xl h-5/6 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🔍</span> Búsqueda de producto
          </h2>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Búsqueda por Nombre Comercial</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tipo"
                  value="nombre"
                  checked={tipoBusqueda === 'nombre'}
                  onChange={(e) => setTipoBusqueda(e.target.value)}
                />
                Nombre Comercial
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tipo"
                  value="sustancia"
                  checked={tipoBusqueda === 'sustancia'}
                  onChange={(e) => setTipoBusqueda(e.target.value)}
                />
                Sustancia Activa
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-2">CÓDIGO</th>
                <th className="text-left p-2">NOMBRE COMERCIAL</th>
                <th className="text-left p-2">SUSTANCIA ACTIVA</th>
                <th className="text-right p-2">PRECIO</th>
                <th className="text-right p-2">EXIST.</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr 
                  key={producto.ID_PRODUCTO}
                  className="border-b hover:bg-blue-50 cursor-pointer"
                  onClick={() => seleccionarProducto(producto)}
                >
                  <td className="p-2">{producto.CODIGO_PRODUCTO}</td>
                  <td className="p-2">{producto.NOMBRE_PRODUCTO}</td>
                  <td className="p-2">{producto.SUSTANCIA_PRODUCTO}</td>
                  <td className="text-right p-2">${producto.PRECIO_PRODUCTO}</td>
                  <td className="text-right p-2">{producto.CANTIDAD_PRODUCTO}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t flex justify-between">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm">Bodega</label>
              <input type="text" className="px-2 py-1 border rounded" />
            </div>
            <div>
              <label className="block text-sm">Existencias</label>
              <input type="text" className="px-2 py-1 border rounded" readOnly />
            </div>
          </div>
          
          <div>
            <label className="block text-sm">Fecha Caducidad</label>
            <input type="text" className="px-2 py-1 border rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 3.3 Modal de Tipo de Pago

```tsx
const ModalTipoPago: React.FC = ({ total, onConfirm }) => {
  const [tipoPago, setTipoPago] = useState<'EFECTIVO' | 'TARJETA' | 'MIXTO'>('EFECTIVO');
  const [montoEfectivo, setMontoEfectivo] = useState(total);
  const [montoTarjeta, setMontoTarjeta] = useState(0);
  const [datosTargeta, setDatosTargeta] = useState({
    tipoTarjeta: 'DEBITO',
    ultimosDigitos: '',
    numeroAutorizacion: ''
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-bold mb-4">Seleccionar Tipo de Pago</h3>
        
        <div className="space-y-4">
          <div className="text-center text-2xl font-bold">
            Total: ${total.toFixed(2)}
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="EFECTIVO"
                checked={tipoPago === 'EFECTIVO'}
                onChange={(e) => setTipoPago(e.target.value as any)}
              />
              <span className="text-lg">💵 Efectivo</span>
            </label>
            
            <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="TARJETA"
                checked={tipoPago === 'TARJETA'}
                onChange={(e) => setTipoPago(e.target.value as any)}
              />
              <span className="text-lg">💳 Tarjeta</span>
            </label>
            
            <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="MIXTO"
                checked={tipoPago === 'MIXTO'}
                onChange={(e) => setTipoPago(e.target.value as any)}
              />
              <span className="text-lg">💵💳 Mixto</span>
            </label>
          </div>
          
          {tipoPago === 'MIXTO' && (
            <div className="space-y-2 p-3 bg-gray-50 rounded">
              <div>
                <label className="block text-sm">Monto Efectivo:</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded"
                  value={montoEfectivo}
                  onChange={(e) => {
                    const efectivo = parseFloat(e.target.value) || 0;
                    setMontoEfectivo(efectivo);
                    setMontoTarjeta(total - efectivo);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm">Monto Tarjeta:</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded bg-gray-100"
                  value={montoTarjeta}
                  readOnly
                />
              </div>
            </div>
          )}
          
          {(tipoPago === 'TARJETA' || tipoPago === 'MIXTO') && (
            <div className="space-y-2 p-3 bg-blue-50 rounded">
              <div>
                <label className="block text-sm">Tipo de Tarjeta:</label>
                <select 
                  className="w-full px-3 py-2 border rounded"
                  value={datosTargeta.tipoTarjeta}
                  onChange={(e) => setDatosTargeta({...datosTargeta, tipoTarjeta: e.target.value})}
                >
                  <option value="DEBITO">Débito</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Últimos 4 dígitos:</label>
                <input
                  type="text"
                  maxLength={4}
                  className="w-full px-3 py-2 border rounded"
                  value={datosTargeta.ultimosDigitos}
                  onChange={(e) => setDatosTargeta({...datosTargeta, ultimosDigitos: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm">Número de Autorización:</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  value={datosTargeta.numeroAutorizacion}
                  onChange={(e) => setDatosTargeta({...datosTargeta, numeroAutorizacion: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onConfirm(tipoPago, montoEfectivo, montoTarjeta, datosTargeta)}
              className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Confirmar Pago
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### **FASE 4: Módulo de Corte de Caja** (4 días)

### 4.1 Pantalla de Corte

```tsx
const CorteCaja: React.FC = () => {
  const [corteData, setCorteData] = useState({
    foliosVendidos: 0,
    serie: 0,
    ventaDelDia: 0,
    notasCanceladas: 0,
    entradasCaja: 0,
    salidasCaja: 0,
    totalEfectivo: 0,
    totalTarjeta: 0
  });
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Corte en pantalla</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Cifras de Control */}
            <div className="border rounded p-4">
              <h3 className="font-bold mb-4">CIFRAS DE CONTROL</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>NO. DE FOLIOS VENDIDOS:</span>
                  <span className="font-bold">{corteData.foliosVendidos}</span>
                </div>
                <div className="flex justify-between">
                  <span>SERIE:</span>
                  <span className="font-bold">{corteData.serie}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span>VENTA DEL DÍA:</span>
                  <span className="font-bold">${corteData.ventaDelDia.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>NOTAS CANCELADAS:</span>
                  <span className="font-bold">${corteData.notasCanceladas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ENTRADAS DE CAJA:</span>
                  <span className="font-bold">${corteData.entradasCaja.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SALIDAS DE CAJA:</span>
                  <span className="font-bold">${corteData.salidasCaja.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-lg">
                  <span>SUBTOTAL DEL DÍA:</span>
                  <span className="font-bold">-</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>IVA POR PAGAR DEL DÍA:</span>
                  <span className="font-bold">-</span>
                </div>
              </div>
              
              {/* Nuevo: Desglose por tipo de pago */}
              <div className="mt-4 pt-4 border-t space-y-2 bg-blue-50 p-3 rounded">
                <h4 className="font-bold text-blue-800">DESGLOSE POR TIPO DE PAGO</h4>
                <div className="flex justify-between">
                  <span>Total Efectivo:</span>
                  <span className="font-bold text-green-600">${corteData.totalEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tarjeta:</span>
                  <span className="font-bold text-blue-600">${corteData.totalTarjeta.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Vista Previa */}
            <div className="border rounded p-4">
              <h3 className="font-bold mb-4">VISTA PREVIA</h3>
              <div className="bg-gray-50 h-96 rounded p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left">Folio</th>
                      <th className="text-right">Total</th>
                      <th className="text-center">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Aquí se mostrarían las ventas del día */}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 border-t pt-4">
                <h4 className="font-bold mb-2">DETALLE DE LA VENTA:</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left">Cant</th>
                      <th className="text-left">Producto</th>
                      <th className="text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Detalle de venta seleccionada */}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-6">
            <button className="px-6 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-2">
              <span>📄</span> CORTE PARCIAL
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2">
              <span>⏰</span> CAMBIO DE TURNO
            </button>
            <button className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2">
              <span>📊</span> DETALLE DE VENTAS DEL DÍA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### **FASE 5: Módulo de Respaldo y Restauración** (5 días)

### 5.1 Servicio de Backup

```typescript
// src/main/services/backup.service.ts
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import crypto from 'crypto';

export class BackupService {
  private backupPath = path.join(app.getPath('userData'), 'backups');
  
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    const backupDir = path.join(this.backupPath, backupName);
    
    await fs.ensureDir(backupDir);
    
    // 1. Exportar base de datos
    const dbPath = path.join(app.getPath('userData'), 'farmacia.db');
    const dbBackupPath = path.join(backupDir, 'database.db');
    await fs.copy(dbPath, dbBackupPath);
    
    // 2. Exportar metadata
    const metadata = {
      version: app.getVersion(),
      date: new Date().toISOString(),
      sucursal: await this.getSucursalInfo(),
      checksum: await this.calculateChecksum(dbBackupPath),
      tables: await this.getTableInfo()
    };
    
    await fs.writeJson(path.join(backupDir, 'metadata.json'), metadata);
    
    // 3. Comprimir
    const zipPath = path.join(this.backupPath, `${backupName}.fmsbackup`);
    await this.createZip(backupDir, zipPath);
    
    // 4. Limpiar directorio temporal
    await fs.remove(backupDir);
    
    return zipPath;
  }
  
  async restoreBackup(backupFile: string): Promise<void> {
    const tempDir = path.join(this.backupPath, 'temp_restore');
    
    try {
      // 1. Descomprimir
      await this.extractZip(backupFile, tempDir);
      
      // 2. Validar integridad
      const metadata = await fs.readJson(path.join(tempDir, 'metadata.json'));
      const dbPath = path.join(tempDir, 'database.db');
      const checksum = await this.calculateChecksum(dbPath);
      
      if (checksum !== metadata.checksum) {
        throw new Error('El archivo de respaldo está corrupto');
      }
      
      // 3. Crear backup de seguridad actual
      await this.createSafetyBackup();
      
      // 4. Restaurar base de datos
      const targetDbPath = path.join(app.getPath('userData'), 'farmacia.db');
      await fs.copy(dbPath, targetDbPath, { overwrite: true });
      
      // 5. Reiniciar conexión a base de datos
      await this.reconnectDatabase();
      
    } finally {
      await fs.remove(tempDir);
    }
  }
  
  async exportToUSB(usbPath: string): Promise<void> {
    const backupFile = await this.createBackup();
    const usbBackupPath = path.join(usbPath, 'FarmaciasMS_Backup');
    
    await fs.ensureDir(usbBackupPath);
    await fs.copy(backupFile, path.join(usbBackupPath, path.basename(backupFile)));
  }
  
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }
}
```

### 5.2 Interfaz de Respaldo

```tsx
const BackupRestore: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [usbDevices, setUsbDevices] = useState([]);
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Respaldo y Restauración</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Crear Respaldo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Crear Respaldo</h3>
          
          <div className="space-y-4">
            <button
              onClick={handleCreateBackup}
              className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Creando respaldo...' : '💾 Crear Respaldo Local'}
            </button>
            
            {usbDevices.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Dispositivos USB detectados:</h4>
                {usbDevices.map((device) => (
                  <button
                    key={device.path}
                    onClick={() => handleExportToUSB(device.path)}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 mb-2"
                  >
                    💾 Exportar a {device.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Restaurar Respaldo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Restaurar Respaldo</h3>
          
          <div className="space-y-4">
            <button
              onClick={handleSelectBackupFile}
              className="w-full py-3 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              📂 Seleccionar Archivo de Respaldo
            </button>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Respaldos recientes:</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backups.map((backup) => (
                  <div
                    key={backup.name}
                    className="flex justify-between items-center p-2 border rounded hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-sm text-gray-600">{backup.date}</p>
                    </div>
                    <button
                      onClick={() => handleRestore(backup.path)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Información de Respaldo Automático */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800">⚠️ Respaldo Automático</h4>
        <p className="text-sm text-yellow-700 mt-2">
          El sistema realiza respaldos automáticos diariamente a las 23:00 hrs.
          Los respaldos se mantienen por 30 días.
        </p>
      </div>
    </div>
  );
};
```

---

### **FASE 6: Módulo de Sincronización con Supabase** (1 semana)

### 6.1 Servicio de Sincronización

```typescript
// src/main/services/sync.service.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../database/connection';

export class SyncService {
  private supabase;
  private syncInterval: NodeJS.Timeout;
  private isSyncing = false;
  
  constructor(private db: Database) {
    this.initSupabase();
  }
  
  private async initSupabase() {
    const config = await this.db.query(
      'SELECT * FROM CONFIGURACION_SINCRONIZACION WHERE SINCRONIZACION_ACTIVA = 1'
    );
    
    if (config) {
      this.supabase = createClient(
        config.SUPABASE_URL,
        config.SUPABASE_ANON_KEY
      );
      
      this.startAutoSync(config.INTERVALO_SINCRONIZACION);
    }
  }
  
  async syncData(tipo: 'COMPLETA' | 'INCREMENTAL' = 'INCREMENTAL') {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    const syncLog = await this.createSyncLog(tipo);
    
    try {
      // 1. Verificar conexión
      if (!await this.checkConnection()) {
        throw new Error('No hay conexión a internet');
      }
      
      // 2. Obtener última sincronización
      const lastSync = await this.getLastSync();
      
      // 3. Sincronizar cada tabla
      const tables = ['PRODUCTO', 'SALIDA', 'MOVSALIDA', 'ENTRADA', 'MOVENTRADA', 'CORTE'];
      let totalSent = 0;
      let totalReceived = 0;
      
      for (const table of tables) {
        const result = await this.syncTable(table, lastSync, tipo);
        totalSent += result.sent;
        totalReceived += result.received;
      }
      
      // 4. Actualizar log
      await this.updateSyncLog(syncLog.id, {
        estado: 'EXITOSA',
        registrosSent: totalSent,
        registrosReceived: totalReceived
      });
      
    } catch (error) {
      await this.updateSyncLog(syncLog.id, {
        estado: 'ERROR',
        mensaje: error.message
      });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }
  
  private async syncTable(tableName: string, lastSync: Date, tipo: string) {
    let sent = 0;
    let received = 0;
    
    // Subir cambios locales
    const localChanges = await this.getLocalChanges(tableName, lastSync);
    if (localChanges.length > 0) {
      const { error } = await this.supabase
        .from(tableName.toLowerCase())
        .upsert(localChanges);
      
      if (!error) {
        sent = localChanges.length;
      }
    }
    
    // Descargar cambios remotos
    const { data: remoteChanges } = await this.supabase
      .from(tableName.toLowerCase())
      .select('*')
      .gt('updated_at', lastSync.toISOString());
    
    if (remoteChanges && remoteChanges.length > 0) {
      await this.applyRemoteChanges(tableName, remoteChanges);
      received = remoteChanges.length;
    }
    
    return { sent, received };
  }
  
  private async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch {
      return false;
    }
  }
  
  startAutoSync(intervalMinutes: number) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncData('INCREMENTAL');
      } catch (error) {
        console.error('Error en sincronización automática:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
  
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}
```

### 6.2 Interfaz de Sincronización

```tsx
const SyncConfiguration: React.FC = () => {
  const [config, setConfig] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    intervalo: 30,
    activo: false,
    modo: 'INCREMENTAL'
  });
  
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    isOnline: false,
    isSyncing: false,
    pendingChanges: 0
  });
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Configuración de Sincronización</h2>
      
      {/* Estado de Conexión */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="font-semibold">
              Estado: {syncStatus.isOnline ? 'En línea' : 'Sin conexión'}
            </span>
          </div>
          
          {syncStatus.lastSync && (
            <div className="text-sm text-gray-600">
              Última sincronización: {new Date(syncStatus.lastSync).toLocaleString()}
            </div>
          )}
          
          {syncStatus.pendingChanges > 0 && (
            <div className="text-sm text-orange-600">
              {syncStatus.pendingChanges} cambios pendientes
            </div>
          )}
        </div>
      </div>
      
      {/* Configuración */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Configuración de Supabase</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL del Proyecto</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded"
              value={config.supabaseUrl}
              onChange={(e) => setConfig({...config, supabaseUrl: e.target.value})}
              placeholder="https://tuproyecto.supabase.co"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Llave Anónima</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded"
              value={config.supabaseAnonKey}
              onChange={(e) => setConfig({...config, supabaseAnonKey: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Intervalo de Sincronización (minutos)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded"
              value={config.intervalo}
              onChange={(e) => setConfig({...config, intervalo: parseInt(e.target.value)})}
              min="5"
              max="1440"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Modo de Sincronización</label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={config.modo}
              onChange={(e) => setConfig({...config, modo: e.target.value})}
            >
              <option value="INCREMENTAL">Incremental (Solo cambios)</option>
              <option value="COMPLETA">Completa (Todos los datos)</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activar"
              checked={config.activo}
              onChange={(e) => setConfig({...config, activo: e.target.checked})}
            />
            <label htmlFor="activar" className="font-medium">
              Activar sincronización automática
            </label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSaveConfig}
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar Configuración
            </button>
            
            <button
              onClick={handleSyncNow}
              className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={syncStatus.isSyncing}
            >
              {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Historial de Sincronización */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Historial de Sincronización</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Fecha</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-center p-2">Enviados</th>
                <th className="text-center p-2">Recibidos</th>
                <th className="text-center p-2">Estado</th>
                <th className="text-left p-2">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {/* Aquí se mostrarían los logs de sincronización */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

---

### **FASE 7: Funciones Especiales y Administración** (4 días)

### 7.1 Menú de Funciones Especiales

```tsx
const FuncionesEspeciales: React.FC = () => {
  const [usuario] = useState('Alma');
  
  const funciones = [
    { 
      label: 'ACTUALIZAR BASE DE DATOS',
      color: 'bg-cyan-400',
      onClick: handleActualizarDB
    },
    {
      label: 'ENTRADA DE MERCANCÍA',
      color: 'bg-cyan-400',
      onClick: handleEntradaMercancia
    },
    {
      label: 'TRASPASO DE MERCANCÍA',
      color: 'bg-cyan-400',
      onClick: handleTraspasoMercancia
    },
    {
      label: 'INVENTARIO ALEATORIO',
      color: 'bg-cyan-400',
      onClick: handleInventarioAleatorio
    },
    {
      label: 'GENERAR ARCHIVO INFO',
      color: 'bg-cyan-400',
      onClick: handleGenerarInfo
    }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Procesos Especiales</h2>
          <button onClick={onClose} className="text-red-500 text-2xl">×</button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="text-center">Usuario actual del sistema</p>
          <p className="text-center font-bold">{usuario}</p>
        </div>
        
        <div className="space-y-2">
          {funciones.map((funcion, index) => (
            <button
              key={index}
              className={`w-full py-3 ${funcion.color} text-black font-semibold rounded hover:opacity-90`}
              onClick={funcion.onClick}
            >
              {funcion.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 7.2 Módulo PLM (Información de Medicamentos)

```tsx
const PLM: React.FC = () => {
  const [medicamento, setMedicamento] = useState(null);
  const [listaMedicamentos, setListaMedicamentos] = useState([]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-4xl h-5/6 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">📋 PLM</h2>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Panel Izquierdo - Lista */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <div className="mb-4">
              <label className="block text-sm mb-1">Nombre:</label>
              <input
                type="text"
                className="w-full px-2 py-1 border rounded"
                placeholder="Buscar medicamento..."
              />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-semibold">Lista de medicamentos:</p>
              <p className="text-xs text-gray-600">Medicamentos en la base de datos: 5313</p>
              
              <div className="border rounded h-96 overflow-y-auto">
                {listaMedicamentos.map((med) => (
                  <div
                    key={med.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                    onClick={() => setMedicamento(med)}
                  >
                    {med.nombre}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Panel Derecho - Información */}
          <div className="flex-1 p-4 overflow-y-auto">
            {medicamento ? (
              <>
                <div className="mb-4">
                  <h3 className="font-bold text-lg">Información del medicamento</h3>
                  <p className="font-semibold mt-2">{medicamento.nombre}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Sustancias Activas:</p>
                  <p>{medicamento.sustancias}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-2">Descripción:</h4>
                  <div className="text-sm space-y-2">
                    <p><strong>FORMA FARMACÉUTICA Y FORMULACIÓN:</strong></p>
                    <p>{medicamento.formulacion}</p>
                    
                    <p className="mt-3"><strong>INDICACIONES TERAPÉUTICAS:</strong></p>
                    <p>{medicamento.indicaciones}</p>
                    
                    <p className="mt-3"><strong>FARMACOCINÉTICA Y FARMACODINAMIA:</strong></p>
                    <p>{medicamento.farmacocinetica}</p>
                    
                    <p className="mt-3"><strong>Laboratorio:</strong></p>
                    <p>{medicamento.laboratorio}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Seleccione un medicamento para ver su información</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### **FASE 8: Reportes y Estadísticas** (3 días)

### 8.1 Dashboard de Reportes

```tsx
const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  
  const [stats, setStats] = useState({
    ventasTotales: 0,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    productosVendidos: 0,
    ticketPromedio: 0
  });
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Reportes y Estadísticas</h2>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Desde</label>
            <input
              type="date"
              className="px-3 py-2 border rounded"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hasta</label>
            <input
              type="date"
              className="px-3 py-2 border rounded"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            />
          </div>
          <button
            onClick={handleGenerateReport}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generar Reporte
          </button>
        </div>
      </div>
      
      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Ventas Totales</p>
          <p className="text-2xl font-bold">${stats.ventasTotales.toFixed(2)}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Ventas Efectivo</p>
          <p className="text-2xl font-bold text-green-600">${stats.ventasEfectivo.toFixed(2)}</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Ventas Tarjeta</p>
          <p className="text-2xl font-bold text-blue-600">${stats.ventasTarjeta.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Productos Vendidos</p>
          <p className="text-2xl font-bold">{stats.productosVendidos}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Ticket Promedio</p>
          <p className="text-2xl font-bold">${stats.ticketPromedio.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Gráficas */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Ventas por Tipo de Pago</h3>
          <PieChart data={paymentTypeData} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Ventas por Día</h3>
          <LineChart data={dailySalesData} />
        </div>
      </div>
      
      {/* Productos Más Vendidos */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Productos Más Vendidos</h3>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Código</th>
              <th className="text-left p-2">Producto</th>
              <th className="text-center p-2">Cantidad</th>
              <th className="text-right p-2">Total Vendido</th>
            </tr>
          </thead>
          <tbody>
            {/* Datos de productos */}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## 📅 Cronograma de Desarrollo

| Fase | Duración | Fecha Inicio | Fecha Fin | Estado |
|------|----------|--------------|-----------|--------|
| Fase 1: Configuración Base | 1 semana | Semana 1 | Semana 1 | ⏳ Pendiente |
| Fase 2: Autenticación | 3 días | Semana 2 | Semana 2 | ⏳ Pendiente |
| Fase 3: Módulo POS | 1.5 semanas | Semana 2 | Semana 3 | ⏳ Pendiente |
| Fase 4: Corte de Caja | 4 días | Semana 4 | Semana 4 | ⏳ Pendiente |
| Fase 5: Respaldo/Restauración | 5 días | Semana 5 | Semana 5 | ⏳ Pendiente |
| Fase 6: Sincronización | 1 semana | Semana 6 | Semana 6 | ⏳ Pendiente |
| Fase 7: Funciones Especiales | 4 días | Semana 7 | Semana 7 | ⏳ Pendiente |
| Fase 8: Reportes | 3 días | Semana 7 | Semana 7 | ⏳ Pendiente |
| Fase 9: Testing | 1 semana | Semana 8 | Semana 8 | ⏳ Pendiente |
| Fase 10: Despliegue | 3 días | Semana 9 | Semana 9 | ⏳ Pendiente |

**Duración Total Estimada**: 9 semanas

---

## 🧪 FASE 9: Testing y Control de Calidad (1 semana)

### 9.1 Configuración de Testing

**Archivo**: `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0",
    "jest": "^29.0.0",
    "sqlite3": ":memory:"
  }
}
```

### 9.2 Tests Unitarios

**Archivo**: `src/tests/unit/product.service.test.ts`

```typescript
import { ProductService } from '../../main/services/product.service';
import { Database } from '../../main/database/connection';

describe('ProductService', () => {
  let service: ProductService;
  let db: Database;
  
  beforeEach(async () => {
    db = new Database(':memory:');
    await db.initialize();
    service = new ProductService(db);
  });
  
  describe('searchProduct', () => {
    it('debe buscar productos por código de barras', async () => {
      // Insertar producto de prueba
      await db.execute(`
        INSERT INTO PRODUCTO (CODIGO_PRODUCTO, NOMBRE_PRODUCTO, PRECIO_PRODUCTO)
        VALUES ('7501104666', 'ASPIRINA PROTECT', 45.00)
      `);
      
      const result = await service.searchByCode('7501104666');
      
      expect(result).toBeDefined();
      expect(result.NOMBRE_PRODUCTO).toBe('ASPIRINA PROTECT');
      expect(result.PRECIO_PRODUCTO).toBe(45.00);
    });
    
    it('debe buscar productos por nombre parcial', async () => {
      const results = await service.searchByName('ASPIRINA');
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
    });
    
    it('debe validar existencias antes de vender', async () => {
      const producto = await service.getById(1);
      const canSell = await service.checkStock(1, 10);
      
      expect(canSell).toBe(producto.CANTIDAD_PRODUCTO >= 10);
    });
  });
});
```

### 9.3 Tests de Integración

**Archivo**: `src/tests/integration/sale.integration.test.ts`

```typescript
describe('Proceso de Venta Completo', () => {
  let app: Application;
  
  beforeAll(async () => {
    app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '../../')]
    });
    await app.start();
  });
  
  afterAll(async () => {
    await app.stop();
  });
  
  it('debe completar una venta con pago en efectivo', async () => {
    // 1. Login
    await app.client.setValue('#username', 'cajero');
    await app.client.setValue('#password', 'test123');
    await app.client.click('#login-btn');
    
    // 2. Agregar productos
    await app.client.setValue('#search-product', '7501104666');
    await app.client.keys('Enter');
    
    // 3. Verificar carrito
    const cartItems = await app.client.$('.cart-item');
    expect(cartItems.length).toBe(1);
    
    // 4. Procesar pago
    await app.client.click('#btn-cerrar-venta');
    await app.client.click('#pago-efectivo');
    await app.client.setValue('#monto-recibido', '100');
    await app.client.click('#confirmar-pago');
    
    // 5. Verificar venta guardada
    const folio = await app.client.getText('#folio-venta');
    expect(folio).toMatch(/\d+/);
  });
  
  it('debe procesar pago mixto (efectivo + tarjeta)', async () => {
    // Test de pago mixto
    await app.client.click('#pago-mixto');
    await app.client.setValue('#monto-efectivo', '50');
    await app.client.setValue('#monto-tarjeta', '50');
    await app.client.setValue('#autorizacion', '123456');
    await app.client.click('#confirmar-pago');
    
    // Verificar registro en base de datos
    const venta = await db.query('SELECT * FROM SALIDA ORDER BY ID_SALIDA DESC LIMIT 1');
    expect(venta.TIPO_PAGO).toBe('MIXTO');
    expect(venta.MONTO_EFECTIVO).toBe(50);
    expect(venta.MONTO_TARJETA).toBe(50);
  });
});
```

### 9.4 Tests E2E (End-to-End)

**Archivo**: `src/tests/e2e/backup-restore.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';

test.describe('Respaldo y Restauración', () => {
  test('debe crear respaldo y restaurarlo correctamente', async ({ page }) => {
    // Navegar a configuración
    await page.goto('electron://./index.html');
    await page.click('#menu-configuracion');
    await page.click('#backup-restore');
    
    // Crear respaldo
    await page.click('#btn-crear-respaldo');
    await page.waitForSelector('.backup-success', { timeout: 10000 });
    
    // Verificar archivo creado
    const backupPath = await page.textContent('#backup-path');
    expect(await fs.pathExists(backupPath)).toBeTruthy();
    
    // Modificar datos
    await page.goto('#/pos');
    await createTestSale(page);
    
    // Restaurar respaldo
    await page.goto('#/backup');
    await page.click('#btn-restaurar');
    await page.setInputFiles('#file-input', backupPath);
    await page.click('#confirm-restore');
    
    // Verificar datos restaurados
    await page.waitForSelector('.restore-success');
    const salesCount = await page.textContent('#sales-count');
    expect(salesCount).toBe('0'); // Debería volver al estado anterior
  });
});
```

### 9.5 Plan de Pruebas

## Plan de Pruebas - Sistema POS Farmacias MS

### 1. Pruebas Funcionales

#### Módulo de Ventas
- [ ] Búsqueda de productos por código
- [ ] Búsqueda de productos por nombre
- [ ] Agregar productos al carrito
- [ ] Modificar cantidades
- [ ] Eliminar productos del carrito
- [ ] Cálculo correcto de totales
- [ ] Aplicación de descuentos
- [ ] Cancelación de venta

#### Módulo de Pagos
- [ ] Pago en efectivo
- [ ] Cálculo de cambio
- [ ] Pago con tarjeta
- [ ] Validación de campos de tarjeta
- [ ] Pago mixto
- [ ] Generación de comprobante

#### Módulo de Corte
- [ ] Corte parcial
- [ ] Corte total
- [ ] Cálculo de totales por tipo de pago
- [ ] Generación de reporte
- [ ] Cambio de turno

### 2. Pruebas de Rendimiento
- [ ] Búsqueda con 5000+ productos
- [ ] Procesamiento de 100+ ventas diarias
- [ ] Sincronización de 10000+ registros
- [ ] Respaldo de base de datos > 500MB

### 3. Pruebas de Seguridad
- [ ] Autenticación de usuarios
- [ ] Autorización por roles
- [ ] Encriptación de contraseñas
- [ ] Tokens de sesión
- [ ] Logs de auditoría

### 4. Pruebas de Compatibilidad
- [ ] Windows 10/11
- [ ] Resoluciones: 1366x768, 1920x1080
- [ ] Con/sin conexión a internet
- [ ] Impresoras térmicas comunes

---

## 🚀 FASE 10: Despliegue y Distribución (3 días)

### 10.1 Configuración de Electron Builder

**Archivo**: `electron-builder.yml`

```yaml
appId: com.farmaciasms.pos
productName: Farmacias MS - Punto de Venta
copyright: Copyright © 2024 Farmacias MS
directories:
  output: dist
  buildResources: build

files:
  - src/**/*
  - node_modules/**/*
  - package.json

extraResources:
  - database/schema.sql
  - assets/**/*

win:
  target:
    - nsis
    - portable
  icon: build/icon.ico
  requestedExecutionLevel: requireAdministrator
  
nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  installerHeaderIcon: build/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Farmacias MS POS

portable:
  artifactName: FarmaciasMS-POS-Portable.exe

mac:
  category: public.app-category.business
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

linux:
  target:
    - AppImage
    - deb
  icon: build/icon.png
  category: Office
  desktop:
    Name: Farmacias MS POS
    Comment: Sistema de Punto de Venta
    Categories: Office;
```

### 10.2 Scripts de Build

**Archivo**: `package.json`

```json
{
  "scripts": {
    "build": "npm run build:react && npm run build:electron",
    "build:react": "vite build",
    "build:electron": "tsc -p tsconfig.electron.json",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux",
    "dist:all": "npm run build && electron-builder -mwl",
    "postinstall": "electron-builder install-app-deps",
    "release": "npm run test && npm run dist"
  }
}
```

### 10.3 Auto-Updater

**Archivo**: `src/main/updater.ts`

```typescript
import { autoUpdater } from 'electron-updater';
import { dialog, BrowserWindow } from 'electron';
import log from 'electron-log';

export class AutoUpdater {
  constructor(private mainWindow: BrowserWindow) {
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('Buscando actualizaciones...');
    });
    
    autoUpdater.on('update-available', (info) => {
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Actualización Disponible',
        message: `Nueva versión ${info.version} disponible. ¿Desea descargarla?`,
        buttons: ['Sí', 'No']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });
    
    autoUpdater.on('update-not-available', () => {
      this.sendStatusToWindow('Sistema actualizado');
    });
    
    autoUpdater.on('download-progress', (progressObj) => {
      let message = `Descargando: ${Math.round(progressObj.percent)}%`;
      message += ` (${this.formatBytes(progressObj.transferred)}/${this.formatBytes(progressObj.total)})`;
      this.sendStatusToWindow(message);
    });
    
    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Actualización Lista',
        message: 'La actualización se instalará al reiniciar la aplicación.',
        buttons: ['Reiniciar Ahora', 'Más Tarde']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }
  
  checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
  }
  
  private sendStatusToWindow(text: string) {
    this.mainWindow.webContents.send('update-status', text);
  }
  
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
```

### 10.4 Instalador Personalizado

**Archivo**: `installer/setup.nsi`

```nsi
!define APP_NAME "Farmacias MS POS"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "Farmacias MS"
!define APP_URL "https://farmaciasms.com"

; Páginas del instalador
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Componentes
Section "Aplicación Principal" SEC_APP
  SetOutPath "$INSTDIR"
  File /r "dist\win-unpacked\*.*"
  
  ; Crear accesos directos
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_NAME}.exe"
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_NAME}.exe"
SectionEnd

Section "Base de Datos Inicial" SEC_DB
  SetOutPath "$APPDATA\FarmaciasMS"
  File "database\farmacia.db"
  File "database\productos_iniciales.sql"
SectionEnd

Section "Manual de Usuario" SEC_MANUAL
  SetOutPath "$INSTDIR\docs"
  File "docs\manual_usuario.pdf"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Manual.lnk" "$INSTDIR\docs\manual_usuario.pdf"
SectionEnd
```

---

## 📚 Documentación Adicional

### Manual de Instalación

# Manual de Instalación - Farmacias MS POS

## Requisitos del Sistema

### Hardware Mínimo:
- Procesador: Intel Core i3 o equivalente
- RAM: 4 GB
- Disco Duro: 500 MB disponibles
- Resolución: 1366x768 mínimo

### Software:
- Windows 10/11 (64 bits)
- .NET Framework 4.7.2 o superior

## Proceso de Instalación

1. **Descargar el instalador**
   - Archivo: `FarmaciasMS-Setup-1.0.0.exe`

2. **Ejecutar como Administrador**
   - Click derecho → "Ejecutar como administrador"

3. **Seguir el asistente**
   - Aceptar términos y condiciones
   - Seleccionar carpeta de instalación
   - Elegir componentes a instalar

4. **Configuración Inicial**
   - Al primer inicio, configurar:
     - Datos de la sucursal
     - Usuario administrador
     - Conexión a Supabase (opcional)

5. **Activación**
   - Ingresar licencia proporcionada
   - Validar sucursal

## Solución de Problemas

### Error: "No se puede conectar a la base de datos"
- Verificar permisos de escritura en carpeta de datos
- Reinstalar con permisos de administrador

### Error: "Terminal bancaria no detectada"
- Instalar drivers del fabricante
- Configurar puerto COM en ajustes

### Manual de Usuario

# Manual de Usuario - Sistema POS Farmacias MS

## 1. INICIO DE SESIÓN

### Acceso al Sistema
1. Doble click en el icono de Farmacias MS
2. Ingresar usuario y contraseña
3. Click en "OK" o presionar Enter

### Tipos de Usuario
- **Administrador**: Acceso total
- **Cajero**: Solo ventas y consultas

## 2. VENTAS

### Realizar una Venta
1. **Buscar Producto**:
   - Escanear código de barras, o
   - Presionar F5 para búsqueda manual
   
2. **Agregar al Carrito**:
   - Ingresar cantidad (por defecto 1)
   - Presionar Enter

3. **Modificar Carrito**:
   - Supr: Eliminar producto seleccionado
   - Esc: Cancelar venta completa

4. **Cerrar Venta**:
   - Presionar Fin o click en "CERRAR VENTA"
   - Seleccionar tipo de pago
   - Confirmar transacción

### Tipos de Pago

#### Efectivo:
1. Seleccionar "Efectivo"
2. Ingresar monto recibido
3. Sistema calcula cambio automáticamente

#### Tarjeta:
1. Seleccionar "Tarjeta"
2. Pasar tarjeta en terminal
3. Ingresar últimos 4 dígitos
4. Ingresar número de autorización

#### Pago Mixto:
1. Seleccionar "Mixto"
2. Ingresar monto en efectivo
3. Resto se cobra con tarjeta

## 3. ATAJOS DE TECLADO

| Tecla | Función |
|-------|---------|
| F5 | Búsqueda de productos |
| F11 | Funciones especiales |
| F12 | Salir del sistema |
| Fin | Terminar venta |
| Supr | Eliminar producto |
| Esc | Cancelar operación |

## 4. CORTE DE CAJA

### Corte Parcial
1. Menú → Corte → Corte Parcial
2. Revisar montos
3. Imprimir reporte

### Corte Final
1. Al final del turno
2. Contar efectivo físico
3. Registrar diferencias si existen
4. Cerrar turno

## 5. RESPALDOS

### Crear Respaldo Manual
1. Funciones Especiales (F11)
2. Seleccionar "Generar Archivo Info"
3. Elegir ubicación (USB recomendado)

### Restaurar Respaldo
1. Configuración → Respaldos
2. Seleccionar archivo .fmsbackup
3. Confirmar restauración

## 6. SINCRONIZACIÓN

### Estado de Conexión
- Indicador verde: En línea
- Indicador rojo: Sin conexión
- Número de cambios pendientes

### Sincronización Manual
1. Click en icono de nube
2. Esperar confirmación
3. Verificar log de sincronización

---

## 🔒 Consideraciones de Seguridad

### Encriptación de Datos

```typescript
// src/main/security/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private secretKey: Buffer;
  
  constructor() {
    // Generar o cargar clave desde almacén seguro
    this.secretKey = this.getOrCreateKey();
  }
  
  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  private getOrCreateKey(): Buffer {
    const keyPath = path.join(app.getPath('userData'), '.key');
    
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath);
    }
    
    const key = crypto.randomBytes(32);
    fs.writeFileSync(keyPath, key, { mode: 0o600 });
    return key;
  }
}
```

### Auditoría y Logs

```typescript
// src/main/services/audit.service.ts
export class AuditService {
  async logAction(action: AuditAction) {
    await db.execute(`
      INSERT INTO AUDIT_LOG (
        USER_ID,
        ACTION_TYPE,
        TABLE_NAME,
        RECORD_ID,
        OLD_VALUE,
        NEW_VALUE,
        IP_ADDRESS,
        TIMESTAMP
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      action.userId,
      action.type,
      action.table,
      action.recordId,
      JSON.stringify(action.oldValue),
      JSON.stringify(action.newValue),
      action.ipAddress,
      new Date().toISOString()
    ]);
  }
  
  async logSale(sale: Sale) {
    await this.logAction({
      userId: sale.userId,
      type: 'CREATE',
      table: 'SALIDA',
      recordId: sale.id,
      newValue: sale,
      ipAddress: this.getLocalIP()
    });
  }
  
  async logLogin(userId: number, success: boolean) {
    await this.logAction({
      userId,
      type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      table: 'USUARIO',
      recordId: userId,
      ipAddress: this.getLocalIP()
    });
  }
}
```

---

## 📊 Métricas y Monitoreo

### Dashboard de Administración

```typescript
// src/renderer/pages/AdminDashboard.tsx
const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    productosBajoStock: [],
    productosPorCaducar: [],
    sincronizacionStatus: 'OK',
    ultimoRespaldo: null,
    espacioDisco: { usado: 0, total: 0 }
  });
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Administrativo</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Ventas Hoy"
          value={`${metrics.ventasHoy.toFixed(2)}`}
          trend="+15%"
          icon="📈"
        />
        <MetricCard
          title="Ventas Semana"
          value={`${metrics.ventasSemana.toFixed(2)}`}
          trend="+8%"
          icon="📊"
        />
        <MetricCard
          title="Ventas Mes"
          value={`${metrics.ventasMes.toFixed(2)}`}
          trend="+12%"
          icon="💰"
        />
        <MetricCard
          title="Ticket Promedio"
          value="$127.50"
          trend="+5%"
          icon="🧾"
        />
      </div>
      
      {/* Alertas */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <AlertPanel
          title="Productos Bajo Stock"
          items={metrics.productosBajoStock}
          type="warning"
        />
        <AlertPanel
          title="Productos Por Caducar"
          items={metrics.productosPorCaducar}
          type="danger"
        />
      </div>
      
      {/* Estado del Sistema */}
      <SystemStatus
        sincronizacion={metrics.sincronizacionStatus}
        ultimoRespaldo={metrics.ultimoRespaldo}
        espacioDisco={metrics.espacioDisco}
      />
    </div>
  );
};
```

---

## 🎯 Checklist de Entrega

### Pre-Producción

- [ ] Todas las pruebas pasando
- [ ] Documentación completa
- [ ] Manual de usuario actualizado
- [ ] Videos tutoriales grabados
- [ ] Licencias de software verificadas

### Configuración Inicial

- [ ] Base de datos con catálogo de productos
- [ ] Usuarios predeterminados creados
- [ ] Configuración de sucursal
- [ ] Impresora de tickets configurada
- [ ] Terminal bancaria integrada

### Capacitación

- [ ] Sesión con administradores
- [ ] Sesión con cajeros
- [ ] Material de referencia entregado
- [ ] Soporte técnico configurado

### Go-Live

- [ ] Respaldo del sistema anterior
- [ ] Migración de datos históricos
- [ ] Prueba en ambiente real
- [ ] Monitoreo primeras 48 horas
- [ ] Ajustes post-implementación

---

## 📞 Soporte y Mantenimiento

### Plan de Soporte

## Niveles de Soporte

### Nivel 1 - Soporte Básico
- Horario: Lunes a Sábado, 8:00 - 20:00
- Canal: Teléfono y WhatsApp
- Tiempo de respuesta: 2 horas
- Incluye:
  - Consultas de operación
  - Reseteo de contraseñas
  - Guía de funciones básicas

### Nivel 2 - Soporte Técnico
- Horario: Lunes a Viernes, 9:00 - 18:00
- Canal: TeamViewer / AnyDesk
- Tiempo de respuesta: 4 horas
- Incluye:
  - Solución de errores
  - Configuración de dispositivos
  - Restauración de respaldos

### Nivel 3 - Soporte Crítico
- Horario: 24/7 para casos críticos
- Canal: Línea directa + Visita en sitio
- Tiempo de respuesta: 1 hora
- Incluye:
  - Sistema completamente caído
  - Pérdida de datos
  - Problemas de seguridad

## Mantenimiento Preventivo

### Mensual
- Verificación de respaldos
- Limpieza de logs antiguos
- Actualización de catálogos
- Revisión de sincronización

### Trimestral
- Optimización de base de datos
- Actualización de seguridad
- Capacitación de refuerzo
- Auditoría de operaciones

### Anual
- Renovación de licencias
- Actualización mayor del sistema
- Revisión de infraestructura
- Planeación de mejoras

---

## 🚩 Conclusión

Este plan de desarrollo proporciona una guía completa para implementar el Sistema POS de Farmacias MS con todas las características solicitadas:

✅ **Funcionalidad Offline-First** con sincronización opcional
✅ **Pagos con Tarjeta** integrados al sistema
✅ **Respaldo y Restauración** vía USB
✅ **Interfaz Familiar** basada en el sistema anterior
✅ **Seguridad y Auditoría** completas
✅ **Reportes Detallados** por tipo de pago
✅ **Sincronización con Supabase** cuando hay internet
✅ **Multi-sucursal** preparado para expansión

El sistema está diseñado para ser robusto, escalable y fácil de usar, manteniendo la familiaridad con el sistema anterior mientras agrega las nuevas funcionalidades requeridas.

**Tiempo Total Estimado**: 9 semanas
**Equipo Recomendado**: 2-3 desarrolladores full-stack con experiencia en Electron y React

---

*Documento preparado para Farmacias MS - Sistema de Punto de Venta v2.0*