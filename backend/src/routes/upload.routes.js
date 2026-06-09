import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import { verifyToken, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/product', 
  verifyToken, 
  checkRole('ADMIN'),
  upload.single('image'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No hay archivo' });
      }

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'ferrealtiplano/productos',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      });

      res.json({
        success: true,
        imageUrl: result.secure_url,
        publicId: result.public_id
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error subiendo imagen' });
    }
  }
);

export default router;