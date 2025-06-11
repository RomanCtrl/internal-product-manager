'use client'
import type { Product } from '@/lib/database.types'; // Use your shared Product type

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border rounded-lg p-4">
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="mb-2 w-full h-40 object-cover rounded" />
      )}
      <h2 className="font-bold">{product.name}</h2>
      <p className="text-sm text-gray-600">{product.description}</p>
      <div className="mt-2 font-semibold">${product.price}</div>
      <div className="text-xs text-gray-500">SKU: {product.sku}</div>
      <div className="text-xs text-gray-500">Stock: {product.stock_quantity}</div>
      {product.step !== undefined && (
        <div className="text-xs text-gray-500">Step: {product.step}</div>
      )}
    </div>
  )
}