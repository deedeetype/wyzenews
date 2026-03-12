// Daily Digest Landing Page - Client-side JavaScript

// DOM Elements
const form = document.getElementById('subscribe-form');
const emailInput = document.getElementById('email');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const previewImage = document.getElementById('preview-image');

// Load actual preview image if available
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Local development - use placeholder
    console.log('Running locally - using placeholder image');
} else {
    // Production - try to load actual breaking news image
    // This would be replaced with actual image URL from your pipeline
    // For now, keep placeholder
}

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    // Basic validation
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    setLoading(true);
    hideMessages();
    
    try {
        // Call Netlify function to save subscriber
        const response = await fetch('/.netlify/functions/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            showSuccess();
            form.reset();
        } else {
            // Error from backend
            showError(data.error || 'Subscription failed. Please try again.');
        }
    } catch (error) {
        console.error('Subscription error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        setLoading(false);
    }
});

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// UI State Management
function setLoading(loading) {
    if (loading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function showSuccess() {
    form.style.display = 'none';
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Real-time email validation feedback
emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim();
    if (email && !isValidEmail(email)) {
        emailInput.style.borderColor = '#f56565';
    } else {
        emailInput.style.borderColor = '#3a3a5a';
    }
});

// Clear error on focus
emailInput.addEventListener('focus', () => {
    hideMessages();
});

// Analytics (optional - add if you want tracking)
function trackSubscription(email) {
    // Add Google Analytics, Plausible, or other tracking here
    console.log('Subscription tracked:', email);
}
