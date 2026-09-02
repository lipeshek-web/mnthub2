// Publica o MentorHub Mobile no Snack — versão SEM ASSETS (data URIs no código).
// ASSET files travam o runtime do Snack em "Loading..." (provado por probes).
// Envia apenas App.js + src/** como CODE, manifest SDK 54 + 12 dependências
// (expo-clipboard = copiar código PIX no checkout).
const fs = require("fs");
const path = require("path");

const root = "/home/z/my-project/mobile-app-snack";
const deps = {
  "@react-navigation/native":      "*",
  "@react-navigation/stack":       "*",
  "react-native-gesture-handler":  "~2.28.0",
  "react-native-safe-area-context":"~5.6.0",
  "react-native-screens":          "~4.16.0",
  "expo-image":                    "~3.0.11",
  "expo-web-browser":              "~15.0.11",
  "expo-secure-store":             "~15.0.8",
  "expo-clipboard":                "~8.0.8",
  "expo-linear-gradient":          "~15.0.8",
  "expo-status-bar":               "~3.0.9",
  "@expo/vector-icons":            "^15.0.3",
};

const code = {};
let totalBytes = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join("/");
    if (entry.isDirectory()) {
      // pula nada além do que não é código-fonte do app
      if (rel === "node_modules" || rel === "dist" || rel === "scripts" || rel === ".tmp") continue;
      walk(full);
      continue;
    }
    if (rel === "package.json" || rel === "index.js" || rel === "babel.config.js" ||
        rel === "app.json" || rel === "README.md" || rel === "bun.lock" ||
        rel.startsWith("assets/") || rel.endsWith(".lock")) continue;
    if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      code[rel] = { type: "CODE", contents: fs.readFileSync(full, "utf-8") };
      totalBytes += Buffer.byteLength(code[rel].contents);
    }
  }
}
walk(root);
const files = Object.keys(code);
console.log(`arquivos CODE: ${files.length}, total ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log("raízes:", [...new Set(files.map(f => f.split("/")[0]))].join(", "));

const payload = {
  manifest: {
    sdkVersion: "54.0.0",
    name: "MentorHub — App do Aluno",
    description: "App do aluno: leitor de PDF nativo (páginas embutidas), livros, cursos com COMPRA no app (PIX/cartão/boleto via Asaas) e mensagens com mentores — API https://mentorhub.space-z.ai. Login demo: ana@demo.com / demo123",
    dependencies: deps,
  },
  code,
  dependencies: Object.fromEntries(Object.entries(deps).map(([k, v]) => [k, { type: "PACKAGE", version: v }])),
  isDraft: false,
};

const res = await fetch("https://exp.host/--/api/v2/snack/save", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const text = await res.text();
console.log("HTTP", res.status);
try {
  const j = JSON.parse(text);
  console.log("id:", j.id);
} catch {
  console.log(text.slice(0, 300));
}
