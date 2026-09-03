/**
 * Aba Mentorias com dois segmentos:
 * - Mentores: lista paginada com busca → detalhe do mentor (app/mentor/[id]).
 * - Minhas sessões: agendamentos do aluno com StatusPill e cancelamento
 *   (cancelBooking com confirmação) quando PENDING/CONFIRMED.
 * Aceita o param ?segment=sessoes (usado pelo fluxo de agendamento).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  cancelBooking,
  errMessage,
  listBookings,
  listMentors,
  type Booking,
} from "../lib/api";
import { formatNaiveLong, formatPrice, parseNaive } from "../lib/format";
import { usePagedList } from "../lib/usePagedList";
import { consumeSessionsSegmentHint } from "../lib/uiHints";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { MentorCard } from "../components/MentorCard";
import { Screen } from "../components/Screen";
import { SearchField } from "../components/SearchField";
import { StatusPill } from "../components/StatusPill";

type Segment = "mentores" | "sessoes";

export default function MentorshipsScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const params = (useRoute<any>().params ?? {}) as { segment?: string };
  const [segment, setSegment] = useState<Segment>(
    params.segment === "sessoes" ? "sessoes" : "mentores"
  );

  useEffect(() => {
    if (params.segment === "sessoes") setSegment("sessoes");
  }, [params.segment]);

  /* ------------------------------ Mentores ------------------------------ */

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const mentors = usePagedList(
    (page) => listMentors({ page, pageSize: 20, q: search || undefined }),
    [search]
  );

  /* --------------------------- Minhas sessões --------------------------- */

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsRefreshing, setBookingsRefreshing] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const bookingsLoadedRef = useRef(false);

  const loadBookings = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setBookingsLoading(true);
    else setBookingsRefreshing(true);
    setBookingsError(null);
    try {
      const res = await listBookings();
      setBookings(res.items);
      bookingsLoadedRef.current = true;
    } catch (err) {
      setBookingsError(errMessage(err));
    } finally {
      setBookingsLoading(false);
      setBookingsRefreshing(false);
    }
  }, []);

  // Carrega as sessões na primeira vez que o segmento é aberto.
  useEffect(() => {
    if (segment === "sessoes" && !bookingsLoadedRef.current) {
      void loadBookings("initial");
    }
  }, [segment, loadBookings]);

  // Volta do checkout → revalida as sessões (botão "Pagar agora" some ao pagar).
  // Se a origem pediu "Minhas sessões" (pós-pagamento), abre direto no segmento.
  useFocusEffect(
    useCallback(() => {
      if (consumeSessionsSegmentHint()) setSegment("sessoes");
      if (bookingsLoadedRef.current) void loadBookings("refresh");
    }, [loadBookings])
  );

  function confirmCancel(booking: Booking) {
    Alert.alert(
      "Cancelar sessão",
      `Cancelar sua sessão com ${booking.mentor.name} em ${formatNaiveLong(booking.startsAt)}?`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: () => void doCancel(booking),
        },
      ]
    );
  }

  async function doCancel(booking: Booking) {
    setCancellingId(booking.id);
    try {
      await cancelBooking(booking.id);
      setBookings((prev) =>
        prev.map((b): Booking => (b.id === booking.id ? { ...b, status: "CANCELLED" } : b))
      );
      // Revalida com o servidor para refletir o status oficial.
      void loadBookings("refresh");
    } catch (err) {
      Alert.alert("Não foi possível cancelar", errMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  /** Sessão pendente de pagamento → checkout completo dentro do app. */
  function handlePayBooking(booking: Booking) {
    navigation.push("Checkout", {
      kind: "booking",
      itemId: booking.id,
      title: `Sessão 1:1 — ${booking.topic}`,
      price: booking.price,
      mentorName: booking.mentor.name,
      mentorAvatarUrl: booking.mentor.avatarUrl ?? null,
    });
  }

  /** Reunião DENTRO do app: sala MentorHub Live (WebView + token da API). */
  function handleJoinRoom(booking: Booking) {
    navigation.push("Sala", {
      bookingId: booking.id,
      topic: booking.topic,
      mentorName: booking.mentor.name,
      mentorAvatarUrl: booking.mentor.avatarUrl ?? null,
      startsAt: booking.startsAt,
      durationMin: booking.durationMin,
      status: booking.status,
    });
  }

  /* ------------------------------- Render ------------------------------- */

  return (
    <Screen>
      <View style={styles.segmentRow}>
        <SegmentButton
          label="Mentores"
          icon="people-outline"
          active={segment === "mentores"}
          onPress={() => setSegment("mentores")}
        />
        <SegmentButton
          label="Minhas sessões"
          icon="calendar-outline"
          active={segment === "sessoes"}
          count={segment === "sessoes" ? bookings.length : undefined}
          onPress={() => setSegment("sessoes")}
        />
      </View>

      {segment === "mentores" ? (
        <FlatList
          style={styles.flex}
          data={mentors.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MentorCard mentor={item} onPress={() => navigation.navigate("Mentor", { id: item.id })} />
          )}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={mentors.refreshing}
              onRefresh={mentors.refresh}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          onEndReached={mentors.loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View style={styles.header}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar mentor por nome ou área..."
              />
              {mentors.error && mentors.items.length > 0 ? (
                <View style={styles.banner}>
                  <ErrorBox compact message={mentors.error} onRetry={mentors.refresh} />
                </View>
              ) : null}
            </View>
          }
          ListFooterComponent={mentors.loadingMore ? <LoadingList compact /> : null}
          ListEmptyComponent={
            mentors.loading ? (
              <LoadingList label="Carregando mentores..." />
            ) : mentors.error ? (
              <ErrorBox message={mentors.error} onRetry={mentors.reload} />
            ) : (
              <EmptyState
                icon="people-outline"
                title="Nenhum mentor encontrado"
                message={search ? "Tente buscar por outro nome ou área." : "Volte mais tarde — novos mentores chegam sempre."}
                actionLabel={search ? "Limpar busca" : undefined}
                onAction={search ? () => setQuery("") : undefined}
              />
            )
          }
        />
      ) : (
        <FlatList<Booking>
          style={styles.flex}
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingRow
              item={item}
              cancellingId={cancellingId}
              onCancel={confirmCancel}
              onPay={handlePayBooking}
              onJoin={handleJoinRoom}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={bookingsRefreshing}
              onRefresh={() => void loadBookings("refresh")}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          ListHeaderComponent={
            bookingsError && bookings.length > 0 ? (
              <View style={styles.banner}>
                <ErrorBox compact message={bookingsError} onRetry={() => void loadBookings("refresh")} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            bookingsLoading ? (
              <LoadingList label="Carregando suas sessões..." />
            ) : bookingsError ? (
              <ErrorBox message={bookingsError} onRetry={() => void loadBookings("initial")} />
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="Nenhuma sessão agendada"
                message="Encontre um mentor e agende sua mentoria 1:1."
                actionLabel="Encontrar mentores"
                onAction={() => setSegment("mentores")}
              />
            )
          }
        />
      )}
    </Screen>
  );
}

/* --------------------------- Subcomponentes ---------------------------- */

function SegmentButton({
  label,
  icon,
  active,
  count,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  count?: number;
  onPress: () => void;
}) {
  const styles = makeStyles();
  return (
    <TouchableOpacity
      style={[styles.segment, active ? styles.segmentActive : null]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={15} color={active ? theme.colors.accent : theme.colors.textFaint} />
      <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]} numberOfLines={1}>
        {label}
      </Text>
      {typeof count === "number" && count > 0 ? (
        <View style={[styles.segmentCount, active ? styles.segmentCountActive : null]}>
          <Text style={[styles.segmentCountText, active ? styles.segmentCountTextActive : null]}>
            {count}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

/**
 * true quando a sessão está EM ANDAMENTO agora (startsAt até +durationMin).
 * Datas naive local — new Date("YYYY-MM-DDTHH:mm") cai no fuso local do aparelho.
 */
function isLiveNow(booking: Booking): boolean {
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") return false;
  const p = parseNaive(booking.startsAt);
  if (!p) return false;
  const start = new Date(p.y, p.m - 1, p.d, p.hh, p.mm);
  const end = new Date(start.getTime() + booking.durationMin * 60000);
  const now = new Date();
  return now >= start && now <= end;
}

function BookingRow({
  item,
  cancellingId,
  onCancel,
  onPay,
  onJoin,
}: {
  item: Booking;
  cancellingId: string | null;
  onCancel: (booking: Booking) => void;
  onPay: (booking: Booking) => void;
  onJoin: (booking: Booking) => void;
}) {
  const styles = makeStyles();
  const cancellable = item.status === "PENDING" || item.status === "CONFIRMED";
  const payPending = cancellable && item.price > 0 && !item.paid;
  const cancelling = cancellingId === item.id;
  const live = isLiveNow(item);
  const joinable = cancellable;
  return (
    <View style={[styles.bookingCard, live ? styles.bookingCardLive : null]}>
      <Avatar uri={item.mentor.avatarUrl} name={item.mentor.name} size={46} />
      <View style={styles.bookingInfo}>
        <View style={styles.bookingTopRow}>
          <Text style={styles.bookingName} numberOfLines={1}>
            {item.mentor.name}
          </Text>
          <StatusPill status={item.status} />
        </View>
        <Text style={styles.bookingTopic} numberOfLines={2}>
          {item.topic}
        </Text>
        <Text style={styles.bookingWhen}>
          {formatNaiveLong(item.startsAt)} · {item.durationMin} min
        </Text>
        {item.price > 0 ? (
          <Text style={styles.bookingPrice}>
            {formatPrice(item.price)}
            {item.paid ? " · pago ✓" : ""}
          </Text>
        ) : null}
        {live ? (
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO AGORA</Text>
          </View>
        ) : null}
        {live ? (
          <TouchableOpacity
            style={styles.joinLiveButton}
            onPress={() => onJoin(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Entrar na reunião com ${item.mentor.name}`}
          >
            <Ionicons name="videocam" size={16} color={theme.colors.onAccent} />
            <Text style={styles.joinLiveButtonText}>Entrar na reunião</Text>
          </TouchableOpacity>
        ) : null}
        {payPending ? (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => onPay(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Pagar sessão com ${item.mentor.name}`}
          >
            <Ionicons name="card-outline" size={15} color={theme.colors.onAccent} />
            <Text style={styles.payButtonText}>Pagar agora</Text>
          </TouchableOpacity>
        ) : null}
        {joinable && !live ? (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => onJoin(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Abrir a sala de reunião com ${item.mentor.name}`}
          >
            <Ionicons name="videocam-outline" size={15} color={theme.colors.accent} />
            <Text style={styles.joinButtonText}>Entrar na sala de reunião</Text>
          </TouchableOpacity>
        ) : null}
        {cancellable ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => onCancel(item)}
            disabled={cancelling}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Cancelar sessão com ${item.mentor.name}`}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={theme.colors.danger} />
            ) : (
              <Ionicons name="close-circle-outline" size={15} color={theme.colors.danger} />
            )}
            <Text style={styles.cancelText}>Cancelar sessão</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------- Estilos ------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    segmentRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
  },
  segmentText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  segmentTextActive: { color: theme.colors.accent },
  segmentCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
  },
  segmentCountActive: { backgroundColor: theme.colors.accentStrong },
  segmentCountText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: "700" },
  segmentCountTextActive: { color: theme.colors.onAccent },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: { gap: theme.spacing.md, marginBottom: theme.spacing.md },
  banner: { marginTop: -2 },
  bookingCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
  },
  bookingCardLive: {
    borderColor: theme.colors.accentBorder,
    borderWidth: 1.5,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
  },
  liveText: { color: theme.colors.accent, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.6 },
  joinLiveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    marginTop: 6,
  },
  joinLiveButtonText: { color: theme.colors.onAccent, fontSize: 14, fontWeight: "800" },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    marginTop: 2,
  },
  joinButtonText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
  bookingInfo: { flex: 1, gap: 4, marginTop: theme.spacing.sm },
  bookingTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  bookingName: { color: theme.colors.text, fontSize: 14, fontWeight: "600", flex: 1 },
  bookingTopic: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 },
  bookingWhen: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600" },
  bookingPrice: { color: theme.colors.text, fontSize: 12, fontWeight: "700" },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: theme.spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
  },
  cancelText: { color: theme.colors.dangerText, fontSize: 12, fontWeight: "700" },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    marginTop: 2,
  },
  payButtonText: { color: theme.colors.onAccent, fontSize: 13, fontWeight: "800" },
});
