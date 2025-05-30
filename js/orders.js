export class OrdersManager {
    constructor() {
        this.orders = this.loadOrders();
        console.log('OrdersManager inicializado con', this.orders.length, 'pedidos'); // Debug
    }

    loadOrders() {
        try {
            const orders = localStorage.getItem('orders') || localStorage.getItem('lavape_orders');
            const parsedOrders = orders ? JSON.parse(orders) : [];
            
            // Verificar la estructura de los datos
            console.log('Pedidos cargados desde localStorage:', parsedOrders);
            
            // Asegurar que cada pedido tenga las propiedades necesarias
            return parsedOrders.map(order => ({
                id: order.id || Date.now().toString(),
                estado: order.estado || 'pendiente',
                fechaCreacion: order.fechaCreacion || order.fecha || new Date().toISOString(),
                fechaEntrega: order.fechaEntrega || order.fecha,
                tipoPrenda: order.tipoPrenda || order.tipo || 'No especificado',
                cantidad: parseInt(order.cantidad) || 1,
                userId: order.userId || null, // Para filtrar por usuario
                ...order // Mantener todas las propiedades originales
            }));
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            return [];
        }
    }

    saveOrders() {
        try {
            localStorage.setItem('orders', JSON.stringify(this.orders));
            // También guardar con clave alternativa por compatibilidad
            localStorage.setItem('lavape_orders', JSON.stringify(this.orders));
            console.log('Pedidos guardados:', this.orders.length);
        } catch (error) {
            console.error('Error guardando pedidos:', error);
        }
    }

    addOrder(order) {
        try {
            // Obtener usuario actual para asociar el pedido
            const currentUser = window.authManager?.getCurrentUser();
            
            const newOrder = {
                id: Date.now().toString(),
                estado: 'pendiente',
                fechaCreacion: new Date().toISOString(),
                userId: currentUser?.id || null,
                ...order
            };
            
            this.orders.push(newOrder);
            this.saveOrders();
            console.log('Pedido agregado:', newOrder);
            return newOrder;
        } catch (error) {
            console.error('Error agregando pedido:', error);
            return null;
        }
    }

    getOrders(userId = null) {
        try {
            let filteredOrders = [...this.orders];
            
            // Si se especifica userId, filtrar por ese usuario
            if (userId) {
                filteredOrders = this.orders.filter(order => order.userId === userId);
            }
            
            console.log(`Obteniendo pedidos (userId: ${userId}):`, filteredOrders.length);
            return filteredOrders;
        } catch (error) {
            console.error('Error obteniendo pedidos:', error);
            return [];
        }
    }

    getOrdersByUser(userId) {
        return this.getOrders(userId);
    }

    getUserOrders() {
        const currentUser = window.authManager?.getCurrentUser();
        if (!currentUser) return [];
        
        if (currentUser.role === 'admin') {
            return this.getOrders(); // Admin ve todos los pedidos
        } else {
            return this.getOrders(currentUser.id); // Usuario ve solo sus pedidos
        }
    }

    getOrderById(id) {
        return this.orders.find(order => order.id === id);
    }

    updateOrder(id, updatedOrder) {
        try {
            const index = this.orders.findIndex(order => order.id === id);
            if (index !== -1) {
                this.orders[index] = { 
                    ...this.orders[index], 
                    ...updatedOrder,
                    fechaModificacion: new Date().toISOString()
                };
                this.saveOrders();
                console.log('Pedido actualizado:', this.orders[index]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error actualizando pedido:', error);
            return false;
        }
    }

    deleteOrder(id) {
        try {
            const index = this.orders.findIndex(order => order.id === id);
            if (index !== -1) {
                const deletedOrder = this.orders.splice(index, 1)[0];
                this.saveOrders();
                console.log('Pedido eliminado:', deletedOrder);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error eliminando pedido:', error);
            return false;
        }
    }

    updateOrderStatus(id, status) {
        return this.updateOrder(id, { estado: status });
    }

    getStatistics(userId = null) {
        try {
            // Obtener pedidos según el rol del usuario
            const currentUser = window.authManager?.getCurrentUser();
            let ordersToAnalyze = this.orders;
            
            if (currentUser) {
                if (currentUser.role !== 'admin') {
                    // Usuario normal: solo sus pedidos
                    ordersToAnalyze = this.orders.filter(order => order.userId === currentUser.id);
                }
                // Admin: todos los pedidos (no filtrar)
            }
            
            console.log('Analizando estadísticas de', ordersToAnalyze.length, 'pedidos');
            
            const total = ordersToAnalyze.length;
            const entregados = ordersToAnalyze.filter(order => 
                order.estado === 'entregado' || order.estado === 'completado'
            ).length;
            
            const totalPrendas = ordersToAnalyze.reduce((sum, order) => {
                const cantidad = parseInt(order.cantidad) || 1;
                return sum + cantidad;
            }, 0);
            
            // Contar tipos de prendas
            const prendaCount = {};
            ordersToAnalyze.forEach(order => {
                const tipo = order.tipoPrenda || order.tipo || 'No especificado';
                prendaCount[tipo] = (prendaCount[tipo] || 0) + (parseInt(order.cantidad) || 1);
            });
            
            const prendaMasFrecuente = Object.entries(prendaCount)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

            const stats = {
                total,
                entregados,
                totalPrendas,
                prendaMasFrecuente,
                prendaCount,
                ordersToAnalyze: ordersToAnalyze.length
            };
            
            console.log('Estadísticas calculadas:', stats);
            return stats;
            
        } catch (error) {
            console.error('Error calculando estadísticas:', error);
            return {
                total: 0,
                entregados: 0,
                totalPrendas: 0,
                prendaMasFrecuente: 'N/A'
            };
        }
    }

    // Método para debugging - obtener todos los datos
    debugInfo() {
        console.log('=== DEBUG INFO ORDERS MANAGER ===');
        console.log('Total pedidos:', this.orders.length);
        console.log('Pedidos:', this.orders);
        console.log('LocalStorage orders:', localStorage.getItem('orders'));
        console.log('LocalStorage lavape_orders:', localStorage.getItem('lavape_orders'));
        
        const currentUser = window.authManager?.getCurrentUser();
        console.log('Usuario actual:', currentUser);
        
        if (currentUser) {
            const userOrders = this.getOrdersByUser(currentUser.id);
            console.log('Pedidos del usuario actual:', userOrders);
        }
        console.log('=== FIN DEBUG INFO ===');
    }

    // Método para crear datos de prueba si no hay pedidos
    createSampleData() {
        if (this.orders.length === 0) {
            const currentUser = window.authManager?.getCurrentUser();
            const sampleOrders = [
                {
                    tipoPrenda: 'Camisa',
                    cantidad: 2,
                    estado: 'pendiente',
                    fechaCreacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    fechaEntrega: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    cliente: 'Cliente de Prueba',
                    telefono: '123456789'
                },
                {
                    tipoPrenda: 'Pantalón',
                    cantidad: 1,
                    estado: 'entregado',
                    fechaCreacion: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                    fechaEntrega: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    cliente: 'Cliente de Prueba 2',
                    telefono: '987654321'
                },
                {
                    tipoPrenda: 'Camisa',
                    cantidad: 3,
                    estado: 'en proceso',
                    fechaCreacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    fechaEntrega: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                    cliente: 'Cliente de Prueba 3',
                    telefono: '555666777'
                }
            ];

            sampleOrders.forEach(order => {
                this.addOrder(order);
            });

            console.log('Datos de prueba creados:', this.orders.length, 'pedidos');
        }
    }
}

// Crear instancia global
export const ordersManager = new OrdersManager();

// También hacer disponible globalmente para compatibilidad
window.ordersManager = ordersManager;

// Debug info en consola
console.log('OrdersManager cargado:', ordersManager);