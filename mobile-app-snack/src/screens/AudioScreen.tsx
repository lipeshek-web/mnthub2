/**
 * AudioScreen — player em TELA CHEIA, minimalista estilo Apple Podcasts.
 *
 * Não possui estado de áudio próprio: é uma view do AudioProvider (root) —
 * dá para abrir/fechar à vontade que o som continua. Chevron-down minimiza
 * (voltar); o toque no mini-player reabre. Controles: −15s · play/pause ·
 * +15s, barra de progresso arrastável e velocidade (1x → 2x).
 *
 * A tela funciona MESMO sem faixa (ex.: rota aberta a seco): mostra um
 * estado vazio elegante com botão de voltar.
 */
import React, { useCallback, useRef, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatMs, nextRate, useAudio } from "../lib/audio";
import { theme } from "../theme";
import { RemoteImage } from "../components/RemoteImage";

export default function AudioScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { current, isPlaying, isLoading, position, duration, speed, error, toggle, seek, skip, setSpeed } =
    useAudio();

  /* ------------------------- Barra arrastável ------------------------- */
  // Track de toque: largura conhecida via onLayout; arraste/tap → seek.
  const barWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const seekPreviewRef = useRef(0);
  // Preview visual durante o arrasto (para não brigar com o status do player).
  const [preview, setPreview] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        if (!duration) return;
        draggingRef.current = true;
        const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / Math.max(1, barWidthRef.current)));
        seekPreviewRef.current = ratio * duration;
        setPreview(seekPreviewRef.current);
      },
      onPanResponderMove: (event) => {
        if (!duration || !draggingRef.current) return;
        const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / Math.max(1, barWidthRef.current)));
        seekPreviewRef.current = ratio * duration;
        setPreview(seekPreviewRef.current);
      },
      onPanResponderRelease: () => {
        if (draggingRef.current && duration) seek(seekPreviewRef.current);
        draggingRef.current = false;
        setPreview(0);
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
        setPreview(0);
      },
    })
  ).current;

  const shownPosition = preview > 0 ? preview : position;
  const ratio = duration > 0 ? Math.max(0, Math.min(1, shownPosition / duration)) : 0;

  const handleToggle = useCallback(() => {
    if (!current) return;
    toggle();
  }, [current, toggle]);

  /* ------------------------------ Vazio -------------------------------- */
  if (!current) {
    return (
      <View style={[styles.stage, { paddingBottom: insets.bottom + theme.spacing.xl }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.minimize}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Fechar player"
          >
            <Ionicons name="chevron-down" size={26} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyStage}>
          <View style={styles.emptyArt}>
            <Ionicons name="headset-outline" size={44} color={theme.colors.textFaint} />
          </View>
          <Text style={styles.emptyTitle}>Nada tocando agora</Text>
          <Text style={styles.emptyText}>
            Escolha uma áudio-aula no Início ou na página de um curso.
          </Text>
        </View>
      </View>
    );
  }

  const artworkSize = Math.min(width - theme.spacing.xl * 2, 320);

  return (
    <View style={[styles.stage, { paddingBottom: insets.bottom + theme.spacing.xl }]}>
      {/* Topo: minimizar + velocidade */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.minimize}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Minimizar player"
        >
          <Ionicons name="chevron-down" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.overline}>REPRODUZINDO</Text>
        <TouchableOpacity
          style={styles.ratePill}
          onPress={() => setSpeed(nextRate(speed))}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`Velocidade ${speed}x. Toque para mudar`}
        >
          <Text style={styles.rateText}>{speed === 1 ? "1x" : `${String(speed).replace(".", ",")}x`}</Text>
        </TouchableOpacity>
      </View>

      {/* Arte */}
      <View style={[styles.artWrap, { width: artworkSize, height: artworkSize }]}>
        <RemoteImage
          uri={current.artwork}
          style={styles.art}
          recyclingKey={`audio-full-${current.id}`}
          fallbackIcon="headset-outline"
          iconSize={64}
        />
      </View>

      {/* Título + subtítulo */}
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={2}>
          {current.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {current.subtitle}
        </Text>
      </View>

      {/* Progresso */}
      <View style={styles.progressBlock}>
        <View
          style={styles.trackHit}
          onLayout={(event) => {
            barWidthRef.current = event.nativeEvent.layout.width;
          }}
          {...panResponder.panHandlers}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
          </View>
          <View style={[styles.knob, { left: `${Math.round(ratio * 100)}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatMs(shownPosition)}</Text>
          <Text style={styles.time}>-{formatMs(Math.max(0, duration - shownPosition))}</Text>
        </View>
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => skip(-15)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voltar 15 segundos"
        >
          <Ionicons name="play-back" size={26} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, isLoading ? styles.playButtonLoading : null]}
          onPress={handleToggle}
          disabled={isLoading}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pausar" : "Tocar"}
        >
          <Ionicons
            name={isLoading ? "hourglass-outline" : isPlaying ? "pause" : "play"}
            size={34}
            color={theme.colors.onAccent}
            style={isLoading ? null : styles.playIconNudge}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => skip(15)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Avançar 15 segundos"
        >
          <Ionicons name="play-forward" size={26} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Estado / nota */}
      <Text style={styles.note} numberOfLines={2}>
        {error
          ? "Não foi possível tocar este áudio — verifique a conexão e tente de novo."
          : "Prévia em áudio · as aulas completas chegam em breve na Órbita"}
      </Text>
    </View>
  );
}

/* --------------------------------- Estilos --------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    stage: {
      flex: 1,
      backgroundColor: theme.colors.bg,
      paddingHorizontal: theme.spacing.xl,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    minimize: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    overline: {
      color: theme.colors.textFaint,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.2,
    },
    ratePill: {
      minWidth: 44,
      height: 32,
      paddingHorizontal: 10,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    rateText: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },

    artWrap: {
      alignSelf: "center",
      borderRadius: theme.radius.xl,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    art: { width: "100%", height: "100%" },

    titles: { alignItems: "center", gap: 4, marginTop: theme.spacing.xl },
    title: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.4,
      textAlign: "center",
    },
    subtitle: { color: theme.colors.textFaint, fontSize: 13, fontWeight: "600" },

    progressBlock: { marginTop: theme.spacing.xl, gap: 6 },
    trackHit: { height: 28, justifyContent: "center" },
    track: {
      height: 5,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      overflow: "hidden",
    },
    fill: { height: "100%", borderRadius: theme.radius.full, backgroundColor: theme.colors.accent },
    knob: {
      position: "absolute",
      top: 7,
      width: 14,
      height: 14,
      marginLeft: -7,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.text,
      shadowColor: "#000000",
      shadowOpacity: 0.25,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    time: {
      color: theme.colors.textFaint,
      fontSize: 11,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },

    controls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xxl,
      marginTop: theme.spacing.lg,
    },
    skipButton: {
      width: 52,
      height: 52,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    playButton: {
      width: 76,
      height: 76,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    playButtonLoading: { opacity: 0.7 },
    playIconNudge: { marginLeft: 4 },

    note: {
      color: theme.colors.textFaint,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
      marginTop: theme.spacing.xl,
    },

    /* Vazio */
    emptyStage: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    emptyArt: {
      width: 120,
      height: 120,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.sm,
    },
    emptyTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
    emptyText: {
      color: theme.colors.textFaint,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
      paddingHorizontal: theme.spacing.xl,
    },
  });
