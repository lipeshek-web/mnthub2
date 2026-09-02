/**
 * Aba Mensagens: caixa de entrada com uma linha por conversa (par, última
 * mensagem, tempo relativo e badge de não lidas). Polling leve enquanto a aba
 * está em foco; abrir uma conversa navega para o Chat (stack).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { errMessage, listThreadsSafe, type Thread } from "../lib/api";
import { formatRelativeTime } from "../lib/format";
import { unreadStore } from "../lib/unread";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";

export default function MessagesScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      // Safe: servidor sem a rota de mensagens (site desatualizado) devolve caixa
      // vazia — a aba mostra o estado amigável, nunca um erro assustador.
      const res = await listThreadsSafe();
      setThreads(res.threads);
      unreadStore.set(res.unreadTotal);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carrega na montagem e a cada volta do foco (voltar de um chat, trocar de aba).
  useFocusEffect(
    useCallback(() => {
      void load(mountedRef.current ? "refresh" : "initial");
      mountedRef.current = true;
      // Polling leve enquanto a aba está visível (badge sempre atualizado).
      const timer = setInterval(() => void load("refresh"), 15000);
      return () => clearInterval(timer);
    }, [load])
  );

  function openChat(thread: Thread) {
    navigation.navigate("Chat", {
      peerId: thread.peer.id,
      peerName: thread.peer.name,
      peerAvatarUrl: thread.peer.avatarUrl ?? null,
    });
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mensagens</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.accent} />
        </View>
      </View>

      <FlatList<Thread>
        style={styles.flex}
        data={threads}
        keyExtractor={(item) => item.peer.id}
        renderItem={({ item }) => <ThreadRow thread={item} onPress={() => openChat(item)} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        ListEmptyComponent={
          loading ? (
            <LoadingList label="Carregando conversas..." />
          ) : error ? (
            <ErrorBox message={error} onRetry={() => void load("initial")} />
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title="Nenhuma conversa ainda"
              message="Fale com seus mentores pelo perfil deles ou agende uma sessão para começar uma conversa."
              actionLabel="Ver mentorias"
              onAction={() => navigation.navigate("Main", { screen: "Mentorias" })}
            />
          )
        }
      />
    </Screen>
  );
}

/* ----------------------------- Linha da conversa ----------------------------- */

function ThreadRow({ thread, onPress }: { thread: Thread; onPress: () => void }) {
  const styles = makeStyles();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Conversa com ${thread.peer.name}`}
    >
      <Avatar uri={thread.peer.avatarUrl} name={thread.peer.name} size={46} />
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>
            {thread.peer.name}
          </Text>
          <Text style={styles.rowTime}>{formatRelativeTime(thread.lastAt)}</Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[styles.rowPreview, thread.unread > 0 && styles.rowPreviewUnread]}
            numberOfLines={1}
          >
            {thread.lastMine ? "Você: " : ""}
            {thread.lastBody}
          </Text>
          {thread.unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{thread.unread > 9 ? "9+" : thread.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ---------------------------------- Estilos ---------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    title: { color: theme.colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
    headerIcon: {
      width: 38,
      height: 38,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    rowInfo: { flex: 1, gap: 3 },
    rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    rowName: { color: theme.colors.text, fontSize: 15, fontWeight: "700", flexShrink: 1 },
    rowTime: { color: theme.colors.textFaint, fontSize: 11.5 },
    rowBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
    rowPreview: { color: theme.colors.textMuted, fontSize: 13, flex: 1 },
    rowPreviewUnread: { color: theme.colors.text, fontWeight: "700" },
    badge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { color: theme.colors.onAccent, fontSize: 11, fontWeight: "800" },
  });
