/**
 * Aba Explorar — o "App Store" da Órbita: UM lugar com TUDO o que dá para
 * consumir (Cursos · Livros · Mentorias) sob um segmented control estilo iOS
 * (trilha cinza + polegar branco deslizante). Substitui as 3 antigas abas
 * Livros/Cursos/Mentorias — navegação minimalista, mais nativa.
 *
 * - Título grande iOS + subtítulo curto;
 * - O segmento ativo vive no TabsContext (useTabs().segment) — telas do
 *   stack podem pedir Explorar já no segmento certo (setTab + setSegment);
 * - Cada segmento é um componente próprio (Cursos/Livros/Mentorias) com
 *   busca, filtros, paginação e pull-to-refresh internos.
 */
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SEGMENT_NAMES, useTabs, type SegmentName } from "../lib/tabs";
import { theme } from "../theme";
import { Screen } from "../components/Screen";
import { CursosSegment } from "./CursosScreen";
import { LivrosSegment } from "./LivrosScreen";
import { MentoriasSegment } from "./MentoriasScreen";

export default function ExplorarScreen() {
  const styles = makeStyles();
  const { segment, setSegment } = useTabs();
  const index = Math.max(SEGMENT_NAMES.indexOf(segment), 0);

  return (
    <Screen>
      <View style={styles.container}>
        {/* Cabeçalho grande estilo iOS */}
        <View style={styles.header}>
          <Text style={styles.title}>Explorar</Text>
          <Text style={styles.subtitle}>Cursos, livros e mentorias em um só lugar</Text>
        </View>

        {/* Segmented control nativo iOS */}
        <View style={styles.segTrack}>
          <View
            pointerEvents="none"
            style={[
              styles.segThumb,
              { left: `${(100 / SEGMENT_NAMES.length) * index}%`, width: `${100 / SEGMENT_NAMES.length}%` },
            ]}
          />
          {SEGMENT_NAMES.map((name) => {
            const active = name === segment;
            return (
              <TouchableOpacity
                key={name}
                style={styles.segCell}
                onPress={() => setSegment(name as SegmentName)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Segmento ${name}`}
              >
                <Text style={[styles.segText, active ? styles.segTextActive : null]} numberOfLines={1}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Conteúdo do segmento ativo (remonta ao trocar — estado limpo) */}
        <View style={styles.flex}>
          {segment === "Cursos" ? <CursosSegment /> : null}
          {segment === "Livros" ? <LivrosSegment /> : null}
          {segment === "Mentorias" ? <MentoriasSegment /> : null}
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.md,
      gap: 3,
    },
    title: {
      color: theme.colors.text,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.8,
    },
    subtitle: {
      color: theme.colors.textFaint,
      fontSize: 13,
      fontWeight: "500",
    },
    /* Trilha do segmented control (iOS): cinza arredondado + polegar branco */
    segTrack: {
      flexDirection: "row",
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceAlt,
      padding: 2,
      overflow: "hidden",
    },
    segThumb: {
      position: "absolute",
      top: 2,
      bottom: 2,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    segCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    segText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    segTextActive: {
      color: theme.colors.text,
      fontWeight: "700",
    },
  });
