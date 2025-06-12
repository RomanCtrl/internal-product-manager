'use client'
import { useState } from 'react'; // Import useState
import type { Product } from '@/lib/database.types'; // Use your shared Product type
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  // Initialize quantity state with product.step or 1
  const [quantity, setQuantity] = useState(product.step || 1);

  const handleAddToCart = () => {
    const cartProduct = {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      image: product.image_url, // Ensure product.image_url can be undefined if that's the case
    };
    // Use the quantity from state
    addToCart(cartProduct, quantity);
    // Optionally, add some user feedback here, like a console.log or a toast notification
    console.log(`${quantity} of ${product.name} added to cart`);
  };

  // Handler for quantity input change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Ensure value is not less than min and is a multiple of step if step is defined
    const min = product.step || 1;
    if (value >= min) {
      if (product.step && value % product.step !== 0) {
        // Adjust to the nearest valid step
        setQuantity(Math.max(min, Math.floor(value / product.step) * product.step));
      } else {
        setQuantity(value);
      }
    } else {
      setQuantity(min);
    }
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col justify-between h-full">
      <div>
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="mb-2 w-full h-40 object-cover rounded" />
        )}
        <h2 className="font-bold">{product.name}</h2>
        <p className="text-sm text-gray-600 line-clamp-3">{product.description}</p>
        <div className="mt-2 font-semibold">${product.price}</div>
        <div className="text-xs text-gray-500">SKU: {product.sku}</div>
        <div className="text-xs text-gray-500">Stock: {product.stock_quantity}</div>
        {product.step !== undefined && (
          <div className="text-xs text-gray-500">Step: {product.step}</div>
        )}
      </div>
      {/* Quantity Input Field */}
      <div className="mt-4">
        <label htmlFor={`quantity-${product.id}`} className="block text-sm font-medium text-gray-700">
          Quantity:
        </label>
        <input
          type="number"
          id={`quantity-${product.id}`}
          name="quantity"
          value={quantity}
          onChange={handleQuantityChange}
          min={product.step || 1}
          step={product.step || 1}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <button
        onClick={handleAddToCart}
        className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
      >
        Add to Cart
      </button>
    </div>
  )
}