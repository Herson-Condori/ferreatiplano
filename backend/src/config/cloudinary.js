import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const verifyCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary conectado');
    return true;
  } catch (error) {
    console.error('❌ Error Cloudinary:', error.message);
    return false;
  }
};

export default cloudinary;