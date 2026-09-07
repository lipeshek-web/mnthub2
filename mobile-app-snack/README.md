# Órbita — App do Aluno (Expo Snack + web app)

App do aluno da **Órbita** ("Seu universo de aprendizado" — antes MentorHub), publicado e testado de ponta a ponta. Dois jeitos de abrir:

1. **Expo Snack (link direto):** **https://snack.expo.dev/6OATQfZcOmw7oKxGN0Nuf**
   - No preview **Web** (painel direito) ou no celular com o app **Expo Go** escaneando o QR Code ("My Device").
   - Publicado via API oficial (`exp.host/--/api/v2/snack/save`) com código (59 arquivos) + 12 dependências — abrindo o link, já está tudo lá (nada de copiar/colar). SEM expo-clipboard (não resolve no Snack web): copiar PIX usa o clipboard do navegador + código selecionável.
   - ⚠️ **NÃO republique pelo painel de dependências do editor**: uma republicação por cima já salvou o snack SEM o `react-native-webview` e o app inteiro morria com "Unable to resolve module 'module://react-native-webview.js'". A `SalaScreen` é resiliente (require tardio + fallback "Abrir sala no navegador"), mas o correto é publicar pelo script (`bun mobile-app-snack/scripts/publish-snack.js`) com as 12 dependências.
   - **Novidades desta versão (REBRAND ÓRBITA v2.0):** plataforma renomeada MentorHub → **Órbita** com identidade AZUL (blue-600 claro / azul-noite escuro, neutros slate — mesma família do site), **novo ícone** (planeta com anel orbital em degradê azul), **navegação minimalista nativa**: 4 abas apenas (Início · Explorar · Mensagens · Perfil) com **tab bar nativa estilo iOS** no rodapé (nada de dock flutuante), e a aba nova **EXPLORAR** com segmented control iOS reunindo **Cursos · Livros · Mentorias** em um só lugar (3 abas antigas viraram segmentos). Perfil agora é aba, com listas agrupadas iOS (Aprendizado/Preferências/Conta), login minimalista com a marca desenhada em Views e telas recalibradas no visual Apple. Mantém TUDO do funcional: leitor de PDF nativo, checkout no app, mensagens, eventos multi-participante, gamificação (missões + ranking) e sala ao vivo.
2. **Web app no site:** **https://mentorhub.space-z.ai/app-mobile/** — o mesmo código exportado (`expo export --platform web`) e servido junto do site (atualizado a cada publish).

Mesma API (`/api/v1`, JWT Bearer 30 dias), mesmo visual, mesmos dados do Turso em produção.

> ⚠️ **Lição crítica (2026-09-02):** projetos salvos no Snack contendo arquivos do tipo **ASSET** deixam o preview Web eternamente em "Loading..." (provado por probes A/B: snack idêntico com assets trava; sem assets roda). Por isso as páginas dos livros são embutidas como **data URI base64 dentro do código** (`src/lib/bookPagesData/`) e o publish (`scripts/publish-snack.js`) envia SOMENTE arquivos CODE. O manifest do runtime via EAS Update também pode responder 429 (cota da conta anônima), mas isso NÃO impede o preview web de rodar.

> ⚠️ **Importante:** compra e mensagens usam rotas `/api/v1` novas (checkout, cupons,
pagamentos, mensagens) — **publique o site na plataforma** para que o app (que fala
com a produção) as tenha. Enquanto o site estiver desatualizado, o app continua
navegando e aprendendo normalmente, e compra/mensagens mostram um aviso claro
("publique o site...") em vez de erro.

## 🔑 Login

| E-mail | Senha | Observação |
| --- | --- | --- |
| `ana@demo.com` | `demo123` | aluna demo |
| `marina@demo.com` | `demo123` | aluna/mentora |
| Contas com **2FA ativo** | — | não entram no app v1 (usar o site) |

## 📱 O que tem no app (tudo verificado em E2E com browser real)

