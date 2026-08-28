# Worklog — MentorHub (Plataforma Completa de Mentorias)

Projeto: marketplace de mentorias com perfis de mentores, mural de conteúdos, agendamento, avaliações e reuniões (Jitsi Meet) dentro da plataforma.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Prisma/SQLite + Zustand + sonner.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Schema Prisma + push

Work Log:
- Definido `prisma/schema.prisma`: User, MentorProfile, Availability, ContentPost, Booking, Review
- Relações: Booking.mentor -> MentorProfile ("MentorBookings"), Booking.mentee -> User ("MenteeBookings"), Review 1:1 Booking
- `startsAt` armazenado como String naive "YYYY-MM-DDTHH:mm" (sem problemas de timezone)
- `bun run db:push` executado com sucesso

Stage Summary:
- Banco criado em db/custom.db conforme schema acima.

---
Task ID: 2
Agent: main (Z.ai Code)
Task: Seed de dados

Work Log:
- `prisma/seed.ts` executado (`bun prisma/seed.ts`)
- 13 usuários; 7 mentores publicados (Carlos/Tecnologia, Marina/PM, Rafael/Growth, Beatriz/UX, David/Finanças, Sofia/Inglês, Ana/Design)
- 16 conteúdos no mural, disponibilidades semanais, 11 agendamentos (PENDING/CONFIRMED/COMPLETED), 6 reviews

Stage Summary:
- Usuário demo principal: Ana Souza (ana@demo.com) — é mentora E mentoria (tem sessões dos dois lados).

---
Task ID: 3
Agent: main (Z.ai Code)
Task: Libs compartilhadas (CONTRATO ESTÁVEL — não alterar sem avisar)

Work Log:
- `src/lib/types.ts`: UserDTO, MentorListItemDTO, MentorDetailDTO, ContentPostDTO, AvailabilityDTO, ReviewDTO, BookingDTO, BookingStatus
- `src/lib/store.ts`: zustand `useAppStore` com persist: `user: UserDTO|null`, `view: AppView`, `setUser`, `navigate`. AppView = {name:'marketplace'} | {name:'mentor', mentorId} | {name:'dashboard'} | {name:'meeting', bookingId} | {name:'onboarding'}
- `src/lib/api.ts`: cliente tipado (api.listUsers/createUser/listMentors/getMentor/getMyMentorProfile/saveMentorProfile/saveAvailability/getSlots/listBookings/createBooking/updateBooking/createReview/createContent/deleteContent)
- `src/lib/helpers.ts`: CATEGORIES, WEEKDAYS_PT/FULL, parseNaive/toNaive/nowNaive/dateKey/addDays, formatDayLabel ("sáb, 1 jun"), formatDayLabelLong, formatTimeLabel, addMinutesToTime, relativeDayLabel ("Hoje"/"Amanhã"), currencyBRL, hourToLabel/labelToHour, STATUS_META, CONTENT_TYPE_META, LEVEL_LABELS, avatarGradient(name), initials(name), firstName
- `src/components/platform/avatar.tsx`: `<Avatar name size="sm|md|lg|xl">` (gradiente+iniciais) e `<Stars rating size>` (estrelas)

Stage Summary:
- Todos os componentes do frontend devem consumir esses módulos.

---
Task ID: 4
Agent: main (Z.ai Code)
Task: Rotas de API

Work Log:
- GET/POST `/api/users`
- GET `/api/mentors?search=&category=&sort=` (sort: relevance|rating|price_asc|price_desc|experience)
- GET `/api/mentors/[id]` (detalhe + bookedSlots futuros PENDING/CONFIRMED)
- GET `/api/mentors/me?userId=` ({profile|null})
- POST `/api/mentors` (upsert perfil: userId, headline, description, categories[], hourlyRate, experienceYears, languages)
- PUT `/api/mentors/availability` ({userId, slots:[{weekday,startHour,endHour}]})
- GET `/api/slots?mentorId=&date=YYYY-MM-DD` (horários livres em ponto, 60min)
- GET/POST `/api/bookings`; PATCH `/api/bookings/[id]` ({userId, action: confirm|cancel|complete})
- POST `/api/reviews` ({bookingId, userId, rating 1-5, comment}) — exige COMPLETED + mentee
- POST `/api/contents`; DELETE `/api/contents/[id]?userId=`

