import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthCtx = createContext(null);

const KEYS = { USER: "user", TOKEN: "token" };
const ALIASES = {
  USER: ["user", "authUser", "currentUser"],
  TOKEN: ["token", "authToken", "accessToken"],
};

function readFromStorage() {
  let user = null, token = null;
  try {
    for (const k of ALIASES.USER) {
      const raw = localStorage.getItem(k);
      if (raw) { user = JSON.parse(raw); break; }
    }
    for (const k of ALIASES.TOKEN) {
      const raw = localStorage.getItem(k);
      if (raw) { token = raw; break; }
    }
  } catch {}
  return { user, token };
}

export function AuthProvider({ children }) {
  const [{ user, token }, setAuth] = useState(() => readFromStorage());

  useEffect(() => { setAuth(readFromStorage()); }, []);
  useEffect(() => {
    const onStorage = () => setAuth(readFromStorage());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (nextUser, nextToken) => {
    try {
      if (nextUser) localStorage.setItem(KEYS.USER, JSON.stringify(nextUser));
      if (nextToken) localStorage.setItem(KEYS.TOKEN, nextToken);
    } catch {}
    setAuth({ user: nextUser || null, token: nextToken || null });
  };

  const logout = () => {
    try { [...ALIASES.USER, ...ALIASES.TOKEN].forEach((k) => localStorage.removeItem(k)); } catch {}
    setAuth({ user: null, token: null });
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/api/users/me");
      const next = data || null;
      if (next) localStorage.setItem(KEYS.USER, JSON.stringify(next));
      setAuth((s) => ({ ...s, user: next }));
      return next;
    } catch {
      return null;
    }
  };

  const value = useMemo(() => ({ user, token, login, logout, refreshUser }), [user, token]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
