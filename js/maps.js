// Map logic using MapLibre GL JS and MapTiler
import { MAPTILER_KEY } from './config.js';

export let currentUserLocation = [73.8567, 18.5204]; // Default Pune center until GPS kicks in
export const HAZARD_PT = [73.7638, 18.5904]; // [lng, lat]

let homeMap = null;
let navMap = null;
let userMarkerHome = null;
let userMarkerNav = null;

// Function to get current location
export function updateCurrentLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            currentUserLocation = [position.coords.longitude, position.coords.latitude];
            console.log("Updated location:", currentUserLocation);
            
            // Update markers if maps are already loaded
            if (userMarkerHome) userMarkerHome.setLngLat(currentUserLocation);
            if (userMarkerNav) userMarkerNav.setLngLat(currentUserLocation);
            
            // Re-center home map if it exists
            if (homeMap) homeMap.setCenter(currentUserLocation);
        }, (error) => {
            console.error("Geolocation error:", error);
            // Fallback to Wagholi if user denies permission
            currentUserLocation = [73.9782, 18.5808]; 
        });
    }
}

// Call location update immediately
updateCurrentLocation();

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
        center: currentUserLocation,
        zoom: 14,
        interactive: false,
        attributionControl: false
    });

    homeMap.on('load', async () => {
        userMarkerHome = new maplibregl.Marker({ color: '#4F46E5' })
            .setLngLat(currentUserLocation)
            .addTo(homeMap);
    });
    window.homeMap = homeMap;
}

export async function initNavMap() {
    if (navMap) return;
    navMap = new maplibregl.Map({
        container: 'nav-map',
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
        center: currentUserLocation,
        zoom: 15,
        attributionControl: false
    });
    window.navMap = navMap;

    navMap.on('load', async () => {
        // Add user location marker
        userMarkerNav = new maplibregl.Marker({ color: '#4F46E5' })
            .setLngLat(currentUserLocation)
            .addTo(navMap);

        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = `<div style="background:#DC2626;color:#fff;font-size:13px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-weight:700;">!</div>`;
        
        new maplibregl.Marker(el)
            .setLngLat(HAZARD_PT)
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('Pothole cluster · Wakad Chowk'))
            .addTo(navMap);

        // Remove hardcoded route logic. Route is now drawn dynamically via search.js -> calculateRoute()
    });
    window.navMap = navMap;
}

export async function calculateRoute(destinationCoords) {
    if (!navMap) return;

    // Use live location as start point
    const start = currentUserLocation;

    // Update user marker position if it exists
    if (userMarkerNav) userMarkerNav.setLngLat(start);

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
window.initHomeMap = initHomeMap;
window.initNavMap = initNavMap;

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
