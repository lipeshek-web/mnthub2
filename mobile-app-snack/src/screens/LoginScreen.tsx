/**
 * Tela de login — o app mobile é apenas para alunos.
 *
 * Minimalista (Apple/Duolingo): hero com gradiente esmeralda (marca + tagline)
 * e um card flutuante com APENAS o essencial — e-mail, senha e "Entrar".
 * Nada de configuração de servidor ou credenciais de demonstração na tela:
 * o servidor padrão é resolvido automaticamente em src/lib/api.ts. Entrada
 * suave via Animated (fade + translateY, 400ms, só RN Animated). Sessão
 * sempre salva (SecureStore) — ao reabrir o app o gate vai direto pra home.
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { useThemeMode } from "../lib/theme";
import { errMessage } from "../lib/api";
import { theme } from "../theme";

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
      {/* O hero é accent nos DOIS temas: claro → verde bem escuro (texto claro);
          escuro → verde médio/claro (texto escuro). */}
      <StatusBar style={mode === "dark" ? "dark" : "light"} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          {/* Hero — gradiente accent com a marca */}
          <LinearGradient
            colors={[theme.colors.accent, theme.colors.accentStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroMark}>
              <Ionicons name="school" size={30} color={theme.colors.onAccent} />
            </View>
            <Text style={styles.heroLogo}>MentorHub</Text>
            <Text style={styles.heroTagline}>Aprenda com os melhores mentores.</Text>
          </LinearGradient>

          {/* Base com o card flutuante */}
          <View style={styles.lower}>
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
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Animated.View>
          </View>
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
    },

    /* Hero (gradiente accent, ~45% da tela) */
    hero: {
      flex: 5,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: theme.spacing.xl,
    },
    heroMark: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.16)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 255, 255, 0.30)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    heroLogo: {
      color: theme.colors.onAccent,
      fontSize: 40,
      fontWeight: "800",
      letterSpacing: -1,
    },
    heroTagline: {
      color: theme.colors.onAccent,
      opacity: 0.85,
      fontSize: 14,
      fontWeight: "500",
    },

    /* Base com card flutuante */
    lower: {
      flex: 6,
      paddingHorizontal: theme.spacing.xl,
    },
    card: {
      marginTop: -56,
      padding: 24,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
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
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      minHeight: 54,
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
      borderRadius: theme.radius.lg,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.sm,
      minHeight: 54,
      shadowColor: theme.colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 5,
    },
    submitDisabled: { opacity: 0.5 },
    submitText: { color: theme.colors.onAccent, fontSize: 15, fontWeight: "700" },

    /* Erro inline */
    error: {
      color: theme.colors.dangerText,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
      marginTop: theme.spacing.md,
    },
  });
