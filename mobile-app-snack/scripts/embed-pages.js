// Gera src/lib/bookPagesData/*.ts com os PNGs embutidos como data URI (base64).
// Motivo: o runtime do Snack trava em "Loading..." quando o projeto salvo
// contém arquivos ASSET (comprovado por probes A/B em 2026-09-02). Embutindo
// os bytes no CÓDIGO (data URI), o preview web e o Expo Go funcionam e o
// leitor continua 100% nativo (imagens página a página, sem WebView).
const fs = require("fs");
const path = require("path");

const srcDir = "/home/z/my-project/mobile-app-snack/assets/pages";
const outDir = "/home/z/my-project/mobile-app-snack/src/lib/bookPagesData";
fs.mkdirSync(outDir, { recursive: true });

const groups = {
  arquitetura: "ArquiteturaPages",
  dados: "DadosPages",
  gestao: "GestaoPages",
  inovacao: "InovacaoPages",
  pomodoro: "PomodoroPages",
};

for (const [prefix, symbol] of Object.entries(groups)) {
  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.startsWith(prefix + "-") && f.endsWith(".png"))
    .sort((a, b) => {
      const na = parseInt(a.match(/-p(\d+)\.png$/)[1], 10);
      const nb = parseInt(b.match(/-p(\d+)\.png$/)[1], 10);
      return na - nb;
    });
  const uris = files.map((f) =>
    "data:image/png;base64," + fs.readFileSync(path.join(srcDir, f)).toString("base64"),
  );
  const body =
    `/** Páginas pré-renderizadas (data URI base64) — gerado por scripts/embed-pages.js. NÃO editar à mão. */\n` +
    `export const ${symbol}: string[] = [\n` +
    uris.map((u) => `  "${u}",`).join("\n") +
    `\n];\n`;
  fs.writeFileSync(path.join(outDir, prefix + "Pages.ts"), body);
  console.log(`${prefix}: ${files.length} páginas, ${(body.length / 1024).toFixed(0)} KB`);
}
console.log("OK");
