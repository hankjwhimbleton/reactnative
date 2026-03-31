import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import ProductionScreen from './src/screens/ProductionScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import RecipesScreen from './src/screens/RecipesScreen';

export type RootStackParamList = {
  Home: undefined;
  Inventory: undefined;
  Production: undefined;
  Recipes: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#2196f3' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Inicio', headerShown: false }}
        />
        <Stack.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{ title: '📦 Inventario' }}
        />
        <Stack.Screen
          name="Production"
          component={ProductionScreen}
          options={{ title: '👨‍🍳 Producción' }}
        />
        <Stack.Screen
          name="Recipes"
          component={RecipesScreen}
          options={{ title: '📖 Recetas' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
