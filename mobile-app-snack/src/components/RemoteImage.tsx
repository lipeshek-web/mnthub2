/**
 * Imagem remota do app: resolve a URL com assetUrl() (mata domínios mortos da
 * API), mostra placeholder enquanto carrega e troca por um fallback com ícone
 * quando a imagem falha ou não existe — nunca exibe quadro quebrado.
 */
import React, { useEffect, useState } from "react";
import { StyleSheet, View, type ImageStyle, type StyleProp } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { assetUrl } from "../lib/api";
import { theme } from "../theme";

interface RemoteImageProps {
  /** URL bruta vinda da API (coverUrl/avatarUrl) — normalizada internamente. */
  uri: string | null | undefined;
  style: StyleProp<ImageStyle>;
  recyclingKey?: string;
  /** Ícone quando não há URL (padrão: imagem genérica). */
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  /** Ícone quando a imagem falha ao carregar (padrão: image-outline). */
  errorIcon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
}

export function RemoteImage({
  uri,
  style,
  recyclingKey,
  fallbackIcon = "image-outline",
  errorIcon = "image-outline",
  iconSize = 22,
}: RemoteImageProps) {
  const styles = makeStyles();
  const resolved = assetUrl(uri);
  const [failed, setFailed] = useState(false);

  // URL nova (ex.: refresh trocando a capa) → limpa o estado de erro.
  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons name={failed ? errorIcon : fallbackIcon} size={iconSize} color={theme.colors.textFaint} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={style}
      contentFit="cover"
      transition={150}
      recyclingKey={recyclingKey}
      onError={() => setFailed(true)}
      accessibilityRole="image"
    />
  );
}

const makeStyles = () =>
  StyleSheet.create({
    fallback: {
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
  });
