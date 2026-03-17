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
  signOut: () => Promise<void>;
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

      // Get initial session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // set({
      //   session,
      //   user: session?.user ?? null,
      //   isInitialized: true,
      // });

      if (__DEV__) {
        set({
          session: { user: { id: 'dev-123', email: 'dev@test.com' } } as any,
          user: { id: 'dev-123', email: 'dev@test.com' } as any,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      // Set up listener and store the subscription for cleanup
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        set({
          session: newSession,
          user: newSession?.user ?? null,
        });
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
