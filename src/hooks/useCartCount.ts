'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'

export function useCartCount() {
  const [cartCount, setCartCount] = useState(0)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setCartCount(0)
      return
    }

    // Initial fetch
    fetchCartCount()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('cart-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          fetchCartCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchCartCount = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id)

      if (!error && data) {
        const total = data.reduce((sum, item) => sum + item.quantity, 0)
        setCartCount(total)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  return { cartCount, refreshCartCount: fetchCartCount }
}
