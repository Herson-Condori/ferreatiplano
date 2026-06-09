import { Phone, MapPin, Clock, Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-surface border-t border-dark-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Columna 1: Info de la empresa */}
          <div>
            <h3 className="font-display text-2xl font-bold text-accent mb-4">
              FERREA<span className="text-light-text">LTIPLANO</span>
            </h3>
            <p className="text-light-text/70 text-sm mb-4">
              Tu ferretería de confianza en Juliaca. Materiales de construcción de alta calidad al mejor precio.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-light-text/70">
                <MapPin size={18} className="text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">Av. Ilave 1234, Juliaca - Puno</span>
              </div>
              <div className="flex items-center gap-3 text-light-text/70">
                <Phone size={18} className="text-accent flex-shrink-0" />
                <span className="text-sm">+51 942 318 219</span>
              </div>
              <div className="flex items-center gap-3 text-light-text/70">
                <Clock size={18} className="text-accent flex-shrink-0" />
                <span className="text-sm">Lun-Sáb: 8:00 - 19:00</span>
              </div>
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div>
            <h4 className="text-light-text font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-light-text/70">
              <li><a href="/catalogo" className="hover:text-accent transition text-sm">Catálogo de Productos</a></li>
              <li><a href="/cotizador" className="hover:text-accent transition text-sm">Cotizador de Proyectos</a></li>
              <li><a href="/contacto" className="hover:text-accent transition text-sm">Contacto</a></li>
              <li><a href="/perfil" className="hover:text-accent transition text-sm">Mi Cuenta</a></li>
              <li><a href="#" className="hover:text-accent transition text-sm">Términos y Condiciones</a></li>
            </ul>
          </div>

          {/* Columna 3: Categorías */}
          <div>
            <h4 className="text-light-text font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2 text-light-text/70">
              <li><a href="/catalogo?categoria=Cemento" className="hover:text-accent transition text-sm">Cemento</a></li>
              <li><a href="/catalogo?categoria=Fierro" className="hover:text-accent transition text-sm">Fierro</a></li>
              <li><a href="/catalogo?categoria=Ladrillos" className="hover:text-accent transition text-sm">Ladrillos</a></li>
              <li><a href="/catalogo?categoria=Plomería" className="hover:text-accent transition text-sm">Plomería</a></li>
              <li><a href="/catalogo?categoria=Electricidad" className="hover:text-accent transition text-sm">Electricidad</a></li>
            </ul>
          </div>

          {/* Columna 4: Redes Sociales */}
          <div>
            <h4 className="text-light-text font-semibold mb-4">Síguenos</h4>
            <p className="text-light-text/70 text-sm mb-4">
              Conecta con nosotros en redes sociales
            </p>
            <div className="flex gap-3 mb-6">
              <a 
                href="https://facebook.com/ferrealtiplano" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-center text-light-text/70 hover:text-accent hover:border-accent transition"
                title="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com/ferrealtiplano" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-center text-light-text/70 hover:text-accent hover:border-accent transition"
                title="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://youtube.com/@ferrealtiplano" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-center text-light-text/70 hover:text-accent hover:border-accent transition"
                title="YouTube"
              >
                <Youtube size={20} />
              </a>
              <a 
                href="https://wa.me/51942318219" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-600/20 border border-green-600/50 rounded-lg flex items-center justify-center text-green-500 hover:bg-green-600/30 hover:border-green-500 transition"
                title="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
            </div>
            
            {/* Mini mapa placeholder */}
            <div className="w-full h-24 bg-dark-bg rounded-lg border border-dark-border flex items-center justify-center text-light-text/40 text-xs">
              [Google Maps Mini]
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-dark-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-light-text/50 text-sm text-center md:text-left">
              © {currentYear} Ferrealtiplano Juliaca. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-light-text/50">
              <a href="#" className="hover:text-accent transition">Política de Privacidad</a>
              <a href="#" className="hover:text-accent transition">Términos de Uso</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}