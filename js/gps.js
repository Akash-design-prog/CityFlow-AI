import { KOTHRUD } from './maps.js';

let homeMarker = null;
let navMarker = null;
let lastLngLat = KOTHRUD;

// Inject pulsing dot CSS
const style = document.createElement('style');
style.textContent = `
    .gps-pulse-container {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .gps-pulse-dot {
        width: 12px;
        height: 12px;
        background: #4F46E5;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
        z-index: 2;
    }
    .gps-pulse-ring {
        position: absolute;
        width: 30px;
        height: 30px;
        background: rgba(79, 70, 229, 0.4);
        border-radius: 50%;
        animation: gps-pulse-anim 2s infinite;
        z-index: 1;
    }
    @keyframes gps-pulse-anim {
        0% { transform: scale(0.5); opacity: 0.8; }
        100% { transform: scale(2.5); opacity: 0; }
    }
`;
document.head.appendChild(style);

function createPulsingElement() {
    const el = document.createElement('div');
    el.className = 'gps-pulse-container';
    el.innerHTML = `
        <div class="gps-pulse-ring"></div>
        <div class="gps-pulse-dot"></div>
    `;
    return el;
}

function createNavUserElement() {
    const el = document.createElement('div');
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.backgroundColor = '#4F46E5';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid #fff';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    return el;
}

function updateMarkers(lngLat) {
    lastLngLat = lngLat;
    window.currentGpsLocation = lngLat; // Global for routing
    
    // Update Home Map Marker
    if (window.homeMap) {
        if (!homeMarker) {
            homeMarker = new maplibregl.Marker({ element: createPulsingElement() })
                .setLngLat(lngLat)
                .addTo(window.homeMap);
        } else {
            homeMarker.setLngLat(lngLat);
        }
    }

    // Update Nav Map Marker
    if (window.navMap) {
        if (!navMarker) {
            navMarker = new maplibregl.Marker({ element: createNavUserElement() })
                .setLngLat(lngLat)
                .addTo(window.navMap);
        } else {
            navMarker.setLngLat(lngLat);
        }
    }
}

export function startGPS() {
    // Initial fallback position
    // We check every 500ms if maps are ready to show the fallback
    const checkInterval = setInterval(() => {
        if (window.homeMap || window.navMap) {
            updateMarkers(lastLngLat);
            // We don't clear interval because we want to catch maps if they are initialized later (e.g. screen switch)
        }
    }, 500);

    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { longitude, latitude } = position.coords;
                updateMarkers([longitude, latitude]);
            },
            (error) => {
                // Silent fallback
                console.log("GPS access denied or error, using fallback.");
                updateMarkers(KOTHRUD);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            }
        );
    } else {
        updateMarkers(KOTHRUD);
    }
}

// Auto-start on load
startGPS();
