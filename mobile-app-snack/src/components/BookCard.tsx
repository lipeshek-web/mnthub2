/**
 * Card de livro/artigo com cara de LIVRO: capa em retrato com lombra à
 * esquerda (faixa escura + brilho), beirada de páginas à direita, borda fina
 * e elevação — do carrossel à lista, o card lê como um livro de verdade.
 * - variant "grid": grade 2 colunas da aba Biblioteca (capa grande em
 *   pé + título + mentor — visual de estante).
 * - variant "row": lista vertical (capa-livro à esquerda + infos).
 * - variant "mini": carrossel horizontal do início (capa maior + legenda,
 *   sem coração de favorito).
 */
import React from "react";
import { DimensionValue, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import type { LibraryItemSummary } from "../lib/api";
import { useFavorites } from "../lib/favorites";
import { Chip } from "./Chip";
import { RemoteImage } from "./RemoteImage";

interface BookCardProps {
  item: LibraryItemSummary;
  onPress: () => void;
  variant?: "row" | "mini" | "grid";
  /** false oculta o coração de favorito (usos compactos/decorativos). */
  showFavorite?: boolean;
}

/** Capa com tratamento de livro (usada nas três variantes). */
function BookCover({
  item,
  width,
  height,
  radius,
  iconSize,
  showKindBadge,
}: {
  item: LibraryItemSummary;
  /** número (px) ou percentual como "100%" (célula fluida da grade). */
  width: DimensionValue;
  height: number;
  radius: number;
  iconSize: number;
  showKindBadge?: boolean;
}) {
  const styles = makeStyles();
  const isBook = item.kind === "BOOK";
  const fallbackIcon: keyof typeof Ionicons.glyphMap = isBook
    ? "book-outline"
    : "document-text-outline";
  return (
    <View style={[styles.coverBox, { width, height, borderRadius: radius }]}>
      <RemoteImage
        uri={item.coverUrl}
        style={[styles.coverFill, { borderRadius: radius }]}
        recyclingKey={item.id}
        fallbackIcon={fallbackIcon}
        iconSize={iconSize}
      />
      {/* Lombra: faixa escura + linha de brilho, como a dobra da capa */}
      <View style={[styles.spine, { borderBottomLeftRadius: radius, borderTopLeftRadius: radius }]} />
      <View style={styles.spineHighlight} />
      {/* Beirada de páginas à direita */}
      <View style={styles.pagesEdge} />
      {showKindBadge ? (
        <View style={styles.kindBadge}>
          <Text style={styles.kindBadgeText}>{isBook ? "Livro" : "Artigo"}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function BookCard({ item, onPress, variant = "row", showFavorite = true }: BookCardProps) {
  const styles = makeStyles();
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite("book", item.id);

  if (variant === "grid") {
    return (
      <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.85}>
        <View>
          <BookCover
            item={item}
            width="100%"
            height={168}
            radius={9}
            iconSize={34}
            showKindBadge
          />
          {showFavorite ? (
            <TouchableOpacity
              style={styles.gridFav}
              onPress={() =>
                toggle({ type: "book", id: item.id, title: item.title, savedAt: Date.now() })
              }
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                favorite ? `Remover ${item.title} dos salvos` : `Salvar ${item.title}`
              }
            >
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={15}
                color={favorite ? theme.colors.danger : theme.colors.white}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.gridMentor} numberOfLines={1}>
          {item.mentor?.name ?? ""}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === "mini") {
    return (
      <TouchableOpacity style={styles.miniCard} onPress={onPress} activeOpacity={0.85}>
        <BookCover item={item} width={116} height={164} radius={7} iconSize={26} showKindBadge />
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
        <BookCover item={item} width={62} height={88} radius={5} iconSize={20} />
        {showFavorite ? (
          <TouchableOpacity
            style={styles.favButton}
            onPress={() =>
              toggle({ type: "book", id: item.id, title: item.title, savedAt: Date.now() })
            }
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? `Remover ${item.title} dos salvos` : `Salvar ${item.title}`
            }
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={16}
              color={favorite ? theme.colors.danger : theme.colors.white}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.info}>
        <View style={styles.chipsRow}>
          <Chip label={item.kind === "BOOK" ? "Livro" : "Artigo"} tone={item.kind === "BOOK" ? "accent" : "outline"} />
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
    coverWrap: { width: 62, height: 88 },
    /* Capa-livro: borda fina + sombra leve para "levantar" da tela */
    coverBox: {
      overflow: "visible",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 5,
      shadowOffset: { width: 2, height: 3 },
      elevation: 3,
      backgroundColor: theme.colors.surfaceAlt,
    },
    coverFill: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.surfaceAlt,
    },
    spine: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 7,
      backgroundColor: "rgba(0, 0, 0, 0.24)",
    },
    spineHighlight: {
      position: "absolute",
      left: 8,
      top: 0,
      bottom: 0,
      width: 1.5,
      backgroundColor: "rgba(255, 255, 255, 0.30)",
    },
    pagesEdge: {
      position: "absolute",
      right: 1.5,
      top: 3,
      bottom: 3,
      width: 2,
      borderRadius: 2,
      backgroundColor: "rgba(255, 255, 255, 0.75)",
    },
    kindBadge: {
      position: "absolute",
      left: 10,
      bottom: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    kindBadgeText: { color: theme.colors.white, fontSize: 9, fontWeight: "700" },
    /* Coração de favorito sobreposto ao canto superior direito da capa. */
    favButton: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 34,
      height: 34,
      borderRadius: theme.radius.full,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1, gap: 4 },
    chipsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    reading: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "600" },
    title: { color: theme.colors.text, fontSize: 14, fontWeight: "600", lineHeight: 19 },
    mentor: { color: theme.colors.textMuted, fontSize: 12 },

    miniCard: { width: 116, gap: 8 },
    miniTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "600", lineHeight: 17 },
    miniMentor: { color: theme.colors.textFaint, fontSize: 11 },

    /* Grade 2 colunas da Biblioteca (célula fluida: flex 1 + gap do row) */
    gridCard: { flex: 1, gap: 3 },
    gridTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 17,
      marginTop: 8,
    },
    gridMentor: { color: theme.colors.textFaint, fontSize: 11 },
    gridFav: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: theme.radius.full,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
  });
