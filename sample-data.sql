-- Datos de muestra para pruebas del sistema POS
-- Este archivo contiene productos, usuarios y configuración básica

-- Configuración de sucursal de prueba
INSERT OR IGNORE INTO SUCURSAL (
    SUCURSAL_ID, NOMBRE_SUCURSAL, RAZON_SOCIAL, DIRECCION, TELEFONO,
    PROPIETARIO_ID, CONFIGURACION, ACTIVA
) VALUES (
    'SUC001',
    'Farmacia Centro',
    'FARMACIAS MS S.A. DE C.V.',
    'Av. Principal 123, Centro, Ciudad',
    '555-0123',
    'PROP001',
    '{"SYNC_AUTO_ENABLED": false, "CASH_DRAWER_ENABLED": true, "BACKUP_AUTO_ENABLED": true}',
    1
);

-- Laboratorios
INSERT OR IGNORE INTO LABORATORIO (id_laboratorio, nombre_laboratorio, contacto_laboratorio) VALUES
(1, 'BAYER', 'contacto@bayer.com'),
(2, 'PFIZER', 'contacto@pfizer.com'),
(3, 'GENOMMA LAB', 'contacto@genommalab.com'),
(4, 'GRÜNENTHAL', 'contacto@grunenthal.com'),
(5, 'LIOMONT', 'contacto@liomont.com');

-- Tipos de usuario
INSERT OR IGNORE INTO TIPOUSUARIO (ID_TIPOUSUARIO, NOMBRE_TIPO, PERMISOS) VALUES
(1, 'ADMINISTRADOR', '["ventas", "cancelar_ventas", "corte_caja", "inventario", "reportes", "configuracion", "usuarios", "backup", "sincronizacion", "plm"]'),
(2, 'CAJERO', '["ventas", "corte_caja"]'),
(3, 'SUPERVISOR', '["ventas", "cancelar_ventas", "corte_caja", "inventario", "reportes"]');

-- Usuario administrador de prueba
INSERT OR IGNORE INTO USUARIO (
    ID_USUARIO, LOGIN_USUARIO, PASSWORD_USUARIO, NOMBRE_USUARIO,
    ID_TIPOUSUARIO, SUCURSAL_ID, ACTIVO
) VALUES (
    1, 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Administrador',
    1, 'SUC001', 1
);

-- Usuario cajero de prueba
INSERT OR IGNORE INTO USUARIO (
    ID_USUARIO, LOGIN_USUARIO, PASSWORD_USUARIO, NOMBRE_USUARIO,
    ID_TIPOUSUARIO, SUCURSAL_ID, ACTIVO
) VALUES (
    2, 'cajero', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Cajero Principal',
    2, 'SUC001', 1
);

-- Productos de muestra con diferentes categorías
INSERT OR IGNORE INTO PRODUCTO (
    ID_PRODUCTO, CODIGO_PRODUCTO, NOMBRE_PRODUCTO, SUSTANCIA_PRODUCTO,
    CANTIDAD_PRODUCTO, PRECIO_PRODUCTO, COSTO_PRODUCTO, ID_LABORATORIO,
    MAX_PRODUCTO, MIN_PRODUCTO, SUCURSAL_ID, ACTIVO
) VALUES
-- Analgésicos
(1, '7501234567890', 'PARACETAMOL 500mg 20 TAB', 'Acetaminofén', 150, 25.50, 18.00, 1, 200, 20, 'SUC001', 1),
(2, '7501234567891', 'IBUPROFENO 400mg 20 CAP', 'Ibuprofeno', 80, 35.00, 25.00, 2, 100, 15, 'SUC001', 1),
(3, '7501234567892', 'ASPIRINA 500mg 10 TAB', 'Ácido acetilsalicílico', 60, 18.75, 12.50, 1, 100, 10, 'SUC001', 1),
(4, '7501234567893', 'NAPROXENO 250mg 10 TAB', 'Naproxeno sódico', 45, 28.90, 20.00, 2, 80, 10, 'SUC001', 1),

-- Antibióticos
(5, '7501234567894', 'AMOXICILINA 500mg 21 CAP', 'Amoxicilina', 35, 65.00, 45.00, 3, 50, 5, 'SUC001', 1),
(6, '7501234567895', 'AZITROMICINA 500mg 3 TAB', 'Azitromicina', 25, 85.50, 60.00, 2, 40, 5, 'SUC001', 1),
(7, '7501234567896', 'CEFALEXINA 500mg 21 CAP', 'Cefalexina', 30, 75.00, 52.00, 4, 50, 5, 'SUC001', 1),

