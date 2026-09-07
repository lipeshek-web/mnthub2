/**
 * Tela de busca global (stack "Busca"): um único campo que pesquisa cursos,
 * livros e mentores em paralelo (Promise.allSettled — uma falha não derruba as
 * demais). Debounce de 400ms para não buscar a cada tecla e sequencial interno
 * para descartar respostas velhas.
 * Ao abrir (sem termo): buscas recentes (persistidas no aparelho) e, sempre
 * abaixo delas, sugestões de conteúdo real (cursos/livros/mentores) carregadas
 * uma única vez no mount — falha silenciosa (cai no estado vazio com chips).
 * Termo curto (1 caractere, abaixo de MIN_TERM): filtra as sugestões já
 * carregadas localmente, sem acento e sem diferenciar maiúsculas — zero rede.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeBack } from "../lib/navigation";
import { Ionicons } from "@expo/vector-icons";
import {
  listCourses,
  listLibrary,
  listMentors,
  type CourseItem,
  type LibraryItemSummary,
  type MentorListItem,
} from "../lib/api";
import {
  clearRecent,
  listRecent,
  pushRecent,
  removeRecent,
  subscribeRecent,
} from "../lib/recentSearches";
import { theme } from "../theme";
import { BookCard } from "../components/BookCard";
import { CourseCard } from "../components/CourseCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { MentorCard } from "../components/MentorCard";
import { Screen } from "../components/Screen";
import { SearchField } from "../components/SearchField";
import { SectionTitle } from "../components/SectionTitle";

/** Tamanho mínimo do termo para disparar a busca. */
const MIN_TERM = 2;
/** Espera após a última tecla antes de buscar. */
const DEBOUNCE_MS = 400;

/** Sugestões fixas exibidas quando não há buscas recentes nem sugestões reais. */
const SUGGESTIONS = ["Design", "Carreira", "Finanças", "Dados", "Inglês"];

/** Sugestões de conteúdo real carregadas uma vez ao abrir a tela. */
interface SuggestionData {
  courses: CourseItem[];
  books: LibraryItemSummary[];
  mentors: MentorListItem[];
}

/** Minúsculas sem acento — para casar "Mentoria" com "mentoria"/"MENTORIA". */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** true se há ao menos um item de sugestão em qualquer seção. */
function hasAnySuggestion(data: SuggestionData): boolean {
  return data.courses.length > 0 || data.books.length > 0 || data.mentors.length > 0;
}

interface SearchResults {
  term: string;
  courses: CourseItem[];
  books: LibraryItemSummary[];
  mentors: MentorListItem[];
  /** true quando TODAS as buscas falharam (rede/servidor). */
  allFailed: boolean;
}

