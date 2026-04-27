// Map logic using MapLibre GL JS and MapTiler
import { MAPTILER_KEY } from './config.js';

export const KOTHRUD   = [73.8077, 18.5074]; // [lng, lat]
export const HINJEWADI = [73.7389, 18.5912]; // [lng, lat]
export const HAZARD_PT = [73.7638, 18.5904]; // [lng, lat]

let homeMap = null;
let navMap = null;

export async function fetchRoute(start, end, waypoints = []) {
    let points = `${start[0]},${start[1]}`;
    if (waypoints.length > 0) {
        points += ';' + waypoints.map(w => `${w[0]},${w[1]}`).join(';');
    }
    points += `;${end[0]},${end[1]}`;

    const url = `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&annotations=true`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Store metadata for UI updates
        window.lastRouteData = {
            distance: (route.distance / 1000).toFixed(1), // km
            duration: Math.round(route.duration / 60) // mins
        };
        return route.geometry;
    }
    throw new Error("No route found");
}

export async function initHomeMap() {
    if (homeMap) return;
    homeMap = new maplibregl.Map({
        container: 'home-map',
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
        center: [73.7700, 18.5500],
        zoom: 12,
        interactive: false,
        attributionControl: false
    });

    homeMap.on('load', async () => {
        new maplibregl.Marker({ color: '#4F46E5' }).setLngLat(KOTHRUD).addTo(homeMap);
        new maplibregl.Marker({ color: '#22C55E' }).setLngLat(HINJEWADI).addTo(homeMap);

        try {
            const geojson = await fetchRoute(KOTHRUD, HINJEWADI);
            homeMap.addSource('route', { type: 'geojson', data: geojson });
            homeMap.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#4F46E5', 'line-width': 4, 'line-opacity': 0.8 }
            });

            const coordinates = geojson.coordinates;
            const bounds = coordinates.reduce((acc, coord) => acc.extend(coord), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
            homeMap.fitBounds(bounds, { padding: 20 });
        } catch (e) {
            console.error("Home route error:", e);
        }
    });
}

export async function initNavMap() {
    if (navMap) return;
    navMap = new maplibregl.Map({
        container: 'nav-map',
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
        center: [73.7820, 18.5280],
        zoom: 14,
        attributionControl: false
    });

    navMap.on('load', async () => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = `<div style="background:#DC2626;color:#fff;font-size:13px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-weight:700;">!</div>`;
        
        new maplibregl.Marker(el)
            .setLngLat(HAZARD_PT)
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('Pothole cluster · Wakad Chowk'))
            .addTo(navMap);

        // Remove hardcoded route logic. Route is now drawn dynamically via search.js -> calculateRoute()
    });
}

export async function calculateRoute(destinationCoords) {
    if (!navMap) return;

    // Use KOTHRUD as current location if GPS not available
    const start = window.currentGpsLocation || KOTHRUD;

    try {
        const geojson = await fetchRoute(start, destinationCoords);
        
        if (navMap.getSource('route')) {
            navMap.getSource('route').setData(geojson);
        } else {
            navMap.addSource('route', { type: 'geojson', data: geojson });
            navMap.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#6366F1', 'line-width': 5, 'line-opacity': 0.9 }
            });
        }

        // Update ETA/Distance (Mocking based on distance for now or using OSRM data)
        // OSRM fetchRoute would need to be updated to return distance/duration
        // For now, let's keep it simple or update fetchRoute
        
        const bounds = geojson.coordinates.reduce((acc, coord) => acc.extend(coord), new maplibregl.LngLatBounds(geojson.coordinates[0], geojson.coordinates[0]));
        navMap.fitBounds(bounds, { padding: 100 });

    } catch (e) {
        console.error("Route calculation error:", e);
    }
}

window.calculateRoute = calculateRoute;

// Event listeners for screen changes
window.addEventListener('screen-home-active', () => {
    console.log("Home screen active, initializing map...");
    setTimeout(initHomeMap, 100);
});

window.addEventListener('screen-nav-active', () => {
    console.log("Nav screen active, initializing map...");
    setTimeout(initNavMap, 100);
});

window.addEventListener('resize', () => {
    if (homeMap) homeMap.resize();
    if (navMap) navMap.resize();
});

console.log("Maps module loaded");
