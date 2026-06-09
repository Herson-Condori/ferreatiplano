// src/pages/auth/RegisterForm.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Eye, EyeOff, Loader2, Building2, CheckCircle } from 'lucide-react';

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUser, loading, error, clearError } = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones frontend
    if (formData.password !== formData.confirmPassword) {
      clearError();
      return alert('Las contraseñas no coinciden');
    }
    
    if (formData.password.length < 6) {
      clearError();
      return alert('La contraseña debe tener al menos 6 caracteres');
    }

    const result = await registerUser({
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
      telefono: formData.telefono,
      direccion: formData.direccion
    });

    if (result.success) {
      setSuccess(true);
      // Redirigir a login después de 2 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: '✅ Registro exitoso. Ahora puedes iniciar sesión.' 
          } 
        });
      }, 2000);
    }
  };

  // Si el registro fue exitoso, mostrar mensaje
  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-dark-surface border border-dark-border rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-accent mb-2">
            ¡Registro Exitoso!
          </h2>
          <p className="text-light-text/70 mb-4">
            Tu cuenta ha sido creada correctamente.
          </p>
          <p className="text-light-text/50 text-sm">
            Redirigiendo al login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-dark-surface border border-dark-border rounded-xl p-8 shadow-2xl">
        
        {/* Logo y título */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-accent" />
          </div>
          <h2 className="font-display text-3xl font-bold text-light-text">
            FERREA<span className="text-accent">TIPLANO</span>
          </h2>
          <p className="mt-2 text-light-text/70">
            Crea tu cuenta para comprar
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Formulario de registro */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-light-text/80 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text placeholder-light-text/40 focus:outline-none focus:border-accent transition"
              placeholder="Juan Pérez"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-light-text/80 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text placeholder-light-text/40 focus:outline-none focus:border-accent transition"
              placeholder="tu@email.com"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-light-text/80 mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text placeholder-light-text/40 focus:outline-none focus:border-accent transition"
              placeholder="942 318 219"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-light-text/80 mb-1">
              Dirección (opcional)
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text placeholder-light-text/40 focus:outline-none focus:border-accent transition"
              placeholder="Av. Ejemplo 123, Juliaca"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-light-text/80 mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 pr-10 text-light-text placeholder-light-text/40 focus:outline-none focus:border-accent transition"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text/50 hover:text-light-text transition"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-sm font-medium text-light-text/80 mb-1">
              Confirmar contraseña *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 pr-10 text-light-text placeholder-light-text/40 focus:outline-none focus:border-accent transition"
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text/50 hover:text-light-text transition"
                tabIndex="-1"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Términos */}
          <div className="flex items-start gap-2 text-sm">
            <input type="checkbox" required className="mt-1 rounded border-dark-border text-accent focus:ring-accent bg-dark-bg" />
            <span className="text-light-text/70">
              Acepto los <a href="#" className="text-accent hover:underline">Términos y Condiciones</a> y la <a href="#" className="text-accent hover:underline">Política de Privacidad</a>
            </span>
          </div>

          {/* Botón de registro */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Registrando...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Link a login */}
        <div className="text-center">
          <p className="text-light-text/70 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent hover:text-accent-light font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}