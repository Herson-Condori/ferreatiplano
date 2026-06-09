import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

const faqs = [
  { q: '¿Quiénes somos?', a: 'Somos FERREALTIPLANO, tu ferretería de confianza en Juliaca. Nos especializamos en materiales de construcción de alta calidad, ofreciendo asesoría técnica y precios competitivos para profesionales y hogares.' },
  { q: '¿Cuál es nuestro principal objetivo?', a: 'Brindar una experiencia de compra integral, combinando productos de primera calidad con un servicio ágil, tecnología moderna y entregas seguras en toda la región de Puno.' },
  { q: '¿Qué nos diferencia de la competencia?', a: 'Contamos con stock permanente, sistema de cotización en línea, delivery rápido y un equipo de asesores especializados que te ayudan a calcular materiales exactos para tu obra.' },
  { q: '¿Qué ventajas tiene comprar en Ferrealtiplano?', a: 'Precios mayoristas, garantía en todos los productos, facturación electrónica SUNAT, múltiples métodos de pago y un programa de fidelización para clientes frecuentes.' },
  { q: '¿Puedo realizar un pedido y que se facture con datos de empresa?', a: 'Sí, al finalizar tu compra podrás ingresar tu RUC y razón social. Emitimos boletas y facturas electrónicas válidas ante SUNAT de forma automática.' },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-20 bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Imagen Lateral */}
          <div className="lg:col-span-1 sticky top-24">
            <div className="relative rounded-2xl overflow-hidden border border-dark-border shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80"
                alt="Tienda Online FERREALTIPLANO"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-display text-2xl font-bold text-light-text mb-2">
                  TIENDA ONLINE LÍDER EN FERRETERÍA
                </h3>
                <p className="text-light-text/70 text-sm">
                  Distribución de materiales, herramientas y asesoría técnica especializada.
                </p>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Info className="text-accent" size={24} />
              <h2 className="font-display text-2xl md:text-3xl font-bold text-light-text">
                Preguntas Frecuentes
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-dark-border rounded-xl overflow-hidden bg-dark-surface hover:border-accent/30 transition">
                  <button
                    onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-dark-bg/50 transition"
                  >
                    <span className="font-bold text-light-text pr-4">{faq.q}</span>
                    {openIndex === idx ? (
                      <ChevronUp className="text-accent flex-shrink-0" size={20} />
                    ) : (
                      <ChevronDown className="text-light-text/50 flex-shrink-0" size={20} />
                    )}
                  </button>
                  {openIndex === idx && (
                    <div className="px-5 pb-5 text-light-text/70 leading-relaxed animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}