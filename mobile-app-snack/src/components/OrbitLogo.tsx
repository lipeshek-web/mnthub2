/**
 * Marca Órbita — planeta com anel elíptico + lua, desenhado só com Views
 * (o mesmo padrão do splash e do login, agora compartilhado).
 *
 * <OrbitMark size={26} />  → só o símbolo (planeta + anel).
 * <OrbitLogo size={26} />  → símbolo + wordmark "Órbita" na horizontal
 *                            (header da aba Início, no lugar da saudação).
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export function OrbitMark({ size = 26 }: { size?: number }) {
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

/** Símbolo + wordmark na horizontal — identidade do app no header. */
export default function OrbitLogo({ size = 26 }: { size?: number }) {
  const styles = makeStyles();
  return (
    <View style={styles.row} accessibilityLabel="Órbita">
      <OrbitMark size={size} />
      <Text style={styles.wordmark}>Órbita</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    wordmark: {
      color: theme.colors.text,
      fontSize: 21,
      fontWeight: "800",
      letterSpacing: -0.6,
    },
    markStage: { alignItems: "center", justifyContent: "center" },
    markRing: {
      position: "absolute",
      borderWidth: 2,
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
    markPlanet: { backgroundColor: theme.colors.accent, opacity: 0.32 },
  });
