/** Loading centrado (usado em telas inteiras ou como footer compacto de listas). */
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

interface LoadingListProps {
  label?: string;
  compact?: boolean;
}

export function LoadingList({ label, compact = false }: LoadingListProps) {
  const styles = makeStyles();
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <ActivityIndicator color={theme.colors.accent} size={compact ? "small" : "large"} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
      minHeight: 220,
    },
    compact: { flex: 0, minHeight: 0, paddingVertical: theme.spacing.lg },
    label: { color: theme.colors.textMuted, fontSize: 13 },
  });
