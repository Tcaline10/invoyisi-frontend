import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/api';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on initial load and set up auth listener
  useEffect(() => {
    // Get initial session
    const checkAuth = async () => {
      try {
        console.log('AuthContext: Checking initial session');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('AuthContext: Error getting session:', error);
          setUser(null);
          setIsLoading(false);
          return;
        }

        console.log('AuthContext: Session exists:', !!data.session);

        if (data.session) {
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError) {
              console.error('AuthContext: Error getting user:', userError);
              setUser(null);
            } else {
              console.log('AuthContext: User data retrieved:', userData.user?.email);
              setUser(userData.user);
            }
          } catch (userError) {
            console.error('AuthContext: Exception getting user:', userError);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Exception in checkAuth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, !!session);

        try {
          if (session) {
            console.log('AuthContext: Getting user data after auth change');
            const { data, error } = await supabase.auth.getUser();

            if (error) {
              console.error('AuthContext: Error getting user after auth change:', error);
              setUser(null);
            } else {
              console.log('AuthContext: User data updated:', data.user?.email);
              setUser(data.user);
            }
          } else {
            console.log('AuthContext: No session, setting user to null');
            setUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Exception in auth state change handler:', error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // No need to navigate - the auth state change will trigger a redirect
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      // Return success - navigation will be handled by the component
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // No need to navigate - the auth state change will trigger a redirect
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
