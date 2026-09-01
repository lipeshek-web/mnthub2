/** Rota inicial: redireciona para as abas (logado) ou para o login. */
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/lib/auth";
import { theme } from "../src/theme";

export default function Index() {
  const { status } = useAuth();

  if (status === "loading") {
    // Defensivo: o gate no _layout normalmente já cobre este caso.
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return <Redirect href={status === "authenticated" ? "/(tabs)" : "/login"} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
