import jwt from 'jsonwebtoken';

/**
 * Verifica que el token JWT sea válido y adjunta el usuario a req.user
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado o formato inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, rol }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
};

/**
 * Middleware para verificar roles permitidos
 * @param {...string} roles - Roles autorizados (ej: 'ADMIN', 'VENDEDOR')
 */
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'Acceso denegado', 
        message: `Rol requerido: ${roles.join(' o ')}` 
      });
    }
    
    next();
  };
};