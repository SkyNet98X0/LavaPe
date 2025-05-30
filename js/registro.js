// registro.js - Sistema de registro de pedidos
document.addEventListener('DOMContentLoaded', () => {
    // Verificar que el usuario esté autenticado
    if (!window.authManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Solo permitir usuarios normales en esta página
    const currentUser = window.authManager.getCurrentUser();
    if (currentUser.role !== 'usuario') {
        alert('Esta página es solo para usuarios normales');
        window.location.href = 'index.html';
        return;
    }

    initializeForm();
});

function initializeForm() {
    const form = document.getElementById('pedidoForm');
    const currentUser = window.authManager.getCurrentUser();
    
    // Configurar fecha mínima (hoy)
    const fechaEntrega = document.getElementById('fechaEntrega');
    if (fechaEntrega) {
        const today = new Date();
        today.setDate(today.getDate() + 1); // Mínimo mañana
        fechaEntrega.min = today.toISOString().split('T')[0];
    }

    // Pre-llenar el nombre del cliente con información del usuario
    const nombreClienteField = document.getElementById('nombreCliente');
    if (nombreClienteField && currentUser) {
        nombreClienteField.value = `${currentUser.firstName} ${currentUser.lastName}`;
    }

    // Configurar validación del formulario
    form.addEventListener('submit', handleSubmit);
    
    // Validación en tiempo real
    setupRealTimeValidation();
}

function setupRealTimeValidation() {
    const cantidad = document.getElementById('cantidad');
    const fechaEntrega = document.getElementById('fechaEntrega');
    
    cantidad.addEventListener('input', () => {
        const value = parseInt(cantidad.value);
        if (value < 1 || value > 100) {
            cantidad.setCustomValidity('La cantidad debe estar entre 1 y 100');
        } else {
            cantidad.setCustomValidity('');
        }
    });
    
    fechaEntrega.addEventListener('change', () => {
        const selectedDate = new Date(fechaEntrega.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate <= today) {
            fechaEntrega.setCustomValidity('La fecha de entrega debe ser futura');
        } else {
            fechaEntrega.setCustomValidity('');
        }
    });
}

async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const form = event.target;
    const currentUser = window.authManager.getCurrentUser();
    
    // Verificar autenticación nuevamente
    if (!currentUser) {
        showError('Debes iniciar sesión para crear un pedido');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }

    // Obtener datos del formulario
    const formData = {
        nombreCliente: form.querySelector('#nombreCliente').value.trim(),
        tipoPrenda: form.querySelector('#tipoPrenda').value,
        cantidad: parseInt(form.querySelector('#cantidad').value),
        fechaEntrega: form.querySelector('#fechaEntrega').value,
        observaciones: form.querySelector('#observaciones').value.trim()
    };

    // Validar formulario
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    // Validaciones adicionales
    if (!validateFormData(formData)) {
        return;
    }

    // Mostrar estado de carga
    const submitBtn = form.querySelector('button[type="submit"]');
    const spinner = submitBtn.querySelector('.spinner-border');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Registrando...
    `;

    try {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Crear el nuevo pedido
        const newOrder = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userEmail: currentUser.email,
            customerName: formData.nombreCliente,
            garmentType: formData.tipoPrenda,
            quantity: formData.cantidad,
            deliveryDate: formData.fechaEntrega,
            observations: formData.observaciones,
            status: 'Pendiente',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Guardar el pedido
        if (saveOrder(newOrder)) {
            showSuccess('¡Pedido registrado exitosamente!');
            form.reset();
            form.classList.remove('was-validated');
            
            // Pre-llenar nombre nuevamente después del reset
            setTimeout(() => {
                document.getElementById('nombreCliente').value = `${currentUser.firstName} ${currentUser.lastName}`;
            }, 100);
            
            // Opcional: redirigir después de un momento
            setTimeout(() => {
                if (confirm('¿Deseas ver tus pedidos ahora?')) {
                    window.location.href = 'listar.html';
                }
            }, 2000);
        } else {
            throw new Error('Error al guardar el pedido');
        }

    } catch (error) {
        console.error('Error al registrar pedido:', error);
        showError('Error al registrar el pedido. Por favor, inténtalo de nuevo.');
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        submitBtn.innerHTML = originalText;
    }
}

function validateFormData(data) {
    // Validar nombre
    if (!data.nombreCliente || data.nombreCliente.length < 2) {
        showError('El nombre del cliente debe tener al menos 2 caracteres');
        return false;
    }

    // Validar tipo de prenda
    if (!data.tipoPrenda) {
        showError('Debe seleccionar un tipo de prenda');
        return false;
    }

    // Validar cantidad
    if (!data.cantidad || data.cantidad < 1 || data.cantidad > 100) {
        showError('La cantidad debe estar entre 1 y 100');
        return false;
    }

    // Validar fecha
    const selectedDate = new Date(data.fechaEntrega);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate <= today) {
        showError('La fecha de entrega debe ser futura');
        return false;
    }

    return true;
}

function saveOrder(order) {
    try {
        // Obtener pedidos existentes del localStorage
        const existingOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
        
        // Agregar el nuevo pedido
        existingOrders.push(order);
        
        // Guardar de vuelta al localStorage
        localStorage.setItem('lavape_orders', JSON.stringify(existingOrders));
        
        console.log('Pedido guardado exitosamente:', order);
        return true;
    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        return false;
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    const successText = document.getElementById('success-text');
    const errorDiv = document.getElementById('error-message');
    
    successText.textContent = message;
    successDiv.classList.remove('d-none');
    errorDiv.classList.add('d-none');
    
    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        successDiv.classList.add('d-none');
    }, 5000);
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const successDiv = document.getElementById('success-message');
    
    errorText.textContent = message;
    errorDiv.classList.remove('d-none');
    successDiv.classList.add('d-none');
    
    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.classList.add('d-none');
    }, 5000);
}

// Funciones auxiliares para el manejo de pedidos (para uso global)
window.getOrdersForCurrentUser = function() {
    const currentUser = window.authManager.getCurrentUser();
    if (!currentUser) return [];
    
    const allOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
    return allOrders.filter(order => order.userId === currentUser.id);
};

window.getAllOrdersAdmin = function() {
    const currentUser = window.authManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('No tienes permisos para ver todos los pedidos');
    }
    
    return JSON.parse(localStorage.getItem('lavape_orders') || '[]');
};