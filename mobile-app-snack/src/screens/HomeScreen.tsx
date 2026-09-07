/**
 * Aba 1 "Início" — painel diário da Órbita, minimalista estilo iOS.
 *
 * Header: MARCA (OrbitMark + wordmark "Órbita") e à direita busca global e
 * notificações (com badge) — o acesso à conta vive na ABA Perfil, não aqui.
 *
 * Seções (rótulo pequeno uppercase + "Ver tudo" quando faz sentido):
 *   1. "Continue estudando" — cursos inscritos como cards horizontais com
 *      barra de progresso azul (em andamento primeiro);
 *   2. chips discretos de atalho (Cursos · Biblioteca · Mentorias · Ranking);
 *   3. "Ao vivo & eventos" — reuniões multi-participante (AO VIVO em azul);
 *   4. "Mentores para você" — próximas sessões 1:1 (máx. 3);
 *   5. "Novidades da biblioteca" — carrossel de livros/artigos;
 *   6. "Para ouvir" — áudio-aulas (prévias demo) com player global;
 *   7. "Missões de hoje" — hábito diário com coleta de XP (compacta);
 *   8. "Em alta agora" — cursos recomendados.
 *
 * "Ver tudo" abre a Explorar JÁ no segmento certo (setSegment + setTab do
 * useTabs). Dados: getHome() (bootstrap; cai para getDashboard() em servidor
 * antigo), listEvents() e getGamificationDaily() — falhas silenciosas escondem
 * a seção. Só o corpo rola, com folga (DOCK_CLEARANCE) para a tab bar nativa.
 */
