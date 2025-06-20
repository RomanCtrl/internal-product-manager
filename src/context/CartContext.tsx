// src/context/CartContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import type { Database } from '@/lib/database.types'; // Import Database types

// Define the CartItem interface based on joined data
export interface CartItem {
  id: string; // cart_items.id
  product_id: string;
  quantity: number;
  price_at_time_in_cart: number; // from cart_items.price_at_time
  product_name: string;    // from joined products table
  product_image?: string; // from joined products table
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (product: Database['public']['Tables']['products']['Row'], quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  itemCount: number;
  createOrderFromCart: () => Promise<string | null>; // New function
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true); // General loading state
  const [checkoutLoading, setCheckoutLoading] = useState(false); // Specific loading state for checkout
  const { user } = useAuth();
  const supabase = createClient();
  const [cartId, setCartId] = useState<string | null>(null);

const getOrCreateCartId = async (userId: string): Promise<string | null> => {
  // Try to fetch an existing active cart.
  // With the unique DB constraint, .single() is safer here.
  let { data: cartData, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (cartData) {
    return cartData.id;
  }

  // Handle specific errors or proceed to insert
  // PGRST116 = 0 rows found, which is expected if no active cart exists.
  if (cartError && cartError.code !== 'PGRST116') { 
    console.error('Error fetching cart initially:', JSON.stringify(cartError, null, 2));
    // For other errors (e.g., network, RLS issues not allowing select), return null.
    return null;
  }

  // If cartError.code === 'PGRST116' (no active cart found), try to insert.
  const { data: newCartData, error: newCartError } = await supabase
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select('id')
    .single(); // Attempt to get the newly inserted cart's ID.

  if (newCartError) {
    // Check if the error is due to the unique constraint (23505: unique_violation in PostgreSQL)
    // This means a concurrent operation just created the cart.
    if (newCartError.code === '23505') { 
      console.log('Unique constraint violation on cart insert, re-fetching active cart as it was likely created concurrently.');
      // Retry fetching the (now existing) active cart
      let { data: existingCartData, error: retryFetchError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single(); // Should find the cart created by the other process.
      
      if (retryFetchError) {
        console.error('Error re-fetching cart after unique constraint violation:', JSON.stringify(retryFetchError, null, 2));
        return null;
      }
      // Return the ID of the cart found after the retry.
      return existingCartData ? existingCartData.id : null;
    } else {
      // For other insert errors, log them and return null.
      console.error('Error creating new cart:', JSON.stringify(newCartError, null, 2));
      return null;
    }
  }
  
  // Return the ID of the newly created cart if insert was successful.
  return newCartData ? newCartData.id : null;
};

  useEffect(() => {
    const initializeCart = async () => {
      if (user) {
        setLoading(true);
        try {
          const currentCartId = await getOrCreateCartId(user.id);
          setCartId(currentCartId);
          if (currentCartId) {
            await fetchCartItems(currentCartId);
          } else {
            setItems([]); // Clear items if no cart ID is found/created
          }
        } catch (error) {
          console.error('Error during cart initialization:', error);
          setItems([]); // Clear items on error
          setCartId(null); // Reset cartId on error
        } finally {
          setLoading(false); // Ensure loading is always set to false
        }
      } else {
        // No user, clear cart state and ensure loading is false
        setItems([]);
        setCartId(null);
        setLoading(false);
      }
    };
    initializeCart();
  }, [user]);

  const fetchCartItems = async (currentCartId: string | null) => {
    console.log(`fetchCartItems: Called with currentCartId: ${currentCartId}`);
    if (!user || !currentCartId) {
      console.log('fetchCartItems: Returning early - no user or no currentCartId.');
      setItems([]);
      // setLoading(false); // This might be set by initializeCart or the caller of fetchCartItems
      return;
    }

    // setLoading(true); // Potentially set by caller if this function is used outside initializeCart
    console.log(`fetchCartItems: Fetching items for cartId: ${currentCartId}`);
    try {
      const { data: cartItemsData, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          price_at_time,
          product_id,
          products (
            name,
            image_url,
            price
          )
        `)
        .eq('cart_id', currentCartId);

      if (error) {
        console.error('fetchCartItems: Error fetching cart items from Supabase:', JSON.stringify(error, null, 2));
        setItems([]);
      } else {
        console.log('fetchCartItems: Successfully fetched raw cartItemsData:', JSON.stringify(cartItemsData, null, 2));
        const transformedItems: CartItem[] = cartItemsData?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_time_in_cart: item.price_at_time,
          product_name: item.products?.name || 'Unknown Product',
          product_image: item.products?.image_url || undefined,
        })) || [];
        console.log('fetchCartItems: Transformed items:', JSON.stringify(transformedItems, null, 2));
        setItems(transformedItems);
      }
    } catch (err) {
      console.error('fetchCartItems: Unexpected error during fetch or transformation:', err);
      setItems([]);
    } finally {
      // setLoading(false); // Potentially set by caller
      console.log(`fetchCartItems: Finished for cartId: ${currentCartId}`);
    }
  };

  useEffect(() => {
    if (user && cartId) {
      fetchCartItems(cartId); // Initial fetch

      const cartItemsChannel = supabase
        .channel(`cart_items_changes_for_cart_${cartId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cartId}` },
          (payload) => {
            console.log('Cart items change received!', payload);
            fetchCartItems(cartId);
          }
        ).subscribe();

      const cartStatusChannel = supabase
        .channel(`cart_status_changes_for_cart_${cartId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'carts', filter: `id=eq.${cartId}` },
          (payload) => {
            console.log('Cart status change received!', payload);
            if (payload.eventType === 'DELETE' || (payload.eventType === 'UPDATE' && payload.new.status !== 'active')) {
              setCartId(null);
              setItems([]);
            }
          }
        ).subscribe();

      return () => {
        supabase.removeChannel(cartItemsChannel);
        supabase.removeChannel(cartStatusChannel);
      };
    }
  }, [user, cartId, supabase]);

  const addToCart = async (product: Database['public']['Tables']['products']['Row'], quantity: number = 1) => {
    if (!user || !cartId) {
        console.error("Attempted to addToCart when user or cartId is not available. User:", !!user, "CartId:", !!cartId, "Context loading:", loading);
        // alert("Cart not ready. Please wait a moment and try again."); // Optional
        return;
    }
    if (!product || !product.id || typeof product.price !== 'number') {
        console.error("Invalid product data for addToCart", product);
        return;
    }

    try {
      const { data: existingItems, error: findError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', product.id)
        .limit(1);

      if (findError) throw findError;

      const existingItem = existingItems?.[0];

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: product.id,
          quantity: quantity,
          price_at_time: product.price,
        }).select().single(); // Adding select().single() can help catch insert errors better
      }
    } catch (err) {
      console.error('Error in addToCart:', err);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user || !cartId || quantity < 1) {
      console.error("Attempted to updateQuantity when user or cartId is not available, or quantity invalid. User:", !!user, "CartId:", !!cartId, "Quantity:", quantity, "Context loading:", loading);
      return;
    }
    try {
      await supabase
        .from('cart_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', cartItemId)
        .eq('cart_id', cartId);
    } catch (err) {
      console.error('Error in updateQuantity:', err);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user || !cartId) {
      console.error("Attempted to removeFromCart when user or cartId is not available. User:", !!user, "CartId:", !!cartId, "Context loading:", loading);
      return;
    }
    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('cart_id', cartId);
    } catch (err) {
      console.error('Error in removeFromCart:', err);
    }
  };

  const clearCart = async () => {
    if (!user || !cartId) {
        console.error("Attempted to clearCart when user or cartId is not available. User:", !!user, "CartId:", !!cartId, "Context loading:", loading);
        return;
    }
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);
      if (error) throw error;
      // Realtime should update items, but we can also clear it preemptively
      // setItems([]); // This is handled by the realtime subscription calling fetchCartItems
    } catch (err) {
      console.error('Error in clearCart:', err);
    }
  };

  const cartTotal = items.reduce(
    (total, item) => total + item.price_at_time_in_cart * item.quantity,
    0
  );

  const itemCount = items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const createOrderFromCart = async (): Promise<string | null> => {
    if (!user || !cartId || items.length === 0) {
      console.error("Attempted to createOrderFromCart with missing prerequisites. User:", !!user, "CartId:", !!cartId, "Items count:", items.length, "Context loading:", loading);
      alert("Cannot create order: Cart is empty or user not fully logged in. If you recently logged in, please wait a moment.");
      return null;
    }

    setCheckoutLoading(true);
    try {
      const order_number = `ORD-${Date.now()}`;
      // cartTotal is already calculated and available in the scope

      // 1. Create Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          cart_id: cartId, // Store the cart_id with the order
          order_number,
          total_amount: cartTotal,
          status: 'pending', // Initial status
          // created_at will be set by default by postgres
        })
        .select('id')
        .single();

      if (orderError || !orderData) {
        console.error('Error creating order:', orderError);
        alert(`Error creating order: ${orderError?.message || "Unknown error"}`);
        throw orderError || new Error("Order creation failed at 'orders' table insertion");
      }
      const newOrderId = orderData.id;

      // 2. Create Order Items
      const orderItemsToInsert = items.map(item => ({
        order_id: newOrderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price_at_time_in_cart,
        total_price: item.quantity * item.price_at_time_in_cart,
      }));

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (orderItemsError) {
        console.error('Error creating order items:', orderItemsError);
        // Attempt to delete the order if items failed, to prevent orphaned orders
        await supabase.from('orders').delete().eq('id', newOrderId);
        alert(`Error creating order items: ${orderItemsError.message}. Order has been rolled back.`);
        throw orderItemsError;
      }

      // 3. Optionally, update cart status to 'completed' or similar, instead of just clearing.
      // For now, we will clear it as per original plan.
      // Important: clearCart will trigger a fetchCartItems which will find nothing.
      await clearCart();
      // After clearing, we might want to set cartId to null or re-evaluate,
      // but clearCart currently just deletes items.
      // To prevent the old cartId from being reused immediately for a new cart
      // before the user does anything, we could set its status to 'completed'.
      const { error: updateCartError } = await supabase
        .from('carts')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', cartId);

      if (updateCartError) {
        console.error('Error updating cart status to completed:', updateCartError);
        // This is not a fatal error for the order itself, but good to log.
      }
      setCartId(null); // User will get a new cart next time they add an item.

      return newOrderId;
    } catch (error) {
      console.error("Checkout process failed:", error);
      // Alert is handled by specific error messages above for better UX
      // If it's an unexpected error, this will catch it.
      if (!(error instanceof Error && error.message.includes("Order creation failed") || error.message.includes("Error creating order items"))) {
        alert("An unexpected error occurred during checkout. Please try again.");
      }
      return null;
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading: loading || checkoutLoading, // Combine loading states for general UI feedback
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        itemCount,
        createOrderFromCart, // Provide the new function
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
