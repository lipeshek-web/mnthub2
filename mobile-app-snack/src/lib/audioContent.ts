/**
 * Catálogo de conteúdo em áudio (demo).
 *
 * A ideia do produto: TODO curso da Órbita terá uma trilha em áudio — para
 * estudar dirigindo, na academia, tomando um café. Por enquanto são PRÉVIAS
 * demonstrativas geradas por narração (TTS) e hospedadas com as demais mídias
 * da plataforma (/uploads/seed/audio). Quando as faixas reais existirem, este
 * arquivo vira uma chamada de API (listAudioLessons()) sem mexer nas telas:
 * o shape AudioTrack é o contrato.
 */
import type { AudioTrack } from "./audio";

/** Paths resolvidos em runtime com assetUrl() (mesmo servidor da API). */
export const DEMO_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "previa-fundamentos-ia",
    title: "Fundamentos de IA · Ep. 1",
    subtitle: "Áudio-aula · Trilha IA para Estudantes",
    artwork: "/uploads/seed/course-ia-fundamentos.png",
    source: "/uploads/seed/audio/aula-fundamentos-preview.mp3",
  },
  {
    id: "previa-estudar-sem-trapacear",
    title: "Estudar com IA sem trapacear",
    subtitle: "Áudio-aula · Métodos de estudo",
    artwork: "/uploads/seed/course-ia-prompts.png",
    source: "/uploads/seed/audio/aula-estudar-preview.mp3",
  },
];

/** Faixa genérica de prévia usada na página de venda de cada curso. */
export function coursePreviewTrack(courseTitle: string, courseId: string, coverUrl?: string | null): AudioTrack {
  return {
    id: `previa-curso-${courseId}`,
    title: courseTitle,
    subtitle: "Áudio-aula · Prévia do curso",
    artwork: coverUrl ?? null,
    source: "/uploads/seed/audio/aula-fundamentos-preview.mp3",
  };
}
