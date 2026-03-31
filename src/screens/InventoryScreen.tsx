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

interface Tramo {
  id: number;
  desde_cantidad: number;
  precio_unitario: number;
}

interface Ingrediente {
  id: number;
  nombre: string;
  unidad_medida: string;
  categoria: string;
  stock: number;
  ubicacion: string | null;
}

export default function InventoryScreen() {
  const {
    isReady,
    obtenerIngredientes,
    actualizarStock,
    agregarIngrediente,
    calcularCosteIngrediente,
    obtenerTramosCostos,
    agregarTramoCoste,
    eliminarTramoCoste,
    eliminarIngrediente,
    calcularValorTotalInventario
  } = useDatabase();

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Modal de stock
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedIngrediente, setSelectedIngrediente] = useState<Ingrediente | null>(null);
  const [nuevoStock, setNuevoStock] = useState('');
  
  // Modal de tramos
  const [tramosModalVisible, setTramosModalVisible] = useState(false);
  const [tramos, setTramos] = useState<Tramo[]>([]);
  const [editandoTramo, setEditandoTramo] = useState<Tramo | null>(null);
  const [desdeCantidad, setDesdeCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  
  // Modal para nuevo ingrediente
  const [nuevoIngredienteModal, setNuevoIngredienteModal] = useState(false);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({
    nombre: '',
    unidad: 'kg',
    categoria: 'Otros',
  });

  const cargarIngredientes = useCallback(async () => {
    const data = await obtenerIngredientes();
    setIngredientes(data);
  }, [obtenerIngredientes]);

    const cargarValorTotalInventario = useCallback(async () => {
    setLoading(true);
    try {
      const resultado = await calcularValorTotalInventario();
      setValorTotalInventario(resultado);
    } catch (error) {
      console.error('Error al cargar valor total:', error);
    } finally {
      setLoading(false);
    }
  }, [calcularValorTotalInventario]);

  useEffect(() => {
    if (isReady) {
      const cargarDatosIniciales = async () => {
        setLoading(true);
        await cargarIngredientes();
        await cargarValorTotalInventario();
        setLoading(false);
      };
      cargarDatosIniciales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]); // ← Solo depende de isReady

  // ========== FUNCIÓN DE REFRESH ==========
  const onRefresh = async () => {
    setRefreshing(true);
    await cargarIngredientes();
    await cargarValorTotalInventario();
    setRefreshing(false);
  };
  const actualizarValorTotal = useCallback(async () => {
    const resultado = await calcularValorTotalInventario();
    setValorTotalInventario(resultado);
  }, [calcularValorTotalInventario]);
  // ========== STOCK ==========
  const handleAjustarStock = (ingrediente: Ingrediente) => {
    setSelectedIngrediente(ingrediente);
    setNuevoStock(ingrediente.stock.toString());
    setStockModalVisible(true);
  };

 const guardarStock = async () => {
    if (!selectedIngrediente) return;
    
    const cantidad = parseFloat(nuevoStock);
    if (isNaN(cantidad) || cantidad < 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }
    
    const exito = await actualizarStock(selectedIngrediente.id, cantidad, 'Ajuste manual');
    if (exito) {
      Alert.alert('Éxito', 'Stock actualizado');
      setStockModalVisible(false);
      await cargarIngredientes();
      await actualizarValorTotal();  // ← Actualizar valor total después del cambio
    } else {
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  // ========== TRAMOS DE COSTOS ==========
  const handleGestionarTramos = async (ingrediente: Ingrediente) => {
    setSelectedIngrediente(ingrediente);
    const tramosData = await obtenerTramosCostos(ingrediente.id);
    setTramos(tramosData);
    setTramosModalVisible(true);
  };

  const handleAgregarTramo = () => {
    setEditandoTramo(null);
    setDesdeCantidad('');
    setPrecio('');
  };

  const handleEditarTramo = (tramo: Tramo) => {
    setEditandoTramo(tramo);
    setDesdeCantidad(tramo.desde_cantidad.toString());
    setPrecio(tramo.precio_unitario.toString());
  };

  const guardarTramo = async () => {
    if (!selectedIngrediente) return;

    const desde = parseFloat(desdeCantidad);
    const precioNum = parseFloat(precio);

    if (isNaN(desde) || desde < 0) {
      Alert.alert('Error', 'Cantidad inicial válida requerida');
      return;
    }
    if (isNaN(precioNum) || precioNum <= 0) {
      Alert.alert('Error', 'Precio debe ser mayor a 0');
      return;
    }

    const exito = await agregarTramoCoste(selectedIngrediente.id, desde, precioNum);
    if (exito) {
      Alert.alert('Éxito', editandoTramo ? 'Tramo actualizado' : 'Tramo agregado');
      const tramosActualizados = await obtenerTramosCostos(selectedIngrediente.id);
      setTramos(tramosActualizados);
      setEditandoTramo(null);
      setDesdeCantidad('');
      setPrecio('');
      await actualizarValorTotal();
    } else {
      Alert.alert('Error', 'No se pudo guardar el tramo');
    }
  };

  const eliminarTramo = (tramo: Tramo) => {
    Alert.alert(
      'Eliminar tramo',
      `¿Eliminar tramo desde ${tramo.desde_cantidad} ${selectedIngrediente?.unidad_medida}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const exito = await eliminarTramoCoste(tramo.id);
            if (exito) {
              const tramosActualizados = await obtenerTramosCostos(selectedIngrediente!.id);
              setTramos(tramosActualizados);
              await actualizarValorTotal();
              Alert.alert('Éxito', 'Tramo eliminado');
            }
          },
        },
      ]
    );
  };
 const [valorTotalInventario, setValorTotalInventario] = useState<{
    valorTotal: number;
    detalle: Array<{
      id: number;
      nombre: string;
      stock: number;
      unidad: string;
      valor: number;
    }>;
  } | null>(null);
  const [mostrarDetalleValor, setMostrarDetalleValor] = useState(false);

  // ========== NUEVO INGREDIENTE ==========
  const handleAgregarIngrediente = async () => {
    if (!nuevoIngrediente.nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    
    const id = await agregarIngrediente(
      nuevoIngrediente.nombre,
      nuevoIngrediente.unidad,
      nuevoIngrediente.categoria
    );
    
    if (id) {
      Alert.alert('Éxito', 'Ingrediente agregado');
      setNuevoIngrediente({ nombre: '', unidad: 'kg', categoria: 'Otros' });
      setNuevoIngredienteModal(false);
      await cargarIngredientes();
      await actualizarValorTotal();  // ← Actualizar valor total después de agregar
    }
  };

  const handleEliminarIngrediente = (ingrediente: Ingrediente) => {
    Alert.alert(
      'Eliminar ingrediente',
      `¿Estás seguro de que quieres eliminar "${ingrediente.nombre}"?\n\nEsta acción también eliminará:\n• Su stock actual\n• Sus tramos de precios\n• Todos sus movimientos\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const exito = await eliminarIngrediente(ingrediente.id);
            if (exito) {
              Alert.alert('Éxito', 'Ingrediente eliminado');
              await cargarIngredientes();
              await actualizarValorTotal();  // ← Actualizar valor total después de eliminar
            } else {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };
// Estado para el modal de coste
const [costeModalVisible, setCosteModalVisible] = useState(false);
const [costeStockInfo, setCosteStockInfo] = useState<{
  nombre: string;
  stock: number;
  unidad: string;
  coste: number;
} | null>(null);
const [calculandoCoste, setCalculandoCoste] = useState(false);

// Función para calcular y mostrar el valor del stock
const handleVerValorStock = async (ingrediente: Ingrediente) => {
  if (ingrediente.stock === 0) {
    Alert.alert('Valor del stock', `${ingrediente.nombre}: Sin stock, valor $0.00`);
    return;
  }
  
  setCalculandoCoste(true);
  try {
    // Usar tu función existente
    const coste = await calcularCosteIngrediente(ingrediente.id, ingrediente.stock);
    
    setCosteStockInfo({
      nombre: ingrediente.nombre,
      stock: ingrediente.stock,
      unidad: ingrediente.unidad_medida,
      coste: coste,
    });
    setCosteModalVisible(true);
  } catch (error) {
    Alert.alert('Error', 'No se pudo calcular el valor del stock');
  } finally {
    setCalculandoCoste(false);
  }
};

  // ========== RENDER ==========
  const getStockColor = (stock: number) => {
    if (stock === 0) return '#ff4444';
    if (stock < 2) return '#ff9800';
    return '#4caf50';
  };

const renderIngrediente = ({ item }: { item: Ingrediente }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.ingredienteNombre}>{item.nombre}</Text>
      <View style={styles.cardHeaderActions}>
        <Text style={styles.ingredienteCategoria}>{item.categoria}</Text>
        <TouchableOpacity 
          onPress={() => handleEliminarIngrediente(item)}
          style={styles.deleteIconButton}
        >
          <Text style={styles.deleteIconText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
    
    <View style={styles.cardBody}>
    
      <View style={styles.stockContainer}>
        <Text style={styles.stockLabel}>Stock:</Text>
        <Text style={[styles.stockValue, { color: getStockColor(item.stock) }]}>
          {item.stock} {item.unidad_medida}
        </Text>
      </View>
    </View>
    
<View style={styles.cardFooter}>
  <TouchableOpacity
    style={[styles.actionButton, styles.stockButton]}
    onPress={() => handleAjustarStock(item)}
  >
    <Text style={styles.actionButtonText}>📦 Ajustar</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.actionButton, styles.tramosButton]}
    onPress={() => handleGestionarTramos(item)}
  >
    <Text style={styles.actionButtonText}>💰 Tramos</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.actionButton, styles.valorButton]}
    onPress={() => handleVerValorStock(item)}
    disabled={calculandoCoste}
  >
    <Text style={styles.actionButtonText}>
      {calculandoCoste ? '⏳' : '💵 Valor'}
    </Text>
  </TouchableOpacity>
</View>
  </View>
);

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Text>Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📦 Inventario</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setNuevoIngredienteModal(true)}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de ingredientes */}
      <FlatList
        data={ingredientes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderIngrediente}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay ingredientes</Text>
            <Text style={styles.emptySubtext}>Toca "+ Nuevo" para agregar</Text>
          </View>
        }
        contentContainerStyle={ingredientes.length === 0 ? styles.emptyList : styles.list}
      />
          {valorTotalInventario && (
        <TouchableOpacity 
          style={styles.valorTotalCard}
          onPress={() => setMostrarDetalleValor(!mostrarDetalleValor)}
          activeOpacity={0.8}
        >
          <View style={styles.valorTotalHeader}>
            <Text style={styles.valorTotalTitle}>💰 Valor Total del Inventario</Text>
            <Text style={styles.valorTotalIcon}>
              {mostrarDetalleValor ? '▲' : '▼'}
            </Text>
          </View>
          
          <Text style={styles.valorTotalAmount}>
            ${valorTotalInventario.valorTotal.toFixed(2)}
          </Text>
          
          <Text style={styles.valorTotalSubtext}>
            Basado en precios por tramos (descuentos por volumen)
          </Text>
          
          {/* Detalle desplegable */}
          {mostrarDetalleValor && (
            <View style={styles.valorDetalleContainer}>
              <Text style={styles.valorDetalleTitle}>Desglose por ingrediente:</Text>
              {valorTotalInventario.detalle
                .filter(item => item.valor > 0)
                .map((item, idx) => (
                  <View key={idx} style={styles.valorDetalleRow}>
                    <Text style={styles.valorDetalleNombre}>
                      {item.nombre}
                    </Text>
                    <Text style={styles.valorDetalleCantidad}>
                      {item.stock} {item.unidad}
                    </Text>
                    <Text style={styles.valorDetalleValor}>
                      ${item.valor.toFixed(2)}
                    </Text>
                  </View>
                ))}
              
              {valorTotalInventario.detalle.filter(i => i.valor === 0).length > 0 && (
                <Text style={styles.valorSinStock}>
                  ⚠️ {valorTotalInventario.detalle.filter(i => i.valor === 0).length} ingrediente(s) sin stock o sin precio definido
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}
      {/* ========== MODAL AJUSTAR STOCK ========== */}
      <Modal visible={stockModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Ajustar stock: {selectedIngrediente?.nombre}
            </Text>
            <Text style={styles.modalLabel}>Cantidad ({selectedIngrediente?.unidad_medida}):</Text>
            <TextInput
              style={styles.modalInput}
              value={nuevoStock}
              onChangeText={setNuevoStock}
              keyboardType="numeric"
              placeholder="0"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setStockModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={guardarStock}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== MODAL TRAMOS DE COSTOS ========== */}
      <Modal visible={tramosModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.tramosModalContent]}>
            <Text style={styles.modalTitle}>
              💰 Tramos de precio: {selectedIngrediente?.nombre}
            </Text>
            <Text style={styles.modalSubtitle}>
              Define descuentos por volumen (integral por tramos)
            </Text>

            {/* Lista de tramos existentes */}
            <Text style={styles.sectionTitle}>Tramos actuales:</Text>
            {tramos.length === 0 ? (
              <Text style={styles.noDataText}>Sin tramos definidos. Agrega uno debajo.</Text>
            ) : (
              tramos.map((tramo, idx) => {
                const hasta = idx + 1 < tramos.length 
                  ? `${tramos[idx + 1].desde_cantidad} ${selectedIngrediente?.unidad_medida}` 
                  : '∞';
                return (
                  <View key={tramo.id} style={styles.tramoRow}>
                    <View style={styles.tramoInfo}>
                      <Text style={styles.tramoText}>
                        Desde {tramo.desde_cantidad} → Hasta {hasta}
                      </Text>
                      <Text style={styles.tramoPrice}>
                        💲 {tramo.precio_unitario} /{selectedIngrediente?.unidad_medida}
                      </Text>
                    </View>
                    <View style={styles.tramoActions}>
                      <TouchableOpacity onPress={() => handleEditarTramo(tramo)}>
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => eliminarTramo(tramo)}>
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Formulario para agregar/editar tramo */}
            <Text style={styles.sectionTitle}>
              {editandoTramo ? 'Editar tramo' : 'Agregar nuevo tramo:'}
            </Text>
            <View style={styles.tramoForm}>
              <TextInput
                style={styles.tramoInput}
                placeholder={`Desde (${selectedIngrediente?.unidad_medida})`}
                value={desdeCantidad}
                onChangeText={setDesdeCantidad}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.tramoInput}
                placeholder={`Precio por ${selectedIngrediente?.unidad_medida}`}
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.addTramoButton} onPress={guardarTramo}>
                <Text style={styles.addTramoButtonText}>
                  {editandoTramo ? 'Actualizar' : 'Agregar'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.infoText}>
              💡 Ejemplo: Desde 0 → $2.00, Desde 10 → $1.50, Desde 50 → $1.20
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setTramosModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
{/* Modal para mostrar el valor del stock */}
<Modal visible={costeModalVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, styles.valorModalContent]}>
      <Text style={styles.modalTitle}>💰 Valor del Stock</Text>
      
      {costeStockInfo && (
        <>
          <View style={styles.valorHeader}>
            <Text style={styles.valorIngrediente}>{costeStockInfo.nombre}</Text>
            <Text style={styles.valorCantidad}>
              {costeStockInfo.stock} {costeStockInfo.unidad}
            </Text>
          </View>
          
          <View style={styles.valorTotalContainer}>
            <Text style={styles.valorTotalLabel}>Valor total:</Text>
            <Text style={styles.valorTotalValue}>
              ${costeStockInfo.coste.toFixed(2)}
            </Text>
          </View>
          
          <Text style={styles.valorNota}>
            💡 Este valor se calcula usando la integral por tramos, 
            aplicando los descuentos por volumen definidos en los tramos de precio.
          </Text>
          
          <TouchableOpacity
            style={[styles.modalButton, styles.closeButton]}
            onPress={() => setCosteModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
</Modal>
      {/* ========== MODAL NUEVO INGREDIENTE ========== */}
      <Modal visible={nuevoIngredienteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Nuevo Ingrediente</Text>
            
            <Text style={styles.modalLabel}>Nombre:</Text>
            <TextInput
              style={styles.modalInput}
              value={nuevoIngrediente.nombre}
              onChangeText={(text) => setNuevoIngrediente({ ...nuevoIngrediente, nombre: text })}
              placeholder="Ej: Harina"
            />
            
            <Text style={styles.modalLabel}>Unidad:</Text>
            <View style={styles.unidadContainer}>
              {['kg', 'g', 'L', 'unidad'].map((unidad) => (
                <TouchableOpacity
                  key={unidad}
                  style={[styles.unidadButton, nuevoIngrediente.unidad === unidad && styles.unidadButtonActive]}
                  onPress={() => setNuevoIngrediente({ ...nuevoIngrediente, unidad })}
                >
                  <Text style={[styles.unidadButtonText, nuevoIngrediente.unidad === unidad && styles.unidadButtonTextActive]}>
                    {unidad}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.modalLabel}>Categoría:</Text>
            <TextInput
              style={styles.modalInput}
              value={nuevoIngrediente.categoria}
              onChangeText={(text) => setNuevoIngrediente({ ...nuevoIngrediente, categoria: text })}
              placeholder="Ej: Harinas, Lácteos..."
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setNuevoIngredienteModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAgregarIngrediente}>
                <Text style={styles.saveButtonText}>Agregar</Text>
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
    marginBottom: 12,
  },
  ingredienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ingredienteCategoria: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cardBody: {
    marginBottom: 12,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  stockValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  stockButton: {
    backgroundColor: '#e3f2fd',
  },
  tramosButton: {
    backgroundColor: '#e8f5e9',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
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
    width: '85%',
    maxWidth: 400,
  },
  tramosModalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  unidadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  unidadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  unidadButtonActive: {
    backgroundColor: '#2196f3',
  },
  unidadButtonText: {
    color: '#666',
  },
  unidadButtonTextActive: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    padding: 12,
    fontSize: 12,
  },
  tramoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tramoInfo: {
    flex: 1,
  },
  tramoText: {
    fontSize: 13,
    color: '#555',
  },
  tramoPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3',
    marginTop: 2,
  },
  tramoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editIcon: {
    fontSize: 18,
    color: '#ff9800',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#ff4444',
  },
  tramoForm: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tramoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    backgroundColor: '#fafafa',
  },
  addTramoButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTramoButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 11,
    color: '#888',
    marginTop: 12,
    fontStyle: 'italic',
  },
  cardHeaderActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
deleteIconButton: {
  padding: 4,
},
deleteIconText: {
  fontSize: 18,
  color: '#ff4444',
},
// Agregar al objeto styles
valorButton: {
  backgroundColor: '#fff3e0',
},
valorModalContent: {
  width: '85%',
  maxWidth: 400,
},
valorHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f5f5f5',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
},
valorIngrediente: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
},
valorCantidad: {
  fontSize: 16,
  color: '#666',
},
valorTotalContainer: {
  backgroundColor: '#e8f5e9',
  padding: 16,
  borderRadius: 8,
  marginBottom: 16,
  alignItems: 'center',
},
valorTotalLabel: {
  fontSize: 14,
  color: '#2e7d32',
  marginBottom: 4,
},
valorTotalValue: {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#2e7d32',
},
valorNota: {
  fontSize: 11,
  color: '#888',
  fontStyle: 'italic',
  textAlign: 'center',
  marginBottom: 16,
  lineHeight: 16,
},
  valorTotalCard: {
    backgroundColor: '#2e7d32',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  valorTotalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valorTotalTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  valorTotalIcon: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  valorTotalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  valorTotalSubtext: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  valorDetalleContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  valorDetalleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  valorDetalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  valorDetalleNombre: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    flex: 2,
  },
  valorDetalleCantidad: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
    textAlign: 'center',
  },
  valorDetalleValor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'right',
  },
  valorSinStock: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    fontStyle: 'italic',
  },
});