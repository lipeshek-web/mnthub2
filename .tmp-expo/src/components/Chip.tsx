/** Pílula pequena de categoria/etiqueta. */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

interface ChipProps {
  label: string;
  tone?: "neutral" | "accent" | "outline";
}

export function Chip({ label, tone = "neutral" }: ChipProps) {
  const styles = makeStyles();
  if (!label) return null;
  const boxStyle =
    tone === "accent" ? styles.accent : tone === "outline" ? styles.outline : styles.neutral;
  const textStyle =
    tone === "accent" ? styles.accentText : tone === "outline" ? styles.outlineText : styles.neutralText;
  return (
    <View style={[styles.pill, boxStyle]}>
      <Text style={[styles.text, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    pill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: theme.radius.full,
      borderWidth: StyleSheet.hairlineWidth,
      alignSelf: "flex-start",
    },
    neutral: { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
    neutralText: { color: theme.colors.textMuted },
    accent: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accentBorder },
    accentText: { color: theme.colors.accent },
    outline: { backgroundColor: "transparent", borderColor: theme.colors.borderStrong },
    outlineText: { color: theme.colors.textMuted },
    text: { fontSize: 11, fontWeight: "600" },
  });
