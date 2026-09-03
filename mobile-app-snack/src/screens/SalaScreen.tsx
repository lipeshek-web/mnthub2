/**
 * SalaScreen — a reunião DENTRO do app (MentorHub Live).
 *
 * - "pre": resumo da sessão + dicas + botão grande "Entrar na reunião".
 *   Ao entrar, pede à API o token HMAC da sala (o papel anfitrião/convidado
 *   é decidido no servidor — nunca no cliente).
 * - "room": a sala roda num WebView apontando para /live.html do servidor
 *   (WebRTC + sinalização socket.io — a mesma sala do site, sem login web).
 *   Sair: botão nativo no topo, botão vermelho da própria sala ou botão
 *   nativo do Android (com confirmação).
 * - No navegador (web), o WebView não existe → abre a sala numa aba nova
 *   (mesmo caminho do "ver fatura" do checkout).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { errMessage, getMeetingToken, getServerUrl, type MeetingTokenResponse } from "../lib/api";
import { useSafeBack, useBackStage } from "../lib/navigation";
import { formatNaiveLong, parseNaive } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { ErrorBox } from "../components/ErrorBox";
import { ScreenHeader } from "../components/ScreenHeader";

interface SalaParams {
  bookingId: string;
  topic?: string;
  mentorName?: string;
  mentorAvatarUrl?: string | null;
  /** naive local "YYYY-MM-DDTHH:mm" */
  startsAt?: string;
  durationMin?: number;
  status?: string;
}

type Stage = "pre" | "room";

