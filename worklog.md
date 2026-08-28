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

---
Task ID: 1 + 2
Agent: main (Z.ai Code)
Task: Socials no perfil de mentor + sistema completo de Cursos (schema, seed, APIs, contratos)

Work Log:
- prisma/schema.prisma: MentorProfile ganhou instagram/linkedin/github/website (String?); novos models Course, Lesson (videoUrl + content textual, order) e Enrollment (unique [courseId,studentId], completedLessonIds como JSON string); User.enrollments; bun run db:push OK
- prisma/seed.ts: socials para os 7 mentores (mix de @handle e URL); 5 cursos completos (Arquitetura de Software R$189 Carlos; Do Zero a PM GRÁTIS Marina; Design Systems R$199 Beatriz; Growth R$149 Rafael; Inglês p/ Entrevistas R$89 Sofia) com 24 aulas (textos educativos reais + 4 videoaulas YouTube); 3 matrículas com progresso (Ana 2/5 no curso da Marina, Lucas 3/6 no Carlos, Thiago 1/4 no Rafael)
- src/lib/types.ts: SocialLinksDTO, CourseLessonDTO, CourseListItemDTO, CourseDetailDTO (enrollment opcional), EnrolledCourseDTO; MentorListItemDTO/MentorDetailDTO com socials
- src/lib/api.ts: listCourses/getCourse(userId?)/createCourse/updateCourse/deleteCourse/createLesson/deleteLesson/enrollCourse/toggleLessonComplete/listMyEnrollments; saveMentorProfile aceita socials
- src/lib/store.ts: nova view {name:'course', courseId} + exploreTab ('mentors'|'courses') com setExploreTab (consumida 1x pelo Explorar)
- src/lib/helpers.ts: socialUrl()/socialDisplay() (handle→URL, extrai domínio), toVideoEmbedUrl() (YouTube/youtu.be/vimeo→embed), formatTotalDuration()
- APIs novas: GET/POST /api/courses (filtros search/category/sort/mentorId/mentorUserId — mentorUserId inclui rascunhos), GET/PATCH/DELETE /api/courses/[id] (ownership check), POST/DELETE /api/courses/[id]/lessons (DELETE também limpa a aula das matrículas), POST /api/courses/[id]/enroll + PATCH (toggle aula concluída), GET /api/enrollments
- APIs alteradas: /api/mentors GET (socials na lista) e POST (aceita socials com trim/length cap), /api/mentors/[id] e /api/mentors/me retornam socials
- Dev server reiniciado (client Prisma stale); APIs testadas via curl: 5 cursos, detail com enrollment da Ana correto, matrículas OK

Stage Summary:
- Infra completa de cursos + socials no banco/API; contratos prontos para o frontend:
  - CourseView: componente de src/components/platform/course-view.tsx será montado em view {name:'course', courseId}
  - Explorar ganha aba Cursos via useAppStore.exploreTab/setExploreTab
  - socials chega pronto em MentorDetailDTO.socials e MentorListItemDTO.socials

---
Task ID: 3-b
Agent: frontend-styling-expert
Task: Cartões de prévia de redes sociais no perfil + aba Cursos + gestão de cursos/redes no onboarding

