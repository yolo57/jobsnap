import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwc3FuanJ1YXZxa2N3YnVicGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODI3OTYsImV4cCI6MjA4ODc1ODc5Nn0.rbQy1vMYRXqWigB31PBkTcOe6HkhOuxM3eaNv1ch5QQ';

// Direct REST calls to Supabase - no SDK auth client
async function supabaseAuth(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Auth error');
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId, token) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data && data[0]) setProfile(data[0]);
    } catch (e) {
      console.error('Profile load error:', e);
    }
  };

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem('jobsnap_session');
      if (stored) {
        const session = JSON.parse(stored);
        // Check if expired
        if (session.expires_at && new Date(session.expires_at * 1000) > new Date()) {
          setUser(session.user);
          loadProfile(session.user.id, session.access_token).finally(() => setLoading(false));
        } else {
          localStorage.removeItem('jobsnap_session');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const signIn = async (email, password) => {
    const data = await supabaseAuth('token?grant_type=password', { email, password });
    localStorage.setItem('jobsnap_session', JSON.stringify(data));
    setUser(data.user);
    await loadProfile(data.user.id, data.access_token);
    return data;
  };

  const signUp = async (email, password) => {
    const data = await supabaseAuth('signup', { email, password });
    return data;
  };

  const signOut = () => {
    localStorage.removeItem('jobsnap_session');
    setUser(null);
    setProfile(null);
  };

  const getToken = () => {
    try {
      const stored = localStorage.getItem('jobsnap_session');
      if (!stored) return null;
      const session = JSON.parse(stored);
      return session.access_token || null;
    } catch (e) {
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const token = getToken();
    if (token) await loadProfile(user.id, token);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, getToken, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