- **Navegação Órbita** — 4 abas (Início · Explorar · Mensagens · Perfil) em pager horizontal + **tab bar nativa iOS** (barra sólida, hairline, ícone + rótulo, badge de mensagens); tema claro/escuro persistido abrindo no CLARO
- **Login** — minimalista estilo Apple: marca Órbita desenhada com Views (planeta + anel), wordmark + tagline, UM card com e-mail/senha e botão azul (sessão salva no aparelho; sem seletor de servidor, sem atalho demo)
- **Início** — "Olá, {nome}" + data, header com busca global e notificações; seções: **Continue estudando** (progresso), chips rápidos, **Ao vivo & eventos** (AO VIVO azul), mentores, **Novidades da biblioteca**, **Missões de hoje** (coleta de XP) e **Em alta agora**
- **Explorar (nova)** — segmented control iOS (trilha cinza + polegar branco) com **Cursos · Livros · Mentorias**: catálogo em grade com busca/chips/paginação, biblioteca-estante com leitor de PDF NATIVO (pager página a página, zoom, modo noturno, retomada) e mentorias com busca de mentores + **Minhas sessões** (pagar/cancelar/entrar na sala)
- **Cursos — CONTENT-FIRST:** curso inscrito abre DIRETO na aula atual (vídeo/texto/materiais/concluir +XP); índice completo atrás do botão "Índice"; **CHECKOUT COMPLETO NO APP** (PIX com QR Code + copia-e-cola, cartão, boleto, cupom, polling de confirmação)
- **Mentorias** — agendar pelo perfil do mentor (horários livres), pagar no app, entrar na sala
- **REUNIÃO AO VIVO DENTRO DO APP (Órbita Live)** — sala 1:1 por WebRTC em WebView (`/live.html`, token HMAC) e **eventos multi-participante** (`/room.html`, malha) — presença, timer, controles e reconexão
- **Mensagens** — caixa de entrada com badge na tab bar, conversa 1:1 com leitura e polling
- **Perfil (aba)** — card de conta (avatar/nome/XP/ofensiva), listas agrupadas iOS: Aprendizado (Salvos, Ranking da semana), Preferências (Tema Claro|Escuro), Mais (Notificações, Mensagens, Sair)
- **À prova de servidor desatualizado** — avisos claros em vez de erro; `Alert.alert` funciona no preview web (polyfill)

## 🗂 Estrutura

```
mobile-app-snack/
├── App.js            # entrada do Snack: gate de sessão + navegação (4 abas + tab bar nativa + stack)
├── index.js          # entrada p/ rodar FORA do Snack (expo start/export) — registerRootComponent
├── app.json          # nome Órbita + ícone/splash (assets/ — o Snack ignora, só export local usa)
├── assets/           # icon.png (1024) · adaptive-icon · favicon · icon-192 (marca azul)
├── scripts/          # embed-pages.js (gera data URIs) + publish-snack.js (publica no Snack)
└── src/
    ├── theme.ts      # paletas ÓRBITA (azul light/dark) + singleton mutável
    ├── lib/          # api.ts (cliente v1), auth.tsx, theme.tsx, tabs.tsx (4 abas + segmentos), bookPages.ts, format.ts, hooks
    │   └── bookPagesData/  # páginas PNG dos livros como data URI base64 (gerado; não editar à mão)
    ├── components/   # 20 componentes (PdfReader é o leitor nativo)
    └── screens/      # telas — Cursos/Livros/Mentorias são SEGMENTOS da ExplorarScreen
```

## 🛠 Rodar localmente (fora do Snack)

```bash
cd mobile-app-snack
bun install
bunx expo start          # Expo Go / simulador
bunx expo export --platform web   # gera dist/ (vai para public/app-mobile no publish)
```

## 📦 Dependências (as 12 do painel do Snack — versões exatas do SDK 54)

`@react-navigation/native` * · `@react-navigation/stack` * · `react-native-gesture-handler` ~2.28.0 · `react-native-safe-area-context` ~5.6.0 · `react-native-screens` ~4.16.0 · `react-native-webview` 13.15.0 · `expo-image` ~3.0.11 · `expo-web-browser` ~15.0.11 · `expo-secure-store` ~15.0.8 · `expo-linear-gradient` ~15.0.8 · `expo-status-bar` ~3.0.9 · `@expo/vector-icons` ^15.0.3

**Nunca** adicionar: `@react-navigation/native-stack`, `react-native-paper`, `expo-router`, `react-native-pager-view`, `@react-navigation/material-top-tabs`, `react-native-reanimated`, `react-native-pdf` (módulo nativo — não existe no Snack).

## 📦 ZIP (backup)

`https://mentorhub.space-z.ai/orbita-mobile-snack-v16.zip` — código com páginas embutidas como data URI (as versões antigas v15/v14 estão obsoletas).

> 🎥 **Sala de reunião (infra do lado do servidor):** a página `public/live.html` (estática, servida pelo site) + `public/vendor/socket.io.min.js` + rotas `GET /api/bookings/[id]/meeting-token` (web) e `GET /api/v1/bookings/[id]/meeting-token` (app) + mini-serviço `mini-services/meeting-service` (:3004, sinalização 1:1 + malha multi-participante). **Publique o site na plataforma** para a sala no app funcionar contra a produção.

## 🛠 Regenerar páginas / publicar

```bash
# 1. Renderizar páginas novas de um PDF (opcional — só p/ livros novos)
bun scripts/render-pages.js
# 2. Embutir as páginas como data URI em src/lib/bookPagesData/
bun scripts/embed-pages.js
# 3. Publicar no Snack (imprime o link)
bun scripts/publish-snack.js
```
