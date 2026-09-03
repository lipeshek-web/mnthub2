# MentorHub Mobile — Expo Snack + web app

App do aluno do MentorHub, publicado e testado de ponta a ponta. Dois jeitos de abrir:

1. **Expo Snack (link direto):** **https://snack.expo.dev/WQNMgm4hkeKGZGUMX--I5**
   - No preview **Web** (painel direito) ou no celular com o app **Expo Go** escaneando o QR Code ("My Device").
   - Publicado via API oficial (`exp.host/--/api/v2/snack/save`) com código (53 arquivos) + 11 dependências — abrindo o link, já está tudo lá (nada de copiar/colar). SEM expo-clipboard (não resolve no Snack web): copiar PIX usa o clipboard do navegador + código selecionável.
   - **Novidades desta versão:** COMPRA completa dentro do app (PIX com QR + copia-e-cola, cartão e boleto via Asaas — sem sair do app), mensagens com mentores (Perfil → Mensagens e "Mensagem" no perfil do mentor) e curso que abre DIRETO no conteúdo da aula (índice só pelo botão "Conteúdos").
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

- **Login** — campo "Servidor da API" configurável (padrão: produção)
- **Início** — XP, ofensiva, meta semanal, "Continuar estudando", novos livros, recomendados
- **Livros** — biblioteca com busca/filtros e **LEITOR DE PDF NATIVO**: pager página a página (sem WebView e sem browser), zoom por dois toques, modo noturno, barra de progresso arrastável e retomada da leitura. As páginas dos 5 livros do catálogo vêm embutidas no app (abertura instantânea) e também são servidas por `GET /api/v1/library/:id/reader` (URLs absolutas de `/library-pages/<id>/p<N>.png`) — livros novos respondem 404 com mensagem amigável até terem páginas renderizadas
- **Cursos — CONTENT-FIRST:** curso inscrito abre DIRETO na aula atual com o conteúdo em foco (vídeo em destaque com capa + play, texto completo já renderizado, materiais, concluir +XP, anterior/próxima). O índice completo do curso fica atrás do botão **"Índice"** (header ou faixa de progresso) que abre um modal com todas as aulas por tema. Catálogo com preços e **CHECKOUT COMPLETO NO APP** para cursos pagos (PIX com QR Code + copia-e-cola, cartão, boleto, cupom de desconto, polling automático de confirmação — sem sair do app)
- **Mentorias** — buscar mentores, ver horários livres, agendar, **pagar a sessão 1:1 no app** (botão "Pagar agora" nas pendentes), acompanhar e cancelar sessões
- **Mensagens** — caixa de entrada com badge de não lidas na tab bar, conversa 1:1 com bolhas, envio com confirmação de leitura e polling automático; estado vazio amigável (nunca parece erro); abrir conversa pelo perfil do mentor ("Enviar mensagem")
- **À prova de servidor desatualizado** — se o site publicado ainda não tiver as rotas novas, o app avisa com clareza ("publique o site...") em vez de "Conteúdo não encontrado", e `Alert.alert` funciona no preview web (polyfill)
- **Perfil** — dados da conta, notificações (marcar todas como lidas), sair
- **Extras** — busca global, salvos (favoritos locais), tema claro/escuro persistido

## 🗂 Estrutura

```
mobile-app-snack/
├── App.js            # entrada do Snack: gate de sessão + navegação (pager de abas + stack)
├── index.js          # entrada p/ rodar FORA do Snack (expo start/export) — registerRootComponent
├── app.json / babel.config.js / package.json   # harness local (o Snack ignora)
├── scripts/          # embed-pages.js (gera data URIs) + publish-snack.js (publica no Snack)
└── src/
    ├── theme.ts
    ├── lib/          # api.ts (cliente v1), auth.tsx, theme.tsx, tabs.tsx, bookPages.ts, format.ts, hooks
    │   └── bookPagesData/  # páginas PNG dos livros como data URI base64 (gerado; não editar à mão)
    ├── components/   # 20 componentes (PdfReader é o leitor nativo)
    └── screens/      # 11 telas
```

## 🛠 Rodar localmente (fora do Snack)

```bash
cd mobile-app-snack
bun install
bunx expo start          # Expo Go / simulador
bunx expo export --platform web   # gera dist/ (vai para public/app-mobile no publish)
```

## 📦 Dependências (as 11 do painel do Snack — versões exatas do SDK 54)

`@react-navigation/native` * · `@react-navigation/stack` * · `react-native-gesture-handler` ~2.28.0 · `react-native-safe-area-context` ~5.6.0 · `react-native-screens` ~4.16.0 · `expo-image` ~3.0.11 · `expo-web-browser` ~15.0.11 · `expo-secure-store` ~15.0.8 · `expo-linear-gradient` ~15.0.8 · `expo-status-bar` ~3.0.9 · `@expo/vector-icons` ^15.0.3

**Nunca** adicionar: `@react-navigation/native-stack`, `react-native-paper`, `expo-router`, `react-native-pager-view`, `@react-navigation/material-top-tabs`, `react-native-reanimated`, `react-native-pdf` (módulo nativo — não existe no Snack).

## 📦 ZIP (backup)

`https://mentorhub.space-z.ai/mentorhub-mobile-snack-v7.zip` — código com páginas embutidas como data URI (as versões antigas v5/v4/v3 estão obsoletas).

## 🛠 Regenerar páginas / publicar

```bash
# 1. Renderizar páginas novas de um PDF (opcional — só p/ livros novos)
bun scripts/render-pages.js
# 2. Embutir as páginas como data URI em src/lib/bookPagesData/
bun scripts/embed-pages.js
# 3. Publicar no Snack (imprime o link)
bun scripts/publish-snack.js
```
