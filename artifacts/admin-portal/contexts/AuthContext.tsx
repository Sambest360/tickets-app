import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "cig_admin_token";
const USERNAME_KEY = "cig_admin_username";

let _tokenCache: string | null = null;
setAuthTokenGetter(() => _tokenCache);

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const t = await SecureStore.getItemAsync(TOKEN_KEY);
        const u = await SecureStore.getItemAsync(USERNAME_KEY);
        if (t) {
          _tokenCache = t;
          setToken(t);
          setUsername(u);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const login = async (newToken: string, newUsername: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(USERNAME_KEY, newUsername);
    _tokenCache = newToken;
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USERNAME_KEY);
    _tokenCache = null;
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, username, isAuthenticated: !!token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
