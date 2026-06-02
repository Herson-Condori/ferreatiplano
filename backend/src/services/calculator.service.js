// backend/src/services/calculator.service.js

/**
 * Fórmulas y coeficientes de construcción para Perú
 * Basado en estándares del Reglamento Nacional de Edificaciones
 */

// Coeficientes por m² o m³ según tipo de obra
export const MATERIALS_DB = {
  // 🧱 Pared de ladrillo King Kong (e=0.15m)
  pared_ladrillo: {
    unit: 'm²',
    materials: {
      ladrillo_king_kong: { name: 'Ladrillo King Kong 18 huecos', qty: 35, unit: 'unid/m²' },
      cemento: { name: 'Cemento Sol Tipo I 42.5kg', qty: 0.18, unit: 'bolsas/m²' },
      arena_fina: { name: 'Arena Fina para tarrajeo', qty: 0.03, unit: 'm³/m²' },
      mezcla: { name: 'Mezcla para asentado', qty: 0.02, unit: 'm³/m²' }
    }
  },

  // 🏗️ Columna de concreto armado (25x25cm)
  columna: {
    unit: 'm³',
    materials: {
      cemento: { name: 'Cemento Sol Tipo I 42.5kg', qty: 8.5, unit: 'bolsas/m³' },
      arena_chancada: { name: 'Arena Chancada', qty: 0.45, unit: 'm³/m³' },
      piedra_chancada: { name: 'Piedra Chancada 3/4"', qty: 0.85, unit: 'm³/m³' },
      fierro_1_2: { name: 'Fierro Corrugado 1/2" x 9m', qty: 0.15, unit: 'unid/m³' },
      fierro_3_8: { name: 'Fierro Corrugado 3/8" x 9m', qty: 0.45, unit: 'unid/m³' },
      alambre: { name: 'Alambre de Amarre Nº16', qty: 0.3, unit: 'kg/m³' }
    }
  },

  // 🏠 Losa aligerada (espesor 0.20m)
  losa_aligerada: {
    unit: 'm²',
    materials: {
      cemento: { name: 'Cemento Sol Tipo I 42.5kg', qty: 1.2, unit: 'bolsas/m²' },
      arena_chancada: { name: 'Arena Chancada', qty: 0.05, unit: 'm³/m²' },
      piedra_chancada: { name: 'Piedra Chancada 3/4"', qty: 0.09, unit: 'm³/m²' },
      ladrillo_pandereta: { name: 'Ladrillo Pandereta 8 huecos', qty: 11, unit: 'unid/m²' },
      fierro_1_2: { name: 'Fierro Corrugado 1/2" x 9m', qty: 0.08, unit: 'unid/m²' },
      fierro_3_8: { name: 'Fierro Corrugado 3/8" x 9m', qty: 0.25, unit: 'unid/m²' },
      alambre: { name: 'Alambre de Amarre Nº16', qty: 0.15, unit: 'kg/m²' }
    }
  },

  // 🧱 Tarrajeo de pared (e=1.5cm)
  tarrajeo: {
    unit: 'm²',
    materials: {
      cemento: { name: 'Cemento Sol Tipo I 42.5kg', qty: 0.12, unit: 'bolsas/m²' },
      arena_fina: { name: 'Arena Fina para tarrajeo', qty: 0.02, unit: 'm³/m²' }
    }
  },

  // 🪨 Concreto simple (cimentación)
  concreto_simple: {
    unit: 'm³',
    materials: {
      cemento: { name: 'Cemento Sol Tipo I 42.5kg', qty: 6.5, unit: 'bolsas/m³' },
      arena_chancada: { name: 'Arena Chancada', qty: 0.5, unit: 'm³/m³' },
      piedra_chancada: { name: 'Piedra Chancada 3/4"', qty: 0.9, unit: 'm³/m³' }
    }
  }
};

/**
 * Calcular materiales para un tipo de obra
 */
