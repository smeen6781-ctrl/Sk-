import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { initAuth, googleSignIn, logoutFirebase, getAccessToken } from '../lib/firebase';
import { syncGoogleUser } from '../lib/api';

interface AuthContextType {
  user: User;
  isLoggedIn: boolean;
  isGoogleAuthenticated: boolean;
  googleToken: string | null;
  loginGoogle: () => Promise<void>;
  setUserFromData: (user: User) => void;
  logout: () => Promise<void>;
  updateCredits: (newCredits: number) => void;
  refreshUser: () => Promise<void>;
}

const defaultUser: User = {
  id: 'demo-user-1',
  name: 'Demo Artist',
  email: 'artist@sk-ai.studio',
  role: 'user',
  credits: 60,
  subscription_plan: 'creator',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('sk_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return defaultUser;
  });

  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState<boolean>(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setGoogleToken(token);
        setIsGoogleAuthenticated(true);
        try {
          const synced = await syncGoogleUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google Artist',
            email: firebaseUser.email || undefined,
            avatar: firebaseUser.photoURL || undefined,
          });
          setUser(synced);
          localStorage.setItem('sk_user_session', JSON.stringify(synced));
        } catch (e) {
          console.error('Error syncing Google user:', e);
        }
      },
      () => {
        setIsGoogleAuthenticated(false);
        setGoogleToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const loginGoogle = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleToken(result.accessToken);
        setIsGoogleAuthenticated(true);
        const synced = await syncGoogleUser({
          id: result.user.uid,
          name: result.user.displayName || result.user.email?.split('@')[0] || 'Google Artist',
          email: result.user.email || undefined,
          avatar: result.user.photoURL || undefined,
        });
        setUser(synced);
        localStorage.setItem('sk_user_session', JSON.stringify(synced));
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
      throw err;
    }
  };

  const setUserFromData = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('sk_user_session', JSON.stringify(newUser));
  };

  const updateCredits = (newCredits: number) => {
    setUser((prev) => {
      const updated = { ...prev, credits: newCredits };
      localStorage.setItem('sk_user_session', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      // ignore
    }
    setIsGoogleAuthenticated(false);
    setGoogleToken(null);
    setUser(defaultUser);
    localStorage.removeItem('sk_user_session');
  };

  const refreshUser = async () => {
    try {
      const res = await fetch(`/api/auth/me?userId=${user.id}`);
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('sk_user_session', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user.id),
        isGoogleAuthenticated,
        googleToken,
        loginGoogle,
        setUserFromData,
        logout,
        updateCredits,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
