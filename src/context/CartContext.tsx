// src/context/CartContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (product: any, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchCartItems = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cart items:', error);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
    
    // Listen for real-time updates to cart
    if (user) {
      const channel = supabase
        .channel('cart_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchCartItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, supabase]);

  // Add item to cart
  const addToCart = async (product: any, quantity: number = 1) => {
    if (!user) return;

    try {
      // Check if product already exists in cart
      const existingItem = items.find(item => item.product_id === product.product_id);

      if (existingItem) {
        // Update quantity if item exists
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Add new item
        const { error } = await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: product.product_id,
          product_name: product.product_name,
          price: product.price,
          quantity: quantity,
          image: product.image,
        });

        if (error) {
          console.error('Error adding item to cart:', error);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  // Update quantity of item in cart
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user || quantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating cart item:', error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing item from cart:', error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  // Clear all items from cart
  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing cart:', error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  // Calculate cart total
  const cartTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate total item count
  const itemCount = items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