Stage Summary:
- Regras: booking nasce PENDING (mentor confirma), cancel por mentor/mentee, complete por mentor; review só após COMPLETED, 1 por booking, pelo mentorado.

---
Task ID: 3-b
Agent: full-stack-developer
Task: Dashboard de sessões + Onboarding de mentor

Work Log:
- Lidos worklog.md, types.ts, store.ts, api.ts, helpers.ts, avatar.tsx e os componentes shadcn usados (tabs, select, alert-dialog, dialog, button, badge, card) para confirmar os contratos
- Criado `src/components/platform/dashboard.tsx`: guard sem usuário, skeleton de loading, header "Minhas sessões" + "Explorar mentores", painel âmbar de solicitações recebidas (mentor, PENDING) com Confirmar/Recusar (AlertDialog), Tabs (Próximas / Para avaliar / Histórico) com contadores, BookingCard (Avatar da outra parte, badge "Como mentor"/"Como aluno", headline, topic, notes, data completa com relativeDayLabel + formatDayLabelLong + "HH:mm → HH:mm", duração, preço BRL, STATUS_META) e ações (confirmar/recusar/concluir/entrar na sala/cancelar/avaliar com Dialog de estrelas 1-5 + comentário), empty states CalendarOff/Star/History
- Criado `src/components/platform/onboarding.tsx`: guard sem usuário, skeleton, hero "Torne-se um mentor no MentorHub" com 3 benefícios (BadgeDollarSign/Users/CalendarCheck), formulário de criação com validação client-side (headline>=8, description>=30, >=1 categoria, números válidos) e chips de CATEGORIES (selecionadas em bg-emerald-600 text-white); com perfil: (1) Perfil público com mini-stats (Stars/rating, reviewCount, conteúdos) e mesmo form para edição; (2) Disponibilidade semanal com slots locais, badges de faixas removíveis, linha inline de adição com dois Select de 06:00 a 21:30 (30 em 30 min, labelToHour), bloqueio de faixa < 1h e de sobreposição, "Salvar disponibilidade"; (3) Mural de conteúdos com lista max-h-96 overflow-y-auto (scrollbar custom), badges CONTENT_TYPE_META, nível, duração, tags outline, exclusão via AlertDialog + Trash2, Dialog "Novo conteúdo" (título, descrição, tipo, nível, duração, tags split por vírgula) e refetch via api.getMyMentorProfile
- Validação: `bun run lint` sem erros/warnings; `bunx tsc --noEmit` sem erros em src/ (erros pré-existentes apenas em examples/ e skills/, fora do escopo)
- Nenhum arquivo existente foi modificado; nenhum teste criado

Stage Summary:
- Duas views client-side completas (pt-BR, paleta esmeralda+stone, p-6/gap-6, toasts sonner em todas as mutações, acessibilidade com aria-labels/radiogroup/títulos semânticos, responsivas mobile-first) prontas para serem montadas pelo shell na task de integração via useAppStore().view ('dashboard' e 'onboarding')
- Decisões: estado derivado das abas calculado no render (listas pequenas, sem useMemo); contents do mural derivados do profile recarregado (reload via getMyMentorProfile) em vez de estado duplicado — mesmo comportamento de refetch simples; disponibilidade mantém estado local no editor para não sofrer clobber do reload; toasts de erro centralizados nos handlers de mutação; AlertDialog de exclusão usa preventDefault para exibir "Excluindo..." durante a chamada

---
Task ID: 3-c
Agent: main (Z.ai Code)
Task: Shell, Navbar, Marketplace, Perfil+Agendamento, Sala de reunião, Footer

