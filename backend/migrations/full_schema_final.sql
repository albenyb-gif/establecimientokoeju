-- ============================================
-- SCHEMA FINAL CONSOLIDADO: Establecimiento ko'ẽju
-- FECHA: 27/02/2026
-- Instrucciones: Importar este archivo en phpMyAdmin de Hostinger.
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Estructura Base
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

-- 2. Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO categorias (descripcion) VALUES 
('TERNERO'), ('DESMAMANTE_M'), ('DESMAMANTE_H'), ('NOVILLO_1_2'), 
('NOVILLO_2_3'), ('NOVILLO_3_MAS'), ('VAQUILLONA'), ('VACA'), ('TORO'),
('CORDERO'), ('CORDERA'), ('BORREGO'), ('BORREGA'), ('OVEJA'), ('CARNERO'), ('CAPON');

-- 3. Hacienda (Animales)
CREATE TABLE IF NOT EXISTS animales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caravana_visual VARCHAR(20) UNIQUE NOT NULL, 
    caravana_rfid VARCHAR(50) UNIQUE,
    categoria_id INT,
    pelaje VARCHAR(50),
    peso_inicial DECIMAL(10,2),
    peso_actual DECIMAL(10,2),
    rodeo_id INT,
    fecha_nacimiento DATE,
    negocio_destino ENUM('CRIA', 'ENGORDE', 'CABAÑA') DEFAULT 'ENGORDE',
    estado_general ENUM('ACTIVO', 'VENDIDO', 'MUERTO', 'CONSUMO') DEFAULT 'ACTIVO',
    estado_sanitario ENUM('ACTIVO', 'BLOQUEADO', 'CUARENTENA') DEFAULT 'ACTIVO',
    fecha_liberacion_carencia DATE,
    campana_aftosa_vigente BOOLEAN DEFAULT FALSE,
    vacunado_aftosa BOOLEAN DEFAULT FALSE,
    apto_ue BOOLEAN DEFAULT FALSE,
    especie ENUM('BOVINO', 'OVINO', 'EQUINO', 'CAPRINO') DEFAULT 'BOVINO',
    raza VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (rodeo_id) REFERENCES rodeos(id)
);

-- 4. Pesajes
CREATE TABLE IF NOT EXISTS pesajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT,
    peso_kg DECIMAL(10,2) NOT NULL,
    gdp_calculado DECIMAL(10,3),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
);

-- 5. Compras y Marcas
CREATE TABLE IF NOT EXISTS compras_lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    cantidad_animales INT NOT NULL,
    pelaje VARCHAR(50),
    peso_promedio_compra DECIMAL(10,2),
    peso_total DECIMAL(10,2),
    costo_unitario DECIMAL(15,2),
    costo_total DECIMAL(15,2),
    ganancia_estimada DECIMAL(15,2),
    vendedor VARCHAR(100),
    lugar_procedencia VARCHAR(100),
    tipo_documento VARCHAR(50),
    nro_cot VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animales_marcas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    foto_path VARCHAR(255) NOT NULL,
    tipo_marca ENUM('PROPIA', 'VENDEDOR', 'OTRA') DEFAULT 'VENDEDOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS movimientos_ingreso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_lote_id INT,
    nro_cot VARCHAR(50), 
    nro_guia_traslado VARCHAR(50),
    fecha_ingreso DATE NOT NULL,
    origen VARCHAR(100),
    foto_marca_path VARCHAR(255),
    animal_id INT,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (compra_lote_id) REFERENCES compras_lotes(id) ON DELETE SET NULL
);

-- 6. Sanidad y Stock
CREATE TABLE IF NOT EXISTS insumos_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_comercial VARCHAR(100) NOT NULL,
    principio_activo VARCHAR(100) NOT NULL,
    descripcion VARCHAR(100),
    dias_carencia INT DEFAULT 0,
    lote VARCHAR(50),
    vencimiento DATE,
    stock_actual DECIMAL(10,2),
    unidad_medida VARCHAR(20) DEFAULT 'dosis',
    costo_unitario DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sanidad_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evento ENUM('VACUNACION_OFICIAL', 'TRATAMIENTO') NOT NULL,
    nro_acta VARCHAR(50),
    animal_id INT,
    producto_id INT,
    fecha_aplicacion DATE NOT NULL,
    fecha_fin_carencia TIMESTAMP NULL,
    lote_vencimiento VARCHAR(50),
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    FOREIGN KEY (producto_id) REFERENCES insumos_stock(id)
);

-- 7. Ventas y Gastos
CREATE TABLE IF NOT EXISTS ventas_lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    cliente VARCHAR(100),
    destino VARCHAR(100),
    cantidad_animales INT,
    peso_total DECIMAL(10,2),
    precio_promedio_kg DECIMAL(15,2),
    total_bruto DECIMAL(15,2),
    descuentos_total DECIMAL(15,2),
    total_neto DECIMAL(15,2),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ruc VARCHAR(20) UNIQUE,
    telefono VARCHAR(50),
    email VARCHAR(100),
    direccion TEXT,
    tipo ENUM('PARTICULAR', 'FRIGORIFICO', 'FERIA', 'PROVEEDOR') DEFAULT 'PARTICULAR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gastos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    categoria VARCHAR(50),
    monto DECIMAL(15,2) NOT NULL,
    descripcion TEXT,
    proveedor VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Otros
CREATE TABLE IF NOT EXISTS agenda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo ENUM('REUNION', 'VENTA', 'COMPRA', 'SANIDAD', 'OTRO') DEFAULT 'OTRO',
    fecha_hora DATETIME NOT NULL,
    ubicacion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS = 1;
