/** Tela de login — o app mobile é apenas para alunos. */
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { errMessage, getServerUrl, setServerUrl } from "../lib/api";
import { theme } from "../theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrlState] = useState("");

  // Restaura o servidor salvo no aparelho (campo "Servidor da API").
  useEffect(() => {
    void getServerUrl().then(setServerUrlState);
  }, []);

  const canSubmit = email.trim().length > 3 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await setServerUrl(serverUrl); // salva o servidor antes do 1º request
      await login(email.trim(), password);
      // O gate de auth no App.tsx troca para as abas automaticamente.
    } catch (err) {
      // Ex.: credenciais inválidas (401) ou conta bloqueada / com 2FA (403).
      setError(errMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>
              Mentor<Text style={styles.logoAccent}>Hub</Text>
            </Text>
            <Text style={styles.tagline}>
              Livros, cursos e mentorias 1:1 com os melhores mentores — na palma da mão.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
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
            />

            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.inputPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="Sua senha"
                placeholderTextColor={theme.colors.textFaint}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={() => void handleSubmit()}
              />
              <TouchableOpacity style={styles.eye} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.colors.textFaint}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submit, !canSubmit && styles.submitDisabled]}
              onPress={() => void handleSubmit()}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.bg} size="small" />
              ) : (
                <Text style={styles.submitText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>Conta demo: ana@demo.com · senha demo123</Text>

            <View style={styles.serverBox}>
              <View style={styles.serverHeader}>
                <Ionicons name="server-outline" size={14} color={theme.colors.textFaint} />
                <Text style={styles.serverLabel}>Servidor da API</Text>
              </View>
              <TextInput
                style={styles.serverInput}
                value={serverUrl}
                onChangeText={setServerUrlState}
                placeholder="https://mentorhub.space-z.ai"
                placeholderTextColor={theme.colors.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  header: { marginBottom: theme.spacing.xxl },
  logo: { color: theme.colors.text, fontSize: 34, fontWeight: "700", letterSpacing: -0.8 },
  logoAccent: { color: theme.colors.accent },
  tagline: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  form: { gap: 2 },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 13,
    color: theme.colors.text,
    fontSize: 15,
  },
  passwordWrap: { position: "relative" },
  inputPassword: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 13,
    paddingRight: 56,
    color: theme.colors.text,
    fontSize: 15,
  },
  eye: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  errorBox: {
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  errorText: { color: theme.colors.dangerText, fontSize: 13, lineHeight: 19 },
  submit: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xl,
    minHeight: 50,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: theme.colors.bg, fontSize: 15, fontWeight: "700" },
  hint: {
    color: theme.colors.textFaint,
    fontSize: 12,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
  serverBox: {
    marginTop: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: "rgba(28, 25, 23, 0.5)",
  },
  serverHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  serverLabel: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  serverInput: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: 13,
  },
});
