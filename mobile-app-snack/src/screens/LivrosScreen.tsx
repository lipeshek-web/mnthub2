/**
 * Aba Biblioteca: visual de ESTANTE (estilo Apple/Duolingo).
 * - Título grande + busca + chips de tipo (Todos/Livros/Artigos) e de
 *   categoria (derivadas dos itens carregados, filtro no servidor);
 * - Grade de 2 colunas com capas grandes em pé (BookCard "grid") — a lista
 *   rola por dentro, o cabeçalho fica fixo acima do dock flutuante;
 * - Paginação infinita + pull-to-refresh.
 */
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  listLibrary,
  type LibraryItemSummary,
  type LibraryKind,
} from "../lib/api";
import { usePagedList } from "../lib/usePagedList";
import { DOCK_CLEARANCE } from "../lib/tabs";
import { theme } from "../theme";
import { BookCard } from "../components/BookCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { FilterChip } from "../components/FilterChip";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";
import { SearchField } from "../components/SearchField";

type KindFilter = "ALL" | LibraryKind;

const KIND_FILTERS: Array<{ key: KindFilter; label: string }> = [
  { key: "ALL", label: "Todos" },
  { key: "BOOK", label: "Livros" },
  { key: "ARTICLE", label: "Artigos" },
];

export default function LibraryScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [category, setCategory] = useState<string | null>(null);

  // Debounce simples da busca (350ms) para não disparar a cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const list = usePagedList(
    (page) =>
      listLibrary({
        page,
        pageSize: 20,
        q: search || undefined,
        kind: kind === "ALL" ? undefined : kind,
        category: category ?? undefined,
      }),
    [search, kind, category]
  );

  // Categorias derivadas dos itens já carregados (o servidor aplica o filtro).
  const categories = useMemo(
    () =>
      Array.from(new Set(list.items.map((item) => item.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [list.items]
  );

  // Categoria selecionada sumiu (troca de filtro/busca) → volta para "Todas".
  useEffect(() => {
    if (category && !categories.includes(category)) setCategory(null);
  }, [categories, category]);

  const hasFilters = search.length > 0 || kind !== "ALL" || category !== null;

  return (
    <Screen>
      <FlatList<LibraryItemSummary>
        style={styles.flex}
        data={list.items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <BookCard
            item={item}
            variant="grid"
            onPress={() => navigation.navigate("Livro", { id: item.id })}
          />
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
            <Text style={styles.title}>Biblioteca</Text>
            <Text style={styles.subtitle}>Livros e artigos escolhidos pelos mentores</Text>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por título, tema ou mentor..."
            />
            <View style={styles.filters}>
              {KIND_FILTERS.map((filter) => (
                <FilterChip
                  key={filter.key}
                  label={filter.label}
                  selected={kind === filter.key}
                  onPress={() => setKind(filter.key)}
                />
              ))}
            </View>
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
                {list.total} {list.total === 1 ? "item" : "itens"}
              </Text>
            ) : null}
          </View>
        }
        ListFooterComponent={list.loadingMore ? <LoadingList compact /> : null}
        ListEmptyComponent={
          list.loading ? (
            <LoadingList label="Carregando biblioteca..." />
          ) : list.error ? (
            <ErrorBox message={list.error} onRetry={list.reload} />
          ) : (
            <EmptyState
              icon="book-outline"
              title="Nada encontrado"
              message={
                hasFilters
                  ? "Tente ajustar a busca ou os filtros."
                  : "A biblioteca está vazia por enquanto."
              }
              actionLabel={hasFilters ? "Limpar filtros" : undefined}
              onAction={
                hasFilters
                  ? () => {
                      setQuery("");
                      setKind("ALL");
                      setCategory(null);
                    }
                  : undefined
              }
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
    filters: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
    catRow: { gap: theme.spacing.sm, paddingRight: theme.spacing.lg },
    gridRow: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
    banner: { marginTop: -2 },
    count: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600", marginTop: -4 },
  });
