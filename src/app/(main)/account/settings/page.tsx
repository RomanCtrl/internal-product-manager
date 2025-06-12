'use client'

import { useState, useEffect } from 'react' // Added useEffect
import { createClient } from '@/lib/supabase/client' // Added createClient

export default function UserSettingsPage() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(true) // Start with loading true for initial fetch
  const supabase = createClient(); // Initialized Supabase client

  // useEffect to fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No user logged in. Cannot fetch settings.');
        setLoading(false);
        // Optionally redirect or show a message
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('name, city, country, zip')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else if (profile) {
        setName(profile.name || '');
        setCity(profile.city || '');
        setCountry(profile.country || '');
        setZip(profile.zip || '');
      }
      setLoading(false);
    };

    fetchUserData();
  }, [supabase]); // Dependency array includes supabase client instance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (name.trim() === '') {
      alert('Name is required.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('User not found, please log in again.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        name: name,
        city: city || null,
        country: country || null,
        zip: zip || null,
      })
      .eq('id', user.id);

    if (error) {
      alert(`Error updating profile: ${error.message}`);
    } else {
      alert('Profile updated successfully!');
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            User Settings
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Update your profile information.
          </p>
        </div>
        {loading && !name && ( // Show a simple loading text only during initial data fetch
            <div className="text-center p-4">Loading profile data...</div>
        )}
        <form onSubmit={handleSubmit} className={`mt-8 space-y-6 bg-white p-8 rounded shadow-md ${loading && !name ? 'opacity-50' : ''}`}>
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
                type="text"
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
              disabled={loading} // This loading state now covers both initial fetch and submission
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading && name ? 'Saving...' : loading && !name ? 'Loading Data...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
