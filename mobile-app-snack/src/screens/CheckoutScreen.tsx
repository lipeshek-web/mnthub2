/**
 * Checkout COMPLETO dentro do app — curso pago ou sessão 1:1 com mentor.
 *
 * Fluxo:
 *   1. Resumo do item + forma de pagamento (PIX · Cartão · Boleto).
 *   2. Cupom de desconto (cursos) e CPF/CNPJ (exigido pelo gateway Asaas).
 *   3. POST /checkout:
 *      - Modo demonstração (sem gateway) → pago na hora → tela de sucesso.
 *      - Gateway real → PIX: QR Code + "copia e cola" com polling de status;
 *        Cartão/Boleto: link da fatura + polling até a confirmação.
 *   4. Sucesso → "Começar agora" devolve o controle (o CursoScreen recarrega
 *      ao voltar e mostra o curso liberado).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

import { clearPendingCheckout } from "../lib/pendingCheckout";
import {
  ApiError,
  createCheckout,
  errMessage,
  getPaymentStatus,
  getPaymentsConfig,
  validateCoupon,
  type CouponValidation,
  type PaymentsConfig,
  type PaymentMethod,
} from "../lib/api";
import { formatPrice } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";

/* --------------------------------- Rota ----------------------------------- */

export interface CheckoutParams {
  kind: "course" | "booking";
  itemId: string;
  title: string;
  price: number;
  mentorName?: string;
  mentorAvatarUrl?: string | null;
}

/* -------------------------------- Helpers --------------------------------- */

/** Máscara progressiva de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
function maskCpfCnpj(raw: string): string {
  const v = raw.replace(/\D/g, "").slice(0, 14);
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
  }
  return v
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/, "$1.$2.$3/$4-$5");
}

const METHODS: { key: PaymentMethod; label: string; icon: string; hint: string }[] = [
  { key: "PIX", label: "PIX", icon: "qr-code-outline", hint: "Aprovação em minutos" },
  { key: "CREDIT_CARD", label: "Cartão de crédito", icon: "card-outline", hint: "Visa, Master, Elo" },
  { key: "BOLETO", label: "Boleto", icon: "document-text-outline", hint: "Até 3 dias úteis" },
];

/* -------------------------------- Tela ------------------------------------ */

type Stage = "form" | "pix" | "waiting" | "success";

