/**
 * Leitor de PDF NATIVO do MentorHub — sem WebView e sem browser embutido.
 *
 * Como funciona:
 * - Os livros do catálogo trazem as páginas PRÉ-RENDERIZADAS como assets do
 *   próprio app (src/lib/bookPages.ts) — abrir é instantâneo e funciona no
 *   web e no Expo Go. Livros sem páginas embutidas tentam o leitor dinâmico
 *   da API (/api/v1/library/:id/reader) e, por último, o "abrir original".
 * - Pager horizontal página a página (ScrollView pagingEnabled) com janela de
 *   renderização ±1 página: só monta a página aberta e vizinhas.
 * - Dois toques na página alterna zoom 2x com pan (ScrollViews aninhados);
 *   dois toques de novo volta ao tamanho normal.
 * - Barra de progresso arrastável (PanResponder) + botões anterior/próxima.
 * - Modo noturno (escurece a página) persistido no aparelho.
 * - Retoma a leitura da página em que parou (por livro, em SecureStore).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { errMessage, getLibraryReader } from "../lib/api";
import type { StaticBook } from "../lib/bookPages";
import { theme } from "../theme";
import { ErrorBox } from "./ErrorBox";

const READING_PREFIX = "mentorhub.reading.";
const NIGHT_KEY = "mentorhub.reader.night";
/** Quantas páginas vizinhas ficam montadas ao redor da página aberta. */
const WINDOW = 1;

/** Fonte de uma página: asset local (número/{uri}) ou imagem remota. */
type PageSource = number | { uri: string };

interface ResolvedPage {
  n: number;
  source: PageSource;
}

interface ResolvedManifest {
  totalPages: number;
  pages: ResolvedPage[];
}

interface PdfReaderProps {
  visible: boolean;
  /** Id do item da biblioteca (chave do progresso salvo). */
  itemId: string;
  title: string;
  /** Páginas embutidas no app (src/lib/bookPages.ts) — abertura instantânea. */
  staticManifest?: StaticBook | null;
  /** PDF original — habilita "abrir no navegador" no menu do leitor. */
  originalUrl?: string | null;
  onClose: () => void;
}

async function readStore(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null; // sem persistência (ex.: preview web) — segue em memória
  }
}

/* ------------------------------------------------------------------ */
/* Barra de progresso arrastável                                       */
/* ------------------------------------------------------------------ */

interface SeekBarProps {
  /** Página atual (1-based). */
  value: number;
  total: number;
  disabled?: boolean;
  /** Disparado continuamente durante o arraste (busca ao vivo). */
  onSeek: (page: number) => void;
  /** Disparado ao soltar o dedo. */
  onCommit: () => void;
}

