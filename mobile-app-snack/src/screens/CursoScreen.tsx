/**
 * Detalhe do curso (tela mais rica do app) — CONTENT-FIRST:
 * - Inscrito: abre DIRETO na aula atual com o conteúdo em foco (vídeo em destaque,
 *   texto completo, materiais, concluir +XP, anterior/próxima). O índice completo
 *   do curso fica escondido atrás do botão "Índice" (header ou faixa de progresso),
 *   que abre um modal com todas as aulas por tema.
 * - Não inscrito: página de vendas — capa em gradiente, mentor, rating, preço,
 *   descrição e prévia bloqueada das aulas + CTA "Inscrever-se" (402 = curso pago
 *   → Checkout completo dentro do app).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { savePendingCheckout } from "../lib/pendingCheckout";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
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
  /** Modal do índice do curso (aberto pelo botão "Índice" / faixa de progresso). */
  const [indexOpen, setIndexOpen] = useState(false);
  // Aula em destaque no foco (selecionada pelo usuário ou a próxima pendente).
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<string | null>(null);
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

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

  // Recarrega ao voltar do checkout — a compra feita no app libera o curso
  // e o aluno já vê o conteúdo sem precisar reabrir a tela.
  useFocusEffect(
    useCallback(() => {
      // pula o 1º focus (o load("initial") acima já cobre a abertura)
      if (mountedRef.current) void load("refresh");
      else mountedRef.current = true;
    }, [load])
  );
  const mountedRef = useRef(false);

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


  async function handleEnroll() {
    if (!detail || enrolling) return;
    setEnrolling(true);
    try {
      await enrollCourse(detail.course.id);
      Alert.alert("Inscrição confirmada!", "Agora você tem acesso a todas as aulas deste curso.");
      await load("refresh");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        // Curso pago: CHECKOUT COMPLETO DENTRO DO APP (PIX, cartão, boleto,
        // cupom). Guarda a intenção de compra — se a sessão cair antes de
        // concluir, o app retoma direto neste curso após o novo login.
        const price =
          typeof err.payload?.price === "number" ? err.payload.price : detail.course.price;
        await savePendingCheckout(detail.course.id);
        navigation.push("Checkout", {
          kind: "course",
          itemId: detail.course.id,
          title: detail.course.title,
          price,
          mentorName: detail.course.mentor?.name,
          mentorAvatarUrl: detail.course.mentor?.avatarUrl ?? null,
        });
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
    if (next) {
      setSelectedLessonId(next.id);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }

  /** Toque numa aula: bloqueada avisa para se inscrever; livre seleciona e volta ao topo. */
  function handleSelectLesson(lesson: Lesson) {
    if (lesson.locked) {
      Alert.alert(
        "Aula bloqueada",
        "Inscreva-se no curso para desbloquear todas as aulas."
      );
      return;
    }
    setSelectedLessonId(lesson.id);
    setIndexOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
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

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      {loading ? (
        <LoadingList label="Carregando curso..." />
      ) : error && !detail ? (
        <ErrorBox message={error} onRetry={() => void load("initial")} />
      ) : detail && course ? (
        <View style={styles.flex}>
          <ScreenHeader
            title={enrolled ? course.title : "Curso"}
            onBack={() => navigation.goBack()}
            right={
              enrolled ? (
                <TouchableOpacity
                  style={styles.indexButton}
                  onPress={() => setIndexOpen(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir índice do curso"
                >
                  <Ionicons name="list" size={17} color={theme.colors.accent} />
                  <Text style={styles.indexButtonText}>Índice</Text>
                </TouchableOpacity>
              ) : undefined
            }
          />
          <ScrollView
            ref={scrollRef}
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
            {enrolled ? (
              <>
                {/* Faixa de progresso — toque abre o índice completo do curso */}
                <TouchableOpacity
                  style={styles.progressStrip}
                  onPress={() => setIndexOpen(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Ver progresso e abrir o índice do curso"
                >
                  <View style={styles.progressStripInfo}>
                    <ProgressBar pct={pct} height={8} />
                    <Text style={styles.progressStripText}>
                      {pct}% · {completedIds.length} de {totalLessons} aulas concluídas
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={theme.colors.textFaint} />
                </TouchableOpacity>

                {/* CONTEÚDO EM FOCO — a aula atual abre direto, sem índice no meio */}
                {currentLesson ? (
                  <LessonFocus
                    lesson={currentLesson}
                    position={currentIndex + 1}
                    total={allLessons.length}
                    coverUrl={course.coverUrl}
                    completed={completedIds.includes(currentLesson.id)}
                    toggling={togglingIds.includes(currentLesson.id)}
                    canPrev={currentIndex > 0}
                    canNext={currentIndex < allLessons.length - 1}
                    onPrev={() => goToLesson(-1)}
                    onNext={() => goToLesson(1)}
                    onToggleComplete={() => void handleToggleLesson(currentLesson)}
                    onOpen={(url) => void openInBrowser(url)}
                  />
                ) : (
                  <EmptyState
                    icon="library-outline"
                    title="Nenhuma aula publicada"
                    message="As aulas deste curso aparecerão aqui em breve."
                  />
                )}

                {course.description ? (
                  <View style={styles.aboutBlock}>
                    <Text style={styles.aboutTitle}>Sobre este curso</Text>
                    <Text style={styles.aboutText}>{course.description}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <>
            {/* Hero: capa com gradiente e título sobreposto */}
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

            {/* Mentor + rating */}
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

            {/* Aviso de bloqueio (página de vendas) */}
            <View style={styles.lockedBanner}>
              <Ionicons name="lock-closed" size={14} color={theme.colors.warning} />
              <Text style={styles.lockedBannerText}>
                Inscreva-se para desbloquear todas as aulas deste curso.
              </Text>
            </View>

            {/* Prévia das aulas por tema (bloqueadas na página de vendas) */}
            {sections.length === 0 ? (
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
                    {section.lessons.map((lesson, index) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        number={index + 1}
                        completed={completedIds.includes(lesson.id)}
                        locked={lesson.locked}
                        toggling={togglingIds.includes(lesson.id)}
                        active={currentLesson?.id === lesson.id}
                        onSelect={() => handleSelectLesson(lesson)}
                        onToggleComplete={() => void handleToggleLesson(lesson)}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
              </>
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
                  <ActivityIndicator size="small" color={theme.colors.onAccent} />
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
              <Ionicons name="flash" size={13} color={theme.colors.onAccent} />
              <Text style={styles.xpToastText}>{xpToast}</Text>
            </View>
          ) : null}

          {/* Modal do índice completo — aberto pelo botão "Índice" ou pela faixa de progresso */}
          {enrolled ? (
            <IndexModal
              visible={indexOpen}
              onClose={() => setIndexOpen(false)}
              mentor={course.mentor}
              sections={sections}
              completedIds={completedIds}
              currentLessonId={currentLesson?.id ?? null}
              totalLessons={totalLessons}
              pct={pct}
              togglingIds={togglingIds}
              onSelect={handleSelectLesson}
              onToggleComplete={(lesson) => void handleToggleLesson(lesson)}
              onOpenMentor={() => {
                setIndexOpen(false);
                navigation.navigate("Mentor", { id: course.mentor.id });
              }}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

/* --------------------------- Subcomponentes ---------------------------- */

/**
 * FOCO DA AULA: conteúdo aberto na hora — vídeo em destaque (capa + play),
 * texto completo já renderizado (sem botão "ver conteúdo"), sala ao vivo,
 * materiais, concluir (+XP) e navegação anterior/próxima.
 */
function LessonFocus({
  lesson,
  position,
  total,
  coverUrl,
  completed,
  toggling,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onToggleComplete,
  onOpen,
}: {
  lesson: Lesson;
  position: number;
  total: number;
  coverUrl: string | null;
  completed: boolean;
  toggling: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleComplete: () => void;
  onOpen: (url: string) => void;
}) {
  const styles = makeStyles();
  const kindMeta = KIND_META[lesson.kind];
  const videoUrl = !lesson.locked && lesson.kind === "RECORDED" ? lesson.videoUrl : null;
  const meetingUrl = !lesson.locked && lesson.kind === "LIVE" ? lesson.meetingUrl : null;
  // Conteúdo em foco: texto rico da aula (ou descrição) já aberto — zero atrito.
  const bodyRich = !lesson.locked && lesson.content ? lesson.content : null;
  const bodyPlain = !lesson.locked && !lesson.content ? lesson.description : null;
  const liveWhen =
    !lesson.locked && lesson.kind === "LIVE" && lesson.startsAt ? formatNaiveLong(lesson.startsAt) : null;
  const attachments = lesson.locked ? [] : lesson.attachments ?? [];

  return (
    <View style={styles.currentCard}>
      <View style={styles.currentHeader}>
        <Text style={styles.currentOverline}>
          Aula atual · {position} de {total}
        </Text>
        <Chip label={kindMeta.label} tone="accent" />
      </View>
      <Text style={styles.focusTitle}>{lesson.title}</Text>
      <View style={styles.currentMetaRow}>
        {lesson.durationMin > 0 ? (
          <>
            <Ionicons name="time-outline" size={12} color={theme.colors.textFaint} />
            <Text style={styles.currentMeta}>{formatDuration(lesson.durationMin)}</Text>
          </>
        ) : null}
        {liveWhen ? <Text style={styles.currentLiveWhen}>Encontro: {liveWhen}</Text> : null}
      </View>

      {/* CONTEÚDO */}
      {videoUrl ? (
        <TouchableOpacity
          style={styles.playCard}
          onPress={() => onOpen(videoUrl)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Assistir aula ${lesson.title}`}
        >
          <RemoteImage
            uri={coverUrl}
            style={styles.playCover}
            recyclingKey={lesson.id}
            fallbackIcon="play-circle-outline"
            errorIcon="image-outline"
            iconSize={34}
          />
          <View style={styles.playOverlay}>
            <View style={styles.playIconWrap}>
              <Ionicons name="play" size={26} color={theme.colors.onAccent} />
            </View>
            <Text style={styles.playLabel}>Assistir aula</Text>
          </View>
        </TouchableOpacity>
      ) : null}
      {meetingUrl ? (
        <View style={styles.lessonActions}>
          <ActionButton
            icon="videocam"
            label="Abrir sala de transmissão"
            onPress={() => onOpen(meetingUrl)}
          />
        </View>
      ) : null}
      {bodyRich ? (
        <View style={styles.lessonContent}>
          <RichText text={bodyRich} />
        </View>
      ) : null}
      {bodyPlain ? <Text style={styles.focusBody}>{bodyPlain}</Text> : null}
      {attachments.length > 0 ? (
        <View style={styles.attachments}>
          {attachments.map((attachment) => (
            <TouchableOpacity
              key={attachment.url}
              style={styles.attachmentRow}
              onPress={() => onOpen(attachment.url)}
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

      {/* Concluir aula (+XP) — toque novamente para desmarcar */}
      <TouchableOpacity
        style={[styles.completeButton, completed ? styles.completeButtonDone : null]}
        onPress={onToggleComplete}
        disabled={toggling || lesson.locked}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={
          completed
            ? `Desmarcar aula ${lesson.title} como concluída`
            : `Marcar aula ${lesson.title} como concluída`
        }
      >
        {toggling ? (
          <ActivityIndicator size="small" color={completed ? theme.colors.accent : theme.colors.onAccent} />
        ) : (
          <>
            <Ionicons
              name={completed ? "checkmark" : "flash"}
              size={completed ? 16 : 15}
              color={completed ? theme.colors.accent : theme.colors.onAccent}
            />
            <Text style={[styles.completeButtonText, completed ? styles.completeButtonTextDone : null]}>
              {completed ? "Aula concluída" : "Marcar como concluída (+XP)"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Aula anterior / próxima */}
      <View style={styles.currentNav}>
        <TouchableOpacity
          style={[styles.navButton, !canPrev ? styles.navButtonDisabled : null]}
          onPress={onPrev}
          disabled={!canPrev}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Aula anterior"
        >
          <Ionicons
            name="chevron-back"
            size={15}
            color={canPrev ? theme.colors.textMuted : theme.colors.textFaint}
          />
          <Text style={styles.navButtonText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, !canNext ? styles.navButtonDisabled : null]}
          onPress={onNext}
          disabled={!canNext}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Próxima aula"
        >
          <Text style={styles.navButtonText}>Próxima</Text>
          <Ionicons
            name="chevron-forward"
            size={15}
            color={canNext ? theme.colors.textMuted : theme.colors.textFaint}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Índice completo do curso em modal — só abre quando o aluno pede (botão/faixa). */
function IndexModal({
  visible,
  onClose,
  mentor,
  sections,
  completedIds,
  currentLessonId,
  totalLessons,
  pct,
  togglingIds,
  onSelect,
  onToggleComplete,
  onOpenMentor,
}: {
  visible: boolean;
  onClose: () => void;
  mentor: { id: string; name: string; avatarUrl: string | null };
  sections: Array<{ key: string; title: string; description: string | null; lessons: Lesson[] }>;
  completedIds: string[];
  currentLessonId: string | null;
  totalLessons: number;
  pct: number;
  togglingIds: string[];
  onSelect: (lesson: Lesson) => void;
  onToggleComplete: (lesson: Lesson) => void;
  onOpenMentor: () => void;
}) {
  const styles = makeStyles();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalWrap}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderInfo}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              Índice do curso
            </Text>
            <Text style={styles.modalMeta}>
              {pct}% concluído · {completedIds.length} de {totalLessons} aulas
            </Text>
          </View>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Fechar índice"
          >
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.flex} contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.mentorRow}
            onPress={onOpenMentor}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${mentor.name}`}
          >
            <Avatar uri={mentor.avatarUrl} name={mentor.name} size={34} />
            <View style={styles.mentorInfo}>
              <Text style={styles.mentorName} numberOfLines={1}>
                Por {mentor.name}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={theme.colors.textFaint} />
          </TouchableOpacity>

          {sections.length === 0 ? (
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
                  {section.lessons.map((lesson, index) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      number={index + 1}
                      completed={completedIds.includes(lesson.id)}
                      locked={lesson.locked}
                      toggling={togglingIds.includes(lesson.id)}
                      active={currentLessonId === lesson.id}
                      onSelect={() => onSelect(lesson)}
                      onToggleComplete={() => onToggleComplete(lesson)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/** Linha compacta de aula: número/check, título e duração. Toque seleciona a aula atual. */
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
      accessibilityLabel={`Selecionar aula ${lesson.title}`}
      accessibilityState={{ selected: active }}
    >
      {locked ? (
        <View style={styles.lockBox}>
          <Ionicons name="lock-closed" size={14} color={theme.colors.textFaint} />
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.stepCircle,
            completed ? styles.stepCircleDone : null,
            active && !completed ? styles.stepCircleActive : null,
          ]}
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
          active ? styles.lessonRowTitleActive : null,
        ]}
        numberOfLines={2}
      >
        {lesson.title}
      </Text>
      <Text style={styles.lessonRowEnd}>{endLabel}</Text>
    </TouchableOpacity>
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
  const styles = makeStyles();
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

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },

    /* Hero */
    hero: {
      height: 190,
      borderRadius: theme.radius.lg,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceAlt,
    },
    heroCover: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.colors.surfaceAlt,
    },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      padding: theme.spacing.md,
    },
    heroTitle: {
      color: theme.colors.white,
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 26,
      letterSpacing: -0.3,
      textShadowColor: "rgba(0, 0, 0, 0.35)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },

    /* Mentor */
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

    /* Metadados */
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

    /* Progresso */
    progressCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    progressTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
    progressPill: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    progressPct: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
    progressMeta: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
    progressDone: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },

    /* Faixa de progresso compacta (content-first) — toque abre o índice */
    progressStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      marginTop: theme.spacing.xs,
    },
    progressStripInfo: { flex: 1, gap: 6 },
    progressStripText: { color: theme.colors.textMuted, fontSize: 11.5, fontWeight: "700" },

    /* Botão "Índice" no header */
    indexButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    indexButtonText: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },

    /* Foco da aula */
    focusTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "800",
      lineHeight: 26,
      letterSpacing: -0.3,
    },
    focusBody: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21 },

    /* Card de vídeo em destaque (capa + play) */
    playCard: {
      height: 200,
      borderRadius: theme.radius.md,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceAlt,
    },
    playCover: { width: "100%", height: "100%", backgroundColor: theme.colors.surfaceAlt },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    playIconWrap: {
      width: 58,
      height: 58,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      paddingLeft: 4,
    },
    playLabel: {
      color: theme.colors.white,
      fontSize: 13,
      fontWeight: "800",
      textShadowColor: "rgba(0, 0, 0, 0.4)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },

    /* Sobre este curso (rodapé discreto da aula) */
    aboutBlock: {
      marginTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.sm,
      gap: 4,
    },
    aboutTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    aboutText: { color: theme.colors.textMuted, fontSize: 13.5, lineHeight: 20 },

    /* Modal do índice completo */
    modalWrap: { flex: 1, backgroundColor: theme.colors.bg },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
    },
    modalHeaderInfo: { flex: 1, gap: 2 },
    modalTitle: { color: theme.colors.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
    modalMeta: { color: theme.colors.textMuted, fontSize: 12.5, fontWeight: "600" },
    modalClose: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    modalBody: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },

    /* Bloqueio */
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

    /* Seções de aulas */
    section: { marginTop: theme.spacing.xl },
    sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "700" },
    sectionDescription: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    lessonsList: { gap: theme.spacing.md, marginTop: theme.spacing.md },
    /* Card "Aula atual" em destaque */
    currentCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    currentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
    },
    currentOverline: {
      flex: 1,
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    currentTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    currentDescription: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
    currentMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
    currentMeta: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600" },
    currentLiveWhen: { color: theme.colors.info, fontSize: 12, fontWeight: "600" },

    /* Botão concluir aula (+XP) */
    completeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 13,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
      minHeight: 48,
    },
    completeButtonDone: {
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    completeButtonText: { color: theme.colors.onAccent, fontSize: 14, fontWeight: "700" },
    completeButtonTextDone: { color: theme.colors.accent },

    /* Navegação anterior/próxima */
    currentNav: { flexDirection: "row", gap: theme.spacing.sm },
    navButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 11,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      minHeight: 44,
    },
    navButtonDisabled: { opacity: 0.4 },
    navButtonText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },

    /* Lista compacta de aulas */
    lessonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
    },
    lessonRowActive: {
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    lessonRowTitle: { flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: "600", lineHeight: 19 },
    lessonRowTitleDone: { textDecorationLine: "line-through", color: theme.colors.textMuted },
    lessonRowTitleLocked: { color: theme.colors.textMuted },
    lessonRowTitleActive: { color: theme.colors.accent },
    lessonRowEnd: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600" },

    /* Círculo numerado / check de conclusão */
    stepCircle: {
      width: 26,
      height: 26,
      borderRadius: theme.radius.full,
      borderWidth: 2,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircleDone: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    stepCircleActive: { borderColor: theme.colors.accent },
    stepNumber: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "700" },
    lockBox: {
      width: 26,
      height: 26,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },

    /* Ações da aula (card "Aula atual") */
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

    /* CTA de inscrição */
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
    ctaText: { color: theme.colors.onAccent, fontSize: 15, fontWeight: "700" },

    /* Toast de XP */
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
    xpToastText: { color: theme.colors.onAccent, fontSize: 13, fontWeight: "700" },
    bottomSpacer: { height: theme.spacing.lg },
  });
