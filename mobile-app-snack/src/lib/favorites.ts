/**
 * Favoritos ("Salvos") locais do aparelho — cursos e livros, sem endpoint novo
 * na API. Guardados no SecureStore (chave "mentorhub.favorites.v1") como array
 * de { type, id, title, savedAt }, no padrão try/catch silencioso do
 * pendingCheckout.ts (web sem storage segue funcionando só em memória).
 *
 * Reatividade: cache module-level + Set de listeners + notify(). O hook
 * useFavorites() se inscreve e força re-render a cada mudança, para o coração
 * dos cards atualizar na hora (inclusive remoções feitas na tela Salvos).
 */
import { useEffect, useReducer, useState } from "react";
import * as SecureStore from "expo-secure-store";

export type FavType = "course" | "book";

export interface FavRef {
  type: FavType;
  id: string;
  title: string;
  savedAt: number;
}

const KEY = "mentorhub.favorites.v1";

/* Cache em memória (null = ainda não carregado do storage). */
let cache: FavRef[] | null = null;
let loadPromise: Promise<FavRef[]> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* listener com erro não derruba os outros */
    }
  });
}

/** Inscreve um listener para mudanças; devolve a função de desinscrição. */
export function subscribeFavorites(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Valida o conteúdo lido do storage (estrutura inesperada vira lista vazia). */
function sanitize(raw: unknown): FavRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is FavRef =>
      Boolean(entry) &&
      typeof entry === "object" &&
      ((entry as FavRef).type === "course" || (entry as FavRef).type === "book") &&
      typeof (entry as FavRef).id === "string" &&
      typeof (entry as FavRef).title === "string"
  );
}

async function readStore(): Promise<FavRef[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    return sanitize(JSON.parse(raw));
  } catch {
    /* web sem storage ou JSON inválido — segue sem favoritos */
    return [];
  }
}

async function persist(list: FavRef[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(list));
  } catch {
    /* web sem storage — favoritos vivem só na sessão */
  }
}

function applyNext(next: FavRef[]): void {
  cache = next;
  notify();
  void persist(next);
}

/** Lista de favoritos. Lê do storage só na 1ª chamada (depois usa o cache). */
export async function listFavorites(): Promise<FavRef[]> {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = readStore().then((list) => {
      cache = list;
      return list;
    });
  }
  return loadPromise;
}

/** Adiciona um favorito (idempotente — já existente é ignorado). */
export async function addFavorite(ref: FavRef): Promise<void> {
  const current = await listFavorites();
  if (current.some((fav) => fav.type === ref.type && fav.id === ref.id)) return;
  applyNext([...current, { type: ref.type, id: ref.id, title: ref.title, savedAt: Date.now() }]);
}

/** Remove um favorito por type + id (sem efeito se não existir). */
export async function removeFavorite(type: FavType, id: string): Promise<void> {
  const current = await listFavorites();
  const next = current.filter((fav) => !(fav.type === type && fav.id === id));
  if (next.length === current.length) return;
  applyNext(next);
}

/** Alterna o favorito; devolve true se ficou favorito, false se foi removido. */
export async function toggleFavorite(ref: FavRef): Promise<boolean> {
  const current = await listFavorites();
  const exists = current.some((fav) => fav.type === ref.type && fav.id === ref.id);
  if (exists) {
    await removeFavorite(ref.type, ref.id);
    return false;
  }
  await addFavorite(ref);
  return true;
}

/**
 * Hook reativo dos favoritos: se inscreve nos listeners e devolve isFavorite()
 * (leitura direta do cache a cada render) e toggle() para os cards.
 */
export function useFavorites() {
  const [, forceUpdate] = useReducer((count: number) => count + 1, 0);
  const [ready, setReady] = useState(cache !== null);

  useEffect(() => {
    let alive = true;
    // Garante a 1ª carga do storage e marca ready quando terminar.
    void listFavorites().then(() => {
      if (!alive) return;
      setReady(true);
      forceUpdate();
    });
    const unsubscribe = subscribeFavorites(() => {
      forceUpdate();
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  function isFavorite(type: FavType, id: string): boolean {
    return (cache ?? []).some((fav) => fav.type === type && fav.id === id);
  }

  function toggle(ref: FavRef): void {
    void toggleFavorite(ref);
  }

  return { ready, isFavorite, toggle };
}
