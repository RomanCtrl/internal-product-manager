// src/components/AuthProvider.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation' // Added

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
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(!initialUser); // Initialize based on initialUser
  const supabase = createClient();
  const router = useRouter(); // Added
  const pathname = usePathname(); // Added

  useEffect(() => {
    // setLoading(true) removed from here; initial state is true.
    // onAuthStateChange will manage loading from this point.

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true); // Ensure loading is true during this async handler
        let effectiveUser = session?.user ?? null;

        if (effectiveUser) {
          try {
            // Attempt to ensure profile exists
            const { data: profile, error: fetchError } = await supabase
              .from('users') // public.users table
              .select('id')
              .eq('id', effectiveUser.id)
              .maybeSingle();

            if (fetchError) {
                console.error('Error fetching user profile:', JSON.stringify(fetchError, null, 2));
                // If fetching profile fails, we might not want to proceed with this user session
                // depending on how critical the profile is. For now, we log and let it try to create.
                // If profile is absolutely critical, effectiveUser could be nulled here too.
            }

            if (!profile && !fetchError) { // Only insert if no profile and no error fetching
              console.log(`No profile found for user ${effectiveUser.id}, creating one.`);
              const { error: insertError } = await supabase
                .from('users') // public.users table
                .insert({
                  id: effectiveUser.id,
                  email: effectiveUser.email,
                  // Assuming 'user' is a valid default role and 'role' column exists
                  // and allows this value or has a database-level default.
                  role: 'user'
                });

              if (insertError) {
                // Log the error, but do NOT nullify effectiveUser.
                // The user is authenticated; the profile creation is a secondary step.
                console.error('Error creating user profile automatically:', JSON.stringify(insertError, null, 2));
                // Optionally, set a profileError state here to inform other parts of the app.
                // For this task, we just ensure effectiveUser (auth state) is preserved.
              } else {
                console.log('User profile created successfully for:', effectiveUser.id);
              }
            } else if (profile) {
              console.log('User profile already exists for:', effectiveUser.id);
            }
          } catch (e) {
              console.error("Unexpected error in profile ensure process:", JSON.stringify(e, null, 2));
              // If an unexpected error occurs in the try block, we should still preserve the auth state.
              // Only a direct auth issue (invalid session) should clear effectiveUser.
              // effectiveUser = null; // Avoid nullifying here as well. Let session define user.
          }
        }

        setUser(effectiveUser); // Set user based on session, regardless of profile operation outcomes.
        setLoading(false);
      }
    );

    // Initial check in case the event listener doesn't fire immediately
    // (e.g., if user is already logged in when the provider mounts)
    // onAuthStateChange usually fires on mount for already logged-in users.
    // The initial useState(true) covers the very first load.
    // No direct setLoading(false) based on initialUser here;
    // onAuthStateChange is the authority for setting loading to false.

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]); // supabase client instance is the main dependency

  // useEffect for redirecting to complete profile if necessary
  useEffect(() => {
    if (!loading && user) {
      const exemptedPaths = ['/account/complete-profile', '/login', '/register'];
      if (exemptedPaths.includes(pathname)) {
        return;
      }

      const checkProfileAndRedirect = async () => {
        try {
          const { data: profile, error: fetchProfileError } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .maybeSingle();

          if (fetchProfileError) {
            console.error('Error fetching profile for redirect check:', fetchProfileError);
            return; // Don't redirect if there's an error fetching profile
          }

          if (!profile || !profile.name) {
            console.log('User profile incomplete, redirecting to /account/complete-profile');
            router.push('/account/complete-profile');
          }
        } catch (e) {
          console.error('Unexpected error during profile check and redirect:', e);
        }
      };

      checkProfileAndRedirect();
    }
  }, [user, loading, supabase, router, pathname]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // setUser(null); // onAuthStateChange will handle setting user to null and loading to false
    // setLoading(false); // onAuthStateChange will set loading to false
  };

  if (loading) {
    // This is a simple placeholder. A real app would have a dedicated loading component/spinner.
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        fontFamily: 'sans-serif'
      }}>
        Authenticating...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
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
