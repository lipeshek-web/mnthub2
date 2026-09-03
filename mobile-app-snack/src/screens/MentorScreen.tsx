/**
 * Detalhe do mentor + agendamento de sessão 1:1:
 * - Perfil: avatar, headline, stats (avaliação/preço/experiência), categorias,
 *   idiomas, redes sociais (Linking) e avaliações (Stars + comentário).
 * - Agendamento: chips de dia (próximos 14 dias) → horários livres do dia
 *   (listMentorSlots) → tema obrigatório → createBooking (sessão de 60 min).
 *   409 mostra a mensagem da API e recarrega os horários. Sucesso mostra a
 *   confirmação (status PENDING — aguardando o mentor) com atalho para as
 *   Minhas sessões.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useBackStage, useSafeBack } from "../lib/navigation";
import {
  createBooking,
  errMessage,
  getMentor,
  listMentorSlots,
  type BookingCreated,
  type MentorDetail,
  type MentorDetailResponse,
  type MentorReview,
} from "../lib/api";
import {
  formatIsoDateTime,
  formatNaiveLong,
  formatPrice,
  upcomingDays,
  type DayChip,
} from "../lib/format";
import { theme } from "../theme";
import { useTabs } from "../lib/tabs";
import { requestSessionsSegment } from "../lib/uiHints";
import { Avatar } from "../components/Avatar";
import { Chip } from "../components/Chip";
import { ErrorBox } from "../components/ErrorBox";
import { FilterChip } from "../components/FilterChip";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { StatusPill } from "../components/StatusPill";
import { Stars } from "../components/Stars";

type Stage = "profile" | "booking" | "success";

export default function MentorDetailScreen() {
  const params = (useRoute<any>().params ?? {}) as { id: string };
  const mentorId = Array.isArray(params.id) ? params.id[0] : params.id;

  const navigation = useNavigation<any>();

  const [data, setData] = useState<MentorDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>("profile");
  const [created, setCreated] = useState<BookingCreated | null>(null);
  const [createdStartsAt, setCreatedStartsAt] = useState("");
  const [createdTopic, setCreatedTopic] = useState("");

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!mentorId) return;
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await getMentor(mentorId);
        setData(res);
      } catch (err) {
        setError(errMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mentorId]
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  /* Botão nativo do Android dentro dos estágios internos: voltar do
     agendamento/sucesso retorna ao PERFIL (em vez de desempilhar a tela). */
  useBackStage(
    stage !== "profile",
    useCallback(() => {
      setStage("profile");
      return true;
    }, [])
  );

  function handleCreated(booking: BookingCreated, startsAt: string, topic: string) {
    setCreated(booking);
    setCreatedStartsAt(startsAt);
    setCreatedTopic(topic);
    setStage("success");
  }

  function resetToProfile() {
    setCreated(null);
    setCreatedStartsAt("");
    setCreatedTopic("");
    setStage("profile");
  }

  const mentor = data?.mentor ?? null;

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      {loading ? (
        <LoadingList label="Carregando perfil..." />
      ) : error && !data ? (
        <ErrorBox message={error} onRetry={() => void load("initial")} />
      ) : data && mentor ? (
        stage === "booking" ? (
          <BookingScheduler
            mentor={mentor}
            onCancel={() => setStage("profile")}
            onCreated={handleCreated}
          />
        ) : stage === "success" ? (
          <BookingSuccess
            mentorName={mentor.name}
            mentorAvatarUrl={mentor.avatarUrl}
            created={created}
            startsAt={createdStartsAt}
            topic={createdTopic}
            onBack={resetToProfile}
          />
        ) : (
          <MentorProfile
            mentor={mentor}
            reviews={data.reviews}
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            onSchedule={() => setStage("booking")}
            onMessage={() =>
              mentor.userId &&
              navigation.navigate("Mensagens", { peerId: mentor.userId, peerName: mentor.name })
            }
          />
        )
      ) : null}
    </Screen>
  );
}

/* ------------------------------ Perfil ---------------------------------- */

