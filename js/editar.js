// PROTECCIÓN Y CARGA INICIAL
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación y permisos de administrador
    if (!protectAdminAccess()) {
        return; // La función ya maneja la redirección
    }
    
    // Si llegamos aquí, el usuario es admin - continuar con la lógica normal
    setupFormValidation();
    loadOrder();
    setupDateConstraints();
});

// FUNCIÓN DE PROTECCIÓN DE ACCESO
function protectAdminAccess() {
    // Verificar si el usuario está autenticado
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        alert('Debes iniciar sesión para acceder a esta página');
        window.location.href = 'login.html';
        return false;
    }
    
    // Verificar si el usuario es administrador
    const currentUser = window.authManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        alert('No tienes permisos para editar pedidos. Solo los administradores pueden realizar esta acción.');
        window.location.href = 'listar.html';
        return false;
    }
    
    return true;
}

// CONFIGURAR VALIDACIÓN DEL FORMULARIO
function setupFormValidation() {
    const form = document.getElementById('pedidoForm');
    if (!form) {
        console.error('Formulario no encontrado');
        return;
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Formulario enviado');
        
        // Verificar permisos nuevamente antes de procesar
        if (!protectAdminAccess()) {
            return;
        }
        
        // Validar formulario
        if (validateForm(form)) {
            handleSubmit(form);
        } else {
            console.log('Formulario inválido');
            form.classList.add('was-validated');
        }
    });
}

// CONFIGURAR RESTRICCIONES DE FECHA
function setupDateConstraints() {
    const fechaEntrega = document.getElementById('fechaEntrega');
    if (fechaEntrega) {
        const today = new Date().toISOString().split('T')[0];
        fechaEntrega.min = today;
    }
}

// OBTENER ID DEL PEDIDO DESDE URL
function getOrderId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
        alert('ID de pedido no especificado');
        window.location.href = 'listar.html';
        return null;
    }
    
    return id;
}

// CARGAR DATOS DEL PEDIDO
function loadOrder() {
    const id = getOrderId();
    if (!id) return;

    console.log('Cargando pedido con ID:', id);

    // Cargar pedido desde localStorage
    const allOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
    const order = allOrders.find(o => o.id === id);
    
    if (!order) {
        alert('Pedido no encontrado');
        window.location.href = 'listar.html';
        return;
    }

    console.log('Pedido encontrado:', order);

    // Llenar el formulario con los datos del pedido
    const nombreCliente = document.getElementById('nombreCliente');
    const tipoPrenda = document.getElementById('tipoPrenda');
    const cantidad = document.getElementById('cantidad');
    const fechaEntrega = document.getElementById('fechaEntrega');

    if (nombreCliente) nombreCliente.value = order.customerName || order.nombreCliente || '';
    if (tipoPrenda) tipoPrenda.value = order.garmentType || order.tipoPrenda || '';
    if (cantidad) cantidad.value = order.quantity || order.cantidad || '';
    if (fechaEntrega) fechaEntrega.value = order.deliveryDate || order.fechaEntrega || '';
    
    // Actualizar el título de la página
    const pageTitle = document.querySelector('h1');
    if (pageTitle) {
        pageTitle.textContent = `Editar Pedido - ${order.customerName || order.nombreCliente}`;
    }
}

// VALIDAR FORMULARIO
function validateForm(form) {
    const cantidad = parseInt(form.querySelector('#cantidad').value);
    const fechaEntrega = form.querySelector('#fechaEntrega').value;
    const tipoPrenda = form.querySelector('#tipoPrenda').value;

    let isValid = true;

    // Validar tipo de prenda
    if (!tipoPrenda) {
        console.log('Tipo de prenda requerido');
        isValid = false;
    }

    // Validar cantidad
    if (!validatePositiveNumber(cantidad)) {
        console.log('Cantidad inválida:', cantidad);
        isValid = false;
    }

    // Validar fecha
    if (!validateFutureDate(fechaEntrega)) {
        console.log('Fecha inválida:', fechaEntrega);
        isValid = false;
    }

    return isValid;
}

// MANEJAR ENVÍO DEL FORMULARIO
function handleSubmit(form) {
    console.log('Procesando envío del formulario');
    
    const id = getOrderId();
    if (!id) return;
    
    const cantidad = parseInt(form.querySelector('#cantidad').value);
    const fechaEntrega = form.querySelector('#fechaEntrega').value;
    const tipoPrenda = form.querySelector('#tipoPrenda').value;

    // Preparar datos actualizados
    const updatedOrderData = {
        garmentType: tipoPrenda,
        tipoPrenda: tipoPrenda, // Mantener compatibilidad
        quantity: cantidad,
        cantidad: cantidad, // Mantener compatibilidad
        deliveryDate: fechaEntrega,
        fechaEntrega: fechaEntrega, // Mantener compatibilidad
        updatedAt: new Date().toISOString(),
        updatedBy: window.authManager.getCurrentUser().id
    };

    console.log('Datos a actualizar:', updatedOrderData);

    // Actualizar pedido en localStorage
    if (updateOrderInStorage(id, updatedOrderData)) {
        // Marcar que el formulario se envió exitosamente
        window.formSubmittedSuccessfully = true;
        alert('Pedido actualizado exitosamente');
        window.location.href = 'listar.html';
    } else {
        alert('Error al actualizar el pedido');
    }
}

// ACTUALIZAR PEDIDO EN LOCALSTORAGE
function updateOrderInStorage(orderId, updatedData) {
    try {
        console.log('Actualizando pedido:', orderId, updatedData);
        
        const allOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
        const orderIndex = allOrders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            console.error('Pedido no encontrado para actualizar');
            return false;
        }
        
        console.log('Pedido original:', allOrders[orderIndex]);
        
        // Actualizar el pedido manteniendo los datos originales y añadiendo los nuevos
        allOrders[orderIndex] = {
            ...allOrders[orderIndex],
            ...updatedData
        };
        
        console.log('Pedido actualizado:', allOrders[orderIndex]);
        
        localStorage.setItem('lavape_orders', JSON.stringify(allOrders));
        
        console.log('Pedido guardado en localStorage exitosamente');
        return true;
        
    } catch (error) {
        console.error('Error al actualizar pedido en localStorage:', error);
        return false;
    }
}

// FUNCIONES DE VALIDACIÓN
function validateFutureDate(dateString) {
    if (!dateString) return false;
    
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    
    return selectedDate >= today;
}

function validatePositiveNumber(number) {
    return number && number > 0 && Number.isInteger(number);
}

// MANEJO DE ERRORES GLOBALES
window.addEventListener('error', (event) => {
    console.error('Error en editar.js:', event.error);
});

// COMPATIBILIDAD CON EL SISTEMA EXISTENTE
if (typeof window.ordersManager === 'undefined') {
    window.ordersManager = {
        getOrderById: function(id) {
            const allOrders = JSON.parse(localStorage.getItem('lavape_orders') || '[]');
            return allOrders.find(order => order.id === id);
        },
        
        updateOrder: function(id, updatedData) {
            return updateOrderInStorage(id, updatedData);
        }
    };
}