export const calculateMaterials = (projectType, measurements) => {
  const config = MATERIALS_DB[projectType];
  if (!config) {
    throw new Error(`Tipo de proyecto no válido: ${projectType}`);
  }

  // Calcular cantidad base según unidad
  let baseQuantity = 0;
  
  if (config.unit === 'm²') {
    // Para m²: usar área directamente
    baseQuantity = measurements.area || 0;
  } else if (config.unit === 'm³') {
    // Para m³: calcular volumen
    if (measurements.volume) {
      baseQuantity = measurements.volume;
    } else if (measurements.largo && measurements.ancho && measurements.alto) {
      baseQuantity = measurements.largo * measurements.ancho * measurements.alto;
    }
  }

  if (baseQuantity <= 0) {
    throw new Error('Las medidas deben ser mayores a cero');
  }

  // Calcular materiales con desperdicio (10% extra)
  const wasteFactor = 1.10;
  const materials = {};

  for (const [key, spec] of Object.entries(config.materials)) {
    const rawQty = spec.qty * baseQuantity;
    const withWaste = rawQty * wasteFactor;
    
    materials[key] = {
      name: spec.name,
      quantity: Math.ceil(withWaste * 100) / 100, // Redondear a 2 decimales
      unit: spec.unit,
      unitPrice: 0, // Se llenará después con precios de BD
      subtotal: 0
    };
  }

  return {
    projectType,
    unit: config.unit,
    baseQuantity: Math.round(baseQuantity * 100) / 100,
    materials,
    wasteFactor: 10 // 10% de desperdicio incluido
  };
};

/**
 * Calcular costos con precios de la base de datos
 */
export const calculateCosts = async (materials, prisma) => {
  const updatedMaterials = { ...materials };
  let totalCost = 0;

  for (const [key, mat] of Object.entries(materials)) {
    // Buscar producto en BD por nombre (búsqueda aproximada)
    const product = await prisma.producto.findFirst({
      where: {
        nombre: { contains: mat.name, mode: 'insensitive' },
        activo: true
      },
      select: { id: true, nombre: true, precio: true, stock: true }
    });

    if (product) {
      const subtotal = product.precio * mat.quantity;
      updatedMaterials[key] = {
        ...mat,
        productId: product.id,
        unitPrice: product.precio,
        subtotal: Math.round(subtotal * 100) / 100,
        stock: product.stock,
        available: product.stock >= mat.quantity
      };
      totalCost += subtotal;
    } else {
      // Producto no encontrado: usar precio estimado
      const estimatedPrice = getEstimatedPrice(mat.name);
      const subtotal = estimatedPrice * mat.quantity;
      updatedMaterials[key] = {
        ...mat,
        unitPrice: estimatedPrice,
        subtotal: Math.round(subtotal * 100) / 100,
        available: true,
        estimated: true
      };
      totalCost += subtotal;
    }
  }

  return {
    ...updatedMaterials,
    totalCost: Math.round(totalCost * 100) / 100,
    currency: 'PEN'
  };
};

/**
 * Precios estimados para materiales no encontrados en BD
 */
const getEstimatedPrice = (materialName) => {
  const estimates = {
    'Cemento': 24.50,
    'Arena': 45.00,
    'Piedra': 55.00,
    'Fierro': 38.00,
    'Ladrillo': 1.20,
    'Alambre': 8.00
  };

  for (const [key, price] of Object.entries(estimates)) {
    if (materialName.includes(key)) return price;
  }
  return 10.00; // Precio por defecto
};

/**
 * Generar resumen para PDF
 */
export const generateQuoteSummary = (projectData, clientInfo) => {
  return {
    quoteId: `COT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    client: clientInfo,
    project: {
      type: projectData.projectType,
      unit: projectData.unit,
      quantity: projectData.baseQuantity
    },
    materials: projectData.materials,
    totals: {
      subtotal: projectData.totalCost,
      igv: Math.round(projectData.totalCost * 0.18 * 100) / 100,
      total: Math.round(projectData.totalCost * 1.18 * 100) / 100
    },
    notes: [
      'Precios sujetos a cambio sin previo aviso',
      'Despacho sujeto a disponibilidad de stock',
      'Cotización válida por 7 días',
      'Incluye 10% de desperdicio estimado'
    ]
  };
};