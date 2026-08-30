#!/usr/bin/env bash
# Task 13-h — validação E2E v2 (daemo limpo + login robusto)
cd /home/z/my-project || exit 1
LOG=tool-results/13h-validate-v2.log
: > "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "=== [1] DEV SERVER ==="
pkill -f "next dev" 2>/dev/null; sleep 1
setsid bun run dev > dev.log 2>&1 < /dev/null & disown
code=000
for i in $(seq 1 90); do
  sleep 1
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/courses 2>/dev/null || true)
  [ "$code" = "200" ] && break
done
echo "SERVER READY http=$code after=${i}s"

echo "=== [2] ESTADO DA ANA (já preparado; conferir) ==="
curl -s "http://localhost:3000/api/courses/cmtd0bekx0056nl066xt2olck?userId=cmtd0behr0000nl06u0mw0f96" \
  | bun -e "const d=await new Response(Bun.stdin.stream()).json(); console.log('progresso:', (d.enrollment?.completedLessonIds??[]).length + '/' + d.lessons.length, '| certCode:', d.certificateCode)"
COURSE_ID=cmtd0bekx0056nl066xt2olck

echo "=== [3] RESET DO BROWSER ==="
pkill -f agent-browser 2>/dev/null; sleep 2
AB="agent-browser"
ABANON="agent-browser --session anon"

echo "=== [4] LOGIN ANA (UI) — desktop 1440x900 ==="
$AB set viewport 1440 900
$AB open http://localhost:3000
$AB wait --load networkidle || $AB wait 3000
$AB eval '(() => { const b=[...document.querySelectorAll("button")].find(x => x.offsetParent !== null && x.textContent.trim() === "Entrar"); if(!b) return "NOT_FOUND"; b.click(); return "CLICKED" })()'
$AB wait --text "Bem-vindo de volta" --timeout 20000 && echo "OK: auth page" || echo "FAIL: auth page"
$AB eval '(() => { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set; const em=document.querySelector("#login-email"); set.call(em,"ana@demo.com"); em.dispatchEvent(new Event("input",{bubbles:true})); const pw=document.querySelector("#login-password"); set.call(pw,"demo123"); pw.dispatchEvent(new Event("input",{bubbles:true})); return "filled:" + em.value })()'
$AB eval '(() => { const f=[...document.querySelectorAll("form")].find(x => x.querySelector("#login-email")); const b=f && f.querySelector("button[type=submit]"); if(!b) return "NOT_FOUND"; b.click(); return "SUBMITTED" })()'
$AB wait --text "Olá, Ana" --timeout 20000 && echo "OK: login home" || echo "FAIL: login"

echo "=== [5] ABRIR CURSO + SALA (celebração + botão Emitir) ==="
$AB open "http://localhost:3000/?course=$COURSE_ID"
$AB wait --load networkidle || $AB wait 3000
$AB wait --text "Continuar curso" --timeout 30000 && echo "OK: course page" || echo "FAIL: course page"
$AB eval '(() => { const b=[...document.querySelectorAll("button[aria-label*=\"sala de aula\"]")].find(x => x.offsetParent !== null); if(!b) return "NOT_FOUND"; b.click(); return "CLICKED" })()'
$AB wait --text "Parabéns! Você concluiu este curso" --timeout 30000 && echo "OK: celebração" || echo "FAIL: celebração"
sleep 1
echo "estado dos botões:"
$AB eval '(() => { const t=document.body.innerText; return JSON.stringify({emitir: t.includes("Emitir certificado"), ver: t.includes("Ver meu certificado")}) })()'
$AB screenshot tool-results/shot-13h-classroom-celebration.png && echo "OK: screenshot celebração"

echo "=== [6] EMITIR CERTIFICADO (fluxo novo) ==="
$AB eval '(() => { const b=[...document.querySelectorAll("button[aria-label^=\"Emitir certificado\"]")].find(x => x.offsetParent !== null); if(!b) return "NOT_FOUND"; b.click(); return "CLICKED" })()'
$AB wait --text "Certificado emitido!" --timeout 20000 && echo "OK: toast emitido" || echo "FAIL: toast"
$AB wait --text "Ana Souza" --timeout 20000 && echo "OK: página do certificado (nome)" || echo "FAIL: nome"
$AB wait --text "Do Zero a Product Manager" --timeout 10000 && echo "OK: título do curso" || echo "FAIL: título"
$AB wait --text "Marina" --timeout 10000 && echo "OK: mentor Marina" || echo "FAIL: mentor"
$AB wait --text "Certificado autêntico" --timeout 10000 && echo "OK: bloco de verificação" || echo "FAIL: verificação"

