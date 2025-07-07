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
    let mounted = true;

    // Get initial session
    const checkAuth = async () => {
      try {
        console.log('AuthContext: Checking initial session');
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('AuthContext: Error getting session:', error);
          setUser(null);
          setIsLoading(false);
          return;
        }

        console.log('AuthContext: Session exists:', !!data.session);

        if (data.session) {
          console.log('AuthContext: User data retrieved:', data.session.user?.email);
          setUser(data.session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Exception in checkAuth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('AuthContext: Auth state changed:', event, !!session);

        try {
          if (session) {
            console.log('AuthContext: User data updated:', session.user?.email);
            setUser(session.user);
          } else {
            console.log('AuthContext: No session, setting user to null');
            setUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Exception in auth state change handler:', error);
          if (mounted) {
            setUser(null);
          }
        }
      }
    );

    checkAuth();

    // Clean up subscription on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
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
    }
  };

  const register = async (name: string, email: string, password: string) => {
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
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // No need to navigate - the auth state change will trigger a redirect
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
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
