import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { User } from '../lib/types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (payload: { token: string; user: User }) => void;
  logout: () => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fintrack-token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('fintrack-user');

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('fintrack-user');
      localStorage.removeItem('fintrack-token');
      return null;
    }
  });

  const value = useMemo(
    () => ({
      user,
      token,
      login: ({ token: nextToken, user: nextUser }: { token: string; user: User }) => {
        setToken(nextToken);
        setUser(nextUser);
        localStorage.setItem('fintrack-token', nextToken);
        localStorage.setItem('fintrack-user', JSON.stringify(nextUser));
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('fintrack-token');
        localStorage.removeItem('fintrack-user');
      },
      updateUser: (nextUser: User) => {
        setUser(nextUser);
        localStorage.setItem('fintrack-user', JSON.stringify(nextUser));
      }
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
