-- Migración 007 (V2): Reajuste estricto a las 6 categorías solicitadas
-- Establecimiento ko'ẽju

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Eliminar categorías que ya no se usarán (Opcional, pero recomendado para limpiar)
TRUNCATE TABLE categorias;

-- 2. Insertar las 6 categorías exactas
INSERT INTO categorias (descripcion) VALUES 
('DESMAMANTE MACHO'),
('DESMAMANTE HEMBRA'),
('TERNERO MACHO'),
('TERNERO HEMBRA'),
('VAQUILLA'),
('TORO');

SET FOREIGN_KEY_CHECKS = 1;
