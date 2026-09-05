/**
 * Mensagens — agora em DUAS partes (estilo Apple/Duolingo):
 *
 *  • MessagesTabPage (aba "Mensagens" do dock): lista de conversas 1:1 com
 *    mentores — título grande no corpo, linha por conversa com avatar, última
 *    mensagem e badge de não lidas; badge global no dock (unreadStore).
 *    Puxar para atualizar + polling leve SÓ quando a aba está visível.
 *    SEM conversas → estado vazio AMIGÁVEL (nunca parece um erro).
 *
 *  • ConversaScreen (tela do stack "Conversa"): balões (meus à direita em
 *    verde), hora, envio no rodapé e atualização automática a cada 4s.
 *    Header contextual Apple: nome da pessoa no centro + "Mentor" abaixo.
 *    Sem mensagens ainda → dica "Diga oi 👋".
 *
 * Params (Conversa): { peerId, peerName } — abre direto na conversa
 * (ex.: "Falar com o mentor" na tela do mentor).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeBack } from "../lib/navigation";
import { DOCK_CLEARANCE, useTabs } from "../lib/tabs";
import { unreadStore } from "../lib/unread";
import {
  errMessage,
  getConversation,
  isMissingEndpoint,
  listThreads,
  sendMessage,
  SERVER_OUTDATED_MESSAGE,
  type ChatMessage,
  type MessagePeer,
  type ThreadsResponse,
} from "../lib/api";
import { formatNumber } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";

/** ISO/naive → "HH:MM" (com dia quando não é hoje). */
function timeLabel(raw: string): string {
  const hhmm = /T?(\d{2}):(\d{2})/.exec(raw ?? "");
  const time = hhmm ? `${hhmm[1]}:${hhmm[2]}` : "";
  if (!time) return "";
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw ?? "");
  if (datePart) {
    const sameDay =
      Number(datePart[1]) === today.getFullYear() &&
      Number(datePart[2]) === today.getMonth() + 1 &&
      Number(datePart[3]) === today.getDate();
    if (!sameDay) return `${datePart[3]}/${datePart[2]} ${time}`;
  }
  return time;
}

/* ------------------------- Aba Mensagens (lista) ------------------------- */

