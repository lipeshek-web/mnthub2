# MentorHub Mobile — edição Expo Snack + web app

Versão do app de alunos adaptada para rodar em dois formatos:

1. **[Expo Snack](https://snack.expo.dev)** — abre pelo link publicado (ou montando o projeto à mão), sem instalar nada no computador.
2. **Web app estático** — exportado com `expo export --platform web` e servido junto do site em **`/app-mobile/index.html`** (mesma API, mesmo visual, abre no navegador do celular ou PC).

Mesmo visual, mesmas telas e mesma API (`/api/v1` com JWT Bearer). Como o Snack não tem `.env`, a URL do servidor já vem configurada no código (`https://mentorhub.space-z.ai`) e pode ser trocada no campo “Servidor da API” do login.

> **Estrutura:** React Navigation com stack JS (`@react-navigation/stack`); **4 abas** (Início · Livros · Cursos · Mentorias) em um pager horizontal próprio com tab bar custom — o **Perfil NÃO é aba**: abre pelo ícone da conta no header da Home, como tela do stack. O leitor de PDF é **nativo**: as páginas dos livros vêm pré-renderizadas em `assets/pages/` (abertura instantânea, sem WebView e sem render no servidor), com zoom por dois toques, modo noturno, barra de progresso e retomada da leitura.

## 🚀 Como colocar no Snack (1 minuto)

**Opção A — ZIP pronto:** baixe **`https://mentorhub.space-z.ai/mentorhub-mobile-snack-v2.zip`** (contém código + as páginas dos livros em `assets/pages/`), extraia e arraste `App.js` + pasta `src` para o editor do Snack — **apagando antes** o `App.js` e a `src/` antigos.

**Opção A2 — só o App.js (mais rápido):** se a sua `src/` já está no Snack, basta trocar o `App.js`: abra **`https://mentorhub.space-z.ai/snack-App-js.txt`**, copie tudo (Ctrl+A → Ctrl+C) e cole por cima de todo o conteúdo do `App.js` no editor do Snack.

**Opção B — copiar e colar:**

1. Abra **https://snack.expo.dev** → escolha o SDK **54** (menu suspenso no topo; se não aparecer, use o 53 — o código é compatível).
2. Copie os arquivos desta pasta para o editor do Snack, mantendo a mesma estrutura (`App.js` na raiz, pastas `src/…`) — ele substitui o `App.js` de exemplo:
   - No painel esquerdo, use o **＋ (New File)** para criar cada arquivo e cole o conteúdo (ou arraste a pasta inteira se estiver no seu computador — o Snack aceita drag & drop).
3. Adicione as dependências (painel direito → **Dependencies** / ícone de +) — são **11**:
   - `@react-navigation/native`
   - `@react-navigation/stack` ⚠️ (o `native-stack` **não resolve no Snack** — usar o stack JS)
   - `react-native-gesture-handler`
   - `react-native-safe-area-context`
   - `react-native-screens`
   - `expo-image` (usado nas capas, avatares e nas PÁGINAS do leitor de PDF)
   - `expo-web-browser` ⚠️ (fallback "abrir original" do leitor de PDF)
   - `expo-secure-store`
   - `expo-status-bar`
   - `@expo/vector-icons`
   - `expo-linear-gradient` (usado no card "Continuar estudando", capas e no hero do login)
   - (o `react-native-webview` **não é mais usado** — o leitor de PDF agora é NATIVO: o servidor rasteriza as páginas e o app as exibe; pode removê-lo do painel)
   - (o `@react-navigation/bottom-tabs` também **não é mais importado** — pode remover)
   - (não precisa de `@react-native-masked-view/masked-view` — a stack v7 nem usa; **nunca** adicione `@react-navigation/native-stack`, `react-native-paper`, `expo-router`, `react-native-pager-view`, `@react-navigation/material-top-tabs` nem `react-native-reanimated`)
   - > Dica: mesmo pacotes que "já vêm no Expo" (status-bar, vector-icons, screens) devem estar listados aqui — o Snack só resolve módulos que estão no painel; se faltar um, o primeiro load mostra `Unable to resolve module '…'` e ele se auto-adiciona ao reabrir.
4. Teste no navegador (preview à direita) ou no celular: instale o app **Expo Go** (Android/iPhone) e escaneie o QR Code.

### Dependências que o Snack já embute de verdade (não precisa adicionar)

`expo`, `react`, `react-native` — só essas três. As demais que o código importa devem estar no painel (lista acima).

> Se algo falhar com `Unable to resolve module 'module://…'`, é dependência que faltou no painel — confira a lista acima (o `@react-navigation/native-stack` em especial NÃO existe no runtime do Snack; o projeto usa o `@react-navigation/stack`).

## 🩺 Se o erro `@react-navigation/native-stack` continuar aparecendo

Isso significa que **o Snack ainda está rodando o `App.js` antigo** (o que importava native-stack). O código novo não tem esse import. Checklist:

1. Abra o `App.js` no editor do Snack: a linha ~27 tem que ser `import { createStackNavigator } from "@react-navigation/stack";`. Se estiver `createNativeStackNavigator` / `native-stack`, é código velho — cole o conteúdo de **`https://mentorhub.space-z.ai/snack-App-js.txt`** por cima.
2. No painel **Dependencies**, remova `@react-navigation/native-stack` e `react-native-paper` (se estiverem lá) e confirme que **`expo-web-browser`** está na lista — é a dependência que mais costuma faltar — junto de `@react-navigation/stack` e `react-native-gesture-handler`.
3. Salve e recarregue o preview (⟳ / Ctrl+R). Se o erro persistir, recarregue a página do Snack por completo.

## 🔗 Servidor MentorHub (já configurado)

O app já aponta para a produção: **`https://mentorhub.space-z.ai`** (constante `DEFAULT_SERVER_URL` em `src/lib/api.ts` — testada: login e catálogo respondem). O celular do aluno não alcança `localhost`, então mantenha a produção ou:

- **No app**: preencha o campo **“Servidor da API”** na tela de login (fica salvo no aparelho via SecureStore) — útil para testar local/tunnel.
- **No código**: edite a constante `DEFAULT_SERVER_URL`.

> Detalhe: no Snack **web** o SecureStore funciona via localStorage; no **Expo Go** é criptografado no aparelho. Nos dois casos funciona.

## 🔑 Login

O app é **só para alunos** (a API v1 exige JWT via `/api/v1/auth/login`):

| E-mail | Senha | Observação |
| --- | --- | --- |
| `ana@demo.com` | `demo123` | aluna demo |
| `marina@demo.com` | `demo123` | aluna/mentora |
| Contas com **2FA ativo** | — | não entram no app v1 (usar o site) |

## 📱 O que dá pra fazer no app

- **Início** — XP, ofensiva (streak), meta semanal, “Continuar estudando”, próximas mentorias, novos livros e recomendados
- **Livros** — biblioteca com busca/filtros; livros abrem o PDF no navegador in-app; artigos são lidos na própria tela
- **Cursos** — catálogo, inscrição em cursos gratuitos (pagos → 402, abre o site), progresso, concluir aula com +XP
- **Mentorias** — buscar mentores, ver horários livres (janelas de 30/60 min), agendar, acompanhar e cancelar sessões
- **Perfil** — dados da conta, notificações (“marcar todas como lidas”), sair

## 🗂 Estrutura

```
mobile-app-snack/
├── App.js                   # entrada única: gate de sessão + navegação (tabs + stack)
├── README.md
└── src/
    ├── theme.ts             # identidade visual (dark stone + esmeralda)
    ├── lib/
    │   ├── api.ts           # cliente da API v1 (JWT, servidor configurável)
    │   ├── auth.tsx         # AuthProvider (sessão global, logout em 401)
    │   ├── format.ts        # formatação (preço, datas, XP…)
    │   └── usePagedList.ts  # hook de listas paginadas
    ├── components/          # 19 componentes (cards, chips, avatar…)
    └── screens/
        ├── LoginScreen.tsx      # login + campo "Servidor da API"
        ├── HomeScreen.tsx       # aba Início (dashboard)
        ├── LivrosScreen.tsx     # aba Livros
        ├── CursosScreen.tsx     # aba Cursos
        ├── MentoriasScreen.tsx  # aba Mentorias (mentores + minhas sessões)
        ├── PerfilScreen.tsx     # aba Perfil
        ├── LivroScreen.tsx      # detalhe livro/artigo (params: { id })
        ├── CursoScreen.tsx      # detalhe curso + aulas (params: { id })
        └── MentorScreen.tsx     # perfil + agendamento (params: { id })
```

## ⏭️ Indo além do Snack

Snack é ótimo para **testar e demonstrar**. Para publicar de verdade:

1. Use a versão completa em `mobile-app/` (expo-router, `.env` com `EXPO_PUBLIC_API_URL`, TypeScript estrito).
2. `npm install && npx expo start` → testa no Expo Go.
3. `npx eas build -p android --profile preview` → APK para Android.
4. `npx eas build -p ios` → IPA (requer conta Apple Developer).
