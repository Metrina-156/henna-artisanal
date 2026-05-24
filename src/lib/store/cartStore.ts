import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

export interface ToastInfo {
  show: boolean;
  productName: string;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  toast: ToastInfo;
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemStock: (productId: string, newStock: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  triggerToast: (productName: string, image: string, quantity: number) => void;
  hideToast: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      toast: {
        show: false,
        productName: '',
        image: '',
        quantity: 0,
      },

      addToCart: (product, quantity) => {
        const { items } = get();
        const existingIndex = items.findIndex((item) => item.productId === product.productId);
        const updatedItems = [...items];
        let actualAddedQty = quantity;

        if (existingIndex > -1) {
          const existingItem = updatedItems[existingIndex];
          const newQty = Math.min(existingItem.quantity + quantity, existingItem.stock);
          actualAddedQty = newQty - existingItem.quantity;
          const updatedItem = { ...existingItem, quantity: newQty };
          
          updatedItems.splice(existingIndex, 1);
          updatedItems.unshift(updatedItem);
        } else {
          const newQty = Math.min(quantity, product.stock);
          actualAddedQty = newQty;
          if (newQty > 0) {
            updatedItems.unshift({
              ...product,
              quantity: newQty,
            });
          }
        }

        set({ items: updatedItems });

        if (actualAddedQty > 0) {
          get().triggerToast(product.name, product.image, actualAddedQty);
        }
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(quantity, item.stock) }
              : item
          ),
        }));
      },

      updateItemStock: (productId, newStock) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, stock: newStock, quantity: Math.min(item.quantity, newStock) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      triggerToast: (productName, image, quantity) => {
        set({
          toast: {
            show: true,
            productName,
            image,
            quantity,
          },
        });
      },

      hideToast: () => {
        set((state) => ({
          toast: {
            ...state.toast,
            show: false,
          },
        }));
      },
    }),
    {
      name: 'henna-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export function useCartStore<T>(selector: (state: CartState) => T): T | undefined {
  const result = useCart(selector);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? result : undefined;
}
