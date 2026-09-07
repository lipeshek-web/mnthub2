/**
 * Bloco de texto longo legível com markdown LEVE — usado no conteúdo de
 * artigos da biblioteca e de aulas textuais.
 *
 * Suporta (o que o conteúdo da plataforma realmente usa):
 *   - Parágrafos separados por linhas em branco;
 *   - Títulos "## " e "### " no início do bloco;
 *   - Listas com linhas "- " (ou "* ");
 *   - **negrito** e `código` no meio do texto.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

interface RichTextProps {
  text: string;
}

/** Divide um trecho em partes com estilo: **negrito** e `código`. */
function renderInline(text: string, styles: ReturnType<typeof makeStyles>): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Divide preservando os delimitadores: **negrito** ou `código`.
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const chunks = text.split(regex);
  chunks.forEach((chunk, index) => {
    if (!chunk) return;
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      parts.push(
        <Text key={`b${index}`} style={styles.bold}>
          {chunk.slice(2, -2)}
        </Text>
      );
    } else if (chunk.startsWith("`") && chunk.endsWith("`")) {
      parts.push(
        <Text key={`c${index}`} style={styles.code}>
          {chunk.slice(1, -1)}
        </Text>
      );
    } else {
      parts.push(<Text key={`t${index}`}>{chunk}</Text>);
    }
  });
  return parts;
}

export function RichText({ text }: RichTextProps) {
  const styles = makeStyles();
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return (
    <View style={styles.stack}>
      {blocks.map((block, index) => {
        // Títulos markdown ("## "/"### ") — o título é a PRIMEIRA linha do
        // bloco; as linhas seguintes (quando existem) voltam a ser parágrafo.
        if (block.startsWith("## ") || block.startsWith("### ")) {
          const isH3 = block.startsWith("### ");
          const marker = isH3 ? "### " : "## ";
          const nl = block.indexOf("\n");
          const headingLine = nl === -1 ? block : block.slice(0, nl);
          const rest = nl === -1 ? "" : block.slice(nl + 1).trim();
          return (
            <View key={index} style={styles.section}>
              <Text style={isH3 ? styles.h3 : styles.h2}>
                {renderInline(headingLine.slice(marker.length), styles)}
              </Text>
              {rest.length > 0 ? (
                <Text style={styles.paragraph}>{renderInline(rest, styles)}</Text>
              ) : null}
            </View>
          );
        }
        // Lista ("- " ou "* " em todas as linhas do bloco).
        const lines = block.split("\n").map((line) => line.trim());
        const isList = lines.length > 0 && lines.every((line) => /^[-*] /.test(line));
        if (isList) {
          return (
            <View key={index} style={styles.list}>
              {lines.map((line, lineIndex) => (
                <View key={lineIndex} style={styles.listRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.paragraph}>{renderInline(line.slice(2), styles)}</Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={index} style={styles.paragraph}>
            {renderInline(block, styles)}
          </Text>
        );
      })}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    stack: { gap: theme.spacing.md },
    section: { gap: 6 },
    paragraph: { color: theme.colors.text, fontSize: 15, lineHeight: 24 },
    h2: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.4,
      lineHeight: 24,
      marginTop: theme.spacing.xs,
    },
    h3: {
      color: theme.colors.text,
      fontSize: 15.5,
      fontWeight: "700",
      lineHeight: 21,
      marginTop: 2,
    },
    bold: { fontWeight: "700" },
    code: {
      fontFamily: "monospace",
      fontSize: 13.5,
      color: theme.colors.accentStrong,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 6,
      overflow: "hidden",
    },
    list: { gap: theme.spacing.sm },
    listRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.accent,
      marginTop: 9,
    },
  });
