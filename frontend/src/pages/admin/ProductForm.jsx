// src/pages/admin/ProductForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]); // Archivos reales para subir
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: 'Cemento',
    activo: true
  });

  const categorias = ['Cemento', 'Fierro', 'Ladrillos', 'Agregados', 'Plomería', 'Electricidad', 'Pinturas', 'Madera', 'Herramientas', 'Cajas y buzones prefabricados', 'Otros'];

  // Cargar producto si es edición
  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
    return () => {
      // Limpiar previews al desmontar para evitar memory leaks
      previewImages.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`http://localhost:4000/api/products/${id}`);
      const product = data.data;
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        precio: product.precio,
        stock: product.stock,
        categoria: product.categoria,
        activo: product.activo
      });
      // Usar imágenes existentes como previews (URLs de Cloudinary)
      setPreviewImages(product.imagenes || []);
    } catch (err) {
      console.error('Error cargando producto:', err);
      alert('Error cargando producto');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejar selección de imágenes (guarda archivos reales + previews)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar máximo 5 imágenes
    if (previewImages.length + files.length > 5) {
      alert('Máximo 5 imágenes por producto');
      return;
    }
    
    // Validar tipo y tamaño
    const validFiles = files.filter(file => {
      const validType = file.type.startsWith('image/');
      const validSize = file.size <= 5 * 1024 * 1024; // 5MB
      if (!validType) alert(`Archivo no válido: ${file.name}`);
      if (!validSize) alert(`Archivo muy grande: ${file.name}`);
      return validType && validSize;
    });

    // Crear previews para los nuevos archivos
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    // Actualizar estados
    setImageFiles(prev => [...prev, ...validFiles]);
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  // Eliminar imagen del preview y de los archivos
  const removeImage = (index) => {
    // Si es una URL de Cloudinary (edición), solo quitar del preview
    if (previewImages[index]?.startsWith('https://res.cloudinary.com')) {
      setPreviewImages(prev => prev.filter((_, i) => i !== index));
      return;
    }
    
    // Si es un archivo nuevo (blob:), liberar memoria y quitar
    if (previewImages[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(previewImages[index]);
    }
    
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ SUBIR IMÁGENES A CLOUDINARY
  const uploadImagesToCloudinary = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls = [];
    
    try {
      const token = localStorage.getItem('token');
      
      // Subir cada imagen individualmente
      for (const file of imageFiles) {
        const formDataImg = new FormData();
        formDataImg.append('image', file);
        
        const { data } = await axios.post(
          'http://localhost:4000/api/upload/product',
          formDataImg,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (data.success && data.imageUrl) {
          uploadedUrls.push(data.imageUrl);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      alert('Error subiendo imágenes: ' + (error.response?.data?.error || error.message));
      return [];
    } finally {
      setUploading(false);
    }
  };

  // Guardar producto (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // ✅ Paso 1: Subir nuevas imágenes a Cloudinary (si hay)
      let cloudinaryUrls = [];
      
      if (imageFiles.length > 0) {
        cloudinaryUrls = await uploadImagesToCloudinary();
        
        // Si falló la subida y hay archivos, no continuar
        if (cloudinaryUrls.length === 0 && imageFiles.length > 0) {
          throw new Error('No se pudieron subir las imágenes');
        }
      }

      // ✅ Paso 2: Determinar imágenes finales
      let finalImages = [];
      
      if (isEdit) {
        // En edición: mantener imágenes existentes (Cloudinary) + nuevas subidas
        const existingImages = previewImages.filter(img => 
          img && img.startsWith('https://res.cloudinary.com')
        );
        finalImages = [...existingImages, ...cloudinaryUrls];
      } else {
        // Producto nuevo: solo URLs de Cloudinary recién subidas
        finalImages = cloudinaryUrls;
      }

      // ✅ VALIDACIÓN: Verificar que haya al menos una imagen
      if (finalImages.length === 0) {
        throw new Error('Se requiere al menos una imagen del producto');
      }

      // ✅ Paso 3: Preparar datos del producto
      const productData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        categoria: formData.categoria,
        activo: formData.activo,
        imagenes: finalImages // ✅ Array de URLs de Cloudinary
      };

      console.log('📦 Enviando producto:', productData);
      console.log('🖼️ Imágenes a guardar:', finalImages);

      // ✅ Paso 4: Guardar en backend
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (isEdit) {
        await axios.put(`http://localhost:4000/api/products/${id}`, productData, config);
        alert('✅ Producto actualizado exitosamente');
      } else {
        await axios.post('http://localhost:4000/api/products', productData, config);
        alert('✅ Producto creado exitosamente');
      }

      navigate('/admin/productos');
      
    } catch (err) {
      console.error('❌ Error guardando producto:', err);
      alert('Error guardando producto: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-accent mb-6">
        {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-dark-surface border border-dark-border p-6 rounded-xl space-y-6">
        
        {/* Nombre */}
        <div>
          <label className="block text-light-text/80 mb-2 font-medium">Nombre del Producto *</label>
          <input 
            type="text" 
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
            placeholder="Ej: Cemento Sol Tipo I 42.5kg"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-light-text/80 mb-2 font-medium">Descripción</label>
          <textarea 
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={3}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
            placeholder="Descripción del producto..."
          />
        </div>

        {/* Categoría y Precio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-light-text/80 mb-2 font-medium">Categoría *</label>
            <select 
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              required
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
            >
              {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-light-text/80 mb-2 font-medium">Precio (S/) *</label>
            <input 
              type="number" 
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-light-text/80 mb-2 font-medium">Stock Inicial *</label>
          <input 
            type="number" 
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            min="0"
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-light-text focus:outline-none focus:border-accent"
            placeholder="0"
          />
        </div>

        {/* Imágenes */}
        <div>
          <label className="block text-light-text/80 mb-2 font-medium">
            Imágenes del Producto {previewImages.length > 0 && <span className="text-accent">({previewImages.length}/5)</span>}
          </label>
          
          <div className="border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-accent transition cursor-pointer relative bg-dark-bg/50">
            <input 
              type="file" 
              id="imagenes"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={previewImages.length >= 5 || uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <Upload className={`mx-auto h-12 w-12 mb-2 ${uploading ? 'text-accent animate-pulse' : 'text-light-text/40'}`} />
            <p className="text-light-text/60">
              {uploading ? 'Subiendo imágenes...' : 'Arrastra imágenes aquí o haz clic para seleccionar'}
            </p>
            <p className="text-light-text/40 text-sm mt-1">Máximo 5 imágenes • JPG, PNG, WebP • Máx. 5MB</p>
          </div>

          {/* Preview de imágenes */}
          {previewImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {previewImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-dark-border group">
                  <img 
                    src={img} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150/2E2B24/E8A020?text=Error'; }}
                  />
                  {/* Overlay con info */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    {img.startsWith('https://res.cloudinary.com') && (
                      <span className="text-xs text-green-400 bg-dark-bg/80 px-2 py-1 rounded">Cloudinary</span>
                    )}
                  </div>
                  {/* Botón eliminar */}
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                    disabled={uploading}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Mensaje de ayuda */}
          {previewImages.length === 0 && (
            <p className="text-light-text/50 text-xs mt-2 flex items-center gap-1">
              <ImageIcon size={14} /> Sin imágenes seleccionadas
            </p>
          )}
        </div>

        {/* Estado Activo */}
        <div className="flex items-center gap-3 p-4 bg-dark-bg rounded-lg border border-dark-border">
          <input 
            type="checkbox" 
            name="activo"
            id="activo"
            checked={formData.activo}
            onChange={handleChange}
            className="w-5 h-5 rounded border-dark-border text-accent focus:ring-accent bg-dark-bg"
          />
          <label htmlFor="activo" className="text-light-text cursor-pointer">
            Producto activo (visible en el catálogo)
          </label>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-dark-border">
          <button 
            type="submit"
            disabled={loading || uploading}
            className="bg-accent hover:bg-accent-hover text-dark-bg font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(loading || uploading) ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {uploading ? 'Subiendo imágenes...' : 'Guardando...'}
              </>
            ) : (
              isEdit ? 'Actualizar Producto' : 'Crear Producto'
            )}
          </button>
          <button 
            type="button"
            onClick={() => navigate('/admin/productos')}
            disabled={loading || uploading}
            className="bg-dark-bg border border-dark-border hover:border-accent text-light-text font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}