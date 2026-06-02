// src/components/maps/GoogleMapComponent.jsx
// 🗺️ Placeholder visual - SIN Google Maps API

export default function GoogleMapComponent({ 
  center, 
  zoom,
  markers,
  height = "300px",
  className = ""
}) {
  return (
    <div 
      className={`w-full bg-dark-surface border-2 border-dashed border-dark-border rounded-lg flex items-center justify-center ${className}`}
      style={{ height, minHeight: "200px" }}
    >
      <div className="text-center p-6">
        {/* Icono de ubicación */}
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="w-8 h-8 text-accent" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
        </div>
        
        <h3 className="text-light-text font-bold text-lg mb-2">
          Ubicación del Pedido
        </h3>
        <p className="text-light-text/60 text-sm mb-1">
          Juliaca, Puno - Perú
        </p>
        <p className="text-light-text/40 text-xs mt-3">
          🚚 Delivery disponible en Juliaca y alrededores
        </p>
      </div>
    </div>
  );
}