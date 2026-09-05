/**
 * Cabeçalho fixo padrão Apple — o voltar fica à esquerda e o RESTO do espaço
 * é contexto: título central diz onde você está (nome do mentor, do livro,
 * do curso, da pessoa da conversa...) e o subtítulo opcional qualifica
 * ("Mentor", "Livro", "Meu perfil"). O conteúdo rola POR BAIXO do hairline —
 * o cabeçalho nunca rola junto.
 */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

interface ScreenHeaderProps {
  /** Título de contexto — o nome de quem/onde você está. */
  title: string;
  /** Qualificação discreta sob o título ("Mentor", "Livro", "Meu perfil"...). */
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const styles = makeStyles();
  return (
    <View style={styles.row}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.back}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.accent} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <View style={styles.titleWrap} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? <View style={styles.placeholder} />}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.xs + 2,
      paddingBottom: theme.spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
      gap: theme.spacing.xs,
    },
    // Área de toque >= 44px (HIG) para o botão voltar.
    back: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    placeholder: { width: 40 },
    titleWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 0,
    },
    title: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: -0.3,
      maxWidth: "100%",
    },
    subtitle: {
      color: theme.colors.textFaint,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 1,
      maxWidth: "100%",
    },
  });
