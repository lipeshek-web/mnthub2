# MentorHub — App Mobile (Expo)

App mobile do **MentorHub** para **alunos**, feito com **Expo SDK 54 + expo-router + TypeScript**: biblioteca de livros e artigos, cursos com aulas em vídeo/texto/ao vivo, mentorias 1:1 com agendamento, progresso com XP, ofensiva de estudos e notificações — em pt-BR, com tema dark esmeralda.

## Funcionalidades

- **Login** com sessão persistente (token JWT no SecureStore) e logout automático em 401
- **Início**: saudação, XP, ofensiva, meta semanal, "Continuar estudando", próximas mentorias, novos livros e cursos recomendados (pull-to-refresh)
- **Livros**: busca por texto, filtro Todos/Livros/Artigos, PDF aberto no navegador in-app e artigos legíveis no próprio app
- **Cursos**: busca, inscrição (cursos pagos direcionam para o site), progresso por aula, concluir aula com **+XP** e parabéns ao concluir 100%
- **Mentorias**: busca de mentores, perfil com avaliações e redes sociais, agendamento (dia → horário → tema) e cancelamento de sessões
- **Perfil**: avatar/bio, XP, ofensiva, créditos, notificações (marcar todas como lidas) e sair da conta

## Pré-requisitos

- **Node.js 18+** (ou **bun**)
- Conta gratuita no [Expo](https://expo.dev) (para o Expo Go e o EAS Build)
- A **API v1 do MentorHub** rodando e acessível (contrato em `docs/api-v1.md` na raiz do projeto — o servidor Next.js do próprio repositório serve os endpoints `/api/v1/*`)

## Como rodar

```bash
cd mobile-app
npm install        # ou bun install / yarn
cp .env.example .env
```

### 1. Configure a URL da API (`.env`)

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Escolha o valor conforme onde o app vai abrir:

| Onde o app roda              | Valor de `EXPO_PUBLIC_API_URL`                          |
| ---------------------------- | ------------------------------------------------------- |
| Navegador / web (localhost)  | `http://localhost:3000`                                 |
| Emulador Android             | `http://10.0.2.2:3000` (`10.0.2.2` = localhost da máquina) |
| **Celular físico (Expo Go)** | `http://SEU_IP_LOCAL:3000` — ex.: `http://192.168.0.10:3000` |
| Produção                     | URL pública do site — ex.: `https://mentorhub.com.br`   |

> Para descobrir seu IP local: `ipconfig` (Windows) ou `ifconfig` / `ip addr` (macOS/Linux).
> Celular e computador precisam estar na **mesma rede Wi-Fi**. `localhost` no celular físico aponta para o próprio celular — por isso é obrigatório usar o IP da máquina.
> Alternativa para redes restritas: `npx expo start --tunnel`.

### 2. Inicie o app

```bash
npx expo start
```

- **Android**: abra o app **Expo Go** e escaneie o QR Code exibido no terminal.
- **iPhone/iPad**: abra a **câmera do iOS** e aponte para o QR Code (abre no Expo Go).
- **Emulador Android**: pressione `a` no terminal. **Simulador iOS** (macOS): pressione `i`.
- Após alterar o `.env`, reinicie com cache limpo: `npx expo start -c`.

### Contas de demonstração

- **Aluna**: `ana@demo.com` / `demo123`
- Mentor (para o site): `carlos@demo.com` / `demo123`

> O app mobile é voltado a alunos; o fluxo do mentor (publicar cursos/mentorias) fica no site.

## Gerar APK / IPA (EAS Build)

Os binários são gerados pelo **EAS Build** (serviço da Expo) — requer conta Expo; para a App Store é preciso também uma conta **Apple Developer** (US$ 99/ano).

```bash
npm install -g eas-cli     # ou use npx eas-cli
eas login                  # login com a sua conta Expo
npx eas build:configure    # gera o eas.json na primeira vez (aceite o perfil sugerido)
npx eas build --platform android   # AAB para a Play Store
npx eas build --platform ios       # IPA — requer Apple Developer account
```

Dicas:

- Para um **APK instalável diretamente** no Android, adicione um perfil `preview` no `eas.json` com `"buildType": "apk"` e rode `eas build --profile preview --platform android`.
- Lembre de apontar `EXPO_PUBLIC_API_URL` para uma URL **pública** (produção) antes do build — o `.env` é gravado no binário no momento do build.

## Estrutura do projeto

```
mobile-app/
├── app/                      # Rotas (expo-router)
│   ├── _layout.tsx           # Stack raiz + AuthProvider (gate de sessão + splash)
│   ├── index.tsx             # Redireciona para (tabs) ou login
│   ├── login.tsx             # Login (alunos)
│   ├── (tabs)/               # Abas: _layout, index (Início), livros, cursos, mentorias, perfil
│   ├── livro/[id].tsx        # Detalhe de livro/artigo (PDF ou artigo)
│   ├── curso/[id].tsx        # Detalhe do curso (progresso, aulas, inscrição)
│   └── mentor/[id].tsx       # Detalhe do mentor + agendamento
├── src/
│   ├── lib/
│   │   ├── api.ts            # Cliente dos 17 endpoints (JWT, ApiError, tipos)
│   │   ├── auth.tsx          # AuthProvider (sessão, login, logout, 401 → logout)
│   │   ├── format.ts         # Formatação pt-BR (BRL, datas naive, chips de dias)
│   │   └── usePagedList.ts   # Hook de lista paginada (refresh + infinite scroll)
│   ├── components/           # Avatar, BookCard, CourseCard, MentorCard, StatusPill, etc.
│   └── theme.ts              # Paleta dark (stone) + esmeralda
├── app.json                  # Config Expo (bundle com.mentorhub.mobile)
├── .env.example              # EXPO_PUBLIC_API_URL
└── package.json
```

## Solução de problemas

- **"Não foi possível conectar ao servidor"**: confira `EXPO_PUBLIC_API_URL`, se a API está rodando e acessível a partir do dispositivo (IP da rede, mesma Wi-Fi), e reinicie com `npx expo start -c`.
- **Sessão expirando**: o token vale 30 dias; qualquer 401 desloga automaticamente e volta ao login.
- **Curso pago no app**: a compra é feita pelo site — o app abre o navegador no botão "Abrir site para comprar".
