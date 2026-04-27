import { MAPTILER_KEY } from './config.js';

let searchMarker = null;
let destinationCoords = null;
let suggestionsTimeout = null;

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

export async function fetchSuggestions(query) {
    if (!query || query.length < 2) {
        hideSuggestions();
        return;
    }

    // Bias to Pune: approx 18.52, 73.85
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&proximity=73.85,18.52&bbox=73.6,18.3,74.1,18.8&autocomplete=true`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        displaySuggestions(data.features || []);
    } catch (e) {
        console.error("Suggestions error:", e);
    }
}

function displaySuggestions(features) {
    const list = document.getElementById('suggestions-list');
    if (!list) return;

    if (features.length === 0) {
        hideSuggestions();
        return;
    }

    list.innerHTML = features.map(f => `
        <div class="suggestion-item" onclick="selectSuggestion('${f.text}', [${f.center}])">
            <span class="suggestion-icon">📍</span>
            <div class="suggestion-info">
                <span class="suggestion-name">${f.text}</span>
                <span class="suggestion-address">${f.place_name || ''}</span>
            </div>
        </div>
    `).join('');
    list.classList.add('show');
}

function hideSuggestions() {
    const list = document.getElementById('suggestions-list');
    if (list) list.classList.remove('show');
}

window.selectSuggestion = async (name, coords) => {
    const input = document.getElementById('destination-input');
    input.value = name;
    hideSuggestions();
    destinationCoords = coords;
    
    // Auto-search when suggestion is selected
    await performSearch(coords);
};

export async function handleSearch() {
    const input = document.getElementById('destination-input');
    const query = input.value.trim();
    if (!query) return;

    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&proximity=73.85,18.52&bbox=73.6,18.3,74.1,18.8`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.features || data.features.length === 0) {
            showToast("Location not found in Pune");
            return;
        }

        const feature = data.features[0];
        await performSearch(feature.center);

    } catch (e) {
        console.error("Search error:", e);
        showToast("Error finding location");
    }
}

async function performSearch(coords) {
    destinationCoords = coords;
    
    // Switch to Nav screen first so the map is ready
    if (window.goTo) window.goTo('screen-nav');

    // Wait a bit for map to be available
    setTimeout(async () => {
        if (window.navMap) {
            if (searchMarker) searchMarker.remove();
            searchMarker = new maplibregl.Marker({ color: '#EF4444' })
                .setLngLat(destinationCoords)
                .addTo(window.navMap);
            
            window.navMap.flyTo({ center: destinationCoords, zoom: 14 });

            // Request route calculation
            if (window.calculateRoute) {
                await window.calculateRoute(destinationCoords);
                
                // Update ETA/Distance UI if available
                if (window.lastRouteData) {
                    const etaEl = document.getElementById('nav-eta');
                    if (etaEl) {
                        etaEl.textContent = `${window.lastRouteData.duration} min (${window.lastRouteData.distance} km) · Hazard Guard Active`;
                    }
                }

                const startBtn = document.getElementById('start-nav-btn');
                if (startBtn) startBtn.classList.add('show');
            }
        }
    }, 500);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('destination-input');
    if (input) {
        input.addEventListener('input', (e) => {
            clearTimeout(suggestionsTimeout);
            suggestionsTimeout = setTimeout(() => fetchSuggestions(e.target.value), 300);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-search-box')) {
                hideSuggestions();
            }
        });
    }
});

export function startDynamicNav() {
    // Transition to active nav state
    document.querySelector('.nav-hint').textContent = "Navigation Started";
    document.getElementById('start-nav-btn').classList.remove('show');
    document.querySelector('.nav-search-box').style.display = 'none';
    
    // In a real app, this would start sensor tracking and pothole detection
    console.log("Starting navigation to:", destinationCoords);
}

window.handleSearch = handleSearch;
window.startDynamicNav = startDynamicNav;
