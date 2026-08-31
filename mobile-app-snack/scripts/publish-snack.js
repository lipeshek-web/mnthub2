const fs = require("fs");
const path = require("path");

const root = "/home/z/my-project/mobile-app-snack";
const code = {};
let assetCount = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join("/");
    if (entry.isDirectory()) { walk(full); continue; }
    if (/\.(js|jsx|ts|tsx|md)$/.test(entry.name)) {
      code[rel] = { type: "CODE", contents: fs.readFileSync(full, "utf-8") };
    } else if (/\.(png|jpg|jpeg|webp|gif)$/.test(entry.name)) {
      code[rel] = { type: "ASSET", contents: fs.readFileSync(full).toString("base64") };
      assetCount++;
    }
  }
}
walk(root);
console.log("arquivos de código:", Object.keys(code).length - assetCount, "| assets:", assetCount);

const deps = {
  "@react-navigation/native":      "*",
  "@react-navigation/stack":       "*",
  "react-native-gesture-handler":  "~2.28.0",
  "react-native-safe-area-context":"~5.6.0",
  "react-native-screens":          "~4.16.0",
  "expo-image":                    "~3.0.11",
  "expo-web-browser":              "~15.0.11",
  "expo-secure-store":             "~15.0.8",
  "expo-linear-gradient":          "~15.0.8",
  "expo-status-bar":               "~3.0.9",
  "@expo/vector-icons":            "^15.0.3",
};

const payload = {
  manifest: {
    sdkVersion: "54.0.0",
    name: "MentorHub Mobile",
    description: "App do aluno — leitor de PDF nativo instantaneo, busca global, salvos, cursos e mentorias (API https://mentorhub.space-z.ai). Login: ana@demo.com / demo123",
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
try { console.log(JSON.stringify(JSON.parse(text), null, 1).slice(0, 400)); }
catch { console.log(text.slice(0, 400)); }
