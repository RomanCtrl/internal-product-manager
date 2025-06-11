'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth' // Import useAuth hook
import LogoutButton from './LogoutButton' // Import LogoutButton component

export default function AuthButton() {
  const { user, loading } = useAuth() // Get user and loading state from useAuth hook

  if (loading) {
    return <p>Loading...</p> // Show loading message while checking auth state
  }

  return user ? (
    <LogoutButton /> // Show LogoutButton if user is authenticated
  ) : (
    <Link href="/login">
      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Login
      </button>
    </Link>
  )
}
