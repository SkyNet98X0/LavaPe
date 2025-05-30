// Authentication management
class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
    }

    // Load users from localStorage
    loadUsers() {
        const users = JSON.parse(localStorage.getItem('lavape_users') || '[]');
        // Add default admin user if no users exist
        if (users.length === 0) {
            const defaultAdmin = {
                id: 1,
                firstName: 'Admin',
                lastName: 'Sistema',
                email: 'admin@lavape.com',
                password: 'admin123',
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            users.push(defaultAdmin);
            this.saveUsers(users);
        }
        return users;
    }

    // Save users to localStorage
    saveUsers(users) {
        localStorage.setItem('lavape_users', JSON.stringify(users));
    }

    // Load current user from localStorage
    loadCurrentUser() {
        return JSON.parse(localStorage.getItem('lavape_current_user') || 'null');
    }

    // Save current user to localStorage
    saveCurrentUser(user) {
        localStorage.setItem('lavape_current_user', JSON.stringify(user));
        this.currentUser = user;
    }

    // Register new user
    register(userData) {
        // Check if email already exists
        if (this.users.find(user => user.email === userData.email)) {
            throw new Error('El correo electrónico ya está registrado');
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password, // In production, this should be hashed
            role: userData.role,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers(this.users);
        return newUser;
    }

    // Login user
    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error('Credenciales incorrectas');
        }

        // Don't save password in current user session
        const sessionUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };

        this.saveCurrentUser(sessionUser);
        return sessionUser;
    }

    // Logout user
    logout() {
        localStorage.removeItem('lavape_current_user');
        this.currentUser = null;
        window.location.href = 'login.html';
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Protect route - redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Protect admin routes
    requireAdmin() {
        if (!this.requireAuth()) return false;
        if (!this.hasRole('admin')) {
            alert('No tienes permisos para acceder a esta página');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Get all users (admin only)
    getAllUsers() {
        if (!this.hasRole('admin')) {
            throw new Error('No tienes permisos para ver todos los usuarios');
        }
        return this.users.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        }));
    }
}

// Create global instance
window.authManager = new AuthManager();

// NAVBAR MANAGEMENT - Mejorado para manejar diferentes estructuras de HTML
class NavbarManager {
    static updateNavigation() {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) {
            this.showGuestNavigation();
            return;
        }

        // Buscar diferentes posibles estructuras de navbar
        let navContainer = document.querySelector('#navbarNav .navbar-nav') ||
                            document.querySelector('.navbar-nav') ||
                            document.querySelector('nav ul') ||
                            document.querySelector('nav');

        if (!navContainer) {
            console.warn('No se encontró contenedor de navegación');
            return;
        }

