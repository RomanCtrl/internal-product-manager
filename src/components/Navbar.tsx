'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { UserProfile } from '@/components/UserProfile'

interface NavbarProps {
  user: any
}

export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { signOut } = useAuth()

  // Fetch cart count for current user
  useEffect(() => {
    if (user) {
      fetchCartCount()
    }
  }, [user])

  const fetchCartCount = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id)
      
      if (!error && data) {
        const totalItems = data.reduce((sum, item) => sum + item.quantity, 0)
        setCartItemCount(totalItems)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/products" className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <span className="font-bold text-lg">PM</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Product Manager
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/products" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Products
            </Link>
            <Link 
              href="/orders" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Orders
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Shopping Cart */}
            <Link 
              href="/cart" 
              className="relative text-gray-700 hover:text-blue-600 p-2 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Enhanced User Profile Component */}
            <UserProfile user={user} onSignOut={handleSignOut} />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/products" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                href="/orders" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Orders
              </Link>
              <Link 
                href="/cart" 
                className="flex items-center justify-between px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              
              {/* Mobile User Profile Section */}
              <div className="border-t border-gray-200 pt-2">
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                </div>
                <Link 
                  href="/account/settings"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    handleSignOut()
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
