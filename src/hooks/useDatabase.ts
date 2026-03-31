import { useState, useEffect } from 'react';
import { executeQuery } from '../database/db';
import { initDatabase } from '../database/init';

export const useDatabase = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        //await seedData();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al inicializar DB');
        console.error(err);
      }
    };
    setup();
  }, []);

  // Calcular coste total de un ingrediente usando integral por tramos
  const calcularCosteIngrediente = async (
    ingredienteId: number,
    cantidad: number
  ): Promise<number> => {
    try {
      const result = await executeQuery(
        'SELECT desde_cantidad, precio_unitario FROM costos_por_tramos WHERE ingrediente_id = ? ORDER BY desde_cantidad',
        [ingredienteId]
      );

      const tramos = result.rows?._array || [];
      let costeTotal = 0;
      let cantidadRestante = cantidad;

      for (let i = 0; i < tramos.length; i++) {
        if (cantidadRestante <= 0) break;

        const desde = tramos[i].desde_cantidad;
        const hasta = i + 1 < tramos.length ? tramos[i + 1].desde_cantidad : Infinity;
        const precio = tramos[i].precio_unitario;

        if (cantidad > desde) {
          const cantidadEnTramo = Math.min(cantidadRestante, hasta - desde);
          costeTotal += cantidadEnTramo * precio;
          cantidadRestante -= cantidadEnTramo;
        }
      }

      return costeTotal;
    } catch (err) {
      console.error('Error al calcular coste:', err);
      return 0;
    }
  };



// ========== FUNCIÓN PARA CALCULAR VALOR TOTAL DEL INVENTARIO ==========

const calcularValorTotalInventario = async (): Promise<{
  valorTotal: number;
  detalle: Array<{
    id: number;
    nombre: string;
    stock: number;
    unidad: string;
    valor: number;
  }>;
}> => {
  try {
    // Obtener todos los ingredientes con su stock actual
    const ingredientesResult = await executeQuery(`
      SELECT i.id, i.nombre, i.unidad_medida, COALESCE(inv.cantidad_actual, 0) as stock
      FROM ingredientes i
      LEFT JOIN inventario inv ON i.id = inv.ingrediente_id
      ORDER BY i.nombre
    `);
    
    const ingredientes = ingredientesResult.rows?._array || [];
    let valorTotal = 0;
    const detalle = [];
    
    // Calcular el valor de cada ingrediente usando la función existente
    for (const ing of ingredientes) {
      if (ing.stock > 0) {
        const valor = await calcularCosteIngrediente(ing.id, ing.stock);
        valorTotal += valor;
        detalle.push({
          id: ing.id,
          nombre: ing.nombre,
          stock: ing.stock,
          unidad: ing.unidad_medida,
          valor: valor,
        });
      } else {
        detalle.push({
          id: ing.id,
          nombre: ing.nombre,
          stock: 0,
          unidad: ing.unidad_medida,
          valor: 0,
        });
      }
    }
    
    return { valorTotal, detalle };
  } catch (err) {
    console.error('Error al calcular valor total del inventario:', err);
    return { valorTotal: 0, detalle: [] };
  }
};

  // Calcular producción máxima con inventario actual
  const calcularProduccionMaxima = async (recetaId: number): Promise<{
    maxUnidades: number;
    ingredienteLimitante: number | null;
  }> => {
    try {
      const result = await executeQuery(
        `SELECT ri.ingrediente_id, ri.cantidad_necesaria, COALESCE(i.cantidad_actual, 0) as stock_actual
         FROM receta_ingredientes ri
         LEFT JOIN inventario i ON ri.ingrediente_id = i.ingrediente_id
         WHERE ri.receta_id = ?`,
        [recetaId]
      );

      const ingredientes = result.rows?._array || [];
      let maxUnidades = Infinity;
      let limitante = null;

      ingredientes.forEach((ing: any) => {
        if (ing.cantidad_necesaria > 0) {
          const unidadesPosibles = Math.floor(ing.stock_actual / ing.cantidad_necesaria);
          if (unidadesPosibles < maxUnidades) {
            maxUnidades = unidadesPosibles;
            limitante = ing.ingrediente_id;
          }
        }
      });

      return {
        maxUnidades: maxUnidades === Infinity ? 0 : maxUnidades,
        ingredienteLimitante: limitante
      };
    } catch (err) {
      console.error('Error al calcular producción máxima:', err);
      return { maxUnidades: 0, ingredienteLimitante: null };
    }
  };

  // Obtener inventario actual
  const obtenerInventario = async () => {
    try {
      const result = await executeQuery(`
        SELECT i.id, i.nombre, i.unidad_medida, inv.cantidad_actual, inv.ubicacion
        FROM ingredientes i
        LEFT JOIN inventario inv ON i.id = inv.ingrediente_id
        ORDER BY i.categoria, i.nombre
      `);
      return result.rows?._array || [];
    } catch (err) {
      console.error('Error al obtener inventario:', err);
      return [];
    }
  };

  // Obtener recetas
  const obtenerRecetas = async () => {
    try {
      const result = await executeQuery('SELECT * FROM recetas');
      return result.rows?._array || [];
    } catch (err) {
      console.error('Error al obtener recetas:', err);
      return [];
    }
  };

  // Obtener ingredientes de una receta
  const obtenerIngredientesReceta = async (recetaId: number) => {
    try {
      const result = await executeQuery(`
        SELECT ri.*, i.nombre, i.unidad_medida
        FROM receta_ingredientes ri
        JOIN ingredientes i ON ri.ingrediente_id = i.id
        WHERE ri.receta_id = ?
      `, [recetaId]);
      return result.rows?._array || [];
    } catch (err) {
      console.error('Error al obtener ingredientes de receta:', err);
      return [];
    }
  };

  // Obtener tramos de costos de un ingrediente
  const obtenerTramosCostos = async (ingredienteId: number) => {
    try {
      const result = await executeQuery(
        'SELECT * FROM costos_por_tramos WHERE ingrediente_id = ? ORDER BY desde_cantidad',
        [ingredienteId]
      );
      return result.rows?._array || [];
    } catch (err) {
      console.error('Error al obtener tramos de costos:', err);
      return [];
    }
  };

  // ========== NUEVAS FUNCIONES PARA INVENTARIO ==========

