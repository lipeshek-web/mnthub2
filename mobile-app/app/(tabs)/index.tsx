/**
 * Aba Início: painel do aluno — saudação, XP/ofensiva, meta semanal,
 * "Continuar estudando", próximas mentorias, novos livros e recomendados.
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  errMessage,
  getDashboard,
  type Booking,
  type DashboardEnrolledCourse,
  type DashboardResponse,
} from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth";
import { formatNaiveDateTime } from "../../src/lib/format";
import { theme } from "../../src/theme";
import { Avatar } from "../../src/components/Avatar";
import { BookCard } from "../../src/components/BookCard";
import { CourseCard } from "../../src/components/CourseCard";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorBox } from "../../src/components/ErrorBox";
import { LoadingList } from "../../src/components/LoadingList";
import { ProgressBar } from "../../src/components/ProgressBar";
import { Screen } from "../../src/components/Screen";
import { SectionTitle } from "../../src/components/SectionTitle";
import { StatusPill } from "../../src/components/StatusPill";
import { StreakFlame } from "../../src/components/StreakFlame";
import { XpBadge } from "../../src/components/XpBadge";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const dashboard = await getDashboard();
      setData(dashboard);
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

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] ?? "";
  const goal = data?.weeklyGoal ?? null;
  const enrolledCourses = data?.enrolledCourses ?? [];
  const continueCourse: DashboardEnrolledCourse | null =
    enrolledCourses.find((c) => c.progressPct > 0 && c.progressPct < 100) ??
    enrolledCourses[0] ??
    null;
  const bookings: Booking[] = data?.upcomingBookings ?? [];
  const books = data?.newBooks ?? [];
  const recommended = data?.recommendedCourses ?? [];

  return (
    <Screen>
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

          {/* Saudação + XP / ofensiva */}
          <Text style={styles.greeting}>Olá{firstName ? `, ${firstName}` : ""} 👋</Text>
          <Text style={styles.subtitle}>Pronto para continuar aprendendo hoje?</Text>
          <View style={styles.pillsRow}>
            <XpBadge xp={data?.user.xp ?? 0} />
            <StreakFlame streak={data?.user.studyStreak ?? 0} />
          </View>

          {/* Meta semanal */}
          {goal && goal.targetLessons > 0 ? (
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Ionicons name="flag" size={14} color={theme.colors.accent} />
                <Text style={styles.goalTitle}>Meta da semana</Text>
                <Text style={styles.goalCount}>
                  {goal.doneLessons} de {goal.targetLessons} aulas
                </Text>
              </View>
              <ProgressBar pct={(goal.doneLessons / goal.targetLessons) * 100} height={6} />
            </View>
          ) : null}

          {/* Continuar estudando */}
          <SectionTitle title="Continuar estudando" />
          {continueCourse ? (
            <TouchableOpacity
              style={styles.continueCard}
              onPress={() => router.push(`/curso/${continueCourse.id}`)}
              activeOpacity={0.85}
            >
              {continueCourse.coverUrl ? (
                <Image
                  source={{ uri: continueCourse.coverUrl }}
                  style={styles.continueCover}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={[styles.continueCover, styles.continueCoverFallback]}>
                  <Ionicons name="play-circle-outline" size={24} color={theme.colors.textFaint} />
                </View>
              )}
              <View style={styles.continueInfo}>
                <Text style={styles.continueTitle} numberOfLines={2}>
                  {continueCourse.title}
                </Text>
                <Text style={styles.continueMeta}>
                  {continueCourse.completedLessons} de {continueCourse.totalLessons} aulas ·{" "}
                  {continueCourse.progressPct}%
                </Text>
                <ProgressBar pct={continueCourse.progressPct} height={6} />
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>
          ) : (
            <EmptyState
              icon="school-outline"
              title="Nenhum curso em andamento"
              message="Explore o catálogo e inscreva-se no seu primeiro curso."
              actionLabel="Explorar cursos"
              onAction={() => router.push("/(tabs)/cursos")}
            />
          )}

          {/* Próximas mentorias */}
          <SectionTitle
            title="Próximas mentorias"
            actionLabel={bookings.length > 0 ? "Ver todas" : undefined}
            onAction={() =>
              router.push({ pathname: "/(tabs)/mentorias", params: { segment: "sessoes" } })
            }
          />
          {bookings.length === 0 ? (
            <EmptyState
              icon="videocam-outline"
              title="Nenhuma mentoria agendada"
              message="Encontre um mentor e agende sua próxima sessão 1:1."
              actionLabel="Ver mentores"
              onAction={() => router.push("/(tabs)/mentorias")}
            />
          ) : (
            bookings.slice(0, 3).map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => router.push(`/mentor/${booking.mentor.id}`)}
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

          {/* Novos livros */}
          {books.length > 0 ? (
            <>
              <SectionTitle
                title="Novos livros"
                actionLabel="Ver todos"
                onAction={() => router.push("/(tabs)/livros")}
              />
              <FlatList
                horizontal
                data={books}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <BookCard
                    item={item}
                    variant="mini"
                    onPress={() => router.push(`/livro/${item.id}`)}
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.booksRow}
              />
            </>
          ) : null}

          {/* Recomendados pra você */}
          {recommended.length > 0 ? (
            <>
              <SectionTitle
                title="Recomendados pra você"
                actionLabel="Ver todos"
                onAction={() => router.push("/(tabs)/cursos")}
              />
              {recommended.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onPress={() => router.push(`/curso/${course.id}`)}
                />
              ))}
            </>
          ) : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  greeting: { color: theme.colors.text, fontSize: 26, fontWeight: "700", letterSpacing: -0.4 },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  goalTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "700", flex: 1 },
  goalCount: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
  },
  continueCover: {
    width: 104,
    height: 66,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  continueCoverFallback: { alignItems: "center", justifyContent: "center" },
  continueInfo: { flex: 1, gap: 6 },
  continueTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  continueMeta: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
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
  booksRow: { paddingHorizontal: 0, gap: theme.spacing.md, paddingRight: theme.spacing.lg },
  bottomSpacer: { height: theme.spacing.lg },
});
