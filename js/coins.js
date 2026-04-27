// City Coins Reward System Logic

export function animateCoins() {
    const el = document.getElementById('coins-count');
    const co2Val = document.querySelector('.stat-val:nth-child(2)'); // Target CO2 value in grid
    
    if (!el) return;

    // Calculate real values for demo route
    const dist = 8.1;
    const mode = 'pmpmlBus';
    const co2Kg = window.co2Calc ? window.co2Calc.co2AvoidedKg(mode, dist) : 0.75;
    const finalCoins = window.co2Calc ? window.co2Calc.coinsFor(co2Kg, dist) : 54;

    // Update CO2 text if element exists
    const statsVals = document.querySelectorAll('.stat-val');
    if (statsVals.length >= 2) {
        statsVals[1].textContent = `${co2Kg.toFixed(2)}kg`;
    }

    const startCoins = 1200;
    const targetCoins = startCoins + finalCoins;
    el.textContent = startCoins.toLocaleString();
    
    let v = startCoins;
    const go = () => {
        if (v < targetCoins) {
            v += 1;
            el.textContent = v.toLocaleString();
            requestAnimationFrame(go);
        }
    };
    go();
}

// Listen for screen-complete-active event
window.addEventListener('screen-complete-active', () => {
    setTimeout(animateCoins, 300);
});

window.animateCoins = animateCoins;
