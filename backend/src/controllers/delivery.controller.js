import { 
  geocodeAddress, 
  calculateDistance, 
  calculateDeliveryCost,
  isWithinJuliaca 
} from '../services/maps.service.js';

// Coordenadas de la tienda Construmax (Juliaca)
const STORE_LOCATION = {
  lat: -15.5045,
  lng: -70.1359,
  address: 'Av. Ilave 1234, Juliaca, Puno'
};

/**
 * Calcular delivery para una dirección
 */
export const calculateDelivery = async (req, res) => {
  try {
    const { address, lat, lng } = req.body;

    if (!address && (!lat || !lng)) {
      return res.status(400).json({ error: 'Se requiere dirección o coordenadas' });
    }

    let targetLat = lat;
    let targetLng = lng;
    let formattedAddress = address;

    // Si no hay coordenadas, geocodificar la dirección
    if (!targetLat || !targetLng) {
      const geocodeResult = await geocodeAddress(address);
      
      if (!geocodeResult.success) {
        return res.status(400).json({ error: geocodeResult.error });
      }

      targetLat = geocodeResult.lat;
      targetLng = geocodeResult.lng;
      formattedAddress = geocodeResult.formattedAddress;
    }

    // Verificar si está dentro de Juliaca
    if (!isWithinJuliaca(targetLat, targetLng)) {
      return res.status(400).json({ 
        error: 'Dirección fuera de la zona de cobertura de delivery',
        withinZone: false
      });
    }

    // Calcular distancia desde la tienda
    const distanceResult = await calculateDistance(
      STORE_LOCATION.lat,
      STORE_LOCATION.lng,
      targetLat,
      targetLng
    );

    if (!distanceResult.success) {
      return res.status(400).json({ error: distanceResult.error });
    }

    // Calcular costo
    const distanceKm = distanceResult.distanceMeters / 1000;
    const costResult = calculateDeliveryCost(distanceKm);

    if (!costResult.success) {
      return res.status(400).json({ error: costResult.error });
    }

    res.json({
      success: true,
      data: {
        address: formattedAddress,
        coordinates: { lat: targetLat, lng: targetLng },
        distance: distanceResult.distanceText,
        distanceKm: costResult.distanceKm,
        duration: distanceResult.durationText,
        deliveryCost: costResult.cost,
        isFree: costResult.cost === 0,
        storeLocation: STORE_LOCATION
      }
    });

  } catch (error) {
    console.error('Error calculando delivery:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Verificar zona de cobertura
 */
export const checkDeliveryZone = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Se requieren coordenadas' });
    }

    const withinZone = isWithinJuliaca(parseFloat(lat), parseFloat(lng));

    res.json({
      success: true,
      data: {
        withinZone,
        storeLocation: STORE_LOCATION,
        maxDistanceKm: process.env.DELIVERY_MAX_KM || 15
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener información de la tienda
 */
export const getStoreInfo = (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Construmax',
      address: STORE_LOCATION.address,
      coordinates: STORE_LOCATION,
      phone: '+51 942 318 219',
      hours: 'Lun-Sáb: 8:00 - 19:00',
      deliveryInfo: {
        baseCost: process.env.DELIVERY_BASE_COST || 5.00,
        costPerKm: process.env.DELIVERY_PER_KM || 2.00,
        freeDeliveryKm: process.env.DELIVERY_FREE_KM || 3,
        maxDeliveryKm: process.env.DELIVERY_MAX_KM || 15
      }
    }
  });
};