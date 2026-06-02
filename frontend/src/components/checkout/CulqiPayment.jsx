import { useEffect, useRef } from 'react';

export default function CulqiPayment({ amount, onToken, onError }) {
  const culqiRef = useRef(null);

  useEffect(() => {
    // Cargar script de Culqi dinámicamente
    const script = document.createElement('script');
    script.src = 'https://checkout.culqi.com/js/v3';
    script.async = true;
    script.onload = () => {
      if (window.Culqi) {
        culqiRef.current = window.Culqi.setup({
          id: import.meta.env.VITE_CULQI_PUBLIC_KEY,
          title: 'Construmax Juliaca',
          description: 'Pago de materiales de construcción',
          currency: 'PEN',
          amount: Math.round(amount * 100), // Culqi usa céntimos
          callback: (response) => {
            if (response.error) {
              onError(response.error.user_message);
            } else if (response.token) {
              onToken(response.token.id);
            }
          },
          settings: {
            title: 'Construmax',
            currency: 'PEN',
            description: 'Pago seguro con tarjeta',
            amount: Math.round(amount * 100)
          }
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [amount, onToken, onError]);

  const handlePay = () => {
    if (culqiRef.current) {
      culqiRef.current.open();
    } else {
      onError('Cargando pasarela de pago...');
    }
  };

  return (
    <button
      type="button"
      onClick={handlePay}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.92.66 1.97 1.64h1.79c-.05-1.34-.87-2.57-2.49-2.97V5h-1.6v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.4c.1 1.7 1.36 2.66 2.86 2.97V19h1.6v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.69-3.42z"/>
      </svg>
      Pagar con Tarjeta (Culqi)
    </button>
  );
}