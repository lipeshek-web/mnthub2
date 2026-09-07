/**
 * Player de áudio global da Órbita — o "Spotify" do app.
 *
 * Por que um contexto no ROOT (App.js, fora do NavigationContainer e fora do
 * key={mode})? Para que o som CONTINUE tocando enquanto o usuário navega por
 * qualquer aba/tela e mesmo ao trocar de tema — a instância do expo-av vive no
 * provider, não nas telas. A tela cheia (AudioScreen) e o mini-player (na tab
 * bar) são apenas VIEWS do mesmo estado.
 *
 * API:
 *   play(track)        → toca a faixa (mesma faixa = play/pause)
 *   toggle()           → play/pause rápido (mini-player)
 *   seek(ms)           → pula para a posição
 *   skip(seconds)      → ±15s
 *   setSpeed(rate)     → velocidade (1x · 1.25x · 1.5x · 2x)
 *   close()            → para e limpa a faixa
 *
 * Todos os métodos são tolerantes a falha (web/old server): nada derruba o app
 * se o áudio não carregar — o erro aparece como estado (error) e a UI resolve.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import * as AV from "expo-av";
import { assetUrl } from "./api";
import { useAuth } from "./auth";

export interface AudioTrack {
  id: string;
  title: string;
  subtitle: string;
  /** Path relativo ("/uploads/...") ou URL absoluta — resolvido com assetUrl. */
  artwork?: string | null;
  /** Path relativo ("/uploads/...") ou URL absoluta do áudio. */
  source: string;
  /**
   * URL alternativa usada se o source principal falhar (404/offline).
   * Usado pelas prévias demo enquanto as mídias reais não foram publicadas
   * no servidor de produção — o player nunca fica “mudo sem explicar”.
   */
  fallbackUrl?: string | null;
}

interface AudioContextValue {
  current: AudioTrack | null;
  isPlaying: boolean;
  /** true durante load/buffer da faixa. */
  isLoading: boolean;
  /** Posição atual em milissegundos. */
  position: number;
  /** Duração total em milissegundos (0 até o servidor informar). */
  duration: number;
  /** Velocidade atual (1, 1.25, 1.5, 2). */
  speed: number;
  error: string | null;
  play: (track: AudioTrack) => void;
  toggle: () => void;
  seek: (ms: number) => void;
  skip: (seconds: number) => void;
  setSpeed: (rate: number) => void;
  close: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error("useAudio precisa estar dentro do AudioProvider (App.js).");
  }
  return ctx;
}

const SKIP_MS = 15_000;
const RATES = [1, 1.25, 1.5, 2];

/**
 * URLs candidatas de uma faixa, em ordem de preferência:
 *   1. assetUrl(source)  → servidor atual (produção / configurado);
 *   2. mesma origem (web) → funciona no fallback web (/app-mobile) servido
 *      junto do site, mesmo quando o servidor da API está desatualizado;
 *   3. fallbackUrl        → mídia demo externa e estável (última linha).
 */
function candidateUris(track: AudioTrack): string[] {
  const primary = assetUrl(track.source) ?? track.source;
  const list = [primary];
  if (Platform.OS === "web" && typeof window !== "undefined" && track.source.startsWith("/")) {
    const sameOrigin = `${window.location.origin}${track.source}`;
    if (!list.includes(sameOrigin)) list.push(sameOrigin);
  }
  if (track.fallbackUrl && !list.includes(track.fallbackUrl)) list.push(track.fallbackUrl);
  return list;
}

/**
 * Filtra as candidatas mortas com um HEAD barato (só web): no web o
 * createAsync pode RESOLVER mesmo com URL 404/403 (o erro chega depois, no
 * status), o que furaria a cadeia de fallback. Resposta ruim → descarta;
 * CORS/rede → mantém (deixa o createAsync decidir). No nativo o createAsync
 * já falha na hora, então seguimos com a lista inteira.
 */
async function playableCandidates(track: AudioTrack): Promise<string[]> {
  const candidates = candidateUris(track);
  if (Platform.OS !== "web" || typeof fetch !== "function") return candidates;
  const kept: string[] = [];
  for (const uri of candidates) {
    if (!/^https?:/.test(uri)) {
      kept.push(uri);
      continue;
    }
    try {
      const res = await fetch(uri, { method: "HEAD" });
      if (res.ok) kept.push(uri);
    } catch {
      kept.push(uri);
    }
  }
  return kept.length > 0 ? kept : candidates;
}

