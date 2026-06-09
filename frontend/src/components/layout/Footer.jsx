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
                className="w-10 h-10 bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-lg flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition shadow-sm"
                title="Facebook"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/ferrealtiplano" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#E1306C]/10 border border-[#E1306C]/20 rounded-lg flex items-center justify-center text-[#E1306C] hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#D62976] hover:to-[#962FBF] hover:text-white hover:border-transparent transition shadow-sm"
                title="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://youtube.com/@ferrealtiplano" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-lg flex items-center justify-center text-[#FF0000] hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] transition shadow-sm"
                title="YouTube"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.53 12 3.53 12 3.53s-7.53 0-9.388.525A3.003 3.003 0 0 0 .502 6.163C0 8.04 0 12 0 12s0 3.96.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.47 20.47 12 20.47 12 20.47s7.53 0 9.388-.525a3.003 3.003 0 0 0 2.11-2.108C24 15.96 24 12 24 12s0-3.96-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/51942318219" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition shadow-sm"
                title="WhatsApp"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.66.986 3.298 1.448 4.799 1.449 5.023 0 9.076-4.053 9.079-9.08.002-2.435-.949-4.72-2.678-6.45-1.73-1.73-4.015-2.682-6.45-2.684-5.023 0-9.077 4.053-9.08 9.08-.001 1.7.464 3.303 1.349 4.673l-.995 3.637 3.73-.977zm10.334-5.836c-.27-.135-1.602-.79-1.85-.882-.249-.09-.43-.135-.61.135-.18.27-.7 1.095-.882 1.35-.18.256-.36.29-.63.15-.27-.135-1.14-.42-2.172-1.34-.803-.717-1.346-1.603-1.503-1.872-.157-.27-.017-.417.118-.552.122-.121.27-.315.405-.472.135-.157.18-.27.27-.45.09-.18.045-.337-.023-.472-.067-.135-.61-1.47-.837-2.013-.22-.53-.44-.457-.61-.466-.157-.008-.337-.008-.517-.008-.18 0-.472.067-.72.337-.249.27-.95 1.095-.95 2.67 0 1.575 1.147 3.1 1.305 3.3.158.2 2.257 3.447 5.468 4.83.764.33 1.36.527 1.824.674.767.243 1.467.21 2.02.128.618-.092 1.602-.655 1.83-1.285.228-.63.228-1.17.16-1.285-.07-.113-.25-.203-.52-.338z"/>
                </svg>
              </a>
            </div>
            
            {/* Mini mapa real */}
            <div className="w-full h-24 bg-dark-bg rounded-lg border border-dark-border overflow-hidden shadow-inner">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.123!2d-70.1349!3d-15.4989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDI5JzU2LjAiUyA3MMKwMDgnMDUuNiJX!5e0!3m2!1ses!2spe!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen=""
                loading="lazy"
                title="Ubicación FERREALTIPLANO"
              ></iframe>
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