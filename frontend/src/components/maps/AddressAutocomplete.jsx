import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Loader2 } from 'lucide-react';

export default function AddressAutocomplete({ 
  onAddressSelect, 
  placeholder = 'Buscar dirección...',
  initialValue = ''
}) {
  const [input, setInput] = useState(initialValue);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (input.length < 3) {
        setPredictions([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await axios.post(
          'http://localhost:4000/api/delivery/autocomplete',
          { input }
        );

        if (data.success) {
          setPredictions(data.predictions);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error en autocomplete:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [input]);

  const handleSelect = (prediction) => {
    setInput(prediction.description);
    setPredictions([]);
    setShowDropdown(false);
    
    if (onAddressSelect) {
      onAddressSelect(prediction);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/50" size={18} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-10 py-3 text-light-text focus:outline-none focus:border-accent"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-accent" size={18} />
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <button
              key={index}
              onClick={() => handleSelect(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-dark-bg transition border-b border-dark-border last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-accent mt-1 flex-shrink-0" />
                <div>
                  <p className="text-light-text text-sm">{prediction.description}</p>
                  {prediction.structured_formatting && (
                    <p className="text-light-text/50 text-xs mt-1">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Cerrar dropdown al hacer clic fuera */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}