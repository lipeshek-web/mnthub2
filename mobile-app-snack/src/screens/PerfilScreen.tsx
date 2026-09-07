/**
 * Aba 4 "Perfil" — conta e preferências, raiz da aba (sem botão de voltar).
 *
 * Layout estilo iOS: título grande + card de perfil (avatar, nome, e-mail e
 * chips compactos de XP / ofensiva / créditos) e, abaixo, LISTAS AGRUPADAS —
 * cards com hairline entre linhas, ícone em quadradinho accentSoft, rótulo
 * 15/600 e chevron à direita:
 *   - Aprendizado: Salvos (favoritos locais) e Ranking da semana;
 *   - Preferências: Tema (pílulas Claro | Escuro — persistidas no ThemeProvider);
 *   - Mais: Notificações (modal), Mensagens (troca de ABA via setTab) e
 *     Sair da conta (vermelho, com confirmação Alert).
 *
 * Pull-to-refresh recarrega /auth/me; a contagem de Salvos atualiza ao voltar
 * da tela de Salvos (useFocusEffect). Folga inferior para a tab bar nativa
 * (DOCK_CLEARANCE), já que agora o Perfil é uma página do pager de abas.
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
import { DOCK_CLEARANCE, useTabs } from "../lib/tabs";
import { formatCents, formatXp } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { NotificationsModal } from "../components/NotificationsModal";
import { Screen } from "../components/Screen";

export default function ProfileScreen() {
  const styles = makeStyles();
  const auth = useAuth();
  const navigation = useNavigation<any>();
  const { setTab } = useTabs();
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

  // Roda na montagem e a cada refoco da aba (retorno da tela Salvos).
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
    Alert.alert("Sair da conta", "Deseja realmente sair da Órbita?", [
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
      {/* Cabeçalho grande estilo iOS — raiz da aba, sem voltar */}
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Sua conta e preferências</Text>
      </View>

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
          {/* Card de perfil */}
          <View style={styles.profileCard}>
            <View style={styles.profileHead}>
              <Avatar uri={me.avatarUrl} name={me.name} size={76} />
              <View style={styles.profileInfo}>
                <Text style={styles.name} numberOfLines={1}>
                  {me.name}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {me.email}
                </Text>
              </View>
            </View>
            <View style={styles.chipRow}>
              <View
                style={styles.statChip}
                accessibilityLabel={`Experiência: ${formatXp(me.xp)}`}
              >
                <Ionicons name="flash" size={13} color={theme.colors.accent} />
                <Text style={styles.statChipText}>{formatXp(me.xp)}</Text>
              </View>
              <View
                style={styles.statChip}
                accessibilityLabel={`Ofensiva: ${me.studyStreak} ${me.studyStreak === 1 ? "dia" : "dias"}`}
              >
                <Ionicons name="flame" size={13} color={theme.colors.warning} />
                <Text style={styles.statChipText}>
                  {me.studyStreak} {me.studyStreak === 1 ? "dia" : "dias"}
                </Text>
              </View>
              <View
                style={styles.statChip}
                accessibilityLabel={`Créditos: ${formatCents(me.creditCents)}`}
              >
                <Ionicons name="wallet-outline" size={13} color={theme.colors.info} />
                <Text style={styles.statChipText}>{formatCents(me.creditCents)}</Text>
              </View>
            </View>
            {me.bio ? <Text style={styles.bio}>{me.bio}</Text> : null}
          </View>

          {/* Grupo: Aprendizado */}
          <Text style={styles.groupLabel}>Aprendizado</Text>
          <View style={styles.group}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("Salvos")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Abrir itens salvos"
            >
              <View style={styles.rowIcon}>
                <Ionicons name="bookmark-outline" size={17} color={theme.colors.accent} />
              </View>
              <Text style={styles.rowLabel}>Salvos</Text>
              {favCount > 0 ? (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{favCount}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, styles.rowDivided]}
              onPress={() => navigation.navigate("Ranking")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Abrir o ranking da semana"
            >
              <View style={styles.rowIcon}>
                <Ionicons name="trophy-outline" size={17} color={theme.colors.accent} />
              </View>
              <Text style={styles.rowLabel}>Ranking da semana</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>
          </View>

          {/* Grupo: Preferências */}
          <Text style={styles.groupLabel}>Preferências</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name={mode === "dark" ? "moon-outline" : "sunny-outline"}
                  size={17}
                  color={theme.colors.accent}
                />
              </View>
              <Text style={styles.rowLabel}>Tema</Text>
              <View style={styles.themePills}>
                <TouchableOpacity
                  style={[styles.themePill, mode === "light" ? styles.themePillActive : null]}
                  onPress={() => setMode("light")}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8 }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: mode === "light" }}
                  accessibilityLabel="Tema claro"
                >
                  <Ionicons
                    name="sunny-outline"
                    size={12}
                    color={mode === "light" ? theme.colors.accent : theme.colors.textFaint}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      mode === "light" ? styles.themePillTextActive : null,
                    ]}
                  >
                    Claro
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.themePill, mode === "dark" ? styles.themePillActive : null]}
                  onPress={() => setMode("dark")}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8 }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: mode === "dark" }}
                  accessibilityLabel="Tema escuro"
                >
                  <Ionicons
                    name="moon-outline"
                    size={12}
                    color={mode === "dark" ? theme.colors.accent : theme.colors.textFaint}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      mode === "dark" ? styles.themePillTextActive : null,
                    ]}
                  >
                    Escuro
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Grupo: Mais */}
          <Text style={styles.groupLabel}>Mais</Text>
          <View style={styles.group}>
            {/* Notificações */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => setNotificationsOpen(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações"
            >
              <View style={styles.rowIcon}>
                <Ionicons name="notifications-outline" size={17} color={theme.colors.accent} />
              </View>
              <Text style={styles.rowLabel}>Notificações</Text>
              <Text style={styles.rowHint}>
                {unread > 0 ? `${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Tudo em dia"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>

            {/* Mensagens — continua sendo ABA: troca o pager via setTab */}
            <TouchableOpacity
              style={[styles.row, styles.rowDivided]}
              onPress={() => setTab("Mensagens")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Abrir mensagens"
            >
              <View style={styles.rowIcon}>
                <Ionicons name="chatbubbles-outline" size={17} color={theme.colors.accent} />
              </View>
              <Text style={styles.rowLabel}>Mensagens</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>

            {/* Sair da conta — vermelho, com confirmação */}
            <TouchableOpacity
              style={[styles.row, styles.rowDivided]}
              onPress={confirmLogout}
              disabled={loggingOut}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
            >
              <View style={[styles.rowIcon, styles.rowIconDanger]}>
                <Ionicons name="log-out-outline" size={17} color={theme.colors.danger} />
              </View>
              <Text style={[styles.rowLabel, styles.rowLabelDanger]}>Sair da conta</Text>
              {loggingOut ? (
                <ActivityIndicator size="small" color={theme.colors.danger} />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
              )}
            </TouchableOpacity>
          </View>

          {/* Rodapé discreto */}
          <Text style={styles.footer}>Órbita · Seu universo de aprendizado</Text>
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
      paddingBottom: DOCK_CLEARANCE + theme.spacing.lg,
    },

    /* Cabeçalho grande iOS */
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.md,
      gap: 3,
    },
    title: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.8,
    },
    subtitle: {
      color: theme.colors.textFaint,
      fontSize: 13,
      fontWeight: "500",
    },

    /* Card de perfil */
    profileCard: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.xs,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
    },
    profileHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.lg,
    },
    profileInfo: { flex: 1, gap: 3 },
    name: { color: theme.colors.text, fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
    email: { color: theme.colors.textMuted, fontSize: 13 },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    statChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: 30,
      paddingHorizontal: 10,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    statChipText: { color: theme.colors.text, fontSize: 12, fontWeight: "700" },
    bio: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: theme.spacing.md,
    },

    /* Listas agrupadas estilo iOS */
    groupLabel: {
      color: theme.colors.textFaint,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      marginHorizontal: theme.spacing.lg,
    },
    group: {
      marginHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.xs,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: 52,
    },
    rowDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    rowIconDanger: {
      backgroundColor: theme.colors.dangerSoft,
      borderColor: theme.colors.dangerBorder,
    },
    rowLabel: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    rowLabelDanger: { color: theme.colors.dangerText },
    rowHint: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "500" },

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

    /* Pílulas de tema (Claro | Escuro) */
    themePills: {
      flexDirection: "row",
      gap: theme.spacing.xs,
    },
    themePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      height: 30,
      paddingHorizontal: 10,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    themePillActive: {
      backgroundColor: theme.colors.accentSoft,
      borderColor: theme.colors.accentBorder,
    },
    themePillText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
    themePillTextActive: { color: theme.colors.accent, fontWeight: "700" },

    /* Rodapé */
    footer: {
      color: theme.colors.textFaint,
      fontSize: 11,
      textAlign: "center",
      marginTop: theme.spacing.xl,
    },
  });
