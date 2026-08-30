/**
 * Aba Perfil: dados da conta (avatar/nome/bio), stats (XP, ofensiva,
 * créditos), notificações com "marcar todas como lidas" e sair da conta.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  errMessage,
  getMe,
  listNotifications,
  markAllNotificationsRead,
  type MeUser,
  type NotificationItem,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatCents, formatIsoDateTime, formatXp } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";

export default function ProfileScreen() {
  const auth = useAuth();
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    setError(null);
    try {
      const res = await getMe();
      setMe(res.user);
    } catch (err) {
      setError(errMessage(err));
      throw err;
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifError(null);
    try {
      const res = await listNotifications();
      setNotifications(res.items);
      setUnread(res.unread);
    } catch (err) {
      setNotifError(errMessage(err));
      throw err;
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    try {
      await Promise.all([loadProfile(), loadNotifications()]);
    } catch {
      // Os erros já foram registrados nos estados individuais.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadProfile, loadNotifications]);

  useEffect(() => {
    void load("initial");
  }, [load]);

  async function handleMarkAllRead() {
    if (markingRead || unread === 0) return;
    setMarkingRead(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n): NotificationItem => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
      );
      setUnread(0);
      // Atualiza o unreadNotifications do usuário logado no estado global.
      await auth.refresh().catch(() => undefined);
    } catch (err) {
      Alert.alert("Não foi possível atualizar", errMessage(err));
    } finally {
      setMarkingRead(false);
    }
  }

  function confirmLogout() {
    Alert.alert("Sair da conta", "Deseja realmente sair do MentorHub?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => void handleLogout() },
    ]);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await auth.logout();
      // O gate de autenticação nas abas redireciona para o login sozinho.
    } catch (err) {
      Alert.alert("Não foi possível sair", errMessage(err));
      setLoggingOut(false);
    }
  }

  return (
    <Screen>
      {loading ? (
        <LoadingList label="Carregando seu perfil..." />
      ) : error && !me ? (
        <ErrorBox message={error} onRetry={() => void load("initial")} />
      ) : me ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
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
          {/* Cabeçalho da conta */}
          <View style={styles.profileCard}>
            <Avatar uri={me.avatarUrl} name={me.name} size={72} />
            <Text style={styles.name}>{me.name}</Text>
            {me.bio ? <Text style={styles.bio}>{me.bio}</Text> : null}
            <Text style={styles.email}>{me.email}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statValueRow}>
                <Ionicons name="flash" size={14} color={theme.colors.accent} />
                <Text style={styles.statValue}>{formatXp(me.xp)}</Text>
              </View>
              <Text style={styles.statLabel}>Experiência</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statValueRow}>
                <Ionicons name="flame" size={14} color={theme.colors.warning} />
                <Text style={styles.statValue}>
                  {me.studyStreak} {me.studyStreak === 1 ? "dia" : "dias"}
                </Text>
              </View>
              <Text style={styles.statLabel}>
                Ofensiva{me.longestStreak > 0 ? ` · recorde ${me.longestStreak}` : ""}
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statValueRow}>
                <Ionicons name="wallet-outline" size={14} color={theme.colors.info} />
                <Text style={styles.statValue}>{formatCents(me.creditCents)}</Text>
              </View>
              <Text style={styles.statLabel}>Créditos</Text>
            </View>
          </View>

          {/* Notificações */}
          <View style={styles.notifHeader}>
            <Text style={styles.sectionTitle}>Notificações</Text>
            {unread > 0 ? (
              <TouchableOpacity
                style={styles.markAll}
                onPress={() => void handleMarkAllRead()}
                disabled={markingRead}
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
            ) : null}
          </View>
          {unread > 0 ? <Text style={styles.unreadBadge}>{unread} não {unread === 1 ? "lida" : "lidas"}</Text> : null}

          {notifError && notifications.length > 0 ? (
            <View style={styles.notifErrorBox}>
              <ErrorBox compact message={notifError} onRetry={() => void loadNotifications().catch(() => undefined)} />
            </View>
          ) : null}

          {notifLoading ? (
            <LoadingList compact />
          ) : notifError && notifications.length === 0 ? (
            <ErrorBox message={notifError} onRetry={() => void loadNotifications().catch(() => undefined)} />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon="notifications-outline"
              title="Sem notificações"
              message="Confirmações de sessões e novidades aparecem aqui."
            />
          ) : (
            <View style={styles.notifList}>
              {notifications.map((notification) => (
                <View
                  key={notification.id}
                  style={[styles.notifCard, notification.readAt ? null : styles.notifUnread]}
                >
                  <View style={styles.notifTopRow}>
                    {!notification.readAt ? <View style={styles.notifDot} /> : null}
                    <Text
                      style={[
                        styles.notifTitle,
                        notification.readAt ? null : styles.notifTitleUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {notification.title}
                    </Text>
                    <Text style={styles.notifTime}>{formatIsoDateTime(notification.createdAt)}</Text>
                  </View>
                  {notification.body ? (
                    <Text style={styles.notifBody} numberOfLines={3}>
                      {notification.body}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Conta */}
          <Text style={styles.sectionTitle}>Conta</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={confirmLogout}
            disabled={loggingOut}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={theme.colors.danger} />
            ) : (
              <Ionicons name="log-out-outline" size={18} color={theme.colors.danger} />
            )}
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>

          <Text style={styles.version}>MentorHub · versão 1.0.0</Text>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  profileCard: {
    alignItems: "center",
    gap: 6,
    paddingVertical: theme.spacing.lg,
  },
  name: { color: theme.colors.text, fontSize: 20, fontWeight: "700", marginTop: 4 },
  bio: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  email: { color: theme.colors.textFaint, fontSize: 12 },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statValue: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  statLabel: { color: theme.colors.textFaint, fontSize: 11 },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: 4,
  },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "700" },
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
  markAllText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  unreadBadge: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: theme.spacing.sm,
  },
  notifErrorBox: { marginBottom: theme.spacing.sm },
  notifList: { gap: theme.spacing.sm },
  notifCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  notifUnread: {
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentSoft,
  },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notifDot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
  },
  notifTitle: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  notifTitleUnread: { color: theme.colors.text, fontWeight: "700" },
  notifTime: { color: theme.colors.textFaint, fontSize: 11, marginLeft: "auto" },
  notifBody: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
  },
  logoutText: { color: theme.colors.dangerText, fontSize: 14, fontWeight: "700" },
  version: {
    color: theme.colors.textFaint,
    fontSize: 11,
    textAlign: "center",
    marginTop: theme.spacing.xl,
  },
});
