// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.authManager.getCurrentUser();
    if (!currentUser) return;

    // Update user info in welcome section
    document.getElementById('userName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Administrador' : 'Usuario';

    // Show appropriate dashboard
    if (currentUser.role === 'admin') {
        document.getElementById('adminDashboard').classList.remove('d-none');
        loadAdminDashboard();
    } else {
        document.getElementById('userDashboard').classList.remove('d-none');
        loadUserDashboard();
    }
});

function loadUserDashboard() {
    const currentUser = window.authManager.getCurrentUser();
    const orders = getOrdersForUser(currentUser.id);
    
    // Update statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'Pendiente').length;
    const completedOrders = orders.filter(order => order.status === 'Entregado').length;
    const delayedOrders = orders.filter(order => isOrderDelayed(order)).length;

    document.getElementById('userTotalOrders').textContent = totalOrders;
    document.getElementById('userPendingOrders').textContent = pendingOrders;
    document.getElementById('userCompletedOrders').textContent = completedOrders;
    document.getElementById('userDelayedOrders').textContent = delayedOrders;

    // Load recent orders
    loadUserRecentOrders(orders);
}

function loadAdminDashboard() {
    const allOrders = getAllOrders();
    const allUsers = window.authManager.getAllUsers();
    
    // Update statistics
    const totalOrders = allOrders.length;
    const totalUsers = allUsers.filter(user => user.role === 'usuario').length;
    const pendingOrders = allOrders.filter(order => order.status === 'Pendiente').length;
    const delayedOrders = allOrders.filter(order => isOrderDelayed(order)).length;

    document.getElementById('adminTotalOrders').textContent = totalOrders;
    document.getElementById('adminTotalUsers').textContent = totalUsers;
    document.getElementById('adminPendingOrders').textContent = pendingOrders;
    document.getElementById('adminDelayedOrders').textContent = delayedOrders;

    // Load recent data
    loadAdminRecentOrders(allOrders);
    loadAdminRecentUsers(allUsers);
}

function loadUserRecentOrders(orders) {
    const recentOrdersContainer = document.getElementById('userRecentOrders');
    
    if (orders.length === 0) {
        recentOrdersContainer.innerHTML = '<p class="text-muted">No tienes pedidos registrados aún.</p>';
        return;
    }

    // Get last 3 orders
    const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

    const ordersHtml = recentOrders.map(order => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <strong>${order.garmentType}</strong> - ${order.quantity} prendas
                <br>
                <small class="text-muted">Entrega: ${formatDate(order.deliveryDate)}</small>
            </div>
            <span class="badge ${getStatusBadgeClass(order)}">${getOrderStatus(order)}</span>
        </div>
    `).join('');

    recentOrdersContainer.innerHTML = ordersHtml;
}

function loadAdminRecentOrders(orders) {
    const recentOrdersContainer = document.getElementById('adminRecentOrders');
    
    if (orders.length === 0) {
        recentOrdersContainer.innerHTML = '<p class="text-muted">No hay pedidos registrados aún.</p>';
        return;
    }

    // Get last 5 orders
    const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const ordersHtml = recentOrders.map(order => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <strong>${order.customerName}</strong>
                <br>
                <small class="text-muted">${order.garmentType} - ${order.quantity} prendas</small>
            </div>
            <span class="badge ${getStatusBadgeClass(order)}">${getOrderStatus(order)}</span>
        </div>
    `).join('');

    recentOrdersContainer.innerHTML = ordersHtml;
}

function loadAdminRecentUsers(users) {
    const recentUsersContainer = document.getElementById('adminRecentUsers');
    
    // Filter out admin users and get last 5 regular users
    const regularUsers = users
        .filter(user => user.role === 'usuario')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (regularUsers.length === 0) {
        recentUsersContainer.innerHTML = '<p class="text-muted">No hay usuarios registrados aún.</p>';
        return;
    }

    const usersHtml = regularUsers.map(user => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <strong>${user.firstName} ${user.lastName}</strong>
                <br>
                <small class="text-muted">${user.email}</small>
            </div>
            <small class="text-muted">${formatDate(user.createdAt)}</small>
        </div>
    `).join('');

    recentUsersContainer.innerHTML = usersHtml;
}

// Helper functions
function getOrdersForUser(userId) {
    const orders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
    return orders.filter(order => order.userId === userId);
}

function getAllOrders() {
    return JSON.parse(localStorage.getItem('lavape_orders') || '[]');
}

function isOrderDelayed(order) {
    if (order.status === 'Entregado') return false;
    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deliveryDate < today;
}

function getOrderStatus(order) {
    if (order.status === 'Entregado') return 'Entregado';
    if (isOrderDelayed(order)) return 'Retrasado';
    return 'Pendiente';
}

function getStatusBadgeClass(order) {
    const status = getOrderStatus(order);
    switch (status) {
        case 'Entregado': return 'bg-success';
        case 'Retrasado': return 'bg-danger';
        default: return 'bg-warning text-dark';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}