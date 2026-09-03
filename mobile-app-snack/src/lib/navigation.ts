/**
 * Navegação de volta previsível em TODAS as telas do stack.
 *
 * Problema que resolve: com o stack JS do react-navigation, um goBack fora de
 * hora (toque duplo, transição em andamento, pilha sem origem) deixa a tela
 * "meio aberta" — o usuário descrevia como "o voltar fica bugado". Também há
 * telas com estágios internos (agendamento do mentor, PIX do checkout,
 * conversa aberta) onde o botão nativo do Android DESempilhava a tela inteira
 * em vez de voltar um estágio.
 *
 * Duas peças:
 *  - useSafeBack(navigation): callback estável para o botão de voltar do
 *    cabeçalho — ignora toques repetidos (< 600ms), desempilha só quando há
 *    o que desempilhar e, no limite, volta ao pager ("Main") mantendo a aba.
 *  - useBackStage(active, handler): conecta o BOTÃO NATIVO (Android) a um
 *    estágio interno; handler retorna true quando consumiu o evento. Sem
 *    handler ativo, o evento segue para o react-navigation (pop normal).
 */
import { useCallback, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

export function useSafeBack(navigation: unknown) {
  const lastPressRef = useRef(0);
  const navRef = useRef(navigation);
  navRef.current = navigation;

  return useCallback(() => {
    const now = Date.now();
    // Guarda anti-duplo-toque: dois goBack em menos de 600ms travam o stack JS.
    if (now - lastPressRef.current < 600) return;
    lastPressRef.current = now;
    const nav = navRef.current as
      | { canGoBack?: () => boolean; goBack?: () => void; navigate?: (name: string) => void }
      | undefined;
    if (nav?.canGoBack?.()) nav.goBack?.();
    else nav?.navigate?.("Main");
  }, []);
}

/**
 * Botão nativo (Android) para estágio interno de tela.
 * - active=false → evento segue para o navigator (pop padrão).
 * - handler() => true → evento consumido (ex.: voltar da conversa à lista).
 */
export function useBackStage(active: boolean, handler: () => boolean) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => handlerRef.current());
    return () => sub.remove();
  }, [active]);
}
