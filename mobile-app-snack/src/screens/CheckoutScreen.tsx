/**
 * Checkout DENTRO do app — compra completa sem sair do MentorHub.
 *
 * Dois modos (params):
 *  - curso (padrão): { id } → resumo do curso → forma de pagamento (PIX
 *    recomendado, cartão ou boleto) → CPF/CNPJ (exigido pelo gateway) → cupom
 *    e créditos opcionais → criar cobrança na API (/api/v1/checkout) →
 *      - PAID imediato (cupom 100%, créditos ou modo demonstração) → sucesso;
 *      - PENDING + PIX → QR Code + copia e cola + verificação automática
 *        (GET /api/v1/payments/status a cada 4s) até cair → matrícula liberada;
 *      - PENDING cartão/boleto → fatura no navegador + mesma verificação.
 *  - sessão 1:1: { kind: "booking", itemId, title, price, mentorName,
 *    mentorAvatarUrl } → mesmo fluxo de cobrança com bookingId — chamado do
 *    sucesso do agendamento (Mentor) ou do botão "Pagar agora" (Mentorias).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import {
  ApiError,
  checkoutBooking,
  checkoutCourse,
  errMessage,
  getCourse,
  getMe,
  getPaymentStatus,
  isMissingEndpoint,
  SERVER_OUTDATED_MESSAGE,
  type CheckoutBillingType,
  type CheckoutPaymentInfo,
  type CourseDetailResponse,
} from "../lib/api";
import { useBackStage, useSafeBack } from "../lib/navigation";
import { useTabs } from "../lib/tabs";
import { requestSessionsSegment } from "../lib/uiHints";
import { clearPendingCheckout } from "../lib/pendingCheckout";
import { formatPrice } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { RemoteImage } from "../components/RemoteImage";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";

const METHODS: Array<{ id: CheckoutBillingType; label: string; icon: keyof typeof Ionicons.glyphMap; hint: string }> = [
  { id: "PIX", label: "PIX", icon: "flash-outline", hint: "Cai na hora · recomendado" },
  { id: "CREDIT_CARD", label: "Cartão", icon: "card-outline", hint: "Fatura do gateway" },
  { id: "BOLETO", label: "Boleto", icon: "receipt-outline", hint: "Até 3 dias úteis" },
];

/** Máscara leve: 000.000.000-00 ou 00.000.000/0000-00 conforme digita. */
function maskCpfCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export default function CheckoutScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const goBack = useSafeBack(navigation);
  const { setTab } = useTabs();
  const params = (useRoute<any>().params ?? {}) as {
    id?: string;
    kind?: string;
    itemId?: string;
    title?: string;
    price?: number;
    mentorName?: string;
    mentorAvatarUrl?: string | null;
  };
  // kind "booking" = pagamento de sessão 1:1; sem kind = compra de curso.
  const isBooking = params.kind === "booking";
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const bookingId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;

  const [detail, setDetail] = useState<CourseDetailResponse | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [method, setMethod] = useState<CheckoutBillingType>("PIX");
  const [cpf, setCpf] = useState("");
  const [coupon, setCoupon] = useState("");
  const [useCredits, setUseCredits] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [payment, setPayment] = useState<CheckoutPaymentInfo | null>(null);
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isBooking) {
        // Sessão 1:1 — o resumo inteiro vem nos params; só buscamos créditos.
        if (!bookingId) throw new Error("Sessão não encontrada.");
        const me = await getMe().catch(() => null);
        setCredits(me?.user?.creditCents ?? 0);
      } else {
        if (!courseId) return;
        const [res, me] = await Promise.all([getCourse(courseId), getMe().catch(() => null)]);
        setDetail(res);
        setCredits(me?.user?.creditCents ?? 0);
      }
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId, bookingId, isBooking]);

  useEffect(() => {
    void load();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  const course = detail?.course ?? null;
  // Resumo unificado curso/sessão — o formulário é o mesmo.
  const itemTitle = isBooking ? params.title ?? "Sessão 1:1" : course?.title ?? "";
  const itemPrice = isBooking ? Math.max(0, params.price ?? 0) : course ? course.price : 0;
  const total = itemPrice;

  /* Botão nativo do Android: na tela do PIX/fatura volta ao FORMULÁRIO
     (em vez de desempilhar o checkout inteiro); no formulário, pop normal. */
  useBackStage(true, useCallback(() => {
    if (payment) {
      setPayment(null);
      return true;
    }
    return false;
  }, [payment]));

  /** Verifica o status da cobrança; libera a matrícula quando PAID. */
  const checkStatus = useCallback(
    async (paymentId: string, silent = false) => {
      if (!silent) setChecking(true);
      try {
        const res = await getPaymentStatus(paymentId);
        if (res.status === "PAID" || res.orderStatus === "PAID") {
          setPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
          void clearPendingCheckout();
        } else if (res.orderStatus === "CANCELED") {
          if (pollRef.current) clearInterval(pollRef.current);
          Alert.alert("Cobrança cancelada", "A cobrança não foi concluída. Tente novamente.");
          setPayment(null);
        }
      } catch {
        // Falha pontual de rede: mantém pendente e tenta de novo no próximo ciclo
      } finally {
        if (!silent) setChecking(false);
      }
    },
    []
  );

  // Polling automático a cada 4s enquanto houver cobrança pendente.
  useEffect(() => {
    if (!payment || paid) return;
    void checkStatus(payment.id, true);
    pollRef.current = setInterval(() => void checkStatus(payment.id, true), 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [payment, paid, checkStatus]);

  async function handleSubmit() {
    if (submitting || paid) return;
    if (isBooking ? !bookingId : !course) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const digits = cpf.replace(/\D/g, "");
      const common = {
        paymentMethod: method,
        cpfCnpj: digits || undefined,
        couponCode: coupon.trim() || undefined,
        useCredits: useCredits && credits > 0,
      };
      const res = isBooking
        ? await checkoutBooking({ bookingId: bookingId!, ...common })
        : await checkoutCourse({ courseId: course!.id, ...common });
      if ("pending" in res && res.pending) {
        setPayment(res.payment);
        if (res.order.status === "PAID") {
          setPaid(true);
          void clearPendingCheckout();
        }
      } else if (res.order.status === "PAID") {
        setPaid(true);
        void clearPendingCheckout();
      }
    } catch (err) {
      // Servidor sem as rotas novas (site desatualizado): instrução clara em
      // vez de "Conteúdo não encontrado".
      setFormError(isMissingEndpoint(err) ? SERVER_OUTDATED_MESSAGE : errMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Copia o código PIX — SEM expo-clipboard (a dependência derrubava o app no
   * Snack com "Unable to resolve module 'expo-clipboard.js'").
   *
   * - Web (preview do Snack): usa o clipboard do navegador (navigator.clipboard).
   * - Nativo/sem clipboard: o código fica num texto SELECIONÁVEL logo abaixo,
   *   então o usuário copia manualmente com o toque longo do sistema.
   */
  async function copyPixPayload() {
    const payload = payment?.pix?.payload;
    if (!payload) return;
    try {
      const nav = (globalThis as unknown as {
        navigator?: { clipboard?: { writeText?: (text: string) => Promise<void> } };
      }).navigator;
      if (typeof nav?.clipboard?.writeText !== "function") throw new Error("clipboard-indisponivel");
      await nav.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      Alert.alert(
        "Copie manualmente",
        "Toque no código PIX abaixo, segure e use \u201cCopiar\u201d (ou selecione tudo e copie)."
      );
    }
  }

  async function openInvoice(url: string) {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Não foi possível abrir a fatura", "Tente novamente em instantes.");
    }
  }

  /* ------------------------------- Render ------------------------------- */

  if (loading) {
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <ScreenHeader
            title="Checkout"
            subtitle={itemTitle || undefined}
            onBack={goBack}
          />
        <LoadingList label="Preparando o pagamento..." />
      </Screen>
    );
  }
  if (error || (!isBooking && !course)) {
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <ScreenHeader
            title="Checkout"
            subtitle={itemTitle || undefined}
            onBack={goBack}
          />
        <ErrorBox
          message={error ?? "Curso não encontrado."}
          onRetry={() => void load()}
        />
      </Screen>
    );
  }

  /* ---------------------------- Sucesso (PAID) ---------------------------- */
  if (paid) {
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={44} color={theme.colors.onAccent} />
          </View>
          <Text style={styles.successTitle}>
            {isBooking ? "Sessão confirmada!" : "Pagamento confirmado!"}
          </Text>
          {isBooking ? (
            <Text style={styles.successText}>
              O pagamento da sua sessão com{"\n"}
              <Text style={styles.successCourse}>{params.mentorName ?? "o mentor"}</Text>{"\n"}
              caiu certinho. Até lá!
            </Text>
          ) : (
            <Text style={styles.successText}>
              Sua inscrição em{"\n"}
              <Text style={styles.successCourse}>{course?.title}</Text>{"\n"}
              está liberada. Bons estudos!
            </Text>
          )}
          <TouchableOpacity
            style={styles.cta}
            onPress={() => {
              if (isBooking) {
                // Aba Mentorias ativa + desempilha tudo para revelar o pager
                // direto no segmento "Minhas sessões" (agora com a sessão paga).
                requestSessionsSegment();
                setTab("Mentorias");
                navigation.popToTop();
              } else {
                // Pilha final [Main, Curso]: voltar da aula não reabre a página
                // de venda nem o checkout concluído. (reset() quebra no stack JS
                // do react-navigation — popToTop + navigate é o caminho seguro.)
                navigation.popToTop();
                navigation.navigate("Curso", { id: course!.id });
              }
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isBooking ? "Ver minhas sessões" : "Começar a estudar agora"}
          >
            <Text style={styles.ctaText}>
              {isBooking ? "Ver minhas sessões" : "Começar a estudar"}
            </Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  /* ------------------- Cobrança pendente (PIX/fatura) ------------------- */
  if (payment) {
    const sandbox = (payment.env ?? "").toUpperCase().includes("SANDBOX");
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <ScreenHeader
          title={payment.billingType === "PIX" ? "Pagar com PIX" : "Fatura"}
          subtitle={itemTitle || undefined}
          onBack={() => {
            setPayment(null);
          }}
        />
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {sandbox ? (
            <View style={styles.sandboxBadge}>
              <Ionicons name="beaker-outline" size={13} color={theme.colors.info} />
              <Text style={styles.sandboxText}>Ambiente de teste (sandbox)</Text>
            </View>
          ) : null}

          {payment.pix ? (
            <>
              <View style={styles.qrCard}>
                <Image
                  source={{ uri: `data:image/png;base64,${payment.pix.encodedImage}` }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  accessibilityLabel="QR Code PIX"
                />
                <Text style={styles.qrHint}>Abra o app do seu banco e escaneie o QR Code</Text>
              </View>

              <Text style={styles.pixLabel}>PIX copia e cola</Text>
              {/* selectable: copia manual funciona em web (seleção com mouse) e
                  nativo (toque longo), sem nenhuma dependência extra. */}
              <View style={styles.pixBox}>
                <Text selectable style={styles.pixPayload} numberOfLines={4} ellipsizeMode="middle">
                  {payment.pix.payload}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.copyButton, copied && styles.copyButtonDone]}
                onPress={() => void copyPixPayload()}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Copiar código PIX"
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={16}
                  color={copied ? theme.colors.onAccent : theme.colors.accent}
                />
                <Text style={[styles.copyText, copied && styles.copyTextDone]}>
                  {copied ? "Código copiado!" : "Copiar código PIX"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.invoiceCard}>
                <Ionicons name="receipt-outline" size={26} color={theme.colors.accent} />
                <Text style={styles.invoiceTitle}>
                  {payment.billingType === "BOLETO" ? "Boleto gerado" : "Fatura do cartão gerada"}
                </Text>
                <Text style={styles.invoiceText}>
                  {payment.billingType === "BOLETO"
                    ? "Pague o boleto no seu banco — o acesso é liberado após a compensação."
                    : "Conclua o pagamento na fatura — o acesso é liberado após a confirmação."}
                </Text>
                {payment.invoiceUrl ? (
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => void openInvoice(payment.invoiceUrl!)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir fatura"
                  >
                    <Ionicons name="open-outline" size={16} color={theme.colors.accent} />
                    <Text style={styles.copyText}>Abrir fatura</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          )}

          <View style={styles.waitCard}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
            <View style={styles.waitInfo}>
              <Text style={styles.waitTitle}>Aguardando pagamento…</Text>
              <Text style={styles.waitText}>
                Verificamos automaticamente a cada poucos segundos. Assim que cair, sua
                inscrição é liberada aqui mesmo.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => void checkStatus(payment.id)}
            disabled={checking}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Verificar pagamento agora"
          >
            {checking ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <Ionicons name="refresh" size={16} color={theme.colors.accent} />
            )}
            <Text style={styles.refreshText}>Verificar agora</Text>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    );
  }

  /* ------------------------------ Formulário ------------------------------ */
  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <ScreenHeader
            title="Checkout"
            subtitle={itemTitle || undefined}
            onBack={goBack}
          />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumo do item (curso ou sessão 1:1) */}
        <View style={styles.summaryCard}>
          {isBooking ? (
            <>
              <Avatar uri={params.mentorAvatarUrl ?? null} name={params.mentorName ?? "?"} size={56} />
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryKind}>Sessão 1:1 · 60 min</Text>
                <Text style={styles.summaryTitle} numberOfLines={2}>
                  {itemTitle}
                </Text>
                {params.mentorName ? (
                  <Text style={styles.summaryMentorName} numberOfLines={1}>
                    com {params.mentorName}
                  </Text>
                ) : null}
              </View>
            </>
          ) : (
            <>
              <RemoteImage
                uri={course!.coverUrl}
                style={summaryThumb}
                recyclingKey={course!.id}
                fallbackIcon="play-circle-outline"
                errorIcon="image-outline"
                iconSize={20}
              />
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle} numberOfLines={2}>
                  {course!.title}
                </Text>
                <View style={styles.summaryMentor}>
                  <Avatar uri={course!.mentor.avatarUrl} name={course!.mentor.name} size={18} />
                  <Text style={styles.summaryMentorName} numberOfLines={1}>
                    {course!.mentor.name}
                  </Text>
                </View>
              </View>
            </>
          )}
          <Text style={styles.summaryPrice}>{formatPrice(total)}</Text>
        </View>

        {formError ? <ErrorBox message={formError} /> : null}

        {/* Forma de pagamento */}
        <Text style={styles.sectionTitle}>Forma de pagamento</Text>
        <View style={styles.methods}>
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodCard, active && styles.methodCardActive]}
                onPress={() => setMethod(m.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Pagar com ${m.label}`}
              >
                <View style={styles.methodTop}>
                  <Ionicons
                    name={m.icon}
                    size={18}
                    color={active ? theme.colors.accent : theme.colors.textMuted}
                  />
                  <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>
                    {m.label}
                  </Text>
                </View>
                <Text style={styles.methodHint}>{m.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CPF/CNPJ */}
        <Text style={styles.sectionTitle}>CPF ou CNPJ do pagador</Text>
        <TextInput
          style={styles.input}
          value={cpf}
          onChangeText={(t) => setCpf(maskCpfCnpj(t))}
          placeholder="000.000.000-00"
          placeholderTextColor={theme.colors.textFaint}
          keyboardType="number-pad"
          maxLength={18}
          accessibilityLabel="CPF ou CNPJ do pagador"
        />
        <Text style={styles.inputHint}>
          Necessário para o gateway processar o pagamento com segurança.
        </Text>

        {/* Cupom */}
        <Text style={styles.sectionTitle}>Cupom de desconto (opcional)</Text>
        <TextInput
          style={styles.input}
          value={coupon}
          onChangeText={(t) => setCoupon(t.toUpperCase())}
          placeholder="Ex.: BEMVINDO10"
          placeholderTextColor={theme.colors.textFaint}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={40}
          accessibilityLabel="Código do cupom"
        />

        {/* Créditos */}
        {credits > 0 ? (
          <>
            <TouchableOpacity
              style={styles.creditRow}
              onPress={() => setUseCredits((v) => !v)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: useCredits }}
              accessibilityLabel="Usar créditos de indicação"
            >
              <Ionicons
                name={useCredits ? "checkbox" : "square-outline"}
                size={20}
                color={useCredits ? theme.colors.accent : theme.colors.textFaint}
              />
              <Text style={styles.creditText}>
                Usar meus créditos de indicação ({formatPrice(credits / 100)})
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, submitting && styles.ctaDisabled]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Confirmar pagamento"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.colors.onAccent} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={15} color={theme.colors.onAccent} />
              <Text style={styles.ctaText}>
                {total > 0 ? `Pagar ${formatPrice(total)}` : "Confirmar inscrição"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.secureText}>
          Pagamento processado pelo gateway seguro do MentorHub (Asaas).
        </Text>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------- Estilos -------------------------------- */

const summaryThumb = { width: 56, height: 56, borderRadius: theme.radius.md };

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.xs,
    },

    /* Resumo */
    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    summaryInfo: { flex: 1, gap: 3 },
    summaryKind: { color: theme.colors.accent, fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
    summaryTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "700", lineHeight: 18 },
    summaryMentor: { flexDirection: "row", alignItems: "center", gap: 6 },
    summaryMentorName: { color: theme.colors.textMuted, fontSize: 12, flexShrink: 1 },
    summaryPrice: { color: theme.colors.accent, fontSize: 15, fontWeight: "800" },

    /* Seções */
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: "700",
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },

    /* Métodos */
    methods: { flexDirection: "row", gap: theme.spacing.sm },
    methodCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      gap: 4,
    },
    methodCardActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentSoft },
    methodTop: { flexDirection: "row", alignItems: "center", gap: 6 },
    methodLabel: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "700" },
    methodLabelActive: { color: theme.colors.accent },
    methodHint: { color: theme.colors.textFaint, fontSize: 10, lineHeight: 13 },

    /* Inputs */
    input: {
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
      color: theme.colors.text,
      fontSize: 15,
      minHeight: 46,
    },
    inputHint: { color: theme.colors.textFaint, fontSize: 11, marginTop: 4, lineHeight: 15 },

    /* Créditos */
    creditRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    creditText: { color: theme.colors.text, fontSize: 13, flex: 1 },

    /* Total + CTA */
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    totalLabel: { color: theme.colors.textMuted, fontSize: 14, fontWeight: "600" },
    totalValue: { color: theme.colors.text, fontSize: 20, fontWeight: "800" },
    cta: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      minHeight: 50,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { color: theme.colors.onAccent, fontSize: 15, fontWeight: "700" },
    secureText: {
      color: theme.colors.textFaint,
      fontSize: 11,
      textAlign: "center",
      marginTop: theme.spacing.sm,
    },

    /* PIX pendente */
    sandboxBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      gap: 6,
      backgroundColor: theme.colors.infoSoft,
      borderWidth: 1,
      borderColor: theme.colors.infoBorder,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 5,
    },
    sandboxText: { color: theme.colors.info, fontSize: 11, fontWeight: "600" },
    qrCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    qrImage: { width: 210, height: 210 },
    qrHint: { color: theme.colors.textMuted, fontSize: 12, textAlign: "center", lineHeight: 17 },
    pixLabel: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: "700",
      marginTop: theme.spacing.sm,
    },
    pixBox: {
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    },
    pixPayload: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17 },
    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      borderRadius: theme.radius.md,
      minHeight: 46,
      marginTop: theme.spacing.sm,
    },
    copyButtonDone: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    copyText: { color: theme.colors.accent, fontSize: 14, fontWeight: "700" },
    copyTextDone: { color: theme.colors.onAccent },

    /* Espera */
    waitCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    waitInfo: { flex: 1, gap: 3 },
    waitTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
    waitText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17 },
    refreshButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      borderRadius: theme.radius.md,
      minHeight: 46,
    },
    refreshText: { color: theme.colors.accent, fontSize: 14, fontWeight: "700" },

    /* Fatura */
    invoiceCard: {
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      marginTop: theme.spacing.md,
      width: "100%",
    },
    invoiceTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "700" },
    invoiceText: { color: theme.colors.textMuted, fontSize: 12, textAlign: "center", lineHeight: 17 },

    /* Sucesso */
    successWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    successCircle: {
      width: 84,
      height: 84,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    successTitle: { color: theme.colors.text, fontSize: 22, fontWeight: "800" },
    successText: {
      color: theme.colors.textMuted,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 21,
    },
    successCourse: { color: theme.colors.text, fontWeight: "700" },
  });
