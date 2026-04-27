// Pothole Detection logic (Simulated for Tier 1)

export function showHazard() {
    document.getElementById('hazard-overlay').classList.add('show');
    document.getElementById('status-dot').className = 'dot red';
    document.getElementById('status-text').textContent = 'Hazard Detected!';
    document.getElementById('nav-delayed').style.display = 'block';
}

export function dismissHazard() {
    document.getElementById('hazard-overlay').classList.remove('show');
    document.getElementById('status-dot').className = 'dot green';
    document.getElementById('status-text').textContent = 'Re-routing...';
    document.getElementById('nav-delayed').style.display = 'none';
    setTimeout(() => {
        document.getElementById('status-text').textContent = 'Hazard Guard Active';
    }, 2000);
}

// Global exposure for demo buttons
window.showHazard = showHazard;
window.dismissHazard = dismissHazard;
