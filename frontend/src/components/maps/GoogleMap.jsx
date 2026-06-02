import { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: -15.5045,
  lng: -70.1359
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true
};

export default function GoogleMapComponent({ 
  center = defaultCenter, 
  zoom = 15,
  markers = [],
  showDirections = false,
  directions = null,
  onMapClick,
  height = '400px'
}) {
  const [map, setMap] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    if (map) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [center, zoom, map]);

  const onLoad = (mapInstance) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);
  };

  const onUnmount = () => {
    setMap(null);
  };

  const handleMapClick = (e) => {
    if (onMapClick) {
      onMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  };

  return (
    <div style={{ ...mapContainerStyle, height }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        {/* Marcadores personalizados */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            icon={marker.icon}
            title={marker.title}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}

        {/* InfoWindow del marcador seleccionado */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div style={{ padding: '8px', maxWidth: '200px' }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#E8A020' }}>
                {selectedMarker.title}
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                {selectedMarker.address}
              </p>
            </div>
          </InfoWindow>
        )}

        {/* Direcciones (ruta) */}
        {showDirections && directions && (
          <DirectionsRenderer directions={directions} />
        )}
      </GoogleMap>
    </div>
  );
}