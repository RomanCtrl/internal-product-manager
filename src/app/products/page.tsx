import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProductsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product List</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.email}</span>
          <LogoutButton />
        </div>
      </div>
      
      <div className="grid gap-4">
        {products?.map(product => (
          <div key={product.product_id} className="p-4 border rounded mb-2">
            <h2 className="font-semibold">{product.product_name}</h2>
            <p className="text-gray-600">{product.description}</p>
            <p className="font-bold">Price: ${product.price}</p>
            <p className="text-sm">Inventory: {product.total_inventory}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
