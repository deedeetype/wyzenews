// WyzeNews - Homepage Digest Loader
// Loads today's breaking news and archive functionality

// DOM Elements
const todayDigest = document.getElementById('today-digest');
const archiveDigest = document.getElementById('archive-digest');
const datePicker = document.getElementById('date-picker');
const loadArchiveBtn = document.getElementById('load-archive');

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Create breaking card HTML
function createBreakingCard(story, index) {
    return `
        <a href="${story.url}" class="breaking-card">
            <img src="${story.image}" alt="${story.headline}" class="breaking-card-image">
            <div class="breaking-card-content">
                <h3 class="breaking-card-title">${story.headline}</h3>
                <p class="breaking-card-summary">${story.summary}</p>
            </div>
        </a>
    `;
}

// Load digest for a specific date
async function loadDigest(dateSlug, targetElement) {
    try {
        // Add cache-busting timestamp
        const response = await fetch(`/breaking/index.json?t=${Date.now()}`);
        const data = await response.json();
        
        if (data[dateSlug]) {
            const digest = data[dateSlug];
            targetElement.innerHTML = digest.stories
                .map((story, i) => createBreakingCard(story, i + 1))
                .join('');
            return true;
        } else {
            targetElement.innerHTML = `
                <p style="text-align: center; color: #8b8ba7; grid-column: 1 / -1;">
                    No digest found for ${dateSlug}
                </p>
            `;
            return false;
        }
    } catch (error) {
        console.error('Error loading digest:', error);
        targetElement.innerHTML = `
            <p style="text-align: center; color: #f56565; grid-column: 1 / -1;">
                Error loading digest. Please try again.
            </p>
        `;
        return false;
    }
}

// Load today's digest on page load
async function loadToday() {
    const today = formatDate(new Date());
    
    try {
        // Add cache-busting timestamp to always get fresh data
        const response = await fetch(`/breaking/index.json?t=${Date.now()}`);
        const data = await response.json();
        
        if (!data[today]) {
            // No digest for today - show "brewing" message
            todayDigest.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
                    <div style="margin-bottom: 30px;">
                        <img src="/assets/WyzeNewsLogo.png" alt="WyzeNews" style="width: 150px; height: auto;">
                    </div>
                    <h3 style="color: #667eea; font-size: 28px; margin-bottom: 15px; font-weight: 700;">
                        The owl is brewing fresh news!
                    </h3>
                    <p style="color: #8b8ba7; font-size: 18px; line-height: 1.6;">
                        Check back later for today's breaking stories.
                    </p>
                </div>
            `;
            return;
        }
    } catch (error) {
        console.error('Error checking digest:', error);
    }
    
    await loadDigest(today, todayDigest);
}

// Archive date picker handler
loadArchiveBtn.addEventListener('click', async () => {
    const selectedDate = datePicker.value;
    
    if (!selectedDate) {
        alert('Please select a date');
        return;
    }
    
    archiveDigest.style.display = 'grid';
    archiveDigest.innerHTML = '<p style="text-align: center; color: #8b8ba7; grid-column: 1 / -1;">Loading...</p>';
    
    await loadDigest(selectedDate, archiveDigest);
    
    // Scroll to archive section
    archiveDigest.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Set date picker max to today and default value
const today = new Date();
datePicker.max = formatDate(today);
datePicker.value = formatDate(today);

// Load today's digest on page load
loadToday();
