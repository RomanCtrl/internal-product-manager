'use client'
import type { Product } from '@/lib/database.types'; // Use your shared Product type
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    const cartProduct = {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      image: product.image_url, // Ensure product.image_url can be undefined if that's the case
    };
    addToCart(cartProduct, 1);
    // Optionally, add some user feedback here, like a console.log or a toast notification
    console.log(`${product.name} added to cart`);
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
      <button
        onClick={handleAddToCart}
        className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
      >
        Add to Cart
      </button>
    </div>
  )
}