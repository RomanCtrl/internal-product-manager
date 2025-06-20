//src/app/layout.tsx
import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/components/AuthProvider'
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'sonner';
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Fetch the initial user state on the server
  const { data: { user }, error } = await supabase.auth.getUser()
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider initialUser={user}>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
