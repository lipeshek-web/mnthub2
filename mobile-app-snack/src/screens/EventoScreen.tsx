/**
 * Detalhe do EVENTO — a reunião multi-participante da plataforma.
 *
 * O diferencial do MentorHub: reunião com vários membros DENTRO do app —
 * sala em WebRTC em malha servida pela página /room.html do servidor
 * (WebView), mesma família da sala 1:1 (/live.html) das mentorias.
 * Capacidade e papel (anfitrião/participante) vêm assinados no token.
 *
 * Estágios:
 *   detail → capa, horário, descrição, participantes e ações
 *   room   → WebView com a sala (fallback: "Abrir sala no navegador")
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { Avatar } from "../components/Avatar";
import { Chip } from "../components/Chip";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { RemoteImage } from "../components/RemoteImage";
import { useSafeBack, useBackStage } from "../lib/navigation";
import {
  errMessage,
  getEvent,
  getServerUrl,
  getEventMeetingToken,
  joinEvent,
  type EventItem,
  type EventMeetingTokenResponse,
} from "../lib/api";
import { formatNaiveLong, parseNaive } from "../lib/format";

/* WebView entra com require TARDIO (o pacote pode não resolver no Snack web;
   nesse caso a sala cai no fallback do navegador em vez de derrubar o app). */
type WebViewMessageEvent = { nativeEvent?: { data?: string | null } };
type WebViewLike = { injectJavaScript: (script: string) => void };
let RNWebView: { WebView: React.ComponentType<any> } | null = null;
if (Platform.OS !== "web") {
  try {
    RNWebView = require("react-native-webview");
  } catch {
    RNWebView = null;
  }
}

function minutesUntil(startsAt: string): number | null {
  const p = parseNaive(startsAt);
  if (!p) return null;
  const start = new Date(p.y, p.m - 1, p.d, p.hh, p.mm);
  return Math.round((start.getTime() - Date.now()) / 60000);
}

