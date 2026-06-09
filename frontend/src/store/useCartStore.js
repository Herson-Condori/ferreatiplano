import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  isCartOpen: false,
  setCartOpen: (open) => set({ isCartOpen: open }),
  
  getItems: () => get().items,
  
  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  },
  
  getTotal: () => {
    return get().items.reduce((sum, item) => {
      const precio = Number(item.precio) || 0;
      const cantidad = item.cantidad || 1;
      return sum + (precio * cantidad);
    }, 0);
  },
  
  addToCart: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, cantidad: (item.cantidad || 1) + (product.cantidad || 1) }
              : item
          ),
        };
      }
      
      return { 
        items: [...state.items, { ...product, cantidad: product.cantidad || 1 }] 
      };
    });
  },
  
  updateQuantity: (productId, cantidad) => {
    set((state) => {
      if (cantidad <= 0) {
        return { 
          items: state.items.filter((item) => item.id !== productId) 
        };
      }
      
      return {
        items: state.items.map((item) =>
          item.id === productId ? { ...item, cantidad } : item
        ),
      };
    });
  },
  
  removeFromCart: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },
  
  clearCart: () => {
    set({ items: [] });
  },
  
}));

export default useCartStore;
export { useCartStore };