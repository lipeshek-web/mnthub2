/**
 * Ranking da semana — competição saudável estilo Duolingo.
 * Lista os membros com mais XP ganho desde a segunda-feira (recomeça toda
 * semana, então todo mundo tem chance nova), com a posição do usuário sempre
 * visível no rodapé — mesmo fora do top. Falha silenciosa em servidor antigo.
 */
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import {
  errMessage,
  getWeeklyLeaderboard,
  isMissingEndpoint,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import { Avatar } from "../components/Avatar";
import { ErrorBox } from "../components/ErrorBox";
import { LoadingList } from "../components/LoadingList";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";

/** Cores das medalhas do pódio (1º ouro · 2º prata · 3º bronze). */
const MEDALS = ["#f59e0b", "#a8a29e", "#fdba74"];
const TOP_SHOWN = 20;

export default function RankingScreen() {
  const styles = makeStyles();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      setBoard(await getWeeklyLeaderboard());
    } catch (err) {
      // Servidor antigo (sem o endpoint) → mensagem amigável, sem quebrar a tela.
      setError(isMissingEndpoint(err) ? SERVER_OUTDATED : errMessage(err));
      setBoard(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

  const items = board?.items.slice(0, TOP_SHOWN) ?? [];
  const me = board?.me ?? null;
  const meInTop = me != null && me.rank >= 1 && me.rank <= items.length;
  const total = board?.totalActive ?? 0;

  const renderRow = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1;
    const isMe = user?.id === item.userId;
    return (
      <View style={[styles.row, isMe ? styles.rowMe : null]}>
        <View
          style={[
            styles.rankBadge,
            rank <= 3
              ? { backgroundColor: MEDALS[rank - 1] }
              : styles.rankBadgePlain,
          ]}
        >
          <Text style={[styles.rankText, rank <= 3 ? { color: "#ffffff" } : null]}>{rank}</Text>
        </View>
        <Avatar uri={item.avatarUrl} name={item.name} size={38} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.name}
            {isMe ? " (você)" : ""}
          </Text>
          <Text style={styles.rowLevel} numberOfLines={1}>
            {item.levelLabel}
          </Text>
        </View>
        <View style={styles.rowXp}>
          <Ionicons name="flash" size={13} color={theme.colors.accent} />
          <Text style={styles.rowXpText}>+{item.weekXp}</Text>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title="Ranking da semana"
        subtitle="XP ganho desde a segunda-feira"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <LoadingList label="Carregando ranking..." />
      ) : error && !board ? (
        <View style={styles.body}>
          <ErrorBox message={error} onRetry={() => void load("initial")} />
        </View>
      ) : (
        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.content}
          data={items}
          keyExtractor={(item) => item.userId}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load("refresh")}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          ListHeaderComponent={
            items.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="podium-outline" size={44} color={theme.colors.textFaint} />
                <Text style={styles.emptyTitle}>Ninguém pontuou ainda</Text>
                <Text style={styles.emptyText}>
                  Conclua a primeira aula da semana e apareça em 1º lugar 🚀
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            me ? (
              <View style={styles.meCard}>
                <View style={styles.meRow}>
                  <Ionicons name="trophy" size={16} color={theme.colors.warning} />
                  {me.rank > 0 ? (
                    <Text style={styles.meText}>
                      Você está em {me.rank}º com +{me.weekXp} XP esta semana
                    </Text>
                  ) : (
                    <Text style={styles.meText}>
                      Você ainda não pontuou esta semana — conclua uma aula! ✨
                    </Text>
                  )}
                </View>
                {total > 0 ? (
                  <Text style={styles.meSub}>
                    {total} {total === 1 ? "membro pontuou" : "membros pontuaram"} — o ranking recomeça toda segunda
                  </Text>
                ) : null}
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const SERVER_OUTDATED =
  "O ranking ainda não está disponível neste servidor — publique a versão mais recente do site.";

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    body: { flex: 1, padding: theme.spacing.lg },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    rowMe: {
      backgroundColor: theme.colors.accentSoft,
      borderColor: theme.colors.accentBorder,
    },
    rankBadge: {
      width: 26,
      height: 26,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    rankBadgePlain: {
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    rankText: { fontSize: 11.5, fontWeight: "800", color: theme.colors.textMuted },
    rowInfo: { flex: 1, gap: 1 },
    rowName: { color: theme.colors.text, fontSize: 13.5, fontWeight: "700" },
    rowLevel: { color: theme.colors.textFaint, fontSize: 10.5, fontWeight: "600" },
    rowXp: { flexDirection: "row", alignItems: "center", gap: 3 },
    rowXpText: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },

    empty: { alignItems: "center", gap: 6, paddingVertical: theme.spacing.xxl },
    emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800", marginTop: 8 },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 18,
      maxWidth: 260,
    },

    meCard: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: 4,
    },
    meRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    meText: { color: theme.colors.text, fontSize: 13, fontWeight: "700", flexShrink: 1 },
    meSub: { color: theme.colors.textFaint, fontSize: 11, fontWeight: "500" },
  });
