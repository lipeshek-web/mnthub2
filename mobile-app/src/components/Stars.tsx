/** Estrelas de avaliação (com meia estrela). */
import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

interface StarsProps {
  value: number;
  size?: number;
}

export function Stars({ value, size = 14 }: StarsProps) {
  const rating = Math.max(0, Math.min(5, value ?? 0));
  return (
    <View style={styles.row}>
      {[0, 1, 2, 3, 4].map((i) => {
        const name: "star" | "star-half" | "star-outline" =
          rating >= i + 1 ? "star" : rating >= i + 0.5 ? "star-half" : "star-outline";
        return (
          <Ionicons
            key={i}
            name={name}
            size={size}
            color={rating > i ? theme.colors.warning : theme.colors.borderStrong}
            style={styles.star}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  star: { marginHorizontal: 1 },
});
