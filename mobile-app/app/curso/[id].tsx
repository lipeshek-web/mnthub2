/**
 * Detalhe do curso (tela mais rica do app):
 * - Não inscrito: capa, mentor, rating, preço e botão "Inscrever-se"
 *   (402 = curso pago → Alert com preço e opção de comprar no site).
 * - Inscrito: progresso, temas com aulas (vídeo/texto/ao vivo), toggle de
 *   conclusão com +XP e parabéns ao concluir 100%.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ApiError,
  SITE_URL,
  enrollCourse,
  errMessage,
  getCourse,
  toggleLessonCompletion,
  type CourseDetailResponse,
  type Lesson,
  type LessonKind,
} from "../../src/lib/api";
import {
  formatDuration,
  formatNaiveLong,
  formatNumber,
  formatPrice,
  levelLabel,
} from "../../src/lib/format";
import { theme } from "../../src/theme";
import { Avatar } from "../../src/components/Avatar";
import { Chip } from "../../src/components/Chip";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorBox } from "../../src/components/ErrorBox";
import { LoadingList } from "../../src/components/LoadingList";
import { ProgressBar } from "../../src/components/ProgressBar";
import { RichText } from "../../src/components/RichText";
import { Screen } from "../../src/components/Screen";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Stars } from "../../src/components/Stars";

const KIND_META: Record<LessonKind, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  RECORDED: { label: "Vídeo", icon: "play-circle-outline" },
  TEXT: { label: "Leitura", icon: "document-text-outline" },
  LIVE: { label: "Ao vivo", icon: "videocam-outline" },
};

export default function CourseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [detail, setDetail] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<string | null>(null);
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!courseId) return;
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await getCourse(courseId);
        setDetail(res);
      } catch (err) {
        setError(errMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [courseId]
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  // Limpa o timer do toast de XP ao desmontar.
  useEffect(() => {
    return () => {
      if (xpTimerRef.current) clearTimeout(xpTimerRef.current);
    };
  }, []);

  function showXpToast(text: string) {
    setXpToast(text);
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current);
    xpTimerRef.current = setTimeout(() => setXpToast(null), 2400);
  }

  async function openInBrowser(url: string) {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Não foi possível abrir", "Verifique sua conexão e tente novamente.");
    }
  }

  async function openExternal(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Não foi possível abrir o link", url);
    }
  }

  async function handleEnroll() {
    if (!detail || enrolling) return;
    setEnrolling(true);
    try {
      await enrollCourse(detail.course.id);
      Alert.alert("Inscrição confirmada!", "Agora você tem acesso a todas as aulas deste curso.");
      await load("refresh");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        // Curso pago: a compra é feita pelo site (payload traz { error, price }).
        const price =
          typeof err.payload?.price === "number" ? err.payload.price : detail.course.price;
        Alert.alert(
          "Curso pago",
          `${err.message}${price > 0 ? `\n\nValor do curso: ${formatPrice(price)}` : ""}`,
          [
            { text: "Depois", style: "cancel" },
            { text: "Abrir site para comprar", onPress: () => void openExternal(SITE_URL) },
          ]
        );
      } else {
        Alert.alert("Não foi possível se inscrever", errMessage(err));
      }
    } finally {
      setEnrolling(false);
    }
  }

  async function handleToggleLesson(lesson: Lesson) {
    if (!detail || togglingIds.includes(lesson.id)) return;
    setTogglingIds((prev) => [...prev, lesson.id]);
    try {
      const res = await toggleLessonCompletion(detail.course.id, lesson.id);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              enrollment: {
                completedLessonIds: res.completedLessonIds,
                completedAt: prev.enrollment?.completedAt ?? null,
              },
            }
          : prev
      );
      if (res.courseCompleted) {
        Alert.alert(
          "Curso concluído! 🎉",
          `Parabéns! Você finalizou "${detail.course.title}".` +
            (res.xpAwarded > 0 ? ` +${res.xpAwarded} XP de recompensa.` : "")
        );
      } else if (res.xpAwarded > 0) {
        showXpToast(`+${res.xpAwarded} XP ganho`);
      }
    } catch (err) {
      Alert.alert("Não foi possível atualizar", errMessage(err));
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== lesson.id));
    }
  }

  /* ----------------------------- Derivados ----------------------------- */

  const course = detail?.course ?? null;
  const enrollment = detail?.enrollment ?? null;
  const enrolled = enrollment !== null;
  const completedIds = enrollment?.completedLessonIds ?? [];
  const allLessons = detail
    ? [...detail.lessons, ...detail.themes.flatMap((courseTheme) => courseTheme.lessons)]
    : [];
  const totalLessons = detail
    ? detail.course.lessonCount > 0
      ? detail.course.lessonCount
      : allLessons.length
    : 0;
  const pct = totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0;

  const sections: Array<{ key: string; title: string; description: string | null; lessons: Lesson[] }> = [];
  if (detail) {
    if (detail.lessons.length > 0) {
      sections.push({
        key: "no-theme",
        title: detail.themes.length > 0 ? "Aulas iniciais" : "Aulas",
        description: null,
        lessons: detail.lessons,
      });
    }
    [...detail.themes]
      .sort((a, b) => a.order - b.order)
      .forEach((courseTheme) => {
        if (courseTheme.lessons.length > 0) {
          sections.push({
            key: courseTheme.id,
            title: courseTheme.title,
            description: courseTheme.description,
            lessons: courseTheme.lessons,
          });
        }
      });
  }

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ title: detail?.course.title ?? "Curso" }} />
      {loading ? (
        <LoadingList label="Carregando curso..." />
      ) : error && !detail ? (
        <ErrorBox message={error} onRetry={() => void load("initial")} />
      ) : detail && course ? (
        <View style={styles.flex}>
          <ScreenHeader title="Curso" onBack={() => router.back()} />
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
            {/* Capa */}
            {course.coverUrl ? (
              <Image
                source={{ uri: course.coverUrl }}
                style={styles.cover}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.coverFallback}>
                <Ionicons name="play-circle-outline" size={38} color={theme.colors.textFaint} />
              </View>
            )}

            <Text style={styles.title}>{course.title}</Text>

            {/* Mentor + rating */}
            <TouchableOpacity
              style={styles.mentorRow}
              onPress={() => router.push(`/mentor/${course.mentor.id}`)}
              activeOpacity={0.85}
            >
              <Avatar uri={course.mentor.avatarUrl} name={course.mentor.name} size={38} />
              <View style={styles.mentorInfo}>
                <Text style={styles.mentorName} numberOfLines={1}>
                  Por {course.mentor.name}
                </Text>
                <View style={styles.ratingRow}>
                  <Stars value={course.rating} size={12} />
                  <Text style={styles.ratingText}>
                    {(course.rating ?? 0).toFixed(1)} ({course.reviewCount})
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>

            {/* Metadados */}
            <View style={styles.chipsRow}>
              <Chip label={course.category} tone="accent" />
              {levelLabel(course.level) ? <Chip label={levelLabel(course.level)} tone="outline" /> : null}
              {course.liveCount > 0 ? <Chip label={`${course.liveCount} ao vivo`} /> : null}
            </View>
            <Text style={styles.metaLine}>
              {course.lessonCount} aulas
              {course.totalDurationMin > 0 ? ` · ${formatDuration(course.totalDurationMin)}` : ""}
              {course.studentCount > 0 ? ` · ${formatNumber(course.studentCount)} alunos` : ""}
            </Text>

            {/* Preço */}
            <View style={styles.priceRow}>
              <Text style={[styles.price, course.price > 0 ? null : styles.priceFree]}>
                {formatPrice(course.price)}
              </Text>
              {enrolled ? <Chip label="Inscrito" tone="accent" /> : null}
            </View>

            {course.description ? <Text style={styles.description}>{course.description}</Text> : null}

            {/* Progresso (inscrito) ou aviso de bloqueio */}
            {enrolled ? (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Seu progresso</Text>
                  <Text style={styles.progressPct}>{pct}%</Text>
                </View>
                <ProgressBar pct={pct} />
                <Text style={styles.progressMeta}>
                  {completedIds.length} de {totalLessons} aulas concluídas
                </Text>
                {pct >= 100 ? (
                  <Text style={styles.progressDone}>🎉 Curso concluído — parabéns!</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.lockedBanner}>
                <Ionicons name="lock-closed" size={14} color={theme.colors.warning} />
                <Text style={styles.lockedBannerText}>
                  Inscreva-se para desbloquear todas as aulas deste curso.
                </Text>
              </View>
            )}

            {/* Aulas por tema (aulas sem tema ficam no topo) */}
            {sections.length === 0 && enrolled ? (
              <EmptyState
                icon="library-outline"
                title="Nenhuma aula publicada"
                message="As aulas deste curso aparecerão aqui."
              />
            ) : (
              sections.map((section) => (
                <View key={section.key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.description ? (
                    <Text style={styles.sectionDescription}>{section.description}</Text>
                  ) : null}
                  <View style={styles.lessonsList}>
                    {section.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        completed={completedIds.includes(lesson.id)}
                        locked={lesson.locked}
                        toggling={togglingIds.includes(lesson.id)}
                        expanded={expandedLessonId === lesson.id}
                        onToggleComplete={() => void handleToggleLesson(lesson)}
                        onToggleExpand={() =>
                          setExpandedLessonId((prev) => (prev === lesson.id ? null : lesson.id))
                        }
                        onOpen={(url) => void openInBrowser(url)}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* CTA de inscrição */}
          {!enrolled ? (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.cta, enrolling && styles.ctaDisabled]}
                onPress={() => void handleEnroll()}
                disabled={enrolling}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Inscrever-se no curso"
              >
                {enrolling ? (
                  <ActivityIndicator size="small" color={theme.colors.bg} />
                ) : (
                  <Text style={styles.ctaText}>
                    {course.price > 0
                      ? `Inscrever-se · ${formatPrice(course.price)}`
                      : "Inscrever-se gratuitamente"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Toast de XP */}
          {xpToast ? (
            <View pointerEvents="none" style={styles.xpToast}>
              <Ionicons name="flash" size={13} color={theme.colors.bg} />
              <Text style={styles.xpToastText}>{xpToast}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

/* --------------------------- Subcomponentes ---------------------------- */

function LessonRow({
  lesson,
  completed,
  locked,
  toggling,
  expanded,
  onToggleComplete,
  onToggleExpand,
  onOpen,
}: {
  lesson: Lesson;
  completed: boolean;
  locked: boolean;
  toggling: boolean;
  expanded: boolean;
  onToggleComplete: () => void;
  onToggleExpand: () => void;
  onOpen: (url: string) => void;
}) {
  const kindMeta = KIND_META[lesson.kind];
  const videoUrl = !locked && lesson.kind === "RECORDED" ? lesson.videoUrl : null;
  const meetingUrl = !locked && lesson.kind === "LIVE" ? lesson.meetingUrl : null;
  const textContent = !locked && lesson.kind === "TEXT" ? lesson.content : null;
  const liveWhen =
    !locked && lesson.kind === "LIVE" && lesson.startsAt ? formatNaiveLong(lesson.startsAt) : null;
  const attachments = locked ? [] : lesson.attachments ?? [];

  return (
    <View style={[styles.lessonCard, completed ? styles.lessonCardDone : null]}>
      <View style={styles.lessonTop}>
        {locked ? (
          <View style={styles.lockBox}>
            <Ionicons name="lock-closed" size={14} color={theme.colors.textFaint} />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.checkbox, completed ? styles.checkboxDone : null]}
            onPress={onToggleComplete}
            disabled={toggling}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completed }}
            accessibilityLabel={
              completed
                ? `Desmarcar aula ${lesson.title} como concluída`
                : `Marcar aula ${lesson.title} como concluída`
            }
          >
            {toggling ? (
              <ActivityIndicator size="small" color={completed ? theme.colors.bg : theme.colors.accent} />
            ) : completed ? (
              <Ionicons name="checkmark" size={16} color={theme.colors.bg} />
            ) : null}
          </TouchableOpacity>
        )}
        <View style={styles.lessonInfo}>
          <Text
            style={[
              styles.lessonTitle,
              completed ? styles.lessonTitleDone : null,
              locked ? styles.lessonTitleLocked : null,
            ]}
            numberOfLines={2}
          >
            {lesson.title}
          </Text>
          <View style={styles.lessonMetaRow}>
            <Ionicons name={kindMeta.icon} size={12} color={theme.colors.textFaint} />
            <Text style={styles.lessonMeta}>{kindMeta.label}</Text>
            {lesson.durationMin > 0 ? (
              <Text style={styles.lessonMeta}>· {formatDuration(lesson.durationMin)}</Text>
            ) : null}
          </View>
          {liveWhen ? <Text style={styles.lessonLiveWhen}>Encontro: {liveWhen}</Text> : null}
          {lesson.description && !locked ? (
            <Text style={styles.lessonDescription} numberOfLines={2}>
              {lesson.description}
            </Text>
          ) : null}
          {locked ? (
            <Text style={styles.lessonLockedHint}>Conteúdo liberado após a inscrição.</Text>
          ) : null}
        </View>
      </View>

      {!locked ? (
        <View style={styles.lessonActions}>
          {videoUrl ? (
            <ActionButton icon="play" label="Assistir aula" onPress={() => onOpen(videoUrl)} />
          ) : null}
          {meetingUrl ? (
            <ActionButton
              icon="videocam"
              label="Abrir sala de transmissão"
              onPress={() => onOpen(meetingUrl)}
            />
          ) : null}
          {textContent ? (
            <>
              <ActionButton
                icon={expanded ? "eye-off-outline" : "eye-outline"}
                label={expanded ? "Ocultar conteúdo" : "Ver conteúdo da aula"}
                onPress={onToggleExpand}
              />
              {expanded ? (
                <View style={styles.lessonContent}>
                  <RichText text={textContent} />
                </View>
              ) : null}
            </>
          ) : null}
          {attachments.length > 0 ? (
            <View style={styles.attachments}>
              {attachments.map((attachment) => (
                <TouchableOpacity
                  key={attachment.url}
                  style={styles.attachmentRow}
                  onPress={() => onOpen(attachment.url)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir anexo ${attachment.name}`}
                >
                  <Ionicons name="attach" size={13} color={theme.colors.accent} />
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  <Ionicons name="open-outline" size={13} color={theme.colors.textFaint} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={14} color={theme.colors.accent} />
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ------------------------------- Estilos ------------------------------- */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  cover: {
    width: "100%",
    height: 170,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceAlt,
  },
  coverFallback: {
    width: "100%",
    height: 170,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 27,
    letterSpacing: -0.3,
    marginTop: theme.spacing.lg,
  },
  mentorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginTop: theme.spacing.md,
  },
  mentorInfo: { flex: 1, gap: 3 },
  mentorName: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  metaLine: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600", marginTop: 8 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  price: { color: theme.colors.text, fontSize: 20, fontWeight: "700" },
  priceFree: { color: theme.colors.accent },
  description: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: theme.spacing.md,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  progressPct: { color: theme.colors.accent, fontSize: 14, fontWeight: "700" },
  progressMeta: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
  progressDone: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.warningSoft,
    borderWidth: 1,
    borderColor: theme.colors.warningBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  lockedBannerText: { flex: 1, color: theme.colors.warning, fontSize: 12, lineHeight: 17 },
  section: { marginTop: theme.spacing.xl },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "700" },
  sectionDescription: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  lessonsList: { gap: theme.spacing.md, marginTop: theme.spacing.md },
  lessonCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  lessonCardDone: { borderColor: theme.colors.accentBorder },
  lessonTop: { flexDirection: "row", gap: theme.spacing.md },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  lockBox: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  lessonInfo: { flex: 1, gap: 4 },
  lessonTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  lessonTitleDone: { textDecorationLine: "line-through", color: theme.colors.textMuted },
  lessonTitleLocked: { color: theme.colors.textMuted },
  lessonMetaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  lessonMeta: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600" },
  lessonLiveWhen: { color: theme.colors.info, fontSize: 12, fontWeight: "600" },
  lessonDescription: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 },
  lessonLockedHint: { color: theme.colors.textFaint, fontSize: 12 },
  lessonActions: { gap: theme.spacing.sm },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },
  actionButtonText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
  lessonContent: {
    backgroundColor: theme.colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  attachments: { gap: 6 },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  attachmentName: { flex: 1, color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.bg,
  },
  cta: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    minHeight: 50,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaText: { color: theme.colors.bg, fontSize: 15, fontWeight: "700" },
  xpToast: {
    position: "absolute",
    top: theme.spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  xpToastText: { color: theme.colors.bg, fontSize: 13, fontWeight: "700" },
  bottomSpacer: { height: theme.spacing.lg },
});
