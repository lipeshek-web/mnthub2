/**
 * Tela de login — portão de entrada da Órbita.
 *
 * Minimalista estilo iOS: no topo, a marca Órbita desenhada só com Views
 * (planeta + anel orbital + lua — o mesmo OrbitMark do splash em App.js)
 * com wordmark e tagline "Seu universo de aprendizado". Abaixo, UM card
 * com o essencial — e-mail, senha e "Entrar" — SEM servidor personalizado,
 * conta demo ou links de cadastro (o login demo continua funcionando pelo
 * formulário normal; o servidor padrão é resolvido em src/lib/api.ts).
 * Erro de login: mensagem inline em dangerSoft. Loading do botão:
 * ActivityIndicator na cor onAccent. Entrada suave via Animated (fade +
 * translateY, 400ms). Sessão sempre salva (SecureStore) — ao reabrir o app
 * o gate vai direto pra home.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { useThemeMode } from "../lib/theme";
import { errMessage } from "../lib/api";
import { theme } from "../theme";

/** Marca Órbita: planeta com anel elíptico — o mesmo padrão do App.js, só Views. */
function OrbitMark({ size = 86 }: { size?: number }) {
  const styles = makeStyles();
  const ringW = size * 1.55;
  const ringH = size * 0.56;
  return (
    <View style={[styles.markStage, { width: ringW, height: ringW }]}>
      <View style={[styles.markRing, { width: ringW, height: ringH, borderRadius: ringH / 2 }]} />
      <View
        style={[styles.markMoon, { width: size * 0.14, height: size * 0.14, borderRadius: size * 0.07 }]}
      />
      <View style={[styles.markPlanet, { width: size, height: size, borderRadius: size / 2 }]} />
    </View>
  );
}

export default function LoginScreen() {
  const styles = makeStyles();
  const { login } = useAuth();
  const { mode } = useThemeMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Entrada suave do card: fade + translateY(16px → 0), 400ms, só RN Animated.
  const entrance = useRef(new Animated.Value(0)).current;
  const cardTranslate = entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  // Roda no didMount (uma única vez).
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [entrance]);

  const canSubmit = email.trim().length > 3 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      // O gate de sessão no App.js troca para as abas automaticamente.
    } catch (err) {
      // Ex.: credenciais inválidas (401) ou conta bloqueada / com 2FA (403).
      setError(errMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Topo claro/escuro como o resto do app (sem hero colorido). */}
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          {/* Marca — planeta + anel + lua, wordmark e tagline */}
          <View style={styles.brand}>
            <OrbitMark size={86} />
            <Text style={styles.wordmark}>Órbita</Text>
            <Text style={styles.tagline}>Seu universo de aprendizado</Text>
          </View>

          {/* Card único — e-mail, senha e Entrar */}
          <Animated.View
            style={[styles.card, { opacity: entrance, transform: [{ translateY: cardTranslate }] }]}
          >
            <Text style={styles.cardTitle}>Acesse sua conta</Text>
            <Text style={styles.cardSubtitle}>Continue de onde parou.</Text>

            {/* E-mail */}
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.textFaint} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
                placeholderTextColor={theme.colors.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                textContentType="emailAddress"
                accessibilityLabel="E-mail"
              />
            </View>

            {/* Senha */}
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textFaint} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Sua senha"
                placeholderTextColor={theme.colors.textFaint}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                textContentType="password"
                onSubmitEditing={() => void handleSubmit()}
                accessibilityLabel="Senha"
              />
              <TouchableOpacity
                style={styles.eye}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={theme.colors.textFaint}
                />
              </TouchableOpacity>
            </View>

            {/* Botão primário */}
            <TouchableOpacity
              style={[styles.submit, !canSubmit && styles.submitDisabled]}
              onPress={() => void handleSubmit()}
              disabled={!canSubmit}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.onAccent} size="small" />
              ) : (
                <Text style={styles.submitText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Erro inline discreto */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Rodapé discreto */}
          <Text style={styles.footer}>
            Ao entrar você concorda com o uso responsável da plataforma.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg },
    flex: { flex: 1 },
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
    },

    /* Marca no topo */
    brand: {
      alignItems: "center",
      marginBottom: theme.spacing.xl,
    },
    markStage: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
    },
    markRing: {
      position: "absolute",
      borderWidth: 2.5,
      borderColor: theme.colors.accent,
      opacity: 0.55,
      transform: [{ rotate: "-18deg" }],
    },
    markMoon: {
      position: "absolute",
      backgroundColor: theme.colors.accent,
      opacity: 0.9,
      top: "12%",
      right: "8%",
    },
    markPlanet: {
      backgroundColor: theme.colors.accent,
      opacity: 0.28,
    },
    wordmark: {
      color: theme.colors.text,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1,
    },
    tagline: {
      color: theme.colors.textFaint,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 4,
    },

    /* Card único */
    card: {
      padding: theme.spacing.xl,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.07,
      shadowRadius: 20,
      elevation: 5,
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    cardSubtitle: {
      color: theme.colors.textMuted,
      fontSize: 13,
      fontWeight: "500",
      marginTop: 2,
      marginBottom: theme.spacing.lg,
    },

    /* Campo com ícone embutido */
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 52,
      marginBottom: theme.spacing.md,
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 15,
      paddingVertical: 14,
    },
    eye: { padding: theme.spacing.xs },

    /* Botão primário */
    submit: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.xs,
      minHeight: 52,
    },
    submitDisabled: { opacity: 0.5 },
    submitText: { color: theme.colors.onAccent, fontSize: 15, fontWeight: "700" },

    /* Erro inline (dangerSoft) */
    errorBox: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.dangerSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.dangerBorder,
    },
    errorText: {
      color: theme.colors.dangerText,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
    },

    /* Rodapé discreto */
    footer: {
      color: theme.colors.textFaint,
      fontSize: 12,
      textAlign: "center",
      marginTop: theme.spacing.lg,
    },
  });
