/**
 * Detalhe de livro/artigo da biblioteca:
 * - Livro com pdfUrl → botão "Ler agora" (navegador in-app via expo-web-browser).
 * - Artigo com content → texto renderizado de forma legível na própria tela.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { errMessage, getLibraryItem, type LibraryItemDetail } from "../../src/lib/api";
import { levelLabel } from "../../src/lib/format";
import { theme } from "../../src/theme";
import { Avatar } from "../../src/components/Avatar";
import { Chip } from "../../src/components/Chip";
import { ErrorBox } from "../../src/components/ErrorBox";
import { LoadingList } from "../../src/components/LoadingList";
import { RichText } from "../../src/components/RichText";
import { Screen } from "../../src/components/Screen";
import { ScreenHeader } from "../../src/components/ScreenHeader";

export default function BookDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [item, setItem] = useState<LibraryItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

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

  async function openPdf(url: string) {
    if (opening) return;
    setOpening(true);
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert(
        "Não foi possível abrir",
        "Verifique se o dispositivo possui um navegador ou leitor de PDF."
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: item ? (isBook ? "Livro" : "Artigo") : "Biblioteca" }} />
      {loading ? (
        <LoadingList label="Carregando..." />
      ) : error && !item ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : item ? (
        <>
          <ScreenHeader title={isBook ? "Livro" : "Artigo"} onBack={() => router.back()} />
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Capa */}
            {item.coverUrl ? (
              <Image
                source={{ uri: item.coverUrl }}
                style={styles.cover}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.coverFallback}>
                <Ionicons
                  name={isBook ? "book-outline" : "document-text-outline"}
                  size={40}
                  color={theme.colors.textFaint}
                />
              </View>
            )}

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
              onPress={() => router.push(`/mentor/${item.mentor.id}`)}
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
                style={[styles.readButton, opening && styles.readButtonDisabled]}
                onPress={() => void openPdf(pdfUrl)}
                disabled={opening}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Ler agora — abre o PDF no navegador"
              >
                {opening ? (
                  <ActivityIndicator size="small" color={theme.colors.bg} />
                ) : (
                  <Ionicons name="book" size={17} color={theme.colors.bg} />
                )}
                <Text style={styles.readButtonText}>Ler agora</Text>
              </TouchableOpacity>
            ) : null}
            {pdfUrl ? (
              <Text style={styles.readHint}>O PDF abre no navegador do dispositivo.</Text>
            ) : null}

            {item.content ? (
              <View style={styles.article}>
                <Text style={styles.articleTitle}>Conteúdo</Text>
                <RichText text={item.content} />
              </View>
            ) : null}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  coverFallback: {
    width: 150,
    height: 210,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
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
  readButtonDisabled: { opacity: 0.6 },
  readButtonText: { color: theme.colors.bg, fontSize: 15, fontWeight: "700" },
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
