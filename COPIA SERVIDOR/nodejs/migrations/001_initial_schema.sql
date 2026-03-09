-- Migración Inicial: Gestión Ganadera (Consolidación Cattler-PY) - Normativa SENACSA
-- Creación de tablas base

CREATE TABLE IF NOT EXISTS establecimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ruc VARCHAR(20),
    ubicacion_gps VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS potreros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establecimiento_id INT,
    nombre VARCHAR(50) NOT NULL,
    superficie_ha DECIMAL(10,2),
    FOREIGN KEY (establecimiento_id) REFERENCES establecimientos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rodeos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    potrero_id INT,
    nombre VARCHAR(50) NOT NULL,
    FOREIGN KEY (potrero_id) REFERENCES potreros(id) ON DELETE CASCADE
);

-- Categorías Oficiales SENACSA
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL UNIQUE -- TERNERO, DESMAMANTE_M, NOVILLO_1_2, ETC.
);

-- Insertar Categorias por Defecto
INSERT IGNORE INTO categorias (descripcion) VALUES 
('TERNERO'), ('DESMAMANTE_M'), ('DESMAMANTE_H'), ('NOVILLO_1_2'), 
('NOVILLO_2_3'), ('NOVILLO_3_MAS'), ('VAQUILLONA'), ('VACA'), ('TORO');

CREATE TABLE IF NOT EXISTS animales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caravana_visual VARCHAR(20) UNIQUE NOT NULL, 
    caravana_rfid VARCHAR(50) UNIQUE, -- Chip SITRAP
    categoria_id INT,
    rodeo_id INT,
    peso_actual DECIMAL(10,2),
    fecha_nacimiento DATE,
    negocio_destino ENUM('CRIA', 'ENGORDE', 'CABAÑA') DEFAULT 'ENGORDE',
    estado_general ENUM('ACTIVO', 'VENDIDO', 'MUERTO', 'CONSUMO') DEFAULT 'ACTIVO',
    estado_sanitario ENUM('ACTIVO', 'BLOQUEADO', 'CUARENTENA') DEFAULT 'ACTIVO',
    fecha_liberacion_carencia DATE,
    campana_aftosa_vigente BOOLEAN DEFAULT FALSE,
    vacunado_aftosa BOOLEAN DEFAULT FALSE,
    apto_ue BOOLEAN DEFAULT FALSE, -- Trazabilidad UE
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (rodeo_id) REFERENCES rodeos(id)
);

-- Historial de Pesajes para Cálculo GDP
CREATE TABLE IF NOT EXISTS pesajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT,
    peso_kg DECIMAL(10,2) NOT NULL,
    gdp_calculado DECIMAL(10,3), -- Ganancia Diaria de Peso vs pesaje anterior
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compras_lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    cantidad_animales INT NOT NULL,
    pelaje VARCHAR(50), -- MARRON OSCURO, CLAVEL, ETC.
    peso_promedio_compra DECIMAL(10,2), -- Kilos en Compra
    peso_total DECIMAL(10,2), -- Peso Total (Kg)
    costo_unitario DECIMAL(15,2), -- Costo por Animal (Gs)
    costo_total DECIMAL(15,2), -- Costo Total (Auto-calculated/Stored)
    ganancia_estimada DECIMAL(15,2), -- Ganancia Estimada (Gs)
    vendedor VARCHAR(100),
    lugar_procedencia VARCHAR(100), -- Lugar
    tipo_documento VARCHAR(50), -- Documento (Completa, Boleto, etc.)
    nro_cot VARCHAR(50), -- Optional linkage
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos_ingreso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_lote_id INT, -- Link to the batch purchase
    nro_cot VARCHAR(50), 
    nro_guia_traslado VARCHAR(50),
    fecha_ingreso DATE NOT NULL,
    origen VARCHAR(100),
    foto_marca_path VARCHAR(255),
    animal_id INT,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (compra_lote_id) REFERENCES compras_lotes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS insumos_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    principio_activo VARCHAR(100) NOT NULL,
    descripcion VARCHAR(100),
    dias_carencia INT DEFAULT 0,
    lote VARCHAR(50),
    vencimiento DATE,
    stock_actual DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS sanidad_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evento ENUM('VACUNACION_OFICIAL', 'TRATAMIENTO') NOT NULL,
    nro_acta VARCHAR(50),
    animal_id INT,
    producto_id INT,
    fecha_aplicacion DATE NOT NULL,
    fecha_fin_carencia TIMESTAMP, -- Bloqueo de venta hasta esta fecha
    lote_vencimiento VARCHAR(50),
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    FOREIGN KEY (producto_id) REFERENCES insumos_stock(id)
);

-- Módulo de Ventas (Salida)
CREATE TABLE IF NOT EXISTS ventas_lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    cliente VARCHAR(100),
    destino VARCHAR(100), -- Frigorífico, Feria, Otra Estancia
    cantidad_animales INT,
    peso_total DECIMAL(10,2),
    precio_promedio_kg DECIMAL(15,2),
    total_bruto DECIMAL(15,2),
    descuentos_total DECIMAL(15,2), -- Flete, Comisión, Tasas
    total_neto DECIMAL(15,2), -- Lo que realmente entra a caja
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos_salida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_lote_id INT,
    animal_id INT,
    fecha_salida DATE,
    peso_salida DECIMAL(10,2),
    precio_kg_real DECIMAL(15,2), -- Si se vendió individualmente o por lote
    motivo_salida ENUM('VENTA', 'MUERTE', 'CONSUMO', 'ROBO') DEFAULT 'VENTA',
    FOREIGN KEY (venta_lote_id) REFERENCES ventas_lotes(id) ON DELETE CASCADE,
    FOREIGN KEY (animal_id) REFERENCES animales(id)
);

-- Alter table to add generic status if not exists (Idempotent check not easy in pure SQL script without procedure, 
-- but we can add the column definition to the create table or assumes manual migration for existing DB)
-- For this "Zero to One" setup, I will add it to the CREATE TABLE animales definition above if possible, 
-- or append an ALTER statement here that might fail if run twice (but this is initial schema).
-- Since the user has a running DB, I should provide a separate migration file or append ALTERs safely.
-- I'll append ALTER statements that ignore errors or rely on the user running this on a fresh setup? 
-- The user said "The user's OS version is windows", running `node server.js`. 
-- The best way for an existing app is to CREATE new tables. 
-- For `animales`, I will assume we need to ALTER it.

-- ALTER TABLE animals ADD COLUMN estado_general ENUM('ACTIVO', 'VENDIDO', 'MUERTO', 'CONSUMO') DEFAULT 'ACTIVO';

