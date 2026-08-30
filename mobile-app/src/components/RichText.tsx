/**
 * Bloco de texto longo legível: separa parágrafos por linhas em branco.
 * Usado no conteúdo de artigos da biblioteca e de aulas textuais.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

interface RichTextProps {
  text: string;
}

export function RichText({ text }: RichTextProps) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <View style={styles.stack}>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: theme.spacing.md },
  paragraph: { color: theme.colors.text, fontSize: 15, lineHeight: 24 },
});
