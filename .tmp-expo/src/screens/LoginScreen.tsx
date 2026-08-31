/**
 * Tela de login — o app mobile é apenas para alunos.
 *
 * Visual premium: hero com gradiente esmeralda (~40% da tela) com o logo
 * "MentorHub" grande em branco e uma tagline curta; o card da surface "flutua"
 * sobre a base (borderRadius generoso, sombra sutil, padding 24) com os campos
 * e o botão; entrada suave via Animated (fade + translateY, 400ms, só RN
 * Animated). Funcionalidade preservada: loading, erro inline, campo "Servidor
 * da API" COLAPSADO atrás de "Servidor personalizado", olho da senha e sessão
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
import { DEFAULT_SERVER_URL, errMessage, getServerUrl, setServerUrl } from "../lib/api";
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
  const [serverUrl, setServerUrlState] = useState(DEFAULT_SERVER_URL);
  const [showServer, setShowServer] = useState(false);

  // Entrada suave do card: fade + translateY(16px → 0), 400ms, só RN Animated.
  const entrance = useRef(new Animated.Value(0)).current;
  const cardTranslate = entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  // Restaura o servidor salvo no aparelho (caso um personalizado tenha sido usado).
  useEffect(() => {
    void getServerUrl().then(setServerUrlState);
  }, []);

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
      await setServerUrl(serverUrl); // salva o servidor antes do 1º request
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
          {/* Hero — gradiente accent com logo branco */}
          <LinearGradient
            colors={[theme.colors.accent, theme.colors.accentStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroLogo}>MentorHub</Text>
            <Text style={styles.heroTagline}>Aprenda com os melhores mentores.</Text>
          </LinearGradient>

          {/* Base com o card flutuante */}
          <View style={styles.lower}>
            <Animated.View
              style={[styles.card, { opacity: entrance, transform: [{ translateY: cardTranslate }] }]}
            >
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

              {/* Servidor da API — colapsado por padrão */}
              <TouchableOpacity
                style={styles.serverToggle}
                onPress={() => setShowServer((v) => !v)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ expanded: showServer }}
                accessibilityLabel="Servidor personalizado"
              >
                <Ionicons name={showServer ? "chevron-up" : "server-outline"} size={13} color={theme.colors.textFaint} />
                <Text style={styles.serverToggleText}>Servidor personalizado</Text>
              </TouchableOpacity>
              {showServer ? (
                <View style={[styles.field, styles.fieldServer]}>
                  <TextInput
                    style={styles.inputServer}
                    value={serverUrl}
                    onChangeText={setServerUrlState}
                    placeholder={DEFAULT_SERVER_URL}
                    placeholderTextColor={theme.colors.textFaint}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    accessibilityLabel="Servidor da API"
                  />
                </View>
              ) : null}

              <Text style={styles.hint}>Conta demo: ana@demo.com · senha demo123</Text>
            </Animated.View>

            {/* Rodapé discreto */}
            <Text style={styles.footer}>MentorHub · API v1</Text>
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

    /* Hero (gradiente accent, ~40% da tela) */
    hero: {
      flex: 4,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: theme.spacing.xl,
    },
    heroLogo: {
      color: theme.colors.white,
      fontSize: 40,
      fontWeight: "800",
      letterSpacing: -1,
    },
    heroTagline: {
      color: "rgba(255, 255, 255, 0.85)",
      fontSize: 14,
      fontWeight: "500",
    },

    /* Base com card flutuante */
    lower: {
      flex: 6,
      paddingHorizontal: theme.spacing.xl,
    },
    card: {
      marginTop: -48,
      padding: 24,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    },

    /* Campo com ícone embutido */
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 50,
      marginBottom: theme.spacing.md,
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 15,
      paddingVertical: 13,
    },
    eye: { padding: theme.spacing.xs },

    /* Botão primário */
    submit: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.sm,
      minHeight: 50,
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

    /* Servidor personalizado (colapsável) */
    serverToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: theme.spacing.lg,
      minHeight: 44,
    },
    serverToggleText: {
      color: theme.colors.textFaint,
      fontSize: 12,
      fontWeight: "600",
    },
    fieldServer: { marginTop: theme.spacing.sm },
    inputServer: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 13,
      paddingVertical: 12,
    },

    hint: {
      color: theme.colors.textFaint,
      fontSize: 12,
      textAlign: "center",
      marginTop: theme.spacing.xl,
    },

    /* Rodapé discreto */
    footer: {
      color: theme.colors.textFaint,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.4,
      textAlign: "center",
      marginTop: "auto",
      paddingVertical: theme.spacing.md,
    },
  });
