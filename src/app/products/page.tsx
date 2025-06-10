'use client'
import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useAuth } from '@/hooks/useAuth'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ProductsPage() {
  const { products, loading } = useProducts()
  const { user } = useAuth()
  const [adding, setAdding] = useState<string | null>(null)
  const supabase = createClient()

  const addToCart = async (product: Product) => {
    if (!user) return

    setAdding(product.id)

    try {
      // Get or create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!cart) {
        const { data: newCart, error: cartError } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single()

        if (cartError) throw cartError
        cart = newCart
      }

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', product.id)
        .single()

      if (existingItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id)
      } else {
        // Add new item
        await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: product.id,
            quantity: 1,
            price_at_time: product.price,
          })
      }

      toast.success('Item added to cart!')
    } catch (error) {
      toast.error('Failed to add item to cart')
      console.error('Error adding to cart:', error)
    } finally {
      setAdding(null)
    }
  }

  if (loading) return <div>Loading products...</div>

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCart}
          />
        ))}
      </div>
    </div>
  )
}