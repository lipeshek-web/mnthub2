/**
 * Detalhe do curso — agora com FOCO NO CONTEÚDO.
 *
 * Inscrito → "sala de aula": abre DIRETO no conteúdo da aula atual (leitura,
 * vídeo ou encontro ao vivo + materiais), com barra de ações FIXA no rodapé
 * (Anterior · Concluir +XP · Próxima). O índice completo do curso (temas e
 * aulas) fica escondido: só aparece quando o aluno toca no botão "Conteúdos".
 *
 * Não inscrito → página de venda compacta (capa, mentor, preço, descrição) com
 * CTA: gratuito inscreve na hora; pago abre o CHECKOUT DENTRO DO APP (PIX,
 * cartão ou boleto) — sem enviar o aluno para o site.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ApiError,
  enrollCourse,
  errMessage,
  getCourse,
  toggleLessonCompletion,
  type CourseDetailResponse,
  type Lesson,
  type LessonKind,
} from "../lib/api";
import {
  formatDuration,
  formatNaiveLong,
  formatNumber,
  formatPrice,
  levelLabel,
} from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { ProgressBar } from "../components/ProgressBar";
import { RemoteImage } from "../components/RemoteImage";
import { RichText } from "../components/RichText";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { Stars } from "../components/Stars";

const KIND_META: Record<LessonKind, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  RECORDED: { label: "Vídeo", icon: "play-circle-outline" },
  TEXT: { label: "Leitura", icon: "document-text-outline" },
  LIVE: { label: "Ao vivo", icon: "videocam-outline" },
};

export default function CourseDetailScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const params = (useRoute<any>().params ?? {}) as { id: string };
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [detail, setDetail] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);
  // Índice do curso (temas + aulas) — SÓ abre pelo botão "Conteúdos".
  const [showIndex, setShowIndex] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<string | null>(null);
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentScrollRef = useRef<ScrollView | null>(null);

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

  async function handleEnroll() {
    if (!detail || enrolling) return;
    const course = detail.course;
    if (course.price > 0) {
      // Pago → checkout COMPLETO dentro do app (PIX/cartão/boleto via Asaas).
      navigation.navigate("Checkout", { id: course.id });
      return;
    }
    setEnrolling(true);
    try {
      await enrollCourse(course.id);
      Alert.alert("Inscrição confirmada!", "Agora você tem acesso a todas as aulas deste curso.");
      await load("refresh");
    } catch (err) {
      Alert.alert("Não foi possível se inscrever", errMessage(err));
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
          "Curso concluído!",
          `Parabéns! Você finalizou "${detail.course.title}".` +
            (res.xpAwarded > 0 ? ` +${res.xpAwarded} XP de recompensa.` : "")
        );
      } else if (res.xpAwarded > 0) {
        showXpToast(`Aula concluída! +${res.xpAwarded} XP`);
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

  /* Aula atual: selecionada > primeira não concluída > primeira do curso. */
  const currentLesson =
    allLessons.find((lesson) => lesson.id === selectedLessonId) ??
    allLessons.find((lesson) => !lesson.locked && !completedIds.includes(lesson.id)) ??
    allLessons[0] ??
    null;
  const currentIndex = currentLesson
    ? allLessons.findIndex((lesson) => lesson.id === currentLesson.id)
    : -1;

  function goToLesson(offset: number) {
    const next = allLessons[currentIndex + offset];
    if (next) setSelectedLessonId(next.id);
  }

  function selectLesson(lesson: Lesson) {
    setSelectedLessonId(lesson.id);
    setShowIndex(false);
  }

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

  // Conteúdo da aula atual (inscrito) — o "foco" da tela.
  const lessonContent =
    currentLesson && !currentLesson.locked && currentLesson.content
      ? currentLesson.content
      : null;
  const videoUrl =
    currentLesson && !currentLesson.locked && currentLesson.kind === "RECORDED"
      ? currentLesson.videoUrl
      : null;
  const meetingUrl =
    currentLesson && !currentLesson.locked && currentLesson.kind === "LIVE"
      ? currentLesson.meetingUrl
      : null;
  const liveWhen =
    currentLesson && !currentLesson.locked && currentLesson.kind === "LIVE" && currentLesson.startsAt
      ? formatNaiveLong(currentLesson.startsAt)
      : null;
  const attachments =
    currentLesson && !currentLesson.locked ? currentLesson.attachments ?? [] : [];
  const currentCompleted = currentLesson ? completedIds.includes(currentLesson.id) : false;

  // Ao trocar de aula, volta ao topo do conteúdo.
  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        contentScrollRef.current?.scrollTo({ y: 0, animated: false });
      } catch {
        /* sem conteúdo */
      }
    });
  }, [currentLesson?.id]);

  /* ------------------------------- Render ------------------------------- */

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      {loading ? (
        <LoadingList label="Carregando curso..." />
      ) : error && !detail ? (
        <ErrorBox message={error} onRetry={() => void load("initial")} />
      ) : detail && course ? (
        <View style={styles.flex}>
          <ScreenHeader title="Curso" onBack={() => navigation.goBack()} />

          {enrolled ? (
            <>
              {/* Barra FIXA do topo: título + progresso + botão de conteúdos */}
              <View style={styles.classBar}>
                <View style={styles.classBarInfo}>
                  <Text style={styles.classBarTitle} numberOfLines={1}>
                    {course.title}
                  </Text>
                  <Text style={styles.classBarMeta}>
                    {completedIds.length} de {totalLessons} aulas · {pct}%
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.indexButton}
                  onPress={() => setShowIndex(true)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Ver conteúdos do curso"
                >
                  <Ionicons name="list-outline" size={15} color={theme.colors.accent} />
                  <Text style={styles.indexButtonText}>Conteúdos</Text>
                </TouchableOpacity>
              </View>

              {/* CONTEÚDO da aula — a única área rolável */}
              {currentLesson ? (
                <ScrollView
                  ref={contentScrollRef}
                  style={styles.flex}
                  contentContainerStyle={styles.classContent}
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
                  {/* Cabeçalho da aula */}
                  <View style={styles.lessonHead}>
                    <View style={styles.lessonHeadRow}>
                      <Text style={styles.lessonOverline}>
                        Aula {currentIndex + 1} de {allLessons.length}
                      </Text>
                      <Chip label={KIND_META[currentLesson.kind].label} tone="accent" />
                    </View>
                    <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
                    {currentLesson.durationMin > 0 ? (
                      <View style={styles.lessonMetaRow}>
                        <Ionicons name="time-outline" size={12} color={theme.colors.textFaint} />
                        <Text style={styles.lessonMeta}>{formatDuration(currentLesson.durationMin)}</Text>
                      </View>
                    ) : null}
                    {liveWhen ? <Text style={styles.lessonLiveWhen}>Encontro: {liveWhen}</Text> : null}
                    {currentLesson.description ? (
                      <Text style={styles.lessonDescription}>{currentLesson.description}</Text>
                    ) : null}
                  </View>

                  {/* Ações de vídeo / sala ao vivo */}
                  {videoUrl ? (
                    <TouchableOpacity
                      style={styles.playCard}
                      onPress={() => void openInBrowser(videoUrl)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Assistir aula em vídeo"
                    >
                      <View style={styles.playIcon}>
                        <Ionicons name="play" size={20} color={theme.colors.onAccent} />
                      </View>
                      <View style={styles.playInfo}>
                        <Text style={styles.playTitle}>Assistir aula</Text>
                        <Text style={styles.playHint}>Vídeo da aula {currentIndex + 1}</Text>
                      </View>
                      <Ionicons name="open-outline" size={15} color={theme.colors.textFaint} />
                    </TouchableOpacity>
                  ) : null}
                  {meetingUrl ? (
                    <TouchableOpacity
                      style={styles.playCard}
                      onPress={() => void openInBrowser(meetingUrl)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Abrir sala de transmissão ao vivo"
                    >
                      <View style={styles.playIcon}>
                        <Ionicons name="videocam" size={20} color={theme.colors.onAccent} />
                      </View>
                      <View style={styles.playInfo}>
                        <Text style={styles.playTitle}>Sala de transmissão</Text>
                        <Text style={styles.playHint}>{liveWhen ?? "Encontro ao vivo"}</Text>
                      </View>
                      <Ionicons name="open-outline" size={15} color={theme.colors.textFaint} />
                    </TouchableOpacity>
                  ) : null}

                  {/* CONTEÚDO principal (leitura) — direto na tela */}
                  {lessonContent ? (
                    <View style={styles.contentCard}>
                      <RichText text={lessonContent} />
                    </View>
                  ) : !videoUrl && !meetingUrl ? (
                    <View style={styles.contentEmpty}>
                      <Ionicons
                        name={KIND_META[currentLesson.kind].icon}
                        size={22}
                        color={theme.colors.textFaint}
                      />
                      <Text style={styles.contentEmptyText}>
                        O material desta aula aparece aqui quando o mentor publicar.
                      </Text>
                    </View>
                  ) : null}

                  {/* Materiais / anexos */}
                  {attachments.length > 0 ? (
                    <View style={styles.attachBlock}>
                      <Text style={styles.attachTitle}>Materiais da aula</Text>
                      {attachments.map((attachment) => (
                        <TouchableOpacity
                          key={attachment.url}
                          style={styles.attachmentRow}
                          onPress={() => void openInBrowser(attachment.url)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={`Abrir material ${attachment.name}`}
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

                  <View style={styles.classFooterSpacer} />
                </ScrollView>
              ) : (
                <EmptyState
                  icon="library-outline"
                  title="Nenhuma aula publicada"
                  message="As aulas deste curso aparecerão aqui."
                />
              )}

              {/* Barra de ações FIXA: Anterior · Concluir · Próxima */}
              {currentLesson ? (
                <View style={styles.actionBar}>
                  <TouchableOpacity
                    style={[styles.navSide, currentIndex <= 0 && styles.navSideDisabled]}
                    onPress={() => goToLesson(-1)}
                    disabled={currentIndex <= 0}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Aula anterior"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={17}
                      color={currentIndex > 0 ? theme.colors.textMuted : theme.colors.textFaint}
                    />
                    <Text style={styles.navSideText}>Anterior</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.completeCenter, currentCompleted && styles.completeCenterDone]}
                    onPress={() => void handleToggleLesson(currentLesson)}
                    disabled={togglingIds.includes(currentLesson.id) || currentLesson.locked}
                    activeOpacity={0.85}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: currentCompleted }}
                    accessibilityLabel={
                      currentCompleted
                        ? "Desmarcar aula como concluída"
                        : "Marcar aula como concluída"
                    }
                  >
                    {togglingIds.includes(currentLesson.id) ? (
                      <ActivityIndicator size="small" color={currentCompleted ? theme.colors.accent : theme.colors.onAccent} />
                    ) : (
                      <>
                        <Ionicons
                          name={currentCompleted ? "checkmark" : "flash"}
                          size={15}
                          color={currentCompleted ? theme.colors.accent : theme.colors.onAccent}
                        />
                        <Text
                          style={[
                            styles.completeCenterText,
                            currentCompleted && styles.completeCenterTextDone,
                          ]}
                          numberOfLines={1}
                        >
                          {currentCompleted ? "Concluída" : "Concluir aula"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.navSide,
                      currentIndex >= allLessons.length - 1 && styles.navSideDisabled,
                    ]}
                    onPress={() => goToLesson(1)}
                    disabled={currentIndex >= allLessons.length - 1}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Próxima aula"
                  >
                    <Text style={styles.navSideText}>Próxima</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={
                        currentIndex < allLessons.length - 1
                          ? theme.colors.textMuted
                          : theme.colors.textFaint
                      }
                    />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* ÍNDICE do curso — só abre pelo botão "Conteúdos" */}
              <Modal
                visible={showIndex}
                animationType="slide"
                transparent
                onRequestClose={() => setShowIndex(false)}
              >
                <View style={styles.modalBackdrop}>
                  <Pressable style={styles.modalBackdropTouch} onPress={() => setShowIndex(false)} />
                  <View style={styles.modalSheet}>
                    <View style={styles.modalHead}>
                      <Text style={styles.modalTitle}>Conteúdos do curso</Text>
                      <TouchableOpacity
                        onPress={() => setShowIndex(false)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Fechar conteúdos"
                      >
                        <Ionicons name="close" size={22} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.modalProgress}>
                      <View style={styles.modalProgressRow}>
                        <Text style={styles.modalProgressMeta}>
                          {completedIds.length} de {totalLessons} aulas concluídas
                        </Text>
                        <Text style={styles.modalProgressPct}>{pct}%</Text>
                      </View>
                      <ProgressBar pct={pct} height={8} />
                    </View>
                    <ScrollView
                      style={styles.modalScroll}
                      contentContainerStyle={styles.modalContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {sections.length === 0 ? (
                        <EmptyState
                          icon="library-outline"
                          title="Nenhuma aula publicada"
                          message="As aulas deste curso aparecerão aqui."
                        />
                      ) : (
                        sections.map((section) => (
                          <View key={section.key} style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>{section.title}</Text>
                            {section.description ? (
                              <Text style={styles.modalSectionDescription}>
                                {section.description}
                              </Text>
                            ) : null}
                            <View style={styles.modalLessons}>
                              {section.lessons.map((lesson, index) => (
                                <LessonRow
                                  key={lesson.id}
                                  lesson={lesson}
                                  number={index + 1}
                                  completed={completedIds.includes(lesson.id)}
                                  locked={lesson.locked}
                                  toggling={togglingIds.includes(lesson.id)}
                                  active={currentLesson?.id === lesson.id}
                                  onSelect={() => selectLesson(lesson)}
                                  onToggleComplete={() => void handleToggleLesson(lesson)}
                                />
                              ))}
                            </View>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            /* ---------------- Não inscrito: página de venda ---------------- */
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.salesContent}
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
              <View style={styles.hero}>
                <RemoteImage
                  uri={course.coverUrl}
                  style={styles.heroCover}
                  recyclingKey={course.id}
                  fallbackIcon="play-circle-outline"
                  errorIcon="image-outline"
                  iconSize={38}
                />
                <LinearGradient
                  colors={["transparent", theme.colors.overlay]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.heroGradient}
                >
                  <Text style={styles.heroTitle} numberOfLines={3}>
                    {course.title}
                  </Text>
                </LinearGradient>
              </View>

              <TouchableOpacity
                style={styles.mentorRow}
                onPress={() => navigation.navigate("Mentor", { id: course.mentor.id })}
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

              <View style={styles.chipsRow}>
                <Chip label={course.category} tone="accent" />
                {levelLabel(course.level) ? (
                  <Chip label={levelLabel(course.level)} tone="outline" />
                ) : null}
                {course.liveCount > 0 ? <Chip label={`${course.liveCount} ao vivo`} /> : null}
              </View>
              <Text style={styles.metaLine}>
                {course.lessonCount} aulas
                {course.totalDurationMin > 0 ? ` · ${formatDuration(course.totalDurationMin)}` : ""}
                {course.studentCount > 0 ? ` · ${formatNumber(course.studentCount)} alunos` : ""}
              </Text>

              <View style={styles.priceRow}>
                <Text style={[styles.price, course.price > 0 ? null : styles.priceFree]}>
                  {formatPrice(course.price)}
                </Text>
              </View>

              {course.description ? <Text style={styles.description}>{course.description}</Text> : null}

              <View style={styles.lockedBanner}>
                <Ionicons name="lock-closed" size={14} color={theme.colors.warning} />
                <Text style={styles.lockedBannerText}>
                  {course.price > 0
                    ? "Compre este curso e estude direto por aqui — todas as aulas ficam no app."
                    : "Inscreva-se gratuitamente para desbloquear todas as aulas."}
                </Text>
              </View>

              <View style={styles.salesFooterSpacer} />
            </ScrollView>
          )}

          {/* CTA de inscrição (não inscrito) */}
          {!enrolled ? (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.cta, enrolling && styles.ctaDisabled]}
                onPress={() => void handleEnroll()}
                disabled={enrolling}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={
                  course.price > 0 ? "Comprar curso" : "Inscrever-se gratuitamente"
                }
              >
                {enrolling ? (
                  <ActivityIndicator size="small" color={theme.colors.onAccent} />
                ) : (
                  <>
                    <Ionicons
                      name={course.price > 0 ? "cart-outline" : "add-circle-outline"}
                      size={17}
                      color={theme.colors.onAccent}
                    />
                    <Text style={styles.ctaText}>
                      {course.price > 0
                        ? `Comprar · ${formatPrice(course.price)}`
                        : "Inscrever-se gratuitamente"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Toast de XP */}
          {xpToast ? (
            <View pointerEvents="none" style={styles.xpToast}>
              <Ionicons name="flash" size={13} color={theme.colors.onAccent} />
              <Text style={styles.xpToastText}>{xpToast}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

/* --------------------------- Subcomponentes ---------------------------- */

/** Linha do índice (modal de conteúdos): número/check, título e duração. */
function LessonRow({
  lesson,
  number,
  completed,
  locked,
  toggling,
  active,
  onSelect,
  onToggleComplete,
}: {
  lesson: Lesson;
  number: number;
  completed: boolean;
  locked: boolean;
  toggling: boolean;
  active: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
}) {
  const styles = makeStyles();
  const endLabel =
    lesson.durationMin > 0 ? formatDuration(lesson.durationMin) : KIND_META[lesson.kind].label;

  return (
    <TouchableOpacity
      style={[styles.lessonRow, active ? styles.lessonRowActive : null]}
      onPress={onSelect}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Abrir aula ${lesson.title}`}
      accessibilityState={{ selected: active }}
    >
      {locked ? (
        <View style={styles.lockBox}>
          <Ionicons name="lock-closed" size={14} color={theme.colors.textFaint} />
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.stepCircle, completed ? styles.stepCircleDone : null]}
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
            <ActivityIndicator size="small" color={completed ? theme.colors.onAccent : theme.colors.accent} />
          ) : completed ? (
            <Ionicons name="checkmark" size={15} color={theme.colors.onAccent} />
          ) : (
            <Text style={styles.stepNumber}>{number}</Text>
          )}
        </TouchableOpacity>
      )}
      <Text
        style={[
          styles.lessonRowTitle,
          completed ? styles.lessonRowTitleDone : null,
          locked ? styles.lessonRowTitleLocked : null,
        ]}
        numberOfLines={2}
      >
        {lesson.title}
      </Text>
      <Text style={styles.lessonRowEnd}>{endLabel}</Text>
    </TouchableOpacity>
  );
}

/* ------------------------------- Estilos ------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },

    /* ------------------------- Sala de aula ------------------------- */
    classBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    classBarInfo: { flex: 1, gap: 1 },
    classBarTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
    classBarMeta: { color: theme.colors.textFaint, fontSize: 11 },
    indexButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.md,
      minHeight: 38,
    },
    indexButtonText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },

    classContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    lessonHead: { gap: theme.spacing.xs, marginBottom: theme.spacing.md },
    lessonHeadRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    lessonOverline: {
      color: theme.colors.textFaint,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    lessonTitle: { color: theme.colors.text, fontSize: 20, fontWeight: "800", lineHeight: 26 },
    lessonMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
    lessonMeta: { color: theme.colors.textMuted, fontSize: 12 },
    lessonLiveWhen: { color: theme.colors.info, fontSize: 12, fontWeight: "600", marginTop: 2 },
    lessonDescription: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
    },

    /* Cartão de vídeo / sala */
    playCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    playIcon: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    playInfo: { flex: 1, gap: 1 },
    playTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
    playHint: { color: theme.colors.textMuted, fontSize: 12 },

    /* Conteúdo (leitura) */
    contentCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
    },
    contentEmpty: {
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
    },
    contentEmptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
      maxWidth: 260,
    },

    /* Anexos */
    attachBlock: { marginTop: theme.spacing.md, gap: theme.spacing.xs },
    attachTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
    attachmentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
      minHeight: 44,
    },
    attachmentName: { color: theme.colors.text, fontSize: 13, flex: 1 },

    classFooterSpacer: { height: theme.spacing.lg },

    /* Barra de ações fixa */
    actionBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    navSide: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: theme.spacing.xs,
      minHeight: 44,
      borderRadius: theme.radius.md,
    },
    navSideDisabled: { opacity: 0.4 },
    navSideText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },
    completeCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      minHeight: 46,
      paddingHorizontal: theme.spacing.sm,
    },
    completeCenterDone: {
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    completeCenterText: { color: theme.colors.onAccent, fontSize: 14, fontWeight: "700" },
    completeCenterTextDone: { color: theme.colors.accent },

    /* Modal do índice */
    modalBackdrop: { flex: 1, backgroundColor: theme.colors.overlay },
    modalBackdropTouch: { flex: 1 },
    modalSheet: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      maxHeight: "85%",
      minHeight: "55%",
      paddingBottom: theme.spacing.xl,
    },
    modalHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    modalTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
    modalProgress: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.xs,
    },
    modalProgressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalProgressMeta: { color: theme.colors.textMuted, fontSize: 12 },
    modalProgressPct: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
    modalScroll: { flex: 1 },
    modalContent: { paddingBottom: theme.spacing.xl },
    modalSection: { marginTop: theme.spacing.md },
    modalSectionTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "700",
      paddingHorizontal: theme.spacing.lg,
    },
    modalSectionDescription: {
      color: theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 17,
      paddingHorizontal: theme.spacing.lg,
      marginTop: 2,
    },
    modalLessons: { marginTop: theme.spacing.xs },

    lessonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: "transparent",
    },
    lessonRowActive: {
      backgroundColor: theme.colors.accentSoft,
      borderLeftColor: theme.colors.accent,
    },
    lockBox: {
      width: 30,
      height: 30,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircle: {
      width: 30,
      height: 30,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircleDone: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    stepNumber: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "700" },
    lessonRowTitle: { color: theme.colors.text, fontSize: 13, flex: 1, lineHeight: 18 },
    lessonRowTitleDone: { color: theme.colors.textFaint },
    lessonRowTitleLocked: { color: theme.colors.textFaint },
    lessonRowEnd: { color: theme.colors.textFaint, fontSize: 11 },

    /* ------------------------- Página de venda ------------------------- */
    salesContent: { paddingBottom: theme.spacing.xl },
    hero: { height: 200, backgroundColor: theme.colors.surfaceAlt },
    heroCover: { ...StyleSheet.absoluteFillObject },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      padding: theme.spacing.lg,
    },
    heroTitle: { color: theme.colors.white, fontSize: 22, fontWeight: "800", lineHeight: 28 },
    mentorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    mentorInfo: { flex: 1, gap: 2 },
    mentorName: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    ratingText: { color: theme.colors.textMuted, fontSize: 12 },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.xs,
    },
    metaLine: {
      color: theme.colors.textMuted,
      fontSize: 12,
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.sm,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    price: { color: theme.colors.text, fontSize: 24, fontWeight: "800" },
    priceFree: { color: theme.colors.accent },
    description: {
      color: theme.colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    lockedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.warningSoft,
      borderWidth: 1,
      borderColor: theme.colors.warningBorder,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
    },
    lockedBannerText: { color: theme.colors.textMuted, fontSize: 12, flex: 1, lineHeight: 17 },
    salesFooterSpacer: { height: theme.spacing.md },

    /* CTA rodapé */
    footer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    cta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      minHeight: 50,
    },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { color: theme.colors.onAccent, fontSize: 15, fontWeight: "700" },

    /* Toast XP */
    xpToast: {
      position: "absolute",
      bottom: 84,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    xpToastText: { color: theme.colors.onAccent, fontSize: 12, fontWeight: "700" },
  });
