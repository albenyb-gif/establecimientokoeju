-- Migración 008: Agregar columna precio_compra a la tabla animales
-- Establecimiento ko'ẽju

ALTER TABLE animales ADD COLUMN precio_compra DECIMAL(15,2) DEFAULT 0 AFTER peso_actual;
