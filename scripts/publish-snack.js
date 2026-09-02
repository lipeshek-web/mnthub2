/* eslint-disable @typescript-eslint/no-require-imports -- script Node puro (fora do bundle Next) */
/**
 * Publica o app MentorHub no Expo Snack (https://snack.expo.dev).
 *
 * Lição crítica do W-42: NUNCA enviar arquivos ASSET no snack salvo — a
 * presença de assets trava o runtime em "Loading..." eterno (sem erro, sem
 * log). As páginas dos livros já vão como CÓDIGO (data URI) geradas por
 * scripts/embed-pages.js — este script envia SOMENTE arquivos CODE.
 *
 * Uso:  bun run scripts/publish-snack.js
 * Saída: https://snack.expo.dev/<id> (link pronto p/ abrir e testar)
 */
const fs = require("fs");
const path = require("path");

const ROOT = "/home/z/my-project/mobile-app-snack";

/* Dependências do snack — mesmas versões do harness (SDK 54) */
const DEPS = [
  { name: "@expo/vector-icons", version: "^15.0.3" },
  { name: "@react-navigation/native", version: "^7.3.18" },
  { name: "@react-navigation/stack", version: "^7.10.24" },
  { name: "expo-clipboard", version: "~8.0.8" },
  { name: "expo-image", version: "~3.0.11" },
  { name: "expo-linear-gradient", version: "~15.0.8" },
  { name: "expo-secure-store", version: "~15.0.8" },
  { name: "expo-status-bar", version: "~3.0.9" },
  { name: "expo-web-browser", version: "~15.0.11" },
  { name: "react-native-gesture-handler", version: "~2.28.0" },
  { name: "react-native-safe-area-context", version: "~5.6.0" },
  { name: "react-native-screens", version: "~4.16.0" },
];

const SKIP = new Set([
  "package.json",
  "index.js",
  "babel.config.js",
  "app.json",
  "bun.lock",
  "bun.lockb",
  "tsconfig.json",
]);

/** Coleta arquivos CODE: App.js + src/** (ts/tsx/js), pulando harness/assets. */
function collectFiles(dir, base = "", out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === "assets" || entry.name === "scripts") {
      continue;
    }
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(abs, rel, out);
      continue;
    }
    if (SKIP.has(entry.name)) continue;
    if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) continue; // só código
    out.push({ rel, abs });
  }
  return out;
}

async function main() {
  const files = collectFiles(ROOT);
  const code = {};
  let total = 0;
  for (const f of files) {
    const contents = fs.readFileSync(f.abs, "utf8");
    total += Buffer.byteLength(contents);
    code[f.rel] = { type: "CODE", contents };
  }
  console.log(`arquivos CODE: ${files.length} (${(total / 1024 / 1024).toFixed(2)} MB)`);

  const manifest = {
    name: "MentorHub",
    slug: "mentorhub-mobile-snack",
    sdkVersion: "54.0.0",
    version: "1.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    description:
      "App do aluno MentorHub: cursos, biblioteca com leitor de PDF nativo, mentorias 1:1, checkout completo (PIX/cartão/boleto) e mensagens diretas.",
    primaryColor: "#0c0a09",
    platforms: ["ios", "android", "web"],
    dependencies: Object.fromEntries(DEPS.map((d) => [d.name, d.version])),
  };

  const res = await fetch("https://exp.host/--/api/v2/snack/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      manifest,
      code,
      // A API de save pede as dependências também no topo do payload
      dependencies: Object.fromEntries(DEPS.map((d) => [d.name, { version: d.version }])),
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("resposta não-JSON do exp.host:", text.slice(0, 500));
    process.exit(1);
  }
  if (!res.ok || (data.errors && data.errors.length > 0) || !data.id) {
    console.error("falha ao salvar o snack:", res.status, JSON.stringify(data).slice(0, 800));
    process.exit(1);
  }
  console.log("SNACK PUBLICADO:", `https://snack.expo.dev/${data.id}`);
  console.log("id:", data.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
