// src/app/(main)/cart/page.tsx
'use client';
import React, { useState } from 'react'; // Added useState
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import CartItem from '@/components/CartItem';
import { useRouter } from 'next/navigation'; // For redirection

export default function CartPage() {
  const { items, cartTotal, loading, itemCount, createOrderFromCart } = useCart(); // Add createOrderFromCart
  const router = useRouter();
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const handleCheckout = async () => {
    if (itemCount === 0 || !createOrderFromCart) return; // Guard against missing function
    setIsProcessingOrder(true);
    try {
      const orderId = await createOrderFromCart();
      if (orderId) {
        // Using alert for now as per original example, can be replaced with toast later
        alert('Order placed successfully! Redirecting to your orders.');
        router.push('/orders');
      } else {
        // Error messages are now more specific within createOrderFromCart,
        // but a general fallback alert can remain if needed, or rely on alerts from context.
        // alert('Failed to place order. Please try again.');
      }
    } catch (error: any) {
      console.error("Checkout failed on page:", error);
      alert(`An error occurred during checkout: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // The main loading state from useCart already covers initial cart loading.
  // isProcessingOrder is specific to the checkout button action.
  if (loading && !isProcessingOrder && itemCount === 0) { // Show loading only if cart is likely still loading
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading cart...</div>;
  }

  if (!loading && itemCount === 0 && items.length === 0) { // Ensure items array is also checked
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Your cart is empty.</h2>
        <Link href="/products" style={{ color: 'blue', textDecoration: 'underline' }}>
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>Your Shopping Cart</h1>
      {items.length === 0 && !loading && ( // Additional check for empty cart after loading
         <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Your cart is empty.</h2>
            <p>It seems your cart was just emptied, or there was an issue loading items.</p>
            <Link href="/products" style={{ color: 'blue', textDecoration: 'underline' }}>
            Continue shopping
            </Link>
         </div>
      )}
      {items.length > 0 && (
        <>
          <div>
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '1.2em', fontWeight: 'bold' }}>
            Total Items: {itemCount}
          </div>
          <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '1.5em', fontWeight: 'bold' }}>
            Total: ${cartTotal.toFixed(2)}
          </div>
        </>
      )}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button
          style={{
            padding: '10px 20px',
            background: (loading || isProcessingOrder || itemCount === 0) ? 'grey' : 'green', // Change background when disabled
            color: 'white',
            border: 'none',
            cursor: (loading || isProcessingOrder || itemCount === 0) ? 'not-allowed' : 'pointer', // Change cursor when disabled
            fontSize: '1em'
          }}
          onClick={handleCheckout}
          disabled={loading || isProcessingOrder || itemCount === 0} // Use combined loading state from context
        >
          {isProcessingOrder ? 'Processing...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
}
