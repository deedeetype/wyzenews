(function() {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const confirmationEl = document.getElementById('confirmation');
    const loadingEl = document.getElementById('loading');
    const successEl = document.getElementById('success');
    const errorEl = document.getElementById('error');
    const errorTextEl = document.getElementById('error-text');
    const confirmBtn = document.getElementById('confirm-btn');

    // Check if all required elements exist
    if (!confirmationEl || !loadingEl || !successEl || !errorEl || !errorTextEl) {
        console.error('Required elements not found in page');
        return;
    }

    async function unsubscribe() {
        if (!token) {
            showError('Invalid unsubscribe link. No token provided.');
            return;
        }

        confirmationEl.style.display = 'none';
        loadingEl.style.display = 'flex';

        try {
            const response = await fetch('/.netlify/functions/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccess();
            } else {
                showError(data.error || 'Failed to unsubscribe.');
            }
        } catch (error) {
            console.error('Unsubscribe error:', error);
            showError('Network error. Please try again.');
        }
    }

    function showSuccess() {
        loadingEl.style.display = 'none';
        successEl.style.display = 'block';
    }

    function showError(message) {
        loadingEl.style.display = 'none';
        if (confirmationEl) confirmationEl.style.display = 'none';
        errorTextEl.textContent = message;
        errorEl.style.display = 'block';
    }

    // Initialize page
    if (token) {
        confirmationEl.style.display = 'block';
    } else {
        showError('Invalid unsubscribe link.');
    }

    // Handle confirm button click
    if (confirmBtn) {
        confirmBtn.addEventListener('click', unsubscribe);
    }
})();
