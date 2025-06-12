// src/components/CartItem.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import type { CartItem as CartContextItemType } from '@/context/CartContext'; // Import the type

interface CartItemProps {
  item: CartContextItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  // State for quantity, initialized from item.quantity
  const [currentQuantity, setCurrentQuantity] = useState(item.quantity);

  // Update currentQuantity if item.quantity changes from context (e.g. another tab)
  useEffect(() => {
    setCurrentQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newQuantity = parseInt(e.target.value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      // If input is cleared or invalid, user might be about to type,
      // or it might be an accidental clear. For now, let's allow it to be temporarily empty
      // but not update context yet, or reset to 1 if they blur.
      // For simplicity, let's just ensure it's at least 1 for context update.
      newQuantity = Math.max(1, newQuantity || 1); 
    }
    setCurrentQuantity(newQuantity); // Update local state immediately for responsiveness
    updateQuantity(item.id, newQuantity); // Debounce this in a real app
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  // Calculate subtotal for this item
  const subtotal = item.price_at_time_in_cart * currentQuantity;

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      padding: '15px', 
      marginBottom: '10px', 
      display: 'flex', 
      alignItems: 'flex-start',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      {item.product_image && (
        <img 
          src={item.product_image} 
          alt={item.product_name} 
          style={{ 
            width: '100px', 
            height: '100px', 
            marginRight: '15px', 
            objectFit: 'cover',
            borderRadius: '4px'
          }} 
        />
      )}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1em', fontWeight: 'bold' }}>{item.product_name}</h4>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#555' }}>
          Price per item: ${item.price_at_time_in_cart.toFixed(2)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <label htmlFor={`quantity-${item.id}`} style={{ marginRight: '8px', fontSize: '0.9em' }}>Quantity:</label>
          <input
            type="number"
            id={`quantity-${item.id}`}
            value={currentQuantity}
            onChange={handleQuantityChange}
            min="1"
            style={{ 
              width: '70px', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              textAlign: 'center'
            }}
          />
        </div>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '120px' }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1.1em' }}>
          Subtotal: ${subtotal.toFixed(2)}
        </p>
        <button 
          onClick={handleRemove} 
          style={{ 
            background: '#ff4d4f', 
            color: 'white', 
            border: 'none', 
            padding: '8px 15px', 
            cursor: 'pointer', 
            borderRadius: '4px',
            fontSize: '0.9em'
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
