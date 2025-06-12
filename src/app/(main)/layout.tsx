// src/app/(main)/layout.tsx
'use client'; // Make this a Client Component

import { useEffect } from 'react'; // useState and createClient removed
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider'; // Import useAuth
// User type import might not be needed if useAuth provides a typed user object

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(); // Use useAuth hook

  useEffect(() => {
    // Redirect if not loading and no user
    if (!loading && !user) {
      redirect('/login');
    }
  }, [user, loading]); // Dependencies for the effect

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  // If there's no user and we're not loading, the useEffect above should have redirected.
  // However, to prevent rendering children if redirect is processing or as a safeguard:
  if (!user) {
    return <div>Loading...</div>; // Or null, or a message indicating redirection
  }

  return (
    // CartProvider wrapper was already removed
    <div className="min-h-screen bg-gray-50">
      {/* Pass user from useAuth to Navbar */}
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}