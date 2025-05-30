// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('LavaPe application initialized');
  
  // Initialize any Bootstrap components that need JavaScript
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});