// src/app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Redirect based on authentication status
  if (error || !user) {
    redirect('/login')
  } else {
    redirect('/products')
  }

  // This return statement will never be reached due to redirects above
  return null
}
