/** Título de seção com ação opcional ("Ver todos"). */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";

interface SectionTitleProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionTitle({ title, actionLabel, onAction }: SectionTitleProps) {
  const styles = makeStyles();
  const showAction = Boolean(actionLabel && onAction);
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {showAction ? (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    title: { color: theme.colors.text, fontSize: 17, fontWeight: "700", flex: 1 },
    action: { color: theme.colors.accent, fontSize: 13, fontWeight: "600" },
  });
