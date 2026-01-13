import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient, Session, User } from '@supabase/supabase-js';

// Extended User type with preferences
interface ExtendedUser extends User {
  preferences?: string; // JSON string of preferences
  full_name?: string;
  // Include other custom user fields as needed
}

interface AuthContextType {
  session: Session | null;
  user: ExtendedUser | null;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUser: (updates: any) => Promise<any>;
  getUserPreferences: () => Promise<any>;
  updateUserPreferences: (preferences: any) => Promise<any>;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
      }
    };
    
    getSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        setSession(session);
        setUser(session?.user as ExtendedUser || null);
        
        if (event === 'SIGNED_OUT') {
          navigate('/');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
    
    // Update session and user if auto-login occurred
    if (data.session) {
      setSession(data.session);
      // Cast the user to ExtendedUser to handle potential preferences
      setUser(data.session.user as ExtendedUser);
    }
    
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Update session and user
    if (data.session) {
      setSession(data.session);
      // Cast the user to ExtendedUser to handle potential preferences
      setUser(data.session.user as ExtendedUser);
    }
    
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const updateUser = async (updates: any) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) throw error;
    
    // Update local state
    if (data.user) {
      setUser(data.user as ExtendedUser);
    }
    
    return data;
  };

  const getUserPreferences = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is 'Row not found'
      throw error;
    }
    
    return data || null;
  };
  
  const updateUserPreferences = async (preferences: any) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    // Check if preferences record exists
    const { data: existingPref } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    let result;
    if (existingPref) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_id', user.id);
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert([{ user_id: user.id, ...preferences }]);
    }
    
    if (result.error) {
      throw result.error;
    }
    
    // Update the user's preferences in the state as well
    const updatedUser = { ...user, preferences: JSON.stringify(preferences) };
    setUser(updatedUser);
    
    return result.data;
  };
  
  const value = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    updateUser,
    getUserPreferences,
    updateUserPreferences
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};