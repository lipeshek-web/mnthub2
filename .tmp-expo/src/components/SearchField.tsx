/** Campo de busca com ícone de lupa e botão de limpar (abas de listas). */
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Foco automático ao montar (usado na tela de busca global). */
  autoFocus?: boolean;
  /** Ação da tecla "buscar" do teclado (usado na tela de busca global). */
  onSubmitEditing?: () => void;
}

export function SearchField({ value, onChangeText, placeholder, autoFocus = false, onSubmitEditing }: SearchFieldProps) {
  const styles = makeStyles();
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={17} color={theme.colors.textFaint} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
      />
      {value.length > 0 ? (
        <TouchableOpacity
          style={styles.clear}
          onPress={() => onChangeText("")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Limpar busca"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={17} color={theme.colors.textFaint} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      height: 46,
    },
    icon: { marginRight: theme.spacing.sm },
    input: { flex: 1, color: theme.colors.text, fontSize: 15, paddingVertical: 0 },
    clear: { paddingLeft: theme.spacing.sm },
  });
