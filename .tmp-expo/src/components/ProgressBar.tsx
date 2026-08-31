/** Barra de progresso simples (0–100). */
import React from "react";
import { StyleSheet, View } from "react-native";
import { theme } from "../theme";

interface ProgressBarProps {
  pct: number;
  height?: number;
  color?: string;
  trackColor?: string;
}

export function ProgressBar({
  pct,
  height = 8,
  color = theme.colors.accent,
  trackColor = theme.colors.surfaceAlt,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct || 0)));
  const width = `${clamped}%` as `${number}%`;
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}>
      <View
        style={{
          width,
          height: "100%",
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden", width: "100%" },
});
