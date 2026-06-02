// frontend/src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const message = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    const result = await login(email, password);
    
    if (result.success) {
      const user = useAuthStore.getState().user;
      
      // Redirección según rol
      if (user?.rol === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user?.rol === 'VENDEDOR') {
        navigate('/vendedor', { replace: true });
      } else {
        navigate(from === '/login' ? '/perfil' : from, { replace: true });
      }
    }
  };

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
            Inicia sesión para continuar
          </p>
        </div>

        {/* Mensaje de éxito (desde registro) */}
        {message && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm text-center animate-fadeIn">
            {message}
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center animate-fadeIn">
            {error}
          </div>
        )}

        {/* Formulario de login */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light-text/80 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text placeholder-light-text/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                placeholder="tu@email.com"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-light-text/80 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 pr-10 text-light-text placeholder-light-text/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                  placeholder="••••••••"
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
          </div>

          {/* Botón de login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Cargando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        {/* Link a registro */}
        <div className="text-center pt-4 border-t border-dark-border">
          <p className="text-light-text/70 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-accent hover:text-accent-light font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Info de roles */}
        <div className="text-center text-xs text-light-text/40">
          <p>👤 Clientes: registro público</p>
          <p>👨‍💼 Vendedores/Admin: contacto con soporte</p>
        </div>
      </div>
    </div>
  );
}