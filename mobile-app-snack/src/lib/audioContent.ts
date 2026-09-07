/**
 * Catálogo de conteúdo em áudio (demo).
 *
 * A ideia do produto: TODO curso da Órbita terá uma trilha em áudio — para
 * estudar dirigindo, na academia, tomando um café. Por enquanto são PRÉVIAS
 * demonstrativas geradas por narração (TTS) e hospedadas com as demais mídias
 * da plataforma (/uploads/seed/audio). Quando as faixas reais existirem, este
 * arquivo vira uma chamada de API (listAudioLessons()) sem mexer nas telas:
 * o shape AudioTrack é o contrato.
 *
 * fallbackUrl: enquanto a mídia real não vai ao ar no servidor de produção
 * (assets sobem no próximo deploy), o player tenta uma mídia demo externa e
 * estável — assim o áudio NUNCA fica "mudo sem explicar" no Snack/web.
 */
import type { AudioTrack } from "./audio";

/** Mídia demo externa e estável (usada apenas se o source principal falhar). */
const DEMO_FALLBACK_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

/** Paths resolvidos em runtime com assetUrl() (mesmo servidor da API). */
export const DEMO_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "previa-fundamentos-ia",
    title: "Fundamentos de IA · Ep. 1",
    subtitle: "Áudio-aula · Trilha IA para Estudantes",
    artwork: "/uploads/seed/course-ia-fundamentos.png",
    source: "/uploads/seed/audio/aula-fundamentos-preview.mp3",
    fallbackUrl: DEMO_FALLBACK_URL,
  },
  {
    id: "previa-estudar-sem-trapacear",
    title: "Estudar com IA sem trapacear",
    subtitle: "Áudio-aula · Métodos de estudo",
    artwork: "/uploads/seed/course-ia-prompts.png",
    source: "/uploads/seed/audio/aula-estudar-preview.mp3",
    fallbackUrl: DEMO_FALLBACK_URL,
  },
];

/** Faixa genérica de prévia usada na página de venda de cada curso. */
export function coursePreviewTrack(
  courseTitle: string,
  courseId: string,
  coverUrl?: string | null
): AudioTrack {
  return {
    id: `previa-curso-${courseId}`,
    title: courseTitle,
    subtitle: "Áudio-aula · Prévia do curso",
    artwork: coverUrl ?? null,
    source: "/uploads/seed/audio/aula-fundamentos-preview.mp3",
    fallbackUrl: DEMO_FALLBACK_URL,
  };
}
