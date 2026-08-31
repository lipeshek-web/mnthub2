/**
 * Tela Salvos (stack): favoritos guardados no aparelho (src/lib/favorites.ts —
 * sem endpoint novo na API). Cada item é resolvido na API em paralelo
 * (Promise.allSettled) para montar a linha com detalhes; itens que falharem
 * viram uma linha de fallback discreta, e o coração da linha remove da lista.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getCourse, getLibraryItem, type CourseItem, type LibraryItemDetail } from "../lib/api";
import { listFavorites, toggleFavorite, subscribeFavorites, type FavRef } from "../lib/favorites";
import { theme } from "../theme";
import { EmptyState } from "../components/EmptyState";
import { LoadingList } from "../components/LoadingList";
import { RemoteImage } from "../components/RemoteImage";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";

interface SavedRow {
  /** type:id — chave estável da linha. */
  key: string;
  fav: FavRef;
  course?: CourseItem;
  book?: LibraryItemDetail;
  /** true quando o detalhe falhou na API (linha de fallback). */
  failed?: boolean;
}

export default function SalvosScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SavedRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const favs = await listFavorites();
    // Mais recentemente salvos primeiro.
    const ordered = [...favs].sort((a, b) => b.savedAt - a.savedAt);
    const settled = await Promise.allSettled(
      ordered.map(async (fav): Promise<SavedRow> => {
        if (fav.type === "course") {
          const res = await getCourse(fav.id);
          return { key: `${fav.type}:${fav.id}`, fav, course: res.course };
        }
        const res = await getLibraryItem(fav.id);
        return { key: `${fav.type}:${fav.id}`, fav, book: res.item };
      })
    );
    const next: SavedRow[] = settled.map((result, index) =>
      result.status === "fulfilled"
        ? result.value
        : { key: `${ordered[index].type}:${ordered[index].id}`, fav: ordered[index], failed: true }
    );
    setRows(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Remoções feitas em outro lugar (ex.: coração de um card) somem daqui também. */
  useEffect(() => {
    const unsubscribe = subscribeFavorites(() => {
      void listFavorites().then((favs) => {
        setRows((prev) =>
          prev.filter((row) =>
            favs.some((fav) => fav.type === row.fav.type && fav.id === row.fav.id)
          )
        );
      });
    });
    return unsubscribe;
  }, []);

  /** Coração ativo da linha: remove dos favoritos e a linha some na hora. */
  const handleRemove = useCallback((row: SavedRow) => {
    void toggleFavorite(row.fav);
    setRows((prev) => prev.filter((item) => item.key !== row.key));
  }, []);

  const openRow = useCallback(
    (row: SavedRow) => {
      if (row.fav.type === "course") navigation.navigate("Curso", { id: row.fav.id });
      else navigation.navigate("Livro", { id: row.fav.id });
    },
    [navigation]
  );

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      <ScreenHeader title="Salvos" onBack={() => navigation.goBack()} />

      {loading ? (
        <LoadingList label="Carregando salvos..." />
      ) : rows.length === 0 ? (
        <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
          <EmptyState
            icon="heart-outline"
            title="Nada salvo por aqui"
            message="Toque no coração dos cursos e livros para guardar aqui."
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {rows.map((row) => {
            const isCourse = row.fav.type === "course";
            const title = row.course?.title ?? row.book?.title ?? row.fav.title;
            const mentorName = row.course?.mentor?.name ?? row.book?.mentor?.name;
            const category = row.course?.category ?? row.book?.category;
            const subtitle = row.failed
              ? "Não foi possível carregar este item."
              : [category, mentorName].filter(Boolean).join(" · ");
            return (
              <TouchableOpacity
                key={row.key}
                style={styles.row}
                onPress={() => openRow(row)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${title}`}
              >
                {row.failed ? (
                  <View
                    style={[styles.thumbBook, styles.thumbFallback]}
                    accessibilityRole="image"
                  >
                    <Ionicons name="alert-circle-outline" size={18} color={theme.colors.textFaint} />
                  </View>
                ) : isCourse ? (
                  <RemoteImage
                    uri={row.course?.coverUrl ?? null}
                    style={styles.thumbCourse}
                    recyclingKey={`fav-course-${row.fav.id}`}
                    fallbackIcon="play-circle-outline"
                    iconSize={18}
                  />
                ) : (
                  <RemoteImage
                    uri={row.book?.coverUrl ?? null}
                    style={styles.thumbBook}
                    recyclingKey={`fav-book-${row.fav.id}`}
                    fallbackIcon={(row.book?.kind ?? "BOOK") === "BOOK" ? "book-outline" : "document-text-outline"}
                    iconSize={18}
                  />
                )}
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() => handleRemove(row)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${title} dos salvos`}
                >
                  <Ionicons name="heart" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },

    /* Linha de item salvo */
    row: {
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
    rowInfo: { flex: 1, gap: 3 },
    rowTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "600", lineHeight: 19 },
    rowSub: { color: theme.colors.textMuted, fontSize: 12 },

    /* Miniaturas: livro 56x72 com radius, curso 48x48 circular */
    thumbBook: {
      width: 56,
      height: 72,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surfaceAlt,
    },
    thumbCourse: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceAlt,
    },
    thumbFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    heartButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
  });
