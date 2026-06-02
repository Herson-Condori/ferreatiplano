// backend/src/config/culqi.js
import Culqi from 'culqi-node';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.CULQI_SECRET_KEY;

// Solo inicializar si existe la clave (modo desarrollo sin Culqi)
let culqiInstance = null;

if (SECRET_KEY && SECRET_KEY !== 'sk_test_xxxxxxxxxxxxxx') {
  try {
    culqiInstance = new Culqi({
      private_key: SECRET_KEY
    });
    console.log('✅ Culqi configurado correctamente');
  } catch (error) {
    console.warn('⚠️  Error inicializando Culqi:', error.message);
  }
} else {
  console.warn('⚠️  CULQI_SECRET_KEY no configurada - Pagos con tarjeta DESHABILITADOS');
  console.warn('📝 Para habilitar: Agrega CULQI_SECRET_KEY en backend/.env');
}

export default culqiInstance;