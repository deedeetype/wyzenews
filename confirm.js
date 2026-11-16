// WyzeNews - Subscription confirmation page (step 2 of double opt-in)

const token = new URLSearchParams(window.location.search).get('token');

const loadingEl = document.getElementById('loading');
const successEl = document.getElementById('success');
const errorEl = document.getElementById('error');
const errorTextEl = document.getElementById('error-text');

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

async function confirmSubscription() {
    if (!token) {
        showError('Invalid confirmation link.');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            showSuccess();
        } else {
            showError(data.error || 'Confirmation failed. Please subscribe again.');
        }
    } catch (error) {
        showError('Network error. Please check your connection and try again.');
    }
}

confirmSubscription();
