// src/store/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { useCartStore } from './useCartStore'; // ✅ AGREGADO: Para limpiar carrito

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      // 🔐 LOGIN con email/password
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          set({ 
            user: data.user, 
            token: data.token, 
            loading: false,
            error: null 
          });
          
          return { success: true };
        } catch (err) {
          const errorMsg = err.response?.data?.error || 'Error de conexión con el servidor';
          set({ loading: false, error: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      // 📝 REGISTRO (solo para clientes)
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', userData);
          set({ loading: false });
          return { success: true, user: data.user };
        } catch (err) {
          const errorMsg = err.response?.data?.error || 'Error en el registro';
          set({ loading: false, error: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      // 👤 OBTENER perfil actual (refresh de datos)
      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
          localStorage.setItem('user', JSON.stringify(data));
          return { success: true };
        } catch (err) {
          return { success: false };
        }
      },

      // 🚪 LOGOUT - CORREGIDO
      logout: () => {
        // ✅ Limpiar carrito antes de cerrar sesión
        try {
          useCartStore.getState().clearCart();
        } catch (err) {
          console.warn('No se pudo limpiar el carrito:', err);
        }
        
        // ✅ Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('ferrealtiplano-auth'); // Limpiar persistencia de Zustand
        
        // ✅ Limpiar estado de Zustand
        set({ user: null, token: null, error: null });
        
        // ✅ Redirigir al login (sin usar navigate)
        window.location.href = '/login';
      },

      // 🔍 VERIFICAR si el usuario tiene alguno de los roles permitidos
      hasRole: (...roles) => {
        const { user } = get();
        return user?.rol && roles.includes(user.rol);
      },

      // ✅ VERIFICAR si está autenticado (token + user válidos)
      isAuthenticated: () => {
        const { token, user } = get();
        return !!token && !!user;
      },

      // 🧹 LIMPIAR error
      clearError: () => set({ error: null })
    }),
    {
      name: 'ferrealtiplano-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      })
    }
  )
);