import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useDatabase } from '../hooks/useDatabase';

interface Ingrediente {
  id: number;
  nombre: string;
  unidad_medida: string;
}

interface RecetaIngrediente {
  ingrediente_id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_necesaria: number;
}

interface Receta {
  id: number;
  nombre: string;
  producto_final: string;
  tipo: string;
  ingredientes?: RecetaIngrediente[];
}

export default function RecipesScreen() {
  const {
    isReady,
    obtenerRecetas,
    obtenerRecetaCompleta,
    obtenerIngredientes,
    crearReceta,
    agregarIngredienteAReceta,
    eliminarReceta,
  } = useDatabase();

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [detalleVisible, setDetalleVisible] = useState(false);
  
  // Estado para nueva receta
  const [nuevaReceta, setNuevaReceta] = useState({
    nombre: '',
    producto_final: '',
    tipo: 'estandar',
  });
  
  // Estado para agregar ingrediente a receta
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<Ingrediente[]>([]);
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<number | null>(null);
  const [cantidadIngrediente, setCantidadIngrediente] = useState('');

  const cargarRecetas = useCallback(async () => {
    const data = await obtenerRecetas();
    setRecetas(data);
  }, [obtenerRecetas]);

  const cargarIngredientesDisponibles = async () => {
    const data = await obtenerIngredientes();
    setIngredientesDisponibles(data);
  };

  useEffect(() => {
    if (isReady) {
      cargarRecetas();
      cargarIngredientesDisponibles();
    }
  }, [isReady, cargarRecetas]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarRecetas();
    setRefreshing(false);
  };

  const verDetalleReceta = async (receta: Receta) => {
    const completa = await obtenerRecetaCompleta(receta.id);
    if (completa) {
      setSelectedReceta(completa);
      setDetalleVisible(true);
    }
  };

  const handleCrearReceta = async () => {
    if (!nuevaReceta.nombre.trim()) {
      Alert.alert('Error', 'El nombre de la receta es requerido');
      return;
    }
    
    const id = await crearReceta(
      nuevaReceta.nombre,
      nuevaReceta.producto_final || nuevaReceta.nombre,
      nuevaReceta.tipo
    );
    
    if (id) {
      Alert.alert('Éxito', 'Receta creada correctamente');
      setNuevaReceta({ nombre: '', producto_final: '', tipo: 'estandar' });
      setModalVisible(false);
      cargarRecetas();
    } else {
      Alert.alert('Error', 'No se pudo crear la receta');
    }
  };

  const handleAgregarIngrediente = async () => {
    if (!selectedReceta || !selectedIngredienteId || !cantidadIngrediente) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    
    const cantidad = parseFloat(cantidadIngrediente);
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Error', 'Cantidad válida requerida');
      return;
    }
    
    const exito = await agregarIngredienteAReceta(
      selectedReceta.id,
      selectedIngredienteId,
      cantidad
    );
    
    if (exito) {
      Alert.alert('Éxito', 'Ingrediente agregado a la receta');
      setSelectedIngredienteId(null);
      setCantidadIngrediente('');
      // Recargar detalle
      const actualizada = await obtenerRecetaCompleta(selectedReceta.id);
      if (actualizada) setSelectedReceta(actualizada);
    } else {
      Alert.alert('Error', 'No se pudo agregar el ingrediente');
    }
  };

  const handleEliminarReceta = async (recetaId: number) => {
    Alert.alert(
      'Eliminar receta',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const exito = await eliminarReceta(recetaId);
            if (exito) {
              setDetalleVisible(false);
              cargarRecetas();
              Alert.alert('Éxito', 'Receta eliminada');
            } else {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const renderReceta = ({ item }: { item: Receta }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => verDetalleReceta(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.recetaNombre}>{item.nombre}</Text>
        <View style={[styles.tipoBadge, item.tipo === 'premium' && styles.premiumBadge]}>
          <Text style={styles.tipoText}>{item.tipo}</Text>
        </View>
      </View>
      <Text style={styles.recetaProducto}>🍽️ {item.producto_final}</Text>
    </TouchableOpacity>
  );

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Text>Cargando recetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📖 Recetas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de recetas */}
      <FlatList
        data={recetas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReceta}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay recetas</Text>
            <Text style={styles.emptySubtext}>Toca "+ Nueva" para crear</Text>
          </View>
        }
        contentContainerStyle={recetas.length === 0 ? styles.emptyList : styles.list}
      />

      {/* Modal para nueva receta */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📝 Nueva Receta</Text>
            
            <Text style={styles.modalLabel}>Nombre de la receta:</Text>
            <TextInput
              style={styles.modalInput}
              value={nuevaReceta.nombre}
              onChangeText={(text) => setNuevaReceta({ ...nuevaReceta, nombre: text })}
              placeholder="Ej: Lasaña Clásica"
            />
            
            <Text style={styles.modalLabel}>Producto final:</Text>
            <TextInput
              style={styles.modalInput}
              value={nuevaReceta.producto_final}
              onChangeText={(text) => setNuevaReceta({ ...nuevaReceta, producto_final: text })}
              placeholder="Ej: Lasaña (opcional)"
            />
            
            <Text style={styles.modalLabel}>Tipo:</Text>
            <View style={styles.tipoContainer}>
              {['estandar', 'economica', 'premium'].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.tipoButton,
                    nuevaReceta.tipo === tipo && styles.tipoButtonActive,
                  ]}
                  onPress={() => setNuevaReceta({ ...nuevaReceta, tipo })}
                >
                  <Text style={[
                    styles.tipoButtonText,
                    nuevaReceta.tipo === tipo && styles.tipoButtonTextActive,
                  ]}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCrearReceta}
              >
                <Text style={styles.saveButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de detalle de receta */}
      <Modal
        visible={detalleVisible && selectedReceta !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetalleVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detalleContent]}>
            <Text style={styles.modalTitle}>
              {selectedReceta?.nombre}
            </Text>
            
            <View style={styles.detalleHeader}>
              <Text style={styles.detalleProducto}>
                🍽️ {selectedReceta?.producto_final}
              </Text>
              <View style={[styles.tipoBadge, selectedReceta?.tipo === 'premium' && styles.premiumBadge]}>
                <Text style={styles.tipoText}>{selectedReceta?.tipo}</Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>Ingredientes:</Text>
            
            {selectedReceta?.ingredientes && selectedReceta.ingredientes.length > 0 ? (
              selectedReceta.ingredientes.map((ing, idx) => (
                <View key={idx} style={styles.ingredienteRow}>
                  <Text style={styles.ingredienteNombre}>{ing.nombre}</Text>
                  <Text style={styles.ingredienteCantidad}>
                    {ing.cantidad_necesaria} {ing.unidad_medida}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noIngredientes}>Sin ingredientes aún</Text>
            )}
            
            <Text style={styles.sectionTitle}>Agregar ingrediente:</Text>
            
            <View style={styles.agregarContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ingredientesScroll}>
                {ingredientesDisponibles.map((ing) => (
                  <TouchableOpacity
                    key={ing.id}
                    style={[
                      styles.ingredienteSelect,
                      selectedIngredienteId === ing.id && styles.ingredienteSelectActive,
                    ]}
                    onPress={() => setSelectedIngredienteId(ing.id)}
                  >
                    <Text style={[
                      styles.ingredienteSelectText,
                      selectedIngredienteId === ing.id && styles.ingredienteSelectTextActive,
                    ]}>
                      {ing.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.cantidadRow}>
                <TextInput
                  style={styles.cantidadInput}
                  placeholder="Cantidad"
                  keyboardType="numeric"
                  value={cantidadIngrediente}
                  onChangeText={setCantidadIngrediente}
                />
                <TouchableOpacity
                  style={styles.agregarButton}
                  onPress={handleAgregarIngrediente}
                >
                  <Text style={styles.agregarButtonText}>+ Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => selectedReceta && handleEliminarReceta(selectedReceta.id)}
              >
                <Text style={styles.deleteButtonText}>Eliminar receta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setDetalleVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  list: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recetaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recetaProducto: {
    fontSize: 14,
    color: '#666',
  },
  tipoBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: '#ffd700',
  },
  tipoText: {
    fontSize: 10,
    color: '#666',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  detalleContent: {
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#2196f3',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  closeButton: {
    backgroundColor: '#4caf50',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  tipoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tipoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  tipoButtonActive: {
    backgroundColor: '#2196f3',
  },
  tipoButtonText: {
    color: '#666',
    textTransform: 'capitalize',
  },
  tipoButtonTextActive: {
    color: 'white',
  },
  detalleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detalleProducto: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  ingredienteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ingredienteNombre: {
    fontSize: 14,
    color: '#555',
  },
  ingredienteCantidad: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  noIngredientes: {
    textAlign: 'center',
    color: '#999',
    padding: 12,
  },
  agregarContainer: {
    marginTop: 8,
  },
  ingredientesScroll: {
    flexDirection: 'row',
    maxHeight: 50,
    marginBottom: 12,
  },
  ingredienteSelect: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  ingredienteSelectActive: {
    backgroundColor: '#2196f3',
  },
  ingredienteSelectText: {
    color: '#666',
  },
  ingredienteSelectTextActive: {
    color: 'white',
  },
  cantidadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cantidadInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  agregarButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  agregarButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});