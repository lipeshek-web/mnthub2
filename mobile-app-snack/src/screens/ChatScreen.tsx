/**
 * Conversa 1:1 com um par (mentor ou aluno): bolhas minhas/dele, envio com
 * feedback imediato e polling a cada 4s enquanto a tela está em foco (o GET
 * marca as recebidas como lidas no servidor e mantém o badge global correto).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  errMessage,
  getUnreadCount,
  isMissingEndpoint,
  listMessages,
  SERVER_OUTDATED_MESSAGE,
  sendMessage,
  type DirectMessage,
} from "../lib/api";
import { unreadStore } from "../lib/unread";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";

interface ChatParams {
  peerId: string;
  peerName: string;
  peerAvatarUrl: string | null;
}

/** HH:MM a partir de ISO (sem dependências de Intl — Hermes/web seguros). */
function timeOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ChatScreen() {
  const styles = makeStyles();
  const params = (useRoute<RouteProp<Record<string, ChatParams>, string>>().params ?? {}) as ChatParams;
  const { peerId, peerName, peerAvatarUrl } = params;
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<DirectMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** true quando o servidor ainda não tem a rota de mensagens (site desatualizado). */
  const [unavailable, setUnavailable] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await listMessages(peerId);
      setItems(res.items);
      setError(null);
      setUnavailable(false);
      // A abertura/conversa marca como lidas no servidor — sincroniza o badge.
      try {
        const unread = await getUnreadCount();
        unreadStore.set(unread.count);
      } catch {
        /* badge é cosmético — nunca derruba a conversa */
      }
    } catch (err) {
      if (isMissingEndpoint(err)) {
        // Site desatualizado: mostra a conversa vazia (não um erro).
        setItems((prev) => prev ?? []);
        setUnavailable(true);
        setError(null);
      } else {
        setError(errMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [peerId]);

  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => {
        if (!sendingRef.current) void load();
      }, 4000);
      return () => clearInterval(timer);
    }, [load])
  );

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    sendingRef.current = true;
    const optimistic: DirectMessage = {
      id: `tmp-${Date.now()}`,
      body: text,
      mine: true,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...(prev ?? []), optimistic]);
    setDraft("");
    try {
      const sent = await sendMessage(peerId, text);
      setItems((prev) => (prev ?? []).map((m) => (m.id === optimistic.id ? sent : m)));
      // Recarrega em silêncio p/ garantir consistência (+ badge).
      void load();
    } catch (err) {
      // Falhou: remove a otimística e devolve o texto no campo.
      setItems((prev) => (prev ?? []).filter((m) => m.id !== optimistic.id));
      setDraft(text);
      setError(isMissingEndpoint(err) ? SERVER_OUTDATED_MESSAGE : errMessage(err));
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  }

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.headerWrap}>
          <ScreenHeader
            title={peerName ?? "Conversa"}
            onBack={() => navigation.goBack()}
            right={
              <Avatar uri={peerAvatarUrl ?? null} name={peerName ?? "?"} size={34} />
            }
          />
        </View>

        <View style={styles.flex}>
          {loading ? (
            <LoadingList label="Carregando conversa..." />
          ) : error && !items ? (
            <ErrorBox message={error} onRetry={() => void load()} />
          ) : (
            <ChatList items={items ?? []} unavailable={unavailable} />
          )}
        </View>

        {error && items ? (
          <TouchableOpacity style={styles.errorBar} onPress={() => void load()} activeOpacity={0.8}>
            <Ionicons name="alert-circle-outline" size={14} color={theme.colors.danger} />
            <Text style={styles.errorBarText}>{error} — toque para tentar de novo</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={`Mensagem para ${peerName?.split(" ")[0] ?? "..."}`}
            placeholderTextColor={theme.colors.textFaint}
            multiline
            maxLength={2000}
            onSubmitEditing={() => void handleSend()}
            blurOnSubmit={false}
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
              <Ionicons name="send" size={18} color={theme.colors.onAccent} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Lista de mensagens: FlatList invertida (padrão chat, mantém o fim visível). */
function ChatList({ items, unavailable }: { items: DirectMessage[]; unavailable?: boolean }) {
  const styles = makeStyles();
  const reversed = [...items].reverse();
  if (reversed.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="chatbubble-ellipses-outline" size={34} color={theme.colors.textFaint} />
        <Text style={styles.emptyTitle}>Comece a conversa</Text>
        <Text style={styles.emptyText}>
          {unavailable
            ? "As mensagens serão ativadas quando o site for publicado na versão mais recente."
            : "Envie a primeira mensagem — normalmente respondemos em até um dia."}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.flex}>
      <FlatList
        style={styles.flex}
        data={reversed}
        inverted
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.mine ? styles.bubbleRowMine : null]}>
            <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]} selectable>
                {item.body}
              </Text>
              <Text style={[styles.bubbleTime, item.mine && styles.bubbleTimeMine]}>
                {timeOf(item.createdAt)}
                {item.mine && item.read ? " · lida" : ""}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

/* ---------------------------------- Estilos ---------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    headerWrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: 6,
    },
    bubbleRow: { flexDirection: "row", justifyContent: "flex-start" },
    bubbleRowMine: { justifyContent: "flex-end" },
    bubble: {
      maxWidth: "82%",
      borderRadius: 18,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      marginBottom: 2,
    },
    bubbleMine: {
      backgroundColor: theme.colors.accent,
      borderBottomRightRadius: 6,
    },
    bubbleTheirs: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderBottomLeftRadius: 6,
    },
    bubbleText: { color: theme.colors.text, fontSize: 14.5, lineHeight: 20 },
    bubbleTextMine: { color: theme.colors.onAccent },
    bubbleTime: { color: theme.colors.textFaint, fontSize: 10.5, marginTop: 3, alignSelf: "flex-end" },
    bubbleTimeMine: { color: theme.colors.onAccent, opacity: 0.75 },
    emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: theme.spacing.xl },
    emptyTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
    emptyText: { color: theme.colors.textMuted, fontSize: 13.5, textAlign: "center", lineHeight: 19 },

    errorBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginHorizontal: theme.spacing.lg,
      marginBottom: 6,
      backgroundColor: theme.colors.dangerSoft,
      borderColor: theme.colors.dangerBorder,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
    },
    errorBarText: { color: theme.colors.danger, fontSize: 12, flex: 1 },

    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: Math.max(theme.spacing.md, 10),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
    },
    input: {
      flex: 1,
      maxHeight: 110,
      minHeight: 44,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      fontSize: 15,
      paddingHorizontal: theme.spacing.md,
      paddingTop: 11,
      paddingBottom: 11,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    sendDisabled: { opacity: 0.45 },
  });
