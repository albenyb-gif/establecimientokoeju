-- Tabla de Pariciones Ovinas
CREATE TABLE IF NOT EXISTS pariciones_ovinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    madre_id INT DEFAULT NULL,
    cantidad_crias INT NOT NULL DEFAULT 1,
    sexo_crias ENUM('MACHO', 'HEMBRA', 'MIXTO') DEFAULT 'MIXTO',
    raza VARCHAR(50) DEFAULT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (madre_id) REFERENCES animales(id) ON DELETE SET NULL
);
