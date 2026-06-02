import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales para Construmax...');

  // 🔐 1. Usuarios de prueba (contraseña: 123456)
  const hash = await bcrypt.hash('123456', 10);
  
  const [admin, vendedor, cliente] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@construmax.pe' },
      update: {},
      create: {
        nombre: 'Admin Construmax',
        email: 'admin@construmax.pe',
        password: hash,
        rol: 'ADMIN',
        telefono: '999111222',
        direccion: 'Av. Ilave 1234, Juliaca'
      }
    }),
    prisma.user.upsert({
      where: { email: 'vendedor@construmax.pe' },
      update: {},
      create: {
        nombre: 'Vendedor Juliaca',
        email: 'vendedor@construmax.pe',
        password: hash,
        rol: 'VENDEDOR',
        telefono: '987654321'
      }
    }),
    prisma.user.upsert({
      where: { email: 'cliente@test.com' },
      update: {},
      create: {
        nombre: 'Cliente Prueba',
        email: 'cliente@test.com',
        password: hash,
        rol: 'CLIENTE',
        telefono: '912345678',
        direccion: 'Jr. Tacna 567, Juliaca'
      }
    })
  ]);

  // 🧱 2. Productos de ejemplo por categoría
  const productos = [
    // Cemento
    { nombre: 'Cemento Sol Tipo I 42.5kg', descripcion: 'Cemento Portland de alta resistencia para obras generales', precio: '24.50', stock: 350, categoria: 'Cemento', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Cemento+Sol'] },
    { nombre: 'Cemento Andino Tipo V 42.5kg', descripcion: 'Resistente a sulfatos, ideal para cimentaciones', precio: '26.00', stock: 200, categoria: 'Cemento', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Cemento+Andino'] },
    
    // Fierro
    { nombre: 'Fierro Corrugado 1/2" x 9m', descripcion: 'Acero de construcción, grado 60', precio: '38.00', stock: 120, categoria: 'Fierro', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Fierro+1/2'] },
    { nombre: 'Fierro Corrugado 3/8" x 9m', descripcion: 'Acero de construcción, grado 60', precio: '28.50', stock: 180, categoria: 'Fierro', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Fierro+3/8'] },
    
    // Ladrillos
    { nombre: 'Ladrillo King Kong 18 huecos', descripcion: 'Arcilla cocida, medidas estándar 24x13x9cm', precio: '1.20', stock: 5000, categoria: 'Ladrillos', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Ladrillo+KK'] },
    { nombre: 'Ladrillo Pandereta 8 huecos', descripcion: 'Para tabiquería interior, liviano', precio: '0.85', stock: 3000, categoria: 'Ladrillos', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Pandereta'] },
    
    // Plomería
    { nombre: 'PVC Tubo Desagüe 4" x 3m', descripcion: 'Tubería sanitaria, norma ISO', precio: '45.00', stock: 80, categoria: 'Plomería', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=PVC+4'] },
    { nombre: 'Codo PVC 90° 1/2"', descripcion: 'Accesorio para instalaciones de agua fría', precio: '3.50', stock: 200, categoria: 'Plomería', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Codo+PVC'] },
    
    // Electricidad
    { nombre: 'Cable THW 14 AWG (rollo 100m)', descripcion: 'Conductor termoestable, uso residencial', precio: '65.00', stock: 40, categoria: 'Electricidad', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Cable+THW+14'] },
    { nombre: 'Interruptor Termomagnético 20A', descripcion: 'Protección para circuitos monofásicos', precio: '28.00', stock: 60, categoria: 'Electricidad', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Termo+20A'] },
    
    // Herramientas
    { nombre: 'Brocha 4" Profesional', descripcion: 'Cerdas sintéticas, mango ergonómico', precio: '8.50', stock: 150, categoria: 'Herramientas', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Brocha+4'] },
    { nombre: 'Wincha 5m x 19mm', descripcion: 'Cinta métrica con freno automático', precio: '15.00', stock: 90, categoria: 'Herramientas', imagenes: ['https://via.placeholder.com/400x300/2E2B24/E8A020?text=Wincha+5m'] }
  ];

  for (const prod of productos) {
    await prisma.producto.upsert({
      where: { nombre: prod.nombre },
      update: {},
      create: prod
    });
  }

  console.log('✅ Seed completado:');
  console.log(`   • 3 usuarios creados (admin, vendedor, cliente)`);
  console.log(`   • ${productos.length} productos cargados por categoría`);
  console.log(`   • Contraseña de prueba: 123456`);
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });