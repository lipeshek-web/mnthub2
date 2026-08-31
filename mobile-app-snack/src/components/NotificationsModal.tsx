/**
 * Modal de notificações do aluno — aberto pelo ícone de sino no Início e pela
 * linha "Notificações" no Perfil. Reusa os mesmos endpoints que o Perfil já
 * usava (listNotifications / markAllNotificationsRead) e mostra tempo relativo,
 * dot de não-lidas e botão "Marcar todas como lidas".
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  errMessage,
  listNotifications,
  markAllNotificationsRead,
  type NotificationItem,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatRelativeTime } from "../lib/format";
import { theme } from "../theme";
import { EmptyState } from "./EmptyState";
import { ErrorBox } from "./ErrorBox";

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const styles = makeStyles();
  const auth = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications();
      setItems(res.items);
      setUnread(res.unread);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarrega sempre que o modal abre (dados frescos + badge correta).
  useEffect(() => {
    if (visible) void load();
  }, [visible, load]);

  async function handleMarkAllRead() {
    if (markingRead || unread === 0) return;
    setMarkingRead(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((n): NotificationItem => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
      );
      setUnread(0);
      // Atualiza unreadNotifications do usuário no estado global (badge do Início).
      await auth.refresh().catch(() => undefined);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setMarkingRead(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safe}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Fechar notificações"
          >
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notificações</Text>
          <TouchableOpacity
            style={[styles.markAll, (unread === 0 || markingRead) && styles.markAllDisabled]}
            onPress={() => void handleMarkAllRead()}
            disabled={unread === 0 || markingRead}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Marcar todas as notificações como lidas"
          >
            {markingRead ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.markAllText}>Marcar lidas</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {unread > 0 ? (
          <Text style={styles.unreadHint}>
            {unread} não {unread === 1 ? "lida" : "lidas"}
          </Text>
        ) : null}

        {/* Conteúdo */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingLabel}>Carregando notificações...</Text>
          </View>
        ) : error && items.length === 0 ? (
          <ErrorBox message={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="Sem notificações"
            message="Confirmações de sessões e novidades aparecem aqui."
          />
        ) : (
          <FlatList
            style={styles.list}
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.card, item.readAt ? null : styles.cardUnread]}>
                <View style={styles.cardTopRow}>
                  {!item.readAt ? <View style={styles.dot} /> : null}
                  <Text
                    style={[styles.cardTitle, item.readAt ? null : styles.cardTitleUnread]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.cardTime}>{formatRelativeTime(item.createdAt)}</Text>
                </View>
                {item.body ? (
                  <Text style={styles.cardBody} numberOfLines={3}>
                    {item.body}
                  </Text>
                ) : null}
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={null}
            ListFooterComponent={
              error && items.length > 0 ? (
                <View style={styles.footerError}>
                  <ErrorBox compact message={error} onRetry={() => void load()} />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: "700" },
    markAll: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    markAllDisabled: { opacity: 0.45 },
    markAllText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
    unreadHint: {
      color: theme.colors.textFaint,
      fontSize: 11,
      fontWeight: "600",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.md,
    },
    loadingLabel: { color: theme.colors.textMuted, fontSize: 13 },
    list: { flex: 1 },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    footerError: { marginTop: theme.spacing.sm },
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      gap: 4,
    },
    cardUnread: {
      borderColor: theme.colors.accentBorder,
      backgroundColor: theme.colors.accentSoft,
    },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
    },
    cardTitle: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600", flexShrink: 1 },
    cardTitleUnread: { color: theme.colors.text, fontWeight: "700" },
    cardTime: { color: theme.colors.textFaint, fontSize: 11, marginLeft: "auto" },
    cardBody: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17 },
  });
