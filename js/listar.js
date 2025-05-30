// Sistema de listado de pedidos diferenciado por rol
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!window.authManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const currentUser = window.authManager.getCurrentUser();
    initializePage(currentUser);
});

function initializePage(currentUser) {
    // Actualizar título y encabezado según el rol
    updatePageHeader(currentUser);
    
    // Cargar y mostrar pedidos según el rol
    if (currentUser.role === 'admin') {
        loadAdminOrdersList();
    } else {
        loadUserOrdersList(currentUser);
    }
}

function updatePageHeader(currentUser) {
    const pageTitle = document.querySelector('h1');
    const pageDescription = document.querySelector('.lead');
    
    if (currentUser.role === 'admin') {
        if (pageTitle) pageTitle.textContent = 'Gestión de Pedidos - Administrador';
        if (pageDescription) pageDescription.textContent = 'Visualiza y gestiona todos los pedidos del sistema';
    } else {
        if (pageTitle) pageTitle.textContent = 'Mis Pedidos';
        if (pageDescription) pageDescription.textContent = 'Aquí puedes ver el estado de todos tus pedidos';
    }
}

function loadUserOrdersList(currentUser) {
    try {
        const userOrders = getUserOrders(currentUser.id);
        const container = getOrdersContainer();
        
        if (userOrders.length === 0) {
            showEmptyState(container, 'usuario');
            return;
        }

        displayOrders(container, userOrders, 'user');
        updateUserStats(userOrders);
        
    } catch (error) {
        console.error('Error al cargar pedidos del usuario:', error);
        showErrorState();
    }
}

function loadAdminOrdersList() {
    try {
        const allOrders = getAllOrders();
        const container = getOrdersContainer();
        
        if (allOrders.length === 0) {
            showEmptyState(container, 'admin');
            return;
        }

        displayOrders(container, allOrders, 'admin');
        updateAdminStats(allOrders);
        
    } catch (error) {
        console.error('Error al cargar todos los pedidos:', error);
        showErrorState();
    }
}

function getUserOrders(userId) {
    const allOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
    return allOrders.filter(order => order.userId === userId);
}

function getAllOrders() {
    return JSON.parse(localStorage.getItem('lavape_orders') || '[]');
}

function getOrdersContainer() {
    // Buscar diferentes posibles contenedores
    return document.querySelector('#ordersContainer') || 
            document.querySelector('#orders-list') || 
            document.querySelector('.orders-container') ||
            document.querySelector('main .container') ||
            document.querySelector('main');
}

