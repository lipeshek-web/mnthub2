/** Pílula de ofensiva de estudos (streak). */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

export function StreakFlame({ streak }: { streak: number }) {
  const days = Math.max(0, streak ?? 0);
  return (
    <View style={styles.pill}>
      <Ionicons name="flame" size={13} color={theme.colors.warning} />
      <Text style={styles.text}>
        {days} {days === 1 ? "dia" : "dias"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.warningSoft,
    borderWidth: 1,
    borderColor: theme.colors.warningBorder,
    alignSelf: "flex-start",
  },
  text: { color: theme.colors.warning, fontSize: 12, fontWeight: "700" },
});