export function MessagesTabPage() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const { setTab } = useTabs();
  // Polling/pull só quando a aba está de fato visível (Main em foco).
  const isFocused = useIsFocused();
  const [data, setData] = useState<ThreadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    if (mode === "initial") setLoading(true);
    else if (mode === "refresh") setRefreshing(true);
    try {
      const res = await listThreads();
      setData(res);
      // Alimenta o badge do dock (e do Perfil) — o GET marca como lida.
      unreadStore.set(res.unreadTotal);
      setError(null);
    } catch (err) {
      // Servidor sem as rotas novas (site desatualizado): caixa vazia amigável,
      // NUNCA cara de erro.
      if (isMissingEndpoint(err)) {
        setData({ unreadTotal: 0, threads: [] });
        unreadStore.set(0);
        setError(null);
      } else {
        setError(errMessage(err));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarrega sempre que a aba ganha foco (voltou de uma conversa, por ex.).
  useFocusEffect(
    useCallback(() => {
      void load("silent");
    }, [load])
  );

  useEffect(() => {
    if (!isFocused) return;
    void load("initial");
    const timer = setInterval(() => void load("silent"), 8000);
    return () => clearInterval(timer);
  }, [load, isFocused]);

  const threads = data?.threads ?? [];
  const unreadTotal = data?.unreadTotal ?? 0;

  return (
    <View style={styles.flex}>
      {loading ? (
        <LoadingList label="Carregando conversas..." />
      ) : error && !data ? (
        <ErrorBox message={error} onRetry={() => void load("initial")} />
      ) : threads.length === 0 ? (
        /* Estado vazio AMIGÁVEL — não é erro, é o começo 😊 */
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load("refresh")}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
        >
          <View style={styles.emptyIconWrap}>
            <Ionicons name="chatbubbles-outline" size={30} color={theme.colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma conversa por aqui ainda</Text>
          <Text style={styles.emptyText}>
            Quando você trocar mensagens com um mentor, a conversa aparece aqui.
          </Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => setTab("Mentorias")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Explorar mentores para começar uma conversa"
          >
            <Ionicons name="people-outline" size={16} color={theme.colors.onAccent} />
            <Text style={styles.emptyActionText}>Encontrar mentores</Text>
          </TouchableOpacity>
          <Text style={styles.emptyHint}>
            Dica: em um mentor, use “Falar com o mentor” para começar a conversa.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load("refresh")}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
        >
          {/* Cabeçalho da aba — título grande + contador de não lidas */}
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderRow}>
              <Text style={styles.pageTitle}>Mensagens</Text>
              {unreadTotal > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadTotal > 99 ? "99+" : formatNumber(unreadTotal)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.pageSubtitle}>Suas conversas com mentores</Text>
          </View>

          {threads.map((t) => (
            <TouchableOpacity
              key={t.peer.id}
              style={styles.threadRow}
              onPress={() =>
                navigation.navigate("Conversa", { peerId: t.peer.id, peerName: t.peer.name })
              }
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Conversa com ${t.peer.name}`}
            >
              <View>
                <Avatar uri={t.peer.avatarUrl} name={t.peer.name} size={46} />
                {t.unread > 0 ? <View style={styles.dot} /> : null}
              </View>
              <View style={styles.threadInfo}>
                <View style={styles.threadTop}>
                  <Text style={styles.threadName} numberOfLines={1}>
                    {t.peer.name}
                    {t.peer.isMentor ? <Text style={styles.mentorTag}> · mentor</Text> : null}
                  </Text>
                  <Text style={styles.threadTime}>{timeLabel(t.lastAt)}</Text>
                </View>
                <View style={styles.threadBottom}>
                  <Text
                    style={[styles.threadPreview, t.unread > 0 && styles.threadPreviewUnread]}
                    numberOfLines={2}
                  >
                    {t.lastMine ? "Você: " : ""}
                    {t.lastBody}
                  </Text>
                  {t.unread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {t.unread > 99 ? "99+" : formatNumber(t.unread)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.dockSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

/* --------------------------- Conversa (stack) --------------------------- */

export default function ConversaScreen() {
  const navigation = useNavigation<any>();
  const goBack = useSafeBack(navigation);
  const params = (useRoute<any>().params ?? {}) as { peerId?: string; peerName?: string };

  const peer: MessagePeer = {
    id: params.peerId ?? "",
    name: params.peerName ?? "Conversa",
    avatarUrl: null,
    isMentor: false,
  };

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <ConversationView peer={peer} onBackToList={goBack} />
    </Screen>
  );
}

function ConversationView({ peer, onBackToList }: { peer: MessagePeer; onBackToList: () => void }) {
  const styles = makeStyles();
  const [items, setItems] = useState<ChatMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const isFocused = useIsFocused();
  // Peer completo (avatar/isMentor) chega na 1ª resposta da API.
  const [peerCache, setPeerCache] = useState<MessagePeer>(peer);

  const load = useCallback(async (mode: "initial" | "silent") => {
    if (mode === "initial") setLoading(true);
    try {
      const res = await getConversation(peer.id);
      setItems(res.items);
      setPeerCache(res.peer);
      setError(null);
    } catch (err) {
      if (isMissingEndpoint(err)) {
        // Servidor desatualizado: conversa aparece vazia (dica "Diga oi").
        setItems([]);
        setError(null);
      } else {
        setError(errMessage(err));
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peer.id]);

  useEffect(() => {
    if (!isFocused) return;
    void load("initial");
    const timer = setInterval(() => void load("silent"), 4000);
    return () => clearInterval(timer);
  }, [load, isFocused]);

  // Rolagem para a última mensagem quando chega conversa nova.
  useEffect(() => {
    if (items && items.length > 0) {
      requestAnimationFrame(() => {
        try {
          scrollRef.current?.scrollToEnd({ animated: false });
        } catch {
          /* sem conteúdo rolável */
        }
      });
    }
  }, [items?.length]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(peer.id, text);
      setItems((prev) => [...(prev ?? []), msg]);
      setDraft("");
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (err) {
      if (isMissingEndpoint(err)) {
        Alert.alert("Mensagens ainda não ativas", SERVER_OUTDATED_MESSAGE);
      } else {
        const message = errMessage(err);
        if (/Sessão expirada/i.test(message)) {
          // 401 já deslogou o app via handler global
        } else {
          Alert.alert("Não foi possível enviar", message);
        }
      }
    } finally {
      setSending(false);
    }
  }

  const headerPeer = peerCache;

  return (
    <View style={styles.flex}>
      {/* Header contextual Apple: voltar + a pessoa no centro */}
      <ScreenHeader
        title={headerPeer.name}
        subtitle={headerPeer.isMentor ? "Mentor" : "Conversa"}
        onBack={onBackToList}
        right={<View style={styles.headerPlaceholder} />}
      />

      {loading ? (
        <LoadingList label="Abrindo conversa..." />
      ) : error && !items ? (
        <ErrorBox message={error} onRetry={() => void load("initial")} />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {(items ?? []).length === 0 ? (
              <View style={styles.chatEmpty}>
                <Ionicons name="hand-left-outline" size={22} color={theme.colors.accent} />
                <Text style={styles.chatEmptyText}>
                  Diga oi 👋 — essa é a primeira mensagem da conversa com {headerPeer.name}.
                </Text>
              </View>
            ) : (
              (items ?? []).map((m) => (
                <View
                  key={m.id}
                  style={[styles.bubbleRow, m.mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
                >
                  <View style={[styles.bubble, m.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, m.mine && styles.bubbleTextMine]}>
                      {m.body}
                    </Text>
                    <Text style={[styles.bubbleTime, m.mine && styles.bubbleTimeMine]}>
                      {timeLabel(m.createdAt)}
                      {m.mine && m.read ? " · lida" : ""}
                    </Text>
                  </View>
                </View>
              ))
            )}
            <View style={styles.chatFooterSpacer} />
          </ScrollView>

          {/* Caixa de envio */}
          <View style={styles.composer}>
            <TextInput
              style={styles.composerInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Escrever mensagem…"
              placeholderTextColor={theme.colors.textFaint}
              multiline
              maxLength={2000}
              accessibilityLabel="Mensagem"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}
              onPress={() => void handleSend()}
              disabled={!draft.trim() || sending}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensagem"
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.colors.onAccent} />
              ) : (
                <Ionicons name="send" size={17} color={theme.colors.onAccent} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

/* -------------------------------- Estilos -------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },

    /* Cabeçalho da aba (título grande no corpo, estilo das outras abas) */
    pageHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      gap: 2,
    },
    pageHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    pageTitle: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.6,
    },
    pageSubtitle: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "500" },

    /* Lista */
    listContent: { paddingBottom: DOCK_CLEARANCE },
    threadRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    dot: {
      position: "absolute",
      right: 0,
      top: 0,
      width: 12,
      height: 12,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      borderWidth: 2,
      borderColor: theme.colors.bg,
    },
    threadInfo: { flex: 1, gap: 3 },
    threadTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    threadName: { color: theme.colors.text, fontSize: 14, fontWeight: "700", flexShrink: 1 },
    mentorTag: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "600" },
    threadTime: { color: theme.colors.textFaint, fontSize: 11 },
    threadBottom: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
    threadPreview: { color: theme.colors.textMuted, fontSize: 13, flex: 1, lineHeight: 18 },
    threadPreviewUnread: { color: theme.colors.text, fontWeight: "600" },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    unreadBadgeText: { color: theme.colors.onAccent, fontSize: 11, fontWeight: "800" },
    dockSpacer: { height: theme.spacing.md },

    /* Empty state (amigável) */
    emptyScroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: theme.spacing.xl },
    emptyIconWrap: {
      width: 68,
      height: 68,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
    },
    emptyTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800", textAlign: "center" },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
      marginTop: theme.spacing.xs,
      maxWidth: 280,
    },
    emptyAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      minHeight: 46,
      marginTop: theme.spacing.lg,
    },
    emptyActionText: { color: theme.colors.onAccent, fontSize: 14, fontWeight: "700" },
    emptyHint: {
      color: theme.colors.textFaint,
      fontSize: 11,
      textAlign: "center",
      marginTop: theme.spacing.md,
      maxWidth: 300,
      lineHeight: 16,
    },

    /* Conversa */
    headerPlaceholder: { width: 40 },
    chatContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.md },
    chatEmpty: {
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      marginTop: theme.spacing.xl,
    },
    chatEmptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },
    chatFooterSpacer: { height: theme.spacing.sm },
    bubbleRow: { flexDirection: "row", marginBottom: theme.spacing.sm },
    bubbleRowMine: { justifyContent: "flex-end" },
    bubbleRowTheirs: { justifyContent: "flex-start" },
    bubble: {
      maxWidth: "82%",
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    bubbleMine: {
      backgroundColor: theme.colors.accent,
      borderBottomRightRadius: theme.radius.sm,
    },
    bubbleTheirs: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderBottomLeftRadius: theme.radius.sm,
    },
    bubbleText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
    bubbleTextMine: { color: theme.colors.onAccent },
    bubbleTime: { color: theme.colors.textFaint, fontSize: 10, marginTop: 3 },
    bubbleTimeMine: { color: theme.colors.onAccent, opacity: 0.75 },

    /* Composer */
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      paddingBottom: Math.max(theme.spacing.md, 10),
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    composerInput: {
      flex: 1,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingTop: 12,
      paddingBottom: 12,
      color: theme.colors.text,
      fontSize: 14,
      maxHeight: 110,
      minHeight: 44,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    sendDisabled: { opacity: 0.5 },
  });
