import { validateRequiredField, setupFormValidation } from './validation.js';

function handleSubmit(form) {
    const nombre = form.querySelector('#nombre').value;
    const email = form.querySelector('#email').value;
    const mensaje = form.querySelector('#mensaje').value;

    if (!validateRequiredField(nombre) || !validateRequiredField(email) || !validateRequiredField(mensaje)) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }

    // Simulación de envío
    alert('Mensaje enviado exitosamente');
    form.reset();
    form.classList.remove('was-validated');
}

document.addEventListener('DOMContentLoaded', () => {
    setupFormValidation('contactForm', handleSubmit);
});