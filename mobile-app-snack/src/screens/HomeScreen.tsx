/**
 * Aba Início — ENXUTA (estilo Duolingo/Apple). A própria Home É a exploração:
 * - Header fixo: saudação à esquerda; à direita, busca global, notificações
 *   (com badge), tema e avatar da conta (único acesso ao Perfil).
 * - "Continuar estudando" — card destaque com gradiente (o próximo passo).
 * - "Meus cursos" — carrossel compacto com o resto dos cursos inscritos.
 * - "Explorar" — 3 atalhos grandes (Cursos · Biblioteca · Mentores).
 * - "Em alta agora" — carrossel de cursos recomendados.
 * - "Mentorias" — próximas sessões (máx. 3).
 * Header e rodapé fixos: só o corpo rola (com folga para o dock flutuante).
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
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { useThemeMode } from "../lib/theme";
import { DOCK_CLEARANCE, useTabs } from "../lib/tabs";
import { formatNaiveDateTime } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
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

/** Atalhos da seção "Explorar" — trocam de aba sem navegar no stack. */
const EXPLORAR = [
  { tab: "Cursos", icon: "play-circle-outline", title: "Cursos", sub: "Aulas no seu ritmo" },
  { tab: "Livros", icon: "book-outline", title: "Biblioteca", sub: "Livros e artigos" },
  { tab: "Mentorias", icon: "people-outline", title: "Mentores", sub: "Sessões 1:1" },
] as const;

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
  const enrolledCourses = data?.enrolledCourses ?? [];
  const continueCourse: DashboardEnrolledCourse | null =
    enrolledCourses.find((c) => c.progressPct > 0 && c.progressPct < 100) ??
    enrolledCourses[0] ??
    null;
  // Os outros cursos inscritos (sem repetir o card destaque).
  const myOtherCourses = continueCourse
    ? enrolledCourses.filter((c) => c.id !== continueCourse.id)
    : enrolledCourses;
  const bookings: Booking[] = data?.upcomingBookings ?? [];
  const recommended: CourseItem[] = data?.recommendedCourses ?? [];
  const unreadNotifications = user?.unreadNotifications ?? 0;

  return (
    <Screen>
      {/* Header fixo: saudação | busca, notificações, tema e conta */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingBig} numberOfLines={1}>
            Olá{firstName ? `, ${firstName}` : ""}
          </Text>
          <Text style={styles.greetingSub}>Bem-vinda de volta 👋</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Busca")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Buscar cursos, livros e mentores"
          >
            <Ionicons name="search-outline" size={20} color={theme.colors.text} />
          </TouchableOpacity>
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

          {/* Continuar estudando — card destaque com gradiente */}
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
                  <Text style={styles.continueKicker}>CONTINUAR</Text>
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

          {/* Meus cursos — o resto dos cursos inscritos, em carrossel compacto */}
          {myOtherCourses.length > 0 ? (
            <>
              <SectionTitle
                title="Meus cursos"
                actionLabel="Ver todos"
                onAction={() => setTab("Cursos")}
              />
              <FlatList
                horizontal
                nestedScrollEnabled
                data={myOtherCourses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.myCourseCard}
                    onPress={() => navigation.navigate("Curso", { id: item.id })}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir o curso ${item.title}`}
                  >
                    <RemoteImage
                      uri={item.coverUrl}
                      style={styles.myCourseCover}
                      recyclingKey={item.id}
                      errorIcon="play-circle-outline"
                      iconSize={20}
                    />
                    <Text style={styles.myCourseTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.myCourseProgress}>
                      <ProgressBar pct={item.progressPct} height={4} />
                      <Text style={styles.myCoursePct}>{item.progressPct}%</Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              />
            </>
          ) : null}

          {/* Explorar — a home É a porta de entrada para o catálogo */}
          <SectionTitle title="Explorar" />
          <View style={styles.explorarRow}>
            {EXPLORAR.map((tile) => (
              <TouchableOpacity
                key={tile.tab}
                style={styles.explorarTile}
                onPress={() => setTab(tile.tab)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Explorar ${tile.title}`}
              >
                <View style={styles.explorarIcon}>
                  <Ionicons name={tile.icon} size={20} color={theme.colors.accent} />
                </View>
                <Text style={styles.explorarTitle} numberOfLines={1}>
                  {tile.title}
                </Text>
                <Text style={styles.explorarSub} numberOfLines={1}>
                  {tile.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Em alta agora — carrossel horizontal de recomendados */}
          {recommended.length > 0 ? (
            <>
              <SectionTitle
                title="Em alta agora"
                actionLabel="Ver tudo"
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
            title="Mentorias"
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
      paddingBottom: theme.spacing.sm,
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
    greetingBig: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.6,
    },
    greetingSub: { color: theme.colors.textMuted, fontSize: 12.5, fontWeight: "500" },
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

    /* Carrosséis horizontais */
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
    continueInfo: { flex: 1, gap: 5 },
    continueKicker: {
      color: "rgba(255, 255, 255, 0.75)",
      fontSize: 9.5,
      fontWeight: "800",
      letterSpacing: 1.2,
    },
    continueTitle: { color: theme.colors.white, fontSize: 15, fontWeight: "700", lineHeight: 20 },
    continueMeta: { color: "rgba(255, 255, 255, 0.85)", fontSize: 12, fontWeight: "600" },
    continueCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 2,
    },
    continueCtaText: { color: theme.colors.white, fontSize: 12, fontWeight: "700" },

    /* Meus cursos (carrossel compacto) */
    myCourseCard: {
      width: 148,
      gap: 6,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
    },
    myCourseCover: {
      width: "100%",
      height: 62,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceAlt,
    },
    myCourseTitle: { color: theme.colors.text, fontSize: 12.5, fontWeight: "700", lineHeight: 16 },
    myCourseProgress: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    myCoursePct: { color: theme.colors.textFaint, fontSize: 10.5, fontWeight: "700" },

    /* Explorar — 3 atalhos grandes */
    explorarRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    explorarTile: {
      flex: 1,
      gap: 4,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
    },
    explorarIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    explorarTitle: { color: theme.colors.text, fontSize: 13.5, fontWeight: "800" },
    explorarSub: { color: theme.colors.textFaint, fontSize: 10.5, fontWeight: "600" },

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
    /* folga para o conteúdo nunca nascer sob o dock flutuante */
    bottomSpacer: { height: DOCK_CLEARANCE },
  });
