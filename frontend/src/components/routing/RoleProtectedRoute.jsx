import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Componente para proteger rutas por rol
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a renderizar si tiene acceso
 * @param {string[]} props.requiredRoles - Roles permitidos (ej: ['ADMIN'])
 * @param {string} [props.redirectTo] - Ruta de redirección si no tiene acceso (default: '/')
 */
export default function RoleProtectedRoute({ 
  children, 
  requiredRoles, 
  redirectTo = '/' 
}) {
  const { isAuthenticated, hasRole, loading } = useAuthStore();
  const location = useLocation();

  // Mientras verifica autenticación desde storage
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-accent font-display text-xl">Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login guardando la ruta original
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si no tiene el rol requerido, redirigir
  if (!hasRole(...requiredRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Acceso concedido
  return children;
}