Work Log:
- Lidos worklog.md, types.ts, api.ts, helpers.ts (socialUrl/socialDisplay/avatarGradient/formatTotalDuration), store.ts, avatar.tsx, ui (button/card/badge/dialog/tabs/select) e as rotas de API de cursos/mentors para confirmar contratos
- Criado `src/components/platform/social-links.tsx`: `SocialLinksSection` ('use client') que se auto-oculta quando as 4 redes estão vazias; label uppercase "Encontre {firstName} também em" + flex flex-wrap gap-3 com 4 cartões-âncora (target=_blank, rel=noopener, aria-label "…(abre em nova aba)", focus-visible outline emerald):
  - Instagram (sm:w-72): anel de story com gradiente oficial do Instagram (p-[2.5px] linear-gradient 45deg #f09433→#bc1888) + Avatar, grid 3×2 de tiles aspect-square com avatarGradient(handle+i) e ícones lucide brancos 20% (Heart/MessageCircle/PlayCircle/Camera/Image/Bookmark), footer "Ver perfil completo"
  - LinkedIn (sm:w-64): quadrado #0A66C2 com "in" em CSS puro (font-black), socialDisplay do valor, footer "Abrir perfil" — única exceção de cor fora da paleta, por brand recognition
  - GitHub (sm:w-72): cartão escuro stone-900/stone-800 com chip Github, grafo de contribuições fake 7×5 (h-2.5 rounded-[2px], ~40% células preenchidas via hash determinístico de handle+row+col com avatarGradient e opacidade variável, resto bg-white/10), footer "Ver repositórios" text-white/70
  - Site/Portfólio (sm:w-64): Globe2 em chip emerald-50/emerald-700, domínio truncado via socialDisplay, footer "Abrir"
- `mentor-profile.tsx`: SocialLinksSection renderizado logo após o banner (self-hiding); novo fetch em paralelo no load() via Promise.all([getMentor, listCourses({mentorId}).catch(→[])]) guardado em `courses`; TabsTrigger "Cursos" (com contagem quando > 0) após "Mural de conteúdos"; TabsContent com empty state dashed (Library, "Este mentor ainda não publicou cursos.") ou grid sm:grid-cols-2 de cards rounded-2xl overflow-hidden com faixa h-20 avatarGradient(course.title) + Library white/20 + Badge de nível branco, corpo com line-clamp-1/2, stats (aulas · formatTotalDuration · alunos), footer border-t com "Grátis" (emerald-700 font-extrabold) ou currencyBRL + Button rounded-full "Ver curso" → navigate({name:'course', courseId})
- `onboarding.tsx`: (A) ProfileFormValues ganhou `socials: SocialLinksDTO`; nova seção "Redes sociais e portfólio" (AtSign + helper "Aparecem como cartões de prévia no seu perfil público.") após Idiomas com 4 Inputs (Instagram com prefixo @ visual, LinkedIn, GitHub, Site/Portfólio) inicializados de initial?.socials e enviados com trim/empty→undefined; fluxos de criação/edição passam socials: profile.socials ?? {}; (B) `CoursesManager` (após ContentsManager, apenas com perfil): fetch listCourses({mentorUserId}) no mount com skeletons, lista max-h-96 com scrollbar custom, item com badges categoria/nível/Publicado(emerald)/Rascunho(stone), stats (aulas · Gratuito|currencyBRL · alunos) e ações Aulas (ListVideo)/Editar (Pencil)/publicar-despublicar (Eye/EyeOff com toggle disabled)/Excluir (Trash2 → AlertDialog com aviso de progresso dos alunos); Dialog criar/editar (Título≥5, Descrição≥30 rows=3, Categoria obrigatória, Nível, Preço com hint "Deixe 0...", erros inline rose-600); criar → toast "Curso criado! Agora adicione aulas." e abre direto o gerenciador de aulas do curso recém-criado; `LessonsManagerDialog` (sm:max-w-lg): aulas via api.getCourse, lista compacta com número de ordem, ícone Vídeo/FileText, duração, exclusão direta com toast; formulário inline "Adicionar aula" (Título, Duração, Vídeo URL opcional, Conteúdo textual, Resumo) com validação título≥3, duração>0 e "vídeo OU conteúdo" obrigatório; todas as mutações fazem refresh do pai (onChanged→reload) + lista local
- Validação: `bun run lint` limpo (0 erros/warnings); `bunx tsc --noEmit` sem erros em src/ (apenas erros pré-existentes em examples/ e skills/, fora do escopo); dev server compilou sem erros e APIs de cursos/socials testadas via curl

Stage Summary:
- Perfis públicos de mentor agora exibem cartões-rich-link das redes (Instagram com grid de posts, LinkedIn com marca, GitHub com grafo fake determinístico, Site/Portfólio) logo abaixo do banner, self-hiding e na linguagem visual stone+esmeralda
- Perfil ganhou aba "Cursos" com cards navegáveis para a CourseView ({name:'course', courseId}); onboarding virou painel completo do mentor com criação/edição/publicação/exclusão de cursos (incl. rascunhos) e gestão de aulas (vídeo ou texto) sem tocar em nenhum arquivo de API/lib

---
Task ID: 3-a
Agent: frontend-styling-expert
Task: UI de Cursos — CourseView (overview + sala de aula), aba Cursos no Explorar e "Cursos em destaque" na landing do aluno

Work Log:
- Lidos worklog.md e contratos (types.ts, api.ts, store.ts, helpers.ts, avatar.tsx) + rotas /api/courses (filtros/sort), enroll (POST/PATCH) e componentes shadcn (Card/Dialog/Progress/Badge/Skeleton) antes de codar
- Criado `src/components/platform/course-view.tsx`: export `CourseView({ courseId })`; fetch `api.getCourse(courseId, user?.id)` com skeleton, error Card com "Tentar novamente" e refetch
  - Modo visitante: botão "Voltar" (→ marketplace), hero gradiente `avatarGradient(title)` com watermark Library, badges categoria/nível, stats row (aulas · duração · alunos · preço), "O que você vai aprender" (Check, máx. 6), "Currículo do curso" (nº, título, descrição line-clamp-1, PlayCircle/FileText + duração, Lock stone-300), card do mentor (Avatar/headline/Stars/"Ver perfil" → mentor), sidebar Card sticky (`lg:sticky lg:top-6`) com preço ("Grátis" emerald-700 ou BRL), botão de inscrição (sem login → toast.error('Entre com uma conta no topo da página para se inscrever.'); grátis → inscreve direto; pago → Dialog "Confirmar inscrição" com resumo + "(checkout demonstrativo — nenhuma cobrança real)"), refetch pós-inscrição ativa a sala de aula; toast 'Inscrição realizada! Boa jornada 🎉'
  - Modo inscrito: header compacto com "X de N aulas concluídas" + Progress (track white/25, fill branco via `[&_[data-slot=progress-indicator]]:bg-white`) e "100% concluído 🎉"; layout `lg:grid-cols-[320px,1fr]`: currículo clicável (ativa bg-emerald-50/border-emerald-200, concluída CheckCircle2 fill-emerald-600 + título riscado, atual PlayCircle, demais com duração; max-h-540 + scrollbar custom), player Card p-6 (Badge "Aula X de N", iframe 16:9 youtube-nocookie via toVideoEmbedUrl + link "Abrir no YouTube" ExternalLink, ou artigo em parágrafos whitespace-pre-line/leading-relaxed; placeholder se sem material), rodapé "← Anterior" / toggle "Marcar como concluída"/"Aula concluída ✓" (outline emerald quando concluída) / "Próxima →", toggle chama api.toggleLessonComplete e atualiza completedIds pela resposta; 100% → toast 'Curso concluído! Parabéns 🎉'; currentLessonId inicial = primeira aula não concluída
- Modificado `src/components/platform/marketplace.tsx`: controle segmentado role=tablist/aria-selected ("Mentores" Users / "Cursos" BookOpen, rounded-full bg-stone-100 p-1, ativo bg-white shadow-sm) no topo da barra superior; tab inicializada 1x de `useAppStore.getState().exploreTab` e resetada para 'mentors' (consume-once); aba Mentores intacta; aba Cursos: h1 "Explorar cursos" + contador vivo ("X cursos publicados"), Select próprio (Relevância/Populares/Novidades/Menor/Maior preço), mesmo Input de busca (placeholder/aria-label por aba, "/" e debounce mantidos), mesmas chips de categoria com contagens de baseCourses, bento com CourseSpotlightCard (emerald-950, "Curso em destaque" pulsante, ícone com anel avatarGradient, mentor+Stars, chips aulas/duração/alunos, "Grátis" emerald-300, botão branco "Ver curso") + 3 StatTiles (cursos/alunos/aulas), grade de CourseCard (capa h-28 gradiente + Library white/20, Badge nível white/90, pill de preço "Grátis" emerald-700 ou branco, título/mentor+Stars/descrição line-clamp-2, stats BookOpen/Clock/Users, botão "Ver curso"), skeletons e empty state espelhando mentores; baseCourses buscada 1x; lista filtrada só carrega com a aba ativa
- Modificado `src/components/platform/landing-mentee.tsx`: nova seção "Cursos em destaque" entre Mentores em destaque e Depoimentos (mesmo padrão motion whileInView), fetch `api.listCourses({})` em effect próprio; header com subtítulo "Aprenda no seu ritmo..." + Button link "Ver todos os cursos" → `setExploreTab('courses')` + navigate marketplace; top 3 por studentCount desc + rating do mentor; FeaturedCourseCard (capa h-24 gradiente, badges categoria/nível, título line-clamp-2 min-h, mentor, stats aulas/duração, footer "Grátis" emerald-700 ou BRL + "Ver curso"); skeletons e retorno null da seção quando não há cursos
- Validação: `bun run lint` limpo; `bunx tsc --noEmit` sem erros em src/ (apenas erros pré-existentes em examples/ e skills/); verificação no browser (desktop 1440x900 + mobile 390x844): landing com nova seção na posição certa, Explorar abas Mentores/Cursos com contagens corretas (+5 cursos/+3 alunos/+23 aulas), busca com empty state + "Limpar filtros", atalho "/", "Ver todos os cursos" abre direto na aba Cursos e consume-once restaura Mentores na visita seguinte, sem overflow horizontal e console limpo

Stage Summary:
- Frontend de cursos completo: `course-view.tsx` pronto para ser montado no shell na view {name:'course', courseId} (próxima task de integração), Explorar com aba Cursos via exploreTab e landing do aluno divulgando os cursos
- Padrões mantidos: stone+emerald, rounded-2xl/full, hairlines, pt-BR, toasts sonner, aria (tablist/aria-selected/aria-current/aria-label), targets ≥44px nos controles principais; nenhum arquivo de API/store/helpers/page.tsx foi alterado

---
Task ID: 4
Agent: main (Z.ai Code)
Task: Integração das telas de curso no shell + aba Meus cursos no dashboard

Work Log:
- src/app/page.tsx: view {name:'course'} montada com <CourseView courseId> importado de components/platform/course-view
- src/components/platform/dashboard.tsx: nova aba "Meus cursos" (entre Próximas e Para avaliar) com count pill; refetch agora carrega api.listMyEnrollments em Promise.all; novo componente EnrolledCourseCard (gradiente do título, progresso X/N aulas com ui/progress, badge "Concluído", botão Continuar/Revisar → view course); empty state com CTA setExploreTab('courses')+marketplace
- Corrigido import Clock renomeado por engano (lint acusou jsx-no-undef)

Stage Summary:
- Shell, dashboard e rotas integrados; lint 0 erros; tsc sem erros em src/

---
Task ID: 5
Agent: main (Z.ai Code)
Task: Verificação end-to-end no browser + fixes de responsividade

Work Log:
- Agent Browser desktop 1440x900: home com "Cursos em destaque" ✓; "Ver todos os cursos" abre Explorar direto na aba Cursos (exploreTab consume-once) ✓; spotlight de curso + stats (+5 cursos/+3 alunos/+23 aulas) ✓; grid com 5 cursos ✓; overview do curso (hero gradiente, o que vai aprender, currículo locked, sidebar Grátis/pago) ✓; login Ana → classroom com 40% (2/5), aulas 1-2 riscadas ✓; "Marcar como concluída" → toast + toggle + progresso ✓; aula em vídeo com iframe YouTube embed ✓; curso pago → dialog "Confirmar inscrição" (R$ 199, checkout demonstrativo) → classroom 0/4 ✓
- Perfil do Carlos: 4 cards sociais (Instagram com anel gradiente + grid de posts, LinkedIn #0A66C2, GitHub dark com contribution graph, portfólio) ✓; aba Cursos (1) com card ✓; painel do mentor: campos Redes sociais preenchidos ✓; Meus cursos com Aulas dialog (6 aulas listadas), adicionar aula (toast, 7 aulas, contador atualizado) e remover ✓
- Dashboard Ana: aba Meus cursos com 2 matrículas + barras de progresso (0/4 e 3/5) ✓
- Mobile 390x844: overflow horizontal detectado (scrollWidth 456/450) — causa: grids sem coluna explícita no mobile (auto tracks = min-content). Fix: `grid-cols-1` (minmax(0,1fr)) no bento do marketplace e nos 3 grids do course-view; re-verificado sw=390 sem offenders ✓; social cards empilham ✓
- Erro de hidratação `<p> contendo <div>` (Avatar) no header do classroom → trocado p por div; console/erros limpos após fix ✓
- Regressão: aba Mentores intacta (spotlight rotativo, chips com contagens, stats) ✓
- Final: bun run lint 0 erros/warnings; bunx tsc --noEmit sem erros em src/; dev.log saudável; browser fechado

Stage Summary:
- Sistema de cursos completo e verificado de ponta a ponta: criar (mentor) → publicar → explorar → matricular (grátis/pago) → assistir (texto/vídeo) → progredir → concluir; redes sociais com previews ricos no perfil e gestão no onboarding; mobile sem overflow; console limpo

---
Task ID: 1-5 (infra)
Agent: main (Z.ai Code)
Task: Infra de tracking GA4/Meta Pixel, checkout, fotos e LP pública

Work Log:
- prisma/schema.prisma: User.avatarUrl; MentorProfile.slug(@unique)/coverUrl/gaMeasurementId/metaPixelId; Course.coverUrl; novos models Order (checkout com atribuição: utm*/gclid/fbclid/channel/landingPage) e TrackingEvent (page_view|view_item|begin_checkout|purchase|lead com atribuição); db:push OK
- src/lib/tracking.ts ('use client'): captureAttributionFromUrl (utm_*/gclid/fbclid → last non-direct click, TTL 7d em localStorage mh_attribution_v1), classifyChannel (paid_search/paid_social/social/email/referral/direct), loadTrackingScripts (injeta gtag.js + fbevents.js para IDs da plataforma via env NEXT_PUBLIC_GA_MEASUREMENT_ID/NEXT_PUBLIC_META_PIXEL_ID e/ou do mentor), trackEvent (POST /api/track via sendBeacon + gtag('event') + fbq('track') com mapas page_view→PageView, view_item→ViewContent, begin_checkout→InitiateCheckout, purchase→Purchase, lead→generate_lead), getAttribution, setAttributionLandingPage, cleanUrlParams (limpa utms preservando mentor/course), buildMentorLpUrl/buildCourseUrl (gerador de links p/ impulsionar)
- Novas APIs: POST /api/upload (multipart → public/uploads, JPG/PNG/WEBP/GIF até 5MB → {url}); POST /api/track (valida nome, grava evento com atribuição); GET /api/track/stats?mentorUserId (funil pageview→view_item→checkout→purchase, receita via orders, byChannel/bySource/byCourse/daily 14d); POST /api/checkout (Order+Enrollment+TrackingEvent purchase em $transaction, 409 se já inscrito); GET /api/mentors/by-slug/[slug] (dados públicos da LP: mentor+tracking, cursos publicados, mural, reviews, studentCount)
- APIs estendidas: /api/mentors GET (avatarUrl/coverUrl/slug) e POST (avatarUrl→User, coverUrl/gaMeasurementId validado G-XXX/metaPixelId 14-20 dígitos, undefined=manter, slug único auto com slugify); /api/mentors/[id] e /me (avatarUrl/coverUrl/slug/tracking); /api/courses GET/POST (coverUrl, mentor.avatarUrl) e /[id] GET (coverUrl, mentor.avatarUrl, mentor.tracking)/PATCH (coverUrl); /api/enrollments (coverUrl, mentor.avatarUrl); /api/users (avatarUrl)
- helpers.ts: slugify(); avatar.tsx: Avatar aceita src (img com fallback para iniciais via onError); types.ts: TrackingIdsDTO, AttributionDTO, MentorLpDTO, OrderDTO, CheckoutResultDTO, TrackingStatsDTO, tracking no MentorDetailDTO e course.mentor; api.ts: uploadImage/getMentorBySlug/checkout/trackingStats + saveMentorProfile com avatarUrl/coverUrl/ga/meta + createCourse/updateCourse com coverUrl; store.ts: views {name:'mentor-lp',slug} e {name:'checkout',courseId}
- prisma/seed.ts: avatares para 13 usuários, capas de perfil + slug para os 7 mentores, coverUrl nos 5 cursos, tracking IDs demo (Carlos G-MHDEMO01+Pixel, Rafael Pixel), 5 pedidos pagos com atribuição + ~104 eventos de funil nos últimos 14 dias (6 canais)
- prisma/gen-seed-images.ts: gera 25 imagens via z-ai sdk em public/uploads/seed/ (11 prontas, restante em background)

Stage Summary:
- Infra completa e rastreável: atribuição 7 dias + pixels GA4/Meta (plataforma e mentor) + funil server-side + checkout transacional + LP pública por slug + uploads de foto; contratos prontos para os agentes de frontend

---
Task ID: 6
Agent: frontend-styling-expert
Task: LP do mentor + checkout

Work Log:
- Lidos worklog.md (Task 1-5 infra) e contratos: types.ts (MentorLpDTO/CheckoutResultDTO/OrderDTO/CourseListItemDTO/TrackingIdsDTO), api.ts (getMentorBySlug/checkout/enrollCourse/getCourse), store.ts (views mentor-lp/checkout), tracking.ts (trackEvent/loadTrackingScripts/setAttributionLandingPage/getAttribution), helpers.ts, avatar.tsx (Avatar com src), mentor-profile.tsx/course-view.tsx (padrões) e ui/ (radio-group existe — usado; button/card/badge/input/label/separator/skeleton)
- Criado `src/components/platform/mentor-lp.tsx`: export `MentorLpView({ slug })`; fetch `api.getMentorBySlug` com skeleton (hero+avatar+cards), erro/notfound em Card dashed "Esta página não está disponível." + "Conhecer a plataforma" → home; tracking no primeiro load com ref-guard (StrictMode-safe): `setAttributionLandingPage('mentor_lp')` ANTES de `loadTrackingScripts({mentorGaId, mentorPixelId})` → `trackEvent('page_view')` + `view_item` do primeiro curso
  - HERO max-w-5xl: coverUrl → img h-56/64 object-cover com overlay `from-stone-900/70`, senão banner `avatarGradient(name)`; Avatar xl com src + anel emerald (ring-4 ring-emerald-500/70 sobrescreve ring-2 ring-white via cn/tw-merge), Badge "Mentor verificado" (BadgeCheck, emerald-50/700), h1 text-3xl extrabold, headline, chips (Stars+nota vírgula pt-BR+avaliações, "{n}+ sessões" CalendarCheck2, "X anos de experiência" Clock3, idiomas Globe); redes sociais = linha de botões circulares h-11 w-11 (a target=_blank rel=noopener, aria-label "Instagram de X: @handle (abre em nova aba)", ícones Instagram/Linkedin/Github/Globe, hover emerald) via socialUrl/socialDisplay — sem importar social-links.tsx
  - Prova social: strip bg-emerald-950 rounded-2xl grid-cols-2 sm:grid-cols-4 (studentCount/totalSessions/rating médio/cursos publicados, valores com toFixed(1).replace('.',','))
  - Cursos (id="lp-cursos" scroll-mt-6): grid-cols-1 sm:grid-cols-2 gap-5; card clicável (article onClick + CTA com stopPropagation) com capa img h-36 ou gradiente avatarGradient(title)+Library white/20, Badges categoria/nível, título bold, line-clamp-2, stats BookOpen/Clock/Users, footer mt-auto com "Grátis" emerald-700 ou currencyBRL + Button h-11 rounded-full ("Inscrever-se grátis"/"Comprar agora"); clique: view_item → grátis (logado: enrollCourse+toast+navigate course; sem login: toast.error('Entre com uma conta no topo da página para se inscrever.')) | pago: begin_checkout({value})+navigate checkout
  - Sobre {firstName} (description whitespace-pre-line + chips de categorias + idiomas), Mural opcional (lista compacta divide-y com CONTENT_TYPE_META + duração), Depoimentos (grid sm:grid-cols-2, Stars, line-clamp-4, Avatar iniciais + data curta via parseNaive+MONTHS_PT)
  - CTA final bg-emerald-950 rounded-3xl com blobs: "Aprenda com {firstName} de perto" + "Agendar uma mentoria" (trackEvent('lead',{mentorId}) → view mentor) + "Ver cursos" (scrollIntoView smooth #lp-cursos); rodapé fino "Página oficial de {name} na plataforma MentorHub" com link → home
- Criado `src/components/platform/checkout.tsx`: export `CheckoutView({ courseId })`; fetch `api.getCourse(courseId, user?.id)` com skeleton/erro("Tentar novamente"); na 1ª montagem (ref-guard): loadTrackingScripts(pixels do mentor) + `trackEvent('begin_checkout',{mentorId,courseId,value,contentName})`
  - Estados pré-form: user null → Card LogIn "Entre com uma conta no topo da página (menu Entrar) para concluir a compra"; enrollment não-null → Card emerald "Você já tem acesso a este curso" + "Ir para o curso"; price 0 → aviso "Este curso é gratuito" + "Inscrever-se" (enrollCourse → toast → view course)
  - Form max-w-3xl: voltar (ArrowLeft → view course) + h1 Checkout; Card resumo (capa h-28 img/gradiente, badges categoria/nível, título, mentor com Avatar src+Stars, Separator, Total currencyBRL text-2xl extrabold, nota "Pagamento processado pela plataforma · demonstração"); banner amber "Ambiente de demonstração — nenhuma cobrança real"; RadioGroup shadcn com 2 Labels-clicáveis rounded-2xl (has-checked via cn condicional: border-emerald-500 bg-emerald-50/60 ring-1): PIX (QrCode, "Aprovação imediata") e Cartão (CreditCard, "Em até 12x — simulação"); PIX → box com QrCode h-24 w-24 stone-300 + copy gateway; Cartão → inputs demo (número "•••• •••• •••• 4242", nome, validade, CVV) + helper "não insira dados reais"
  - Pagar: Button h-13 rounded-full "Pagar {currencyBRL}" com Loader2 "Pagando…"; payload inclui `attribution: getAttribution()` (servidor lê body.attribution no Order/TrackingEvent — api.checkout aceita prop extra via variável não-literal); sucesso → `trackEvent('purchase',{transactionId: order.id,...})` + toast 'Pagamento aprovado! 🎉' + tela de sucesso (CheckCircle2 emerald, "Você já tem acesso a '{título}'", dl com pedido #ID8/método/total, "Acessar o curso" e "Explorar mais cursos"); erro → toast.error e, em 409 "já tem acesso", refetch para mostrar estado inscrito
  - Rodapé: ShieldCheck "Compra protegida · 7 dias de garantia" + Lock "SSL"
- Nota: removidos os 3 comentários `eslint-disable-next-line @next/next/no-img-element` — a regra está OFF no eslint.config.mjs e o projeto passou a reportar "Unused eslint-disable directive" (warning) para eles (avatar.tsx já teve o comentário removido nesta mesma rodada); com <img> direto o lint fica 100% limpo
- Validação: `bun run lint` 0 erros/0 warnings; `bunx tsc --noEmit` sem erros em src/ (restam apenas erros pré-existentes em examples/, skills/ e prisma/gen-seed-images.ts, fora do escopo)

Stage Summary:
- LP de conversão do mentor (`mentor-lp.tsx`, export MentorLpView) e checkout demonstrativo (`checkout.tsx`, export CheckoutView) criados sem tocar em nenhum arquivo existente; prontos para montagem no shell nas views {name:'mentor-lp', slug} e {name:'checkout', courseId}
- Funil de eventos coberto de ponta a ponta: page_view/view_item (LP, com landing mentor_lp marcada antes do 1º evento e pixels do mentor injetados), begin_checkout (LP pago + 1ª montagem do checkout), purchase (com transactionId) e lead (CTA mentoria); atribuição utm/gclid/fbclid segue junto no corpo do checkout para os relatórios
- Padrões mantidos: stone+emerald, rounded-2xl/full, hairlines, pt-BR, toasts sonner, grids sempre com coluna explícita no mobile, alvos ≥44px nos CTAs/redes sociais, aria-labels/alt em tudo; descoberta compartilhada: não usar eslint-disable para <img> (regra off + unused-directive warning)


---
Task ID: 6-8 (agentes, recuperação)
Agent: main (Z.ai Code)
Task: Agentes LP/Checkout, Onboarding e UI-Polish

Work Log:
- Task 6 (agente): criados src/components/platform/mentor-lp.tsx (LP pública rastreável: hero com capa+avatar foto, prova social, cursos com funil view_item/begin_checkout, mural, depoimentos, CTA final com lead, pixels do mentor injetados via loadTrackingScripts) e src/components/platform/checkout.tsx (resumo do pedido, PIX/Cartão demo, api.checkout com attribution: getAttribution(), purchase com transactionId, tela de sucesso)
- Tasks 7 e 8 (agentes caíram por timeout de infra APÓS completar os arquivos; trabalho validado e mantido): onboarding.tsx ganhou Fotos do perfil (upload/preview/remover capa+avatar), Link público (copy/abrir), IDs GA4/Meta Pixel com validação (G-XXXX / 14-20 dígitos), Gerador de link de impulsionamento (utm_source/medium/campaign + destino LP ou curso, URL em tempo real), painel Desempenho de tráfego (KPIs, taxa de conversão, gráfico 14d, por canal/origem/curso); capa de curso no CoursesManager + botão Link por curso
- UI-Polish: navbar com avatarUrl real + Search + pill animada (layoutId); mentor-profile com capa real, avatar foto e socials simplificados (botões circulares redirecionáveis, social-links.tsx DELETADO); marketplace/landing-mentee/course-view/dashboard com capas reais (fallback gradiente) e fotos de avatar; course-view pago agora navega para {name:'checkout'} em vez de dialog

Stage Summary:
- Funil completo rastreável: LP/curso → view_item → begin_checkout → checkout → purchase, tudo com atribuição utm/gclid/fbclid/channel/landingPage

---
Task ID: 9-10
Agent: main (Z.ai Code)
Task: Integração no shell, seed de imagens, fixes e verificação end-to-end

Work Log:
- page.tsx: bootstrap único (useRef) — captureAttributionFromUrl(mentorSlug), loadTrackingScripts() da plataforma, roteamento por ?mentor=slug → view mentor-lp e ?course=id → view course, trackEvent('page_view'), cleanUrlParams(); views mentor-lp e checkout montadas
- Fixes: mentor-lp e mentor-profile — texto do nome não invade mais a capa (só o avatar sobrepõe com -mt-12); </div> órfão do meu primeiro fix removido (Build Error de parse)
- prisma/gen-seed-images.ts: 25 imagens geradas (7 avatares mentores, 6 alunos, 7 capas de perfil, 5 capas de curso) em public/uploads/seed/; seed rodado com pedidos pagos + ~104 eventos de funil (6 canais) nos últimos 14 dias
- APIs testadas via curl: by-slug OK, track OK, stats OK (Carlos: 34 pageviews/2 vendas/R$378 antes da compra real), upload OK, checkout OK
- Browser (desktop 1440x900): LP Carlos com utm instagram/cpc/boost-teste/fbclid=DemoFb123 → URL limpa preservando ?mentor=slug ✓; hero com capa+foto+badge+socials ✓; Comprar agora → checkout (PIX com QR demo) ✓; compra real pela Ana → Pagamento aprovado 🎉, pedido #CMTCKFX7 ✓; Order gravado com paid_social/instagram/cpc/boost-teste/DemoFb123/mentor_lp ✓; painel de tráfego do Carlos atualizado (37 visitas, 10 checkouts, 3 vendas, R$567, 8,1%) ✓; onboarding com fotos/GA G-MHDEMO01/Pixel/gerador UTM em tempo real ✓; marketplace com capas+0 imagens quebradas ✓; perfil com capa e socials simples ✓; dashboard Meus cursos com capas e progresso ✓; ?course=id abre curso direto com capa ✓
- Mobile 390x844: LP Marina sem overflow (sw=cw=390), tab bar ok ✓; console sem erros (apenas warning benigno de multi-pixel em dev) ✓; lint 0/0, tsc limpo em src/, dev.log saudável ✓

Stage Summary:
- Sistema completo de tráfego pago + fotos + UI app-like verificado de ponta a ponta no browser: mentores impulsionam links UTM (LP ou curso), conversões chegam atribuídas (Order + TrackingEvent), pixels GA4/Meta da plataforma e do mentor disparam PageView/ViewContent/InitiateCheckout/Purchase, painel de desempenho mostra funil e receita por canal; perfis e cursos com fotos/capas reais

---
Task ID: 4-a-2
Agent: frontend-styling-expert
Task: Integrar trilhas nas telas existentes (marketplace, checkout, landing mentee, dashboard, onboarding)

Work Log:
- marketplace.tsx: 3ª aba "Trilhas" no Explorar (pill Route com mesmas classes/aria-selected); loadTracks reutilizando search (debounce)/category com trackSort próprio (effect if tab==='tracks'); baseTracks para contagens por categoria; header "Explorar trilhas", placeholder/aria de busca, Select de ordenação (relevância/populares/novidades/menor/maior preço), TrackSpotlightCard (top por studentCount) + StatTiles (trilhas/alunos/mentorias inclusas) no bento; grid tracks com skeleton h-36 e empty state "Nenhuma trilha encontrada" + "Limpar filtros"; TrackCard (article rounded-2xl border bg-white overflow-hidden cursor-pointer hover, capa h-36 coverUrl/gradiente avatarGradient + ícone Route white/20, Badge "Trilha" teal-50/text-teal-700 + categoria, título line-clamp-1, stats BookOpen "{courseCount} cursos" · Users "{mentorshipSessions} mentorias" · Clock formatTotalDuration, mentor Avatar sm + Stars, footer mt-auto Grátis emerald-700/currencyBRL + Button h-11 rounded-full "Ver trilha") com onClick navigate({name:'track'}) e stopPropagation no botão; grid min-w-0 (sem overflow horizontal no mobile)
- checkout.tsx: props agora CheckoutView({courseId?, trackId?}); fetchSummary unificado (getTrack quando trackId, getCourse quando courseId); begin_checkout com ref-guard (trilha: mentorId/value/contentName + loadTrackingScripts(); curso mantém pixels do mentor); ItemSummary normalizado para reusar resumo/estados; resumo da trilha com capa/gradiente+Route, badges categoria/nível, linha "Trilha com X cursos e Y mentorias 1:1" (BookOpen/Users), mentor Avatar+Stars, total currencyBRL; 409 "já tem acesso" → refetch → estado inscrito com "Acessar a trilha" → navigate track; doPay com payload {courseId|trackId, paymentMethod, attribution: getAttribution()} e purchase (transactionId/contentName); tela de sucesso usa order.order.itemTitle com "Acessar a trilha" / "Explorar mais trilhas" (setExploreTab('tracks') + marketplace) ou curso (inalterado); trilha gratuita defensiva ("Esta trilha é gratuita" + api.enrollTrack); usos de courseTitle substituídos por itemTitle
- landing-mentee.tsx: seção "Trilhas em destaque" após Cursos em destaque (mesmo header/CTA "Ver todas as trilhas" → setExploreTab('tracks') + marketplace); api.listTracks({sort:'popular'}) em effect próprio não-bloqueante; FeaturedTrackCard (mesmo padrão do TrackCard: capa h-36/gradiente, Badge teal, "{courseCount} cursos · {mentorshipSessions} mentorias · duração", mentor+Stars, preço, CTA "Ver trilha"); topTracks.slice(0,3), grid sm:grid-cols-2 lg:grid-cols-3; seção oculta quando a lista vem vazia (só skeletons durante load)
- dashboard.tsx: api.listMyTracks(userId) adicionado ao Promise.all do refetch (catch → []); bloco "Minhas trilhas" no TOPO da aba Meus cursos, oculto quando vazio; MyTrackCard compacto (thumb coverUrl/gradiente+Route, título, Badge categoria teal, Progress + "{percent}% concluído", Badge emerald "Trilha concluída 🎉" quando 100%, CTA "Abrir trilha" → track e secundário "Continuar curso" → classroom do próximo curso incompleto de perCourse)
- onboarding.tsx: import { TracksManager } de './tracks-manager' + renderizado imediatamente após <CoursesManager userId={user.id} onChanged={reload} .../>, com o MESMO callback reload (apenas import + 1 linha de JSX, nada mais tocado)

Stage Summary:
- Trilhas integradas de ponta a ponta na UI: aba Trilhas no Explorar (filtros/ordenação/destaque/cards), landing com destaque de trilhas populares, checkout dual curso/trilha com itemTitle e funil begin_checkout/purchase, dashboard com Minhas trilhas + progresso + continuar curso, e TracksManager montado no painel do mentor. bun run lint 0/0; bunx tsc --noEmit limpo em src/ (track-view.tsx/tracks-manager.tsx já presentes). Atenção: /api/tracks retorna 500 no dev.log por PrismaClient obsoleto no processo do dev server (client já regenerado em disco e tabelas Track* existem; Track=0 linhas — seed de trilhas pendente). Exige restart do dev server (fora do escopo: não iniciado por este agente).

---
Task ID: 4-a-1
Agent: frontend-styling-expert
Task: TrackView (detalhe da trilha) + TracksManager (gerenciador de trilhas do mentor)

Work Log:
- Lidos worklog.md (padrões de 3-a/6/etc.) e contratos obrigatórios: types.ts (TrackListItemDTO/TrackDetailDTO/TrackDetailItemDTO/MyTrackDTO/TrackItemInput/CourseListItemDTO), api.ts (listTracks/getTrack/createTrack/updateTrack/deleteTrack/enrollTrack/listMyTracks/listCourses/uploadImage/checkout), store.ts (navigate, view track/course/classroom/checkout/mentor, setBookingTopic), helpers.ts (currencyBRL, LEVEL_LABELS, avatarGradient, formatTotalDuration, formatDayLabel), tracking.ts (trackEvent), avatar.tsx (Avatar com src, Stars), course-view.tsx (linguagem hero/overview/sidebar) e CoursesManager em onboarding.tsx (padrão visual exato do gerenciador); conferidas rotas /api/tracks (GET/POST/[id]/enroll/mine) para semântica de erro 409
- Criado `src/components/platform/track-view.tsx` (export `TrackView({ trackId })`, nenhum arquivo existente editado): fetch api.getTrack(trackId, user?.id) com skeleton no formato da página, erro 404/500 em card dashed com AlertCircle "Não foi possível carregar a trilha." + "Tentar novamente" (refetch); tracking com ref-guard por trilha (StrictMode-safe) disparando apenas `trackEvent('view_item', { mentorId, value: price || undefined, contentName })` (mentor do TrackListItemDTO não expõe tracking IDs, então sem loadTrackingScripts)
  - HERO rounded-2xl p-6/p-8 com avatarGradient(title) (coverUrl → img + overlay bg-stone-950/55; senão watermark Route), Badge destaque "Trilha" (Route, branco), badges categoria/nível, h1 text-2xl/3xl extrabold, stats flex-wrap white/90 (cursos · mentorias 1:1 · aulas · duração · alunos)
  - Grid grid-cols-1 lg:grid-cols-3: esquerda (lg:col-span-2) com Card "Como a trilha funciona" (bloco de progresso geral no topo quando myEnrollment: percent do somatório courseProgress via ui/Progress h-2 + "X de Y aulas concluídas · Z%"), timeline numerada (círculos emerald-700 p/ COURSE, amber-600 p/ MENTORSHIP, conectados por border-l dashed stone-200) com CourseItemCard clicável (capa h-28 img/gradiente+Library, Badge "Curso", stats aulas/duração/badge rose "X ao vivo" Radio/chip emerald "Inclui N mentoria(s)", mini Progress "X/N aulas" quando courseProgress, CTA "Estudar" → classroom (inscrito) ou "Ver curso" → course, stopPropagation) e MentorshipItemCard (fundo emerald-50/60 border-emerald-100, Users em círculo, chip "{n} sessõe(s) de 60min", botão "Agendar mentoria" → setBookingTopic(`Mentoria da trilha: {track} — {item}`) + navigate mentor); card "Sobre o mentor" (Avatar src, headline, Stars+rating, "Ver perfil")
  - Sidebar sticky (lg:top-6): badge emerald "Você está inscrito" + data (formatDayLabel) quando inscrito; preço text-3xl ("Grátis" emerald-700 / currencyBRL); sub fixa; CTA h-11 w-full rounded-full font-bold ("Continuar aprendendo" → 1º curso com progresso incompleto via courseProgress, senão 1º curso → classroom; trilha sem cursos → mentor | "Inscrever-se gratuitamente" (exige user: toast.error 'Entre com uma conta no topo da página.'; enrollTrack → toast.success 'Inscrição na trilha realizada! 🎉' + refetch; 409 via mensagem → toast.info 'Você já tem acesso a esta trilha.' + refetch | "Comprar trilha" → trackEvent('begin_checkout') + navigate checkout trackId); ul com 4 checks (cursos completos, sessões 1:1, progresso automático, certificado); mobile grid-cols-1/stats flex-wrap/CTAs ≥44px
- Criado `src/components/platform/tracks-manager.tsx` (export `TracksManager({ userId, onChanged, onTracksChange? })`): réplica do padrão CoursesManager — Card "Minhas trilhas" (ícone Route em círculo bg-teal-50 text-teal-600 ring-teal-100), CardAction "Nova trilha", lista max-h-96 com scrollbar custom (classes exatas da spec), rows com thumb h-12 w-20 (img ou nada), badges categoria/nível/Publicado(emerald)/Rascunho(stone), meta "X cursos · Y mentorias · Gratuita|BRL · Z alunos", ações Editar (Pencil) / Publicar-Despublicar (Eye/EyeOff → updateTrack isPublished toggle) / Excluir (Trash2 → AlertDialog + deleteTrack)
  - Dialog sm:max-w-lg max-h-[85vh] overflow-y-auto: Título, Descrição (mín 30), grid 2col Categoria (CATEGORIES) + Nível (TRACK_LEVELS/LEVEL_LABELS), Preço R$ (0 = gratuita), Capa (preview h-24 + "Enviar capa" com input file hidden + Remover, api.uploadImage, máx 5MB, estado uploading); seção "Itens da trilha" — lista reordenável (↑ ↓ ChevronUp/Down + X, ordem = ordem do payload), Badge "Curso" stone / "Mentoria" teal, "N sessões" para mentoria; "Adicionar curso" via Select dos cursos do mentor (api.listCourses({mentorUserId}) carregado ao abrir o dialog, rascunhos marcados "(rascunho)", duplicado bloqueado com toast.info) e bloco inline "Adicionar bloco de mentoria" (Input título, Input number sessões 1–20 default 1, Textarea descrição, botão "+ Adicionar bloco de mentoria")
  - Validações inline text-xs text-rose-600: título ≥5, descrição ≥30, categoria, ≥1 item (submit) e título da mentoria ≥3 (no add); payload items: TrackItemInput[] (COURSE {type,courseId}; MENTORSHIP {type,title,sessionCount,description}); edição SEMPRE reenvia items (substituição server-side) — ao abrir edição os itens vêm do resumo e são enriquecidos com api.getTrack (descrições dos blocos de mentoria) guardado por itemsDirtyRef para nunca sobrescrever mexidas; createTrack → toast 'Trilha criada!' / updateTrack → 'Trilha atualizada!' + fechar + await Promise.all([onChanged(), fetchTracks()]) (fetchTracks notifica onTracksChange com a lista)
- Infra durante a task: dev server em :3000 estava servindo 500 em /api/tracks e /api/courses ("Unknown field kind"/"db.track undefined" — processo com Prisma client stale gerado antes do schema de trilhas); reiniciei o MESMO dev server (bun run dev, detached) — todas as rotas 200 de novo (home/courses/tracks/mine); nenhum arquivo de backend/contrato foi alterado
- Validação: `bun run lint` 0 erros/0 warnings; `bunx tsc --noEmit` sem erros em src/ (restam apenas os 4 erros pré-existentes em examples/ e skills/, fora do escopo); smoke test curl: GET /api/tracks, /api/tracks/mine, /api/courses e / todos 200

Stage Summary:
- `track-view.tsx` (export TrackView) pronto para montagem no shell na view {name:'track', trackId} e `tracks-manager.tsx` (export TracksManager) pronto para o onboarding do mentor ao lado de CoursesManager — dois arquivos novos, zero arquivos existentes editados
- Decisões: (1) sem loadTrackingScripts no TrackView pois o mentor do DTO de trilha não expõe tracking IDs — só trackEvent server-side/pixels da plataforma; (2) Badge "Curso" nos itens no lugar de "categoria" (TrackDetailItemDTO não carrega categoria do curso — evitei mostrar a categoria da trilha como se fosse do curso); (3) 409 do enrollTrack detectado pela mensagem de erro (api.ts não expõe status); (4) edição de trilha busca o detalhe para recuperar descrições dos blocos de mentoria que o TrackItemSummaryDTO não traz, com ref-guard itemsDirtyRef

---
Task ID: 1-7 (trilhas + classroom pro)
Agent: main (Z.ai Code)
Task: Trilhas (cursos + mentorias), aulas ao vivo e mentorias dentro dos cursos, sala de aula profissional (tela cheia), Q&A, anotações e anexos

Work Log:
- prisma/schema.prisma: models Track/TrackItem/TrackEnrollment, LessonQuestion, LessonNote; Lesson ganhou kind (RECORDED|TEXT|LIVE)/startsAt/meetingUrl/attachments (JSON); Course.mentorshipCount; Order.courseId agora opcional + trackId; db:push OK
- APIs novas: /api/lessons/[id]/questions (GET/POST), /api/questions/[id] (PATCH answer, DELETE), /api/lessons/[id]/note (GET/PUT upsert), /api/tracks (GET/POST), /api/tracks/[id] (GET+progresso/PATCH/DELETE), /api/tracks/[id]/enroll (matricula na trilha + cursos), /api/tracks/mine; /api/courses e /[id] com liveCount/mentorshipCount/kind/anexos (meetingUrl+anexos só p/ inscrito/dono); /api/checkout aceita trackId (Order+TrackEnrollment+Enrollment em cada curso+purchase event); /api/upload agora aceita documentos (PDF/ZIP/DOC/PPT/XLS/TXT/CSV/MP3/MP4 até 20MB) além de imagens
- lib: tracks-serialize.ts (serializeTrack/baseInclude/parseTrackItems compartilhados), helpers (liveStatus, LESSON_KIND_LABELS, formatDayLabel/Time), types (Track*DTO, LessonQuestionDTO, LessonNoteDTO, OrderDTO.itemTitle/itemKind), api client (questions/notes/tracks/uploadAttachment/checkout trackId), store (views 'classroom'/'track', ExploreTab 'tracks', bookingTopic prefill)
- Agents 4-a-1/4-a-2: track-view.tsx (hero, timeline curso+mentoria, progresso, checkout/enroll) e tracks-manager.tsx (CRUD completo com itens reordenáveis); integrações: aba Trilhas no Explorar (spotlight+filtros), checkout com trackId, Trilhas em destaque na landing, Minhas trilhas no dashboard, TracksManager no onboarding
- classroom.tsx (novo): sala de aula tela cheia (header apenas, footer oculto em page.tsx) — player/texto à esquerda, lista de conteúdos à direita (scroll independente), abas Material/Perguntas/Anotações, painel de live (AGENDADA/AO VIVO/Encerrada com gravação), anexos para download, Q&A com resposta do mentor inline, anotações com autosave debounced + download .txt, "Concluir e avançar"
- course-view: inscrito/dono agora redireciona para classroom; overview com badges ao vivo, card "Mentorias 1:1 inclusas" e lista atualizada; onboarding: dialog de aulas com tipo (Vídeo/Leitura/Ao vivo + datetime/link de transmissão/gravação), upload de anexos, mentorshipCount no formulário de curso
- seed: 3 trilhas (Carlos R$349/Marina R$249/Rafael R$399), lives (agendada/ao vivo passada com gravação), Q&A respondidos, anotações, anexos demo, mentorshipCount nos cursos, pedido de trilha com atribuição paid_social; worklog dos agentes em 4-a-1/4-a-2

Stage Summary:
- Verificado no browser E2E: trilha detail/enroll/checkout (pedido #CMTCNTAI, atribuição no Order, auto-enrollment nos cursos), classroom desktop+mobile (2 colunas, footer oculto, sw=cw=390), Q&A pergunta+resposta (mentor Carlos respondeu Júlia), anotações com autosave no DB, live agendada (painel) e encerrada (gravação), anexos baixáveis, aba Trilhas no Explorar, Minhas trilhas no dashboard, TracksManager no onboarding, prefill do tópico de mentoria na agenda do mentor
- Fixes durante verificação: grid-cols-[1fr,380px]→[1fr_380px] (Tailwind), plural "sessãões", useEffect condicional no course-view, setState em effect no autosave
- lint 0/0; tsc limpo em src/; dev.log saudável

---
Task ID: 1 (infra auth/temas/biblioteca)
Agent: main (Z.ai Code)
Task: Infra compartilhada para login/cadastro real, temas nos cursos e Biblioteca (artigos/livros + PDF)

Work Log:
- prisma/schema.prisma: User.passwordHash (scrypt "salt:hash"); models CourseTheme (courseId,title,description,order) e LibraryItem (mentorId, kind ARTICLE|BOOK, title, description, category, level, coverUrl, pdfUrl, content, readingMin, isPublished); Lesson ganhou themeId (SetNull) + libraryItemId (SetNull); db:push OK
- src/lib/password.ts: hashPassword/verifyPassword (scrypt 64B, timingSafeEqual)
- APIs: POST /api/auth/register (valida nome/email/senha≥6, 409 duplicado), POST /api/auth/login (401 genérico), GET /api/auth/me?userId= (valida sessão persistida, retorna isMentor via MentorProfile)
- types.ts: UserDTO.isMentor; CourseLessonDTO.themeId + reading {id,title,kind,pdfUrl,content} (pdfUrl/content só p/ inscritos); CourseDetailDTO.themes: CourseThemeDTO[]; LibraryItemDTO/LibraryItemDetailDTO (hasPdf/hasText/usageCount/author/canRead)
- api.ts: register/login/me; createLesson + themeId/libraryItemId + kind 'READING'; createTheme/updateTheme/deleteTheme (/api/courses/[id]/themes); listLibrary/getLibraryItem/createLibraryItem/updateLibraryItem/deleteLibraryItem
- store.ts: views {name:'auth',mode?} e {name:'reader',itemId}; ExploreTab = 'mentors'|'courses'|'tracks'|'library'
- page.tsx: guard central (dashboard/onboarding/checkout/meeting exigem login → AuthView), validação de sessão no bootstrap (api.me → setUser(null) se conta sumiu), views auth/reader montadas, footer oculto em 'classroom' e 'reader'
- auth-view.tsx e reader-view.tsx criados como STUBS (agentes 2-a/2-c vão substituir integralmente)
- checkout.tsx (CTA "Entrar ou criar conta" → navigate auth), track-view.tsx (sem login → toast.info + navigate auth), mentor-lp.tsx (idem), footer.tsx (link Biblioteca → Explorar aba library)

Stage Summary:
- Contratos prontos: auth register/login/me; temas CRUD + aulas com themeId/kind READING/libraryItemId; biblioteca CRUD + getLibraryItem com canRead (publicado OU inscrito em curso que usa o item OU autor)
- Padrão de acesso de leitura: pdfUrl/content só vêm no DTO quando canRead; UI deve respeitar
- Agents 2-a (auth UI), 2-b (temas/classroom), 2-c (biblioteca/reader) podem trabalhar em paralelo a partir daqui

---
Task ID: 2-a
Agent: frontend-styling-expert
Task: AuthView (login/cadastro), Navbar logado/deslogado e landing personalizada

Work Log:
- Li worklog.md (contratos da Task 1 infra), store.ts (views {name:'auth',mode?}, setUser/navigate), types.ts (UserDTO.isMentor), api.ts (register/login/me/listUsers/listMyEnrollments), page.tsx (guard + montagem de AuthView) e APIs de auth (mensagens 409/401 reais) antes de codar
- auth-view.tsx: REESCRITO por completo. Layout lg:grid-cols-2 — painel esquerdo com gradiente emerald (from-emerald-800 via-emerald-700 to-teal-700), blobs radiais white/10 aria-hidden, logo (GraduationCap em white/15 rounded-xl + wordmark), headline "Aprenda com quem vive o que ensina.", 3 bullets (Video/Users/Library em círculos white/10) e card de prova social (Stars amber + "4,9 de média · +2.400 alunos..."); no mobile vira header compacto (p-6, headline text-2xl, sem bullets). Painel direito: card branco rounded-2xl border-stone-200 shadow-sm p-6/p-8 max-w-md com Tabs controlada por initialMode ?? 'login' (useEffect sincroniza mudanças de view.mode)
- Tab Entrar: e-mail + senha com toggle Eye/EyeOff (aria-label "Mostrar/Ocultar senha"), validação inline text-xs text-rose-600 (e-mail válido, senha ≥6), botão h-11 w-full rounded-full com loading Loader2 "Entrando…", bloqueio de duplo submit, erro da API → toast.error + inline, "Esqueceu a senha?" → toast.info; sucesso → setUser + toast "Bem-vindo(a) de volta, {firstName}! 👋" + navigate home
- Tab Criar conta: nome/e-mail/senha + helper "Mínimo de 6 caracteres", loading "Criando conta…", 409 → inline "Já existe conta com este e-mail. Faça login."; sucesso → toast "Conta criada! Bem-vindo(a), {firstName}! 🎉" + home. Troca de tab limpa erros inline
- Seção "Contas de demonstração" após divisor "ou continue com": nota "Ideal para conhecer a plataforma · senha: demo123", chips (h-11, flex-wrap, max-h-40 overflow-y-auto scrollbar fino) de api.listUsers() com Avatar; clique → api.login(demo123) → setUser + toast "Entrou como {nome}" + home; falha → toast.info('Esta conta demo ainda está sendo preparada. Crie a sua!')
- navbar.tsx: REESCRITO. Removido 100% do sistema demo (dropdown "Entrar como", dialog "Criar nova conta", pickUser/createUser/api.listUsers/api.me). Mantidos logo, busca → marketplace, nav desktop com pill layoutId "navbar-nav-pill" e responsividade atuais. Deslogado: ghost "Entrar" (h-9 rounded-full) → auth/login + primário "Criar conta" (size sm rounded-full, UserRoundPlus) → auth/register; <sm mostra só o primário "Entrar" com LogIn. Logado: dropdown do avatar com header (Avatar md + nome + email + Badge "Mentor" secondary text-[10px] se isMentor), itens Minhas sessões/Explorar, condicional isMentor → "Painel do mentor" (LayoutDashboard) : "Criar perfil de mentor" (PlusCircle), ambos → onboarding; Sair (rose) → setUser(null) + toast.info('Você saiu da sua conta. Até logo!') + home
- landing-mentee.tsx: edições mínimas — (1) headline do hero personalizado quando logado: "Olá, {firstName(user.name)}! Pronto para continuar aprendendo?" (import firstName de @/lib/helpers); (2) faixa "Continuar de onde parou" logo abaixo do hero, só logada e só com inscrições: api.listMyEnrollments(user.id) em try/catch→[], skeleton durante carga, grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 com até 3 Cards rounded-2xl p-4 flex gap-3 (thumb h-20 w-28 rounded-xl capa ou gradiente avatarGradient(title)), título line-clamp-2, Progress (completedLessonIds/lessonCount) text-xs e botão "Continuar" h-9 rounded-full → navigate classroom. Nada mais foi alterado na landing
- Validações: `bun run lint` → 0 erros/0 warnings (corrigi um react-hooks/set-state-in-effect removendo setState síncrono no efeito de inscrições); `bunx tsc --noEmit` → sem erros em src/ (só pré-existentes em examples/ e skills/); curl POST /api/auth/register → reportado abaixo; dev.log sem erros de compilação (página / responde 200)

Stage Summary:
- Auth real (login/cadastro/demo) 100% plugada no store: setUser + navigate home, sem localStorage manual; erros da API propagam como toast + mensagem inline
- Navbar com estados deslogado/logado limpos; validação de sessão continua centralizada no page.tsx (navbar não chama api.me/listUsers)
- Landing personalizada para logado sem tocar nas seções públicas
- RESSALVA (ambiente, não código): curl no register/login retornou 500 "Unknown field passwordHash" / library 500 — o schema.prisma e o client gerado em node_modules/.prisma JÁ contêm passwordHash/LibraryItem, mas o dev server em execução (iniciado antes do generate/db:push) segura um client Prisma defasado em memória. Resolve com restart do dev server + db:push/seed (fora do meu escopo: proibido reiniciar/rodar db:push). A UI trata esses 500 graciosamente (toast + inline)
- Pendência esperada: contas demo só logam com demo123 depois que o seed (com passwordHash) rodar; até lá os chips mostram o toast.info de "conta em preparo"

---
Task ID: 2-b-frontend
Agent: frontend-styling-expert
Task: Classroom com temas/leitura/certificado, course-view por temas e onboarding (temas + READING + LibraryManager)

Work Log:
- Lidos worklog.md (Task 1 infra temas/biblioteca + padrões 4-a-1/1-7), types.ts (CourseThemeDTO, lesson.themeId, lesson.reading, CourseDetailDTO.themes, LESSON_KIND_LABELS), api.ts (createTheme/updateTheme/deleteTheme, createLesson com themeId/libraryItemId/kind READING, updateLesson PATCH, listLibrary) e os 3 arquivos alvo + library-manager.tsx (props { userId, onChanged? })
- classroom.tsx:
  - Sidebar agrupada por temas: themeList (themes por order) + lessonGroups (Map por themeId; aulas sem tema/tema inexistente → grupo virtual "Outros conteúdos" no fim, só quando existir) + orderedLessons (lista achatada themes→lessons) como fonte única do índice global ("Aula X de Y"), prev/next, auto-avançar e percent
  - Seções colapsáveis (estado local collapsedThemes, default todas expandidas): header clicável min-h-11 com ChevronRight/Down, nº da seção em círculo emerald (Folder para "Outros conteúdos"), título, "x aulas" e mini Progress emerald + "x/y"; selectLesson expande o tema da aula selecionada; aula atual mantém o mesmo destaque de antes; cursos sem nenhum tema continuam com lista plana (legado)
  - Ícones por tipo nas listas: RECORDED PlayCircle, TEXT FileText, LIVE Radio, READING BookOpen (meta e ícone à direita da linha; badge do player "Artigo"/"Livro" amber para READING)
  - Leitor READING (componente ReadingMaterial): chip BookOpen "Artigo"/"Livro" + botão "Abrir em tela cheia" → navigate({name:'reader',itemId}); reading.pdfUrl → iframe h-full w-full rounded-xl border bg-white em container aspect-video min-h-[420px]; reading.content → área rolável max-h-[70vh] min-h-[420px] com article max-w-3xl (título text-2xl font-extrabold, parágrafos por \n\n, leading-relaxed text-stone-700); sem pdfUrl/content → Lock "Inscreva-se para acessar este material"; aba Material ganhou nota contextual para READING
  - Certificado: courseCompleted (100% das aulas) → bloco de celebração no player (CheckCircle2 emerald grande, "Parabéns! Você concluiu este curso 🎉", botão "Emitir certificado") + Dialog decorativo (.certificate-print ring-4 ring-emerald-100 border-emerald-200 rounded-3xl p-8 text-center, GraduationCap em círculo emerald, "CERTIFICADO DE CONCLUSÃO" tracking-widest text-xs, nome font-serif text-3xl, "concluiu com dedicação o curso", título do curso, mentor + formatTotalDuration(totalDurationMin) + data pt-BR, selo circular Award) + botão "Imprimir certificado" (Printer → window.print()) e <style>@media print</style> no topo do return para imprimir só o certificado
- course-view.tsx: currículo agrupado por temas quando course.themes existe (header com círculo emerald numerado ou Folder, título bold, "x aulas · duração" via formatTotalDuration; aulas com ícone por tipo, chip rose "Ao vivo" (Radio) para LIVE e chip amber "Artigo"/"Livro" (BookOpen) para READING; aulas sem tema → "Outros conteúdos" no fim; visitante segue com Lock); cursos sem temas mantêm a lista numerada legado (com BookOpen para READING); textos/toasts de visitante trocados: toast.info('Entre com uma conta para se inscrever.') + navigate({name:'auth',mode:'login'}) e texto da sidebar com link "Entrar" (mesma navegação); hero/stats/mentor/CTAs intocados
- onboarding.tsx (SÓ CoursesManager/dialog de aulas + montagem): import { LibraryManager } de './library-manager' e renderização <LibraryManager userId={user.id} onChanged={reload}/> logo após <CoursesManager/> (antes de TracksManager); dialog de aulas: carrega themes via api.getCourse ao abrir (fetchLessons agora também seta themes por order), Select "Tema" ("Sem tema" + temas) com botão "+ Novo tema" (outline h-9) abrindo mini-form inline (Input + Enter/botão criar) → api.createTheme → toast 'Tema criado!' + refresh dos temas + autoseleção; lista de aulas com chip discreto do tema (ou "Sem tema") + botão FolderInput (aria-label "Mover para tema") abrindo Popover com "Sem tema" + temas → updateLesson(courseId, lesson.id, {userId, themeId}) → toast 'Aula movida!' + fetchLessons; tipo READING "Artigo/Livro (Biblioteca)" no seletor de kind (grid 2 col / sm 4 col): Select "Conteúdo da Biblioteca" com api.listLibrary({authorUserId: user.id}) buscado ao abrir (vazio → aviso amber com Library "Você ainda não publicou artigos ou livros. Crie na seção Minha Biblioteca."), pré-preenche duração com readingMin (editável) e título se vazio, envia libraryItemId + kind READING (sem videoUrl/content/anexos) e validação própria "Selecione o artigo ou livro da Biblioteca."
- Validação: bun run lint → 0 erros/0 warnings; bunx tsc --noEmit → limpo em src/ (restam só os erros pré-existentes em examples/ e skills/); dev server recompilou os 3 arquivos sem erro ("✓ Compiled") e GET / 200; rotas de API não foram tocadas

Stage Summary:
- Classroom com sidebar por temas (colapsável, com progresso por tema), leitor embutido para aulas READING (PDF em iframe ou texto tipográfico) e certificado de conclusão imprimível; course-view com currículo por temas e chips por tipo; onboarding cria temas, move aulas entre temas e cria aulas READING a partir da Biblioteca, com o LibraryManager montado no painel do mentor
- Decisões: (1) cursos sem nenhum tema mantêm a lista plana legado (sem header "Outros conteúdos" órfão); (2) numeração das linhas usa lesson.order (índice global estável) e a navegação prev/next/auto-avançar usa a lista achatada themes→lessons; (3) visitante em course-view é levado direto ao login (toast.info + navigate auth), e o texto da sidebar virou link "Entrar"; (4) aulas READING não enviam videoUrl/content/attachments (o material é o item da Biblioteca); (5) kind continua aberto após adicionar aula para facilitar cadastro em lote
- RESSALVA (ambiente, pré-existente, fora do escopo): o processo do dev server em :3000 está com Prisma client obsoleto em memória — GET /api/courses/[id], POST /api/courses/[id]/themes e GET /api/library retornam 500 ("Unknown field libraryItem" / "Cannot read properties of undefined (reading 'findMany')") embora o client em disco e o schema estejam corretos; é o mesmo caso já documentado na Task 4-a-1 e exige RESTART do dev server (proibido nesta task) para o E2E de temas/reading com dados reais

---
Task ID: 3 (integração final + seed + verificação E2E)
Agent: main (Z.ai Code)
Task: Corrigir APIs da Biblioteca, seed completo (senhas/temas/biblioteca/PDFs), restart do dev server e verificação E2E no browser

Work Log:
- Recuperação dos agentes 2-a/2-b/2-c que caíram por infra: trabalho deles estava em disco (2-c quase completo com erros de TS; 2-b backend pronto; 2-a nada) — auditei tudo antes de relançar
- Fix /api/library e /api/library/[id]: mentor select usava name/avatarUrl (campos do User) → mentor.user.name/avatarUrl; tsc 100% limpo
- Fix page.tsx: eslint-disable unused removido
- Relancei agentes: 2-a (AuthView login/cadastro completa + Navbar logado/deslogado com menu condicional isMentor + landing com hero personalizado e faixa "Continuar de onde parou") e 2-b-frontend (classroom com temas colapsáveis/leitura inline/certificado imprimível, course-view com currículo por temas e CTAs → auth, onboarding com temas/+Novo tema/mover aula/kind READING com seletor da Biblioteca + LibraryManager montado) — ambos lint 0/0 e tsc limpo
- prisma/gen-seed-pdfs.ts: gerador de PDF 1.4 raw (capa + páginas, Helvetica, xref correto) → livro-arquitetura.pdf (7 págs, Carlos) e apostila-dados.pdf (6 págs, Beatriz) em public/uploads/seed/
- prisma/seed.ts: passwordHash demo123 p/ todos os usuários (updateMany), addThemes() com 2-4 temas por curso (inclui "Leituras complementares"), 6 LibraryItems (2 livros PDF + 4 artigos texto de Carlos/Marina/Beatriz/Sofia/Rafael), appendReading() criando aulas READING vinculadas à Biblioteca DENTRO do tema "Leituras complementares" (Arquitetura x2, PM x1, Inglês x1); seed re-run OK
- Restart do dev server (client Prisma defasado em memória causava 500) → todas as APIs 200
- Fix classroom: material de texto com "## " renderizava cru → agora vira h3 emerald
- E2E browser verificado (desktop 1440x900 + mobile 390x844): login demo chips + login manual (lucas@demo.com/demo123) ✓; registro novo usuário (Mariana) com toast/sessão/avatar gradiente ✓; navbar deslogado (Entrar + Criar conta) vs logado (menu com Badge Mentor para Carlos, "Criar perfil de mentor" p/ Lucas) ✓; landing personalizada "Olá, {nome}!" + Continuar de onde parou ✓; guard central (dashboard deslogado → AuthView) ✓; course-view currículo por temas com badges Livro/Artigo/ao vivo ✓; classroom sidebar com temas colapsáveis + progresso por tema (2/2, 3/3), leitura PDF inline com "Abrir em tela cheia", Q&A/anotações mantidos ✓; fluxo completo 9/9 aulas → celebração + certificado (Lucas Prado, 3h 46min, imprimir) ✓; aba Biblioteca no Explorar (spotlight MAIS LIDO, stats 6/4/2, filtros formato/área, busca, sort) ✓; reader PDF (viewer nativo 7 págs + Baixar PDF) e reader artigo (tipografia editorial + autor + progresso) ✓; LibraryManager no onboarding com lista/Novo item dialog completo ✓; dialog de aulas com chips de tema, +Novo tema e tipo Artigo/Livro ✓; mobile sem overflow horizontal (sw=cw=390) em auth/biblioteca/reader ✓; console sem erros, dev.log saudável ✓

Stage Summary:
- Sistema completo de autenticação real (registro/login/sessão validada, senha scrypt) substituindo o modo demo por seletor de usuário
- Cursos com temas (módulos) em toda a experiência: gerenciador, página do curso, classroom e certificado de conclusão
- Biblioteca pública de artigos/livros com leitor fullscreen (PDF nativo + tipografia editorial), aulas de leitura dentro dos cursos (com tema na sequência) e gerenciador do mentor
- UX/UI condicional por login em toda a plataforma + guard central para views pessoais
- lint 0/0; tsc limpo em src/; todas as rotas 200; verificado desktop e mobile

---
Task ID: 1-e
Agent: frontend-styling-expert
Task: Imersão total nas telas de aprendizado — classroom e reader viram experiência tela cheia premium (top bar dark emerald-950, modo foco/teatro, ContentsNav compartilhado + dialog mobile, transição animada entre aulas, palco de vídeo cinema, barra de progresso de leitura na top bar)

Work Log:
- Lido worklog.md (Task 3 E2E + 1-7/2-b que criaram a sala de aula) e os dois arquivos alvo na íntegra; conferido ui/progress.tsx (data-slot="progress-indicator"), ui/dialog.tsx (DialogContent grid p-6 + close absoluto top-4 right-4), ui/button.tsx (variant ghost) e uso existente de framer-motion (marketplace/navbar) antes de codar; page.tsx/store/navbar/API NÃO tocados
- classroom.tsx:
  - Top bar imersiva dark: bg-emerald-950 text-white border-b border-emerald-400/15 — botão Sair (ArrowLeft, ghost branco hover:bg-white/10, aria-label "Sair da sala de aula", mantém volta ao curso), título truncado + sub "X aulas · duração" em emerald-100/70, avatar+nome do mentor (hidden sm, emerald-100/70), Progress com trilha bg-white/20 + indicador emerald-400 + percent emerald-100; skeleton de loading também escurecido para entrada consistente
  - Modo foco (teatro): estado focusMode (default false) persistido em sessionStorage 'mentorhub-classroom-focus' (initializer SSR-safe com try/catch + effect de persistência); ATIVO → (a) sidebar não renderizada e grid vira lg:grid-cols-1; (b) abas Material/Perguntas/Anotações ocultas ({!focusMode && <Tabs/>}); (c) coluna da aula centralizada max-w-3xl; (d) bloco de celebração/certificado permanece visível; (e) botão flutuante fixed bottom-6 right-6 z-50 (Minimize2 + "Sair do modo foco", emerald-950 ring-emerald-400/25); (f) navegação Anterior/Concluir/Próxima continua visível; botão no top bar alterna (Maximize2 off / Minimize2 on) com aria-label dinâmico "Ativar modo foco"/"Sair do modo foco"
  - Sidebar mobile: nav de conteúdos EXTRAÍDA no componente local ContentsNav({ groups, themeList, collapsedThemes, onToggleTheme, currentLessonId, completedIds, onSelectLesson, className }) — reutilizado no aside (onSelectLesson=selectLesson) e num Dialog (sm:max-w-md, max-h-[85vh] flex-col p-0, header com "X de Y aulas concluídas", lista flex-1 rolável; selecionar aula fecha o dialog); grupos colapsáveis/ícones por tipo/progresso por seção preservados 1:1 (toggle agora via handleToggleTheme); botão PanelRight (lg:hidden, aria-label "Ver conteúdos do curso") abre o dialog
  - Transição de aula: bloco da aula atual (player + badges + título + descrição + anexos + abas + navegação) envolvido em <AnimatePresence mode="wait"> + <motion.div key={currentLesson.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.22}}>; estado vazio (sem aulas) fora da animação; CSS @media print do certificado segue na raiz do return e o Dialog do certificado (portal no body) está FORA do motion.div — print e refs internos intactos
  - Palco do vídeo: aulas RECORDED com videoUrl têm o LessonPlayer envolvido externamente em overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-stone-900/10 (componente interno intocado)
  - Mantidos 100%: temas colapsáveis, Q&A com resposta do mentor, anotações com autosave + download, anexos, certificado imprimível, auto-avançar, LivePanel (agendada/ao vivo/encerrada), ReadingMaterial (PDF/texto), estados de erro/sem acesso
- reader-view.tsx:
  - Root flex h-full flex-col bg-stone-50 confirmada (preenche o overlay fixed inset-0 do page.tsx)
  - Top bar imersiva dark emerald-950 (mesma linguagem da classroom, border-emerald-400/15): voltar ghost branco (goBackToLibrary mantido, aria-label "Voltar"), tipo Artigo/Livro em badge dark (novo badgeDark em KIND_META — emerald-100/white-10 e amber-100/amber-300-10; badges claros seguem nos cards "Continue lendo"), título truncado centralizado (flex-1 justify-center), autor em emerald-100/70 (md+), tempo de leitura emerald-100/70, "Baixar PDF" dark (border-white/20 bg-transparent shadow-none)
  - Barra de progresso de leitura (barRef) movida para linha fina h-0.5 colada no fundo da top bar: trilho bg-white/10 + indicador bg-emerald-400; antigo bloco sticky dentro do scroll container removido — lógica rAF/handleScroll/reset intacta, condicionada a canRead && !pdfUrl && content
  - Mantidos: tipografia editorial max-w-3xl, iframe do PDF (h-[calc(100dvh-8rem)]), card do autor, cursos vinculados, "Continue lendo", estados de erro/404/bloqueio
- Validação: bun run lint → 0 erros/0 warnings; bunx tsc --noEmit → limpo em src/ (restam só os 4 erros pré-existentes em examples/ e skills/, fora do escopo); GET / → 200 e dev.log com "✓ Compiled" após os edits (classroom/reader são imports estáticos de page.tsx); dev server NÃO reiniciado e build NÃO rodado

Stage Summary:
- Sala de aula e leitor agora compartilham a linguagem imersiva dark (emerald-950) em tela cheia: top bar premium com progresso emerald-400, modo foco persistente por sessão com saída flutuante, conteúdos do curso acessíveis no mobile via Dialog com o mesmo ContentsNav da sidebar, transição suave (fade+slide) ao trocar de aula e palco de vídeo com moldura de cinema; reader ganhou top bar dark com linha de progresso de leitura emerald-400 colada nela
- Decisões: (1) ContentsNav recebe props primitivas (groups/ids/callbacks) em vez de closures do pai, viabilizando o reuso entre aside e Dialog — o Dialog passa onSelectLesson que também fecha o modal; (2) no modo foco a sidebar é removida da árvore (não apenas escondida) para o grid 1 coluna não deixar espaço morto; (3) progresso do reader renderizado dentro do header (fora do scroll container) — sempre visível, sem depender de sticky; (4) animação usa framer-motion, dependência já presente no projeto — zero novas deps; (5) "Sair da sala de aula" continua levando à visão geral do curso (mesma navegação de antes, só mudou o rótulo/estilo)

---
Task ID: 1-d
Agent: frontend-styling-expert
Task: REDESIGN do Explorar (marketplace) — nova aba inicial "Tudo" (visão geral editorial premium) em marketplace.tsx

Work Log:
- Li worklog.md (fim) + store.ts (ExploreTab já com 'all', default 'all', setExploreQuery incrementa exploreSeq) e types.ts (campos dos DTOs: MentorListItemDTO sem createdAt, LibraryItemDTO.author/createdAt etc.) antes de codar; toque APENAS em src/components/platform/marketplace.tsx
- Controle segmentado: "Tudo" adicionado como PRIMEIRA opção (LayoutGrid, lucide-react), ativo quando tab==='all'; tablist aria-label atualizado para "Seções do Explorar"; as 4 abas existentes (mentors/courses/tracks/library) ficaram intocadas
- Efeito de mount que resetava a store: useApp.setState({ exploreTab: 'mentors' }) → 'all'
- Atalho de teclado "/" REMOVIDO (useEffect do keydown + <kbd>/</kbd> do input); mantive searchRef (Input + clearSearch) e o botão X de limpar busca — a busca global agora vive no header (outro agent)
- Cabeçalho da aba 'all': h1 "Explorar tudo" + subtítulo aria-live com total somado ("N conteúdos — X mentores, Y cursos, Z trilhas e W leituras"); Select de ordenação visível e FUNCIONAL na aba 'all' via novo estado local allSort (Relevância/Populares — Relevância = ordenações editoriais da spec; Populares = sessions/studentCount/usageCount); input de busca com placeholder/aria-label próprios ("Busque em mentores, cursos, trilhas e leituras..."); pílulas de categoria da barra superior ocultas na aba 'all' (o filtro de área agora vive na seção "Explore por área")
- NOVA SEÇÃO tab==='all' (substitui bento+resultados; os demais grupos agora renderizam só quando tab!=='all'):
  a) Hero bento: h2 "Tudo em um só lugar" + sub exata da spec; linha de 4 StatTiles com stats globais combinadas das 4 bases (total de conteúdos em tile DARK emerald-950, alunos de cursos+trilhas, nota média, sessões 1:1); abaixo, SpotlightCard (mentor rotativo) + CourseSpotlightCard lado a lado em grid lg:grid-cols-2 (dois blocos emerald-950)
  b) 4 prateleiras horizontais na ordem pedida — "Mentores em destaque" (rating desc), "Cursos em alta" (studentCount desc), "Trilhas guiadas" (studentCount desc), "Artigos & livros" (createdAt desc) — cada uma com 8 itens, header (título font-extrabold + contagem + link "Ver tudo" com ArrowRight → setTab correspondente) e container EXATO da spec (-mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] snap-x snap-mandatory, role="region" aria-label); cards envoltos em w-64 shrink-0 snap-start sm:w-72; Skeleton h-72 w-64/w-72 rounded-2xl enquanto a base não carrega; "Ver toda a Biblioteca" também replica category→libCategory para o filtro atravessar
  c) "Explore por área": pílulas com contagem UNIFICADA (mentores por categories.includes + cursos/trilhas/biblioteca por category===), ordenadas por contagem desc, clicando aplica setCategory(cat) e PERMANECE na aba 'all' (prateleiras filtram); chip ativo "Área: {cat}" com X para limpar + botão "Ver mentores de {cat}" → setTab('mentors') com a categoria aplicada
  d) "Conheça os mentores": tira de 8 autor-cards (AuthorMiniCard novo) top por reviewCount desc — Avatar xl + nome + headline line-clamp-1 + Stars + "Ver perfil →", h-auto w-56, hover:-translate-y-0.5, clique → navigate mentor
  e) Busca consciente: memo allView filtra as 4 prateleiras + autores client-side (name/title/headline/description/categories/author.name, case-insensitive) quando search OU category preenchidos; nunca filtra com ambos vazios; headers mostram "N resultados" (contagem REAL antes do slice de 8); prateleira sem resultado é oculta; se NENHUMA tem resultado → empty state SearchX "Nenhum conteúdo encontrado" com "Limpar filtros"
