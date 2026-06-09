// src/pages/admin/SettingsPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Store, Truck, CreditCard, Bell, Shield, Save, RotateCcw, 
  Eye, EyeOff, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Estados de configuración
  const [storeConfig, setStoreConfig] = useState({
    nombre: 'FERREALTIPLANO',
    ruc: '20601234567',
    direccion: 'Av. Ilave 1234, Juliaca - Puno',
    telefono: '+51 942 318 219',
    email: 'ventas@ferrealtiplano.pe',
    logo: '/logo.png'
  });

  const [deliveryConfig, setDeliveryConfig] = useState({
    costoBase: 5.00,
    costoPorKm: 2.00,
    radioGratisKm: 3,
    limiteMaximoKm: 15,
    habilitado: true
  });

  const [paymentConfig, setPaymentConfig] = useState({
    yape: true,
    plin: true,
    culqi: false, // Deshabilitado por defecto hasta configurar keys
    contraEntrega: true
  });

  const [alertConfig, setAlertConfig] = useState({
    umbralStockBajo: 50,
    emailNotificaciones: true,
    whatsappNotificaciones: false
  });

  const [securityConfig, setSecurityConfig] = useState({
    modoMantenimiento: false,
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Cargar configuración desde backend (opcional)
  useEffect(() => {
    // fetchConfig(); // Descomentar cuando el backend esté listo
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      // Aquí enviarías todas las configuraciones al backend
      await axios.put('http://localhost:4000/api/config', {
        store: storeConfig,
        delivery: deliveryConfig,
        payments: paymentConfig,
        alerts: alertConfig,
        security: { modoMantenimiento: securityConfig.modoMantenimiento }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('✅ Configuración guardada correctamente');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error guardando config:', err);
      // Para demo: guardamos en localStorage
      localStorage.setItem('ferrealtiplano_config', JSON.stringify({
        store: storeConfig, delivery: deliveryConfig, payments: paymentConfig, alerts: alertConfig
      }));
      setSuccessMsg('✅ Guardado localmente (modo demo)');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (securityConfig.newPassword !== securityConfig.confirmNewPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:4000/api/auth/change-password', {
        oldPassword: securityConfig.oldPassword,
        newPassword: securityConfig.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Contraseña actualizada correctamente');
      setSecurityConfig({...securityConfig, oldPassword: '', newPassword: '', confirmNewPassword: ''});
    } catch (err) {
      alert('Error actualizando contraseña');
    }
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button 
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? 'bg-accent' : 'bg-dark-border'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const tabs = [
    { id: 'store', icon: Store, label: 'Tienda' },
    { id: 'delivery', icon: Truck, label: 'Delivery' },
    { id: 'payments', icon: CreditCard, label: 'Pagos' },
    { id: 'alerts', icon: Bell, label: 'Alertas' },
    { id: 'security', icon: Shield, label: 'Seguridad' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-light-text">Configuración del Sistema</h1>
          <p className="text-light-text/60 text-sm">Administra parámetros globales de la tienda</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-accent text-dark-bg font-bold rounded-lg hover:bg-accent-hover disabled:opacity-50 transition">
            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm text-center animate-fadeIn">
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
        <div className="flex border-b border-dark-border overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-accent border-b-2 border-accent bg-accent/5' 
                  : 'text-light-text/60 hover:text-light-text hover:bg-dark-bg/50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          
          {/* 🏪 TAB: TIENDA */}
          {activeTab === 'store' && (
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-light-text/80 text-sm mb-1">Nombre de la Tienda</label>
                  <input type="text" value={storeConfig.nombre} onChange={e => setStoreConfig({...storeConfig, nombre: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-light-text/80 text-sm mb-1">RUC</label>
                  <input type="text" value={storeConfig.ruc} onChange={e => setStoreConfig({...storeConfig, ruc: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-light-text/80 text-sm mb-1">Dirección</label>
                  <input type="text" value={storeConfig.direccion} onChange={e => setStoreConfig({...storeConfig, direccion: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-light-text/80 text-sm mb-1">Teléfono / WhatsApp</label>
                  <input type="tel" value={storeConfig.telefono} onChange={e => setStoreConfig({...storeConfig, telefono: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-light-text/80 text-sm mb-1">Email de Contacto</label>
                  <input type="email" value={storeConfig.email} onChange={e => setStoreConfig({...storeConfig, email: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
              </div>
            </div>
          )}

          {/* 🚚 TAB: DELIVERY */}
          {activeTab === 'delivery' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-border">
                <div>
                  <p className="text-light-text font-medium">Servicio de Delivery</p>
                  <p className="text-light-text/50 text-sm">Habilitar o deshabilitar entregas a domicilio</p>
                </div>
                <ToggleSwitch enabled={deliveryConfig.habilitado} onChange={val => setDeliveryConfig({...deliveryConfig, habilitado: val})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-light-text/80 text-sm mb-1">Costo Base (S/)</label>
                  <input type="number" step="0.01" value={deliveryConfig.costoBase} onChange={e => setDeliveryConfig({...deliveryConfig, costoBase: parseFloat(e.target.value)})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-light-text/80 text-sm mb-1">Costo por Km Adicional (S/)</label>
                  <input type="number" step="0.01" value={deliveryConfig.costoPorKm} onChange={e => setDeliveryConfig({...deliveryConfig, costoPorKm: parseFloat(e.target.value)})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-light-text/80 text-sm mb-1">Radio de Delivery Gratis (Km)</label>
                  <input type="number" value={deliveryConfig.radioGratisKm} onChange={e => setDeliveryConfig({...deliveryConfig, radioGratisKm: parseFloat(e.target.value)})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-light-text/80 text-sm mb-1">Límite Máximo de Cobertura (Km)</label>
                  <input type="number" value={deliveryConfig.limiteMaximoKm} onChange={e => setDeliveryConfig({...deliveryConfig, limiteMaximoKm: parseFloat(e.target.value)})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                </div>
              </div>
            </div>
          )}

          {/* 💳 TAB: PAGOS */}
          {activeTab === 'payments' && (
            <div className="space-y-4 max-w-2xl">
              {[
                { key: 'yape', label: 'Yape / Plin', desc: 'Pagos mediante QR o número de celular' },
                { key: 'culqi', label: 'Tarjeta (Culqi)', desc: 'Visa, Mastercard, American Express' },
                { key: 'contraEntrega', label: 'Contra Entrega', desc: 'Pago en efectivo al recibir el pedido' }
              ].map(method => (
                <div key={method.key} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-border">
                  <div>
                    <p className="text-light-text font-medium">{method.label}</p>
                    <p className="text-light-text/50 text-sm">{method.desc}</p>
                  </div>
                  <ToggleSwitch enabled={paymentConfig[method.key]} onChange={val => setPaymentConfig({...paymentConfig, [method.key]: val})} />
                </div>
              ))}
              {!paymentConfig.culqi && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Culqi requiere configurar <code>CULQI_PUBLIC_KEY</code> y <code>CULQI_SECRET_KEY</code> en el backend.</span>
                </div>
              )}
            </div>
          )}

          {/* 🔔 TAB: ALERTAS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-light-text/80 text-sm mb-1">Umbral de Stock Bajo</label>
                <p className="text-light-text/50 text-xs mb-2">Productos con stock menor a este valor se marcarán como "Bajo"</p>
                <input type="number" value={alertConfig.umbralStockBajo} onChange={e => setAlertConfig({...alertConfig, umbralStockBajo: parseInt(e.target.value)})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-border">
                  <div>
                    <p className="text-light-text font-medium">Notificaciones por Email</p>
                    <p className="text-light-text/50 text-sm">Recibir alertas de pedidos y stock bajo</p>
                  </div>
                  <ToggleSwitch enabled={alertConfig.emailNotificaciones} onChange={val => setAlertConfig({...alertConfig, emailNotificaciones: val})} />
                </div>
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-border">
                  <div>
                    <p className="text-light-text font-medium">Notificaciones por WhatsApp</p>
                    <p className="text-light-text/50 text-sm">Enviar resumen diario al WhatsApp del admin</p>
                  </div>
                  <ToggleSwitch enabled={alertConfig.whatsappNotificaciones} onChange={val => setAlertConfig({...alertConfig, whatsappNotificaciones: val})} />
                </div>
              </div>
            </div>
          )}

          {/* 🔒 TAB: SEGURIDAD */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-border">
                <div>
                  <p className="text-light-text font-medium">Modo Mantenimiento</p>
                  <p className="text-light-text/50 text-sm">Los clientes verán un mensaje de "Sitio en mantenimiento"</p>
                </div>
                <ToggleSwitch enabled={securityConfig.modoMantenimiento} onChange={val => setSecurityConfig({...securityConfig, modoMantenimiento: val})} />
              </div>

              <div className="border-t border-dark-border pt-6">
                <h3 className="font-display text-lg text-light-text mb-4">Cambiar Contraseña de Admin</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="relative">
                    <input type={showOldPass ? "text" : "password"} placeholder="Contraseña Actual" value={securityConfig.oldPassword} onChange={e => setSecurityConfig({...securityConfig, oldPassword: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 pr-10 text-light-text focus:outline-none focus:border-accent" />
                    <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text/50"><Eye size={18} /></button>
                  </div>
                  <div className="relative">
                    <input type={showNewPass ? "text" : "password"} placeholder="Nueva Contraseña" value={securityConfig.newPassword} onChange={e => setSecurityConfig({...securityConfig, newPassword: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 pr-10 text-light-text focus:outline-none focus:border-accent" />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text/50"><Eye size={18} /></button>
                  </div>
                  <input type="password" placeholder="Confirmar Nueva Contraseña" value={securityConfig.confirmNewPassword} onChange={e => setSecurityConfig({...securityConfig, confirmNewPassword: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-light-text focus:outline-none focus:border-accent" />
                  <button type="submit" className="w-full bg-dark-bg border border-dark-border hover:border-accent text-light-text font-bold py-2.5 rounded-lg transition">Actualizar Contraseña</button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}