function MentorProfile({
  mentor,
  reviews,
  refreshing,
  onRefresh,
  onSchedule,
  onMessage,
}: {
  mentor: MentorDetail;
  reviews: MentorReview[];
  refreshing: boolean;
  onRefresh: () => void;
  onSchedule: () => void;
  onMessage: () => void;
}) {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const goBack = useSafeBack(navigation);
  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Não foi possível abrir o link", url);
    }
  }

  const socials: Array<{ key: string; icon: keyof typeof Ionicons.glyphMap; url: string; label: string }> = [];
  if (mentor.instagram) {
    socials.push({
      key: "instagram",
      icon: "logo-instagram",
      url: socialUrl("instagram", mentor.instagram),
      label: `Instagram de ${mentor.name}`,
    });
  }
  if (mentor.linkedin) {
    socials.push({
      key: "linkedin",
      icon: "logo-linkedin",
      url: socialUrl("linkedin", mentor.linkedin),
      label: `LinkedIn de ${mentor.name}`,
    });
  }
  if (mentor.website) {
    socials.push({
      key: "website",
      icon: "globe-outline",
      url: socialUrl("website", mentor.website),
      label: `Site de ${mentor.name}`,
    });
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Mentor" onBack={goBack} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {/* Cabeçalho */}
        <View style={styles.profileHead}>
          <Avatar uri={mentor.avatarUrl} name={mentor.name} size={76} />
          <View style={styles.profileHeadInfo}>
            <Text style={styles.profileName}>{mentor.name}</Text>
            {mentor.headline ? (
              <Text style={styles.profileHeadline}>{mentor.headline}</Text>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Stars value={mentor.rating} size={12} />
            <Text style={styles.statValue}>{(mentor.rating ?? 0).toFixed(1).replace(".", ",")}</Text>
            <Text style={styles.statLabel}>
              {mentor.reviewCount} {mentor.reviewCount === 1 ? "avaliação" : "avaliações"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatPrice(mentor.hourlyRate)}</Text>
            <Text style={styles.statLabel}>por hora</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mentor.experienceYears} anos</Text>
            <Text style={styles.statLabel}>de experiência</Text>
          </View>
        </View>

        {/* Categorias + idiomas */}
        {(mentor.categories ?? []).length > 0 ? (
          <View style={styles.chipsRow}>
            {mentor.categories.map((category) => (
              <Chip key={category} label={category} tone="accent" />
            ))}
          </View>
        ) : null}
        {(mentor.languages ?? []).length > 0 ? (
          <View style={styles.languagesRow}>
            <Ionicons name="language" size={14} color={theme.colors.textFaint} />
            <Text style={styles.languagesText}>{mentor.languages.join(", ")}</Text>
          </View>
        ) : null}

        {/* Sobre */}
        {mentor.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <Text style={styles.aboutText}>{mentor.description}</Text>
          </View>
        ) : null}

        {/* Redes sociais */}
        {socials.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Redes sociais</Text>
            <View style={styles.socialsRow}>
              {socials.map((social) => (
                <TouchableOpacity
                  key={social.key}
                  style={styles.socialButton}
                  onPress={() => void open(social.url)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${social.label} (abre no navegador)`}
                >
                  <Ionicons name={social.icon} size={20} color={theme.colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Avaliações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliações</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>Este mentor ainda não recebeu avaliações.</Text>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <Stars value={review.rating} size={12} />
                    <Text style={styles.reviewDate}>{formatIsoDateTime(review.createdAt)}</Text>
                  </View>
                  {review.comment ? (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  ) : null}
                  <Text style={styles.reviewAuthor}>por {review.author}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* CTA: mensagem + agendamento */}
      <View style={styles.footer}>
        <View style={styles.ctaRow}>
          {mentor.userId ? (
            <TouchableOpacity
              style={styles.ctaGhost}
              onPress={onMessage}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Enviar mensagem para ${mentor.name}`}
            >
              <Ionicons name="chatbubble-outline" size={16} color={theme.colors.accent} />
              <Text style={styles.ctaGhostText}>Mensagem</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.cta, mentor.userId && styles.ctaFlex]}
            onPress={onSchedule}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Agendar sessão com ${mentor.name}`}
          >
            <Text style={styles.ctaText}>Agendar sessão</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* --------------------------- Agendamento -------------------------------- */

function BookingScheduler({
  mentor,
  onCancel,
  onCreated,
}: {
  mentor: MentorDetail;
  onCancel: () => void;
  onCreated: (created: BookingCreated, startsAt: string, topic: string) => void;
}) {
  const days = upcomingDays(14);
  const [day, setDay] = useState<DayChip>(days[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const styles = makeStyles();

  const loadSlots = useCallback(
    async (iso: string) => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const res = await listMentorSlots(mentor.id, iso);
        setSlots(res.slots);
      } catch (err) {
        setSlots([]);
        setSlotsError(errMessage(err));
      } finally {
        setSlotsLoading(false);
      }
    },
    [mentor.id]
  );

  useEffect(() => {
    void loadSlots(day.iso);
  }, [day.iso, loadSlots]);

  function selectDay(next: DayChip) {
    if (next.iso === day.iso) return;
    setDay(next);
    setSlot(null);
    setFlowError(null);
  }

  async function handleConfirm() {
    if (!slot || topic.trim().length === 0 || submitting) return;
    setSubmitting(true);
    setFlowError(null);
    const startsAt = `${day.iso}T${slot}`;
    try {
      const booking = await createBooking({
        mentorId: mentor.id,
        startsAt,
        durationMin: 60,
        topic: topic.trim(),
      });
      onCreated(booking, startsAt, topic.trim());
    } catch (err) {
      // 409 → horário ficou indisponível: mostra a mensagem da API e
      // recarrega os horários do dia para remover o slot ocupado.
      setFlowError(errMessage(err));
      setSlot(null);
      void loadSlots(day.iso);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title={`Agendar com ${mentor.name.split(" ")[0] ?? ""}`} onBack={onCancel} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>1. Escolha o dia</Text>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {days.map((dayChip) => (
            <DayChipButton
              key={dayChip.iso}
              day={dayChip}
              selected={dayChip.iso === day.iso}
              onPress={() => selectDay(dayChip)}
            />
          ))}
        </ScrollView>

        <Text style={styles.stepTitle}>2. Escolha o horário</Text>
        {slotsLoading ? (
          <LoadingList compact />
        ) : slotsError ? (
          <ErrorBox compact message={slotsError} onRetry={() => void loadSlots(day.iso)} />
        ) : slots.length === 0 ? (
          <Text style={styles.emptySlots}>
            Nenhum horário livre neste dia. Tente outro dia, por favor.
          </Text>
        ) : (
          <View style={styles.slotsWrap}>
            {slots.map((time) => (
              <FilterChip
                key={time}
                label={time}
                selected={slot === time}
                onPress={() => {
                  setSlot(time);
                  setFlowError(null);
                }}
              />
            ))}
          </View>
        )}

        <Text style={styles.stepTitle}>3. Sobre o que você quer conversar?</Text>
        <TextInput
          style={styles.topicInput}
          value={topic}
          onChangeText={setTopic}
          placeholder="Ex.: Revisar meu portfólio e planejar os próximos passos da carreira."
          placeholderTextColor={theme.colors.textFaint}
          multiline
          maxLength={200}
          textAlignVertical="top"
        />

        <View style={styles.summaryRow}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textFaint} />
          <Text style={styles.summaryText}>Sessão de 60 minutos</Text>
          {mentor.hourlyRate > 0 ? (
            <Text style={styles.summaryPrice}>{formatPrice(mentor.hourlyRate)}</Text>
          ) : null}
        </View>

        {flowError ? (
          <View style={styles.flowError}>
            <ErrorBox compact message={flowError} />
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.cta,
            (!slot || topic.trim().length === 0 || submitting) && styles.ctaDisabled,
          ]}
          onPress={() => void handleConfirm()}
          disabled={!slot || topic.trim().length === 0 || submitting}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Confirmar agendamento"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.colors.onAccent} />
          ) : (
            <Text style={styles.ctaText}>Confirmar agendamento</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function DayChipButton({
  day,
  selected,
  onPress,
}: {
  day: DayChip;
  selected: boolean;
  onPress: () => void;
}) {
  const dayStyles = makeDayStyles();
  return (
    <TouchableOpacity
      style={[dayStyles.pill, selected ? dayStyles.selected : dayStyles.unselected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[dayStyles.weekday, selected ? dayStyles.weekdaySelected : null]}>
        {day.weekday}
      </Text>
      <Text style={[dayStyles.label, selected ? dayStyles.labelSelected : null]}>{day.label}</Text>
    </TouchableOpacity>
  );
}

/* ----------------------------- Sucesso ---------------------------------- */

function BookingSuccess({
  mentorName,
  mentorAvatarUrl,
  created,
  startsAt,
  topic,
  onBack,
}: {
  mentorName: string;
  mentorAvatarUrl: string | null;
  created: BookingCreated | null;
  startsAt: string;
  topic: string;
  onBack: () => void;
}) {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const { setTab } = useTabs();
  const needsPayment = !!created && created.price > 0;

  /** Pagamento INTEGRADO: escolheu dia/horário e já paga aqui mesmo. */
  function goPay() {
    if (!created) return;
    navigation.push("Checkout", {
      kind: "booking",
      itemId: created.id,
      title: `Sessão 1:1 — ${topic || "Mentoria"}`,
      price: created.price,
      mentorName,
      mentorAvatarUrl: mentorAvatarUrl ?? null,
    });
  }

  function goSessions() {
    // Aba Mentorias no pager principal (TabsContext) + desempilha o
    // Mentor para revelar o pager já em "Minhas sessões".
    requestSessionsSegment();
    setTab("Mentorias");
    navigation.goBack();
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Sessão solicitada" onBack={onBack} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.successContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={30} color={theme.colors.accent} />
          </View>
          <Text style={styles.successTitle}>
            {needsPayment ? "Quase lá!" : "Agendamento enviado!"}
          </Text>
          <Text style={styles.successText}>
            Sua sessão com {mentorName} foi solicitada para{"\n"}
            <Text style={styles.successWhen}>{formatNaiveLong(startsAt)}</Text>.
          </Text>
          {created ? <StatusPill status={created.status} /> : null}
          {needsPayment ? (
            <>
              <Text style={styles.successPrice}>
                Valor da sessão: {formatPrice(created!.price)}
              </Text>
              <Text style={styles.successPending}>
                Finalize o pagamento para confirmar o horário — PIX cai na hora, direto aqui no app.
              </Text>
              <TouchableOpacity
                style={styles.cta}
                onPress={goPay}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Pagar agora ${formatPrice(created!.price)} da sessão com ${mentorName}`}
              >
                <Ionicons name="card-outline" size={16} color={theme.colors.onAccent} />
                <Text style={styles.ctaText}>
                  Pagar agora · {formatPrice(created!.price)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostButton} onPress={goSessions} activeOpacity={0.85}>
                <Text style={styles.ghostButtonText}>Pagar depois — ver minhas sessões</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.successPending}>
                Aguardando o mentor confirmar o pedido. Você será notificado assim que ele responder.
              </Text>
              <TouchableOpacity
                style={styles.cta}
                onPress={goSessions}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Ir para Minhas sessões"
              >
                <Text style={styles.ctaText}>Ver minhas sessões</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.ghostButton} onPress={onBack} activeOpacity={0.85}>
            <Text style={styles.ghostButtonText}>Voltar ao perfil do mentor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------- Helpers -------------------------------- */