export default function BuscaScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const goBack = useSafeBack(navigation);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  /* Sugestões de conteúdo real (null = tudo falhou → fallback silencioso). */
  const [suggestions, setSuggestions] = useState<SuggestionData | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(true);

  // Invalida respostas de buscas antigas (o usuário já digitou outra coisa).
  const seqRef = useRef(0);
  // Último termo efetivamente buscado (evita refazer a mesma busca).
  const lastTermRef = useRef("");

  /* Buscas recentes: estado local + assinatura para atualizar na hora. */
  useEffect(() => {
    let alive = true;
    const sync = () => {
      void listRecent().then((list) => {
        if (alive) setRecent(list);
      });
    };
    sync();
    const unsubscribe = subscribeRecent(sync);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  /* Sugestões reais: uma única rodada em paralelo no mount. Falha silenciosa —
     se TUDO falhar (ou vier vazio), suggestions fica null e a tela cai no
     estado vazio de sempre (EmptyState + chips fixos), sem ErrorBox. */
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [coursesRes, booksRes, mentorsRes] = await Promise.allSettled([
        listCourses({ pageSize: 3 }),
        listLibrary({ pageSize: 2 }),
        listMentors({ pageSize: 3 }),
      ]);
      if (!alive) return;
      const data: SuggestionData = {
        courses: coursesRes.status === "fulfilled" ? coursesRes.value.items : [],
        books: booksRes.status === "fulfilled" ? booksRes.value.items : [],
        mentors: mentorsRes.status === "fulfilled" ? mentorsRes.value.items : [],
      };
      if (!hasAnySuggestion(data)) {
        setSuggestLoading(false); // nada carregou — mantém o fallback
        return;
      }
      setSuggestions(data);
      setSuggestLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const runSearch = useCallback(async (term: string) => {
    const clean = term.trim();
    if (clean.length < MIN_TERM) return;
    const seq = ++seqRef.current;
    lastTermRef.current = clean.toLowerCase();
    setSearching(true);

    const [coursesRes, booksRes, mentorsRes] = await Promise.allSettled([
      listCourses({ q: clean, pageSize: 8 }),
      listLibrary({ q: clean, pageSize: 6 }),
      listMentors({ q: clean, pageSize: 6 }),
    ]);

    if (seq !== seqRef.current) return; // resposta velha — descarta em silêncio

    const allFailed =
      coursesRes.status === "rejected" &&
      booksRes.status === "rejected" &&
      mentorsRes.status === "rejected";

    setResults({
      term: clean,
      courses: coursesRes.status === "fulfilled" ? coursesRes.value.items : [],
      books: booksRes.status === "fulfilled" ? booksRes.value.items : [],
      mentors: mentorsRes.status === "fulfilled" ? mentorsRes.value.items : [],
      allFailed,
    });
    setSearching(false);

    // Busca concluída com sucesso (ao menos em parte) — guarda nas recentes.
    if (!allFailed) void pushRecent(clean);
  }, []);

  /* Debounce: resultados só trocam 400ms depois da última tecla. */
  useEffect(() => {
    const clean = q.trim();
    if (clean.length < MIN_TERM) {
      // Campo vazio/curto: sai da busca na hora (sem rede) e invalida em voo.
      seqRef.current += 1;
      lastTermRef.current = "";
      setSearching(false);
      setResults(null);
      return;
    }
    if (clean.toLowerCase() === lastTermRef.current) return;
    const timer = setTimeout(() => {
      void runSearch(clean);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, runSearch]);

  /** Chip de recente/sugestão: preenche o campo e busca imediatamente. */
  const handleQuickSearch = useCallback(
    (term: string) => {
      setQ(term);
      void runSearch(term);
    },
    [runSearch]
  );

  const handleClearRecent = useCallback(() => {
    void clearRecent();
  }, []);

  const handleRemoveRecent = useCallback((term: string) => {
    void removeRecent(term);
  }, []);

  const hasResults =
    results !== null &&
    (results.courses.length > 0 || results.books.length > 0 || results.mentors.length > 0);

  const clean = q.trim();
  /* Termo curto: abaixo de MIN_TERM ainda não busca no servidor — filtra local. */
  const shortTerm = clean.length >= 1 && clean.length < MIN_TERM;

  /* Filtro local das sugestões para termo curto (sem tocar na rede). */
  const filteredSuggestions = useMemo<SuggestionData | null>(() => {
    if (!suggestions || !shortTerm) return null;
    const nq = normalize(clean);
    return {
      courses: suggestions.courses.filter((c) => normalize(c.title).includes(nq)),
      books: suggestions.books.filter((b) => normalize(b.title).includes(nq)),
      mentors: suggestions.mentors.filter((m) => normalize(m.name).includes(nq)),
    };
  }, [suggestions, shortTerm, clean]);

  /** Seções de sugestão (mesma renderização no estado vazio e no termo curto). */
  const renderSuggestions = (data: SuggestionData) => (
    <>
      {data.courses.length > 0 ? (
        <View>
          <SectionTitle title="Em alta · Cursos" />
          {data.courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => navigation.navigate("Curso", { id: course.id })}
            />
          ))}
        </View>
      ) : null}
      {data.books.length > 0 ? (
        <View>
          <SectionTitle title="Livros" />
          {data.books.map((book) => (
            <BookCard
              key={book.id}
              item={book}
              onPress={() => navigation.navigate("Livro", { id: book.id })}
            />
          ))}
        </View>
      ) : null}
      {data.mentors.length > 0 ? (
        <View>
          <SectionTitle title="Mentores" />
          {data.mentors.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onPress={() => navigation.navigate("Mentor", { id: mentor.id })}
            />
          ))}
        </View>
      ) : null}
    </>
  );

  return (
    <Screen edges={["top", "left", "right", "bottom"]}>
      {/* Topo: voltar (44px) + campo de busca com foco automático */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.back}
          onPress={goBack}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.fieldWrap}>
          <SearchField
            value={q}
            onChangeText={setQ}
            placeholder="Buscar cursos, livros e mentores..."
            autoFocus
            onSubmitEditing={() => void runSearch(q)}
          />
        </View>
      </View>

      {searching ? (
        /* Buscando: indicador discreto centrado (resultados antigos ficam de lado). */
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} size="small" />
        </View>
      ) : results && !hasResults ? (
        results.allFailed ? (
          <ErrorBox
            message="Não foi possível buscar agora. Verifique sua conexão e tente de novo."
            onRetry={() => void runSearch(results.term)}
          />
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <EmptyState
              icon="search-outline"
              title={`Nada encontrado para “${results.term}”`}
              message="Tente outras palavras-chave, confira a ortografia ou busque pelo nome do mentor."
            />
          </ScrollView>
        )
      ) : results ? (
        /* Resultados agrupados — só as seções com itens aparecem. */
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {results.courses.length > 0 ? (
            <View>
              <SectionTitle title="Cursos" />
              {results.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onPress={() => navigation.navigate("Curso", { id: course.id })}
                />
              ))}
            </View>
          ) : null}
          {results.books.length > 0 ? (
            <View>
              <SectionTitle title="Livros" />
              {results.books.map((book) => (
                <BookCard
                  key={book.id}
                  item={book}
                  onPress={() => navigation.navigate("Livro", { id: book.id })}
                />
              ))}
            </View>
          ) : null}
          {results.mentors.length > 0 ? (
            <View>
              <SectionTitle title="Mentores" />
              {results.mentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onPress={() => navigation.navigate("Mentor", { id: mentor.id })}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : (
        /* Sem termo/termo curto: recentes + sugestões de conteúdo real.
           Termo curto mostra as sugestões filtradas localmente (sem recentes,
           sem rede) — "sobrar só o que corresponde". */
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!shortTerm && recent.length > 0 ? (
            <>
              <SectionTitle
                title="Buscas recentes"
                actionLabel="Limpar"
                onAction={handleClearRecent}
              />
              <View style={styles.chipsWrap}>
                {recent.map((term) => (
                  <View key={term} style={styles.recentChip}>
                    <TouchableOpacity
                      style={styles.recentChipLabel}
                      onPress={() => handleQuickSearch(term)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 2 }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Buscar por ${term}`}
                    >
                      <Text style={styles.recentChipText} numberOfLines={1}>
                        {term}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.recentChipClear}
                      onPress={() => handleRemoveRecent(term)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${term} das buscas recentes`}
                    >
                      <Ionicons name="close" size={14} color={theme.colors.textFaint} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {shortTerm ? (
            filteredSuggestions && hasAnySuggestion(filteredSuggestions) ? (
              renderSuggestions(filteredSuggestions)
            ) : (
              <Text style={styles.continueHint}>
                Continue digitando para buscar em tudo...
              </Text>
            )
          ) : suggestLoading ? (
            /* Sugestões carregando: indicador discreto no lugar das seções. */
            <View style={styles.suggestLoading}>
              <ActivityIndicator color={theme.colors.accent} size="small" />
            </View>
          ) : suggestions ? (
            /* Conteúdo real carregado — substitui o EmptyState + chips antigos. */
            renderSuggestions(suggestions)
          ) : recent.length === 0 ? (
            /* Fallback: sem sugestões (falhou/vazio) e sem recentes. */
            <>
              <EmptyState
                icon="search-outline"
                title="Busque na Órbita"
                message="Encontre cursos, livros e mentores pelo nome."
              />
              <Text style={styles.suggestLabel}>Sugestões</Text>
              <View style={styles.chipsWrap}>
                {SUGGESTIONS.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={styles.suggestChip}
                    onPress={() => handleQuickSearch(term)}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Buscar por ${term}`}
                  >
                    <Text style={styles.suggestChipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}
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
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    /* Topo: voltar + campo */
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    // Área de toque >= 44px (HIG), mesma linguagem do ScreenHeader.
    back: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    fieldWrap: { flex: 1 },

    /* Chips de recentes/sugestões */
    chipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    recentChip: {
      flexDirection: "row",
      alignItems: "center",
      height: 34,
      paddingLeft: 13,
      paddingRight: 3,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    recentChipLabel: {
      maxWidth: 200,
      justifyContent: "center",
    },
    recentChipText: { color: theme.colors.text, fontSize: 13, fontWeight: "600" },
    recentChipClear: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    suggestLabel: {
      color: theme.colors.textFaint,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: theme.spacing.md,
    },

    /* Sugestões de conteúdo real (estado vazio / termo curto) */
    suggestLoading: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.xxl,
    },
    continueHint: {
      color: theme.colors.textFaint,
      fontSize: 13,
      textAlign: "center",
      paddingVertical: theme.spacing.lg,
    },
    suggestChip: {
      height: 34,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    suggestChipText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },
  });
