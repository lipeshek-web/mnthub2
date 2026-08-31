/** Pílula de XP do aluno. */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { formatXp } from "../lib/format";

export function XpBadge({ xp }: { xp: number }) {
  const styles = makeStyles();
  return (
    <View style={styles.pill}>
      <Ionicons name="flash" size={13} color={theme.colors.accent} />
      <Text style={styles.text}>{formatXp(xp)}</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      alignSelf: "flex-start",
    },
    text: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  });
