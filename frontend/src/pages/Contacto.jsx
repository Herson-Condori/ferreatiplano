// src/pages/Contacto.jsx
import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from 'lucide-react';

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    
    // Simulación de envío (conectar con backend cuando esté listo)
    setTimeout(() => {
      console.log(' Mensaje enviado:', formData);
      setEnviado(true);
      setFormData({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
      setEnviando(false);
      setTimeout(() => setEnviado(false), 5000);
    }, 1000);
  };

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-light-text mb-4">
          Contáctanos
        </h1>
        <p className="text-light-text/70 max-w-2xl mx-auto text-lg">
          ¿Tienes dudas sobre nuestros productos? ¿Necesitas una cotización especial?
          Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Información de Contacto */}
        <div className="space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h2 className="font-display text-xl font-bold text-accent mb-4">
              Información de Contacto
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <MapPin size={20} className="text-accent" />
                </div>
                <div>
                  <p className="font-medium text-light-text">Dirección</p>
                  <p className="text-light-text/60 text-sm">
                    Av. Ilave 1234, Juliaca - Puno
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Phone size={20} className="text-accent" />
                </div>
                <div>
                  <p className="font-medium text-light-text">Teléfono</p>
                  <p className="text-light-text/60 text-sm">+51 942 318 219</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Mail size={20} className="text-accent" />
                </div>
                <div>
                  <p className="font-medium text-light-text">Email</p>
                  <p className="text-light-text/60 text-sm">ventas@ferrealtiplano.pe</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock size={20} className="text-accent" />
                </div>
                <div>
                  <p className="font-medium text-light-text">Horario</p>
                  <p className="text-light-text/60 text-sm">
                    Lun-Sáb: 8:00 - 19:00<br />
                    Domingo: 9:00 - 13:00
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <a 
            href="https://wa.me/51942318219" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 flex items-center gap-4 hover:bg-green-500/20 transition"
          >
            <MessageCircle size={40} className="text-green-400" />
            <div>
              <p className="font-bold text-green-400">Escríbenos por WhatsApp</p>
              <p className="text-green-400/70 text-sm">Respuesta inmediata</p>
            </div>
          </a>
        </div>

        {/* Formulario de Contacto */}
        <div className="lg:col-span-2">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold text-light-text mb-6">
              Envíanos un Mensaje
            </h2>

            {enviado && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6 animate-fadeIn">
                ✅ Mensaje enviado correctamente. Te contactaremos pronto.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-light-text/80 text-sm mb-2">Nombre completo *</label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-light-text/80 text-sm mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-light-text/80 text-sm mb-2">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
                    placeholder="+51 942 318 219"
                  />
                </div>
                <div>
                  <label className="block text-light-text/80 text-sm mb-2">Asunto *</label>
                  <input
                    type="text"
                    name="asunto"
                    required
                    value={formData.asunto}
                    onChange={handleChange}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
                    placeholder="¿Sobre qué quieres consultarnos?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-light-text/80 text-sm mb-2">Mensaje *</label>
                <textarea
                  name="mensaje"
                  required
                  rows={6}
                  value={formData.mensaje}
                  onChange={handleChange}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full md:w-auto bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3 px-8 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {enviando ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar Mensaje
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mapa (opcional) */}
      <div className="mt-12 bg-dark-surface border border-dark-border rounded-xl overflow-hidden h-80">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.123!2d-70.1349!3d-15.4989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDI5JzU2LjAiUyA3MMKwMDgnMDUuNiJX!5e0!3m2!1ses!2spe!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          title="Ubicación FERREALTIPLANO"
        ></iframe>
      </div>
    </div>
  );
}