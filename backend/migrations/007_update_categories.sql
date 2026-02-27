-- Migración 007 (V3): Reajuste estricto a las 6 categorías (Fix Foreign Keys)
-- Establecimiento ko'ẽju

SET FOREIGN_KEY_CHECKS = 0;

-- Usar DELETE en lugar de TRUNCATE para evitar error #1701 en Hostinger
DELETE FROM categorias;

-- Reiniciar el autoincremental (opcional)
ALTER TABLE categorias AUTO_INCREMENT = 1;

-- Insertar las 6 categorías exactas
INSERT INTO categorias (descripcion) VALUES 
('DESMAMANTE MACHO'),
('DESMAMANTE HEMBRA'),
('TERNERO MACHO'),
('TERNERO HEMBRA'),
('VAQUILLA'),
('TORO');

SET FOREIGN_KEY_CHECKS = 1;
