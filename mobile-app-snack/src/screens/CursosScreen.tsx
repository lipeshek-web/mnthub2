/**
 * Aba Cursos: catálogo em GRADE (estilo Apple/Duolingo) — cards verticais com
 * capa 16:9, busca por texto, chips de categoria (derivadas dos itens
 * carregados, filtro no servidor), badge "Inscrito", paginação infinita e
 * pull-to-refresh.
 */
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { listCourses, type CourseItem } from "../lib/api";
import { usePagedList } from "../lib/usePagedList";
import { DOCK_CLEARANCE } from "../lib/tabs";
import { theme } from "../theme";
import { CourseCard } from "../components/CourseCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { FilterChip } from "../components/FilterChip";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";
import { SearchField } from "../components/SearchField";

export default function CoursesScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  // Debounce simples da busca (350ms) para não disparar a cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const list = usePagedList(
    (page) =>
      listCourses({
        page,
        pageSize: 20,
        q: search || undefined,
        category: category ?? undefined,
      }),
    [search, category]
  );

  // Categorias derivadas dos itens já carregados (o servidor aplica o filtro).
  const categories = useMemo(
    () =>
      Array.from(new Set(list.items.map((item) => item.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [list.items]
  );

  // Categoria selecionada sumiu (troca de busca) → volta para "Todas".
  useEffect(() => {
    if (category && !categories.includes(category)) setCategory(null);
  }, [categories, category]);

  return (
    <Screen>
      <FlatList<CourseItem>
        style={styles.flex}
        data={list.items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <View style={styles.gridCell}>
            <CourseCard
              course={item}
              variant="reco"
              onPress={() => navigation.navigate("Curso", { id: item.id })}
            />
          </View>
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={list.refresh}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Cursos</Text>
            <Text style={styles.subtitle}>
              Aprenda no seu ritmo — vídeos, textos e aulas ao vivo
            </Text>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por título, tema ou mentor..."
            />
            {categories.length > 0 ? (
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catRow}
              >
                <FilterChip
                  label="Todas"
                  selected={category === null}
                  onPress={() => setCategory(null)}
                />
                {categories.map((cat) => (
                  <FilterChip
                    key={cat}
                    label={cat}
                    selected={category === cat}
                    onPress={() => setCategory(cat === category ? null : cat)}
                  />
                ))}
              </ScrollView>
            ) : null}
            {list.error && list.items.length > 0 ? (
              <View style={styles.banner}>
                <ErrorBox compact message={list.error} onRetry={list.refresh} />
              </View>
            ) : !list.loading && !list.error ? (
              <Text style={styles.count}>
                {list.total} {list.total === 1 ? "curso" : "cursos"}
              </Text>
            ) : null}
          </View>
        }
        ListFooterComponent={list.loadingMore ? <LoadingList compact /> : null}
        ListEmptyComponent={
          list.loading ? (
            <LoadingList label="Carregando cursos..." />
          ) : list.error ? (
            <ErrorBox message={list.error} onRetry={list.reload} />
          ) : (
            <EmptyState
              icon="play-circle-outline"
              title="Nenhum curso encontrado"
              message={search ? "Tente buscar por outro termo." : "O catálogo está vazio por enquanto."}
              actionLabel={search ? "Limpar busca" : undefined}
              onAction={search ? () => setQuery("") : undefined}
            />
          )
        }
      />
    </Screen>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.lg,
      /* folga para o conteúdo nunca nascer sob o dock flutuante */
      paddingBottom: DOCK_CLEARANCE,
    },
    header: { gap: theme.spacing.md, marginBottom: theme.spacing.md },
    title: { color: theme.colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.6 },
    subtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: -8 },
    catRow: { gap: theme.spacing.sm, paddingRight: theme.spacing.lg },
    gridRow: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
    /* célula fluida da grade (o card "reco" não tem largura própria) */
    gridCell: { flex: 1 },
    banner: { marginTop: -2 },
    count: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600", marginTop: -4 },
  });
