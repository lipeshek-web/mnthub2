/**
 * Dicas de UI entre telas (sem estado global pesado).
 *
 * sessionSegment: quando o checkout de uma sessão termina (ou o usuário pede
 * "ver minhas sessões" na confirmação do agendamento), a aba Mentorias deve
 * abrir direto no segmento "Minhas sessões" — e não no "Mentores". A dica é
 * consumida uma única vez no foco da tela (MentoriasScreen).
 */

let sessionsSegmentHint = false;

export function requestSessionsSegment() {
  sessionsSegmentHint = true;
}

/** Lê e limpa a dica (uma única vez). */
export function consumeSessionsSegmentHint(): boolean {
  const value = sessionsSegmentHint;
  sessionsSegmentHint = false;
  return value;
}