import React, { useCallback, useEffect, useState } from "react";
import type { ComponentProps } from "react";
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
import {
  claimMission,
  errMessage,
  getDashboard,
  getGamificationDaily,
  getHome,
  isMissingEndpoint,
  type Booking,
  type CourseItem,
  type DailyMission,
  type DashboardEnrolledCourse,
  type DashboardResponse,
  type GamificationDaily,
  listEvents,
  type EventItem,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { DOCK_CLEARANCE, useTabs, type SegmentName } from "../lib/tabs";
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
import { StatusPill } from "../components/StatusPill";

import { clearPendingCheckout, readPendingCheckout } from "../lib/pendingCheckout";

/** Nome de ícone Ionicons tipado (o `name` do componente aceita só literais). */
type IoniconName = NonNullable<ComponentProps<typeof Ionicons>["name"]>;

/** Chips discretos de atalho — substituem os antigos tiles grandes de "Explorar". */
interface QuickChip {
  icon: IoniconName;
  label: string;
  segment?: SegmentName;
  screen?: string;
}
const QUICK_CHIPS: QuickChip[] = [
  { segment: "Cursos", icon: "play-circle-outline", label: "Cursos" },
  { segment: "Livros", icon: "book-outline", label: "Biblioteca" },
  { segment: "Mentorias", icon: "people-outline", label: "Mentorias" },
  { screen: "Ranking", icon: "trophy-outline", label: "Ranking" },
];

/** Ícone por missão diária (o servidor manda só o id). */
const MISSION_ICONS: Record<string, IoniconName> = {
  aula: "play-circle-outline",
  quiz: "bulb-outline",
  evento: "videocam-outline",
  mensagem: "chatbubble-outline",
  anotacao: "create-outline",
};

/** Rótulo de seção pequeno estilo iOS: uppercase, 12/700, textFaint. */
function SectionLabel({
  label,
  actionLabel,
  onAction,
}: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = makeStyles();
  const showAction = Boolean(actionLabel && onAction);
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel} numberOfLines={1}>
        {label}
      </Text>
      {showAction ? (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

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
  const { setTab, setSegment } = useTabs();
  const { user, updateUser } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [missions, setMissions] = useState<GamificationDaily | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Data curta do header removida — o header agora é MARCA (OrbitMark + Órbita).

  // Missões diárias (gamificação) — falha silenciosa: servidor antigo esconde a seção.
  const loadMissions = useCallback(async () => {
    try {
      setMissions(await getGamificationDaily());
    } catch {
      setMissions(null);
    }
  }, []);

  const load = useCallback(
    async (loadMode: "initial" | "refresh") => {
      if (loadMode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      // Eventos (diferencial: reunião multi-participante) — falha silenciosa.
      try {
        const res = await listEvents("upcoming");
        setEvents(res.items);
      } catch {
        setEvents([]);
      }
      void loadMissions();
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
    [updateUser, loadMissions]
  );

  /** Coleta o XP de uma missão concluída (servidor revalida e devolve o total). */
  const handleClaim = useCallback(
    async (mission: DailyMission) => {
      setClaimingId(mission.id);
      try {
        const res = await claimMission(mission.id);
        if (user) updateUser({ ...user, xp: res.xpTotal });
        setMissions((prev) =>
          prev
            ? {
                ...prev,
                streak: res.streak,
                missions: prev.missions.map((m) =>
                  m.id === mission.id ? { ...m, claimed: true, claimable: false } : m
                ),
              }
            : prev
        );
      } catch {
        // Missão já coletada ou progresso desatualizado → recarrega a verdade.
        await loadMissions();
      } finally {
        setClaimingId(null);
      }
    },
    [user, updateUser, loadMissions]
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] ?? "";
  const enrolledCourses: DashboardEnrolledCourse[] = data?.enrolledCourses ?? [];
  // Em andamento primeiro (0 < progresso < 100), depois o resto na ordem original.
  const isStudying = (c: DashboardEnrolledCourse) => c.progressPct > 0 && c.progressPct < 100;
  const orderedCourses: DashboardEnrolledCourse[] = [
    ...enrolledCourses.filter(isStudying),
    ...enrolledCourses.filter((c) => !isStudying(c)),
  ];
  const bookings: Booking[] = data?.upcomingBookings ?? [];
  const newBooks = data?.newBooks ?? [];
  const recommended: CourseItem[] = data?.recommendedCourses ?? [];
  const unreadNotifications = user?.unreadNotifications ?? 0;

  /** Atalho de Explorar já no segmento certo. */
  const goExplorar = useCallback(
    (segment: SegmentName) => {
      setSegment(segment);
      setTab("Explorar");
    },
    [setSegment, setTab]
  );

  return (
    <Screen>
      {/* Header: saudação + data | busca e notificações (Perfil é ABA, sem avatar aqui) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting} numberOfLines={1}>
            Olá{firstName ? `, ${firstName}` : ""}
          </Text>
          <Text style={styles.greetingSub}>{todayLabel}</Text>
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

          {/* 1. Continue estudando — cursos inscritos com barra de progresso azul */}
          {orderedCourses.length > 0 ? (
            <>
              <SectionLabel label="Continue estudando" />
              <FlatList
                horizontal
                nestedScrollEnabled
                data={orderedCourses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.courseCard}
                    onPress={() => navigation.navigate("Curso", { id: item.id })}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir o curso ${item.title}`}
                  >
                    <RemoteImage
                      uri={item.coverUrl}
                      style={styles.courseCover}
                      recyclingKey={item.id}
                      errorIcon="play-circle-outline"
                      iconSize={20}
                    />
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.courseProgress}>
                      <View style={styles.progressTrack}>
                        <ProgressBar pct={item.progressPct} height={5} />
                      </View>
                      <Text style={styles.coursePct}>{item.progressPct}%</Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              />
            </>
          ) : (
            <>
              <SectionLabel label="Continue estudando" />
              <EmptyState
                icon="school-outline"
                title="Nenhum curso em andamento"
                message="Explore o catálogo e inscreva-se no seu primeiro curso."
                actionLabel="Explorar cursos"
                onAction={() => goExplorar("Cursos")}
              />
            </>
          )}

          {/* 2. Chips discretos de atalho (no lugar dos antigos tiles grandes) */}
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {QUICK_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip.label}
                style={styles.chip}
                onPress={() => {
                  if (chip.screen) navigation.navigate(chip.screen);
                  else if (chip.segment) goExplorar(chip.segment);
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 5, bottom: 5 }}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
              >
                <Ionicons name={chip.icon} size={15} color={theme.colors.accent} />
                <Text style={styles.chipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 3. Ao vivo & eventos — AO VIVO em destaque azul */}
          {events.length > 0 ? (
            <>
              <SectionLabel label="Ao vivo & eventos" />
              <FlatList
                horizontal
                nestedScrollEnabled
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.eventCard}
                    onPress={() => navigation.navigate("Evento", { id: item.id })}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Evento ${item.title}`}
                  >
                    <View style={styles.eventCoverWrap}>
                      <RemoteImage
                        uri={item.coverUrl}
                        style={styles.eventCover}
                        recyclingKey={`home-ev-${item.id}`}
                        fallbackIcon="people-circle-outline"
                        iconSize={30}
                      />
                      {item.live ? (
                        <View style={styles.eventLivePill}>
                          <View style={styles.eventLiveDot} />
                          <Text style={styles.eventLiveText}>AO VIVO</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.eventBody}>
                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.eventMeta} numberOfLines={1}>
                        {item.live
                          ? `agora · ${item.joinedCount}/${item.capacity} na sala`
                          : `${formatNaiveDateTime(item.startsAt)} · ${item.joinedCount}/${item.capacity}`}
                      </Text>
                      <Text style={styles.eventHost} numberOfLines={1}>
                        por {item.host.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              />
            </>
          ) : null}

          {/* 4. Mentores para você — próximas sessões 1:1 */}
          <SectionLabel
            label="Mentores para você"
            actionLabel={bookings.length > 0 ? "Ver tudo" : undefined}
            onAction={() => goExplorar("Mentorias")}
          />
          {bookings.length === 0 ? (
            <EmptyState
              icon="videocam-outline"
              title="Nenhuma mentoria agendada"
              message="Encontre um mentor e agende sua próxima sessão 1:1."
              actionLabel="Ver mentores"
              onAction={() => goExplorar("Mentorias")}
            />
          ) : (
            bookings.slice(0, 3).map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate("Mentor", { id: booking.mentor.id })}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Abrir o mentor ${booking.mentor.name}`}
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

          {/* 5. Novidades da biblioteca — carrossel de livros/artigos */}
          {newBooks.length > 0 ? (
            <>
              <SectionLabel
                label="Novidades da biblioteca"
                actionLabel="Ver tudo"
                onAction={() => goExplorar("Livros")}
              />
              <FlatList
                horizontal
                nestedScrollEnabled
                data={newBooks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bookCard}
                    onPress={() => navigation.navigate("Livro", { id: item.id })}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${item.kind === "BOOK" ? "o livro" : "o artigo"} ${item.title}`}
                  >
                    <RemoteImage
                      uri={item.coverUrl}
                      style={styles.bookCover}
                      recyclingKey={`home-book-${item.id}`}
                      fallbackIcon={item.kind === "BOOK" ? "book-outline" : "document-text-outline"}
                      iconSize={22}
                    />
                    <Text style={styles.bookKind}>{item.kind === "BOOK" ? "Livro" : "Artigo"}</Text>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
              />
            </>
          ) : null}

          {/* 6. Missões de hoje — hábito diário (coleta de XP), compacta */}
          {missions && missions.missions.length > 0 ? (
            <>
              <SectionLabel label="Missões de hoje" />
              <View style={styles.missionsCard}>
                {missions.missions.map((mission) => {
                  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                  return (
                    <View key={mission.id} style={styles.missionRow}>
                      <View
                        style={[
                          styles.missionIcon,
                          mission.claimed ? styles.missionIconDone : null,
                        ]}
                      >
                        <Ionicons
                          name={mission.claimed ? "checkmark" : (MISSION_ICONS[mission.id] ?? "flash-outline")}
                          size={18}
                          color={mission.claimed ? theme.colors.onAccent : theme.colors.accent}
                        />
                      </View>
                      <View style={styles.missionInfo}>
                        <Text style={styles.missionTitle} numberOfLines={1}>
                          {mission.title}
                        </Text>
                        <Text style={styles.missionDesc} numberOfLines={2}>
                          {mission.description}
                        </Text>
                        {mission.progress < mission.target ? (
                          <View style={styles.missionProgress}>
                            <View style={styles.progressTrack}>
                              <ProgressBar pct={pct} height={4} />
                            </View>
                            <Text style={styles.missionProgressText}>
                              {mission.progress}/{mission.target}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {mission.claimed ? (
                        <Text style={styles.missionClaimed}>Coletada</Text>
                      ) : mission.claimable ? (
                        <TouchableOpacity
                          style={styles.missionClaimBtn}
                          onPress={() => void handleClaim(mission)}
                          disabled={claimingId === mission.id}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={`Coletar +${mission.xp} XP da missão ${mission.title}`}
                        >
                          <Text style={styles.missionClaimBtnText}>
                            {claimingId === mission.id ? "..." : `+${mission.xp}`}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.missionXpPill}>
                          <Text style={styles.missionXpPillText}>+{mission.xp}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* 7. Em alta agora — cursos recomendados */}
          {recommended.length > 0 ? (
            <>
              <SectionLabel
                label="Em alta agora"
                actionLabel="Ver tudo"
                onAction={() => goExplorar("Cursos")}
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
      paddingBottom: DOCK_CLEARANCE,
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
    greeting: {
      color: theme.colors.text,
      fontSize: 23,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    greetingSub: { color: theme.colors.textFaint, fontSize: 13, fontWeight: "500" },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
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

    /* Rótulos de seção (uppercase pequeno) */
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    sectionLabel: {
      color: theme.colors.textFaint,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      flex: 1,
    },
    sectionAction: { color: theme.colors.accent, fontSize: 13, fontWeight: "600" },

    /* Carrosséis horizontais */
    carousel: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
      paddingBottom: 4,
    },
    recoItem: { width: 218 },

    /* Continue estudando (cards horizontais com progresso azul) */
    courseCard: {
      width: 168,
      gap: 6,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
    },
    courseCover: {
      width: "100%",
      height: 78,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceAlt,
    },
    courseTitle: { color: theme.colors.text, fontSize: 12.5, fontWeight: "700", lineHeight: 16 },
    courseProgress: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    /* A barra encolhe (flex 1) e o % fica inteiro na borda — a barra nunca
       empurra o rótulo para fora do card. */
    progressTrack: { flex: 1, minWidth: 0 },
    coursePct: { color: theme.colors.accent, fontSize: 10.5, fontWeight: "700" },

    /* Chips de atalho discretos */
    chipScroll: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignItems: "center",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 36,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    chipText: { color: theme.colors.text, fontSize: 12.5, fontWeight: "700" },

    /* Missões de hoje */
    missionsCard: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
    },
    missionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    missionIcon: {
      width: 38,
      height: 38,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    missionIconDone: {
      backgroundColor: theme.colors.accent,
    },
    missionInfo: { flex: 1, gap: 2 },
    missionTitle: { color: theme.colors.text, fontSize: 13.5, fontWeight: "800" },
    missionDesc: { color: theme.colors.textMuted, fontSize: 11.5, fontWeight: "500", lineHeight: 15 },
    missionProgress: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    missionProgressText: { color: theme.colors.textFaint, fontSize: 10, fontWeight: "700" },
    missionClaimBtn: {
      paddingHorizontal: 12,
      height: 34,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    missionClaimBtnText: { color: theme.colors.onAccent, fontSize: 12.5, fontWeight: "800" },
    missionClaimed: { color: theme.colors.accent, fontSize: 11, fontWeight: "800" },
    missionXpPill: {
      paddingHorizontal: 10,
      height: 26,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.warningSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.warningBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    missionXpPillText: { color: theme.colors.warning, fontSize: 11, fontWeight: "800" },

    /* Mentores para você */
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

    /* Novidades da biblioteca */
    bookCard: {
      width: 136,
      gap: 4,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
    },
    bookCover: {
      width: "100%",
      height: 92,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceAlt,
      marginBottom: 2,
    },
    bookKind: {
      color: theme.colors.accent,
      fontSize: 9.5,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    bookTitle: { color: theme.colors.text, fontSize: 12.5, fontWeight: "700", lineHeight: 16 },

    /* Eventos */
    eventCard: {
      width: 226,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      overflow: "hidden",
    },
    eventCoverWrap: { position: "relative" },
    eventCover: { width: "100%", height: 92, backgroundColor: theme.colors.surfaceAlt },
    eventLivePill: {
      position: "absolute",
      top: 8,
      left: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
    },
    eventLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.onAccent },
    eventLiveText: { color: theme.colors.onAccent, fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
    eventBody: { padding: 11, gap: 3 },
    eventTitle: { color: theme.colors.text, fontSize: 13.5, fontWeight: "800", letterSpacing: -0.2 },
    eventMeta: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "600" },
    eventHost: { color: theme.colors.textFaint, fontSize: 10.5, fontWeight: "500" },
  });
