/**
 * Aba Início — painel do aluno:
 * - Header fixo: logo "MentorHub" + saudação à esquerda; à direita, ícone de
 *   notificações (com badge de não-lidas), botão de tema e avatar da conta
 *   (único acesso ao Perfil — não existe aba de perfil).
 * - Atalho de busca global + linha de stats compacta (XP, ofensiva, meta).
 * - Card destaque "Continuar estudando" (gradiente), carrossel "Novos na
 *   biblioteca", "Recomendados para você" e as próximas mentorias (máx. 3).
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  errMessage,
  getDashboard,
  getHome,
  isMissingEndpoint,
  type Booking,
  type CourseItem,
  type DashboardEnrolledCourse,
  type DashboardResponse,
  type LibraryItemSummary,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { useThemeMode } from "../lib/theme";
import { useTabs } from "../lib/tabs";
import { formatNaiveDateTime, formatXp } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { BookCard } from "../components/BookCard";
import { CourseCard } from "../components/CourseCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { NotificationsModal } from "../components/NotificationsModal";
import { ProgressBar } from "../components/ProgressBar";
import { RemoteImage } from "../components/RemoteImage";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { StatusPill } from "../components/StatusPill";

import { clearPendingCheckout, readPendingCheckout } from "../lib/pendingCheckout";

export default function HomeScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  // Retomada de compra: se o usuário tentou comprar e a sessão caiu no meio,
  // ao autenticar de novo o app abre direto o curso que estava em checkout.
  useEffect(() => {
    void (async () => {
      const pending = await readPendingCheckout();
      if (pending) {
        await clearPendingCheckout();
        navigation.navigate("Curso", { id: pending });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { setTab } = useTabs();
  const { user, updateUser } = useAuth();
  const { mode, toggle } = useThemeMode();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const load = useCallback(
    async (loadMode: "initial" | "refresh") => {
      if (loadMode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        // Bootstrap: usuário + badges + dashboard em UMA chamada (servidor novo).
        // Em servidor antigo (rota /home inexistente) cai para o dashboard normal.
        try {
          const home = await getHome();
          updateUser(home.user);
          setData({
            user: {
              xp: home.user.xp,
              studyStreak: home.user.studyStreak,
              longestStreak: home.user.longestStreak,
            },
            enrolledCourses: home.enrolledCourses,
            upcomingBookings: home.upcomingBookings,
            newBooks: home.newBooks,
            recommendedCourses: home.recommendedCourses,
            weeklyGoal: home.weeklyGoal,
          });
          return;
        } catch (homeErr) {
          if (!isMissingEndpoint(homeErr)) throw homeErr;
        }
        const dashboard = await getDashboard();
        setData(dashboard);
      } catch (err) {
        setError(errMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [updateUser]
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] ?? "";
  const goal = data?.weeklyGoal ?? null;
  const enrolledCourses = data?.enrolledCourses ?? [];
  const continueCourse: DashboardEnrolledCourse | null =
    enrolledCourses.find((c) => c.progressPct > 0 && c.progressPct < 100) ??
    enrolledCourses[0] ??
    null;
  const bookings: Booking[] = data?.upcomingBookings ?? [];
  const newBooks: LibraryItemSummary[] = data?.newBooks ?? [];
  const recommended: CourseItem[] = data?.recommendedCourses ?? [];
  const unreadNotifications = user?.unreadNotifications ?? 0;

  return (
    <Screen>
      {/* Header fixo: logo + saudação | notificações, tema e conta */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>
            Mentor<Text style={styles.logoAccent}>Hub</Text>
          </Text>
          <Text style={styles.greeting} numberOfLines={1}>
            Olá{firstName ? `, ${firstName}` : ""}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setNotificationsOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              unreadNotifications > 0
                ? `Notificações — ${unreadNotifications} não lidas`
                : "Notificações"
            }
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
            {unreadNotifications > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 9 ? "9+" : String(unreadNotifications)}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggle}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            <Ionicons
              name={mode === "dark" ? "sunny-outline" : "moon-outline"}
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Perfil")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Abrir meu perfil"
          >
            <Avatar uri={user?.avatarUrl ?? null} name={user?.name ?? "?"} size={36} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <LoadingList label="Carregando seu painel..." />
      ) : error && !data ? (
        <ErrorBox message={error} onRetry={() => void load("initial")} />
      ) : (
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
          {error && data ? <ErrorBox compact message={error} /> : null}

          {/* Atalho de busca global — abre a tela Busca (não é input real) */}
          <TouchableOpacity
            style={styles.searchFake}
            onPress={() => navigation.navigate("Busca")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Buscar cursos, livros e mentores"
          >
            <Ionicons name="search-outline" size={17} color={theme.colors.textFaint} />
            <Text style={styles.searchFakeText} numberOfLines={1}>
              Buscar cursos, livros e mentores...
            </Text>
          </TouchableOpacity>

          {/* Stats compactas: XP · ofensiva · meta semanal */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flash" size={14} color={theme.colors.accent} />
              <Text style={styles.statValue} numberOfLines={1}>
                {formatXp(data?.user.xp ?? 0)}
              </Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={14} color={theme.colors.warning} />
              <Text style={styles.statValue} numberOfLines={1}>
                {data?.user.studyStreak ?? 0} {data?.user.studyStreak === 1 ? "dia" : "dias"}
              </Text>
              <Text style={styles.statLabel}>Ofensiva</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flag" size={14} color={theme.colors.info} />
              <Text style={styles.statValue} numberOfLines={1}>
                {goal && goal.targetLessons > 0 ? `${goal.doneLessons}/${goal.targetLessons}` : "—"}
              </Text>
              <Text style={styles.statLabel}>Meta semanal</Text>
            </View>
          </View>

          {/* Continuar estudando — card destaque com gradiente */}
          <SectionTitle title="Continuar estudando" />
          {continueCourse ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("Curso", { id: continueCourse.id })}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Continuar o curso ${continueCourse.title}`}
            >
              <LinearGradient
                colors={[theme.colors.accent, theme.colors.accentStrong]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueCard}
              >
                <RemoteImage
                  uri={continueCourse.coverUrl}
                  style={styles.continueCover}
                  recyclingKey={continueCourse.id}
                  errorIcon="image-outline"
                  iconSize={22}
                />
                <View style={styles.continueInfo}>
                  <Text style={styles.continueTitle} numberOfLines={2}>
                    {continueCourse.title}
                  </Text>
                  <Text style={styles.continueMeta}>
                    {continueCourse.completedLessons} de {continueCourse.totalLessons} aulas ·{" "}
                    {continueCourse.progressPct}%
                  </Text>
                  <ProgressBar
                    pct={continueCourse.progressPct}
                    height={6}
                    color={theme.colors.white}
                    trackColor="rgba(255, 255, 255, 0.28)"
                  />
                  <View style={styles.continueCta}>
                    <Text style={styles.continueCtaText}>Continuar</Text>
                    <Ionicons name="arrow-forward" size={14} color={theme.colors.white} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <EmptyState
              icon="school-outline"
              title="Nenhum curso em andamento"
              message="Explore o catálogo e inscreva-se no seu primeiro curso."
              actionLabel="Explorar cursos"
              onAction={() => setTab("Cursos")}
            />
          )}

          {/* Novos na biblioteca — carrossel horizontal */}
          {newBooks.length > 0 ? (
            <>
              <SectionTitle
                title="Novos na biblioteca"
                actionLabel="Ver todos"
                onAction={() => setTab("Livros")}
              />
              <FlatList
                horizontal
                nestedScrollEnabled
                data={newBooks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <BookCard
                    item={item}
                    variant="mini"
                    onPress={() => navigation.navigate("Livro", { id: item.id })}
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              />
            </>
          ) : null}

          {/* Recomendados para você — carrossel horizontal (card vertical dedicado) */}
          {recommended.length > 0 ? (
            <>
              <SectionTitle
                title="Recomendados para você"
                actionLabel="Ver todos"
                onAction={() => setTab("Cursos")}
              />
              <FlatList
                horizontal
                nestedScrollEnabled
                data={recommended}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.recoItem}>
                    <CourseCard
                      course={item}
                      variant="reco"
                      onPress={() => navigation.navigate("Curso", { id: item.id })}
                    />
                  </View>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              />
            </>
          ) : null}

          {/* Próximas mentorias */}
          <SectionTitle
            title="Próximas mentorias"
            actionLabel={bookings.length > 0 ? "Ver todas" : undefined}
            onAction={() => setTab("Mentorias")}
          />
          {bookings.length === 0 ? (
            <EmptyState
              icon="videocam-outline"
              title="Nenhuma mentoria agendada"
              message="Encontre um mentor e agende sua próxima sessão 1:1."
              actionLabel="Ver mentores"
              onAction={() => setTab("Mentorias")}
            />
          ) : (
            bookings.slice(0, 3).map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate("Mentor", { id: booking.mentor.id })}
                activeOpacity={0.85}
              >
                <Avatar uri={booking.mentor.avatarUrl} name={booking.mentor.name} size={42} />
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingName} numberOfLines={1}>
                    {booking.mentor.name}
                  </Text>
                  <Text style={styles.bookingTopic} numberOfLines={1}>
                    {booking.topic}
                  </Text>
                  <Text style={styles.bookingWhen}>{formatNaiveDateTime(booking.startsAt)}</Text>
                </View>
                <StatusPill status={booking.status} />
              </TouchableOpacity>
            ))
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Notificações (mesmos endpoints já usados no Perfil) */}
      <NotificationsModal
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
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

    /* Header */
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    headerLeft: { flexShrink: 1, gap: 2 },
    logo: { color: theme.colors.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
    logoAccent: { color: theme.colors.accent },
    greeting: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: -3,
      right: -3,
      minWidth: 17,
      height: 17,
      paddingHorizontal: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.danger,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.colors.bg,
    },
    badgeText: { color: theme.colors.white, fontSize: 9, fontWeight: "700" },

    /* Atalho de busca global (aparência do SearchField, abre a tela Busca) */
    searchFake: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      height: 46,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
    },
    searchFakeText: { flex: 1, color: theme.colors.textFaint, fontSize: 15 },

    /* Stats compactas */
    statsRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      gap: 3,
      alignItems: "flex-start",
    },
    statValue: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
    statLabel: { color: theme.colors.textFaint, fontSize: 11 },

    /* Carrosséis horizontais (novidades e recomendados) */
    carousel: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
      paddingBottom: 4,
    },
    recoItem: { width: 218 },

    /* Continuar estudando (gradiente) */
    continueCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },
    continueCover: {
      width: 104,
      height: 66,
      borderRadius: theme.radius.md,
      backgroundColor: "rgba(255, 255, 255, 0.18)",
    },
    continueInfo: { flex: 1, gap: 6 },
    continueTitle: { color: theme.colors.white, fontSize: 15, fontWeight: "700", lineHeight: 20 },
    continueMeta: { color: "rgba(255, 255, 255, 0.85)", fontSize: 12, fontWeight: "600" },
    continueCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 2,
    },
    continueCtaText: { color: theme.colors.white, fontSize: 12, fontWeight: "700" },

    /* Próximas mentorias */
    bookingCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.md,
    },
    bookingInfo: { flex: 1, gap: 3 },
    bookingName: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
    bookingTopic: { color: theme.colors.textMuted, fontSize: 12 },
    bookingWhen: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "600" },
    bottomSpacer: { height: theme.spacing.lg },
  });
