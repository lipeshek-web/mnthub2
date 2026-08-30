/**
 * Aba Livros: biblioteca de livros e artigos com busca por texto,
 * filtro por tipo (Todos/Livros/Artigos), paginação e pull-to-refresh.
 */
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  listLibrary,
  type LibraryItemSummary,
  type LibraryKind,
} from "../lib/api";
import { usePagedList } from "../lib/usePagedList";
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
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("ALL");

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
      }),
    [search, kind]
  );

  const hasFilters = search.length > 0 || kind !== "ALL";

  return (
    <Screen>
      <FlatList<LibraryItemSummary>
        style={styles.flex}
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookCard item={item} onPress={() => navigation.navigate("Livro", { id: item.id })} />
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: { gap: theme.spacing.md, marginBottom: theme.spacing.md },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "700", letterSpacing: -0.4 },
  subtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: -6 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  banner: { marginTop: -2 },
  count: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600", marginTop: -4 },
});