echo "=== [7] DADOS DA PÁGINA DO CERTIFICADO (desktop) ==="
sleep 1
OUT=$($AB eval '(document.body.innerText.match(/MH-[A-F0-9]{6,14}/)||["NOCODE"])[0]')
CODE=$(echo "$OUT" | rg -o 'MH-[A-F0-9]{6,14}' | head -1)
echo "CERT_CODE=$CODE"
$AB eval '(() => { const t=document.body.innerText; return JSON.stringify({carga: /de conteúdo/.test(t), linkedin: t.includes("Compartilhar no LinkedIn"), copiar: t.includes("Copiar link"), imprimir: t.includes("Imprimir / PDF"), mentorResp: t.includes("Mentor responsável"), autentico: t.includes("Certificado autêntico")}) })()'
$AB eval '[document.documentElement.scrollWidth, document.documentElement.clientWidth].join("x")'
$AB screenshot tool-results/shot-13h-certificate-desktop.png && echo "OK: screenshot certificado desktop"
$AB get title
if [ -n "$CODE" ]; then
  echo "--- GET /api/certificates/$CODE via curl ---"
  curl -s "http://localhost:3000/api/certificates/$CODE" | head -c 400; echo
fi

echo "=== [8] VOLTAR À SALA → 'Ver meu certificado' ==="
$AB open "http://localhost:3000/?course=$COURSE_ID"
$AB wait --load networkidle || $AB wait 3000
$AB wait --text "Continuar curso" --timeout 30000
$AB eval '(() => { const b=[...document.querySelectorAll("button[aria-label*=\"sala de aula\"]")].find(x => x.offsetParent !== null); if(!b) return "NOT_FOUND"; b.click(); return "CLICKED" })()'
$AB wait --text "Parabéns! Você concluiu este curso" --timeout 30000 && echo "OK: celebração de novo" || echo "FAIL: celebração 2"
sleep 1
echo "estado dos botões (esperado: ver=true, emitir=false):"
$AB eval '(() => { const t=document.body.innerText; return JSON.stringify({emitir: t.includes("Emitir certificado"), ver: t.includes("Ver meu certificado")}) })()'
$AB screenshot tool-results/shot-13h-classroom-ver-certificado.png
$AB eval '(() => { const b=[...document.querySelectorAll("button[aria-label^=\"Ver meu certificado\"]")].find(x => x.offsetParent !== null); if(!b) return "NOT_FOUND"; b.click(); return "CLICKED" })()'
$AB wait --text "Ana Souza" --timeout 20000 && echo "OK: ver certificado → página pública" || echo "FAIL: ver certificado"

echo "=== [9] ANONYMOUS /?cert=CODE (sessão isolada, sem login) ==="
if [ -n "$CODE" ]; then
  $ABANON set viewport 1440 900
  $ABANON open "http://localhost:3000/?cert=$CODE"
  $ABANON wait --load networkidle || $ABANON wait 3000
  $ABANON wait --text "Ana Souza" --timeout 30000 && echo "OK: cert anônimo (nome)" || echo "FAIL: anônimo nome"
  $ABANON wait --text "Certificado autêntico" --timeout 10000 && echo "OK: cert anônimo (verificação)" || echo "FAIL: anônimo verificação"
  $ABANON get title
  $ABANON get url
  $ABANON eval '[document.documentElement.scrollWidth, document.documentElement.clientWidth].join("x")'
  $ABANON screenshot tool-results/shot-13h-certificate-anon-desktop.png

  echo "=== [10] MOBILE 390x844 (página do certificado) ==="
  $ABANON set viewport 390 844
  sleep 1
  $ABANON eval '[document.documentElement.scrollWidth, document.documentElement.clientWidth].join("x")'
  $ABANON eval '(() => { const art=document.querySelector("article"); if(!art) return "NO_ARTICLE"; const bar=art.previousElementSibling; const btns=bar?Array.from(bar.querySelectorAll("button")):[]; const tops=[...new Set(btns.map(b=>Math.round(b.getBoundingClientRect().top+window.scrollY)))]; return JSON.stringify({btns: btns.length, rows: tops.length}) })()'
  $ABANON screenshot --full tool-results/shot-13h-certificate-mobile.png && echo "OK: screenshot mobile"
  echo "--- errors sessão anon ---"
  $ABANON errors || true
else
  echo "FAIL: sem CODE para teste anônimo"
fi

echo "=== [11] CONSOLE/ERROS sessão principal ==="
$AB errors || true
echo "--- console (últimas 25) ---"
$AB console | tail -25 || true

echo "=== [12] DEV.LOG — certificados/erros ==="
rg -n "certificates" dev.log | tail -6 || true
rg -in " error| ERROR" dev.log | rg -v "prisma:query|X-Nextjs" | tail -6 || echo "dev.log sem erros aparentes"

echo "=== FIM v2 ==="
