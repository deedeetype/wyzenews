// WyzeNews - Unsubscribe page

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const loadingEl = document.getElementById('loading');
const successEl = document.getElementById('success');
const errorEl = document.getElementById('error');
const errorTextEl = document.getElementById('error-text');

async function unsubscribe() {
    if (!token || !UUID_RE.test(token)) {
        showError('Invalid unsubscribe link. No token provided.');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/unsubscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showSuccess();
        } else {
            showError(data.error || 'Failed to unsubscribe. Please try again.');
        }
    } catch (error) {
        console.error('Unsubscribe error:', error);
        showError('Network error. Please check your connection and try again.');
    }
}

function showSuccess() {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    successEl.style.display = 'block';
}

function showError(message) {
    errorTextEl.textContent = message;
    loadingEl.style.display = 'none';
    successEl.style.display = 'none';
    errorEl.style.display = 'block';
}

// Auto-run on page load
unsubscribe();