Work Log:
- `src/components/platform/navbar.tsx`: nav sticky com seletor de usuário (login demo via dropdown/criar conta), navegação Explorar/Sessões/Tornar-se mentor, aria-labels
- `src/components/platform/marketplace.tsx`: hero emerald escuro com busca + stats dinâmicas, chips de categorias, seção "Como funciona", grid de mentores (ordenção Relevância/Rating/Preço/Experiência, skeletons, empty state)
- `src/components/platform/mentor-profile.tsx`: banner do mentor + tabs (Sobre/Mural/Horários/Avaliações) + BookingWidget sticky (strip de 14 dias, slots via /api/slots, tema/notas, dialog de confirmação, guarda de owner)
- `src/components/platform/meeting-room.tsx`: sala Jitsi Meet em iframe (meet.jit.si/<room>#userInfo.displayName), participantes, duração, anotações, copiar link, abrir em nova aba, "Encerrar sessão" (mentor → complete), bloqueios p/ CANCELLED/COMPLETED
- `src/components/platform/footer.tsx`: footer sticky (mt-auto) com safe-area
- `src/app/page.tsx`: shell SPA (min-h-screen flex flex-col), roteamento por view do zustand, key por usuário p/ refetch, splash de hidratação via useSyncExternalStore, Toaster (sonner)
- `src/app/layout.tsx`: metadados MentorHub; `globals.css`: --primary emerald (oklch 0.508 0.118 165.61)
- Fix: pluralização "1 sessão realizada"; fix a11y: aria-label nos botões da nav mobile

Stage Summary:
- Aplicação completa navegável em / (SPA por store). Tema esmeralda + stone. Footer cola no rodapé em páginas curtas e é empurrado em páginas longas.

---
Task ID: 7
Agent: main (Z.ai Code)
Task: Integração, lint e logs

Work Log:
- `bun run lint`: limpo (0 erros/warnings em todo o projeto)
- `bunx tsc --noEmit`: sem erros em src/ (único erro tsc pré-existente em skills/, fora do escopo)
- APIs testadas via curl: mentors list/detail/me, slots, bookings (criar/confirmar/cancelar), reviews, users
- Cache de CSS do Turbopack servia --primary antigo; resolvido forçando recompilação (touch globals.css)

Stage Summary:
- Build de dev saudável; nenhum erro no dev.log.

---
Task ID: 8
Agent: main (Z.ai Code)
Task: Verificação end-to-end com Agent Browser

Work Log:
- Marketplace desktop/mobile: hero, busca, categorias, grid, ratings ✓
- Login como Ana Souza via dropdown ✓
- Perfil do Carlos: tabs Sobre/Mural(3)/Horários/Avaliações ✓
- Agendamento completo pelo browser: slot 09:00 selecionado, tema preenchido, dialog de confirmação (R$ 180), envio, toast, redireção ao dashboard ✓
- Dashboard: solicitação do Lucas confirmada (lado mentor) ✓; review 5 estrelas da sessão com Rafael enviada (aba Para avaliar 1→0, Histórico +1) ✓
- Sala de reunião: Jitsi carregou de verdade (room "Mentorhub Room Carlos Ana", Join meeting UI) ✓; painéis de participantes/duração/anotações/dicas/copiar link ✓
- Onboarding: edição de perfil, disponibilidade semanal com faixas, mural com 2 conteúdos ✓
- Mobile (390x844): nav compacta, hero, chips, cards; footer sticky ok ✓
- Console/erros do browser: limpos; dev.log sem erros

Stage Summary:
- Plataforma verificada de ponta a ponta no browser real: marketplace → perfil → agendamento → confirmação → reunião (Jitsi) → avaliação → onboarding.

---
Task ID: 10-c
Agent: frontend-styling-expert
Task: Landing page para recrutar mentores (landing-mentor.tsx)

Work Log:
- Lidos worklog.md, store.ts (AppView com 'for-mentors' + navigate), helpers.ts (currencyBRL) e avatar.tsx (Avatar/Stars) para confirmar os contratos; conferidos slider.tsx (Radix onValueChange v[0]), accordion.tsx e card.tsx (overrides de gap/py via cn+twMerge)
- Criado `src/components/platform/landing-mentor.tsx` (único arquivo; nenhum outro modificado): 'use client', navigate({name:'onboarding'}) nos CTAs "Criar meu perfil de mentor", scrollIntoView suave para #calculadora (scroll-mt-24), raiz em fluxo simples sem min-h-screen/fixed (renderiza dentro do <main> scrollável)
- Hero split lg:grid-cols-2: pill badge, h1 com destaque emerald-700, 3 bullets com Check emerald, CTAs rounded-full h-12; mock UI em CSS puro (card de solicitação do Lucas Ferreira com Avatar/chips CalendarClock+Video/botões Aceitar-Recusar decorativos tabIndex={-1} aria-hidden) + 2 chips flutuantes absolutos (TrendingUp "R$ 2.450 este mês" com loop framer-motion y:[0,-6,0]; CalendarCheck "Novo agendamento")
- Calculadora (#calculadora): Card minimalista com 2 Sliders (horas 2-40, preço R$50-500, labels htmlFor + aria-label), painel de resultado bg-stone-50 com monthly = hours*4.33*rate (useMemo) em currencyBRL text-4xl emerald-700 + projeção anual, footnote 4,33 semanas/mês
- Como funciona (3 colunas, border-t-2 border-emerald-700 + numeração 01/02/03, sem cards); Benefícios (6 itens em grid 2/3 colunas, ícones bg-emerald-100 text-emerald-700 rounded-xl); Depoimento do Carlos Oliveira (Quote, Avatar xl, Stars 5, "Mentor de Tecnologia · 4 anos de experiência"); FAQ (Accordion single collapsible, 4 itens, border-stone-200, max-w-3xl); CTA final bg-emerald-950 rounded-3xl com blobs emerald blur + botão bg-white text-emerald-950 → onboarding
- Framer-motion contido: Rise (whileInView fade/rise, viewport once) nas seções + fade inicial no hero; animação de loop apenas em 1 chip
- Acessibilidade: seções semânticas com aria-labelledby, sr-only no título do depoimento, aria-hidden no mock decorativo e blobs, aria-labels nos Sliders
- Qualidade: `bun run lint` limpo (0 erros/warnings); `bunx tsc --noEmit` sem erros em src/ (erros pré-existentes apenas em examples/ e skills/, fora do escopo)

Stage Summary:
- Landing de recrutamento de mentores completa em pt-BR (hero com mock UI, calculadora interativa de ganhos, como funciona, 6 benefícios, depoimento, FAQ e CTA emerald-950), pronta para ser montada no shell via view { name: 'for-mentors' }, consumindo store/helpers/avatar + shadcn (Button/Card/Slider/Accordion) e paleta stone+esmeralda exclusiva

---
Task ID: 10-b
Agent: frontend-styling-expert
Task: Landing page para alunos (landing-mentee.tsx)

Work Log:
- Lidos worklog.md e os contratos da Task 3: store.ts (navigate, setExploreQuery, view {name:'home'}), api.ts (api.listMentors({}) → MentorListItemDTO[]), types.ts, helpers.ts (currencyBRL, firstName), avatar.tsx (Avatar sm/md/lg, Stars) e os componentes ui usados (Button, Input, Badge, Skeleton)
- Criado `src/components/platform/landing-mentee.tsx` (único arquivo tocado; export nomeado `LandingMenteeView`), client component em pt-BR para a view { name: 'home' }, renderiza como flow content dentro do main scrollável (sem min-h-screen/sticky/fixed)
- Hero branco centrado (max-w-3xl): pill "Mentorias 1:1 ao vivo" com Sparkles, h1 com span emerald-700, sub copy, form de busca (preventDefault → setExploreQuery(term) + navigate marketplace; Input h-13 rounded-2xl pl-11 com Search à esquerda + Button h-13 rounded-full "Explorar mentores", stacked mobile/row desktop, max-w-xl) e linha de 5 avatares sobrepostos (-space-x-2, ring embutido no Avatar) com "+N mentores especialistas" (N = mentors.length), com estado de carregamento em Skeletons
- Stats strip com useMemo a partir da lista da API: +mentores / +sessões (soma totalSessions) / +avaliações (soma reviewCount), sm:divide-x divide-stone-200, números text-3xl/4xl font-extrabold, labels uppercase; seção border-y bg-stone-50/50 py-10
- "Como funciona" em 3 colunas sem cards, cada uma com border-t-2 border-emerald-700 pt-6, número 01/02/03 em emerald-700 e os textos especificados (Descubra / Agende / Conecte-se)
- "Mentores em destaque": header com h2 + Button link "Ver todos" → marketplace; grid sm:grid-cols-3 gap-6 com top 3 (useMemo: rating>0, sort rating desc + reviewCount desc); card rounded-2xl border-stone-200 p-6 hover:border-emerald-300 com Avatar lg, BadgeCheck emerald-600 (rating>=4.5 && reviewCount>=3), "{firstName} · X anos de experiência", headline line-clamp-2, Stars + rating.toFixed(1) + (reviewCount), até 2 Badges bg-emerald-50 text-emerald-800, footer mt-auto border-t com currencyBRL(hourlyRate)+"/h" e Button sm rounded-full "Ver perfil" → {name:'mentor', mentorId}; 6 skeleton cards durante o load e empty state discreto se nada avaliado
- Depoimentos: 3 figures estáticos (rounded-2xl bg-stone-50 border-stone-100 p-6, Quote preenchido em emerald-700, blockquote text-sm stone-700, figcaption author) com histórias plausíveis: Lucas Prado (transição p/ produto), Camila R. (inglês com Sofia), Diego M. (carreira com Marina)
- CTA final: rounded-3xl bg-emerald-950 overflow-hidden com um blob emerald-600/30 blur, h2 "Pronto para dar o próximo passo?", copy emerald-100/90 e Button bg-white text-emerald-950 rounded-full px-8 h-12 → marketplace
- framer-motion sutil: hero com fade-up no mount e demais sections com whileInView (once, margin -80px, duration 0.5); acessibilidade com section aria-labelledby + h2 id, aria-labels em busca/BadgeCheck/Ver perfil, ícones decorativos aria-hidden
- Validação: `bun run lint` limpo (0 erros/warnings no projeto); `bunx tsc --noEmit` sem erros em src/ (apenas erros pré-existentes em examples/ e skills/, fora do escopo)

Stage Summary:
- Landing pública do lado mentee pronta em src/components/platform/landing-mentee.tsx, export nomeado `LandingMenteeView`, pronta para ser montada pelo shell no case view.name === 'home' do page.tsx
- Paleta estrita: branco/stone + emerald apenas (accent emerald-700, chips emerald-50/100, único momento escuro no CTA bg-emerald-950); botões rounded-full, cards rounded-2xl, layout max-w-6xl px-4 com seções py-14 sm:py-20
- Integração: consome apenas contratos existentes (useAppStore.navigate/setExploreQuery, api.listMentors, Avatar/Stars, currencyBRL/firstName) e navega somente para {name:'marketplace'} e {name:'mentor', mentorId}; nenhum outro arquivo foi modificado

---
Task ID: 10-a + 10-d + 10-e
Agent: main (Z.ai Code)
Task: Overhaul de UI — shell app-nativo, navbar/footer fixos minimalistas, Explorar inovador

Work Log:
- `src/lib/store.ts`: novas views `{name:'home'}` (landing alunos, default) e `{name:'for-mentors'}` (landing recrutamento); estado `exploreQuery` + `setExploreQuery` para pré-preencher o Explorar a partir da home; persist continua apenas com `user`
- `src/app/page.tsx`: shell app-nativo — raiz `h-dvh flex flex-col overflow-hidden`, Navbar e Footer `shrink-0` (sempre visíveis), `<main className="flex-1 overflow-y-auto overscroll-contain">` como único container de rolagem; reset de scroll via `mainRef.scrollTo` no change de view; splash `h-dvh` claro; rotas: home/for-mentors/marketplace/mentor/dashboard/meeting/onboarding
- `src/components/platform/navbar.tsx`: header fixo h-14 shrink-0 com backdrop-blur; logo → home; nav com pills minimalistas (ativo `bg-emerald-50 text-emerald-800`): Explorar / Minhas sessões / Para mentores (→ landing `for-mentors`, não mais direto ao onboarding); dropdown do usuário ganhou atalho "Explorar mentores"; logout → home; mobile sem segunda linha (tab bar do footer cobre)
- `src/components/platform/footer.tsx`: desktop = barra fina h-12 sempre visível (marca, 4 links, ©); mobile = tab bar nativa h-14 com safe-area (Explorar/Sessões/Ser mentor, ícone+label, ativo em emerald-700)
- `src/components/platform/marketplace.tsx` (redesign "Explorar"): barra superior compacta com título + contagem viva + Select de ordenação; busca grande com atalho de teclado "/" (listener global, hint `<kbd>`), botão de limpar (X) e debounce 300ms; chips de categoria com contagens calculadas da base completa (fetch sem filtros em paralelo); bento inovador: tile escuro `emerald-950` "Mentor em destaque" com rotação automática a cada 6s entre top-rated (AnimatePresence fade, dots clicáveis com role=tab) + 3 StatTiles (mentores/sessões/nota média com vírgula pt-BR); grid de cards minimalistas (rounded-2xl p-5, hover lift); pluralização "1 sessão"; consome `exploreQuery` da store uma única vez no mount (hero da home → Explorar pré-filtrado); "Como funciona" removido (mudou para a landing)
- `src/components/platform/landing-mentor.tsx`: fix `Math.round` no monthly da calculadora (evitava "R$ 8.443,5")

Stage Summary:
- Sistema inteiro agora comporta-se como app nativo web: header e footer permanentemente fixos, rolagem exclusiva do corpo; visual minimalista (branco/stone, hairlines, emerald como único acento, rounded-full/2xl)
- Novo Explorar é um dashboard: busca com "/", filtros com contagens, spotlight rotativo e stats — sem seção de marketing
- Duas landings novas: `home` (alunos) e `for-mentors` (recrutamento, com calculadora de ganhos interativa)

---
Task ID: 11
Agent: main (Z.ai Code)
Task: Integração, lint e verificação end-to-end no browser

Work Log:
- `bun run lint`: limpo (0 erros/warnings); `bunx tsc --noEmit`: sem erros em src/ (apenas erro pré-existing em skills/, fora de escopo)
- Verificação Agent Browser (desktop 1440x900): home (hero, stats, como funciona, destaques, depoimentos, CTA emerald-950) ✓; busca do hero "Product" → Explorar pré-filtrado com 2 resultados ✓; filtros por categoria com contagens (Carreira 4) ✓; spotlight rotativo trocou sozinho com dots ✓; landing mentores (hero com mock de solicitação + chips flutuantes, calculadora 10h/R$150→R$6.495, slider via teclado 10→13→R$8.443 arredondado, FAQ accordion abre, CTA → onboarding) ✓; login Ana via dropdown ✓; dashboard (tabs, badges, confirm/cancel via AlertDialog) ✓; perfil do mentor com booking widget sticky dentro do scroll container ✓; agendamento completo (slot 08:00, tema, dialog, toast, card em Próximas) e cancelamento do agendamento de teste ✓; sala de reunião Jitsi carregada ✓
- Mobile 390x844: header slim, tab bar fixa com estados ativos, home/search hero, Explorar com bento e chips roláveis, cards empilhados, "1 sessão" ✓
- Console do browser sem erros; dev.log saudável (apenas queries prisma)

Stage Summary:
- UI overhaul verificada de ponta a ponta no browser real, desktop + mobile; golden path (explorar → agendar → dashboard → reunião) intacto após o redesign