function whenLabel(startsAt: string, durationMin: number): string {
  const p = parseNaive(startsAt);
  if (!p) return "";
  const start = new Date(p.y, p.m - 1, p.d, p.hh, p.mm);
  const end = new Date(start.getTime() + durationMin * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const until = ` · ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return formatNaiveLong(startsAt) + until;
}

export default function EventoScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const params = (useRoute<any>().params ?? {}) as { id?: string };
  const eventId = params.id ?? "";
  const safeBack = useSafeBack(navigation);
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [stage, setStage] = useState<"detail" | "room">("detail");
  const [cred, setCred] = useState<EventMeetingTokenResponse | null>(null);
  const [roomUrl, setRoomUrl] = useState("");
  const webViewRef = useRef<WebViewLike | null>(null);
  const leavingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvent(eventId);
      setEvent(res.event);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ------------------------------ participar ------------------------------ */
  const toggleJoin = useCallback(
    async (action: "join" | "leave") => {
      if (!event) return;
      setBusy(true);
      try {
        const res = await joinEvent(event.id, action);
        if (res.event) setEvent(res.event);
      } catch (err) {
        Alert.alert("Ops", errMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [event]
  );

  /* --------------------------------- sala --------------------------------- */
  const openRoom = useCallback(async () => {
    if (!event) return;
    setBusy(true);
    try {
      const fresh = await getEventMeetingToken(event.id);
      setCred(fresh);
      const q = [
        `room=${encodeURIComponent(fresh.room)}`,
        `token=${encodeURIComponent(fresh.token)}`,
        `title=${encodeURIComponent(event.title)}`,
      ].join("&");
      const base = (await getServerUrl()).replace(/\/+$/, "");
      setRoomUrl(`${base}/room.html?${q}`);
      setStage("room");
    } catch (err) {
      Alert.alert("Ops", errMessage(err));
    } finally {
      setBusy(false);
    }
  }, [event]);

  const doLeave = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try {
      webViewRef.current?.injectJavaScript(
        "window.__mentorhubLeave && window.__mentorhubLeave(); true;"
      );
    } catch {
      // segue — o goBack abaixo é o que importa
    }
    setTimeout(() => {
      setStage("detail");
      setRoomUrl("");
      setCred(null);
      leavingRef.current = false;
    }, 260);
  }, []);

  const confirmLeave = useCallback(() => {
    Alert.alert(
      "Sair da reunião?",
      "Você pode voltar pela página do evento enquanto a reunião estiver ativa.",
      [
        { text: "Continuar na sala", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => doLeave() },
      ]
    );
  }, [doLeave]);

  useBackStage(stage === "room", () => {
    confirmLeave();
    return true;
  });

  const onWebViewMessage = useCallback(
    (event_: WebViewMessageEvent) => {
      const data = event_.nativeEvent?.data;
      if (!data) return;
      try {
        const msg = JSON.parse(String(data)) as { type?: string };
        if (msg.type === "mentorhub:leave" && !leavingRef.current) {
          setStage("detail");
          setRoomUrl("");
          setCred(null);
        }
      } catch {
        // mensagem não estruturada — ignora
      }
    },
    []
  );

  /* ------------------------------ estados base ---------------------------- */
  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Evento" subtitle="Reunião" onBack={safeBack} />
        <LoadingList label="Abrindo o evento..." />
      </Screen>
    );
  }

  if (error || !event) {
    return (
      <Screen>
        <ScreenHeader title="Evento" subtitle="Reunião" onBack={safeBack} />
        <View style={{ padding: theme.spacing.lg }}>
          <ErrorBox message={error || "Evento não encontrado. Ele pode ter sido removido."} />
          <TouchableOpacity style={styles.ghostBtn} onPress={safeBack}>
            <Text style={styles.ghostBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  /* --------------------------------- sala --------------------------------- */
  if (stage === "room") {
    const WebView = RNWebView?.WebView;
    return (
      <View style={styles.roomRoot}>
        <View style={[styles.roomTop, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            style={styles.roomBack}
            onPress={confirmLeave}
            accessibilityLabel="Sair da reunião"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.roomTitleWrap}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={styles.roomSub}>
              reunião ao vivo · até {cred?.capacity ?? event.capacity} participantes
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        {WebView && roomUrl ? (
          <WebView
            ref={(ref: WebViewLike | null) => (webViewRef.current = ref)}
            source={{ uri: roomUrl }}
            style={styles.roomWeb}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            onMessage={onWebViewMessage}
          />
        ) : (
          <View style={styles.roomFallback}>
            <Ionicons name="videocam" size={40} color={theme.colors.accent} />
            <Text style={styles.roomFallbackTitle}>Sala pronta</Text>
            <Text style={styles.roomFallbackText}>
              A reunião abre no navegador (vídeo e áudio multi-participante, tudo na plataforma).
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => roomUrl && Linking.openURL(roomUrl)}
            >
              <Text style={styles.primaryBtnText}>Abrir sala no navegador</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => setStage("detail")}>
              <Text style={styles.ghostBtnText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  /* -------------------------------- detalhe ------------------------------- */
  const mins = minutesUntil(event.startsAt);
  const canJoin = !event.cancelled && !event.ended && !event.isParticipant && event.seatsLeft > 0;
  const canEnter = !event.cancelled && !event.ended && event.isParticipant;

  return (
    <Screen>
      <ScreenHeader
        title={event.title}
        subtitle={event.isHost ? "Evento · você é o anfitrião" : "Evento · Reunião"}
        onBack={safeBack}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* capa */}
        <View style={styles.coverWrap}>
          <RemoteImage
            uri={event.coverUrl}
            style={styles.cover}
            recyclingKey={`ev-${event.id}`}
            fallbackIcon="people-circle-outline"
            iconSize={44}
          />
          {event.live ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>AO VIVO AGORA</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.chipRow}>
            <Chip label={event.category} />
            {!event.cancelled && !event.ended && event.seatsLeft > 0 ? (
              <Chip
                label={`${event.seatsLeft} vaga${event.seatsLeft > 1 ? "s" : ""}`}
                tone="outline"
              />
            ) : null}
            {event.ended ? <Chip label="Encerrado" tone="outline" /> : null}
            {event.cancelled ? <Chip label="Cancelado" tone="outline" /> : null}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={15} color={theme.colors.textFaint} />
            <Text style={styles.metaText}>{whenLabel(event.startsAt, event.durationMin)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={15} color={theme.colors.textFaint} />
            <Text style={styles.metaText}>
              {event.durationMin} minutos
              {mins != null && !event.ended
                ? mins > 0
                  ? ` · começa em ${mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h`}`
                  : " · em andamento"
                : ""}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={15} color={theme.colors.textFaint} />
            <Text style={styles.metaText}>
              {event.joinedCount}/{event.capacity} confirmados · vídeo e áudio na própria plataforma
            </Text>
          </View>

          {/* ações */}
          {event.cancelled ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Este evento foi cancelado pelo anfitrião.
              </Text>
            </View>
          ) : event.ended ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>Este evento já aconteceu.</Text>
            </View>
          ) : canJoin ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => void toggleJoin("join")}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Participar do evento"
            >
              <Ionicons name="person-add" size={17} color={theme.colors.onAccent} />
              <Text style={[styles.primaryBtnText, { color: theme.colors.onAccent }]}>
                {busy ? "Reservando..." : "Participar do evento"}
              </Text>
            </TouchableOpacity>
          ) : canEnter ? (
            <>
              {event.openable ? (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => void openRoom()}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Entrar na sala ao vivo"
                >
                  <Ionicons name="videocam" size={17} color={theme.colors.onAccent} />
                  <Text style={[styles.primaryBtnText, { color: theme.colors.onAccent }]}>
                    {busy ? "Abrindo..." : event.live ? "Entrar na sala ao vivo" : "Abrir sala (pré-entrada)"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>
                    Você está confirmado{event.isHost ? " (anfitrião)" : ""}! A sala abre 15
                    minutos antes do horário.
                  </Text>
                </View>
              )}
              {!event.isHost ? (
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => void toggleJoin("leave")}
                  disabled={busy}
                >
                  <Text style={styles.ghostBtnText}>Sair do evento</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>Sala lotada — todas as vagas foram preenchidas.</Text>
            </View>
          )}

          {/* anfitrião + descrição */}
          <View style={styles.hostCard}>
            <Avatar uri={event.host.avatarUrl} name={event.host.name} size={44} />
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Anfitrião</Text>
              <Text style={styles.hostName} numberOfLines={1}>
                {event.host.name}
              </Text>
            </View>
          </View>

          {event.description ? (
            <Text style={styles.description}>{event.description}</Text>
          ) : null}

          {/* participantes */}
          {event.participants.length > 0 ? (
            <View style={styles.participantsCard}>
              <Text style={styles.participantsTitle}>
                Participantes confirmados ({event.participants.length})
              </Text>
              {event.participants.map((p) => (
                <View key={p.id} style={styles.participantRow}>
                  <Avatar uri={p.avatarUrl} name={p.name} size={34} />
                  <Text style={styles.participantName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  {p.role === "HOST" ? (
                    <View style={styles.hostTag}>
                      <Text style={styles.hostTagText}>ANFITRIÃO</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    coverWrap: { position: "relative" },
    cover: { width: "100%", height: 190, backgroundColor: theme.colors.surfaceAlt },
    livePill: {
      position: "absolute",
      top: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.danger,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.white,
    },
    liveText: { color: theme.colors.white, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.4 },
    body: { padding: theme.spacing.lg, gap: 10 },
    chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginTop: 2,
    },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    metaText: { color: theme.colors.textFaint, fontSize: 13, fontWeight: "500", flex: 1 },
    notice: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 4,
    },
    noticeText: { color: theme.colors.text, fontSize: 13, fontWeight: "600", lineHeight: 19 },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 52,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      marginTop: 6,
    },
    primaryBtnText: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
    ghostBtn: {
      height: 48,
      borderRadius: theme.radius.md,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    ghostBtnText: { color: theme.colors.textFaint, fontSize: 14, fontWeight: "700" },
    hostCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: 12,
      marginTop: 8,
    },
    hostInfo: { flex: 1 },
    hostLabel: {
      color: theme.colors.textFaint,
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    hostName: { color: theme.colors.text, fontSize: 15, fontWeight: "700", marginTop: 2 },
    description: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 22,
      opacity: 0.92,
      marginTop: 4,
    },
    participantsCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: 14,
      gap: 10,
      marginTop: 4,
    },
    participantsTitle: { color: theme.colors.text, fontSize: 13.5, fontWeight: "800" },
    participantRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    participantName: { color: theme.colors.text, fontSize: 14, fontWeight: "600", flex: 1 },
    hostTag: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 7,
      backgroundColor: "rgba(245, 158, 11, 0.18)",
    },
    hostTagText: { color: "#fcd34d", fontSize: 8.5, fontWeight: "800", letterSpacing: 0.5 },

    /* sala (WebView) */
    roomRoot: { flex: 1, backgroundColor: "#0c0a09" },
    roomTop: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 8,
    },
    roomBack: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    roomTitleWrap: { flex: 1, alignItems: "center" },
    roomTitle: { color: "#fafaf9", fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
    roomSub: { color: "#a8a29e", fontSize: 11, fontWeight: "600", marginTop: 1 },
    roomWeb: { flex: 1, backgroundColor: "#0c0a09" },
    roomFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 28,
    },
    roomFallbackTitle: { color: "#fafaf9", fontSize: 18, fontWeight: "800" },
    roomFallbackText: {
      color: "#a8a29e",
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
      maxWidth: 300,
    },
  });