function showEmptyState(container, userType) {
    const message = userType === 'admin' 
        ? 'No hay pedidos registrados en el sistema aún.'
        : 'No tienes pedidos registrados aún.';
    
    const actionButton = userType === 'admin' 
        ? '' 
        : '<a href="registro.html" class="btn btn-primary mt-3">Crear mi primer pedido</a>';
    
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="mb-4">
                <i class="fas fa-inbox fa-4x text-muted"></i>
            </div>
            <h3 class="text-muted">Sin pedidos</h3>
            <p class="text-muted">${message}</p>
            ${actionButton}
        </div>
    `;
}

function showErrorState() {
    const container = getOrdersContainer();
    container.innerHTML = `
        <div class="alert alert-danger text-center">
            <h4>Error al cargar pedidos</h4>
            <p>Hubo un problema al cargar los pedidos. Por favor, recarga la página.</p>
            <button class="btn btn-outline-danger" onclick="window.location.reload()">
                Recargar página
            </button>
        </div>
    `;
}

function displayOrders(container, orders, viewType) {
    // Ordenar pedidos por fecha de creación (más recientes primero)
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const ordersHtml = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            ${viewType === 'admin' ? 'Todos los Pedidos' : 'Mis Pedidos'} 
                            (${orders.length})
                        </h5>
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-primary active" onclick="filterOrders('all')">
                                Todos
                            </button>
                            <button type="button" class="btn btn-outline-warning" onclick="filterOrders('Pendiente')">
                                Pendientes
                            </button>
                            <button type="button" class="btn btn-outline-success" onclick="filterOrders('Entregado')">
                                Entregados
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        ${viewType === 'admin' ? '<th>Cliente</th>' : ''}
                                        <th>Prenda</th>
                                        <th>Cantidad</th>
                                        <th>Fecha Entrega</th>
                                        <th>Estado</th>
                                        <th>Creado</th>
                                        ${viewType === 'admin' ? '<th>Acciones</th>' : ''}
                                    </tr>
                                </thead>
                                <tbody id="ordersTableBody">
                                    ${generateOrderRows(sortedOrders, viewType)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = ordersHtml;
}

function generateOrderRows(orders, viewType) {
    return orders.map(order => {
        const statusBadge = getStatusBadge(order);
        const isDelayed = isOrderDelayed(order);
        const rowClass = isDelayed ? 'table-warning' : '';
        
        return `
            <tr class="${rowClass}" data-order-id="${order.id}" data-status="${order.status}">
                ${viewType === 'admin' ? `<td><strong>${order.customerName}</strong><br><small class="text-muted">${order.userEmail}</small></td>` : ''}
                <td>${order.garmentType}</td>
                <td>${order.quantity} prendas</td>
                <td>
                    ${formatDate(order.deliveryDate)}
                    ${isDelayed ? '<br><small class="text-danger"><i class="fas fa-exclamation-triangle"></i> Retrasado</small>' : ''}
                </td>
                <td>${statusBadge}</td>
                <td>
                    ${formatDate(order.createdAt)}
                    <br><small class="text-muted">${formatTime(order.createdAt)}</small>
                </td>
                ${viewType === 'admin' ? `
                    <td>
                        <div class="btn-group btn-group-sm">
                            <select class="form-select form-select-sm" onchange="updateOrderStatus('${order.id}', this.value)">
                                <option value="Pendiente" ${order.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="Entregado" ${order.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
                            </select>
                            <button class="btn btn-outline-primary btn-sm ms-1" onclick="editOrder('${order.id}')" 
                                    title="Editar pedido">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm ms-1" onclick="deleteOrder('${order.id}')" 
                                    title="Eliminar pedido">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                ` : `
                    <td>
                        <span class="badge bg-secondary">Solo visualización</span>
                    </td>
                `}
            </tr>
        `;
    }).join('');
}

function getStatusBadge(order) {
    const status = order.status || 'Pendiente';
    let badgeClass = '';
    
    switch (status) {
        case 'Pendiente':
            badgeClass = 'bg-warning text-dark';
            break;
        case 'En proceso':
            badgeClass = 'bg-info';
            break;
        case 'Listo':
            badgeClass = 'bg-primary';
            break;
        case 'Entregado':
            badgeClass = 'bg-success';
            break;
        default:
            badgeClass = 'bg-secondary';
    }
    
    return `<span class="badge ${badgeClass}">${status}</span>`;
}

function isOrderDelayed(order) {
    if (order.status === 'Entregado') return false;
    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deliveryDate < today;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateUserStats(orders) {
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'Pendiente').length,
        inProcess: orders.filter(o => o.status === 'En proceso').length,
        completed: orders.filter(o => o.status === 'Entregado').length,
        delayed: orders.filter(o => isOrderDelayed(o)).length
    };
    
    // Actualizar elementos de estadísticas si existen
    updateStatElement('userTotalOrders', stats.total);
    updateStatElement('userPendingOrders', stats.pending);
    updateStatElement('userCompletedOrders', stats.completed);
    updateStatElement('userDelayedOrders', stats.delayed);
}

function updateAdminStats(orders) {
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'Pendiente').length,
        inProcess: orders.filter(o => o.status === 'En proceso').length,
        completed: orders.filter(o => o.status === 'Entregado').length,
        delayed: orders.filter(o => isOrderDelayed(o)).length
    };
    
    // Actualizar elementos de estadísticas si existen
    updateStatElement('adminTotalOrders', stats.total);
    updateStatElement('adminPendingOrders', stats.pending);
    updateStatElement('adminCompletedOrders', stats.completed);
    updateStatElement('adminDelayedOrders', stats.delayed);
}

function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// FUNCIONES GLOBALES PARA USO EN HTML

window.updateOrderStatus = function(orderId, newStatus) {
    const currentUser = window.authManager.getCurrentUser();
    if (currentUser.role !== 'admin') {
        alert('No tienes permisos para cambiar el estado de pedidos');
        return;
    }
    
    try {
        const allOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
        const orderIndex = allOrders.findIndex(order => order.id === orderId);
        
        if (orderIndex !== -1) {
            allOrders[orderIndex].status = newStatus;
            allOrders[orderIndex].updatedAt = new Date().toISOString();
            
            localStorage.setItem('lavape_orders', JSON.stringify(allOrders));
            
            // Actualizar la fila en la tabla
            const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
            if (row) {
                row.setAttribute('data-status', newStatus);
                const statusCell = row.querySelector('td:nth-last-child(2)');
                if (statusCell) {
                    statusCell.innerHTML = getStatusBadge({ status: newStatus });
                }
            }
            
            // Actualizar estadísticas
            updateAdminStats(allOrders);
            
            console.log(`Estado del pedido ${orderId} actualizado a: ${newStatus}`);
        }
        
    } catch (error) {
        console.error('Error al actualizar estado del pedido:', error);
        alert('Error al actualizar el estado del pedido');
    }
};

// FUNCIÓN PARA EDITAR PEDIDO (SOLO ADMIN)
window.editOrder = function(orderId) {
    const currentUser = window.authManager.getCurrentUser();
    if (currentUser.role !== 'admin') {
        alert('No tienes permisos para editar pedidos');
        return;
    }
    
    // Verificar que el pedido existe
    const allOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
    const order = allOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Pedido no encontrado');
        return;
    }
    
    // Redirigir a la página de edición con el ID del pedido
    window.location.href = `editar.html?id=${orderId}`;
};

// FUNCIÓN PARA ELIMINAR PEDIDO (SOLO ADMIN)
window.deleteOrder = function(orderId) {
    const currentUser = window.authManager.getCurrentUser();
    if (currentUser.role !== 'admin') {
        alert('No tienes permisos para eliminar pedidos');
        return;
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const allOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
        const filteredOrders = allOrders.filter(order => order.id !== orderId);
        
        localStorage.setItem('lavape_orders', JSON.stringify(filteredOrders));
        
        // Remover la fila de la tabla
        const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
        if (row) {
            row.remove();
        }
        
        // Actualizar estadísticas
        updateAdminStats(filteredOrders);
        
        // Si no quedan pedidos, mostrar estado vacío
        if (filteredOrders.length === 0) {
            const container = getOrdersContainer();
            showEmptyState(container, 'admin');
        }
        
        alert('Pedido eliminado exitosamente');
        
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        alert('Error al eliminar el pedido');
    }
};

window.filterOrders = function(status) {
    const rows = document.querySelectorAll('#ordersTableBody tr');
    const buttons = document.querySelectorAll('.btn-group .btn');
    
    // Actualizar botones activos
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filtrar filas
    rows.forEach(row => {
        const orderStatus = row.getAttribute('data-status');
        if (status === 'all' || orderStatus === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};