- Novos helpers/componentes no mesmo arquivo: allView/unifiedAreas (useMemo), shelfCountText, clearAllFilters, ShelfSection (header + trilho scroll), AuthorMiniCard; StatTile ganhou prop opcional dark (usada só no hero; abas existentes inalteradas); h-full adicionado aos roots de MentorCard/CourseCard/TrackCard/LibraryCard para esticar nos wrappers (nos grids continua igual, só alinha alturas)
- Animações com parcimônia: motion no hero (fade/slide 0.4s) e em cada prateleira/seção com stagger leve (delays 0.05–0.32), hover translate apenas nos autor-cards
- Validação: `bun run lint` 0 erros/0 warnings; `bunx tsc --noEmit` limpo em src/ (só os 4 erros pré-existentes em examples/ e skills/); GET / 200 e dev.log saudável; dev server NÃO reiniciado, build/seed NÃO rodados

Stage Summary:
- Aba "Tudo" editorial completa no Explorar: hero bento (stats combinadas + mentor rotativo + curso em destaque), 4 prateleiras horizontais com snap/scroll e "Ver tudo", "Explore por área" com filtro unificado que mantém o usuário na aba (com chip ativo + atalho para mentores) e tira "Conheça os mentores" para induzir visita ao perfil do autor; busca e categoria filtram tudo client-side com empty state gracioso
- Decisões: (1) Select da aba 'all' funcional via allSort (Relevância = ordenações da spec por padrão; Populares reordena por engajamento) em vez de controle morto; (2) contagem "N resultados" usa o total de matches (pré-slice de 8) para não mentir; (3) prateleiras sem resultado são ocultas durante filtragem (evita headers vazios) e o estado global vazio só aparece quando TODAS ficam vazias; (4) MentorListItemDTO não tem createdAt — ordenação "Novidades" não foi oferecida na aba 'all'; (5) h-full nos 4 cards compartilhados não altera conteúdo das abas existentes, apenas garante alturas iguais nos wrappers de prateleira; (6) sem mudanças em store.ts/page.tsx/navbar/footer/API

