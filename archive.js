// WyzeNews - Full Archive Page Loader

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Create breaking card HTML
function createBreakingCard(story) {
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

// Load full archive
async function loadFullArchive() {
    const fullArchive = document.getElementById('full-archive');
    
    try {
        const response = await fetch(`/breaking/index.json?t=${Date.now()}`);
        const data = await response.json();
        
        // Sort dates descending (most recent first)
        const dates = Object.keys(data).sort().reverse();
        
        if (dates.length === 0) {
            fullArchive.innerHTML = '<p style="text-align: center; color: #8b8ba7;">No archives available yet.</p>';
            return;
        }
        
        let html = '';
        
        dates.forEach(dateSlug => {
            const digest = data[dateSlug];
            
            // Date divider
            html += `<div class="date-divider">${digest.date}</div>`;
            
            // Stories grid
            html += '<div class="digest-grid">';
            digest.stories.forEach(story => {
                html += createBreakingCard(story);
            });
            html += '</div>';
        });
        
        fullArchive.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading archive:', error);
        fullArchive.innerHTML = '<p style="text-align: center; color: #f56565;">Error loading archive. Please try again.</p>';
    }
}

// Initialize
loadFullArchive();
