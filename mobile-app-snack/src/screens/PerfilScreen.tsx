/**
 * Perfil: header da conta (avatar, nome, e-mail, chip de XP), linha de
 * stats (XP / ofensiva / créditos) e grupo "Ajustes" — seletor de aparência
 * (Claro/Escuro), Salvos, linha de notificações (abre o modal) e sair da conta.
 *
 * NÃO é aba: abre como tela do stack pelo ícone da conta no header da Home
 * (por isso tem botão de voltar).
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { errMessage, getMe, type MeUser } from "../lib/api";
import { listFavorites } from "../lib/favorites";
import { useAuth } from "../lib/auth";
import { useThemeMode } from "../lib/theme";
import { formatCents, formatXp } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { NotificationsModal } from "../components/NotificationsModal";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { XpBadge } from "../components/XpBadge";

export default function ProfileScreen() {
  const styles = makeStyles();
  const auth = useAuth();
  const navigation = useNavigation<any>();
  const { mode, setMode } = useThemeMode();
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // Contagem de itens salvos (favoritos locais) — recarrega ao voltar da tela Salvos.
  const [favCount, setFavCount] = useState(0);

  const refreshFavCount = useCallback(() => {
    void listFavorites().then((list) => setFavCount(list.length));
  }, []);

  // Roda na montagem e a cada refoco da "Main" (retorno da tela Salvos).
  useFocusEffect(refreshFavCount);

  const load = useCallback(async (loadMode: "initial" | "refresh") => {
    if (loadMode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await getMe();
      setMe(res.user);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

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
      // O gate de autenticação no App.js redireciona para o login sozinho.
    } catch (err) {
      Alert.alert("Não foi possível sair", errMessage(err));
      setLoggingOut(false);
    }
  }

  const unread = me?.unreadNotifications ?? 0;

  return (
    <Screen>
      <ScreenHeader title="Perfil" onBack={() => navigation.goBack()} />
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
          <View style={styles.profileHead}>
            <Avatar uri={me.avatarUrl} name={me.name} size={84} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{me.name}</Text>
              <Text style={styles.email}>{me.email}</Text>
              <View style={styles.xpChip}>
                <XpBadge xp={me.xp} />
              </View>
            </View>
          </View>
          {me.bio ? <Text style={styles.bio}>{me.bio}</Text> : null}

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

          {/* Ajustes */}
          <Text style={styles.sectionTitle}>Ajustes</Text>
          <View style={styles.settingsGroup}>
            {/* Aparência */}
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name={mode === "dark" ? "moon-outline" : "sunny-outline"}
                  size={17}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Aparência</Text>
                <View style={styles.appearanceRow}>
                  <TouchableOpacity
                    style={[styles.appearanceOption, mode === "light" ? styles.appearanceActive : null]}
                    onPress={() => setMode("light")}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: mode === "light" }}
                    accessibilityLabel="Tema claro"
                  >
                    <Ionicons
                      name={mode === "light" ? "checkmark-circle" : "ellipse-outline"}
                      size={15}
                      color={mode === "light" ? theme.colors.accent : theme.colors.textFaint}
                    />
                    <Ionicons name="sunny-outline" size={13} color={theme.colors.textMuted} />
                    <Text style={styles.appearanceText}>Claro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.appearanceOption, mode === "dark" ? styles.appearanceActive : null]}
                    onPress={() => setMode("dark")}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: mode === "dark" }}
                    accessibilityLabel="Tema escuro"
                  >
                    <Ionicons
                      name={mode === "dark" ? "checkmark-circle" : "ellipse-outline"}
                      size={15}
                      color={mode === "dark" ? theme.colors.accent : theme.colors.textFaint}
                    />
                    <Ionicons name="moon-outline" size={13} color={theme.colors.textMuted} />
                    <Text style={styles.appearanceText}>Escuro</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Mensagens (conversas com mentores) */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate("Mensagens")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Abrir mensagens"
            >
              <View style={styles.settingIcon}>
                <Ionicons name="chatbubbles-outline" size={17} color={theme.colors.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Mensagens</Text>
                <Text style={styles.settingHint}>Conversas com seus mentores</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>

            {/* Salvos (favoritos locais do aparelho) */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate("Salvos")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Abrir itens salvos"
            >
              <View style={styles.settingIcon}>
                <Ionicons name="bookmark-outline" size={17} color={theme.colors.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Salvos</Text>
                <Text style={styles.settingHint}>Cursos e livros guardados</Text>
              </View>
              {favCount > 0 ? (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{favCount}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>

            {/* Notificações */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setNotificationsOpen(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações"
            >
              <View style={styles.settingIcon}>
                <Ionicons name="notifications-outline" size={17} color={theme.colors.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Notificações</Text>
                <Text style={styles.settingHint}>
                  {unread > 0 ? `${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Tudo em dia"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>
          </View>

          {/* Sair da conta */}
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

          <Text style={styles.footer}>MentorHub · API v1</Text>
        </ScrollView>
      ) : null}

      {/* Notificações */}
      <NotificationsModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </Screen>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },

    /* Header da conta */
    profileHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
    profileInfo: { flex: 1, gap: 4 },
    name: { color: theme.colors.text, fontSize: 20, fontWeight: "700" },
    email: { color: theme.colors.textFaint, fontSize: 12 },
    xpChip: { marginTop: 4 },
    bio: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: theme.spacing.sm,
    },

    /* Stats */
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

    /* Ajustes */
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "700",
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    settingsGroup: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    settingIcon: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    settingContent: { flex: 1, gap: 2 },
    settingLabel: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
    settingHint: { color: theme.colors.textFaint, fontSize: 12 },
    /* Contagem de itens salvos (quando > 0) à direita da linha */
    countPill: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    countPillText: { color: theme.colors.accent, fontSize: 11, fontWeight: "700" },
    appearanceRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: 6,
    },
    appearanceOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    appearanceActive: {
      backgroundColor: theme.colors.accentSoft,
      borderColor: theme.colors.accentBorder,
    },
    appearanceText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "700" },

    /* Sair */
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      paddingVertical: 13,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.dangerSoft,
      borderWidth: 1,
      borderColor: theme.colors.dangerBorder,
    },
    logoutText: { color: theme.colors.dangerText, fontSize: 14, fontWeight: "700" },

    /* Rodapé */
    footer: {
      color: theme.colors.textFaint,
      fontSize: 11,
      textAlign: "center",
      marginTop: theme.spacing.xl,
    },
  });
