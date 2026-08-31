/** Container de tela com SafeArea e fundo do tema. */
import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";

type Edge = "top" | "bottom" | "left" | "right";

interface ScreenProps {
  children: React.ReactNode;
  /** Bordas protegidas pelo SafeArea (padrão: topo e laterais; abas já têm a tab bar embaixo). */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ["top", "left", "right"], style }: ScreenProps) {
  const styles = makeStyles();
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg },
    inner: { flex: 1 },
  });
