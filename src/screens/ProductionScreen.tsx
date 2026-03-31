import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDatabase } from '../hooks/useDatabase';

interface DetalleIngrediente {
  ingredienteId: number;
  nombre: string;
  cantidad: number;
  unidad: string;
  coste: number;
  tramosAplicados: Array<{
    desde: number;
    hasta: number | string;
    precio: number;
    cantidad: number;
    subtotal: number;
  }>;
}

export default function ProductionScreen() {
  const {
    isReady,
    obtenerRecetas,
    calcularProduccionMaxima,
    calcularCosteTotalProduccion,  // ← Nueva función
  } = useDatabase();

  const [recetas, setRecetas] = useState<any[]>([]);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<number>(1);
  const [cantidad, setCantidad] = useState('');
  const [produccionMaxima, setProduccionMaxima] = useState<{
    maxUnidades: number;
    ingredienteLimitante: number | null;
  } | null>(null);
  const [costeTotal, setCosteTotal] = useState<number | null>(null);
  const [costePorUnidad, setCostePorUnidad] = useState<number | null>(null);
  const [detalleCostos, setDetalleCostos] = useState<DetalleIngrediente[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  useEffect(() => {
    if (isReady) {
      cargarRecetas();
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && recetaSeleccionada) {
      cargarProduccionMaxima();
    }
  }, [isReady, recetaSeleccionada]);

  const cargarRecetas = async () => {
    const data = await obtenerRecetas();
    setRecetas(data);
    if (data.length > 0) {
      setRecetaSeleccionada(data[0].id);
    }
  };

  const cargarProduccionMaxima = async () => {
    const resultado = await calcularProduccionMaxima(recetaSeleccionada);
    setProduccionMaxima(resultado);
  };

  const handleCalcularCoste = async () => {
    if (!cantidad || parseFloat(cantidad) <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }

    const cantidadNum = parseFloat(cantidad);

    if (produccionMaxima && cantidadNum > produccionMaxima.maxUnidades) {
      Alert.alert(
        'Advertencia',
        `No tienes suficiente inventario. Máximo posible: ${produccionMaxima.maxUnidades} unidades`
      );
      return;
    }

    setLoading(true);
    setMostrarDetalle(false);

    try {
      // ✅ Usar la función real que calcula con integral por tramos
      const resultado = await calcularCosteTotalProduccion(recetaSeleccionada, cantidadNum);
      
      setCosteTotal(resultado.costeTotal);
      setCostePorUnidad(resultado.costeTotal / cantidadNum);
      setMostrarDetalle(true);
      
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'No se pudo calcular el coste');
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👨‍🍳 Planificar Producción</Text>

      {/* Selector de receta */}
      <View style={styles.card}>
        <Text style={styles.label}>Receta:</Text>
        <View style={styles.recetasContainer}>
          {recetas.map((receta) => (
            <TouchableOpacity
              key={receta.id}
              style={[
                styles.recetaButton,
                recetaSeleccionada === receta.id && styles.recetaButtonActive,
              ]}
              onPress={() => setRecetaSeleccionada(receta.id)}
            >
              <Text
                style={[
                  styles.recetaButtonText,
                  recetaSeleccionada === receta.id && styles.recetaButtonTextActive,
                ]}
              >
                {receta.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Información de producción máxima */}
      {produccionMaxima && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📊 Capacidad actual</Text>
          <Text style={styles.infoValue}>
            Máximo: {produccionMaxima.maxUnidades} unidades
          </Text>
          {produccionMaxima.ingredienteLimitante && (
            <Text style={styles.infoWarning}>
              ⚠️ Limitado por stock de ingrediente ID {produccionMaxima.ingredienteLimitante}
            </Text>
          )}
        </View>
      )}

      {/* Input de cantidad */}
      <View style={styles.card}>
        <Text style={styles.label}>Cantidad a producir:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 10"
          keyboardType="numeric"
          value={cantidad}
          onChangeText={setCantidad}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleCalcularCoste}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Calculando...' : '💰 Calcular Coste Total'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resultados */}
      {costeTotal !== null && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>💰 Resultado del Cálculo</Text>
          <Text style={styles.resultText}>
            Coste Total: ${costeTotal.toFixed(2)}
          </Text>
          <Text style={styles.resultText}>
            Coste por unidad: ${costePorUnidad?.toFixed(2)}
          </Text>
          
          {/* Botón para mostrar/ocultar detalle */}
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setMostrarDetalle(!mostrarDetalle)}
          >
            <Text style={styles.detailButtonText}>
              {mostrarDetalle ? '📋 Ocultar detalle' : '📋 Ver detalle del cálculo'}
            </Text>
          </TouchableOpacity>
          
          {/* Detalle de costos por ingrediente */}
          {mostrarDetalle && (
            <View style={styles.detalleContainer}>
              <Text style={styles.detalleTitle}>Desglose por ingrediente:</Text>
              {detalleCostos.map((item, idx) => (
                <View key={idx} style={styles.detalleItem}>
                  <Text style={styles.detalleIngrediente}>
                    {item.nombre} ({item.cantidad.toFixed(2)} {item.unidad})
                  </Text>
                  <Text style={styles.detalleCoste}>
                    ${item.coste.toFixed(2)}
                  </Text>
                  
                  {/* Mostrar los tramos aplicados */}
                  {item.tramosAplicados.length > 0 && (
                    <View style={styles.tramosDetalle}>
                      <Text style={styles.tramosDetalleTitle}>  └─ Desglose por tramos:</Text>
                      {item.tramosAplicados.map((tramo, tIdx) => (
                        <Text key={tIdx} style={styles.tramoDetalleText}>
                             • {tramo.cantidad.toFixed(2)} {item.unidad} a ${tramo.precio}/{item.unidad} = ${tramo.subtotal.toFixed(2)}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
              <View style={styles.detalleTotal}>
                <Text style={styles.detalleTotalText}>TOTAL</Text>
                <Text style={styles.detalleTotalText}>${costeTotal.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>
      )}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  recetasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recetaButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  recetaButtonActive: {
    backgroundColor: '#2196f3',
  },
  recetaButtonText: {
    fontSize: 14,
    color: '#333',
  },
  recetaButtonTextActive: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  infoWarning: {
    marginTop: 8,
    fontSize: 12,
    color: '#ff9800',
  },
  resultCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2e7d32',
  },
  resultText: {
    fontSize: 16,
    marginBottom: 8,
  },
  detailButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#4caf50',
    borderRadius: 8,
  },
  detailButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  detalleContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#c8e6c9',
  },
  detalleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  detalleItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  detalleIngrediente: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  detalleCoste: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
    marginTop: 2,
  },
  tramosDetalle: {
    marginTop: 4,
    marginLeft: 8,
  },
  tramosDetalleTitle: {
    fontSize: 11,
    color: '#888',
  },
  tramoDetalleText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
  },
  detalleTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#4caf50',
  },
  detalleTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
});