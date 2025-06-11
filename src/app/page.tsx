// src/app/page.tsx
'use client' // Add client directive
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/database.types'

export default function Home() {
   const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
   const supabase = createClient()

   useEffect(() => {
     const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase.from('products').select('*')
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
     <main className="container mx-auto p-4">
       <h1 className="text-2xl font-bold mb-4">Product List</h1>
      {loading && <p>Loading products...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && products.map(product => (
         <div key={product.id} className="p-4 border rounded mb-2">
           <h2>{product.name}</h2>
           <p>{product.description}</p>
           <p>Price: ${product.price}</p>
         </div>
       ))}
     </main>
   )
}
