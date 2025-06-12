// src/components/AuthProvider.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode
  initialUser: User | null 
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Initially set loading to true until the first auth state check completes
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => { // Make callback async
        setLoading(true); // Set loading true at the start of handling any auth event
        const currentUser = session?.user ?? null;

        if (currentUser) {
          try {
            // Attempt to ensure profile exists
            const { data: profile, error: fetchError } = await supabase
              .from('users') // public.users table
              .select('id')
              .eq('id', currentUser.id)
              .maybeSingle();

            if (fetchError) {
                console.error('Error fetching user profile:', JSON.stringify(fetchError, null, 2));
                // Potentially don't set user or set an error state if profile is critical
                // For now, we proceed to set user, but this error might affect functionality
            }

            if (!profile && !fetchError) { // Only insert if no profile and no error fetching
              console.log(`No profile found for user ${currentUser.id}, creating one.`);
              const { error: insertError } = await supabase
                .from('users') // public.users table
                .insert({
                  id: currentUser.id,
                  email: currentUser.email,
                  // Assuming 'user' is a valid default role and 'role' column exists
                  // and allows this value or has a database-level default.
                  role: 'user'
                });

              if (insertError) {
                console.error('Error creating user profile:', JSON.stringify(insertError, null, 2));
                // This is a critical failure. How to handle?
                // Option 1: Set user to null / show error / prevent login completion.
                // Option 2: Set user, but some parts of app might fail (like cart).
                // For now, we'll log and proceed to set user, but this error needs attention.
                // Consider a global error state or specific retry logic if this is common.
              } else {
                console.log('User profile created successfully for:', currentUser.id);
              }
            } else if (profile) {
              console.log('User profile already exists for:', currentUser.id);
            }
          } catch (e) {
              console.error("Unexpected error in profile ensure process:", JSON.stringify(e, null, 2));
          }
        }

        setUser(currentUser);
        setLoading(false);
      }
    );

    // Initial check in case the event listener doesn't fire immediately
    // (e.g., if user is already logged in when the provider mounts)
    // This part is tricky because onAuthStateChange usually fires on mount.
    // For simplicity, we'll rely on onAuthStateChange to set initial loading to false.
    // If initialUser is passed, loading is false from the start, which is fine.
    if (!initialUser) {
        // If there's no initial user (SSR), we ensure loading is true until first check.
        // The onAuthStateChange will set it to false.
    } else {
        // If initialUser is provided, we assume it's valid and profile exists.
        // Or, the onAuthStateChange will fire for this user too and verify.
        // For now, set loading to false if initialUser is present.
        setLoading(false);
    }


    return () => subscription.unsubscribe();
  }, [supabase])

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // setUser(null); // onAuthStateChange will handle setting user to null and loading to false
    // setLoading(false); // onAuthStateChange will set loading to false
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthConsumer({ children }: { children: (context: AuthContextType) => React.ReactNode }) {
    const context = useAuth()
    return <>{children(context)}</>
  }
