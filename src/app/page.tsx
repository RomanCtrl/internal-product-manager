import { createClient } from '@/lib/supabase/client'

export default async function Home() {
  const supabase = createClient()
  const { data: products } = await supabase.from('products').select('*')

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Product List</h1>
      {products?.map(product => (
        <div key={product.id} className="p-4 border rounded mb-2">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p>Price: ${product.price}</p>
        </div>
      ))}
    </main>
  )
}
