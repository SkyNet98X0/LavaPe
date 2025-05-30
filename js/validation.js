export function validateForm(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
}

export function validateFutureDate(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
}

export function validatePositiveNumber(number) {
    return number > 0;
}

export function validateRequiredField(value) {
    return value && value.trim().length > 0;
}

export function setupFormValidation(formId, onSubmit) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (validateForm(form)) {
            onSubmit(form);
        }
    });
}