// WyzeNews - Homepage Digest Loader with Recent Archive

// DOM Elements  
const todayDigest = document.getElementById('today-digest');
const recentArchive = document.getElementById('recent-archive');

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Escape text coming from the digest index before inserting it into the page.
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Only allow links and images that stay inside this site's /breaking/ folder.
function safePath(value) {
    const path = String(value ?? '').replace(/^\/+/, '');
    return /^breaking\/[\w\-/.]+$/.test(path) && !path.includes('..') ? '/' + path : '#';
}

// Create breaking card HTML
function createBreakingCard(story) {
    return `
        <a href="${safePath(story.url)}" class="breaking-card">
            <img src="${safePath(story.image)}" alt="${escapeHtml(story.headline)}" class="breaking-card-image">
            <div class="breaking-card-content">
                <h3 class="breaking-card-title">${escapeHtml(story.headline)}</h3>
                <p class="breaking-card-summary">${escapeHtml(story.summary)}</p>
            </div>
        </a>
    `;
}

// Load today's digest
async function loadToday() {
    const today = formatDate(new Date());
    
    try {
        const response = await fetch(`/breaking/index.json?t=${Date.now()}`);
        const data = await response.json();
        
        if (!data[today]) {
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
        
        const digest = data[today];
        todayDigest.innerHTML = digest.stories
            .map(story => createBreakingCard(story))
            .join('');
            
    } catch (error) {
        console.error('Error loading today:', error);
        todayDigest.innerHTML = `
            <p style="text-align: center; color: #f56565; grid-column: 1 / -1;">
                Error loading digest.
            </p>
        `;
    }
}

// Load recent 7 days archive
async function loadRecentArchive() {
    const today = new Date();
    
    try {
        const response = await fetch(`/breaking/index.json?t=${Date.now()}`);
        const data = await response.json();
        
        let html = '';
        
        // Loop last 7 days (yesterday to 7 days ago)
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateSlug = formatDate(date);
            
            if (data[dateSlug]) {
                const digest = data[dateSlug];
                
                // Date divider
                html += `<div class="date-divider">${escapeHtml(digest.date)}</div>`;
                
                // Stories grid
                html += '<div class="digest-grid">';
                digest.stories.forEach(story => {
                    html += createBreakingCard(story);
                });
                html += '</div>';
            }
        }
        
        if (html) {
            recentArchive.innerHTML = html;
        } else {
            recentArchive.innerHTML = '<p style="text-align: center; color: #8b8ba7;">No recent archives available yet.</p>';
        }
        
    } catch (error) {
        console.error('Error loading archive:', error);
        recentArchive.innerHTML = '<p style="text-align: center; color: #f56565;">Error loading archives.</p>';
    }
}

// Initialize
loadToday();
loadRecentArchive();