// Obtener todos los ingredientes con su inventario
const obtenerIngredientes = async () => {
  try {
    const result = await executeQuery(`
      SELECT i.*, COALESCE(inv.cantidad_actual, 0) as stock, inv.ubicacion
      FROM ingredientes i
      LEFT JOIN inventario inv ON i.id = inv.ingrediente_id
      ORDER BY i.categoria, i.nombre
    `);
    return result.rows?._array || [];
  } catch (err) {
    console.error('Error al obtener ingredientes:', err);
    return [];
  }
};


// Actualizar stock de un ingrediente
const actualizarStock = async (ingredienteId: number, nuevaCantidad: number, motivo: string) => {
  try {
    // Verificar si ya existe registro en inventario
    const existente = await executeQuery(
      'SELECT id FROM inventario WHERE ingrediente_id = ?',
      [ingredienteId]
    );
    
    if (existente.rows?._array?.length > 0) {
      // Actualizar existente
      await executeQuery(
        `UPDATE inventario 
         SET cantidad_actual = ?, fecha_ultima_actualizacion = CURRENT_TIMESTAMP 
         WHERE ingrediente_id = ?`,
        [nuevaCantidad, ingredienteId]
      );
    } else {
      // Crear nuevo registro
      await executeQuery(
        `INSERT INTO inventario (ingrediente_id, cantidad_actual) VALUES (?, ?)`,
        [ingredienteId, nuevaCantidad]
      );
    }
    
    // Registrar movimiento (sin usar 'nota', usando 'tipo' y 'referencia_id')
    await executeQuery(
      `INSERT INTO movimientos_inventario (ingrediente_id, tipo, cantidad, referencia_id) 
       VALUES (?, 'ajuste', ?, ?)`,
      [ingredienteId, nuevaCantidad, Date.now()]  // Usamos timestamp como referencia
    );
    
    return true;
  } catch (err) {
    console.error('Error al actualizar stock:', err);
    return false;
  }
};

// Agregar nuevo ingrediente
const agregarIngrediente = async (nombre: string, unidad: string, categoria: string) => {
  try {
    const result = await executeQuery(
      `INSERT INTO ingredientes (nombre, unidad_medida, categoria) VALUES (?, ?, ?)`,
      [nombre, unidad, categoria]
    );
    return result.insertId;
  } catch (err) {
    console.error('Error al agregar ingrediente:', err);
    return null;
  }
};

// ========== FUNCIÓN PARA ELIMINAR INGREDIENTE ==========

const eliminarIngrediente = async (ingredienteId: number): Promise<boolean> => {
  try {
    // Verificar si está siendo usado en alguna receta
    const enRecetas = await executeQuery(
      'SELECT COUNT(*) as count FROM receta_ingredientes WHERE ingrediente_id = ?',
      [ingredienteId]
    );
    
    const count = enRecetas.rows?._array?.[0]?.count || 0;
    if (count > 0) {
      console.error(`No se puede eliminar: está siendo usado en ${count} receta(s)`);
      return false;
    }
    
    // Si no está en recetas, proceder con la eliminación
    await executeQuery('DELETE FROM ingredientes WHERE id = ?', [ingredienteId]);
    return true;
  } catch (err) {
    console.error('Error al eliminar ingrediente:', err);
    return false;
  }
};

// ========== NUEVAS FUNCIONES PARA RECETAS ==========

