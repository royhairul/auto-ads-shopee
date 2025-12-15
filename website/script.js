/**
 * Auto Ads Shopee - Landing Page Script
 * Fetches releases from GitHub API and displays them on the page
 */

const GITHUB_REPO = 'royhairul/auto-ads-shopee';
const GITHUB_API_BASE = 'https://api.github.com';

// DOM Elements
const elements = {
    heroVersion: document.getElementById('hero-version'),
    heroDownloadBtn: document.getElementById('hero-download-btn'),
    totalDownloads: document.getElementById('total-downloads'),
    totalReleases: document.getElementById('total-releases'),

    downloadLoading: document.getElementById('download-loading'),
    downloadContent: document.getElementById('download-content'),
    downloadError: document.getElementById('download-error'),

    latestVersion: document.getElementById('latest-version'),
    latestDate: document.getElementById('latest-date'),
    latestTitle: document.getElementById('latest-title'),
    latestNotes: document.getElementById('latest-notes'),
    latestDownloadBtn: document.getElementById('latest-download-btn'),
    latestSize: document.getElementById('latest-size'),

    releasesLoading: document.getElementById('releases-loading'),
    releasesList: document.getElementById('releases-list'),
    releasesPagination: document.getElementById('releases-pagination'),
    loadMoreBtn: document.getElementById('load-more-btn'),
};

let allReleases = [];
let displayedReleases = 0;
const RELEASES_PER_PAGE = 5;

/**
 * Format bytes to human readable size
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to local string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Simple markdown to HTML converter
 */
function markdownToHtml(markdown) {
    if (!markdown) return '<p>Tidak ada catatan rilis.</p>';

    return markdown
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Lists
        .replace(/^\s*[-*]\s(.*)$/gm, '<li>$1</li>')
        // Wrap lists
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

/**
 * Find zip asset from release assets
 */
function findZipAsset(assets) {
    const zipContentTypes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-zip',
        'application/octet-stream'
    ];
    return assets.find(asset =>
        asset.name.endsWith('.zip') &&
        zipContentTypes.includes(asset.content_type)
    );
}

/**
 * Calculate total downloads across all releases
 */
function calculateTotalDownloads(releases) {
    return releases.reduce((total, release) => {
        return total + release.assets.reduce((assetTotal, asset) => {
            return assetTotal + asset.download_count;
        }, 0);
    }, 0);
}

/**
 * Fetch all releases from GitHub
 */
async function fetchReleases() {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching releases:', error);
        throw error;
    }
}

/**
 * Update the hero section with latest version
 */
function updateHeroSection(latestRelease) {
    if (!latestRelease) return;

    const zipAsset = findZipAsset(latestRelease.assets);

    elements.heroVersion.textContent = latestRelease.tag_name;

    if (zipAsset) {
        elements.heroDownloadBtn.href = zipAsset.browser_download_url;
    } else {
        elements.heroDownloadBtn.href = latestRelease.html_url;
    }
}

/**
 * Update stats section
 */
function updateStats(releases) {
    const totalDownloads = calculateTotalDownloads(releases);
    elements.totalDownloads.textContent = totalDownloads.toLocaleString('id-ID');
    elements.totalReleases.textContent = releases.length;
}

/**
 * Display the latest release in the download section
 */
function displayLatestRelease(release) {
    const zipAsset = findZipAsset(release.assets);

    elements.latestVersion.textContent = release.tag_name;
    elements.latestDate.textContent = formatDate(release.published_at);
    elements.latestTitle.textContent = release.name || release.tag_name;
    elements.latestNotes.innerHTML = markdownToHtml(release.body);

    if (zipAsset) {
        elements.latestDownloadBtn.href = zipAsset.browser_download_url;
        elements.latestSize.textContent = formatBytes(zipAsset.size);
    } else {
        elements.latestDownloadBtn.style.display = 'none';
    }

    elements.downloadLoading.style.display = 'none';
    elements.downloadContent.style.display = 'block';
}

/**
 * Create a release item element
 */
function createReleaseItem(release, isLatest = false) {
    const zipAsset = findZipAsset(release.assets);
    const downloads = release.assets.reduce((sum, asset) => sum + asset.download_count, 0);

    const item = document.createElement('div');
    item.className = `release-item${isLatest ? ' latest' : ''}`;

    item.innerHTML = `
    <div class="release-header">
      <div class="release-info">
        <span class="release-version">${release.tag_name}</span>
        ${isLatest ? '<span class="latest-badge">Latest</span>' : ''}
      </div>
      <div class="release-meta">
        <span>${formatDate(release.published_at)}</span>
        <span>•</span>
        <span>${downloads} downloads</span>
      </div>
    </div>
    <div class="release-body">${markdownToHtml(release.body)}</div>
    <div class="release-actions">
      ${zipAsset ? `
        <a href="${zipAsset.browser_download_url}" class="btn btn-primary">
          Download ${formatBytes(zipAsset.size)}
        </a>
      ` : ''}
    </div>
  `;

    return item;
}

/**
 * Display releases in the releases list
 */
function displayReleases(releases, append = false) {
    if (!append) {
        // Clear loading indicator
        elements.releasesLoading.style.display = 'none';
    }

    const startIndex = displayedReleases;
    const endIndex = Math.min(startIndex + RELEASES_PER_PAGE, releases.length);

    for (let i = startIndex; i < endIndex; i++) {
        const releaseItem = createReleaseItem(releases[i], i === 0);
        elements.releasesList.appendChild(releaseItem);
    }

    displayedReleases = endIndex;

    // Show/hide load more button
    if (displayedReleases < releases.length) {
        elements.releasesPagination.style.display = 'flex';
    } else {
        elements.releasesPagination.style.display = 'none';
    }
}

/**
 * Show error state
 */
function showError() {
    elements.downloadLoading.style.display = 'none';
    elements.downloadError.style.display = 'block';
    elements.releasesLoading.innerHTML = `
    <p style="color: var(--text-secondary);">Gagal memuat releases. Silakan coba lagi nanti.</p>
  `;
}

/**
 * Initialize the page
 */
async function init() {
    try {
        const releases = await fetchReleases();

        if (releases.length === 0) {
            showError();
            return;
        }

        allReleases = releases;

        // Update hero section
        updateHeroSection(releases[0]);

        // Update stats
        updateStats(releases);

        // Display latest release
        displayLatestRelease(releases[0]);

        // Display all releases
        displayReleases(releases);

    } catch (error) {
        console.error('Failed to initialize:', error);
        showError();
    }
}

// Event Listeners
if (elements.loadMoreBtn) {
    elements.loadMoreBtn.addEventListener('click', () => {
        displayReleases(allReleases, true);
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Only handle internal anchor links, not external URLs
        if (href && href.startsWith('#') && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Add navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 10, 15, 0.95)';
    } else {
        navbar.style.background = 'rgba(18, 18, 26, 0.8)';
    }

    lastScroll = currentScroll;
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
