import { validateForm, validateRequiredField } from './validation.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (window.authManager.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Clear previous errors
        errorMessage.classList.add('d-none');
        errorMessage.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validate form
        if (!validateForm(loginForm)) {
            return;
        }

        // Additional validation
        if (!validateRequiredField(email) || !validateRequiredField(password)) {
            showError('Por favor completa todos los campos');
            return;
        }

        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Ingresando...';

        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Attempt login
            const user = window.authManager.login(email, password);
            
            // Success - redirect to dashboard
            window.location.href = 'index.html';
            
        } catch (error) {
            showError(error.message);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            spinner.classList.add('d-none');
            submitBtn.textContent = originalText;
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorMessage.classList.add('d-none');
        }, 5000);
    }
});