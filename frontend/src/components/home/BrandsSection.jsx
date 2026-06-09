import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const brands = [
  { name: 'BOSCH', color: 'text-[#E21E26]', font: 'font-extrabold tracking-tight text-2xl' },
  { name: 'MAKITA', color: 'text-[#008795]', font: 'font-black tracking-wide text-xl' },
  { name: 'DEWALT', color: 'text-[#FEBD17]', font: 'font-black italic bg-black px-2 py-0.5 rounded-sm text-lg' },
  { name: 'STANLEY', color: 'text-black', font: 'font-black bg-[#FEBD17] px-2 py-0.5 rounded-sm text-sm' },
  { name: 'TRUPER', color: 'text-[#FF6600]', font: 'font-extrabold tracking-widest text-xl' },
];

export default function BrandsSection() {
  const [scrollRef, setScrollRef] = useState(null);

  const scroll = (direction) => {
    if (scrollRef) {
      const amount = direction === 'left' ? -200 : 200;
      scrollRef.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 bg-dark-surface border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-light-text mb-2">
            Marcas Destacadas
          </h2>
          <p className="text-light-text/60 max-w-2xl mx-auto">
            Trabajamos con los mejores fabricantes para garantizar calidad y durabilidad en cada producto.
          </p>
        </div>

        <div className="relative group">
          {/* Botones de navegación */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-dark-bg border border-dark-border rounded-full text-light-text hover:text-accent hover:border-accent transition opacity-0 group-hover:opacity-100 hidden md:block"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-dark-bg border border-dark-border rounded-full text-light-text hover:text-accent hover:border-accent transition opacity-0 group-hover:opacity-100 hidden md:block"
          >
            <ChevronRight size={20} />
          </button>

          {/* Scroll Container */}
          <div
            ref={setScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {brands.map((brand, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-36 h-20 bg-white rounded-lg flex items-center justify-center snap-center hover:scale-105 transition cursor-pointer border border-transparent hover:border-accent/30 shadow-sm"
              >
                <span className={`${brand.font} ${brand.color}`}>
                  {brand.name}
                </span>
              </div>
            ))}
            <div className="flex-shrink-0 w-32 h-20 bg-dark-bg border border-dashed border-dark-border rounded-lg flex items-center justify-center snap-center">
              <span className="text-light-text/40 text-xs text-center px-2">+ Más marcas</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}