// Obtener receta con sus ingredientes
const obtenerRecetaCompleta = async (recetaId: number) => {
  try {
    const recetaResult = await executeQuery(
      'SELECT * FROM recetas WHERE id = ?',
      [recetaId]
    );
    const receta = recetaResult.rows?._array?.[0];
    
    if (!receta) return null;
    
    const ingredientesResult = await executeQuery(`
      SELECT ri.*, i.nombre, i.unidad_medida 
      FROM receta_ingredientes ri
      JOIN ingredientes i ON ri.ingrediente_id = i.id
      WHERE ri.receta_id = ?
    `, [recetaId]);
    
    receta.ingredientes = ingredientesResult.rows?._array || [];
    return receta;
  } catch (err) {
    console.error('Error al obtener receta completa:', err);
    return null;
  }
};

// Crear nueva receta
const crearReceta = async (nombre: string, productoFinal: string, tipo: string) => {
  try {
    const result = await executeQuery(
      `INSERT INTO recetas (nombre, producto_final, tipo) VALUES (?, ?, ?)`,
      [nombre, productoFinal, tipo]
    );
    return result.insertId;
  } catch (err) {
    console.error('Error al crear receta:', err);
    return null;
  }
};

// Agregar ingrediente a receta
const agregarIngredienteAReceta = async (recetaId: number, ingredienteId: number, cantidad: number) => {
  try {
    await executeQuery(
      `INSERT INTO receta_ingredientes (receta_id, ingrediente_id, cantidad_necesaria) 
       VALUES (?, ?, ?)
       ON CONFLICT(receta_id, ingrediente_id) 
       DO UPDATE SET cantidad_necesaria = ?`,
      [recetaId, ingredienteId, cantidad, cantidad]
    );
    return true;
  } catch (err) {
    console.error('Error al agregar ingrediente a receta:', err);
    return false;
  }
};

// Eliminar receta
const eliminarReceta = async (recetaId: number): Promise<boolean> => {
  try {
    // Primero verificar si la receta existe
    const existe = await executeQuery(
      'SELECT id FROM recetas WHERE id = ?',
      [recetaId]
    );
    
    if (existe.rows?._array?.length === 0) {
      console.error('Receta no encontrada');
      return false;
    }
    
    // Eliminar los ingredientes asociados a la receta
    await executeQuery(
      'DELETE FROM receta_ingredientes WHERE receta_id = ?',
      [recetaId]
    );
    
    // Eliminar la receta
    await executeQuery(
      'DELETE FROM recetas WHERE id = ?',
      [recetaId]
    );
    
    console.log(`✅ Receta ${recetaId} eliminada correctamente`);
    return true;
  } catch (err) {
    console.error('❌ Error al eliminar receta:', err);
    return false;
  }
};

// ========== FUNCIONES PARA TRAMOS DE COSTOS ==========

// Agregar nuevo tramo de costo
const agregarTramoCoste = async (ingredienteId: number, desdeCantidad: number, precio: number) => {
  try {
    // Verificar si ya existe un tramo con el mismo desde_cantidad
    const existente = await executeQuery(
      'SELECT id FROM costos_por_tramos WHERE ingrediente_id = ? AND desde_cantidad = ?',
      [ingredienteId, desdeCantidad]
    );
    
    if (existente.rows?._array?.length > 0) {
      // Actualizar existente
      await executeQuery(
        'UPDATE costos_por_tramos SET precio_unitario = ? WHERE ingrediente_id = ? AND desde_cantidad = ?',
        [precio, ingredienteId, desdeCantidad]
      );
    } else {
      // Insertar nuevo
      await executeQuery(
        'INSERT INTO costos_por_tramos (ingrediente_id, desde_cantidad, precio_unitario) VALUES (?, ?, ?)',
        [ingredienteId, desdeCantidad, precio]
      );
    }
    return true;
  } catch (err) {
    console.error('Error al agregar tramo:', err);
    return false;
  }
};

// Eliminar tramo de costo
const eliminarTramoCoste = async (tramoId: number) => {
  try {
    await executeQuery('DELETE FROM costos_por_tramos WHERE id = ?', [tramoId]);
    return true;
  } catch (err) {
    console.error('Error al eliminar tramo:', err);
    return false;
  }
};

// ========== ACTUALIZAR EL RETURN ==========
// Asegúrate de agregar estas funciones al return del hook

return {
  isReady,
  error,
  calcularCosteIngrediente,
  calcularProduccionMaxima,
  calcularValorTotalInventario,
  obtenerInventario,
  obtenerRecetas,
  obtenerIngredientesReceta,
  obtenerTramosCostos,
  obtenerIngredientes,
  actualizarStock,
  agregarIngrediente,
  eliminarIngrediente,
  obtenerRecetaCompleta,
  crearReceta,
  agregarIngredienteAReceta,
  eliminarReceta,
  agregarTramoCoste,
  eliminarTramoCoste,
  executeQuery
};

}