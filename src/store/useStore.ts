import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface PersistedState {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleWishlist: (id: string) => void;
  clearCart: () => void;
}

interface UIState {
  isMegaMenuOpen: boolean;
  isCartOpen: boolean;
  setMegaMenuOpen: (isOpen: boolean) => void;
  setCartOpen: (isOpen: boolean) => void;
}

// 1. Persisted Store: Handles Cart and Wishlist (Saved to localStorage)
export const usePersistedStore = create<PersistedState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      addToCart: (item) =>
        set((state) => {
          const existingItem = state.cart.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              cart: state.cart.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
          ),
        })),
      toggleWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.includes(id)
            ? state.wishlist.filter((itemId) => itemId !== id)
            : [...state.wishlist, id],
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'henna-artisanal-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// 2. Ephemeral UI Store: Handles toggles and session-only state (NOT persisted)
// This prevents "sticky" menus or stale UI states on return visits.
export const useUIStore = create<UIState>((set) => ({
  isMegaMenuOpen: false,
  isCartOpen: false,
  setMegaMenuOpen: (isOpen) => set({ isMegaMenuOpen: isOpen }),
  setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
}));
