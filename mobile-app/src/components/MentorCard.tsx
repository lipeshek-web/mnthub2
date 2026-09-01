/** Card de mentor(a) para a lista da aba Mentorias. */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import type { MentorListItem } from "../lib/api";
import { formatPrice } from "../lib/format";
import { Avatar } from "./Avatar";
import { Chip } from "./Chip";

interface MentorCardProps {
  mentor: MentorListItem;
  onPress: () => void;
}

export function MentorCard({ mentor, onPress }: MentorCardProps) {
  const rate = mentor.hourlyRate ?? 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Avatar uri={mentor.avatarUrl} name={mentor.name} size={52} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {mentor.name}
        </Text>
        {mentor.headline ? (
          <Text style={styles.headline} numberOfLines={2}>
            {mentor.headline}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color={theme.colors.warning} />
          <Text style={styles.meta}>{(mentor.rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.metaFaint}>({mentor.reviewCount ?? 0})</Text>
          {mentor.experienceYears > 0 ? (
            <Text style={styles.meta}> · {mentor.experienceYears} anos de experiência</Text>
          ) : null}
        </View>
        {(mentor.categories ?? []).length > 0 ? (
          <View style={styles.chipsRow}>
            {mentor.categories.slice(0, 3).map((category) => (
              <Chip key={category} label={category} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.priceWrap}>
        <Text style={rate > 0 ? styles.price : styles.free}>{formatPrice(rate)}</Text>
        {rate > 0 ? <Text style={styles.priceUnit}>/hora</Text> : null}
      </View>
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
  info: { flex: 1, gap: 4 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  headline: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  meta: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" },
  metaFaint: { color: theme.colors.textFaint, fontSize: 11 },
  chipsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  priceWrap: { alignItems: "flex-end", gap: 1 },
  price: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  free: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
  priceUnit: { color: theme.colors.textFaint, fontSize: 11 },
});
