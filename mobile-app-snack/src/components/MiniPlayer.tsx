/**
 * Mini-player de áudio — vive DENTRO da tab bar (App.js), acima dos itens.
 *
 * Estilo Podcasts/Apple Music: uma linha compacta com arte, título e
 * play/pause. Tocando em qualquer aba/tela, o som NÃO para (o estado vive no
 * AudioProvider no root). Toque na linha abre a tela cheia (stack "Audio").
 * Quando não há faixa ativa, renderiza null — a tab bar fica como sempre.
 */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAudio } from "../lib/audio";
import { theme } from "../theme";
import { RemoteImage } from "./RemoteImage";

export default function MiniPlayer() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const { current, isPlaying, isLoading, toggle, error } = useAudio();

  if (!current) return null;

  return (
    <TouchableOpacity
      style={styles.bar}
      activeOpacity={0.9}
      onPress={() => navigation.navigate("Audio")}
      accessibilityRole="button"
      accessibilityLabel={`Player de áudio: ${current.title}. Abrir tela cheia`}
    >
      <RemoteImage
        uri={current.artwork}
        style={styles.artwork}
        recyclingKey={`mini-audio-${current.id}`}
        fallbackIcon="headphones-outline"
        iconSize={16}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {error ? "Áudio indisponível" : current.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {current.subtitle}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.playButton}
        onPress={toggle}
        disabled={isLoading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Pausar áudio" : "Tocar áudio"}
      >
        <Ionicons
          name={isLoading ? "hourglass-outline" : isPlaying ? "pause" : "play"}
          size={22}
          color={theme.colors.accent}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    artwork: {
      width: 38,
      height: 38,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceAlt,
    },
    info: { flex: 1, minWidth: 0, gap: 1 },
    title: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
    subtitle: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "600" },
    playButton: {
      width: 38,
      height: 38,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
  });
