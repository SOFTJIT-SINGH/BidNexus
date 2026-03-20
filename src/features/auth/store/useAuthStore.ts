import { create } from 'zustand';
import { Session, User, Subscription } from '@supabase/supabase-js';
import { supabase } from '@/src/services/supabase/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  authSubscription: Subscription | null;

  initialize: () => Promise<void>;
  cleanup: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>; // <-- ADDED THIS
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  authSubscription: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (__DEV__) {
        set({
          session: { user: { id: 'dev-123', email: 'dev@test.com' } } as any,
          user: { id: 'dev-123', email: 'dev@test.com' } as any,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        set({ session: newSession, user: newSession?.user ?? null });
      });

      set({ authSubscription: subscription });
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  cleanup: () => {
    const { authSubscription } = get();
    if (authSubscription) {
      authSubscription.unsubscribe();
      set({ authSubscription: null });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // --- NEW NATIVE OTP FUNCTION ---
  verifyOtp: async (email, token) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup', // Tells Supabase this is a new account verification
      });
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));