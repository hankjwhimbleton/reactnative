import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDatabase } from '../hooks/useDatabase';
import { HomeScreenNavigationProp } from '../types/navigation';

// ✅ Definir el tipo correcto para las props
type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isReady, error } = useDatabase();

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Cargando base de datos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🍝 ProdOptimal</Text>
      <Text style={styles.subtitle}>Control de Costos para tu Negocio</Text>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Inventory')}
        >
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuTitle}>Inventario</Text>
          <Text style={styles.menuDesc}>Gestiona tus ingredientes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Production')}
        >
          <Text style={styles.menuIcon}>👨‍🍳</Text>
          <Text style={styles.menuTitle}>Producción</Text>
          <Text style={styles.menuDesc}>Calcula costos y produce</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Recipes')}
        >
          <Text style={styles.menuIcon}>📖</Text>
          <Text style={styles.menuTitle}>Recetas</Text>
          <Text style={styles.menuDesc}>Administra tus recetas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📐 ¿Cómo funciona?</Text>
        <Text style={styles.infoText}>
          La app calcula costos usando integrales por tramos, considerando descuentos por volumen en tus ingredientes.
        </Text>
        <Text style={styles.infoTextSmall}>
          Ejemplo: Si compras más de 10kg de harina, el precio por kg baja automáticamente.
        </Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 Beneficios</Text>
        <Text style={styles.statsItem}>✓ Costos precisos con descuentos por volumen</Text>
        <Text style={styles.statsItem}>✓ Control de inventario en tiempo real</Text>
        <Text style={styles.statsItem}>✓ Planificación de producción optimizada</Text>
        <Text style={styles.statsItem}>✓ Sin internet, tus datos están seguros</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  menuContainer: {
    gap: 16,
  },
  menuButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  menuDesc: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    padding: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  infoTextSmall: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  statsCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2e7d32',
  },
  statsItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
});