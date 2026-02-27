-- Migración 006: Agregar campos pelaje y peso_inicial a la tabla animales
-- Establecimiento ko'ẽju

ALTER TABLE animales 
ADD COLUMN pelaje VARCHAR(50) AFTER categoria_id,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER pelaje;

-- Nota: peso_inicial se usará para comparar con el peso_actual y calcular la ganancia total del ciclo.
