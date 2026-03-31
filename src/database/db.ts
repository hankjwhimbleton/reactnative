import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('costos_comida.db');

// Función para ejecutar consultas con Promise
export const executeQuery = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    // Para consultas que devuelven resultados (SELECT)
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const result = await db.getAllAsync(sql, params);
      return { rows: { _array: result } };
    } 
    // Para consultas de modificación (INSERT, UPDATE, DELETE)
    else {
      const result = await db.runAsync(sql, params);
      return { 
        insertId: result.lastInsertRowId,
        rowsAffected: result.changes 
      };
    }
  } catch (error) {
    console.error('Error en executeQuery:', error);
    throw error;
  }
};

// Función para transacciones (múltiples operaciones)
export const transaction = async (callback: () => Promise<void>): Promise<void> => {
  try {
    await db.execAsync('BEGIN TRANSACTION;');
    await callback();
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
};

// Obtener la instancia de la base de datos
export const getDB = () => db;

export default db;