-- Antigripales
(8, '7501234567897', 'TABCIN GRIPE 12 TAB', 'Paracetamol + Fenilefrina + Clorfeniramina', 90, 42.50, 30.00, 1, 120, 15, 'SUC001', 1),
(9, '7501234567898', 'DESENFRIOL-D 10 TAB', 'Paracetamol + Pseudoefedrina + Triprolidina', 75, 38.00, 26.50, 3, 100, 10, 'SUC001', 1),
(10, '7501234567899', 'TYLENOL GRIPE 12 TAB', 'Paracetamol + Pseudoefedrina + Dextrometorfano', 65, 45.00, 32.00, 2, 80, 10, 'SUC001', 1),

-- Digestivos
(11, '7501234567900', 'BUSCAPINA 10mg 20 DRAG', 'Hioscina', 55, 32.00, 22.50, 1, 80, 10, 'SUC001', 1),
(12, '7501234567901', 'PEPTO-BISMOL 240ml', 'Subsalicilato de bismuto', 40, 68.00, 48.00, 2, 60, 8, 'SUC001', 1),
(13, '7501234567902', 'LOPERAMIDA 2mg 20 CAP', 'Loperamida', 35, 28.50, 20.00, 3, 50, 5, 'SUC001', 1),

-- Vitaminas y suplementos
(14, '7501234567903', 'CENTRUM MULTIVITAMINICO 30 TAB', 'Multivitamínico', 48, 95.00, 68.00, 2, 60, 8, 'SUC001', 1),
(15, '7501234567904', 'VITAMINA C 500mg 30 TAB', 'Ácido ascórbico', 72, 35.50, 25.00, 1, 100, 12, 'SUC001', 1),
(16, '7501234567905', 'CALCIO + VITAMINA D 60 TAB', 'Carbonato de calcio + Colecalciferol', 38, 58.00, 42.00, 4, 50, 6, 'SUC001', 1),

-- Productos para la piel
(17, '7501234567906', 'DERMATOVIN CREMA 30g', 'Clotrimazol', 28, 45.50, 32.00, 3, 40, 5, 'SUC001', 1),
(18, '7501234567907', 'HIRUDOID CREMA 40g', 'Heparinoides', 22, 125.00, 90.00, 4, 30, 3, 'SUC001', 1),
(19, '7501234567908', 'BEPANTHEN CREMA 30g', 'Dexpantenol', 35, 78.50, 55.00, 1, 50, 5, 'SUC001', 1),

-- Productos para niños
(20, '7501234567909', 'TEMPRA JARABE 120ml', 'Paracetamol pediátrico', 42, 58.00, 41.00, 2, 60, 8, 'SUC001', 1),
(21, '7501234567910', 'DALSY SUSPENSION 120ml', 'Ibuprofeno pediátrico', 35, 65.50, 46.00, 3, 50, 6, 'SUC001', 1),
(22, '7501234567911', 'PEDIALYTE 500ml', 'Solución rehidratante oral', 48, 32.00, 22.50, 1, 70, 10, 'SUC001', 1),

-- Productos de higiene personal
(23, '7501234567912', 'ISODINE BUCAL 240ml', 'Povidona yodada', 32, 48.50, 34.00, 4, 50, 5, 'SUC001', 1),
(24, '7501234567913', 'ALCOHOL 70% 250ml', 'Alcohol etílico', 85, 15.50, 10.00, 5, 120, 15, 'SUC001', 1),
(25, '7501234567914', 'AGUA OXIGENADA 250ml', 'Peróxido de hidrógeno', 60, 12.00, 8.50, 5, 90, 12, 'SUC001', 1);

-- Stock inicial simulando ventas previas
UPDATE PRODUCTO SET CANTIDAD_PRODUCTO = CANTIDAD_PRODUCTO - (ABS(RANDOM() % 30) + 5) WHERE ID_PRODUCTO <= 25;

-- Asegurar que no quede stock negativo
UPDATE PRODUCTO SET CANTIDAD_PRODUCTO = 5 WHERE CANTIDAD_PRODUCTO < 0;