export interface Ingrediente {
  id: number;
  nombre: string;
  unidad_medida: string;
  categoria: string;
  created_at: string;
}

export interface TramoCoste {
  id: number;
  ingrediente_id: number;
  desde_cantidad: number;
  precio_unitario: number;
  proveedor?: string;
}

export interface Inventario {
  ingrediente_id: number;
  cantidad_actual: number;
  ubicacion?: string;
}

export interface Receta {
  id: number;
  nombre: string;
  producto_final: string;
  tipo: string;
  rendimiento_unidades: number;
}

export interface RecetaIngrediente {
  receta_id: number;
  ingrediente_id: number;
  cantidad_necesaria: number;
}