/** Caixa de erro com botão "Tentar de novo" (usada em todas as telas de dados). */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

interface ErrorBoxProps {
  message: string;
  onRetry?: () => void;
  /** Versão compacta para usar como banner acima de listas com conteúdo. */
  compact?: boolean;
}

export function ErrorBox({ message, onRetry, compact = false }: ErrorBoxProps) {
  const styles = makeStyles();
  return (
    <View style={[styles.box, compact && styles.compact]}>
      <View style={styles.row}>
        <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
        <Text style={styles.text}>{message}</Text>
      </View>
      {onRetry ? (
        <TouchableOpacity style={styles.retry} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>Tentar de novo</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    box: {
      backgroundColor: theme.colors.dangerSoft,
      borderColor: theme.colors.dangerBorder,
      borderWidth: 1,
      borderRadius: theme.radius.md,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      margin: theme.spacing.lg,
    },
    compact: {
      padding: theme.spacing.md,
      margin: 0,
    },
    row: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.sm },
    text: { flex: 1, color: theme.colors.dangerText, fontSize: 13, lineHeight: 19 },
    retry: {
      alignSelf: "flex-start",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.dangerSoft,
    },
    retryText: { color: theme.colors.dangerText, fontSize: 12, fontWeight: "700" },
  });
