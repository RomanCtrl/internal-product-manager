'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types' // Use your shared Product type

function ProductCard({ product }: { product: Product }) {
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('products')
          .select('id, sku, name, description, price, stock_quantity, image_url, step')
        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
        <div className="flex gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add Product
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}