export function nextRate(rate: number): number {
  const idx = RATES.indexOf(rate);
  return RATES[(idx + 1) % RATES.length] ?? 1;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<AV.Audio.Sound | null>(null);
  // id da faixa carregada no soundRef (evita recarregar a mesma faixa).
  const loadedIdRef = useRef<string | null>(null);
  const rateRef = useRef(1);
  // evita setState após close() com callbacks em voo
  const generationRef = useRef(0);

  const [current, setCurrent] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [error, setError] = useState<string | null>(null);

  /** Callback de status do expo-av — única fonte de verdade de position/duração. */
  const onStatus = useCallback((status: AV.AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ("error" in status && status.error) setError(String(status.error));
      return;
    }
    setIsPlaying(Boolean(status.isPlaying));
    setPosition(status.positionMillis ?? 0);
    if (status.durationMillis && status.durationMillis > 0) {
      setDuration(status.durationMillis);
    }
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  }, []);

  /** Configura o modo de áudio 1x (iOS: tocar mesmo no silencioso). */
  const ensureAudioMode = useCallback(async () => {
    try {
      await AV.Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
    } catch {
      /* web/nativo antigo: segue sem modo especial */
    }
  }, []);

  const unloadCurrent = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    loadedIdRef.current = null;
    if (!sound) return;
    try {
      await sound.setOnPlaybackStatusUpdate(null as never);
    } catch {
      /* ignore */
    }
    try {
      await sound.unloadAsync();
    } catch {
      /* ignore */
    }
  }, []);

  const play = useCallback(
    (track: AudioTrack) => {
      // Mesma faixa → só alterna play/pause (mini-player e tela cheia usam toggle).
      if (loadedIdRef.current === track.id && soundRef.current) {
        void (async () => {
          try {
            const status = await soundRef.current!.getStatusAsync();
            if (status.isLoaded && status.isPlaying) await soundRef.current!.pauseAsync();
            else await soundRef.current!.playAsync();
          } catch {
            setError("Não foi possível alternar o áudio.");
          }
        })();
        return;
      }

      const generation = ++generationRef.current;
      setCurrent(track);
      setPosition(0);
      setDuration(0);
      setError(null);
      setIsLoading(true);
      setIsPlaying(false);

      void (async () => {
        await ensureAudioMode();
        // Descarta a faixa anterior (fora do caminho crítico).
        const old = soundRef.current;
        soundRef.current = null;
        if (old) {
          try {
            await old.unloadAsync();
          } catch {
            /* ignore */
          }
        }
        // Tenta as URLs candidatas vivas, em ordem (servidor → origem → demo).
        let lastError: unknown = null;
        const uris = await playableCandidates(track);
        for (const uri of uris) {
          try {
            const { sound } = await AV.Audio.Sound.createAsync(
              { uri },
              {
                shouldPlay: true,
                progressUpdateIntervalMillis: 500,
                rate: rateRef.current,
                shouldCorrectPitch: true,
                pitchCorrectionQuality: AV.Audio.PitchCorrectionQuality.High,
              },
              onStatus
            );
            if (generation !== generationRef.current) {
              // O usuário já pediu outra faixa enquanto carregávamos.
              try {
                await sound.unloadAsync();
              } catch {
                /* ignore */
              }
              return;
            }
            soundRef.current = sound;
            loadedIdRef.current = track.id;
            setIsLoading(false);
            return;
          } catch (err) {
            lastError = err;
          }
        }
        if (generation !== generationRef.current) return;
        setIsLoading(false);
        setError(
          lastError instanceof Error
            ? `Não foi possível tocar: ${lastError.message}`
            : "Não foi possível tocar este áudio agora."
        );
      })();
    },
    [ensureAudioMode, onStatus]
  );

  const toggle = useCallback(() => {
    const sound = soundRef.current;
    if (!sound) return;
    void (async () => {
      try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) return;
        if (status.isPlaying) await sound.pauseAsync();
        else await sound.playAsync();
      } catch {
        setError("Não foi possível alternar o áudio.");
      }
    })();
  }, []);

  const seek = useCallback((ms: number) => {
    const sound = soundRef.current;
    if (!sound) return;
    void (async () => {
      try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) return;
        const clamped = Math.max(0, Math.min(ms, status.durationMillis ?? ms));
        await sound.setPositionAsync(clamped);
        setPosition(clamped);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const skip = useCallback(
    (seconds: number) => {
      seek(position + seconds * 1000);
    },
    [seek, position]
  );

  const setSpeed = useCallback((rate: number) => {
    const clean = RATES.includes(rate) ? rate : 1;
    rateRef.current = clean;
    setSpeedState(clean);
    const sound = soundRef.current;
    if (!sound) return;
    void (async () => {
      try {
        await sound.setRateAsync(clean, true);
      } catch {
        /* web antigo pode não suportar — ignora */
      }
    })();
  }, []);

  const close = useCallback(() => {
    generationRef.current += 1;
    setIsPlaying(false);
    setIsLoading(false);
    setPosition(0);
    setDuration(0);
    setCurrent(null);
    setError(null);
    void unloadCurrent();
  }, [unloadCurrent]);

  // Logout (ou falha de sessão) → silencia na hora; sem som órfão.
  const { status } = useAuth();
  useEffect(() => {
    if (status !== "authenticated") close();
  }, [status, close]);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      void unloadCurrent();
    };
  }, [unloadCurrent]);

  const value = useMemo<AudioContextValue>(
    () => ({
      current,
      isPlaying,
      isLoading,
      position,
      duration,
      speed,
      error,
      play,
      toggle,
      seek,
      skip,
      setSpeed,
      close,
    }),
    [
      current,
      isPlaying,
      isLoading,
      position,
      duration,
      speed,
      error,
      play,
      toggle,
      seek,
      skip,
      setSpeed,
      close,
    ]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

/** Formata milissegundos como "m:ss" (4:07). */
export function formatMs(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const AUDIO_SKIP_SECONDS = SKIP_MS / 1000;
