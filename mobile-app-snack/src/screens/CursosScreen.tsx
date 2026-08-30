/**
 * Aba Cursos: catálogo de cursos com busca por texto, badge "Inscrito"
 * (no CourseCard), paginação infinita e pull-to-refresh.
 */
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { listCourses, type CourseItem } from "../lib/api";
import { usePagedList } from "../lib/usePagedList";
import { theme } from "../theme";
import { CourseCard } from "../components/CourseCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";
import { SearchField } from "../components/SearchField";

export default function CoursesScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  // Debounce simples da busca (350ms) para não disparar a cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const list = usePagedList(
    (page) => listCourses({ page, pageSize: 20, q: search || undefined }),
    [search]
  );

  return (
    <Screen>
      <FlatList<CourseItem>
        style={styles.flex}
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CourseCard course={item} onPress={() => navigation.navigate("Curso", { id: item.id })} />
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: { gap: theme.spacing.md, marginBottom: theme.spacing.md },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "700", letterSpacing: -0.4 },
  subtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: -6 },
  banner: { marginTop: -2 },
  count: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600", marginTop: -4 },
});
