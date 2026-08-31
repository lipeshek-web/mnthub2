/**
 * Card de livro/artigo da biblioteca.
 * - variant "row": lista da aba Biblioteca (capa lateral + infos).
 * - variant "mini": carrossel horizontal do início (compacto/decorativo — sem
 *   coração de favorito, mesmo com showFavorite=true).
 */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import type { LibraryItemSummary } from "../lib/api";
import { useFavorites } from "../lib/favorites";
import { Chip } from "./Chip";
import { RemoteImage } from "./RemoteImage";

interface BookCardProps {
  item: LibraryItemSummary;
  onPress: () => void;
  variant?: "row" | "mini";
  /** false oculta o coração de favorito (usos compactos/decorativos). */
  showFavorite?: boolean;
}

export function BookCard({ item, onPress, variant = "row", showFavorite = true }: BookCardProps) {
  const styles = makeStyles();
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite("book", item.id);
  const isBook = item.kind === "BOOK";
  const fallbackIcon: keyof typeof Ionicons.glyphMap = isBook ? "book-outline" : "document-text-outline";

  if (variant === "mini") {
    return (
      <TouchableOpacity style={styles.miniCard} onPress={onPress} activeOpacity={0.85}>
        <RemoteImage
          uri={item.coverUrl}
          style={styles.miniCover}
          recyclingKey={item.id}
          fallbackIcon={fallbackIcon}
          iconSize={24}
        />
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
        <RemoteImage
          uri={item.coverUrl}
          style={styles.cover}
          recyclingKey={item.id}
          fallbackIcon={fallbackIcon}
          iconSize={22}
        />
        {showFavorite ? (
          <TouchableOpacity
            style={styles.favButton}
            onPress={() => toggle({ type: "book", id: item.id, title: item.title })}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? `Remover ${item.title} dos salvos` : `Salvar ${item.title}`
            }
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={17}
              color={favorite ? theme.colors.danger : theme.colors.white}
            />
          </TouchableOpacity>
        ) : null}
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

const makeStyles = () =>
  StyleSheet.create({
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
    /* Coração de favorito sobreposto ao canto superior direito da capa. */
    favButton: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 36,
      height: 36,
      borderRadius: theme.radius.full,
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
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
    miniTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "600", lineHeight: 17 },
    miniMentor: { color: theme.colors.textFaint, fontSize: 11 },
  });
