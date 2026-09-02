/**
 * Contador global de mensagens não lidas — store mínimo com assinatura
 * compatível com useSyncExternalStore (React 19). A tab bar lê o valor para
 * desenhar o badge da aba Mensagens; a tela de conversas e o chat atualizam
 * depois de listar/enviar (o GET de conversas já marca como lidas no servidor).
 */
type Listener = () => void;

let count = 0;
const listeners = new Set<Listener>();

export const unreadStore = {
  /** Snapshot síncrono (exigido pelo useSyncExternalStore). */
  get: (): number => count,
  /** Atualiza o contador (apenas quando muda, para evitar renders à toa). */
  set(next: number): void {
    const n = Math.max(0, Math.trunc(next) || 0);
    if (n === count) return;
    count = n;
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
