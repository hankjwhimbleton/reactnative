import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Definir los parámetros que recibe cada pantalla
export type RootStackParamList = {
  Home: undefined;  // Home no recibe parámetros
  Inventory: undefined;
  Production: undefined;
  Recipes: undefined;
  CostTramos: { ingredienteId: number };  // Recibe el ID del ingrediente
};

// Tipo para el navigation prop de cada pantalla
export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export type InventoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Inventory'
>;

export type ProductionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Production'
>;

export type RecipesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Recipes'
>;

export type CostTramosScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CostTramos'
>;