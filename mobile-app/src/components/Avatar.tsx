/** Avatar circular com fallback de iniciais (quando não há foto). */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { theme } from "../theme";

interface AvatarProps {
  uri: string | null;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[dimensions, styles.image]}
        contentFit="cover"
        transition={150}
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <View style={[dimensions, styles.fallback]}>
      <Text style={[styles.initials, { fontSize: Math.max(11, Math.round(size * 0.36)) }]}>
        {initials || "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: theme.colors.surfaceAlt },
  fallback: {
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: theme.colors.accent, fontWeight: "700" },
});
