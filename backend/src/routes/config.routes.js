import { Router } from 'express';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, '../../config.json');

// Obtener configuración (Público)
router.get('/', async (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return res.json({ success: true, data: JSON.parse(data) });
    }
    
    // Configuración por defecto
    const defaultConfig = {
      store: {
        nombre: 'FERREALTIPLANO',
        ruc: '20601234567',
        direccion: 'Av. Ilave 1234, Juliaca - Puno',
        telefono: '+51 942 318 219',
        email: 'ventas@ferrealtiplano.pe',
        logo: '/logo.png',
        favicon: '/favicon.svg'
      },
      delivery: {
        costoBase: 5.00,
        costoPorKm: 2.00,
        radioGratisKm: 3,
        limiteMaximoKm: 15,
        habilitado: true
      },
      payments: {
        yape: true,
        plin: true,
        culqi: false,
        contraEntrega: true
      },
      alerts: {
        umbralStockBajo: 50,
        emailNotificaciones: true,
        whatsappNotificaciones: false
      }
    };
    
    res.json({ success: true, data: defaultConfig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar configuración (solo ADMIN)
router.put('/', verifyToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const configData = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2), 'utf8');
    res.json({ success: true, message: 'Configuración guardada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
