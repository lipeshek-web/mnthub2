/**
 * Layout raiz: SafeAreaProvider + AuthProvider + Stack de navegação.
 * Enquanto a sessão está sendo restaurada, mostramos um splash (sem piscar para o login).
 */
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/lib/auth";
import { theme } from "../src/theme";

function Splash() {
  return (
    <View style={styles.splash}>
      <Text style={styles.logo}>
        Mentor<Text style={styles.logoAccent}>Hub</Text>
      </Text>
      <ActivityIndicator color={theme.colors.accent} size="small" style={styles.spinner} />
    </View>
  );
}

function RootNavigator() {
  const { status } = useAuth();

  // Gate de auth: só renderiza a navegação depois de saber se há sessão válida.
  if (status === "loading") return <Splash />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen name="login" options={{ animation: "fade" }} />
      <Stack.Screen name="livro/[id]" />
      <Stack.Screen name="curso/[id]" />
      <Stack.Screen name="mentor/[id]" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { color: theme.colors.text, fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  logoAccent: { color: theme.colors.accent },
  spinner: { marginTop: theme.spacing.lg },
});
