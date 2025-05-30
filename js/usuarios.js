// Users management functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is admin
    if (!window.authManager.requireAdmin()) {
        return;
    }

    // Initialize users page
    initializeUsersPage();
});

function initializeUsersPage() {
    loadUsersData();
    setupEventListeners();
    updateStatistics();
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('searchUser').addEventListener('input', filterUsers);
    document.getElementById('searchBtn').addEventListener('click', filterUsers);
    
    // Role filter
    document.getElementById('roleFilter').addEventListener('change', filterUsers);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadUsersData();
        updateStatistics();
    });

    // Enter key for search
    document.getElementById('searchUser').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filterUsers();
        }
    });
}

function loadUsersData() {
    try {
        const users = window.authManager.getAllUsers();
        displayUsers(users);
        updateUsersCount(users.length);
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Error al cargar los usuarios');
    }
}

function displayUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-users fa-2x text-muted mb-3"></i>
                    <p class="text-muted mb-0">No se encontraron usuarios</p>
                </td>
            </tr>
        `;
        return;
    }

    const usersHtml = users.map(user => {
        const orders = getUserOrders(user.id);
        const roleClass = user.role === 'admin' ? 'bg-danger' : 'bg-primary';
        const roleName = user.role === 'admin' ? 'Administrador' : 'Usuario';
        
        return `
            <tr>
                <td class="fw-bold">#${user.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-3">
                            <i class="fas fa-user text-muted"></i>
                        </div>
                        <div>
                            <div class="fw-bold">${user.firstName} ${user.lastName}</div>
                            <small class="text-muted">ID: ${user.id}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${roleClass}">${roleName}</span>
                </td>
                <td>
                    <span class="d-block">${formatDate(user.createdAt)}</span>
                    <small class="text-muted">${getTimeAgo(user.createdAt)}</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-secondary">${orders.length}</span>
                    ${orders.length > 0 ? `<br><small class="text-muted">Último: ${getLastOrderDate(orders)}</small>` : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showUserDetails(${user.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${user.role !== 'admin' ? `
                        <button class="btn btn-sm btn-outline-info ms-1" onclick="viewUserOrders(${user.id})" title="Ver pedidos">
                            <i class="fas fa-list"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = usersHtml;
}

function filterUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase().trim();
    const roleFilter = document.getElementById('roleFilter').value;
    
    const allUsers = window.authManager.getAllUsers();
    
    let filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            user.firstName.toLowerCase().includes(searchTerm) ||
            user.lastName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
            
        const matchesRole = !roleFilter || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });

    displayUsers(filteredUsers);
    updateUsersCount(filteredUsers.length, allUsers.length);
}

function updateStatistics() {
    try {
        const users = window.authManager.getAllUsers();
        const regularUsers = users.filter(user => user.role === 'usuario');
        
        // Total users (excluding admins for regular count)
        document.getElementById('totalUsers').textContent = regularUsers.length;
        
        // Active users (users with at least one order)
        const activeUsers = regularUsers.filter(user => {
            const orders = getUserOrders(user.id);
            return orders.length > 0;
        }).length;
        document.getElementById('activeUsers').textContent = activeUsers;
        
        // New users this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const newUsersThisMonth = regularUsers.filter(user => {
            const userDate = new Date(user.createdAt);
            return userDate >= thisMonth;
        }).length;
        document.getElementById('newUsersThisMonth').textContent = newUsersThisMonth;
        
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

function updateUsersCount(filtered, total = null) {
    const countElement = document.getElementById('totalUsersCount');
    if (total && filtered !== total) {
        countElement.textContent = `${filtered} de ${total}`;
    } else {
        countElement.textContent = filtered;
    }
}

// Show user details in modal
window.showUserDetails = function(userId) {
    try {
        const users = window.authManager.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            showError('Usuario no encontrado');
            return;
        }

        const orders = getUserOrders(userId);
        const pendingOrders = orders.filter(order => order.status !== 'Entregado').length;
        const completedOrders = orders.filter(order => order.status === 'Entregado').length;
        const lastOrder = orders.length > 0 ? 
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;

        // Fill modal with user data
        document.getElementById('modalUserName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('modalUserEmail').textContent = user.email;
        
        const roleElement = document.getElementById('modalUserRole');
        roleElement.textContent = user.role === 'admin' ? 'Administrador' : 'Usuario';
        roleElement.className = `badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`;
        
        document.getElementById('modalUserDate').textContent = formatDate(user.createdAt);
        document.getElementById('modalUserTotalOrders').textContent = orders.length;
        document.getElementById('modalUserPendingOrders').textContent = pendingOrders;
        document.getElementById('modalUserCompletedOrders').textContent = completedOrders;
        document.getElementById('modalUserLastOrder').textContent = 
            lastOrder ? formatDate(lastOrder.createdAt) : 'Ninguno';

        // Load recent orders
        loadUserRecentOrders(orders);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error showing user details:', error);
        showError('Error al cargar los detalles del usuario');
    }
};

function loadUserRecentOrders(orders) {
    const ordersContainer = document.getElementById('modalUserOrders');
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p class="text-muted">Este usuario no tiene pedidos registrados.</p>';
        return;
    }

    // Get last 5 orders
    const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const ordersHtml = recentOrders.map(order => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <strong>${order.garmentType || 'Prenda no especificada'}</strong> - ${order.quantity || 0} prendas
                <br>
                <small class="text-muted">
                    Creado: ${formatDate(order.createdAt)} | 
                    Entrega: ${formatDate(order.deliveryDate)}
                </small>
            </div>
            <span class="badge ${getStatusBadgeClass(order)}">${getOrderStatus(order)}</span>
        </div>
    `).join('');

    ordersContainer.innerHTML = ordersHtml;
}

// View user orders (redirect to orders page with filter)
window.viewUserOrders = function(userId) {
    // Store filter in localStorage and redirect to orders page
    localStorage.setItem('lavape_orders_filter', JSON.stringify({ userId: userId }));
    window.location.href = 'listar.html';
};

// Helper functions
function getUserOrders(userId) {
    const orders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
    return orders.filter(order => order.userId === userId);
}

function getLastOrderDate(orders) {
    if (orders.length === 0) return 'Nunca';
    const lastOrder = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return formatDate(lastOrder.createdAt);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
}

function getOrderStatus(order) {
    if (order.status === 'Entregado') return 'Entregado';
    
    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deliveryDate < today) return 'Retrasado';
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

function showError(message) {
    // Simple error display - you can enhance this with a toast notification
    alert(message);
}