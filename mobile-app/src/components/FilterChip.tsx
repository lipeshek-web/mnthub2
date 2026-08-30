/** Pílula de filtro selecionável (filtros das listas e horários do agendamento). */
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { theme } from "../theme";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected ? styles.selected : styles.unselected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
  },
  unselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  text: { fontSize: 13, fontWeight: "600" },
  textSelected: { color: theme.colors.accent },
  textUnselected: { color: theme.colors.textMuted },
});
