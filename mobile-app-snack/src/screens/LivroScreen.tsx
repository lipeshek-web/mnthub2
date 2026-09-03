/**
 * Detalhe de livro/artigo da biblioteca:
 * - Livro com pdfUrl → botão "Ler agora" abre o LEITOR NATIVO (PdfReader):
 *   o servidor rasteriza as páginas do PDF e o app as exibe página a página,
 *   com zoom (dois toques), modo noturno, barra de progresso e retomada da
 *   leitura — sem WebView e sem browser embutido.
 * - Artigo com content → texto renderizado de forma legível na própria tela.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeBack } from "../lib/navigation";
import { Ionicons } from "@expo/vector-icons";
import { assetUrl, errMessage, getLibraryItem, type LibraryItemDetail } from "../lib/api";
import { BOOK_PAGES } from "../lib/bookPages";
import { levelLabel } from "../lib/format";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { Chip } from "../components/Chip";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { RemoteImage } from "../components/RemoteImage";
import { RichText } from "../components/RichText";
import { PdfReader } from "../components/PdfReader";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";

export default function BookDetailScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const goBack = useSafeBack(navigation);
  const params = (useRoute<any>().params ?? {}) as { id: string };
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [item, setItem] = useState<LibraryItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Leitor nativo de PDF (aberto/fechado).
  const [readerOpen, setReaderOpen] = useState(false);

  const load = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLibraryItem(itemId);
      setItem(res.item);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isBook = item?.kind === "BOOK";
  const pdfUrl = isBook && item ? item.pdfUrl : null;
  // PDF original normalizado para o servidor atual (usado no fallback do leitor).
  const pdfOriginalUrl = assetUrl(pdfUrl);

  return (
    <Screen>
      {loading ? (
        <LoadingList label="Carregando..." />
      ) : error && !item ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : item ? (
        <>
          <ScreenHeader title={isBook ? "Livro" : "Artigo"} onBack={goBack} />
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Capa */}
            <RemoteImage
              uri={item.coverUrl}
              style={styles.cover}
              recyclingKey={item.id}
              fallbackIcon={isBook ? "book-outline" : "document-text-outline"}
              iconSize={40}
              errorIcon="image-outline"
            />

            <Text style={styles.title}>{item.title}</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

            {/* Metadados */}
            <View style={styles.chipsRow}>
              <Chip label={item.category} tone="accent" />
              {levelLabel(item.level) ? <Chip label={levelLabel(item.level)} tone="outline" /> : null}
              {item.readingMin ? <Chip label={`~${item.readingMin} min de leitura`} /> : null}
            </View>

            {/* Mentor */}
            <TouchableOpacity
              style={styles.mentorCard}
              onPress={() => navigation.navigate("Mentor", { id: item.mentor.id })}
              activeOpacity={0.85}
            >
              <Avatar uri={item.mentor.avatarUrl} name={item.mentor.name} size={40} />
              <View style={styles.mentorInfo}>
                <Text style={styles.mentorName} numberOfLines={1}>
                  {item.mentor.name}
                </Text>
                {item.mentor.headline ? (
                  <Text style={styles.mentorHeadline} numberOfLines={1}>
                    {item.mentor.headline}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </TouchableOpacity>

            {/* Ações / conteúdo */}
            {pdfUrl ? (
              <TouchableOpacity
                style={styles.readButton}
                onPress={() => setReaderOpen(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Ler agora — abre o PDF no leitor do app"
              >
                <Ionicons name="book" size={17} color={theme.colors.onAccent} />
                <Text style={styles.readButtonText}>Ler agora</Text>
              </TouchableOpacity>
            ) : null}
            {pdfUrl ? (
              <Text style={styles.readHint}>
                Leitor do app: páginas abrem na hora — deslize, dê dois toques
                para ampliar e use o modo noturno.
              </Text>
            ) : null}

            {item.content ? (
              <View style={styles.article}>
                <Text style={styles.articleTitle}>Conteúdo</Text>
                <RichText text={item.content} />
              </View>
            ) : null}

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Leitor de PDF nativo (páginas embutidas — abertura instantânea) */}
          {pdfUrl && item ? (
            <PdfReader
              visible={readerOpen}
              itemId={item.id}
              title={item.title}
              staticManifest={BOOK_PAGES[item.id] ?? null}
              originalUrl={pdfOriginalUrl}
              onClose={() => setReaderOpen(false)}
            />
          ) : null}
        </>
      ) : null}
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
    cover: {
      width: 150,
      height: 210,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceAlt,
      alignSelf: "center",
      marginBottom: theme.spacing.lg,
    },
  title: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: theme.spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  mentorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginTop: theme.spacing.lg,
  },
  mentorInfo: { flex: 1, gap: 2 },
  mentorName: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
  mentorHeadline: { color: theme.colors.textMuted, fontSize: 12 },
  readButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    minHeight: 50,
  },
  readButtonText: { color: theme.colors.onAccent, fontSize: 15, fontWeight: "700" },
  readHint: {
    color: theme.colors.textFaint,
    fontSize: 12,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },

  article: { marginTop: theme.spacing.xl },
  articleTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: theme.spacing.md,
  },
  bottomSpacer: { height: theme.spacing.lg },
});
