import { Zap, Clock, Award, Shield } from 'lucide-react';

export default function FeaturedProduct() {
  return (
    <section className="py-20 bg-dark-surface border-y border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Imagen del Producto */}
          <div className="relative group">
            <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-xl group-hover:bg-accent/10 transition" />
            <img
              src="https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80"
              alt="Tronzadora Profesional"
              className="relative w-full h-auto rounded-2xl border border-dark-border object-cover shadow-2xl"
            />
          </div>

          {/* Contenido */}
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full border border-accent/30">
              ⭐ Producto Destacado del Mes
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-light-text leading-tight">
              TRONZADORA DE SIERRA DE CINTA BF-180SM
            </h2>
            <p className="text-light-text/70 text-lg">
              ¡Domina los cortes como nunca antes! Potencia y precisión en cada ángulo para profesionales exigentes.
            </p>

            {/* Características */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                { icon: <Zap size={20} />, title: 'Potencia y Precisión', desc: 'Cabezal giratorio 0-60° para cortes múltiples' },
                { icon: <Clock size={20} />, title: 'Ahorra Tiempo', desc: 'Mordaza de acción rápida y sujeción firme' },
                { icon: <Award size={20} />, title: 'Cortes Perfectos', desc: 'Guía de hoja con rodamientos de bolas' },
                { icon: <Shield size={20} />, title: 'Máxima Seguridad', desc: 'Interruptor de emergencia y protección CE' },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent flex-shrink-0">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-light-text text-sm">{feat.title}</h4>
                    <p className="text-light-text/60 text-xs mt-1">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2">
                Ver Detalles Completo
              </button>
              <button className="border-2 border-dark-border hover:border-accent text-light-text hover:text-accent font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2">
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}