        // Determinar si es Bootstrap navbar o navbar personalizado
        if (navContainer.classList.contains('navbar-nav') || navContainer.querySelector('.nav-item')) {
            this.updateBootstrapNavbar(currentUser, navContainer);
        } else {
            this.updateCustomNavbar(currentUser, navContainer);
        }
    }

    static updateBootstrapNavbar(currentUser, navContainer) {
        // Clear existing nav items except home
        navContainer.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="index.html">
                    <i class="fas fa-home me-1"></i>Inicio
                </a>
            </li>
        `;

        if (currentUser.role === 'usuario') {
            // NAVEGACIÓN PARA USUARIOS NORMALES
            navContainer.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="registro.html">
                        <i class="fas fa-plus-circle me-1"></i>Nuevo Pedido
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="listar.html">
                        <i class="fas fa-list me-1"></i>Pedidos
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="nosotros.html">
                        <i class="fas fa-info-circle me-1"></i>Nosotros
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="contacto.html">
                        <i class="fas fa-envelope me-1"></i>Contacto
                    </a>
                </li>
            `;
        } else if (currentUser.role === 'admin') {
            // NAVEGACIÓN PARA ADMINISTRADORES
            navContainer.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="listar.html">
                        <i class="fas fa-clipboard-list me-1"></i>Pedidos
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="usuarios.html">
                        <i class="fas fa-users me-1"></i>Usuarios
                    </a>
                </li>
            `;
        }

        // Add user info and logout (para ambos roles)
        navContainer.innerHTML += `
            <li class="nav-item dropdown ms-auto">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user-circle me-1"></i>
                    ${currentUser.firstName} ${currentUser.lastName}
                    <span class="badge bg-${currentUser.role === 'admin' ? 'danger' : 'primary'} ms-1">
                        ${currentUser.role === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><h6 class="dropdown-header">${currentUser.firstName} ${currentUser.lastName}</h6></li>
                    <li><span class="dropdown-item-text small text-muted">${currentUser.email}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutBtn">
                        <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                    </a></li>
                </ul>
            `;

        this.addLogoutFunctionality();
    }

    static updateCustomNavbar(currentUser, navContainer) {
        // Para navbar personalizado (no Bootstrap)
        let navHTML = `<a href="index.html" class="nav-link">Inicio</a>`;

        if (currentUser.role === 'usuario') {
            navHTML += `
                <a href="registro.html" class="nav-link">Nuevo Pedido</a>
                <a href="listar.html" class="nav-link">Pedidos</a>
                <a href="nosotros.html" class="nav-link">Nosotros</a>
                <a href="contacto.html" class="nav-link">Contacto</a>
            `;
        } else if (currentUser.role === 'admin') {
            navHTML += `
                <a href="listar.html" class="nav-link">Pedidos</a>
                <a href="usuarios.html" class="nav-link">Usuarios</a>
            `;
        }

        navHTML += `
            <div class="user-menu">
                <span class="user-name">${currentUser.firstName} (${currentUser.role})</span>
                <button id="logoutBtn" class="logout-btn">Cerrar Sesión</button>
            </div>
        `;

        navContainer.innerHTML = navHTML;
        this.addLogoutFunctionality();
    }

    static showGuestNavigation() {
        const navContainer = document.querySelector('#navbarNav .navbar-nav') ||
                            document.querySelector('.navbar-nav') ||
                            document.querySelector('nav ul') ||
                            document.querySelector('nav');

        if (!navContainer) return;

        if (navContainer.classList.contains('navbar-nav')) {
            navContainer.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="index.html">Inicio</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="nosotros.html">Nosotros</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="contacto.html">Contacto</a>
                </li>
                <li class="nav-item ms-auto">
                    <a class="nav-link btn btn-primary text-white" href="login.html">Iniciar Sesión</a>
                </li>
            `;
        } else {
            navContainer.innerHTML = `
                <a href="index.html" class="nav-link">Inicio</a>
                <a href="nosotros.html" class="nav-link">Nosotros</a>
                <a href="contacto.html" class="nav-link">Contacto</a>
                <a href="login.html" class="nav-link login-btn">Iniciar Sesión</a>
            `;
        }
    }

    static addLogoutFunctionality() {
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                window.authManager.logout();
            }
        });
    }
}

// FUNCIONES DE PROTECCIÓN DE PÁGINAS
function protectPage(requiredRole = null) {
    const currentUser = window.authManager.getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (requiredRole && currentUser.role !== requiredRole) {
        alert('No tienes permisos para acceder a esta página');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

function protectAdminPage() {
    return protectPage('admin');
}

function protectUserPage() {
    return protectPage('usuario');
}

// INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', () => {
    // Skip auth check for login and register pages
    const currentPage = window.location.pathname;
    const publicPages = ['login.html', 'register.html'];
    const isPublicPage = publicPages.some(page => currentPage.includes(page));
    
    if (isPublicPage) {
        NavbarManager.showGuestNavigation();
        return;
    }

    // Redirect to login if not authenticated
    if (!window.authManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Update navigation based on user role
    NavbarManager.updateNavigation();
});

// EXPORTAR FUNCIONES PARA USO GLOBAL
window.protectPage = protectPage;
window.protectAdminPage = protectAdminPage;
window.protectUserPage = protectUserPage;
window.NavbarManager = NavbarManager;

// Para compatibilidad con módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AuthManager, 
        NavbarManager, 
        protectPage, 
        protectAdminPage, 
        protectUserPage 
    };
}