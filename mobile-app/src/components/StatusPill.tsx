/** Pílula colorida do status de uma sessão de mentoria. */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import type { BookingStatus } from "../lib/api";

const LABELS: Record<BookingStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const COLORS: Record<BookingStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: theme.colors.warningSoft, text: theme.colors.warning, border: theme.colors.warningBorder },
  CONFIRMED: { bg: theme.colors.accentSoft, text: theme.colors.accent, border: theme.colors.accentBorder },
  COMPLETED: { bg: theme.colors.infoSoft, text: theme.colors.info, border: "rgba(125, 211, 252, 0.3)" },
  CANCELLED: { bg: theme.colors.dangerSoft, text: theme.colors.dangerText, border: theme.colors.dangerBorder },
};

export function StatusPill({ status }: { status: BookingStatus }) {
  const colors = COLORS[status] ?? COLORS.PENDING;
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
});
