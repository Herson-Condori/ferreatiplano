// backend/src/services/maps.service.js

// Modo desarrollo SIN Google Maps API
// Las funciones retornan valores por defecto

export const geocodeAddress = async (address) => {
  console.warn('⚠️  Google Maps no configurado - Usando coordenadas por defecto');
  // Coordenadas de Juliaca por defecto
  return {
    success: true,
    lat: -15.5045,
    lng: -70.1359,
    formattedAddress: address || 'Juliaca, Puno, Perú'
  };
};

export const calculateDistance = async (originLat, originLng, destLat, destLng) => {
  console.warn('⚠️  Google Maps no configurado - Distancia estimada');
  // Distancia estimada de 5 km
  return {
    success: true,
    distanceMeters: 5000,
    distanceText: '5.0 km',
    durationMinutes: 15,
    durationText: '15 mins'
  };
};

export const calculateDeliveryCost = (distanceKm) => {
  const baseCost = 5.00;
  const costPerKm = 2.00;
  const freeKm = 3;
  
  let cost = baseCost;
  if (distanceKm <= freeKm) {
    cost = 0; // Gratis si está cerca
  } else {
    cost = baseCost + ((distanceKm - freeKm) * costPerKm);
  }
  
  return {
    success: true,
    cost: Math.round(cost * 100) / 100,
    distanceKm: Math.round(distanceKm * 100) / 100
  };
};

export const isWithinJuliaca = (lat, lng) => {
  // Siempre retorna true en modo desarrollo
  return true;
};

export const reverseGeocode = async (lat, lng) => {
  return {
    success: true,
    formattedAddress: 'Juliaca, Puno, Perú'
  };
};

export const autocompleteAddress = async (input) => {
  // Sin autocomplete en modo desarrollo
  return {
    success: true,
    predictions: []
  };
};