---
Task ID: 4 (super aprimoração de UI: header/footer/explorar/imersão)
Agent: main (Z.ai Code) + 2 frontend-styling-expert (1-d, 1-e)
Task: Footer no fim da página, header com busca funcional (sem "Para mentores"), Explorar com aba "Tudo" editorial e aprendizado em tela cheia imersiva

Work Log:
- store.ts: ExploreTab ganhou 'all' (default); setExploreQuery agora incrementa exploreSeq (re-consumo do termo no Explorar); views classroom ganhou lessonId? e reader ganhou returnTo? {courseId, lessonId} (retorno contextual tipado)
- page.tsx: shell saiu de h-dvh/overflow-hidden (app shell) para min-h-dvh flex-col com rolagem normal do documento; header sticky; footer com mt-auto no fim da página (gruda no fundo quando curto); classroom/reader agora renderizam em overlay fixed inset-0 z-50 (imERSÃO total, sem header/footer da plataforma); scroll-to-top via window.scrollTo
- navbar.tsx (reescrito): busca global funcional no header (desktop inline com w crescente + atalho "/" global; mobile expansível com AnimatePresence) que envia para o Explorar aba 'all' com o termo; "Para mentores" REMOVIDO do header (fica no footer e no menu do usuário); esconde botão nativo de cancel do input search
- footer.tsx (reescrito): footer completo no fim da página — marca + tagline, colunas Plataforma (Explorar tudo/Mentores/Cursos/Trilhas/Biblioteca com setExploreTab) e Sua Conta (Minhas sessões/Para mentores/Painel do mentor ou Entrar), barra de copyright; mobile perde a tab bar fixa em favor do footer empilhado
- marketplace.tsx [agent 1-d]: nova aba "Tudo" (default) — hero bento com stats globais combinadas + SpotlightCard/CourseSpotlightCard; 4 prateleiras horizontais (snap-x, cards w-64/72) Mentores/Cursos/Trilhas/Artigos & livros com "Ver tudo"; "Explore por área" com contagens unificadas que filtram as prateleiras in-place (chip "Área: X" + "Ver mentores de X"); tira "Conheça os mentores" (AuthorMiniCard → perfil); busca consciente (filtra prateleiras client-side, esconde prateleiras vazias, empty state global); atalho "/" removido (agora é do header)
- classroom.tsx [agent 1-e + fixes]: top bar imersiva emerald-950 (Sair, título, mentor, progresso); modo foco teatro (sessionStorage) com botão flutuante de saída, sidebar oculta, grade 1 col; ContentsNav extraído e reutilizado no Dialog mobile (botão PanelRight); AnimatePresence na troca de aula; palco de vídeo em bg-black rounded ring/shadow; FIX: abas só são ocultas no modo foco para aulas com vídeo (aulas de texto/leitura mantêm o material, que É o conteúdo); ReadingMaterial recebe courseId
- reader-view.tsx [agent 1-e + fixes]: top bar imersiva emerald-950 com badge Artigo/Livro, título centralizado, autor, Baixar PDF e barra de progresso de leitura h-0.5 colada no fundo; goBack contextual via view.returnTo → devolve à AULA EXATA da sala (ou Biblioteca quando veio de fora); "Continue lendo" preserva returnTo
- course-view.tsx: REMOVIDO o auto-redirect de inscritos para a classroom (criava loop inescapável com o botão Sair); novo modo inscrito/owner — hero emerald-950 com progresso (x de y aulas, %) + "Continuar curso"/"Começar agora" + OverviewContent com hero de capa oculto e sidebar "Você já está inscrito" com CTA Continuar; doEnroll: nova inscrição entra direto na sala, already-enrolled permanece na página; OverviewContent ganhou props enrolled?/onContinue?