function SeekBar({ value, total, disabled, onSeek, onCommit }: SeekBarProps) {
  const styles = makeStyles();
  const trackW = useRef(1);
  const disabledRef = useRef(false);
  const seekingRef = useRef(false);
  const [seeking, setSeeking] = useState(false);
  disabledRef.current = !!disabled;

  // Refs para o PanResponder (criado uma vez) sempre ler valores atuais.
  const totalRef = useRef(total);
  const onSeekRef = useRef(onSeek);
  totalRef.current = total;
  onSeekRef.current = onSeek;

  const ratio = total > 1 ? (value - 1) / (total - 1) : 0;
  const pct = `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%`;

  const update = (x: number) => {
    const t = Math.min(Math.max(x / trackW.current, 0), 1);
    onSeekRef.current(1 + Math.round(t * (totalRef.current - 1)));
  };

  const end = useCallback(() => {
    if (!seekingRef.current) return;
    seekingRef.current = false;
    setSeeking(false);
    onCommit();
  }, [onCommit]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: (event) => {
        if (disabledRef.current) return;
        seekingRef.current = true;
        setSeeking(true);
        update(event.nativeEvent.locationX);
      },
      onPanResponderMove: (event) => {
        if (disabledRef.current) return;
        update(event.nativeEvent.locationX);
      },
      onPanResponderRelease: end,
      onPanResponderTerminate: end,
    })
  ).current;

  return (
    <View style={styles.seekWrap} {...pan.panHandlers}>
      <View
        style={styles.seekTrack}
        onLayout={(event) => {
          trackW.current = Math.max(event.nativeEvent.layout.width, 1);
        }}
      >
        <View style={[styles.seekFill, { width: pct }]} />
        <View
          style={[
            styles.seekThumb,
            { left: pct, transform: [{ translateX: -9 }, { scale: seeking ? 1.2 : 1 }] },
          ]}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Leitor                                                              */
/* ------------------------------------------------------------------ */

export function PdfReader({
  visible,
  itemId,
  title,
  staticManifest,
  originalUrl,
  onClose,
}: PdfReaderProps) {
  const styles = makeStyles();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  // Manifesto resolvido (páginas embutidas ou vindas da API). Com páginas
  // embutidas, já nasce pronto — zero espera ao abrir.
  const [manifest, setManifest] = useState<ResolvedManifest | null>(() =>
    staticManifest
      ? {
          totalPages: staticManifest.totalPages,
          pages: staticManifest.pages.map((page) => ({ n: page.n, source: page.source })),
        }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  /** Índice (0-based) visível durante o arraste — amplia a janela de render. */
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [night, setNight] = useState(false);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const [failedPages, setFailedPages] = useState<number[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const [pageH, setPageH] = useState(0);

  const pagerRef = useRef<ScrollView | null>(null);
  const lastTapRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = manifest?.totalPages ?? 0;
  const pages = manifest?.pages ?? [];
  const ready = manifest !== null && totalPages > 0;

  /* ------------------------- carregamento ------------------------- */

  const load = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    setZoomedIndex(null);
    setFailedPages([]);
    try {
      // 1) Páginas embutidas no app — instantâneo, sem rede.
      if (staticManifest && staticManifest.totalPages > 0) {
        setManifest({
          totalPages: staticManifest.totalPages,
          pages: staticManifest.pages.map((page) => ({ n: page.n, source: page.source })),
        });
      } else {
        // 2) Leitor dinâmico da API (livros sem páginas embutidas).
        setManifest(null);
        const res = await getLibraryReader(itemId);
        const next = res.reader;
        setManifest({
          totalPages: next.totalPages,
          pages: next.pages.map((page) => ({ n: page.n, source: { uri: page.url } })),
        });
      }
      // Retoma da página salva no aparelho (se válida e não for a primeira).
      const saved = parseInt((await readStore(READING_PREFIX + itemId)) ?? "", 10);
      const total = staticManifest ? staticManifest.totalPages : 0;
      if (Number.isFinite(saved) && saved > 1 && (total === 0 || saved <= total)) {
        setPage(saved);
        setResumeHint(`Retomando da página ${saved}`);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => setResumeHint(null), 2600);
      } else {
        setPage(1);
      }
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, [itemId, staticManifest]);

  useEffect(() => {
    if (!visible) return;
    void load();
    void readStore(NIGHT_KEY).then((saved) => setNight(saved === "1"));
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [visible, load]);

  // Persiste a página atual do livro (fire and forget).
  useEffect(() => {
    if (!visible || !ready || !itemId) return;
    void SecureStore.setItemAsync(READING_PREFIX + itemId, String(page)).catch(
      () => undefined
    );
  }, [visible, ready, itemId, page]);

  // Estado da página → rola o pager (botões, barra, retomada).
  useEffect(() => {
    if (!ready || !pagerRef.current) return;
    pagerRef.current.scrollTo({ x: (page - 1) * screenW, animated: true });
  }, [ready, page, screenW]);

  /* ---------------------------- ações ----------------------------- */

  const toggleNight = useCallback(() => {
    const next = !night;
    setNight(next);
    void SecureStore.setItemAsync(NIGHT_KEY, next ? "1" : "0").catch(() => undefined);
  }, [night]);

  const goToPage = useCallback(
    (target: number) => {
      if (!ready) return;
      const clamped = Math.min(Math.max(target, 1), totalPages);
      setZoomedIndex(null);
      setPage(clamped);
    },
    [ready, totalPages]
  );

  const openOriginal = useCallback(async () => {
    if (!originalUrl) return;
    try {
      await WebBrowser.openBrowserAsync(originalUrl);
    } catch {
      Alert.alert(
        "Não foi possível abrir",
        "Verifique se o dispositivo possui um navegador instalado."
      );
    }
  }, [originalUrl]);

  /** Dois toques na página alterna o zoom 2x. */
  const handlePageTap = useCallback(
    (index: number) => () => {
      const now = Date.now();
      if (now - lastTapRef.current < 320) {
        lastTapRef.current = 0;
        setZoomedIndex((prev) => (prev === index ? null : index));
      } else {
        lastTapRef.current = now;
      }
    },
    []
  );

  const retryPage = useCallback((n: number) => {
    setFailedPages((prev) => prev.filter((item) => item !== n));
    setReloadToken((token) => token + 1);
  }, []);

  /* ------------------------ gestos do pager ----------------------- */

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / screenW);
      setDragIndex((prev) => (prev === index ? prev : index));
    },
    [screenW]
  );

  const handleMomentumEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / screenW);
      setDragIndex(null);
      setZoomedIndex(null);
      setPage(index + 1);
    },
    [screenW]
  );

  /* --------------------------- render ----------------------------- */

  const center = dragIndex ?? page - 1;
  const canPrev = ready && page > 1;
  const canNext = ready && page < totalPages;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: night ? "#000000" : theme.colors.bg }]}>
        {/* Barra superior */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Fechar leitor"
          >
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {ready ? (
              <Text style={styles.subtitle}>
                Página {page} de {totalPages}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={toggleNight}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={night ? "Desativar modo noturno" : "Ativar modo noturno"}
          >
            <Ionicons name={night ? "sunny" : "moon"} size={19} color={theme.colors.accent} />
          </TouchableOpacity>
          {originalUrl ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => void openOriginal()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Abrir PDF original no navegador"
            >
              <Ionicons name="open-outline" size={19} color={theme.colors.accent} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Corpo */}
        <View
          style={styles.body}
          onLayout={(event) => setPageH(event.nativeEvent.layout.height)}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.loadingText}>Preparando leitor…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorWrap}>
              <ErrorBox message={error} onRetry={() => void load()} />
              {originalUrl ? (
                <TouchableOpacity
                  style={styles.originalButton}
                  onPress={() => void openOriginal()}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir o PDF original no navegador"
                >
                  <Ionicons name="open-outline" size={15} color={theme.colors.accent} />
                  <Text style={styles.originalButtonText}>Abrir PDF original</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : ready ? (
            <ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              scrollEnabled={zoomedIndex === null}
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleMomentumEnd}
              scrollEventThrottle={16}
              style={styles.flex}
            >
              {pages.map((pageInfo, index) => {
                // Janela de renderização: só monta a página aberta e vizinhas.
                if (Math.abs(index - center) > WINDOW) {
                  return <View key={`p${index}`} style={[styles.page, { width: screenW }]} />;
                }

                const failed = failedPages.includes(pageInfo.n);
                const zoomed = zoomedIndex === index;
                const width = zoomed ? screenW * 2 : screenW;
                const height = zoomed ? pageH * 2 : pageH;

                return (
                  <View key={`p${index}`} style={[styles.page, { width: screenW }]}>
                    <View style={styles.flex}>
                      {failed ? (
                        <TouchableOpacity
                          style={styles.pageError}
                          onPress={() => retryPage(pageInfo.n)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel="Tentar carregar a página de novo"
                        >
                          <Ionicons name="cloud-offline-outline" size={30} color={theme.colors.textFaint} />
                          <Text style={styles.pageErrorText}>Toque para tentar de novo</Text>
                        </TouchableOpacity>
                      ) : zoomed ? (
                        <View style={styles.flex}>
                          {/* Zoom 2x: pan vertical + horizontal */}
                          <ScrollView
                            style={styles.flex}
                            contentContainerStyle={{ width, height }}
                            showsVerticalScrollIndicator={false}
                          >
                            <ScrollView
                              horizontal
                              contentContainerStyle={{ width, height }}
                              showsHorizontalScrollIndicator={false}
                            >
                              <Image
                                source={pageInfo.source}
                                style={{ width, height }}
                                contentFit="contain"
                                transition={120}
                              />
                            </ScrollView>
                          </ScrollView>
                          <Pressable
                            style={styles.tapLayer}
                            onPress={handlePageTap(index)}
                            accessibilityLabel="Dois toques para voltar ao tamanho normal"
                          />
                        </View>
                      ) : (
                        <View style={styles.flex}>
                          <Image
                            source={pageInfo.source}
                            style={{ width, height }}
                            contentFit="contain"
                            transition={150}
                            recyclingKey={`r${reloadToken}-p${pageInfo.n}`}
                            onError={() =>
                              setFailedPages((prev) =>
                                prev.includes(pageInfo.n) ? prev : [...prev, pageInfo.n]
                              )
                            }
                          />
                          <Pressable
                            style={styles.tapLayer}
                            onPress={handlePageTap(index)}
                            accessibilityLabel="Dois toques para ampliar a página"
                          />
                        </View>
                      )}
                    </View>
                    {/* Modo noturno: véu escuro sobre a página */}
                    {night ? <View style={styles.nightOverlay} pointerEvents="none" /> : null}
                  </View>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Dica de retomada */}
          {resumeHint ? (
            <View style={styles.hintPill} pointerEvents="none">
              <Ionicons name="bookmarks-outline" size={13} color={theme.colors.onAccent} />
              <Text style={styles.hintText}>{resumeHint}</Text>
            </View>
          ) : null}
        </View>

        {/* Rodapé: navegação + barra de progresso */}
        {ready ? (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => goToPage(page - 1)}
              disabled={!canPrev}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Página anterior"
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={canPrev ? theme.colors.text : theme.colors.textFaint}
              />
            </TouchableOpacity>
            <SeekBar
              value={page}
              total={totalPages}
              disabled={totalPages <= 1}
              onSeek={setPage}
              onCommit={() => undefined}
            />
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => goToPage(page + 1)}
              disabled={!canNext}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Próxima página"
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={canNext ? theme.colors.text : theme.colors.textFaint}
              />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Estilos                                                             */
/* ------------------------------------------------------------------ */

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },

    /* Barra superior */
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minHeight: 54,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    titleWrap: { flex: 1, gap: 1 },
    title: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
    subtitle: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "500" },

    /* Corpo */
    body: { flex: 1, overflow: "hidden" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md },
    loadingText: { color: theme.colors.textMuted, fontSize: 13 },
    errorWrap: { padding: theme.spacing.xl, gap: theme.spacing.md },

    /* Página */
    page: { backgroundColor: theme.colors.bg, justifyContent: "center" },
    tapLayer: { ...StyleSheet.absoluteFillObject },
    nightOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    pageError: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.md,
    },
    pageErrorText: { color: theme.colors.textMuted, fontSize: 13 },

    /* Erro: abrir original */
    originalButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      paddingVertical: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      backgroundColor: theme.colors.accentSoft,
    },
    originalButtonText: { color: theme.colors.accent, fontSize: 14, fontWeight: "700" },

    /* Dica de retomada */
    hintPill: {
      position: "absolute",
      bottom: theme.spacing.lg,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentStrong,
      shadowColor: "#000000",
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    hintText: { color: theme.colors.onAccent, fontSize: 12, fontWeight: "600" },

    /* Rodapé */
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    /* Barra de progresso */
    seekWrap: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
    },
    seekTrack: {
      height: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      overflow: "visible",
    },
    seekFill: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
    },
    seekThumb: {
      position: "absolute",
      top: -7,
      width: 18,
      height: 18,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
  });
