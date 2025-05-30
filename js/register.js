import { validateForm, validateRequiredField } from './validation.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (window.authManager.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const registerForm = document.getElementById('registerForm');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const confirmPasswordField = document.getElementById('confirmPassword');
    const passwordField = document.getElementById('password');

    // Custom validation for password confirmation
    confirmPasswordField.addEventListener('input', validatePasswordMatch);
    passwordField.addEventListener('input', validatePasswordMatch);

    function validatePasswordMatch() {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordField.setCustomValidity('Las contraseñas no coinciden');
        } else {
            confirmPasswordField.setCustomValidity('');
        }
    }

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Clear previous messages
        successMessage.classList.add('d-none');
        errorMessage.classList.add('d-none');

        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            role: document.getElementById('role').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };

        // Validate form
        if (!validateForm(registerForm)) {
            return;
        }

        // Additional validations
        if (!validateRequiredField(formData.firstName) || 
            !validateRequiredField(formData.lastName) ||
            !validateRequiredField(formData.email) ||
            !validateRequiredField(formData.role) ||
            !validateRequiredField(formData.password)) {
            showError('Por favor completa todos los campos');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando cuenta...';

        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Attempt registration
            const user = window.authManager.register(formData);
            
            // Success
            showSuccess('Cuenta creada exitosamente. Puedes iniciar sesión ahora.');
            registerForm.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            showError(error.message);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            spinner.classList.add('d-none');
            submitBtn.textContent = originalText;
        }
    });

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.remove('d-none');
        errorMessage.classList.add('d-none');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        successMessage.classList.add('d-none');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorMessage.classList.add('d-none');
        }, 5000);
    }
});