/** Normaliza handles/URLs das redes sociais para URLs absolutas. */
function socialUrl(network: "instagram" | "linkedin" | "website", value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (network === "instagram") return `https://instagram.com/${raw.replace(/^@/, "")}`;
  if (network === "linkedin") return `https://linkedin.com/in/${raw.replace(/^\/+/, "")}`;
  return `https://${raw}`;
}

/* ------------------------------- Estilos -------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    profileHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  profileHeadInfo: { flex: 1, gap: 4 },
  profileName: { color: theme.colors.text, fontSize: 21, fontWeight: "700", letterSpacing: -0.3 },
  profileHeadline: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
    gap: 4,
  },
  statValue: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  statLabel: { color: theme.colors.textFaint, fontSize: 11, textAlign: "center" },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  languagesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  languagesText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
  section: { marginTop: theme.spacing.xl },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "700", marginBottom: theme.spacing.sm },
  aboutText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22 },
  socialsRow: { flexDirection: "row", gap: theme.spacing.md },
  socialButton: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  noReviews: { color: theme.colors.textFaint, fontSize: 13 },
  reviewsList: { gap: theme.spacing.md },
  reviewCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 6,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  reviewDate: { color: theme.colors.textFaint, fontSize: 11 },
  reviewComment: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 },
  reviewAuthor: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "600" },
  stepTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  daysRow: { gap: theme.spacing.sm, paddingRight: theme.spacing.lg },
  slotsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  emptySlots: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 },
  topicInput: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 15,
    minHeight: 92,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: theme.spacing.md,
  },
  summaryText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600", flex: 1 },
  summaryPrice: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  flowError: { marginTop: theme.spacing.md },
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
    marginTop: theme.spacing.lg,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaText: { color: theme.colors.onAccent, fontSize: 15, fontWeight: "700" },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  ctaFlex: { flex: 1, marginTop: theme.spacing.lg },
  ctaGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.md,
    minHeight: 50,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  ctaGhostText: { color: theme.colors.accent, fontSize: 14, fontWeight: "700" },
  ghostButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: theme.spacing.sm,
  },
  ghostButtonText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },
  successContent: {
    padding: theme.spacing.lg,
  },
  successCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.md,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700" },
  successText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  successWhen: { color: theme.colors.text, fontWeight: "700" },
  successPending: {
    color: theme.colors.textFaint,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  successPrice: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  bottomSpacer: { height: theme.spacing.lg },
});

const makeDayStyles = () =>
  StyleSheet.create({
    pill: {
    width: 64,
    paddingVertical: 9,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },
  selected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
  },
  unselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  weekday: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "600" },
  weekdaySelected: { color: theme.colors.accent },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  labelSelected: { color: theme.colors.accent },
});
