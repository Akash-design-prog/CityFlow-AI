// India-specific emission factors (g CO2 per km)
export const EMISSION_FACTORS = { 
  petrolCar: 121, 
  dieselSUV: 171, 
  twoWheeler: 41, 
  autoRickshaw: 84, 
  pmpmlBus: 28, 
  metro: 22, 
  eBike: 11, 
  walk: 0, 
  cycle: 0 
}; 

/**
 * Calculates CO2 avoided in kilograms compared to a baseline petrol car
 * @param {string} chosenMode - The mode of transport selected
 * @param {number} distanceKm - Distance traveled in kilometers
 * @returns {number} CO2 avoided in kg
 */
export function co2AvoidedKg(chosenMode, distanceKm) {
  const baseline = EMISSION_FACTORS.petrolCar;
  const chosen = EMISSION_FACTORS[chosenMode] || 0;
  return ((baseline - chosen) * distanceKm) / 1000;
}

/**
 * Calculates coins earned based on CO2 avoided and distance
 * @param {number} co2Kg - CO2 avoided in kg
 * @param {number} distanceKm - Distance traveled in km
 * @returns {number} Rounded coin amount
 */
export function coinsFor(co2Kg, distanceKm) {
  return Math.round(co2Kg * 50) + Math.round(distanceKm * 2);
}

// Global exposure for non-module script access if needed
window.co2Calc = {
  co2AvoidedKg,
  coinsFor,
  EMISSION_FACTORS
};