export default function SalaScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const params = (useRoute<any>().params ?? {}) as SalaParams;
  const safeBack = useSafeBack(navigation);
  const insets = useSafeAreaInsets();

  const bookingId = params.bookingId ?? "";
  const mentorName = params.mentorName || "Mentor";
  const topic = params.topic || "Sessão 1:1";
  const startsAt = params.startsAt ?? "";
  const durationMin = params.durationMin ?? 60;

  const [stage, setStage] = useState<Stage>("pre");
  const [cred, setCred] = useState<MeetingTokenResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [serverBase, setServerBase] = useState("");

  const webViewRef = useRef<WebView | null>(null);
  const leftRef = useRef(false);
  const leavingRef = useRef(false);

  /* --------- credencial inicial: valida acesso + mostra o papel --------- */
  useEffect(() => {
    let alive = true;
    setChecking(true);
    setError(null);
    getMeetingToken(bookingId)
      .then((res) => {
        if (alive) setCred(res);
      })
      .catch((err) => {
        if (alive) setError(errMessage(err));
      })
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, [bookingId]);

  /* base do servidor (pode ter sido trocada no campo "Servidor da API") */
  useEffect(() => {
    void getServerUrl().then(setServerBase);
  }, []);

  /* ------------------------- horário da sessão ------------------------- */
  const when = useMemo(() => {
    const p = parseNaive(startsAt);
    if (!p) return null;
    const start = new Date(p.y, p.m - 1, p.d, p.hh, p.mm);
    const end = new Date(start.getTime() + durationMin * 60000);
    const now = new Date();
    return {
      label: formatNaiveLong(startsAt),
      liveNow: now >= start && now <= end,
      minutesUntil: Math.round((start.getTime() - now.getTime()) / 60000),
    };
  }, [startsAt, durationMin]);

  /* ---------------------------- URL da sala ---------------------------- */
  const roomUrl = useMemo(() => {
    if (!cred || !serverBase) return "";
    const q = [
      `room=${encodeURIComponent(cred.room)}`,
      `token=${encodeURIComponent(cred.token)}`,
      `peer=${encodeURIComponent(mentorName)}`,
      `title=${encodeURIComponent(topic)}`,
    ].join("&");
    return `${serverBase}/live.html?${q}`;
  }, [cred, serverBase, mentorName, topic]);

  /* ------------------------------ entrar ------------------------------- */
  const enterRoom = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      // token fresco a cada entrada (evita reutilizar um token velho)
      const fresh = await getMeetingToken(bookingId);
      setCred(fresh);
      leftRef.current = false;
      leavingRef.current = false;
      setStage("room");
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setJoining(false);
    }
  }, [bookingId]);

  /* ------------------------------- sair -------------------------------- */
  const doLeave = useCallback(() => {
    if (leftRef.current || leavingRef.current) return;
    leavingRef.current = true;
    try {
      webViewRef.current?.injectJavaScript(
        "window.__mentorhubLeave && window.__mentorhubLeave(); true;"
      );
    } catch {
      // segue — o goBack abaixo é o que importa
    }
    // A sala também avisa via onMessage ("mentorhub:leave") — este é o fallback.
    setTimeout(() => {
      leftRef.current = true;
      safeBack();
    }, 260);
  }, [safeBack]);

  const confirmLeave = useCallback(() => {
    Alert.alert(
      "Sair da reunião?",
      "Você pode voltar para a sala enquanto a sessão estiver ativa.",
      [
        { text: "Continuar na sala", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => doLeave() },
      ]
    );
  }, [doLeave]);

  // Botão nativo do Android na sala → confirma antes de desempilhar.
  useBackStage(stage === "room", () => {
    confirmLeave();
    return true;
  });

  const onRoomMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(String(event?.nativeEvent?.data ?? "{}")) as { type?: string };
        if (data.type === "mentorhub:leave" && !leftRef.current) {
          leftRef.current = true;
          safeBack();
        }
      } catch {
        // mensagens ignoradas
      }
    },
    [safeBack]
  );

  /* ============================== PRE ============================== */
  if (stage === "pre") {
    const isHost = cred?.role === "HOST";
    return (
      <View style={styles.flexBg}>
        <ScreenHeader title="Sala de reunião" onBack={safeBack} />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero: MentorHub Live */}
          <LinearGradient
            colors={[theme.colors.accent, theme.colors.accentStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="videocam" size={22} color={theme.colors.onAccent} />
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark" size={10} color={theme.colors.white} />
                <Text style={styles.heroBadgeText}>MentorHub Live · 1:1</Text>
              </View>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {topic}
            </Text>
            <View style={styles.heroMetaRow}>
              <Ionicons name="calendar-outline" size={13} color={theme.colors.white} />
              <Text style={styles.heroMeta}>
                {when ? when.label : "Agendada"} · {durationMin} min
              </Text>
            </View>
            {when?.liveNow ? (
              <View style={styles.liveNowRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveNowText}>É agora — a sala está aberta!</Text>
              </View>
            ) : when && when.minutesUntil > 0 && when.minutesUntil <= 30 ? (
              <View style={styles.liveNowRow}>
                <Ionicons name="time-outline" size={13} color={theme.colors.white} />
                <Text style={styles.liveNowText}>
                  Começa em cerca de {when.minutesUntil} min
                </Text>
              </View>
            ) : null}
          </LinearGradient>

          {/* Participante / papel */}
          <View style={styles.card}>
            <View style={styles.participantRow}>
              <Avatar uri={params.mentorAvatarUrl ?? null} name={mentorName} size={44} />
              <View style={styles.participantInfo}>
                <Text style={styles.participantName} numberOfLines={1}>
                  {mentorName}
                </Text>
                <Text style={styles.participantRole} numberOfLines={1}>
                  {isHost
                    ? "Você é o anfitrião desta sala"
                    : "Anfitrião · você entra como convidado"}
                </Text>
              </View>
              <View style={[styles.rolePill, isHost ? styles.rolePillHost : null]}>
                <Text style={[styles.rolePillText, isHost ? styles.rolePillTextHost : null]}>
                  {isHost ? "ANFITRIÃO" : "CONVIDADO"}
                </Text>
              </View>
            </View>
            {params.status === "PENDING" ? (
              <View style={styles.pendingNote}>
                <Ionicons name="information-circle" size={14} color={theme.colors.warning} />
                <Text style={styles.pendingNoteText}>
                  Ainda aguarda confirmação do mentor — você já pode entrar para testar câmera e
                  microfone.
                </Text>
              </View>
            ) : null}
          </View>

          {/* Como funciona */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>A reunião acontece aqui dentro</Text>
            <View style={styles.howRow}>
              <View style={styles.howIcon}>
                <Ionicons name="phone-portrait-outline" size={15} color={theme.colors.accent} />
              </View>
              <Text style={styles.howText}>
                Vídeo e áudio direto no app — sem navegador e sem instalar nada.
              </Text>
            </View>
            <View style={styles.howRow}>
              <View style={styles.howIcon}>
                <Ionicons name="mic-outline" size={15} color={theme.colors.accent} />
              </View>
              <Text style={styles.howText}>
                Na entrada, permita câmera e microfone quando o app pedir.
              </Text>
            </View>
            <View style={styles.howRow}>
              <View style={styles.howIcon}>
                <Ionicons name="headset-outline" size={15} color={theme.colors.accent} />
              </View>
              <Text style={styles.howText}>Prefira fones de ouvido e um lugar silencioso.</Text>
            </View>
          </View>

          {error ? <ErrorBox message={error} onRetry={() => void enterRoom()} /> : null}

          {/* CTA */}
          {checking ? (
            <View style={styles.ctaDisabled}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
              <Text style={styles.ctaDisabledText}>Preparando a sala…</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cta}
              onPress={() => void enterRoom()}
              disabled={joining}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Entrar na reunião"
            >
              {joining ? (
                <ActivityIndicator size="small" color={theme.colors.onAccent} />
              ) : (
                <Ionicons name="videocam" size={19} color={theme.colors.onAccent} />
              )}
              <Text style={styles.ctaText}>
                {joining ? "Abrindo a sala…" : "Entrar na reunião"}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.ctaHint}>
            A sala fica disponível enquanto a sessão estiver ativa (não cancelada/concluída).
          </Text>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    );
  }

  /* ============================== ROOM ============================== */
  // Navegador: WebView não existe — a sala abre numa aba nova.
  if (Platform.OS === "web") {
    return (
      <View style={[styles.flexBg, styles.roomBg]}>
        <View style={[styles.roomTopBar, { paddingTop: Math.max(insets.top, 6) }]}>
          <TouchableOpacity
            style={styles.leaveBtn}
            onPress={safeBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sair da sala"
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            <Text style={styles.leaveBtnText}>Sair</Text>
          </TouchableOpacity>
          <View style={{ width: 76 }} />
        </View>
        <View style={styles.webFallback}>
          <View style={styles.webFallbackIcon}>
            <Ionicons name="videocam" size={26} color={theme.colors.accent} />
          </View>
          <Text style={styles.webFallbackTitle}>Sala pronta</Text>
          <Text style={styles.webFallbackText}>
            No celular, o vídeo roda dentro do próprio app. Neste navegador, abra a sala em uma
            nova aba para participar com câmera e microfone.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => {
              if (roomUrl) void Linking.openURL(roomUrl);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="open-outline" size={17} color={theme.colors.onAccent} />
            <Text style={styles.ctaText}>Abrir sala no navegador</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flexBg, styles.roomBg]}>
      {/* barra nativa mínima — sai da sala em qualquer aparelho (iOS não tem voltar nativo) */}
      <View style={[styles.roomTopBar, { paddingTop: Math.max(insets.top, 6) }]}>
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={confirmLeave}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sair da reunião"
        >
          <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
          <Text style={styles.leaveBtnText}>Sair</Text>
        </TouchableOpacity>
        <View style={styles.roomTitleWrap}>
          <View style={styles.roomLiveDot} />
          <Text style={styles.roomTitle} numberOfLines={1}>
            MentorHub Live
          </Text>
        </View>
        <View style={{ width: 76 }} />
      </View>

      <View style={[styles.webViewWrap, { paddingBottom: Math.max(insets.bottom, 4) }]}>
        {roomUrl ? (
          <WebView
            key={reloadKey}
            ref={webViewRef}
            source={{ uri: roomUrl }}
            style={styles.webView}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            onMessage={onRoomMessage}
            renderError={() => (
              <View style={styles.webFallback}>
                <View style={styles.webFallbackIcon}>
                  <Ionicons name="cloud-offline-outline" size={26} color={theme.colors.danger} />
                </View>
                <Text style={styles.webFallbackTitle}>Sala não carregou</Text>
                <Text style={styles.webFallbackText}>
                  Verifique sua internet e tente entrar novamente.
                </Text>
                <TouchableOpacity
                  style={styles.cta}
                  onPress={() => setReloadKey((k) => k + 1)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh" size={17} color={theme.colors.onAccent} />
                  <Text style={styles.ctaText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View style={styles.webFallback}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
            <Text style={styles.ctaDisabledText}>Abrindo a sala…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* ------------------------------- Estilos ------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    flexBg: { flex: 1, backgroundColor: theme.colors.bg },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },

    /* Hero */
    hero: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: 10,
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
    },
    heroIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: theme.radius.full,
      backgroundColor: "rgba(0,0,0,0.22)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.28)",
    },
    heroBadgeText: { color: theme.colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
    heroTitle: { color: theme.colors.white, fontSize: 18, fontWeight: "800", lineHeight: 24 },
    heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    heroMeta: { color: "rgba(255,255,255,0.9)", fontSize: 12.5, fontWeight: "600", flexShrink: 1 },
    liveNowRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
      backgroundColor: "rgba(0,0,0,0.22)",
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.radius.full,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.white,
    },
    liveNowText: { color: theme.colors.white, fontSize: 12, fontWeight: "800" },

    /* Cards */
    card: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      gap: 10,
    },
    cardTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
    participantRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
    participantInfo: { flex: 1, gap: 2 },
    participantName: { color: theme.colors.text, fontSize: 14.5, fontWeight: "700" },
    participantRole: { color: theme.colors.textMuted, fontSize: 12 },
    rolePill: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rolePillHost: {
      backgroundColor: theme.colors.accentSoft,
      borderColor: theme.colors.accentBorder,
    },
    rolePillText: { color: theme.colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
    rolePillTextHost: { color: theme.colors.accent },
    pendingNote: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 7,
      padding: 10,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.warningSoft,
      borderWidth: 1,
      borderColor: theme.colors.warningBorder,
    },
    pendingNoteText: {
      flex: 1,
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "500",
    },

    /* Como funciona */
    howRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    howIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    howText: {
      flex: 1,
      color: theme.colors.textMuted,
      fontSize: 12.5,
      lineHeight: 18,
      fontWeight: "500",
      paddingTop: 4,
    },

    /* CTA */
    cta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 15,
      marginTop: theme.spacing.lg,
    },
    ctaText: { color: theme.colors.onAccent, fontSize: 15, fontWeight: "800" },
    ctaDisabled: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingVertical: 15,
      marginTop: theme.spacing.lg,
    },
    ctaDisabledText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: "600" },
    ctaHint: {
      marginTop: theme.spacing.sm,
      textAlign: "center",
      color: theme.colors.textFaint,
      fontSize: 11,
      lineHeight: 16,
    },
    bottomSpacer: { height: theme.spacing.lg },

    /* Room */
    roomBg: { backgroundColor: "#0c0a09" },
    roomTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingBottom: 6,
      backgroundColor: "#0c0a09",
    },
    leaveBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: theme.radius.full,
      backgroundColor: "rgba(28,25,23,0.9)",
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
    },
    leaveBtnText: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
    roomTitleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    roomLiveDot: {
      width: 7,
      height: 7,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
    },
    roomTitle: { color: theme.colors.textMuted, fontSize: 12.5, fontWeight: "700" },
    webViewWrap: { flex: 1 },
    webView: { flex: 1, backgroundColor: "#0c0a09" },

    /* fallback / erro */
    webFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 28,
      backgroundColor: "#0c0a09",
    },
    webFallbackIcon: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    webFallbackTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
    webFallbackText: {
      color: theme.colors.textMuted,
      fontSize: 13.5,
      lineHeight: 20,
      textAlign: "center",
      maxWidth: 320,
    },
  });