Validation (browser E2E, viewport 1440x900 e 390x844):
- Header: busca "inglês" → Explorar aba Tudo com termo aplicado nas prateleiras (1 resultado por seção) ✓; atalho "/" ✓; mobile expansível ✓; sem "Para mentores" ✓
- Explorar Tudo: hero bento (+21 conteúdos, tile dark), prateleiras com contagem e "Ver tudo", filtro "Área: Tecnologia" filtra in-place com chip e botão "Ver mentores de Tecnologia", tira de autores ✓; abas Mentores/Cursos/Trilhas/Biblioteca intactas ✓
- Classroom: overlay 100% tela cheia sem header/footer da plataforma; modo foco vídeo = teatro (sem tabs/sidebar, validado via DOM) e texto mantém material ✓; Dialog de conteúdos no mobile ✓; transição de aula animada ✓
- Reader: fullscreen dark com progresso; retorno contextual — voltar do leitor cai na AULA 7 exata de onde saiu ✓
- Loop de exit corrigido: Sair da sala → página do curso com hero de progresso (29%, 2 de 7 aulas) em vez de voltar automaticamente ✓
- Guest: guard do dashboard → AuthView ✓; landing sem personalização ✓; curso mostra CTA de inscrição ✓; logout ✓
- Mobile: sem overflow horizontal (sw=cw=390) em home/explorar/busca/footer ✓; footer empilhado no fim da página (atEnd true) ✓
- bun run lint 0/0; bunx tsc --noEmit limpo em src/; sessão fresh do browser com 0 erros (erros anteriores eram artifacts de HMR durante edição — chunk servido verificado correto); dev.log saudável, todas as rotas 200

Stage Summary:
- Plataforma com navegação de documento real (footer no fim, header sticky com busca global), Explorar editorial em 5 abas com "Tudo" como vitrine, e aprendizado 100% imersivo (sala de aula e leitor em overlay tela cheia com top bar dark, modo foco e retorno contextual à aula)
- Decisões: (1) auto-redirect de inscritos removido em favor de hero de progresso — evita loop com o Sair e dá uma página de curso digna para alunos; (2) busca do header é a fonte única do atalho "/"; (3) retorno do leitor é tipado no AppView (returnTo) em vez de sessionStorage; (4) modo foco preserva o material em aulas textuais
