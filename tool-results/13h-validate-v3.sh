#!/usr/bin/env bash
# Task 13-h — validação v3: página do certificado (desktop/mobile/anônimo) + "Ver meu certificado"
cd /home/z/my-project || exit 1
LOG=tool-results/13h-validate-v3.log
: > "$LOG"
exec > >(tee -a "$LOG") 2>&1

CODE=MH-7FA125CD90
COURSE_ID=cmtd0bekx0056nl066xt2olck

echo "=== [1] DEV SERVER ==="
pkill -f "next dev" 2>/dev/null; sleep 1
setsid bun run dev > dev.log 2>&1 < /dev/null & disown
code=000
for i in $(seq 1 120); do
  sleep 1
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/courses 2>/dev/null || true)
  [ "$code" = "200" ] && break
done
echo "SERVER READY http=$code after=${i}s"

echo "=== [2] PAYLOAD DO CERTIFICADO (API) ==="
curl -s "http://localhost:3000/api/certificates/$CODE"; echo

echo "=== [3] RESET BROWSER ==="
pkill -f agent-browser 2>/dev/null; sleep 2
AB="agent-browser"
ABANON="agent-browser --session anon"

echo "=== [4] ANON /?cert=$CODE — desktop 1440x900 (SEM login) ==="
$ABANON set viewport 1440 900
$ABANON open "http://localhost:3000/?cert=$CODE"
$ABANON wait --load networkidle || $ABANON wait 5000
$ABANON wait --text "Ana Souza" --timeout 90000 && echo "OK: anônimo nome" || echo "FAIL: anônimo nome"
$ABANON wait --text "Do Zero a Product Manager" --timeout 10000 && echo "OK: título" || echo "FAIL: título"
$ABANON wait --text "Marina" --timeout 10000 && echo "OK: mentor" || echo "FAIL: mentor"
$ABANON wait --text "Certificado autêntico" --timeout 10000 && echo "OK: verificação" || echo "FAIL: verificação"
$ABANON eval '(() => { const t=document.body.innerText; return JSON.stringify({carga: /de conteúdo/.test(t), linkedin: t.includes("Compartilhar no LinkedIn"), copiar: t.includes("Copiar link"), imprimir: t.includes("Imprimir / PDF"), mentorResp: t.includes("Mentor responsável"), concluidoEm: t.includes("Concluído em")}) })()'
$ABANON get title
$ABANON get url
$ABANON eval '[document.documentElement.scrollWidth, document.documentElement.clientWidth].join("x")'
$ABANON screenshot tool-results/shot-13h-certificate-anon-desktop.png && echo "OK: screenshot anon desktop"

echo "=== [5] MOBILE 390x844 (página do certificado) ==="
$ABANON set viewport 390 844
sleep 1
$ABANON eval '[document.documentElement.scrollWidth, document.documentElement.clientWidth].join("x")'
$ABANON eval '(() => { const art=document.querySelector("article"); if(!art) return "NO_ARTICLE"; const bar=art.previousElementSibling; const btns=bar?Array.from(bar.querySelectorAll("button")):[]; const tops=[...new Set(btns.map(b=>Math.round(b.getBoundingClientRect().top+window.scrollY)))]; return JSON.stringify({btns: btns.length, rows: tops.length}) })()'
$ABANON eval '(() => { const art=document.querySelector("article"); const r=art.getBoundingClientRect(); return JSON.stringify({articleWidth: Math.round(r.width), viewport: window.innerWidth}) })()'
$ABANON screenshot --full tool-results/shot-13h-certificate-mobile.png && echo "OK: screenshot mobile"
echo "--- errors sessão anon ---"
$ABANON errors || true

echo "=== [6] SALA COMO ANA → 'Ver meu certificado' → página pública ==="
$AB set viewport 1440 900
$AB open http://localhost:3000
$AB wait --load networkidle || $AB wait 5000
$AB eval '(() => { const b=[...document.querySelectorAll("button")].find(x => x.offsetParent !== null && x.textContent.trim() === "Entrar"); if(!b) return "NOT_FOUND"; b.click(); return "CLICKED" })()'
$AB wait --text "Bem-vindo de volta" --timeout 30000 && echo "OK: auth" || echo "FAIL: auth"
$AB eval '(() => { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set; const em=document.querySelector("#login-email"); set.call(em,"ana@demo.com"); em.dispatchEvent(new Event("input",{bubbles:true})); const pw=document.querySelector("#login-password"); set.call(pw,"demo123"); pw.dispatchEvent(new Event("input",{bubbles:true})); return "filled" })()'
$AB eval '(() => { const f=[...document.querySelectorAll("form")].find(x => x.querySelector("#login-email")); const b=f && f.querySelector("button[type=submit]"); if(!b) return "NOT_FOUND"; b.click(); return "SUBMITTED" })()'
$AB wait --text "Olá, Ana" --timeout 30000 && echo "OK: login" || echo "FAIL: login"
$AB open "http://localhost:3000/?course=$COURSE_ID"
$AB wait --load networkidle || $AB wait 5000
$AB wait --text "Continuar curso" --timeout 60000 && echo "OK: course" || echo "FAIL: course"
$AB eval '(() => { const b=[...document.querySelectorAll("button[aria-label*=\"sala de aula\"]")].find(x => x.offsetParent !== null); if(!b) return "NOT_FOUND"; b.click(); return "CLICKED" })()'
$AB wait --text "Parabéns! Você concluiu este curso" --timeout 60000 && echo "OK: celebração" || echo "FAIL: celebração"
sleep 1
echo "botões (esperado ver=true, emitir=false):"
$AB eval '(() => { const t=document.body.innerText; return JSON.stringify({emitir: t.includes("Emitir certificado"), ver: t.includes("Ver meu certificado")}) })()'
$AB screenshot tool-results/shot-13h-classroom-ver-certificado.png
$AB eval '(() => { const b=[...document.querySelectorAll("button[aria-label^=\"Ver meu certificado\"]")].find(x => x.offsetParent !== null); if(!b) return "NOT_FOUND"; b.click(); return "CLICKED" })()'
$AB wait --text "Ana Souza" --timeout 60000 && echo "OK: ver certificado → página pública" || echo "FAIL: ver certificado"
$AB get title
echo "--- console principal (erros?) ---"
$AB errors || true

echo "=== [7] DEV.LOG ==="
rg -n "certificates" dev.log | tail -6 || true
rg -in " error| ERROR|uncaught" dev.log | rg -v "prisma:query" | tail -8 || echo "dev.log sem erros aparentes"

echo "=== FIM v3 ==="
