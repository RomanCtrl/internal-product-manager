'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation' // For potential redirect

export default function CompleteProfilePage() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Error: No authenticated user found. Please log in.')
      setLoading(false)
      return
    }

    // Ensure required fields are filled (though HTML 'required' helps)
    if (!name) {
      alert('Name is required.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name: name,
        city: city || null,
        country: country || null,
        zip: zip || null,
        role: 'user', // Default role
      }])

    if (insertError) {
      alert(`Error completing profile: ${insertError.message}`)
    } else {
      alert('Profile completed successfully!')
      // Optionally redirect, e.g., router.push('/dashboard') or router.push('/')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
        </div>
        <form onSubmit={handleCompleteProfile} className="mt-8 space-y-6 bg-white p-8 rounded shadow-md">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Full Name"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">
                City (Optional)
              </label>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="City"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">
                Country (Optional)
              </label>
              <input
                id="country"
                name="country"
                type="text"
                autoComplete="country-name"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Country"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="zip" className="block text-gray-700 text-sm font-bold mb-2">
                Zip / Postal Code (Optional)
              </label>
              <input
                id="zip"
                name="zip"
                type="text" // Using text for flexibility with international codes
                autoComplete="postal-code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                placeholder="Zip / Postal Code"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
