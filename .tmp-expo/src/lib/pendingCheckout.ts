/**
 * Intenção de compra pendente: guardada quando o usuário tenta comprar um
 * curso pago e o fluxo é interrompido (ex.: sessão expirou no meio). Ao
 * autenticar de novo, a Home retoma direto no curso que estava em checkout.
 */
import * as SecureStore from "expo-secure-store";

const KEY = "mentorhub.checkout.pending";

export async function savePendingCheckout(courseId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, courseId);
  } catch {
    /* web sem storage disponível — segue o fluxo sem retomada */
  }
}

export async function readPendingCheckout(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function clearPendingCheckout(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* ignore */
  }
}
