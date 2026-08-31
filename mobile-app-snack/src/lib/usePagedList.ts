/**
 * Hook de lista paginada: primeira carga, pull-to-refresh, "carregar mais"
 * (infinite scroll) e recarga automática quando os filtros mudam.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { errMessage, type Paged } from "./api";

export interface PagedList<T> {
  items: T[];
  page: number;
  total: number;
  hasMore: boolean;
  /** Primeira carga (tela inteira). */
  loading: boolean;
  /** Pull-to-refresh. */
  refreshing: boolean;
  /** Paginando (footer). */
  loadingMore: boolean;
  error: string | null;
  refresh: () => void;
  reload: () => void;
  loadMore: () => void;
}

type FetchPage<T> = (page: number) => Promise<Paged<T>>;

export function usePagedList<T>(fetchPage: FetchPage<T>, deps: unknown[]): PagedList<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sempre usamos a versão mais nova do fetcher (evita closures velhas nos callbacks).
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  // Evita chamadas concorrentes (ex.: fim da lista + refresh ao mesmo tempo).
  const busyRef = useRef(false);

  const load = useCallback(async (targetPage: number, mode: "initial" | "refresh" | "more") => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (mode === "initial") setLoading(true);
    else if (mode === "refresh") setRefreshing(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const res = await fetchRef.current(targetPage);
      setItems((prev) => (mode === "more" ? [...prev, ...res.items] : res.items));
      setPage(res.page);
      setTotal(res.total);
      setHasMore(res.hasMore);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      busyRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Recarrega do zero quando os filtros/dependências mudam.
  useEffect(() => {
    void load(1, "initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => void load(1, "refresh"), [load]);
  const reload = useCallback(() => void load(1, "initial"), [load]);
  const loadMore = useCallback(() => {
    if (busyRef.current || !hasMore || loadingMore) return;
    void load(page + 1, "more");
  }, [hasMore, loadingMore, page, load]);

  return { items, page, total, hasMore, loading, refreshing, loadingMore, error, refresh, reload, loadMore };
}
