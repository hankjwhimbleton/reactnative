import { executeQuery } from './db';

export const initDatabase = async () => {
  console.log('Inicializando base de datos...');

  // Tabla: ingredientes
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS ingredientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      unidad_medida TEXT NOT NULL DEFAULT 'kg',
      categoria TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabla: costos_por_tramos
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS costos_por_tramos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingrediente_id INTEGER NOT NULL,
      desde_cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      proveedor TEXT,
      fecha_vigencia DATE DEFAULT CURRENT_DATE,
      FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
    );
  `);

  // Tabla: inventario
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingrediente_id INTEGER NOT NULL,
      cantidad_actual REAL NOT NULL DEFAULT 0,
      ubicacion TEXT,
      fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
    );
  `);

  // Tabla: recetas
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS recetas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      producto_final TEXT NOT NULL,
      tipo TEXT DEFAULT 'estandar',
      rendimiento_unidades INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

 await executeQuery(`
  CREATE TABLE IF NOT EXISTS receta_ingredientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receta_id INTEGER NOT NULL,
    ingrediente_id INTEGER NOT NULL,
    cantidad_necesaria REAL NOT NULL,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE,
    UNIQUE(receta_id, ingrediente_id)
  );
`);

  // Tabla: produccion
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS produccion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receta_id INTEGER NOT NULL,
      cantidad_producida REAL NOT NULL,
      fecha_produccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      coste_total REAL,
      notas TEXT,
      FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
    );
  `);

  // Tabla: movimientos_inventario
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS movimientos_inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingrediente_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      cantidad REAL NOT NULL,
      costo_unitario REAL,
      referencia_id INTEGER,
      fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
    );
  `);

  // Crear índices para mejorar rendimiento
  await executeQuery(`CREATE INDEX IF NOT EXISTS idx_costos_ingrediente ON costos_por_tramos(ingrediente_id);`);
  await executeQuery(`CREATE INDEX IF NOT EXISTS idx_inventario_ingrediente ON inventario(ingrediente_id);`);
  await executeQuery(`CREATE INDEX IF NOT EXISTS idx_receta_ingredientes ON receta_ingredientes(receta_id, ingrediente_id);`);
  await executeQuery(`CREATE INDEX IF NOT EXISTS idx_movimientos_ingrediente ON movimientos_inventario(ingrediente_id);`);
  await executeQuery(`CREATE INDEX IF NOT EXISTS idx_produccion_fecha ON produccion(fecha_produccion);`);

  console.log('Base de datos inicializada correctamente');
};