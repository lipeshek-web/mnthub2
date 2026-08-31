/** Avatar circular com fallback de iniciais (sem foto ou erro de carregamento). */
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { assetUrl } from "../lib/api";
import { theme } from "../theme";

interface AvatarProps {
  uri: string | null;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const styles = makeStyles();
  const resolved = assetUrl(uri);
  const [failed, setFailed] = useState(false);
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  // URL nova → limpa o estado de erro (ex.: usuário trocou a foto).
  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (resolved && !failed) {
    return (
      <Image
        source={{ uri: resolved }}
        style={[dimensions, styles.image]}
        contentFit="cover"
        transition={150}
        recyclingKey={resolved}
        onError={() => setFailed(true)}
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

const makeStyles = () =>
  StyleSheet.create({
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
