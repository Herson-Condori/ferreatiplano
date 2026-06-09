import { Link } from 'react-router-dom';
import { Building2, Truck, Shield, Phone, MessageCircle } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      
      {/* 🔥 IMAGEN DE FONDO */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
        }}
      />
      
      {/* Overlay oscuro para que el texto sea legible */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg/95 via-dark-surface/90 to-dark-bg/95" />
      
      {/* Elementos decorativos con gradiente */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />

      {/* Contenido principal */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 mb-8 animate-fadeIn backdrop-blur-sm">
          <Building2 size={18} className="text-accent" />
          <span className="text-accent font-medium text-sm">
            
          </span>
        </div>

        {/* Título principal */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-light-text leading-[1.1] mb-6 animate-fadeIn drop-shadow-2xl">
          MATERIALES DE{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-light">
            ALTA RESISTENCIA
          </span>
          <br />
          PARA TUS OBRAS
        </h1>

        {/* Subtítulo */}
        <p className="text-lg sm:text-xl text-light-text/90 max-w-3xl mx-auto mb-10 leading-relaxed animate-fadeIn drop-shadow-lg">
          Todo lo que necesitas para construcción en Juliaca. Calidad garantizada, 
          precios mayoristas y delivery seguro. 
          <span className="block mt-2 text-light-text font-medium">
            ¡Construye tus sueños con los mejores materiales!
          </span>
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12 animate-fadeIn">
          <Link 
            to="/catalogo" 
            className="group bg-accent hover:bg-accent-hover text-dark-bg font-bold py-4 px-8 rounded-lg transition transform hover:scale-105 flex items-center gap-2 text-lg shadow-xl"
          >
            <Building2 size={22} />
            Ver Catálogo
            <span className="group-hover:translate-x-1 transition">→</span>
          </Link>
          
          <Link 
            to="/cotizador" 
            className="group bg-dark-bg/80 backdrop-blur-sm border-2 border-accent text-accent hover:bg-accent/20 font-bold py-4 px-8 rounded-lg transition flex items-center gap-2 text-lg shadow-xl"
          >
            <Shield size={22} />
            Cotizar Proyecto
          </Link>
        </div>

        {/* Características */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fadeIn">
          <div className="flex flex-col items-center p-6 bg-dark-surface/80 backdrop-blur-sm border border-dark-border/50 rounded-xl hover:border-accent/50 transition shadow-xl">
            <Truck size={32} className="text-accent mb-3" />
            <h3 className="font-display text-lg font-bold text-light-text mb-1">Delivery Rápido</h3>
            <p className="text-light-text/70 text-sm">Entrega en Juliaca y alrededores</p>
          </div>
          
          <div className="flex flex-col items-center p-6 bg-dark-surface/80 backdrop-blur-sm border border-dark-border/50 rounded-xl hover:border-accent/50 transition shadow-xl">
            <Shield size={32} className="text-accent mb-3" />
            <h3 className="font-display text-lg font-bold text-light-text mb-1">Calidad Garantizada</h3>
            <p className="text-light-text/70 text-sm">Materiales certificados</p>
          </div>
          
          <div className="flex flex-col items-center p-6 bg-dark-surface/80 backdrop-blur-sm border border-dark-border/50 rounded-xl hover:border-accent/50 transition shadow-xl">
            <Phone size={32} className="text-accent mb-3" />
            <h3 className="font-display text-lg font-bold text-light-text mb-1">Asesoría Gratis</h3>
            <p className="text-light-text/70 text-sm">Te ayudamos con tu proyecto</p>
          </div>
        </div>


      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <div className="w-6 h-10 border-2 border-light-text/50 rounded-full flex justify-center p-2 backdrop-blur-sm">
          <div className="w-1 h-3 bg-accent rounded-full" />
        </div>
      </div>
    </section>
  );
}