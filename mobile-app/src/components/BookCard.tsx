/**
 * Card de livro/artigo da biblioteca.
 * - variant "row": lista da aba Biblioteca (capa lateral + infos).
 * - variant "mini": carrossel horizontal do início.
 */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import type { LibraryItemSummary } from "../lib/api";
import { Chip } from "./Chip";

interface BookCardProps {
  item: LibraryItemSummary;
  onPress: () => void;
  variant?: "row" | "mini";
}

export function BookCard({ item, onPress, variant = "row" }: BookCardProps) {
  const isBook = item.kind === "BOOK";
  const fallbackIcon: keyof typeof Ionicons.glyphMap = isBook ? "book-outline" : "document-text-outline";

  if (variant === "mini") {
    return (
      <TouchableOpacity style={styles.miniCard} onPress={onPress} activeOpacity={0.85}>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.miniCover}
            contentFit="cover"
            transition={150}
            recyclingKey={item.id}
          />
        ) : (
          <View style={[styles.miniCover, styles.miniCoverFallback]}>
            <Ionicons name={fallbackIcon} size={24} color={theme.colors.textFaint} />
          </View>
        )}
        <Text style={styles.miniTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.miniMentor} numberOfLines={1}>
          {item.mentor?.name ?? ""}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.coverWrap}>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.cover}
            contentFit="cover"
            transition={150}
            recyclingKey={item.id}
          />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Ionicons name={fallbackIcon} size={22} color={theme.colors.textFaint} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.chipsRow}>
          <Chip label={isBook ? "Livro" : "Artigo"} tone={isBook ? "accent" : "outline"} />
          {item.readingMin ? <Text style={styles.reading}>~{item.readingMin} min</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.mentor} numberOfLines={1}>
          {item.mentor?.name ?? ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
  },
  coverWrap: { width: 58, height: 78 },
  cover: {
    width: 58,
    height: 78,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  coverFallback: { alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 4 },
  chipsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reading: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "600" },
  title: { color: theme.colors.text, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  mentor: { color: theme.colors.textMuted, fontSize: 12 },

  miniCard: { width: 148, gap: 6 },
  miniCover: {
    width: 148,
    height: 96,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  miniCoverFallback: { alignItems: "center", justifyContent: "center" },
  miniTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "600", lineHeight: 17 },
  miniMentor: { color: theme.colors.textFaint, fontSize: 11 },
});
