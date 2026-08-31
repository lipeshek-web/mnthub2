const fs = require("fs");
const path = require("path");
const { createCanvas } = require("@napi-rs/canvas");

const BOOKS = JSON.parse(fs.readFileSync("/home/z/my-project/.tmp-w27/w27books.json", "utf8"));
const KEYS = {
  "cmtfmogml0005ir8yi05xidka": "pomodoro",
  "cmtfmogmj0003ir8yb87kr5ao": "gestao",
  "cmtfmogmg0001ir8y63zf8gw7": "inovacao",
  "cmtd0bemq007anl0685281t80": "dados",
  "cmtd0bemo0076nl069u2qxudx": "arquitetura",
};
const TARGET_W = 1080;
const OUT_DIR = "/home/z/my-project/mobile-app-snack/assets/pages";
fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const standardFonts = path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts");
  const manifest = {};
  let total = 0;
  for (const book of BOOKS) {
    const key = KEYS[book.id];
    const pdfPath = path.join(process.cwd(), "public", book.path);
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: false,
      isEvalSupported: false,
      standardFontDataUrl: standardFonts + path.sep,
    });
    const doc = await loadingTask.promise;
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = TARGET_W / base.width;
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const png = await canvas.encode("png");
      const file = `${key}-p${n}.png`;
      fs.writeFileSync(path.join(OUT_DIR, file), png);
      pages.push({ n, file });
      total++;
    }
    manifest[book.id] = { key, title: book.title, totalPages: doc.numPages, pages };
    console.log(`${key}: ${doc.numPages} páginas (${(fs.statSync(path.join(OUT_DIR, `${key}-p1.png`)).size / 1024).toFixed(0)}KB p1)`);
    await loadingTask.destroy();
  }
  fs.writeFileSync("/tmp/w27manifest.json", JSON.stringify(manifest, null, 1));
  console.log("TOTAL páginas:", total);
}
main().catch((e) => { console.error(e); process.exit(1); });
