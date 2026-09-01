/**
 * AuthProvider: guarda o usuário logado, persiste o token no SecureStore e
 * restaura a sessão ao abrir o app (com splash — sem "piscar" para o login).
 * Um 401 em qualquer chamada autenticada dispara logout automático.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getMe,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  setUnauthorizedHandler,
  type LoginResponse,
  type MeUser,
} from "./api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: MeUser | null;
  /** Faz login (login + /auth/me) e atualiza o estado global. */
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Revalida os dados do usuário (ex.: após marcar notificações como lidas). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** O login não devolve creditCents/unreadNotifications — completamos até o /auth/me responder. */
function withDefaults(user: LoginResponse["user"]): MeUser {
  return { ...user, creditCents: 0, unreadNotifications: 0 };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<MeUser | null>(null);

  const applyUser = useCallback((next: MeUser | null) => {
    setUser(next);
    setStatus(next ? "authenticated" : "anonymous");
  }, []);

  // 401 em qualquer chamada autenticada → limpa estado e o gate volta pro login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("anonymous");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Restaura a sessão salva no SecureStore na abertura do app.
  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getToken();
      if (!token) {
        if (active) applyUser(null);
        return;
      }
      try {
        const { user: me } = await getMe();
        if (active) applyUser(me);
      } catch (err) {
        if (!active) return;
        // Token inválido já foi limpo pelo handler do 401. Outros erros
        // (ex.: servidor fora do ar) também caem no login — o token continua salvo.
        void err;
        applyUser(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      try {
        const { user: me } = await getMe();
        applyUser(me);
      } catch {
        applyUser(withDefaults(data.user));
      }
    },
    [applyUser]
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const refresh = useCallback(async () => {
    const { user: me } = await getMe();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, refresh }),
    [status, user, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
