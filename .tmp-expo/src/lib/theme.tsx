/**
 * ThemeProvider: controla o modo Claro/Escuro do app.
 *
 * - Mantém o modo no estado do React E no singleton mutável de src/theme.ts
 *   (applyMode muta theme.colors antes do re-render).
 * - Persiste a escolha com expo-secure-store (mesma estratégia do auth.tsx:
 *   no preview web do Snack vira localStorage; no aparelho, storage
 *   criptografado).
 * - App.js lê useThemeMode() e remonta a árvore com key={mode} para que todos
 *   os estilos (StyleSheet via factories) recalculem com a paleta nova.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { applyMode, currentMode, type ThemeMode } from "../theme";

const THEME_KEY = "mentorhub.theme.mode";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light";
}

async function persistMode(mode: ThemeMode): Promise<void> {
  try {
    await SecureStore.setItemAsync(THEME_KEY, mode);
  } catch {
    // Sem persistência disponível — o modo segue válido só nesta sessão.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => currentMode());

  // Restaura o modo salvo no aparelho na abertura do app.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_KEY);
        if (active && isThemeMode(saved)) {
          applyMode(saved);
          setModeState(saved);
        }
      } catch {
        // Sem persistência disponível (ex.: preview web do Snack) — segue o padrão.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    applyMode(next); // muta o singleton de tema antes do re-render
    setModeState(next);
    void persistMode(next);
  }, []);

  const toggle = useCallback(() => {
    setMode(currentMode() === "dark" ? "light" : "dark");
  }, [setMode]);

  const value = useMemo<ThemeContextValue>(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode deve ser usado dentro de <ThemeProvider>");
  return ctx;
}
