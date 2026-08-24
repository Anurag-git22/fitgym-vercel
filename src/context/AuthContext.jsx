import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// ─── Shape ───────────────────────────────────────────────────
// {
//   session:  Session | null,
//   profile:  { id, name, email, role, account_status, avatar_url, … } | null,
//   role:     'admin' | 'trainer' | 'trainee' | null,
//   loading:  boolean,
//   error:    string | null,
// }

const initialState = {
  session: null,
  profile: null,
  role:    null,
  loading: true,
  error:   null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload, loading: false, error: null };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload, role: action.payload?.role ?? null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SIGN_OUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch profile row from `profiles` table for a given user id.
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } else {
      dispatch({ type: 'SET_PROFILE', payload: data });
    }
  }, []);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (session?.user) fetchProfile(session.user.id);
      else dispatch({ type: 'SET_LOADING', payload: false });
    });

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          dispatch({ type: 'SIGN_OUT' });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Public helpers ──────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { data: null, error };
    }
    return { data, error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SIGN_OUT' });
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error };
  }, []);

  // Refresh profile (useful after the user updates their own row)
  const refreshProfile = useCallback(() => {
    if (state.session?.user) fetchProfile(state.session.user.id);
  }, [state.session, fetchProfile]);

  const value = {
    ...state,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