export default function CheckoutScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, CheckoutParams>, string>>();
  const params = route.params!;
  const { kind, itemId, title, price, mentorName, mentorAvatarUrl } = params;

  const [config, setConfig] = useState<PaymentsConfig | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [cpf, setCpf] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>("form");
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [pixImage, setPixImage] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Config de checkout (gateway real ou demonstração) */
  useEffect(() => {
    let alive = true;
    getPaymentsConfig()
      .then((c) => {
        if (alive) setConfig(c);
      })
      .catch(() => {
        if (alive) setConfig({ gateway: "SIMULADO", env: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Para o polling ao sair da tela */
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, Math.round((price - discount) * 100) / 100);
  const gatewayActive = config?.gateway === "ASAAS";
  const cpfDigits = cpf.replace(/\D/g, "");

  /** Verifica o estado da cobrança (o servidor sincroniza com o Asaas). */
  const checkPayment = useCallback(async (id: string) => {
    try {
      setCheckingPayment(true);
      const res = await getPaymentStatus(id);
      if (res.status === "PAID" || res.orderStatus === "PAID") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setStage("success");
        if (kind === "course") void clearPendingCheckout();
      }
    } catch {
      // Falha pontual de rede — tenta de novo no próximo ciclo
    } finally {
      setCheckingPayment(false);
    }
  }, [kind]);

  /** Inicia o polling automático do pagamento pendente. */
  function startPolling(id: string) {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(() => void checkPayment(id), 4000);
  }

  async function applyCoupon() {
    if (!couponCode.trim() || kind !== "course") return;
    setCheckingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCoupon({ code: couponCode.trim(), courseId: itemId });
      setCoupon(res);
    } catch (err) {
      setCoupon(null);
      setCouponError(err instanceof ApiError ? err.message : "Cupom inválido.");
    } finally {
      setCheckingCoupon(false);
    }
  }

  async function handlePay() {
    if (purchasing) return;
    if (gatewayActive && cpfDigits.length < 11) {
      setError("Informe seu CPF/CNPJ para o pagamento (exigido pelo gateway).");
      return;
    }
    setPurchasing(true);
    setError(null);
    try {
      const res = await createCheckout({
        ...(kind === "course" ? { courseId: itemId } : { bookingId: itemId }),
        paymentMethod: method,
        couponCode: coupon?.code,
        cpfCnpj: gatewayActive ? cpfDigits : undefined,
      });

      if ("order" in res && res.order.status === "PAID") {
        // Modo demonstração (ou valor zerado): liberado na hora.
        setStage("success");
        if (kind === "course") void clearPendingCheckout();
        return;
      }

      if ("pending" in res && res.pending) {
        setPaymentId(res.payment.id);
        setInvoiceUrl(res.payment.invoiceUrl);
        if (res.payment.pix) {
          setPixPayload(res.payment.pix.payload);
          setPixImage(
            res.payment.pix.encodedImage.startsWith("data:")
              ? res.payment.pix.encodedImage
              : `data:image/png;base64,${res.payment.pix.encodedImage}`
          );
          setStage("pix");
        } else {
          setStage("waiting");
        }
        startPolling(res.payment.id);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Já tem acesso — trata como sucesso
        setStage("success");
        if (kind === "course") void clearPendingCheckout();
        return;
      }
      setError(errMessage(err));
    } finally {
      setPurchasing(false);
    }
  }

  async function copyPixPayload() {
    if (!pixPayload) return;
    try {
      await Clipboard.setStringAsync(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível — o payload continua visível p/ seleção */
    }
  }

  /* ------------------------------- Sucesso -------------------------------- */

  if (stage === "success") {
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <ScreenHeader title="Pagamento" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-sharp" size={40} color={theme.colors.accent} />
            </View>
            <Text style={styles.successTitle}>Pagamento confirmado!</Text>
            <Text style={styles.successText}>
              {kind === "course"
                ? "Seu acesso ao curso foi liberado. Bons estudos! 🚀"
                : "Sua sessão foi paga. O mentor vai confirmar e você será notificado."}
            </Text>
            {mentorName ? <Text style={styles.successMuted}>Item: {title}</Text> : null}
            <TouchableOpacity
              style={styles.cta}
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Começar agora"
            >
              <Text style={styles.ctaText}>
                {kind === "course" ? "Começar a estudar" : "Voltar às mentorias"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  /* ---------------------------- PIX / aguardando --------------------------- */

  if (stage === "pix" || stage === "waiting") {
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <ScreenHeader
          title={stage === "pix" ? "Pagar com PIX" : "Aguardando pagamento"}
          onBack={() => {
            if (pollTimer.current) clearInterval(pollTimer.current);
            navigation.goBack();
          }}
        />
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {stage === "pix" && pixImage ? (
              <>
                <View style={styles.qrWrap}>
                  <Image source={{ uri: pixImage }} style={styles.qrImage} resizeMode="contain" />
                </View>
                <Text style={styles.pixHint}>
                  Abra o app do seu banco, escolha pagar com PIX e escaneie o código:
                </Text>
                <View style={styles.pixPayloadBox}>
                  <Text style={styles.pixPayload} numberOfLines={3} selectable>
                    {pixPayload}
                  </Text>
                </View>
                <TouchableOpacity style={styles.copyButton} activeOpacity={0.85} onPress={() => void copyPixPayload()}>
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={theme.colors.accent} />
                  <Text style={styles.copyButtonText}>
                    {copied ? "Código copiado!" : "Copiar código PIX (copia e cola)"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.waitingIconWrap}>
                  <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
                <Text style={styles.pixHint}>
                  {method === "BOLETO"
                    ? "Seu boleto foi gerado. Após o pagamento, o acesso é liberado em até 3 dias úteis."
                    : "Aguardando a confirmação do pagamento no gateway. Você pode abrir a fatura abaixo."}
                </Text>
              </>
            )}

            {invoiceUrl ? (
              <TouchableOpacity
                style={styles.ghostButton}
                activeOpacity={0.85}
                onPress={() => void Linking.openURL(invoiceUrl).catch(() => {})}
              >
                <Text style={styles.ghostButtonText}>Abrir fatura no navegador</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.checkingRow}>
              <ActivityIndicator size="small" color={theme.colors.textFaint} />
              <Text style={styles.checkingText}>
                {checkingPayment ? "Verificando pagamento..." : "Verificando automaticamente a cada poucos segundos"}
              </Text>
            </View>
            {paymentId ? (
              <TouchableOpacity
                style={styles.cta}
                activeOpacity={0.85}
                disabled={checkingPayment}
                onPress={() => void checkPayment(paymentId)}
              >
                <Text style={styles.ctaText}>Já paguei — verificar agora</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.totalLine}>
              Valor: <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </Text>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  /* -------------------------------- Formulário ----------------------------- */

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <ScreenHeader title="Finalizar compra" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        {/* Resumo do item */}
        <View style={styles.card}>
          <View style={styles.itemRow}>
            <View style={styles.itemIconWrap}>
              <Ionicons
                name={kind === "course" ? "play-circle-outline" : "videocam-outline"}
                size={22}
                color={theme.colors.accent}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {title}
              </Text>
              {mentorName ? (
                <View style={styles.mentorRow}>
                  <Avatar uri={mentorAvatarUrl ?? null} name={mentorName} size={18} />
                  <Text style={styles.itemMentor}>{mentorName}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>{formatPrice(price)}</Text>
          </View>
          {kind === "booking" ? (
            <Text style={styles.itemNote}>
              Você paga agora a sessão 1:1; o acesso à sala é liberado após a confirmação do mentor.
            </Text>
          ) : null}
        </View>

        {/* Forma de pagamento */}
        <Text style={styles.sectionTitle}>Forma de pagamento</Text>
        <View style={styles.card}>
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.methodRow, active && styles.methodRowActive]}
                activeOpacity={0.8}
                onPress={() => setMethod(m.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={m.label}
              >
                <Ionicons name={m.icon as any} size={22} color={active ? theme.colors.accent : theme.colors.textMuted} />
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodLabel, active && { color: theme.colors.accent }]}>{m.label}</Text>
                  <Text style={styles.methodHint}>{m.hint}</Text>
                </View>
                <Ionicons
                  name={active ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={active ? theme.colors.accent : theme.colors.borderStrong}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Modo demonstração */}
        {config && !gatewayActive ? (
          <View style={styles.demoBox}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
            <Text style={styles.demoText}>
              Modo demonstração: a compra é aprovada na hora, sem cobrança real.
            </Text>
          </View>
        ) : null}

        {/* CPF/CNPJ (exigido pelo gateway) */}
        {gatewayActive ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CPF ou CNPJ do pagador</Text>
            <TextInput
              style={styles.input}
              value={cpf}
              onChangeText={(t) => setCpf(maskCpfCnpj(t))}
              placeholder="000.000.000-00"
              placeholderTextColor={theme.colors.textFaint}
              keyboardType="number-pad"
              maxLength={18}
            />
          </View>
        ) : null}

        {/* Cupom (apenas cursos — o gateway não aceita cupom em sessão) */}
        {kind === "course" ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Cupom de desconto</Text>
            <View style={styles.couponRow}>
              <TextInput
                style={[styles.input, styles.couponInput]}
                value={couponCode}
                onChangeText={(t) => {
                  setCouponCode(t.toUpperCase());
                  setCoupon(null);
                  setCouponError(null);
                }}
                placeholder="Ex.: BEMVINDO10"
                placeholderTextColor={theme.colors.textFaint}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.applyButton, (!couponCode.trim() || checkingCoupon) && styles.applyButtonDisabled]}
                activeOpacity={0.85}
                disabled={!couponCode.trim() || checkingCoupon}
                onPress={() => void applyCoupon()}
              >
                {checkingCoupon ? (
                  <ActivityIndicator size="small" color={theme.colors.onAccent} />
                ) : (
                  <Text style={styles.applyButtonText}>Aplicar</Text>
                )}
              </TouchableOpacity>
            </View>
            {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}
            {coupon ? (
              <View style={styles.couponOk}>
                <Ionicons name="pricetag" size={15} color={theme.colors.accent} />
                <Text style={styles.couponOkText}>
                  {coupon.code} aplicado — desconto de {formatPrice(coupon.discount)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Resumo do valor */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor do {kind === "course" ? "curso" : "item"}</Text>
            <Text style={styles.summaryValue}>{formatPrice(price)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Desconto ({coupon?.code})</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.accent }]}>- {formatPrice(discount)}</Text>
            </View>
          ) : null}
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={17} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.cta, purchasing && styles.ctaDisabled]}
          activeOpacity={0.85}
          disabled={purchasing}
          onPress={() => void handlePay()}
          accessibilityRole="button"
          accessibilityLabel="Confirmar pagamento"
        >
          {purchasing ? (
            <ActivityIndicator size="small" color={theme.colors.onAccent} />
          ) : (
            <Text style={styles.ctaText}>
              {total <= 0 ? "Concluir gratuitamente" : `Pagar ${formatPrice(total)}`}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.safeRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.textFaint} />
          <Text style={styles.safeText}>
            {gatewayActive
              ? "Pagamento processado pelo gateway seguro (Asaas). O MentorHub não armazena dados do cartão."
              : "Ambiente de demonstração — nenhuma cobrança será feita."}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* -------------------------------- Estilos --------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
    formContent: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },

    /* Item */
    itemRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
    itemIconWrap: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    itemInfo: { flex: 1, gap: 4 },
    itemTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "700", lineHeight: 20 },
    mentorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    itemMentor: { color: theme.colors.textMuted, fontSize: 12.5 },
    itemPrice: { color: theme.colors.accent, fontSize: 16, fontWeight: "800" },
    itemNote: { color: theme.colors.textFaint, fontSize: 12.5, lineHeight: 18 },

    /* Métodos */
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 4,
    },
    methodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    methodRowActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentSoft },
    methodInfo: { flex: 1 },
    methodLabel: { color: theme.colors.text, fontSize: 15, fontWeight: "700" },
    methodHint: { color: theme.colors.textFaint, fontSize: 12 },

    /* Campos */
    fieldGroup: { gap: theme.spacing.sm },
    fieldLabel: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },
    input: {
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      fontSize: 15,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
    },
    couponRow: { flexDirection: "row", gap: theme.spacing.sm },
    couponInput: { flex: 1 },
    applyButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 46,
    },
    applyButtonDisabled: { opacity: 0.5 },
    applyButtonText: { color: theme.colors.onAccent, fontWeight: "800", fontSize: 14 },
    couponError: { color: theme.colors.danger, fontSize: 12.5 },
    couponOk: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.colors.accentSoft,
      borderColor: theme.colors.accentBorder,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
    },
    couponOkText: { color: theme.colors.accent, fontSize: 12.5, fontWeight: "700", flex: 1 },

    /* Demo + segurança */
    demoBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.colors.infoSoft,
      borderColor: theme.colors.infoBorder,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
    },
    demoText: { color: theme.colors.info, fontSize: 12.5, flex: 1, lineHeight: 18 },
    safeRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: theme.spacing.sm },
    safeText: { color: theme.colors.textFaint, fontSize: 11.5, flex: 1, lineHeight: 16 },

    /* Resumo */
    summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    summaryLabel: { color: theme.colors.textMuted, fontSize: 14 },
    summaryValue: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
    summaryTotalRow: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
    },
    summaryTotalLabel: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
    summaryTotalValue: { color: theme.colors.accent, fontSize: 19, fontWeight: "800" },

    /* CTA + erro */
    cta: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.lg,
    },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { color: theme.colors.onAccent, fontWeight: "800", fontSize: 16 },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.colors.dangerSoft,
      borderColor: theme.colors.dangerBorder,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
    },
    errorText: { color: theme.colors.danger, fontSize: 13, flex: 1, lineHeight: 18 },

    /* PIX */
    qrWrap: {
      alignItems: "center",
      backgroundColor: theme.colors.white,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    },
    qrImage: { width: 230, height: 230 },
    pixHint: { color: theme.colors.textMuted, fontSize: 13.5, lineHeight: 19, textAlign: "center" },
    pixPayloadBox: {
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    pixPayload: { color: theme.colors.textMuted, fontSize: 11.5, lineHeight: 16 },
    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.colors.accent,
      paddingVertical: 12,
    },
    copyButtonText: { color: theme.colors.accent, fontWeight: "800", fontSize: 13.5 },
    waitingIconWrap: { alignItems: "center", paddingVertical: theme.spacing.xl },
    checkingRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
    checkingText: { color: theme.colors.textFaint, fontSize: 12, flex: 1 },
    ghostButton: {
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.colors.borderStrong,
      paddingVertical: 12,
      alignItems: "center",
    },
    ghostButtonText: { color: theme.colors.text, fontWeight: "700", fontSize: 13.5 },
    totalLine: { color: theme.colors.textMuted, fontSize: 13, textAlign: "center" },
    totalValue: { color: theme.colors.text, fontWeight: "800", fontSize: 15 },

    /* Sucesso */
    successContent: { padding: theme.spacing.xl, gap: theme.spacing.lg },
    successCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      alignItems: "center",
      gap: theme.spacing.md,
    },
    successIconWrap: {
      width: 84,
      height: 84,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 2,
      borderColor: theme.colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    successTitle: { color: theme.colors.text, fontSize: 21, fontWeight: "800", textAlign: "center" },
    successText: { color: theme.colors.textMuted, fontSize: 14.5, textAlign: "center", lineHeight: 21 },
    successMuted: { color: theme.colors.textFaint, fontSize: 12.5, textAlign: "center" },
  });
