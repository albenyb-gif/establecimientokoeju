-- Migración 005: Soporte para múltiples marcas por animal
-- Establecimiento ko'ẽju

CREATE TABLE IF NOT EXISTS animales_marcas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    foto_path VARCHAR(255) NOT NULL,
    tipo_marca ENUM('PROPIA', 'VENDEDOR', 'OTRA') DEFAULT 'VENDEDOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE
);

-- Nota: Mantendremos foto_marca_path en movimientos_ingreso como la 'marca principal' o del documento,
-- pero esta nueva tabla permitirá registrar el historial de marcas que el usuario mencionó (doble marca).
