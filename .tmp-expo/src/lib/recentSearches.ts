/**
 * Buscas recentes da tela "Busca" — persistidas no aparelho via SecureStore
 * (chave "mentorhub.busca.recentes") no mesmo padrão do pendingCheckout.ts:
 * qualquer falha de storage (ex.: preview web do Snack) é silenciosa e o app
 * segue funcionando só com o cache em memória.
 *
 * API: listRecent / pushRecent / removeRecent / clearRecent + subscribeRecent
 * (mecanismo reativo simples: Set de listeners notificado a cada mudança).
 */
import * as SecureStore from "expo-secure-store";

const KEY = "mentorhub.busca.recentes";
const MAX_RECENT = 8;

/* Cache em memória (null = ainda não carregado do storage). */
let cache: string[] | null = null;
let loadPromise: Promise<string[]> | null = null;
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
export function subscribeRecent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function readStore(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .slice(0, MAX_RECENT);
  } catch {
    /* web sem storage ou conteúdo inválido — segue sem recentes */
    return [];
  }
}

async function persist(list: string[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(list));
  } catch {
    /* web sem storage — recentes vivem só na sessão */
  }
}

function applyNext(next: string[]): void {
  cache = next;
  notify();
  void persist(next);
}

/** Buscas recentes (mais recente primeiro). Lê do storage só na 1ª chamada. */
export async function listRecent(): Promise<string[]> {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = readStore().then((list) => {
      cache = list;
      return list;
    });
  }
  return loadPromise;
}

/** Guarda um termo (trim, ignora vazio, sem duplicatas, máximo 8). */
export async function pushRecent(q: string): Promise<void> {
  const term = q.trim();
  if (!term) return;
  const current = await listRecent();
  const rest = current.filter((value) => value.toLowerCase() !== term.toLowerCase());
  applyNext([term, ...rest].slice(0, MAX_RECENT));
}

/** Remove um termo específico das recentes. */
export async function removeRecent(q: string): Promise<void> {
  const term = q.trim();
  const current = await listRecent();
  const next = current.filter((value) => value.toLowerCase() !== term.toLowerCase());
  if (next.length === current.length) return;
  applyNext(next);
}

/** Limpa todas as recentes. */
export async function clearRecent(): Promise<void> {
  applyNext([]);
}
