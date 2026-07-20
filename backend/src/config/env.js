import dotenv from 'dotenv';

dotenv.config();

/**
 * Validación de variables de entorno requeridas
 */
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Faltan variables de entorno requeridas:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n📝 Por favor, configura estas variables en backend/.env');
  console.error('💡 Puedes usar backend/.env.example como plantilla\n');
  
  // No detener la app en desarrollo si falta alguna variable no crítica
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export default {
  // General
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 4000,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // Culqi
  CULQI_SECRET_KEY: process.env.CULQI_SECRET_KEY,
  
  // Nubefact
  NUBEFACT_API_URL: process.env.NUBEFACT_API_URL || 'https://api.nubefact.com/v1',
  NUBEFACT_API_TOKEN: process.env.NUBEFACT_API_TOKEN,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
