/** Card de curso usado nas listas (aba Cursos, recomendados do início etc.). */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import type { CourseItem } from "../lib/api";
import { formatDuration, formatNumber, formatPrice, levelLabel } from "../lib/format";
import { useFavorites } from "../lib/favorites";
import { Chip } from "./Chip";
import { RemoteImage } from "./RemoteImage";

interface CourseCardProps {
  course: CourseItem;
  onPress: () => void;
  /** false oculta o coração de favorito (usos compactos/decorativos). */
  showFavorite?: boolean;
}

export function CourseCard({ course, onPress, showFavorite = true }: CourseCardProps) {
  const styles = makeStyles();
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite("course", course.id);
  const level = levelLabel(course.level);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.coverWrap}>
        <RemoteImage
          uri={course.coverUrl}
          style={styles.cover}
          recyclingKey={course.id}
          fallbackIcon="play-circle-outline"
          iconSize={26}
        />
        {showFavorite ? (
          <TouchableOpacity
            style={styles.favButton}
            onPress={() => toggle({ type: "course", id: course.id, title: course.title })}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? `Remover ${course.title} dos salvos` : `Salvar ${course.title}`
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
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.mentor} numberOfLines={1}>
          por {course.mentor?.name ?? "Mentor"}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color={theme.colors.warning} />
          <Text style={styles.meta}>{(course.rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.metaFaint}>({formatNumber(course.reviewCount ?? 0)})</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{course.lessonCount} aulas</Text>
          {course.totalDurationMin > 0 ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>{formatDuration(course.totalDurationMin)}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.bottomRow}>
          <Chip label={course.category} />
          {level ? <Chip label={level} tone="outline" /> : null}
          <View style={styles.spacer} />
          {course.enrolled ? (
            <View style={styles.enrolledPill}>
              <Ionicons name="checkmark-circle" size={12} color={theme.colors.accent} />
              <Text style={styles.enrolledText}>Inscrito</Text>
            </View>
          ) : (
            <Text style={(course.price ?? 0) > 0 ? styles.price : styles.free}>
              {formatPrice(course.price ?? 0)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.md,
    },
    coverWrap: { width: 88, height: 88 },
    cover: { width: 88, height: 88, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceAlt },
    /* Coração de favorito sobreposto ao canto superior direito da capa. */
    favButton: {
      position: "absolute",
      top: 3,
      right: 3,
      width: 36,
      height: 36,
      borderRadius: theme.radius.full,
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1, gap: 4 },
    title: { color: theme.colors.text, fontSize: 15, fontWeight: "600", lineHeight: 20 },
    mentor: { color: theme.colors.textMuted, fontSize: 12 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 2 },
    meta: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
    metaFaint: { color: theme.colors.textFaint, fontSize: 11 },
    dot: { color: theme.colors.textFaint, fontSize: 12 },
    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 6,
    },
    spacer: { flex: 1 },
    enrolledPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
    },
    enrolledText: { color: theme.colors.accent, fontSize: 11, fontWeight: "700" },
    price: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
    free: { color: theme.colors.accent, fontSize: 14, fontWeight: "700" },
  });
