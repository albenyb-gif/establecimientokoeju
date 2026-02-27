-- Migración 007: Actualización de nombres de categorías
-- Establecimiento ko'ẽju

-- Actualizar nombres existentes a formatos más amigables
UPDATE categorias SET descripcion = 'TERNERO MACHO' WHERE descripcion = 'TERNERO';
UPDATE categorias SET descripcion = 'DESMAMANTE MACHO' WHERE descripcion = 'DESMAMANTE_M';
UPDATE categorias SET descripcion = 'DESMAMANTE HEMBRA' WHERE descripcion = 'DESMAMANTE_H';
UPDATE categorias SET descripcion = 'VAQUILLA' WHERE descripcion = 'VAQUILLONA';

-- Insertar nuevas si no existen
INSERT IGNORE INTO categorias (descripcion) VALUES ('TERNERA HEMBRA');

-- Limpiar/Estandarizar el resto
UPDATE categorias SET descripcion = 'NOVILLO 1 a 2' WHERE descripcion = 'NOVILLO_1_2';
UPDATE categorias SET descripcion = 'NOVILLO 2 a 3' WHERE descripcion = 'NOVILLO_2_3';
UPDATE categorias SET descripcion = 'NOVILLO 3+' WHERE descripcion = 'NOVILLO_3_MAS';
