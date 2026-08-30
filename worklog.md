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

---
Task ID: 5 (capa do criador maior + tipografia personalizável + fix sala de aula)
Agent: main (Z.ai Code)
Task: Capa do criador mais alta, seletor de fontes (nome/títulos + descrições) com catálogo leve de 24 fontes Google, e correção do erro "Não foi possível abrir a sala de aula"

Work Log:
- Erro da sala de aula: dev server estava DOWN no início da sessão (curl 000) — o erro "Ocorreu um erro inesperado" vinha de fetch interrompido quando o servidor caiu/reiniciou no meio da requisição. Server reiniciado + classroom.tsx ganhou AUTO-RETRY: falhas transitórias (regex inesperado/fetch/network/load failed/conex) retentam até 2x com 1,2s de delay (retriesRef + timer limpo no unmount); erro real continua com botão "Tentar novamente"
- prisma/schema.prisma: MentorProfile ganhou fontHeading String? + fontBody String? (IDs do catálogo; null = padrão) → db:push OK
- src/lib/fonts.ts (NOVO): catálogo de 24 fontes Google via next/font/google — 9 Sans (Inter, Poppins, Montserrat, Nunito, Work Sans, Outfit, Sora, Manrope, Plus Jakarta Sans), 7 Serif (Playfair, DM Serif, Lora, Merriweather, Crimson Pro, Libre Baskerville, Fraunces), 3 Display (Space Grotesk, Archivo, Bebas Neue), 3 Manuscritas (Caveat, Dancing Script, Patrick Hand), 2 Mono (JetBrains, IBM Plex). Cada loader é const de módulo (exigência do transform do Next); exports: MENTOR_FONTS, MENTOR_FONT_IDS, MENTOR_FONT_CATEGORIES, getMentorFont, headingFontStyle, bodyFontStyle, fontPreviewStyle
- LIÇÕES next/font descobertas no debug: (1) loader next/font/google DEVE ser chamado e atribuído a const no escopo do módulo ("Font loaders must be called..."); (2) font.variable NÃO é nome de CSS var — é o className do módulo CSS gerado (a var real é auto-nomeada, ex.: --l-nunito); usar var(--mh-...) gerava valor inválido que o CSSOM descartava silenciosamente (style attr ficava vazio). SOLUÇÃO FINAL: aplicar font.style diretamente (fontFamily real com fallback size-adjusted) — zero dependência de nomes de variáveis; @font-face entra no CSS da página e o navegador só baixa woff2 das fontes de fato usadas (leve)
- APIs: POST /api/mentors aceita fontHeading/fontBody com validação contra MENTOR_FONT_IDS (undefined = manter, null/inválido = padrão); GET /api/mentors/me, /api/mentors/[id] e /api/mentors/by-slug/[slug] retornam os campos; api.ts saveMentorProfile + types (MentorDetailDTO, MentorLpDTO.mentor) atualizados
- mentor-lp.tsx: CAPA MAIS ALTA h-56/64 → h-72 sm:h-80 md:h-96 (fallback gradiente h-64/72/80); headingFontStyle no h1 do nome, títulos de seção (Cursos/Sobre/Conteúdos/Depoimentos/CTA), números da barra de prova social e títulos dos cards de curso; bodyFontStyle no headline, subtítulos, descrição (Sobre), descrição dos cards, depoimentos e CTAs — a página inteira ganha a identidade do criador
- onboarding.tsx: novo FontPicker montado no MentorProfileForm após as fotos (com Separators) — prévia ao vivo (capa gradiente + nome + headline + descrição renderizados com as fontes escolhidas + legenda "Títulos: X · Textos: Y"), radiogroup "Nome e títulos / Descrições e textos" (define o slot da seleção), chips de categoria (Todas/Sans/Serif/Display/Manuscrita/Mono), grid responsivo 2/3/4 colunas com 25 cards (24 fontes renderizadas EM SI PRÓPRIAS via fontPreviewStyle + card "Padrão da plataforma"), badges mostrando em qual slot cada fonte está em uso, Check no card ativo; ProfileFormValues ganhou fontHeading/fontBody (sempre enviados; null volta ao padrão); initial do painel alimenta as fontes do perfil; prévia da capa no form subiu h-32 → h-44 sm:h-52 com texto melhor
- prisma/set-demo-fonts.ts (one-off): Carlos Ferreira = playfair/lora (editorial), Marina Costa = sora/inter (moderno) — executado, demo visível de cara
- FIX crítico de ambiente: turbopack servia módulos STALE (mentor-lp antigo e by-slug sem fontes) mesmo após restart — rm -rf .next + restart resolveu; dev.log saudável

Validation (browser E2E, 1440x900 + 390x844):
- LP Carlos: capa 384px (era 256), nome "Carlos Ferreira" em Playfair Display, descrições em Lora, document.fonts.check true p/ ambas; LP Marina: Sora + Inter ✓
- FontPicker: 25 cards renderizados em suas próprias fontes; trocar slot p/ "Descrições" + clicar Space Grotesk → prévia atualizou na hora (headline/descrição em Space Grotesk, nome seguiu Playfair); Salvar → toast e persistência confirmada via /api/mentors/me (playfair/space-grotesk); LP pública refletiu imediatamente; restaurado playfair/lora pelo próprio picker NO MOBILE (390px) — slot + card + salvar funcionam no toque
- Classroom: abriu SEM o erro ("Não foi possível abrir a sala" ausente no DOM), top bar emerald-950, sidebar com temas e leitura da aula 1 normais
- Mobile LP: capa 288px (h-72), sem overflow horizontal (sw=cw=390), Playfair no nome ✓
- bun run lint 0/0; bunx tsc limpo em src/; rotas 200; worklog atualizado

Stage Summary:
- Criadores agora personalizam a tipografia da própria página: 24 fontes Google (5 categorias) escolhíveis para nome/títulos e descrições separadamente, com prévia ao vivo e badges de uso — implementação leve (fontes auto-hospedadas baixadas on-demand pelo navegador, só as usadas)
- Capa do criador 50% mais alta na LP (384px desktop / 288px mobile) e prévia maior no painel
- Sala de aula auto-recupera de falhas transitórias de rede (até 2 retries automáticos)
- Aprendizados registrados: loaders next/font exigem const no escopo do módulo; NUNCA montar var() com o className de font.variable — usar font.style diretamente

---
Task ID: 6 (verificação visual completa + polimento)
Agent: main (Z.ai Code)
Task: Auditoria visual de TODAS as telas com agent-browser e polimento de UI/UX

Work Log:
- Auditoria com screenshots (1440x900 e 390x844): landing (visitante/logado), auth (split-screen), Explorar aba Tudo (hero bento + 4 prateleiras), Mentores, Trilhas, Biblioteca, Reader, Sala de aula (leitura + vídeo), página do curso (inscrito e não inscrito), Checkout (PIX/cartão), Dashboard, Painel do mentor (FontPicker), LP pública — tudo funcional e bonito; zero erros no console
- GAP encontrado: perfil INTERNO do mentor (mentor-profile.tsx, o que abre do marketplace "Ver perfil") não tinha recebido as melhorias da LP — capa ~112px de altura e sem as fontes do criador
- mentor-profile.tsx REDESIGN do banner: capa explícita h-52 sm:h-64 md:h-72 (era ~112px) com véu gradiente inferior (profundidade + assentamento do avatar), fallback GraduationCap quando sem capa, avatar -mt-14 h-28 ring-4 ring-white shadow-xl, nome text-3xl; seção ecoa a identidade da LP pública
- Fontes do criador aplicadas em TODO o perfil interno: headingFontStyle no nome, "Sobre a mentoria", "Em resumo", "Disponibilidade semanal", títulos dos cursos/conteúdos do mural e número da nota (4xl); bodyFontStyle no headline, descrição, bio, descrições dos cards e comentários de avaliações — mesmo criador = mesma identidade no app e na LP
- FIX de layout: grid do conteúdo `grid` sem coluna explícita estourava no mobile (sw=546 > cw=390, min-width:auto dos itens) → `grid-cols-1 lg:grid-cols-3` + `min-w-0` na coluna principal; mobile agora 390=390 e desktop intacto (2 colunas preservadas)
- Skeleton de loading do perfil alinhado à nova altura (h-72)
- VÍDEOS MORTOS: as 5 aulas em vídeo do seed apontavam para IDs do YouTube que retornam 404 no oEmbed (player exibia "Video unavailable") — substituídos por open movies do Blender (CC, embeddáveis, estáveis): aqz-KE-bpKQ (Big Buck Bunny), R6MlUcmOul8 (Tears of Steel, 2 aulas), WhWc3b3KhnY (Spring), pKmSdY56VtY (Coffee Run); corrigido no prisma/seed.ts E no banco via one-off prisma/fix-dead-videos.ts (5 aulas atualizadas, sem re-seed)
- Validação browser: vídeo "Métricas north star" agora carrega com player + moldura de cinema ✓; perfil desktop/mobile sem overflow ✓; footer gruda no fundo ✓; abas Sobre/Cursos/Avaliações com fontes ✓
- bun run lint 0/0; bunx tsc --noEmit limpo em src/; rotas 200; dev server NÃO reiniciado, build NÃO rodado

Stage Summary:
- Plataforma auditada tela a tela: landing, auth, explorar (5 abas), biblioteca, leitor, sala de aula (leitura + vídeo), curso (2 estados), checkout, dashboard, painel do mentor e LP pública estão consistentes e polidos
- Perfil interno do mentor agora é gêmeo da LP pública: capa alta (288px desktop / 208px mobile) e tipografia personalizada do criador em nome, títulos e descrições
- Conteúdo demo sem surpresas: todas as aulas em vídeo tocam de verdade (vídeos estáveis do Blender)
- Aprendizado: grids com lg:grid-cols-N precisam de grid-cols-1 + min-w-0 nos itens para não estourar no mobile (min-width:auto do grid item)
---
Task ID: 8-b
Agent: frontend-styling-expert
Task: Redesign da landing page (home) — hero split com preview do produto, faixa de áreas, stats dark, features grid, FAQ, CTA duplo, fetch preguiçoso de cursos/trilhas

Work Log:
- Lidos worklog.md (Tasks 5/6 e agentes 4-a/6) e contratos: store.ts (navigate/setExploreQuery/setExploreTab/user), types.ts (MentorListItemDTO com contentsCount, CourseListItemDTO.studentCount, TrackListItemDTO, EnrolledCourseDTO), helpers.ts (CATEGORIES, avatarGradient, initials, currencyBRL), avatar.tsx (Avatar/Stars — só leitura), ui/accordion.tsx (Radix), page.tsx (shell monta apenas o conteúdo)
- `src/components/platform/landing-mentee.tsx` REDESIGN completo (único arquivo editado; avatar.tsx não alterado):
  - HERO split (grid-cols-1 lg:grid-cols-2): esquerda com badge pill esmeralda (Sparkles), h1 text-4xl→xl:text-6xl com destaque "vive o que ensina" (underline decoration-emerald-400/60) e variante logada "Olá, {firstName}!", parágrafo, busca (behavior exato mantido: onSubmit → setExploreQuery(term.trim()) + navigate marketplace, placeholder igual, input pill h-13 rounded-full), prova social (5 avatares sobrepostos + Stars da média com vírgula pt-BR + "+N mentores especialistas · N avaliações reais", com skeleton no loading) e 3 trust checks (vídeo integrado / biblioteca / agendamento em minutos); direita = preview de produto decorativo (aria-hidden): tile dark rounded-3xl de chamada de vídeo (dot "rec" animate-ping, "Sessão ao vivo · 24:31", grid 2x2 com 4 mentores reais Avatar+gradiente avatarGradient+nome, tile 1 com anel emerald, placeholders preenchendo até 4, barra de controles Mic/Video/Hand + PhoneOff rose) + 2 cards flutuantes com float y:[0,-8,0] infinite (course-card com gradiente/Progress 57% e rating-card com Stars 5 + iniciais) + glow blob esmeralda; fundo do hero com 2 blobs blur + padrão de pontos (radial-gradient 1px com mask radial, opacity 0.6); floats e tile com framer-motion (entradas initial/animate, tile flutua y:[0,-6,0])
  - "Explore por área": strip border-y stone-50 com chips rounded-full de CATEGORIES (min-h-11, hover emerald), onClick único → setExploreTab('all') + navigate marketplace
  - STATS: faixa dark emerald-950 rounded-3xl dentro do container com blobs, dl grid-cols-2 lg:grid-cols-4, +mentores/+sessões/+avaliações (skeleton emerald-100/20 no loading) e 4º número = "+alunos aprendendo" (soma studentCount dos cursos quando o fetch preguiçoso resolve) com fallback "+conteúdos publicados" (soma contentsCount dos mentores) — sempre 4 tiles, whileInView
  - COMO FUNCIONA: eyebrow + h2 "Três passos até a sua primeira sessão", círculos 01/02/03 em emerald-700 com ring-4 emerald-100, linha tracejada conectando no desktop (left-[16%] right-[16%] top-8), cards com ícone (Search/CalendarClock/Video) em emerald-50, stagger whileInView
  - FEATURES GRID (novo): 6 cards (MonitorPlay, Library, Route, CalendarCheck, Star, ShieldCheck) white/border-stone-200/rounded-2xl, ícone em emerald-50 rounded-xl, hover border-emerald-300 + shadow-sm, stagger (i%3)*0.07
  - Continuar de onde parou: mantido (behavior igual), img ganhou decoding="async" e botão Continuar h-11
  - Mentores/Cursos/Trilhas em destaque: mesmos memos e handlers (Ver todos → marketplace; Ver todos os cursos → setExploreTab('courses')+marketplace; trilhas idem 'tracks'), headers com eyebrow, grids grid-cols-1 sm:grid-cols-2 lg:grid-cols-3; FeaturedMentorCard ganhou capa gradiente avatarGradient(name) h-14 com avatar sobreposto -mt-8 ring-4, chip de nota no topo, hover -translate-y-0.5 + shadow; curso/trilha com capa h-36, hover lift, img loading="lazy" decoding="async", botões h-11; skeletons atualizados ao novo formato
  - DEPOIMENTOS: cards white border shadow-sm em faixa stone-50, Stars 5 preenchidas (size 14), autor com círculo de iniciais avatarGradient(author) + nome/role (split do author em ' · ', conteúdo TESTIMONIALS intacto), hover lift
  - FAQ (novo): Accordion shadcn single collapsible max-w-3xl, 5 perguntas pt-BR (mentoria 1:1, reunião por vídeo, pagamentos, certificado/progresso, tornar mentor), trigger font-bold hover:no-underline, whileInView
  - CTA DUPLO (novo, encerra a página): heading central + card escuro emerald-950 "Quero aprender" (GraduationCap, botão white → marketplace) + card claro bordered "Quero ensinar" (Presentation, outline → navigate({name:'for-mentors'})) + linha final de resegurança com 3 checks
  - PERFORMANCE: fetch de cursos e trilhas agora LAZY — useInView(ref da section, { once: true, margin: '600px' }) dispara api.listCourses({})/api.listTracks({sort:'popular'}) quando a seção se aproxima (mentores continua no mount para o hero); loading states e skeletons separados mantidos; useMemo para todos os derivados (stats, avgRating, featured, topCourses, topTracks, continueItems, totalStudents)
- Validação: bun run lint 0 erros/0 warnings; bunx tsc --noEmit limpo em src/ (só erros pré-existentes em examples/ e skills/); dev server NÃO reiniciado, build NÃO rodado; dev.log sem erros (compilações ✓, rotas 200)
- Browser E2E (agent-browser, dev.log saudável): desktop 1440x900 — hero split com preview e floats ✓; chips → "Explorar tudo" ✓; busca "inglês" → Explorar com query ✓; accordion abre (aria-expanded) ✓; "Ver todos os cursos" → "Explorar cursos" aba ativa ✓; scroll progressivo renderiza mentores(3)+cursos(3)+trilhas(3) artigos e stats com alunos ✓; mobile 390x844 sw=cw=390 (zero overflow) ✓; logado mostra "Olá, ..." + Continuar; guest mostra headline guest e sem Continuar ✓; console sem erros (apenas logs de Fast Refresh)
- Nota: screenshot full-page aparece com "vazios" entre seções porque whileInView (initial opacity 0) não dispara em captura instantânea — no scroll real todas as seções animam (verificado por scroll progressivo + opacity 1)

Stage Summary:
- Landing home redesenhada de ponta a ponta: hero split com mock de chamada de vídeo + cards flutuantes, chips de áreas, faixa dark de stats (com +alunos derivado dos cursos), 3 passos com linha tracejada, grid de 6 features, cards de destaque polidos com hover lift, depoimentos com iniciais gradientes, FAQ em accordion e CTA duplo aprender/ensinar
- Fetch de cursos/trilhas agora carrega sob demanda (useInView margin 600px, once) — no load imediato só /api/mentors (+/api/enrollments se logado); todas as navegações e handlers originais preservados; sem overflow horizontal em 390px e 1440px; alvos de toque ≥44px nos botões/chips; único arquivo alterado: landing-mentee.tsx

---
Task ID: 8 (desempenho + organização do Explorar + landing atrativa)
Agent: main (Z.ai Code) + frontend-styling-expert (8-b)
Task: Melhorar desempenho (code-splitting, fetch preguiçoso, memo), trocar as prateleiras horizontais do Explorar por grades organizadas, e deixar a landing page bem mais atrativa

Work Log:
- [8-a] src/app/page.tsx REESCRITO com next/dynamic (ssr:false) para as views pesadas — MentorProfileView, CourseView, ClassroomView, TrackView, ReaderView, MeetingRoomView, DashboardView, OnboardingView, MentorLpView, CheckoutView, LandingMentor e o próprio Toaster (sonner) saíram do bundle inicial; fallback enxuto "carregando…" (ViewLoading) evita salto de layout; LandingMentee, Marketplace e AuthView continuam estáticos (telas mais visitadas)
- [8-a] marketplace.tsx: prateleiras horizontais (overflow-x-auto snap) da aba "Tudo" SUBSTITUÍDAS por seções em grade organizadas — novo GridSection (header com título/contagem/"Ver tudo" + grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 + botão central "Ver mais N {unidade}" expandindo inline até tudo, "Ver menos" para recolher; gridClassName/skeletonClassName configuráveis — autores usam grid-cols-2 sm:3 lg:4 com skeletons h-44); allView agora devolve listas COMPLETAS (visibleSlice decide: 8 por padrão, tudo quando seção expandida OU busca/categoria ativa — filtragem sempre mostra todos os resultados); skeletons agora dentro do GridSection (loading prop); sem nenhum scroll lateral na aba "Tudo"
- [8-a] marketplace.tsx perf: MentorCard/CourseCard/TrackCard/LibraryCard/AuthorMiniCard envolvidos em React.memo (digitar na busca não re-renderiza cards cujos dados não mudaram); AuthorMiniCard w-56/snap → h-full w-full; TODAS as <img> (capas de cards + miniaturas dos spotlights) ganharam loading="lazy" decoding="async"
- [8-b] landing-mentee.tsx REDESIGN completo (frontend-styling-expert): hero split com mock do produto (tile de vídeo ao vivo escuro com mentores reais + cards flutuantes de progresso/avaliação com animação float), headline text-6xl com destaque sublinhado, prova social com avatares reais, 3 trust checks; nova faixa "Explore por área" (chips CATEGORIES → marketplace); stats band dark emerald com 4 números (inclui +alunos via studentCount); "Como funciona" com círculos numerados + conector tracejado; NOVA features grid "Tudo em uma única plataforma" (6 cards); cards de destaque com faixa de capa gradiente + avatar sobreposto; depoimentos com 5 estrelas + iniciais gradientadas; NOVA FAQ (accordion, 5 perguntas); CTA duplo final (Quero aprender dark / Quero ensinar → for-mentors) + linha de reasseguro
- [8-b] landing perf: /api/courses e /api/tracks?sort=popular agora só disparam quando a seção correspondente se aproxima do viewport (useInView margin 600px, once) — carga inicial da home ficou só com mentors (+enrollments se logado); todas as imagens lazy

Validation (browser E2E, 1440x900 e 390x844, guest + logado como Carlos):
- Landing: hero split impecável, mock de vídeo com 4 participantes reais, chips → marketplace (aba Tudo, 22 conteúdos), stats/features/depoimentos/FAQ/CTA duplo renderizam; saudação "Olá, Carlos!" para logado; footer no fim; sw=cw em 390 e 1440 (zero overflow horizontal)
- Explorar Tudo: grades 4-col desktop / 1-col mobile substituem as prateleiras; contagens e "Ver tudo" intactos; sem erros de console
- Code-splitting verificado em uso: página do curso, sala de aula (overlay imersivo completo), leitor de artigo e dashboard carregam sob demanda SEM erros — fluxo course→classroom→reader→dashboard navegado de ponta a ponta
- Perf: carga fresh da home NÃO dispara /api/courses nem /api/tracks; após scroll até as seções, ambos disparam (timestamps confirmados no network log)
- bun run lint 0/0; bunx tsc --noEmit limpo em src/; dev server não reiniciado, build não rodado

Stage Summary:
- Explorar aba "Tudo" agora é uma vitrine organizada em grades (1/2/3/4 colunas responsivas) com expansão "Ver mais" inline — fim das barras de rolagem horizontais, melhor aproveitamento do espaço e leitura natural em mobile
- Bundle inicial muito menor: 12 chunks pesados (vídeo/PDF/WebRTC/dashboard/fontes/sonner) viraram dynamic imports carregados só na navegação
- Landing transformada em página de conversão: hero com preview real do produto, prova social, features, FAQ e CTA duplo de audiência (aprender/ensinar)
- Aprendizados: MultiEdit NÃO é atômico neste ambiente — edições sequenciais anteriores ao old_str que falha PERSISTEM; ao falhar, sempre re-listar o estado real do arquivo antes de continuar
---
Task ID: 9-c
Agent: frontend-styling-expert
Task: Aba "Quiz" na sala de aula (classroom.tsx) — trigger/tabs, badge violeta no header e componente LessonQuiz completo (responder, feedback, retry, persistido, gabarito do mentor)

Work Log:
- Lidos worklog.md (Tasks 5/6/8: auto-retry da sala, padrões visuais stone/emerald, aprendizados de grid mobile) e contratos: types.ts (QuizDTO com isMine/myAttempt, QuizAttemptResultDTO, CourseLessonDTO.quizCount), api.ts (listLessonQuizzes, answerQuiz), padrão dos irmãos LessonQuestions/LessonNotes no fim do arquivo
- classroom.tsx (ÚNICO arquivo editado):
  - Imports: +ListChecks, +Lightbulb, +XCircle (lucide) e +QuizDTO/QuizAttemptResultDTO (types) — sem duplicações
  - Tabs do corpo da aula: novo trigger `quiz` (ListChecks h-4 + "Quiz (N)") renderizado somente quando currentLesson.quizCount > 0, entre Perguntas e Anotações; TabsContent correspondente monta <LessonQuiz key={currentLesson.id} lessonId user isOwner /> (remontagem por aula via key, igual LessonNotes)
  - Header da aula: Badge violeta "bg-violet-100 text-violet-800" com ListChecks h-3 + "Quiz" quando quizCount > 0 (junto aos badges Ao vivo/Vídeo/Leitura/Concluída)
  - LessonQuiz (padrão dos irmãos): GET api.listLessonQuizzes(lessonId, user.id) no mount; skeleton duplo h-40 no loading; erro → card inline border-dashed com AlertCircle rose + botão "Tentar novamente" (re-fetch); user null → card "Entre com uma conta..."; vazia → isOwner: convite curto para criar perguntas no painel / aluno: "O mentor ainda não publicou perguntas para esta aula." (border-dashed, estilo dos vazios)
  - Card por quiz (rounded-2xl border bg-white p-5): eyebrow "PERGUNTA N" + prompt font-semibold text-stone-900; alternativas como Button variant="outline" (h-auto min-h-11 w-full justify-start rounded-xl, letra A/B/C/D em círculo h-6 w-6 bg-stone-100 text-xs font-bold) com radiogroup semântico (role="radiogroup" aria-label={prompt}, role="radio" + aria-checked por opção); textos longos quebram (whitespace-normal)
  - Estados por quiz: (1) myAttempt persistido → escolha emerald-500/bg-emerald-50 (acerto) ou rose-300/bg-rose-50 (erro), badge "Você acertou" (emerald) ou "Respondeu — revise a explicação" (stone), interação desabilitada (aria-disabled + tabIndex -1 + pointer-events-none, sem opacity-50 para manter cores legíveis); (2) isMine (mentor dono) → gabarito: correta destacada + badge violeta "Gabarito" + explanation, sem botão de responder (evita 403 do backend); (3) aluno sem attempt → seleção única + "Responder" (h-10 rounded-full bg-emerald-700 hover:bg-emerald-800 font-bold, desabilitado sem seleção; "Verificando…" durante envio)
  - Pós-POST answerQuiz: acerto → card verde border-emerald-200 bg-emerald-50/80 com CheckCircle2 "Isso! +N XP" (N quando xpAwarded>0) + toast.success("Você acertou! +N XP ⚡") e card travado; erro → card vermelho border-rose-200 bg-rose-50/80 com XCircle "Não foi dessa vez — a correta é: {opção}" + "Tentar de novo" (limpa feedback, mantém seleção editável — retake permitido) + toast.error("Resposta incorreta — veja a explicação."); correta revelada em emerald no estado de erro; explanation (da resposta ou do DTO) em bloco rounded-xl bg-stone-50 p-3 text-sm text-stone-600 com Lightbulb âmbar
  - Rodapé: "X de Y respondidas · Z acertos" (text-xs text-stone-400); para o mentor dono mostra "N pergunta(s) · gabarito visível apenas para você"
- Material/Perguntas/Anotações, modo foco, navegação, certificado e ContentsNav: intocados
- Ambiente: dev server MORREU no meio da sessão (dev.log truncado em "✓ Starting...", porta 3000 recusava conexão; não fui eu — sessão paralela). Relancei com o script do projeto (`bun run dev`) desanexado via setsid; voltou a responder 200. Credenciais do demo: o e-mail correto é ana@demo.com (ana@test.com do briefing não existe no seed; senha demo123 OK)
- Validação E2E além do previsto: criei 1 quiz via API como a mentora Marina (dona do curso "Do Zero a Product Manager") na aula 3 para testar o fluxo completo e APAGUEI ao final (estado restaurado: nenhuma aula com quizCount>0)

Validation (tsc/lint/dev.log + agent-browser E2E):
- bunx tsc --noEmit: limpo em src/ (só erros pré-existentes em examples/ e skills/); checagem filtrada sem nenhum erro em classroom.tsx
- bun run lint: 0 erros / 0 warnings; dev.log sem erros de compilação (✓ Compiled, rotas 200)
- Browser como Ana (aluna inscrita): aula com quiz → tab "Quiz (1)" + badge violeta no header; aba ausente em aula sem quiz (comportamento correto); radiogroup/role=radio/aria-checked + aria-label no grupo confirmados no snapshot; min-height 44px e rounded-xl confirmados via getComputedStyle
- Fluxo completo: resposta errada (SWOT) → card vermelho "Não foi dessa vez — a correta é: RICE" + toast error + rodapé "1 de 1 respondidas · 0 acertos"; "Tentar de novo" limpa feedback mantendo seleção; resposta correta (RICE) → "Isso! +5 XP" + toast success + explanation + "1 de 1 respondidas · 1 acertos"; recarreguei a página → estado persistido do servidor (badge "Você acertou", RICE emerald, tudo desabilitado)
- Mobile 390x844: sw=cw=390 (zero overflow horizontal) na aba Quiz; console sem erros (apenas logs HMR/Fast Refresh)

Stage Summary:
- Sala de aula ganhou a aba Quiz: trigger com contagem só em aulas com quizCount>0, badge violeta no header e LessonQuiz com correção no servidor (aluno nunca vê gabarito antes de responder), feedback verde/vermelho com XP, explicação do mentor, retry em erro, estado persistido entre sessões e visão de gabarito para o mentor dono
- Acessibilidade radiogroup semântica e mobile sem overflow; nenhum outro recurso da sala foi alterado

---
Task ID: 9-f
Agent: frontend-styling-expert
Task: Card "Sua jornada de aprendizado" (XP/ofensiva/recorde/nível) no topo do dashboard do aluno

Work Log:
- Lidos worklog.md (Tasks 5/6/8 — lições de turbopack stale, grids mobile, dev server), dashboard.tsx (914 linhas — estrutura: header "Minhas sessões" → solicitações → Tabs Próximas/Meus cursos/Para avaliar/Histórico), api.ts (xpStats), types.ts (XpStatsDTO), helpers.ts (XP_LEVELS/levelFromXp), ui/progress.tsx, ui/card.tsx, /api/xp/route.ts e src/lib/xp.ts antes de codar
- Descoberta de ambiente: /api/xp retornava 500 — `Unknown field 'xp'`: o schema Prisma JÁ declara xp/studyStreak/longestStreak/lastStudyDate e o db:push tinha rodado, mas o Prisma Client NÃO tinha sido regenerado (cliente in-memory do dev server era stale; singleton globalThis em db.ts impede hot-reload). Rodei `bun run db:generate` (sem editar código backend) e confirmei em processo fresco (bun -e) que o cliente novo lê os campos. O servidor rodando só passa a usar o cliente novo após restart do `bun run dev` — restart executado (mesmo comando, dev.log backup em dev.log.bak-9f); /api/xp passou a responder 200
- dashboard.tsx (ÚNICO arquivo editado):
  - Imports: Flame/Trophy/Zap (lucide), levelFromXp (helpers), XpStatsDTO (types)
  - Estado hoisted no DashboardView: xpStats/xpFailed + useEffect próprio (fetch api.xpStats(userId) no mount, flag `alive` contra race no unmount; catch → xpFailed SEM toast/log — falha silenciosa por design)
  - XpJourneyCard({stats, failed}): failed → return null (card nem renderiza); stats null → skeletons espelhando o layout (Skeleton); dados → card rounded-2xl border bg-white p-5 shadow-sm com role="group" aria-label="Progresso de gamificação" e tabular-nums herdado no root
  - Header: ícone Flame em círculo bg-orange-100 text-orange-600 + título text-lg font-extrabold
  - KPIs grid grid-cols-3 gap-3 sm:flex sm:gap-6 (itens min-w-0 sm:flex-1): XP total (Zap emerald, número text-xl sm:text-2xl font-extrabold), Ofensiva (Flame laranja quando streak>0, cinza stone-300 quando 0, label "dias seguidos"/"estude hoje!"), Recorde (Trophy amber-500 + longestStreak); labels text-xs text-stone-400; aria-labels por número
  - Nível: "Nível atual: {label}" font-bold + Progress (progressPct, aria-label "% do caminho para o nível X") + "Faltam {xpToNext} XP para {next.label}"; next===null → "Nível máximo alcançado! 🏆" sem barra
  - Micro-proof: "+10 XP por aula concluída · +5 por quiz acertado · +50 por curso completo" (text-xs text-stone-400, border-t stone-100)
  - Posicionamento: primeiro card da área de conteúdo, logo após o header (acima de solicitações/Tabs) — topo da visão geral, visível em todas as tabs; nenhuma outra seção movida
- Credenciais do enunciado: ana@test.com NÃO existe (login 401) — aluno demo real é ana@demo.com (senha demo123); E2E feito com ela

Validation (agent-browser, sessão autenticada como ana@demo.com):
- /api/xp → 200 {xp:5, streak:1, longestStreak:1, lastStudyDate:today} (XP pré-existente de quiz do dia; 0 também seria válido)
- Card renderiza no dashboard com: "5 XP total", "1 dias seguidos" (Flame text-orange-500 ativo), "1 recorde", "Nível atual: Aprendiz", Progress indicator translateX(-95%) = 5% com aria-label "5% do caminho para o nível Explorador", "Faltam 95 XP para Explorador" (matemática do levelFromXp correta), micro-proof completo; role/aria/tabular-nums/rounded-2xl confirmados via DOM
- Tabs intactas: Próximas(4)/Meus cursos(1)/Para avaliar(1)/Histórico(2); aba Meus cursos lista Minhas trilhas (29%) + curso (2/7 aulas); solicitações recebidas e BookingCards normais
- Console sem erros (só logs HMR/Fast Refresh); rede: GET /api/xp 200; page errors vazio
- Screenshots: tool-results/shot-26-dashboard-xp-desktop.png (1440x900) e shot-27-dashboard-xp-mobile.png (390x844); overflow horizontal ZERO em ambos (scrollWidth=clientWidth=1440 e 390)
- bunx tsc --noEmit limpo (só erros pré-existentes fora src/); bun run lint 0/0; dev.log saudável com SELECT das colunas novas e GET /api/xp 200; dev server rodando na 3000 (restart documentado acima)

Stage Summary:
- Dashboard do aluno ganhou o card de gamificação "Sua jornada de aprendizado" (XP total, ofensiva com chama viva/apagada, recorde, nível com Progress até o próximo nível e micro-proof das regras de XP) — com skeleton, falha silenciosa em erro, a11y (role group + aria-labels + tabular-nums) e zero overflow em 390px/1440px
- Ambiente corrigido no caminho: Prisma Client regenerado (db:generate faltava após o schema novo) e dev server reiniciado para carregá-lo — /api/xp saiu de 500 para 200; sem nenhuma edição em código backend
- Demo: credencial correta do aluno é ana@demo.com/demo123 (ana@test.com do enunciado não existe)
---
Task ID: 9-d
Agent: general-purpose
Task: Botão "Quiz" por aula no LessonsManagerDialog + QuizManagerDialog completo (criar/editar/excluir perguntas) no painel do mentor (onboarding.tsx)

Work Log:
- Lidos worklog.md (Tasks 5/6/8, 9-c/9-f: padrões stone/emerald, quiz na sala de aula, armadilhas de credenciais demo) e contratos: types.ts (QuizDTO, CourseLessonDTO.quizCount), api.ts (listLessonQuizzes/createQuiz/updateQuiz/deleteQuiz), rotas backend (mensagens de erro reais para espelhar na validação client), ui/radio-group.tsx, ui/dialog.tsx e ui/button.tsx antes de codar
- onboarding.tsx (ÚNICO arquivo editado):
  - Imports: +ListChecks (lucide), +RadioGroup/RadioGroupItem (@/components/ui/radio-group), +QuizDTO (types) — sem duplicações
  - LessonsManagerDialog: estado quizLesson/quizOpen + handleQuizOpenChange (ao fechar o quiz, refaz fetchLessons para atualizar o badge de contagem); novo botão por aula na linha (entre o Popover "mover tema" e o Trash de remover): ghost/size-icon size-8, ListChecks size-3.5 + badge emerald-600 absoluto (h-4, text-[10px] bold) com lesson.quizCount quando > 0, aria-label "Gerenciar quiz de {título}"; monta <QuizManagerDialog course lesson user={{id: userId}} open onOpenChange> condicional (padrão lessonsCourse)
  - QuizManagerDialog (novo componente após LessonsManagerDialog, ~420 linhas): props { course, lesson, user: {id}, open, onOpenChange } (user só precisa do id para as APIs); GET listLessonQuizzes no open (flag active contra race, erro → toast + lista vazia); header "Quiz da aula" + descrição "{curso} · {aula} · N pergunta(s) · correção automática (+5 XP por acerto)"
  - Lista: card rounded-2xl por pergunta (eyebrow "PERGUNTA N", prompt semibold, Editar/Excluir ghost size-8 com Pencil/Trash2 + aria-labels), alternativas em rounded-xl com letra A-F em círculo — correta em border-emerald-300 bg-emerald-50 + Check emerald com aria-label, explicação em bloco bg-stone-50
  - Form único para criar/editar (toggle "Adicionar pergunta" dashed outline quando fechado): Textarea prompt, RadioGroup Radix com radio + Input por linha (placeholder "Alternativa A/B/C..."), botões add (disabled em 6) / remover (disabled em 2) — correctIndex reajusta ao remover (null se a correta foi removida), Input "Explicação (opcional)", "Salvar pergunta" (bg-emerald-700) via <form onSubmit>; validação client espelha o servidor (prompt ≥ 5, 2-6 alternativas preenchidas, correta marcada) — erros do servidor chegam via toast e têm prioridade
  - Criar → api.createQuiz + toast 'Pergunta adicionada ao quiz' + refresh; Editar → form pré-preenchido + api.updateQuiz + toast 'Pergunta atualizada!' + refresh; Excluir → AlertDialog (padrão do projeto, botão rose) + api.deleteQuiz + toast 'Pergunta removida do quiz.' + refresh; loading → 2 Skeletons h-32 rounded-2xl; vazio → "Nenhuma pergunta ainda — crie a primeira para ajudar a fixar o aprendizado."
  - DialogContent flex max-h-[85dvh] flex-col (tailwind-merge resolve grid→flex) + corpo min-h-0 flex-1 overflow-y-auto com scrollbar estilizada igual à lista de aulas
  - Temas, anexos, tipo de aula, leitura e todo o resto do painel: intocados
- Ajuste pós-E2E: no fluxo de EDITAR, o form não fechava após salvar (formOpen permanecia true) — adicionado setFormOpen(false) no branch de update, igualando o fluxo de criar; revalidado no browser
- Ambiente: dev server NÃO reiniciado (200 na :3000 o tempo todo); E2E confirmou que carlos@mentoria.com do briefing NÃO existe (login falha) — mentor demo real é carlos@demo.com/demo123 (mesmo padrão do ana@test→ana@demo da Task 9-c)

Validation (tsc/lint/dev.log + agent-browser E2E desktop 1440x900 e mobile 390x844):
- bunx tsc --noEmit: limpo em src/ (só erros pré-existentes em examples/ e skills/); bun run lint: 0 erros / 0 warnings; dev.log saudável (GET/POST/DELETE de quizzes 200, sem ⨯; EADDRINUSE no log é histórico de restart anterior)
- Desktop: login Carlos → Painel do mentor → Aulas do curso (9 aulas) → botão "Gerenciar quiz" presente em todas as linhas; diálogo abre com contagem no header e estado vazio correto
- Validação client: salvar vazio exibe os 3 erros inline (prompt/alternativas/correta) sem tocar no servidor
- Criar com 3 alternativas: radio A/B/C, "(3/6)" no botão add, remover desabilitado em 2; POST 200 → toast 'Pergunta adicionada ao quiz' capturado, header "1 pergunta · correção automática (+5 XP por acerto)", card na lista com a correta (C) em emerald + Check (getComputedStyle/DOM confirmado), badge emerald "1" no botão da aula (fetchLessons no close)
- Editar: form 100% pré-preenchido (prompt, 3 opções, correta C marcada, explicação) → PATCH 200 → toast 'Pergunta atualizada!' → lista atualizada
- Excluir: AlertDialog "Excluir pergunta?" com o prompt citado → DELETE 200 → toast 'Pergunta removida do quiz.' → estado vazio restaurado, header "0 perguntas", badge some
- Mobile 390x844: docScrollW = docClientW = 390 (zero overflow horizontal) com o form aberto; diálogo 358px de largura; criar/excluir re-feitos no mobile com sucesso
- Console sem erros de página; nenhuma requisição DELETE acidental; estado do demo restaurado (curso do Carlos sem quizzes ao final — pergunta de teste criada e excluída)

Stage Summary:
- Painel do mentor agora gerencia o quiz de cada aula: botão ListChecks com contagem emerald por aula, diálogo de quiz com lista (gabarito destacado), criação/edição com RadioGroup de correta que se reajusta ao remover alternativas, exclusão com AlertDialog, validação client alinhada ao servidor e toasts em todos os fluxos
- Completa o ciclo com a Task 9-c: o mentor cria as perguntas no painel e o aluno responde na sala de aula com correção automática (+5 XP)
- Credencial do mentor demo corrigida para referência futura: carlos@demo.com/demo123

---
Task ID: 9 (feature pack: quiz + gamificação XP/ofensiva)
Agent: main (Z.ai Code) + frontend-styling-expert (9-c, 9-f) + general-purpose (9-d)
Task: Implementar mais coisas de aprendizagem — quiz por aula (correção no servidor), gamificação XP + ofensiva de estudos com níveis, e integração em sala de aula/painel/dashboard; polimento visual leve

Work Log:
- SCHEMA (9-a): models Quiz (prompt/options JSON/correctIndex/explanation/order), QuizAttempt (@@unique quizId+userId, retake substitui), XpEvent (ledger anti-farm @@unique userId+kind+refId); User ganhou xp/studyStreak/longestStreak/lastStudyDate; Enrollment ganhou bonusAwarded/completedAt → db:push + regeneração do client (nota: singleton do db.ts exige restart do dev após gerar)
- XP (src/lib/xp.ts NOVO): awardXp() com ledger create-catch-P2002 (skipDuplicates NÃO existe no SQLite); XP_LESSON=10, XP_QUIZ=5, XP_COURSE=50; ofensiva calculada no fuso America/Bahia (en-CA = YYYY-MM-DD), streak ativa se estudou hoje/ontem (activeStreak)
- APIs NOVAS: GET/POST /api/lessons/[lessonId]/quizzes (acesso inscrito/dono; gabarito SÓ para o dono), PATCH/DELETE /api/quizzes/[id] (dono), POST /api/quizzes/[id]/attempt (correção no servidor — gabarito nunca vai ao cliente antes de responder; upsert + XP na 1ª correta), GET /api/xp?userId= (xp, streak ativa, recorde); PATCH /api/courses/[id]/enroll agora retorna { xpAwarded, courseCompleted } e concede XP de aula + bônus de 100% (guard bonusAwarded + completedAt)
- CONTRATOS: types.ts (QuizDTO com correctIndex|null para aluno, QuizAttemptResultDTO, XpStatsDTO, CourseLessonDTO.quizCount); api.ts (listLessonQuizzes/createQuiz/updateQuiz/deleteQuiz/answerQuiz/xpStats); helpers.ts (XP_LEVELS Aprendiz→Mestre 0/100/250/500/1000 + levelFromXp com progresso); /api/courses/[id] inclui quizCount por aula
- CLASSROOM (9-c, agente): aba "Quiz (N)" condicionada a quizCount>0, badge violeta no header da aula, componente LessonQuiz (radiogroup acessível role=radio/aria-checked, alternativa A-D com círculo, responder → feedback verde "+N XP"/vermelho com gabarito+explicação e retry, estado persistido do servidor travado após acerto, rodapé "X de Y · Z acertos", visão de gabarito para o dono); toast de XP ao concluir aula (res.xpAwarded)
- PAINEL (9-d, agente): botão Quiz por aula no LessonsManagerDialog (badge emerald com contagem) + QuizManagerDialog completo: lista com correta destacada, criar/editar (prompt, 2-6 alternativas com RadioGroup, correctIndex reajusta ao remover, explicação opcional), excluir com AlertDialog, validação client+servidor, "N perguntas · correção automática (+5 XP por acerto)"
- DASHBOARD (9-f, agente): card "Sua jornada de aprendizado" — 3 KPIs (XP total Zap emerald, ofensiva Flame laranja/estude hoje!, recorde Trophy amber), nível com Progress até o próximo ("Faltam N XP para X", Mestre = máximo 🏆), linha "+10 aula · +5 quiz · +50 curso"; skeleton + falha silenciosa; a11y role=group
- POLIMENTO (9-h): pluralização "1 dia seguido"/"N dias seguidos" (visível + aria-label)
- DEMO DATA: prisma/add-demo-quizzes.ts (one-off idempotente) — 6 perguntas reais de arquitetura nas aulas Bem-vindo/Camadas/Modelagem/Cache do curso do Carlos; Ana inscrita no curso de Arquitetura (one-off); prisma/seed.ts atualizado (helper course() aceita quiz[] por aula + cleanup quizAttempt/quiz/xpEvent) para re-seeds futuros

Validation (browser E2E, agente + main, desktop 1440x900 + mobile 390x844):
- Fluxo do aluno COMPLETO: login ana@demo.com → curso Arquitetura → sala de aula → aba Quiz(1) → respondeu ERRADO de propósito → card vermelho com gabarito + explicação + "Tentar de novo" ✓ → acertou → travado com "1 acertos" ✓ → Concluir aula → +10 XP (xp 10→20 no banco) + auto-avanço ✓ → aba Quiz(2) na aula seguinte ✓
- Dashboard: card com 20 XP · 1 dia seguido · recorde 1 · Aprendiz 20% · "Faltam 80 XP para Explorador" ✓; mobile 390px sem overflow (sw=cw) ✓
- Painel do mentor (9-d): criar/editar/excluir pergunta via UI com PATCH/DELETE 200 ✓ (pergunta de teste removida — demo limpo)
- GET /api/xp 200; toggles retornam xpAwarded; bun run lint 0/0; bunx tsc limpo em src/; dev.log sem erros; console do browser limpo

Stage Summary:
- Aprendizagem agora tem CICLO COMPLETO: aula → quiz corrigido no servidor (anti-roubo de gabarito) → XP anti-farm via ledger → ofensiva diária por fuso → níveis com progresso → bônus ao concluir curso → certificado (já existente)
- Mentores criam quizzes direto no painel (correção automática + explicação pedagógica por pergunta)
- Alunos veem evolução no dashboard (jornada) e feedback imediato na sala de aula
- Aprendizados: Prisma skipDuplicates não existe no SQLite (use create+catch P2002); regenerar client Prisma exige restart do dev server por causa do singleton globalThis; contas demo: ana@demo.com / carlos@demo.com (senha demo123)

---
Task ID: 11-c
Agent: frontend-styling-expert
Task: Painel do mentor reorganizado em abas funcionais

Work Log:
- Lidos worklog.md (Tasks 8/9/9-c/9-d/9-f: padrões stone+emerald, credenciais demo, Radix desmonta TabsContent inativo) e contratos antes de codar: ui/tabs.tsx (TabsList base com bg-muted/h-9/w-fit — tudo sobrescrito via cn/tailwind-merge), api.ts (listCourses({ mentorUserId }) → CourseListItemDTO[], inclui rascunhos), types.ts (CourseListItemDTO.studentCount: number; MentorDetailDTO.rating/reviewCount/contents/name/availabilities)
- onboarding.tsx (ÚNICO arquivo editado; bloco final "com perfil" de OnboardingView): painel de 8 seções empilhadas convertido em abas controladas — const [tab, setTab] = useState<PanelTabId>('overview') + <Tabs value onValueChange>; container alargado para max-w-5xl com header "Painel do mentor" + subtítulo "estúdio de criação"
- TabsList responsiva ÚNICA (um único Root/List no painel — Radix exige 1 List por Root): grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 com a TabsList dentro; mobile = faixa horizontal (flex h-auto w-full justify-start gap-1 overflow-x-auto whitespace-nowrap do base, rounded-xl border-stone-200 bg-white p-1.5, scrollbar fina stone-200 via [scrollbar-width:thin] + ::-webkit-scrollbar h-1; justify-start evita clipping de conteúdo em overflow centrado); lg+ = coluna lateral vertical sticky (lg:flex-col lg:items-stretch lg:justify-start lg:sticky lg:top-0 lg:self-start lg:overflow-visible) — sticky ancorada no scroll container (main, único scroller do shell app-nativo); triggers min-h-11 (≥44px) flex-none rounded-xl com ícone, ativo data-[state=active]:bg-emerald-700 text-white, inativo branco/stone com hover:bg-stone-100
- 8 abas via const PANEL_TABS: overview (LayoutDashboard), perfil (UserRound), agenda (CalendarClock), mural (Newspaper), cursos (ListVideo), biblioteca (Library), trilhas (Route), divulgacao (Megaphone); cada TabsContent com className="min-w-0 mt-4 sm:mt-6" dentro de wrapper min-w-0 (managers remontam ao reabrir a aba — comportamento Radix esperado)
- Visão geral (novo conteúdo): saudação "Olá, {firstName(profile.name)}!"; 4 KPI cards (grid-cols-2 sm:grid-cols-4, componente OverviewKpi rounded-2xl hairline) — NOTA (rating formatado ou "—" + footer com Stars e "N avaliações" de profile.reviewCount), ALUNOS (soma course.studentCount de mentorCourses), CURSOS (mentorCourses.length, "incluindo rascunhos"), CONTEÚDOS (profile.contents.length); "Atalhos rápidos" com PANEL_SHORTCUTS (7 botões-card grid-cols-1 sm:grid-cols-2: chip emerald-50 + título + descrição 1 linha + ChevronRight, hover:border-emerald-300, aria-label "Ir para a aba {label}") que dão setTab direto
- Dados para os KPIs sem montar CoursesManager: reloadCourses = useCallback (listCourses({ mentorUserId: userId }), catch silencioso) + useEffect no userId; handleCoursesChange mantido para o CoursesManager re-sincronizar ao editar cursos
- Abas de managers com props IDÊNTICAS às originais: perfil mantém mini-strip de stats (rating/avaliações/conteúdos) + MentorProfileForm completo; agenda = AvailabilityEditor(initialSlots, onSave); mural = ContentsManager(contents, userId, onChanged); cursos = CoursesManager(userId, onChanged, onCoursesChange) — dialogs de aulas/quiz intocados; biblioteca = LibraryManager(userId, onChanged); trilhas = TracksManager(userId, onChanged); divulgacao = TrafficLinksSection(profile, courses, onSaved) + TrafficPanel(userId)
- INTACTOS: fluxo "sem perfil" (hero + BenefitCards + criação), guards !user/loading, e todos os managers/dialogs/quiz/font picker (só a organização da view final mudou)
- Refinos finais alinhando ao briefing: triggers rounded-lg→rounded-xl, TabsContent unificado em "min-w-0 mt-4 sm:mt-6" (antes tinha variação lg:mt-0), scrollbar discreta visível no lugar de scrollbar oculta

Validation (tsc/lint + agent-browser desktop 1440x900 e mobile 390x844):
- bun run lint: 0 erros/0 warnings; bunx tsc --noEmit: limpo em src/ (só erros pré-existentes em examples/ e skills/, fora de escopo)
- Login validado do zero: "Entrar" → carlos@demo.com / demo123 → home "Olá, Carlos!" → menu do usuário → "Painel do mentor"
- Desktop 1440x900: grid 220px + coluna de conteúdo confirmado via getComputedStyle (gridTemplateColumns "220px 732px", TabsList flexDirection column, position sticky, docScrollWidth=docClientWidth=1440); tablist "Seções do painel" com 8 tabs; Visão geral com 4 KPIs (NOTA 5,0 · 1 avaliação, ALUNOS 2, CURSOS 1, CONTEÚDOS 3 — alunos>0) e 7 atalhos; TODOS os 7 atalhos testados um a um → trocam para a aba certa (Perfil público/Agenda/Mural/Cursos/Biblioteca/Trilhas/Divulgação); aba Cursos → dialog "Aulas do curso" (6 aulas) → dialog "Quiz da aula" abre e fecha; abas Perfil/Agenda/Mural/Biblioteca/Trilhas/Divulgação renderizam o conteúdo certo; sticky lateral valida ao rolar o main (preso ao topo do scrollport, 57px = altura da navbar estática acima)
- Mobile 390x844: docSW=docCW=390 (zero overflow horizontal); KPIs em 2 colunas (173px 173px); faixa de abas com scrollWidth 940 > clientWidth 356 e overflow-x auto (rolável), última aba "Divulgação" alcançável após rolar a faixa e clicável
- Console sem erros; dev.log sem erros novos (só queries prisma e GETs 200); dev server NÃO reiniciado; nenhum arquivo criado; screenshots em tool-results/shot-11c-panel-overview-desktop.png e shot-11c-panel-overview-mobile.png

Stage Summary:
- Painel do mentor (bloco "com perfil" do onboarding) agora é um estúdio do criador em 8 abas controladas: Visão geral nova (saudação + 4 KPIs vindos de listCourses/MentorDetailDTO + 7 atalhos que navegam de aba), Perfil/Agenda/Mural/Cursos/Biblioteca/Trilhas/Divulgação com os managers exatos de antes (props intocadas), navegação única responsiva (faixa rolável no mobile, sidebar sticky 220px no desktop) sem duplicar TabsList
- KPIs alimentados mesmo com abas inativas desmontadas (Radix) via reloadCourses no OnboardingView + handleCoursesChange do CoursesManager
- Decisões: scrollbar fina visível ("discreta") em vez de oculta; justify-start na faixa mobile para não clipar o primeiro tab em overflow centrado; TabsContent segue o briefing literal (min-w-0 mt-4 sm:mt-6)
- Zero mudanças em page.tsx/navbar/footer/classroom, api.ts, types.ts, tabs.tsx ou nos managers

---
Task ID: 11-a + 11-b + 12
Agent: main (Z.ai Code)
Task: Header isolado (corpo nunca entra por baixo), sala de aula mais larga (vídeos maiores) e verificação E2E das mudanças + do painel em abas

Work Log:
- [11-a] src/app/page.tsx: shell convertido em app-nativo definitivo — raiz `flex h-dvh flex-col overflow-hidden bg-white`; `<main ref={mainScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">` é o ÚNICO container de rolagem; wrapper interno `flex min-h-full flex-col` mantém o footer colado no fundo em páginas curtas e empurrado nas longas (footer moveu-se para DENTRO do main); scroll-to-top ao trocar de view agora via `mainScrollRef.scrollTo({top:0})` (window não rola mais); overlays imersivos (classroom/reader) continuam `fixed inset-0 z-50` — inalterados
- [11-a] navbar.tsx: `sticky top-0 z-40 bg-white/85 backdrop-blur-md` → `shrink-0 border-b bg-white` (estático, opaco, fora do fluxo de rolagem) — o conteúdo rola no main e NUNCA aparece por baixo do header
- [11-b] classroom.tsx: conteúdo interno da aula alargado de max-w-4xl (normal) / max-w-3xl (foco) para `max-w-5xl` / `max-w-4xl` (+ w-full) — vídeos aspect-video crescem proporcionalmente
- [11-c] onboarding.tsx (subagente frontend-styling-expert, ver entrada própria acima): painel do mentor em 8 abas controladas com TabsList única responsiva
- [12] Validação: `bun run lint` 0/0; `bunx tsc --noEmit` limpo em src/; Agent Browser desktop 1440x900 + mobile 390x844

Validation (browser E2E):
- Header isolado: getBoundingClientRect → header 0–57px estático opaco, main começa exatamente em 57px; rolagem de 1200px no main mantém header intacto sem conteúdo sob ele; wheel real do mouse rola o main (scrollTop 0→737); sticky do booking widget no perfil do mentor continua funcionando DENTRO do main (stuck=true, sem invadir o header)
- Footer: no fim da página em home longa (footerBottom=900=vh) e no painel mobile (844=vh); gruda no fundo quando o conteúdo é curto
- Sala de aula (como ana@demo.com, curso "Do Zero a PM"): conteúdo interno max-width 1024px (era 896px), vídeo 994×559px em 1440 (era ~830px); modo foco com vídeo 894px (era ~672px) em coluna única; leitura em prose max-w-3xl preservada; navegação entre aulas/leitura/vídeo intacta
- Painel do mentor (como carlos@demo.com): 8 abas na sidebar; Visão geral com saudação + 4 KPIs (5,0/2 alunos/1 curso/3 conteúdos) + 7 atalhos que trocam de aba; abas Cursos (gestão + Novo curso) e Divulgação (link rastreável + pixels + gerador UTM) renderizam perfeitamente; mobile 390px com faixa de abas rolável e sw=cw=390 (zero overflow)
- Console do browser sem erros; dev.log saudável (só queries prisma/GETs 200); dev server NÃO reiniciado; nenhum teste automatizado criado

Stage Summary:
- Header agora é um elemento estático do shell app: o corpo inteiro rola no <main> isolado — resolvido estruturalmente (não é mais questão de z-index/blur)
- Sala de aula com tela de conteúdo interna larga (max-w-5xl): vídeos ~20% maiores em janelas grandes e ~33% maiores no modo foco, sensação de "tela focada"
- Painel do mentor em 8 abas funcionais (Visão geral com KPIs/atalhos, Perfil, Agenda, Mural, Cursos, Biblioteca, Trilhas, Divulgação) — organizado, completo e validado em desktop + mobile
- Screenshots: tool-results/shot-12a…12k (home, isolamento, footer, classroom leitura/vídeo/foco, painel desktop/mobile)

---
Task ID: 13-e
Agent: frontend-styling-expert
Task: Bloco "Continue aprendendo" na home (logado)

Work Log:
- Lidos worklog.md (Tasks 11-c e 11-a/11-b/12: main é o único scroller do shell, hero split com mock de vídeo, padrões stone/emerald) e contratos antes de codar: landing-mentee.tsx completo (1566 linhas — fetch de enrollments JÁ existia via api.listMyEnrollments(userId) em useEffect dependente de user?.id; FeaturedCourseCard com capa h-36 + Library white/20 como fallback; handler handleVerCursos = setExploreTab('courses') + navigate marketplace), types.ts (EnrolledCourseDTO, CourseListItemDTO.lessonCount), store.ts (AppView com 'course', setExploreTab), api.ts (listMyEnrollments), ui/progress|badge|button|card, dashboard.tsx (padrão EnrolledCourseCard: total piso 1, pct arredondado, isDone = completed >= lessonCount && lessonCount > 0, badge emerald "Concluído" com CheckCircle2)
- DESCOBERTA CHAVE: a home JÁ tinha uma faixa "Continuar de onde parou" (Task 2-a) exatamente na posição pedida (logo após o hero, antes dos chips) — mesma fonte de dados, sem priorização, botão indo para classroom, com skeleton. Mantê-la + adicionar a nova seção duplicaria as mesmas matrículas em duas seções adjacentes; a Task 13-e descreve a home sem essa faixa e pede o novo bloco nessa posição → SUBSTITUI a faixa antiga pelo novo bloco "Continue aprendendo" (mesmo lugar, cards verticais no padrão FeaturedCourseCard do próprio arquivo). Nenhum outro arquivo tocado
- landing-mentee.tsx (ÚNICO arquivo editado):
  - Priorização em continueItems (useMemo sobre enrollments): grupo 1 = em andamento (completed > 0 e não concluído), grupo 2 = não iniciadas (0 aulas), grupo 3 = concluídas (lessonCount > 0 && completed >= lessonCount — isDone idêntico ao dashboard); dentro de cada grupo sort por enrolledAt desc (ISO-8601 comparado lexicograficamente); slice(0, 3)
  - Render condicional: user && !enrollmentsLoading && continueItems.length > 0 — silencioso (nada renderizado para convidado, com zero matrículas ou enquanto carrega; skeleton antigo REMOVIDO conforme briefing "sem skeleton que pule layout")
  - Seção compacta (border-y border-stone-200/70 bg-stone-50/50 py-8 sm:py-10, max-w-6xl): h2 id="continue-title" pequeno uppercase "Continue aprendendo" (text-sm font-extrabold uppercase tracking-widest text-stone-500 — mesmo estilo do h2 "Explore por área" vizinho, harmônico; a sugestão stone-400 do briefing tinha "?" e o precedente do arquivo usa stone-500) + subtítulo curto text-xs sm:text-sm stone-400 "Retome seus cursos exatamente onde parou."
  - Grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 (itens min-w-0 — lição da Task 7 contra overflow no mobile) com até 3 ContinueCourseCard + card CTA final
  - ContinueCourseCard (novo componente no fim do arquivo, padrão dos FeaturedCards: useAppStore navigate próprio): capa h-16 com coverUrl (img lazy/async) ou avatarGradient(course.title) com Library text-white/20 no canto — cópia do padrão FeaturedCourseCard em h-16; título line-clamp-2 min-h-10 text-sm font-bold; "por {mentor.name}" truncate; Progress (value pct, aria-label "{pct}% do curso concluído") + linha "{completed} de {lessonCount} aulas concluídas" à esquerda e "{pct}%" à direita (padrão de contagem do dashboard); Badge "Concluído" emerald (rounded-full border-emerald-200 bg-emerald-100 text-emerald-800 com CheckCircle2, igual ao dashboard) só quando 100%; Button h-11 (44px) w-full rounded-full "Continuar" → "Revisar" quando 100%, onClick navigate({ name: 'course', courseId }) (o course-view retoma da primeira aula não concluída), aria-label "Continuar curso {título}" nos dois estados
  - Card CTA final: <button> discreto border-dashed border-stone-300 (hover emerald-400/bg-emerald-50/40, group-hover no ArrowRight) com ícone Library, "Explorar mais cursos" e dica curta; onClick = handler existente handleVerCursos (setExploreTab('courses') + navigate marketplace — copiado, não duplicado); min-h-40, h-full, alvo ≥44px
  - Imports: +CheckCircle2 (lucide), −Card (import ficou órfão com a remoção da faixa antiga — lint pegaria); comentário do fetch atualizado para o nome novo
- Ambiente: dev server foi encontrado FORA do ar no início da sessão (porta 3000 recusava conexão, sem listener — morte prévia, sessão paralela ativa com Fast Refresh rebuilds visíveis no console); voltou a responder 200 sozinho (relançado pela sessão paralela) — EU NÃO reiniciei nada. Sessão paralela também mexeu nos dados demo no meio dos testes (Ana passou de 2/7 para 7/7 em "Do Zero a PM"), o que acabou permitindo validar o estado "Concluído/Revisar" com dado real; validação E2E feita em sessão de browser ISOLADA (--session t13e) para não colidir com o agente paralelo que compartilhava a sessão default

Validation (tsc/lint + agent-browser E2E em sessão isolada, desktop 1440x900 + mobile 390x844):
- bun run lint: 0 erros / 0 warnings; bunx tsc --noEmit: limpo em src/ (só erros pré-existentes fora de src/); dev server NÃO reiniciado (HTTP 200 ao longo de toda a validação); nenhum arquivo novo criado
- Deslogado: seção NÃO renderiza (hero → chips direto) ✓; "Aluno" logado sem matrículas: seção some ✓
- Ana (ana@demo.com): seção "Continue aprendendo" entre hero (section 0) e chips (section 2) — posição confirmada via DOM; h2 + subtítulo corretos; 2 cards + CTA; na 1ª passada (dados da época): Arquitetura de Software na Prática 1 de 9 aulas (11%) PRIMEIRO e Do Zero a PM (Marina Costa) 2 de 7 aulas (29%) — ordem por enrolledAt desc dentro do grupo "em andamento" correta; capas com img real h-16 (64px), mentor name truncado, botões "Continuar" h-11=44px com aria-label "Continuar curso {título}"; Progress com aria-label "{pct}% do curso concluído"
- Clique "Continuar" no card da Marina → course-view abriu o curso CERTO ("Do Zero a Product Manager · por Marina Costa · 7 aulas" com "2 de 7 aulas concluídas · 29%") ✓
- 2ª passada (após o dado virar 7/7): Arquitetura (1/9, 11%) continua PRIMEIRO e Do Zero a PM (7/7, 100%) ÚLTIMO, com badge "Concluído" em emerald-100 e botão "Revisar" — priorização em andamento → concluído validada com dado real ✓
- CTA "Explorar mais cursos" (border dashed confirmado via getComputedStyle) → marketplace abriu com aba "Cursos" aria-selected=true ✓
- Carlos (carlos@demo.com): 1 card (Do Zero a PM, 0 de 7 aulas, 0%, barra em 0% translateX(-100%), "Continuar") — grupo "não iniciadas" ✓; logout → seção some na hora ✓
- Mobile 390x844 (Ana): zero overflow horizontal (docSW=docCW=390, mainSW=mainCW=390, bodySW=390); grid 1 coluna (358px), cards 256px, CTA 160px (min-h-40) ✓; Desktop 1440x900: grid 3 colunas (3×362px) ✓
- Console sem erros de página (só HMR/Fast Refresh da sessão paralela); page errors vazio
- Screenshots: tool-results/shot-13e-home-ana-desktop.png, shot-13e-ana-mobile.png, shot-13e-ana-desktop-completed.png (badge Concluído + Revisar), shot-13e-ana-course-view.png

Stage Summary:
- A home logada ganhou o bloco compacto "Continue aprendendo" logo após o hero: até 3 matrículas priorizadas (em andamento → não iniciadas → concluídas, recência dentro do grupo) em cards verticais no padrão visual dos FeaturedCards (capa h-16 com gradiente+Library como fallback, título, mentor, Progress "X de N aulas concluídas" + %, badge emerald "Concluído" e botão Continuar/Revisar que abre o course-view, que retoma da primeira aula pendente), mais um CTA dashed "Explorar mais cursos" que leva ao marketplace na aba Cursos
- Substituiu a antiga faixa "Continuar de onde parou" (mesma posição/dados) evitando duplicação; fetch existente reutilizado sem nenhum novo request pesado; seção 100% silenciosa para convidado/vazio/carregando; a11y com aria-labelledby/h2, aria-labels nos botões e alvos 44px; mobile 1 coluna sem overflow e desktop 3 colunas
- Único arquivo editado: src/components/platform/landing-mentee.tsx; lint 0/0, tsc limpo em src/, dev server não reiniciado

---
Task ID: 13-g
Agent: frontend-styling-expert
Task: Cupom de desconto no checkout

Work Log:
- Lido worklog (entrada 11-a + 11-b + 12) e contratos de src/lib/api.ts (validateCoupon → CouponValidationDTO { ok, code, label, discount, finalPrice }; checkout com couponCode opcional) + rotas /api/coupons/validate e /api/checkout (já suportam cupom no servidor).
- ARQUIVO ÚNICO editado: src/components/platform/checkout.tsx —
  (1) estados couponInput/couponApplied/couponLoading/couponError + reset ao trocar item (useEffect courseId/trackId);
  (2) applyCoupon: normaliza para maiúsculas, chama api.validateCoupon({ code, courseId|trackId conforme item.kind }), sucesso → estado aplicado e limpa input/erro; erro → mensagem inline e limpa aplicado; removeCoupon volta ao estado inicial;
  (3) UI no resumo do pedido (só no branch item pago price>0): estado inicial = form (Enter aplica) com Label sr-only htmlFor="checkout-coupon", Input h-11 rounded-xl com Tag icon à esquerda (pl-9, font-mono uppercase, toUpperCase no onChange, placeholder "Cupom de desconto") + Button outline h-11 rounded-xl "Aplicar" (loading "Verificando…" com Loader2); erro inline <p aria-live="polite"> text-xs text-rose-600 (min-h para não pular layout); estado aplicado = caixa rounded-xl border-emerald-200 bg-emerald-50/70 p-3 com chip do código (font-mono font-bold, borda emerald-300), label ("10% de desconto"), preço original text-stone-400 line-through + "com desconto" + finalPrice emerald-700 font-extrabold e botão X ghost h-11 w-11 (44px) aria-label "Remover cupom";
  (4) Total reflete desconto: quando aplicado, Total = finalPrice em emerald-700 + linha "Desconto (BEMVINDO10): −R$ 18,90"; botão "Pagar" mostra finalPrice com cupom;
  (5) doPay: payload ganha couponCode: couponApplied?.code || undefined; em erro de cupom (/cupom/i) limpa o cupom aplicado e mostra o erro no fluxo existente (toast + inline no bloco); PIX/cartão, success e tracking intocados;
  (6) formatBRL local com 2 casas fixas para valores com centavos (currencyBRL do projeto usa mínimo 0 casas → "R$ 170,1"; local renderiza "R$ 170,10").
- Cupom BEMVINDO10 NÃO existia (13-f ainda não o havia criado) → criado via `bun -e` + Prisma: mentor Carlos Ferreira (MentorProfile cmtd0bei00009nl06jojy2cta), code BEMVINDO10, percentOff 10, isActive true, maxUses null (id cmtej5rjg0001irshuvulrjga).
- curl POST /api/coupons/validate: BEMVINDO10 + courseId cmtd0beko004qnl06ryuh9539 → {"ok":true,"discount":18.9,"finalPrice":170.1}; "XXXX" → 404 "Cupom inválido para este item.".
- Dev server: ao iniciar a task a porta 3000 NÃO tinha listener (servidor não estava de pé) — subi `bun run dev` (tee dev.log, sem build); o sandbox derrubou processos background entre chamadas e precisei relançar (nunca interrompi um servidor saudável de outro agente deliberadamente).
- E2E browser (agent-browser sessão isolada "t13g" — a sessão default estava sendo usada CONCURRENTMENTE por outro agente, o que causava navegações fantasmas; isolada a partir daí): conta descartável criada via UI de registro: cupom.teste2@demo.com / demo123 ("Aluno Cupom Dois"); fluxo no checkout do curso pago do Carlos "Arquitetura de Software na Prática" (R$ 189): digitou "bemvindo10" → campo exibiu BEMVINDO10 (auto-uppercase ok) → Aplicar → estado aplicado com chip BEMVINDO10, "10% de desconto", R$ 189,00 riscado, R$ 170,10 emerald, Total R$ 170,10, linha "Desconto (BEMVINDO10): −R$ 18,90" e botão "Pagar R$170,10"; aplicar "XXXX" → erro inline "Cupom inválido para este item." (aria-live, text-rose-600); Remover cupom → voltou ao input ("Pagar R$189"); reaplicou → Pagar (PIX) → tela "Pagamento confirmado!".
- Order verificada via `bun -e` (Prisma): amount 170.1, couponCode "BEMVINDO10", discount 18.9, status PAID, paymentMethod PIX; Enrollment criada para a conta de teste; Coupon.uses 0 → 1.
- Mobile 390x844 (segunda conta descartável cupom.teste3@demo.com, "Aluno Cupom Tres", apenas aplicar sem pagar): input+Aplicar e caixa aplicada sem overflow (scrollWidth=clientWidth=390 nos dois estados; caixa aplicada 316px); screenshots em tool-results/shot-31..35 (aplicado desktop, erro, sucesso, mobile).
- Item gratuito "Do Zero a Product Manager": CTA "Inscrever-se gratuitamente" sem checkout e sem bloco de cupom (comportamento intacto).
- Console do browser sem erros (apenas warning pré-existente de Meta Pixel duplicado, do tracking demo).
- Validação estática: `bun run lint` → 0 erros/0 warnings; `bunx tsc --noEmit` → 0 erros em src/ (4 erros pré-existentes somente em examples/ e skills/, fora do escopo).
- Observação p/ task futura: tela de SUCESSO exibe "Total R$ 170,1" (usa currencyBRL do projeto com 0 casas mínimas) — mantida intacta por instrução; vale trocar por formatador com 2 casas quando permitido.

Stage Summary:
- Checkout de itens pagos (curso/trilha, price > 0) ganhou bloco de cupom completo: aplicar (com loading e auto-uppercase), erro inline acessível (aria-live), estado aplicado com chip/label/preço riscado/preço final e remoção com X 44px; desconto refletido no Total e no botão Pagar; couponCode enviado no checkout e persistido na Order (couponCode + discount). Itens gratuitos e o restante do fluxo (PIX/cartão, success, tracking) intocados. Validado E2E com contas descartáveis (registro via UI), desktop 1440x900 e mobile 390x844 sem overflow, console limpo, lint 0/0 e tsc limpo em src/. Cupom BEMVINDO10 (10% do Carlos) criado por mim por não existir ainda; matrícula demo extra apenas nas contas descartáveis cupom.teste2/teste3@demo.com (Ana poupada).

---
Task ID: 13-h
Agent: frontend-styling-expert
Task: Emitir/ver certificado pela sala de aula + integração com a página pública

Work Log:
- ÚNICO arquivo de código alterado: src/components/platform/classroom.tsx
- MODAL ANTIGO REMOVIDO: o Dialog "Certificado de conclusão" (certOpen/setCertOpen, conteúdo rico em JSX, botão de impressão com CSS @media print .certificate-print) era redundante — o conteúdo rico já vive na certificate-view pública. Removidos junto, sem deixar órfãos: estado certOpen, bloco <style> de impressão (só servia ao modal) e imports que ficaram sem uso (Award, Printer do lucide; DialogFooter do ui/dialog). Dialog/DialogContent/Header/Title/Description permanecem (usados pelo dialog de Conteúdos no mobile); formatTotalDuration permanece (usado no header da sala)
- NOVO FLUXO "Emitir certificado" (celebração de 100%): handleIssueCertificate() chama api.issueCertificate(course.id, user.id) com estado issuing (botão disabled + "Emitindo…"); sucesso → toast.success('Certificado emitido! 🎓') + navigate({ name:'certificate', code }) do useAppStore (overlay da sala fecha naturalmente pois a view global muda); erro → toast.error(message) (ex.: 403 "Conclua todas as aulas para emitir o certificado.")
- "Ver meu certificado": quando course.certificateCode existe (já emitido), a celebração troca o botão para outline emerald que navega direto para { name:'certificate', code: certificateCode } — sem chamar issueCertificate de novo. Código extraído para const certificateCode (narrowing de propriedade não sobrevive em closures no TS)
- Header da sala intocado (nenhum indicador extra); player/quizzes/perguntas/notas/anexos/modo foco/navegação/ContentsNav/XP intactos; reviews intocados
- DEMO DATA (via PATCH /api/courses/[id]/enroll, bun one-off tool-results/13h-prep.ts): Ana (ana@demo.com) foi de 2/7 → 7/7 no curso "Do Zero a Product Manager" (Marina) para habilitar a celebração — estado mantido em 100% de propósito (progresso concluído é dado de demo útil); as aulas foram marcadas pela API (não pela UI) e o XP/bônus de curso do servidor foi aplicado normalmente
- Ambiente: dev server estava DOWN ao iniciar a task (porta 3000 recusava conexões); subido com `bun run dev` (tee dev.log) para validação — NENHUMA instância foi reiniciada durante o trabalho. Nota de ambiente: o sandbox encerra processos em background entre chamadas do agente (verificado com setsid/nohup), então o servidor precisa ser relançado pelo orquestrador se estiver fora do ar
- Durante a validação apareceu NO BANCO um certificado pré-existente de OUTRO usuário (Gustavo Novaes Cruz, MH-22563A1AD3, 100% no mesmo curso) — NÃO foi mexido (não é dado da Ana); o certificado da Ana foi emitido pela própria UI no fluxo testado

Validation (curl + browser E2E, desktop 1440x900 + mobile 390x844):
- bun run lint: 0/0; bunx tsc --noEmit: limpo em src/ (só pré-existentes fora de escopo em examples/ e skills/)
- Preparação: Ana confirmada sem curso 100% → PM course completado via API (7/7) → certificateCode null antes do fluxo
- EMITIR (UI): login ana@demo.com → ?course=ID → "Continuar curso" → sala → celebração "Parabéns! Você concluiu este curso 🎉" com ÚNICO botão "Emitir certificado" (emitir=true/ver=false) → clique → toast "Certificado emitido! 🎓" → POST /api/certificates 201 → navegação para a página do certificado (document.title="Certificado — MentorHub"); código gerado: MH-7FA125CD90 (Ana Souza · Do Zero a Product Manager · Marina Costa · Carreira · 2,2h · emitido 2026-08-29)
- VER (UI): reaberta a sala → celebração agora mostra "Ver meu certificado" (outline emerald; emitir=false/ver=true, course.certificateCode veio no CourseDetailDTO) → clique → página pública do certificado renderiza direto ✓
- ANÔNIMO: http://localhost:3000/?cert=MH-7FA125CD90 em sessão isolada SEM login → certificado completo (nome, título, mentor Marina, "2.2h de conteúdo"… carga ok, "Concluído em", bloco "Certificado autêntico" com o código, botões Copiar link/Compartilhar no LinkedIn/Imprimir) — roteamento ?cert= confirmado; GET /api/certificates/MH-7FA125CD90 200
- MOBILE 390x844 (página do certificado): zero overflow horizontal (scrollWidth=clientWidth=390; article 358px) e os 3 botões de ação empilham em 3 linhas (coluna); desktop 1440 sem overflow (1440x1440)
- Console do browser sem erros nas duas sessões; dev.log da rodada final só GETs 200 do certificado (em rodada anterior houve "spawn node EAGAIN" do Next — ruído de ambiente com agentes paralelos, não do app); dev server NÃO reiniciado durante os testes; nenhum teste automatizado criado
- Screenshots: tool-results/shot-13h-classroom-celebration.png, shot-13h-certificate-desktop.png, shot-13h-classroom-ver-certificado.png, shot-13h-certificate-anon-desktop.png, shot-13h-certificate-mobile.png (+ logs/scripts em tool-results/13h-*)

Stage Summary:
- A sala de aula agora integra de ponta a ponta com o certificado público: 100% concluído → "Emitir certificado" (loading "Emitindo…", toast 🎓, navega via store para a view certificate) e, com certificado já emitido, "Ver meu certificado" (outline emerald, navegação direta pelo course.certificateCode). O modal antigo foi totalmente removido sem imports/estados órfãos — o conteúdo rico (copiar link, LinkedIn, imprimir, verificação) é o da certificate-view, acessível também sem login via /?cert=CODE
- Estado final do demo: Ana 7/7 no "Do Zero a Product Manager" com certificado MH-7FA125CD90 emitido (mantido de propósito); certificado de outro usuário (Gustavo) intocado
- Validação completa: lint 0/0, tsc limpo em src/, fluxo emitir→página pública→voltar→ver→página pública testado E2E, ?cert= público confirmado anônimo, mobile sem overflow com botões em coluna, console limpo

---
Task ID: 13-c
Agent: frontend-styling-expert
Task: Sino de notificações in-app no header

Work Log:
- Lidos worklog.md (Tasks 11-c e 11-a/11-b/12: navbar estático h-14 branco sólido, main é o único scroller, padrão stone+emerald, credenciais demo) e contratos antes de codar: api.ts (listNotifications(userId) → {unreadCount, items}; markNotificationsRead(userId, ids?) POST), types.ts (NotificationDTO/NotificationsResponseDTO/NotificationKind), api/notifications/route.ts (GET ordena desc take 30 + unread=readAt null; POST updateMany com ids opcionais), schema (Notification.readAt), store (AppView: dashboard/course/onboarding; UserDTO.id)
- navbar.tsx (ÚNICO arquivo editado): componente local `NotificationsBell` (hooked ao store via selectors user/navigate) renderizado como 1º filho do grupo direito — ordem final: sino → busca mobile → avatar (some junto quando !user; sem login só Entrar/Criar conta)
- Botão sino: h-9 w-9 rounded-full text-stone-500 hover:bg-stone-100 (mesma linguagem do ícone de busca), Bell h-4.5, aria-label dinâmico "Notificações" / "Notificações, N não lida(s)" + title; badge absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white com unreadCount (99+ se >99), aria-live="polite", escondido quando 0
- DropdownMenu controlado (open + onOpenChange): DropdownMenuContent align="end" sideOffset=8 w-88 sm:w-96 p-0 overflow-hidden; header com DropdownMenuLabel "Notificações" + botão texto "Marcar todas como lidas" (disabled quando unreadCount=0, text-emerald-700/disabled stone-300); lista role="list" max-h-[380px] overflow-y-auto com scrollbar fina ([scrollbar-width:thin] + ::-webkit-scrollbar h-1.5 thumb stone-200); itens em div role="listitem" > button (preserva semântica de botão)
- Item: chip circular h-8 w-8 por kind (booking_new→CalendarClock amber, booking_confirmed→CalendarCheck emerald, booking_cancelled→CalendarX rose, booking_completed→CheckCircle2 emerald, review_new→Star amber, lesson_new→ListVideo violet, enrollment_new→UserPlus emerald, course_review_new→MessageSquareQuote violet, purchase_new→ShoppingBag emerald, default Bell stone), título text-sm font-semibold stone-900 (não lida) / stone-500 (lida), body text-xs stone-500 line-clamp-2, tempo relativo local (agora / há N min / há N h / há N d / data pt-BR p/ ≥30d); não lida: bg-emerald-50/50 + dot emerald-500 absolute left-1.5
- Ações: clique no item marca lida otimista (local + POST ids:[item.id] fire-and-forget) e navega por linkView: dashboard→{name:'dashboard'}, course (com refId)→{name:'course', courseId}, onboarding→{name:'onboarding'}; fecha dropdown; sem linkView só marca lida. "Marcar todas": otimista + POST sem ids, rollback do estado local se falhar
- Fetch: inicial no effect (setState em .then com guard alive local + reqIdRef contra race/desmount/troca de fetch), polling setInterval 60s (limpo no unmount), refetch ao abrir o dropdown (onOpenChange true); erro silencioso (catch sem toast — badge apenas não aparece). Nota: rule react-hooks/set-state-in-effect (eslint react-hooks v6) proibiu setState/chamada com setState no corpo do efeito → fetch inicial via .then() callback (mesmo padrão do dashboard.tsx) passou a valer 0/0
- Fix de lint no caminho: 1º erro foi reset sincrono de state no effect (removido — o sino desmonta quando !user, não precisa reset); 2º foi a chamada de loadNotifications no corpo (reestruturado com .then). Erro paralelo 'ContinueCourseCard' is not defined em landing-mentee.tsx apareceu/apareceu-corrigido durante a sessão — trabalho concorrente de outro agente, fora do meu escopo (navbar.tsx sempre limpo)

Validation (bun lint/tsc + agent-browser sessão isolada t13c, desktop 1440x900 e mobile 390x844):
- bun run lint: 0 erros/0 warnings (projeto inteiro); bunx eslint navbar.tsx: limpo; bunx tsc --noEmit: limpo em src/ (só erros pré-existentes em examples/ e skills/)
- Dev server: NÃO estava rodando ao início (porta 3000 sem listener; nenhuma instância next/bun viva) → iniciado UMA única vez (bun run dev, log em dev.log) e não mais tocado; 200 durante toda a validação, dev.log sem ⨯/Error
- Login ana@demo.com/demo123; Ana tinha 0 notificações → sino renderiza, aria-label "Notificações", SEM badge, dropdown com empty state (BellOff stone-300 + "Você está em dia! Nenhuma notificação.") e "Marcar todas como lidas" disabled
- 2 notificações reais inseridas via bun -e/Prisma (userId real da Ana cmtd0behr...0f96): booking_confirmed c/ linkView course+refId (há 5 min) e lesson_new s/ linkView (há 2 h) → reload: badge "2" (bg-rose-500 h-4 min-w-4) e aria "Notificações, 2 não lidas"; painel 384px (sm:w-96) alinhado à direita do trigger (panelRight==triggerRight, top=bottom+8); role list/listitem; ícones lucide-calendar-check (chip emerald-100/emerald-700) e lucide-list-video (violet-100/violet-600); fundos bg-emerald-50/50 + dot emerald; body line-clamp-2; tempos "há 10 min"/"há 2 h"; título não lida quase-preto (stone-900)
- "Marcar todas como lidas": badge some, itens ficam stone-500 sem dot/bg, botão vira disabled, POST 200 e readAt persistido no banco p/ ambas
- 3ª notificação (review_new c/ linkView course + refId curso Arquitetura) → reabrir dropdown = refetch (badge "1", item no topo "há 1 min", Star amber) → clique no item: navega para "Arquitetura de Software na Prática" (curso diferente do atual), dropdown fecha, badge zera otimista, POST ids:[id] 200 com readAt no banco
- Polling 60s comprovado por performance entries: 1 fetch no login → 2 após ~70s (1 tick do intervalo), GET /api/notifications 200
- Mobile 390x844: scrollWidth===clientWidth===390 (zero overflow horizontal) com dropdown aberto; ordem no header confirmada: Notificações → Abrir busca → Menu do usuário; painel 352px (w-88) cabe (0→352) alinhado à direita
- Console sem erros de página (só warning pré-existente de Meta Pixel); estado demo restaurado: as 3 notificações de teste ficaram todas LIDAS (nenhuma não lida)
- Screenshots: tool-results/shot-13c-empty-desktop.png, shot-13c-dropdown-unread-desktop.png, shot-13c-course-nav-desktop.png, shot-13c-dropdown-mobile.png

Stage Summary:
- Header ganhou sino de notificações in-app (só logado) completo: badge rose com contagem/99+, dropdown w-88/sm:w-96 com header "Notificações" + "Marcar todas como lidas", lista com chip de ícone por kind (9 tipos mapeados + default), título/body/tempo relativo, destaque emerald para não lidas, empty state "Você está em dia!", marcação lida otimista (unitária e total) com persistência, navegação por linkView (dashboard/course/onboarding), polling de 60s + refetch on-open com guard anti-race e erro silencioso
- Zero mudanças fora de navbar.tsx; paleta stone+emerald com acentos por kind e rose só no badge; validado desktop+mobile sem overflow e com console limpo

---
Task ID: 13-f
Agent: frontend-styling-expert
Task: Painel do mentor — duplicar curso, aba Financeiro e aba Cupons

Work Log:
- Lido worklog.md (entrada 11-c: painel em abas controladas [tab,setTab], PANEL_TABS/PANEL_SHORTCUTS, grid lg:grid-cols-[220px_minmax(0,1fr)]; 13-g: cupom BEMVINDO10 10% do Carlos já no banco + order real R$170,10; 13-c/13-h: padrões stone+emerald) e contratos ANTES de codar: api.ts (duplicateCourse, finance, listCoupons/createCoupon/toggleCoupon/deleteCoupon), types.ts (FinanceDTO, CouponDTO), rotas /api/coupons, /api/mentors/finance, /api/courses/[id]/duplicate; helpers currencyBRL/firstName; helper local copyToClipboard já existente no arquivo
- ARQUIVO ÚNICO editado: src/components/platform/onboarding.tsx
- TAREFA 1 (CoursesManager): estado duplicatingId + handleDuplicate (api.duplicateCourse → toast.success('Curso duplicado como rascunho — ajuste e publique!') → refreshAll() = mecanismo de reload existente) + botão ghost size="icon" Copy (Loader2 animate-spin enquanto duplica; disabled) nas ações de cada curso, entre "Aulas" e Editar, aria-label "Duplicar curso {título}"
- TAREFA 2 (aba Financeiro): PANEL_TABS ganhou { id:'financeiro', label:'Financeiro', icon:Wallet } DEPOIS de Divulgação (10 abas: overview, perfil, agenda, mural, cursos, biblioteca, trilhas, divulgacao, cupons, financeiro); PANEL_SHORTCUTS ganhou "Financeiro" (Wallet, "Receita, pedidos e resultados."); FinancePanel({ userId }): fetch api.finance no mount via .then() padrão do projeto (guarda `active` anti-race; reloadKey para retry) — skeletons (4 cards h-24 + gráfico h-40), erro → card com botão "Tentar novamente" (RefreshCw), empty state (ordersCount===0 && sessionsCount===0 → Wallet stone-300 + "Sem vendas por aqui ainda" + "Compartilhe seu link na aba Divulgação 🚀"); 4 KPI cards reutilizando OverviewKpi (grid-cols-2 lg:grid-cols-4): Receita total (span text-emerald-700 destaque + footer produtos/sessões), Últimos 30 dias, Ticket médio, Sessões 1:1 (sessionsCount + footer sessionsRevenue formatado); linha secundária "N pedidos pagos · descontos concedidos: R$ X"; gráfico de barras CSS puro (Card "Receita por mês": flex h-40 items-end gap-2/3, 6 colunas flex-1 com barra rounded-t-md bg-emerald-600/85 altura % de revenue/max dentro de caixa flex-1 items-end — sem overflow — mín 4%, valor acima quando >0 com truncate, label mês text-[10px] uppercase, role="img" + aria-label "AGO: R$ X" + title por barra); "Por produto" (byProduct até 8, grid lg:grid-cols-2 com Pedidos recentes): line-clamp-1 + N pedidos + receita à direita; "Pedidos recentes": itemTitle line-clamp-1 + data pt-BR + channel via CHANNEL_LABELS EXISTENTE do TrafficPanel (reutilizado, cai no cru se desconhecido) + chip cupom <code> mono + −desconto em rose quando >0; helper local formatBRL (toLocaleString pt-BR 2 casas — currencyBRL do projeto trunca para 1: "R$ 170,1" vs novo "R$ 170,10")
- TAREFA 3 (aba Cupons): PANEL_TABS ganhou { id:'cupons', label:'Cupons', icon:Ticket } ANTES de Financeiro; PANEL_SHORTCUTS ganhou "Cupons" (Ticket, "Códigos de desconto para vender mais."); CouponsManager({ userId }): Card com a descrição pedida + form (Código auto-uppercase font-mono placeholder "PRIMEIRA2025"; Select Percentual (%)/Valor fixo (R$) que troca label/step do input; Input valor type=number; usos máximos opcional placeholder "Ilimitado"; validade opcional type=date; botão "Criar cupom" rounded-full bg-emerald-700 com Loader2 "Criando..."); validação client inline aria-live (código ≥ 4, valor > 0), erros do servidor via toast; lista com card por cupom: chip <code> mono bold + botão Copy (copyToClipboard → toast 'Código copiado!'), desconto legível ("10% de desconto" / "R$ 30,00 de desconto"), usos ("1 uso"/"0 de 50 usos"), validade ("expira em dd/mm/aaaa" — data UTC da própria string p/ evitar deslocamento de fuso — / "sem validade"), Badge Ativo emerald / Pausado stone, pausar/reativar (PauseCircle/PlayCircle, aria-label dinâmico, toast 'Cupom pausado.'/'Cupom reativado!'), excluir (Trash2 + AlertDialog "Excluir cupom?" → toast 'Cupom excluído.'); empty state (Ticket stone-300 + "Nenhum cupom ainda — crie o primeiro e divulgue na sua audiência.")
- Imports adicionados: Loader2, PauseCircle, PlayCircle, Ticket, Wallet (lucide) + tipos CouponDTO/FinanceDTO; TabsContent "cupons" e "financeiro" adicionados após "divulgacao" com className="min-w-0 mt-4 sm:mt-6"; novos components inseridos entre OverviewKpi e a View principal; NENHUM outro arquivo tocado

Validation (bun lint/tsc + agent-browser sessão isolada t13f, desktop 1440x900 + mobile 390x844):
- bun run lint: 0 erros/0 warnings; bunx tsc --noEmit: limpo em src/ (só pré-existentes em examples/ e skills/). Correção no caminho: tsc flagrou redeclaração de CHANNEL_LABELS (já existia no TrafficPanel) → removida a minha duplicata e reutilizado o mapa existente (paid_social→"Tráfego pago social", direct→"Direto"…)
- Preparação verificada: curl GET /api/mentors/finance?userId=cmtd0behz0007nl0620khg3t9 → totalRevenue 1077.1, ordersCount 4, sessionsCount 1, last30 897.1, avgTicket 224.28, totalDiscount 18.9, AGO 897.10; BEMVINDO10 no banco (10%, ativo, uses 1) — nada recriado
- Login carlos@demo.com/demo123 → "Painel do mentor" com 10 abas; Visão geral com 9 atalhos incluindo os 2 novos
- DUPLICAR: aba Cursos → botão "Duplicar curso Arquitetura de Software na Prática" (Copy icon) → toast "Curso duplicado como rascunho — ajuste e publique!" + linha "Arquitetura de Software na Prática (cópia)" com badge Rascunho/botão Publicar (não publicado); dialog "Aulas do curso" da cópia: "· 9 aulas" com aulas/temas clonados (Bem-vindo, Fundamentos, Camadas e fronteiras, Refatoração ao vivo, Modelagem, Cache, Encerramento) ✓; cópia EXCLUÍDA em seguida (AlertDialog) → toast "Curso excluído." e banco confirma só o curso original publicado
- CUPONS: BEMVINDO10 listado com "Ativo", "10% de desconto", "1 uso · sem validade"; Copiar código → clipboard recebe "BEMVINDO10" + toast "Código copiado!" (headless sem permissão de clipboard exige stub p/ toast de sucesso; caminho de erro também valida com toast); Pausar → toast "Cupom pausado." + Badge Pausado + DB isActive=false; Reativar → toast "Cupom reativado!" + Ativo; validação client: código "ab" + valor 0 → inline "O código precisa de ao menos 4 caracteres."; cupons de teste TESTE13F (R$ 30 fixo, 0 de 50 usos, expira em 31/12/2026), TESTEXP (5%) e TESTDATA (15% com validade) criados, verificados e EXCLUÍDOS; estado final do banco: apenas BEMVINDO10 isActive=true
- FINANCEIRO: KPIs renderizam os dados reais (R$ 1.077,10 emerald-700, R$ 897,10, R$ 224,28, 1 sessão/R$ 180,00) + "4 pedidos pagos · descontos concedidos: R$ 18,90"; gráfico com barra AGO em altura proporcional (128px vs 6px mín nos meses zerados) e aria-labels "AGO: R$ 897,10"; Por produto (Arquitetura R$ 548,10/3 pedidos; Trilha R$ 349,00/1 pedido); Pedidos recentes: order real da 13-g em 29/08/2026 · Direto · chip BEMVINDO10 · −R$ 18,90 · R$ 170,10 + 3 orders seeded
- ATALHOS: "Ir para a aba Financeiro" e "Ir para a aba Cupons" testados a partir da Visão geral → trocam de aba corretamente
- Desktop 1440x900: docScrollWidth=docClientWidth=1440 em Cursos/Cupons/Financeiro; Mobile 390x844: sw=cw=390 (zero overflow) nas abas; faixa de abas rolável com 10 tabs (scrollWidth 1172 > clientWidth 356) e última aba alcançável/clicável após rolar
- Console sem erros de página (só logs de Fast Refresh das minhas edições); dev server NÃO reiniciado (200 em todas as checagens); nenhum teste automatizado criado
- Screenshots: tool-results/shot-13f-desktop-cursos-duplicar.png, shot-13f-desktop-cupons.png, shot-13f-desktop-financeiro.png (+full), shot-13f-mobile-overview.png, shot-13f-mobile-financeiro.png, shot-13f-mobile-cupons.png

Stage Summary:
- Painel do mentor agora com 10 abas: Cursos ganhou "Duplicar" (copia título " (cópia)", descrição, categoria, nível, preço, capa e mentorshipCount, sempre como RASCUNHO; clona temas, aulas (vídeo/texto/live com anexos e ordem) e quizzes das aulas; matrículas/progresso NÃO) com toast + refresh; nova aba Cupons com CRUD completo (criar com validação client, copiar código, pausar/reativar, excluir com AlertDialog, empty state); nova aba Financeiro com 4 KPIs, linha de pedidos/descontos, gráfico de barras CSS dos últimos 6 meses, Por produto e Pedidos recentes (com cupom/desconto), retry em erro e empty state; Visão geral com 2 atalhos novos (9 no total)
- BEMVINDO10 do Carlos permaneceu ATIVO e único cupom no banco; cópia de teste do curso excluída (demo limpo); valores financeiros exibidos com 2 casas via formatBRL local
- Validado: lint 0/0, tsc limpo em src/, E2E desktop+mobile sem overflow, console limpo, dev server preservado

---
Task ID: 13-d (concluída pelo agente antes de cair; validação e registro pelo orquestrador)
Agent: frontend-styling-expert (código) + main (validação)
Task: Avaliações de curso — seção pública, formulário do aluno e chips de nota nos cards

Work Log:
- course-view.tsx: seção "Avaliações dos alunos" (resumo com nota grande + Stars + barras de distribuição por estrela; lista de reviews com Avatar/nome/data), formulário "Avaliar este curso" no modo inscrito (5 estrelas clicáveis, comentário até 800 caracteres com contador, pré-preenchido com myReview; botão alterna "Enviar"/"Atualizar minha avaliação"; destaque "Você concluiu o curso! Deixe sua avaliação ⭐" quando 100% sem review); envio via api.saveCourseReview com atualização otimista do reviewSummary/myReview locais
- marketplace.tsx: chip de nota do CURSO nos cards (Star fill-amber-400 + rating pt-BR + title "N avaliação(ões) do curso") quando reviewCount > 0; ordenações atualizadas para desempate por rating do curso (aba Cursos, aba Tudo, spotlight)
- Obs: o agente completou o código mas caiu (timeout de infra) antes de validar/registar; estado deixado compilando limpo — validação E2E feita pelo orquestrador

Validation (pelo orquestrador, browser):
- Ana com review 4★ "Curso excelente!..." salva no curso da Marina: formulário pré-preenchido ("Sua avaliação está salva — você pode atualizá-la quando quiser."), seção pública com resumo 4,0 + distribuição (4★:1) e a review com tag "VOCÊ" ✓
- Explorar → chip "4,0" com title "1 avaliação do curso" no card do curso ✓; cards sem review permanecem limpos ✓
- bun run lint 0/0; tsc limpo em src/

Stage Summary:
- Cursos agora têm nota própria (≠ nota do mentor): aluno avalia (uma por curso, editável), resumo + distribuição na página, chips nos cards do Explorar e ordenação "Populares" usando a nota

---
Task ID: 13 (pacote completo: 13-a backend + 13-b contratos/wiring + 13-c…13-h frontend + 13-i integração)
Agent: main (Z.ai Code) + frontend-styling-expert (13-c, 13-d, 13-e, 13-f, 13-g, 13-h)
Task: Notificações in-app · Continue aprendendo · Reviews de curso · Certificado público · Financeiro · Cupons · Duplicar curso · Título dinâmico

Work Log:
- [13-a SCHEMA] Notification (kind/title/body/linkView/refId/readAt + índices), CourseReview (@@unique courseId+studentId, editável), Certificate (code @unique, @@unique courseId+studentId), Coupon (mentorId+code único, percentOff/amountOff, maxUses/uses, expiresAt, isActive); Order ganhou couponCode/discount → db:push + db:generate + restart limpo do dev (rm -rf .next após cache stale do Turbopack)
- [13-a APIs] /api/notifications (GET lista+unreadCount, POST mark-read); /api/courses/[id]/reviews (GET resumo+lista, POST upsert com inscrição obrigatória + notify); /api/certificates (POST emite com 100% das aulas, code MH-XXXXXXXXXX) e /[code] (GET público: aluno/curso/mentor/carga); /api/coupons (GET/POST/PATCH/DELETE CRUD do mentor) + /validate; /api/mentors/finance (receitas products+sessions, mês a mês 6m, por produto, pedidos recentes, descontos); POST /api/courses/[id]/duplicate (copia como RASCUNHO com temas+aulas+quizzes, título "(cópia)")
- [13-a EVENTOS] src/lib/notify.ts (helper à prova de falhas): booking_new→mentor; confirm/cancel/complete→outra parte; review_new→mentor; lesson_new→até 200 inscritos; enrollment_new→mentor; course_review_new→mentor; purchase_new→mentor (checkout)
- [13-a CHECKOUT] cupom validado server-side nos 2 branches (curso/trilha), desconto gravado no Order, uses incrementado; valores de conversão com amount final
- [13-b WIRING] types.ts (NotificationDTO, CourseReviewDTO/Response, CertificateDTO, CouponDTO/Validation, FinanceDTO, CourseListItemDTO.rating/reviewCount, CourseDetailDTO.reviews/reviewSummary/myReview/certificateCode); api.ts (12 métodos novos + couponCode no checkout); store: view {name:'certificate', code}; page.tsx: case certificate (dynamic import), bootstrap aceita ?cert=CODE, título dinâmico por view
- [13-c…13-h] 6 tarefas de frontend em paralelo via subagentes (entradas próprias abaixo/acima): sino no navbar, reviews UI, continue aprendendo, painel (duplicar+Financeiro+Cupons), cupom no checkout, certificado na sala
- [13-i INTEGRAÇÃO] fix currencyBRL truncando na tela de sucesso do checkout (formatBRL 2 casas); BUGFIX título: efeito imperativo era revertido pela reconciliação de metadados do Next/React 19 na carga inicial com navegação por URL — resolvido com reafirmação por 3s (interval 500ms auto-limpo) após cada troca de view; testado <title> hoisted declarativo (conflitava com o metadata <title> — descartado); cache stale do Turbopack diagnosticado (chunks sem código novo) e resolvido com restart + rm -rf .next

Validation (browser E2E final, desktop 1440x900 + mobile 390x844):
- Loop completo comprovado ao vivo: Ana comprou o curso do Carlos com cupom BEMVINDO10 (R$ 189 → R$ 170,10, Order com couponCode/discount, uses 0→1) → Carlos recebeu notificação "Nova venda 🤑" (badge 1, dropdown com chip emerald, corpo com cupom) ✓
- Home logada (Ana): "Continue aprendendo" com 2 matrículas (1/9 em andamento → Continuar; 7/7 → badge Concluído + Revisar) + CTA "Explorar mais cursos" ✓
- Reviews: formulário pré-preenchido da Ana (4★, atualizável), seção pública com resumo/distribuição, chip "4,0" no card do Explorar ✓
- Certificado: /?cert=MH-7FA125CD90 público renderiza (nome com gradiente, curso, mentor Marina, 2,2h, "Certificado autêntico", copiar link/LinkedIn/imprimir) ✓
- Painel do Carlos: 10 abas; Financeiro com KPIs reais (Receita total R$ 1.077,10 · 4 pedidos · gráfico 6 meses · por produto · pedidos recentes com cupom e desconto); Cupons com BEMVINDO10 ativo (1 uso) + CRUD testado; duplicar curso gerou "(cópia)" rascunho com 9 aulas (depois excluída) ✓
- Títulos por view em todos os caminhos (home/Explorar/?cert) ✓; sino presente no mobile com dropdown ok; sw=cw=390 sem overflow ✓
- bun run lint 0/0; bunx tsc limpo em src/; dev.log saudável; servidor no ar (200)

Stage Summary:
- Plataforma ganhou o ciclo de retenção e o ciclo de venda: notificações puxam o usuário de volta (agendamento/confirmação/aula nova/venda/avaliação), "continue aprendendo" reduz fricção de retorno, reviews de curso criam prova social, certificado público vira marketing, e o mentor agora tem financeiro real + cupons + duplicação de curso
- Pendências conhecidas para próximas rodadas: PWA instalável, mensagens/chat 1:1, modo escuro, contas de teste descartáveis deixadas no banco (cupom.teste2/teste3@demo.com — inofensivas)
---
Task ID: 14-c-a
Agent: frontend-styling-expert
Task: Dark mode — área A (footer, landing-mentee, landing-mentor, mentor-lp)

Work Log:
- Lido worklog.md (tarefas 13: padrões stone+emerald do marketing/painel; worklog não registrava ainda a tarefa 14 — ThemeProvider confirmado em src/app/layout.tsx com attribute="class", tokens .dark presentes em globals.css, ui primitives usam tokens bg-card/bg-accent/bg-primary e se adaptam sozinhos) e lidos na íntegra os 4 arquivos do escopo antes de editar
- ADDITIVE ONLY: apenas classes dark: acrescentadas ao final das strings de className existentes; verificação automatizada via git diff -U0 + strip de tokens dark: provou que TODAS as linhas editadas preservam 100% do conteúdo light original (0 linhas perdidas; JSX/lógica/textos/aria intocados); nenhum outro arquivo tocado
- footer.tsx: faixa do rodapé dark:bg-stone-950 + dark:border-stone-800 (topo e divisória interna), marca dark:text-stone-50, textos stone-500→dark:text-stone-400, headings uppercase stone-400→dark:text-stone-500, links stone-600→dark:text-stone-300 com dark:hover:text-emerald-300, ícones dark:text-stone-500, copyright dark:text-stone-500
- landing-mentee.tsx (home): root dark:bg-stone-950; blobs decorativos emerald → dark:bg-emerald-950/50 (e glow do hero dark:from-emerald-950/60 dark:via-emerald-950/30); chips/botões de categoria com dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 + hovers dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300; Input de busca com dark:bg-stone-900 dark:placeholder:text-stone-500 dark:focus-visible:ring-emerald-900/40 dark:focus-visible:border-emerald-700; bandas alternadas bg-stone-50/50-60 → dark:bg-stone-900/60 com dark:border-stone-800; seção stats (emerald-950 sólida) e CTA escuro mantidos como estão; cards (passos, features, depoimentos, FAQ, cards de destaque/continue) → dark:bg-stone-900 dark:border-stone-800 dark:hover:border-emerald-700; anéis: ring-white→dark:ring-stone-900/950 conforme contexto, ring-emerald-100→dark:ring-emerald-900/40; gradiente do tile de vídeo ganhou dark:ring-white/10; FAQs/dividers/divide-stone-100→dark:divide/border-stone-800; trilhas: badge teal → dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300; badges emerald-50/100 → dark:bg-emerald-950/50 + dark:text-emerald-300; preços "Grátis"/pagos no cn() com dark:text-emerald-300/dark:text-stone-50
- landing-mentor.tsx: root dark:bg-stone-950; pill/hero, mock de UI (card+chips+cards flutuantes) → dark:bg-stone-900/sticky stone-950/50 em chips internos; Card da calculadora dark:border-stone-800 (bg vem do token bg-card) com painel de estimativa dark:bg-stone-950/50; steps/benefícios/depoimento/FAQ com mapeamento completo stone/emerald; CTA final emerald-950 sólido mantido (botão bg-white text-emerald-950 intacto)
- mentor-lp.tsx: seção hero dark:bg-stone-900 dark:border-stone-800; chips de credenciais/badges verificados dark:bg-stone-900 ou emerald-950/50 conforme cor; SocialButton e cards de curso com dark:hovers emerald-900/30 + dark:hover/focus-within:border-emerald-700; mural dark:divide-stone-800 dark:bg-stone-900 + fallback local de meta.dark (CONTENT_TYPE_META de helpers.ts fora do escopo — só o fallback inline do arquivo recebeu dark); depoimentos dark:bg-stone-900; CTA final e barra de prova (emerald-950) mantidos; rodapé fino dark:border-stone-800 dark:text-stone-500
- Intencionalmente intactos: navbar.tsx, messages-view.tsx, layout.tsx, globals.css, ui/*, imagens/avatares/gradientes de capa (avatarGradient, overlay from-stone-900/70 sobre capa), bandas sólidas emerald-950 (stats, CTAs, prova social) e seus textos emerald-100/200, gradientes com paradas emerald (regra: manter esmeralda, escurecer só stone/white), estilo inline do padrão de pontos do hero

Stage Summary:
- Área A (marketing/shell) 100% dark-mode-ready: footer, home do mentorado, página "para mentores" e LP pública do mentor alternam corretamente entre stone-950 (página), stone-900/60 (bandas), stone-900 (cards) e stone-950/50 (insets), com acentos emerald seguindo o mapa de cores compartilhado; tema claro byte a byte idêntico ao anterior (comprovado por diff automatizado)
- 354 classes dark: adicionadas no total (footer 15, landing-mentee 192, landing-mentor 61, mentor-lp 86) em 243 linhas; zero remoções/renomeações de classes light, zero mudanças de estrutura/lógica/texto/aria
- Validação: eslint nos 4 arquivos → 0 erros/0 warnings; bun run lint do projeto tem 1 erro+1 warning PRÉ-EXISTENTES/paralelos em navbar.tsx (setState em effect do ThemeToggle) e messages-view.tsx (directive não usada) — fora do meu escopo; bunx tsc --noEmit limpo em src/ (só pré-existentes em examples/ e skills/); http://localhost:3000 → 200, dev server não reiniciado
Report back: 15 dark: no footer.tsx, 192 na landing-mentee.tsx, 61 na landing-mentor.tsx, 86 no mentor-lp.tsx (total 354). Lint dos meus arquivos 0/0, tsc limpo em src/, servidor 200. Deixei intocados: navbar/messages-view (agentes paralelos), bandas sólidas emerald-950 e seus textos, imagens/avatares/capas, gradientes com paradas emerald, CONTENT_TYPE_META (helpers.ts fora do escopo — recebeu dark apenas no fallback local do mentor-lp).
---
Task ID: 14-c-c
Agent: frontend-styling-expert
Task: Dark mode — área C (onboarding/painel, library-manager, tracks-manager, dashboard)

Work Log:
- Lido worklog.md (contexto: ThemeProvider next-themes attribute="class" já no layout, tokens .dark no globals.css, padrão de classes dark: do navbar/page.tsx dos agentes paralelos) e inventariado 100% das ocorrências de cor nos 4 arquivos alvo antes de editar (survey por regex de tokens bg/text/border/ring/fill/divide/hover:/group-hover:/[&::-webkit-scrollbar-*]:)
- Abordagem: script Node determinístico (tool-results/darkify.mjs, fora de src/) que só INSERE classes dark: ao lado das classes claras existentes — tabela explícita token→dark (exatamente o color mapping da tarefa), processamento por linha, token-longest-first, guardas de fronteira (não casa dentro de hover:/dark:/data-[...]:) e skip se a dark class já existe na linha. Nenhuma classe clara removida/alterada, nenhum JSX/lógica/texto/aria tocado
- onboarding.tsx (347 dark:): KPI cards (OverviewKpi/TrafficKpiTile bg-white→dark:bg-stone-900), atalhos (bg-white→stone-900, hover:border-emerald-300→dark:hover:border-emerald-700, chevron stone-300→dark:stone-600 + group-hover emerald→dark:400), TabsList strip (bg-white→stone-900, border→stone-800, scrollbar thumb/track→stone-700/800; trigger hover:bg-stone-100→dark:800; data-[state=active] emerald-700 sólido mantido), FontPicker (prévia, chips emerald/teal, opções ativas bg-emerald-50/40→dark:emerald-950/50, segmented bg-stone-50→dark:stone-950/50, bg-emerald-950 sólido mantido), formulários (labels, erros text-rose-600→dark:rose-400, chips de categoria), agenda (badges de horário, hover:bg-emerald-200/70→dark:hover:emerald-900/40), mural/cursos/biblioteca/trilhas managers (listas, badges Publicado/Rascunho, empty states, popover de temas, anexos), quiz dialog (opção correta emerald-300/50/900→dark:700/950-50/300, números bg-stone-200→dark:800), divulgação (TrafficLinksSection/Panel: listas divide-stone-100→dark:800, gráfico de barras bg-emerald-200→dark:bg-emerald-800 com legenda, bg-emerald-600 mantido), cupons (chips <code> bg-stone-100→dark:800, Ativo/Pausado), financeiro (KPIs, gráfico bg-emerald-600/85 mantido, pedidos recentes com cupom e desconto rose), upload placeholders bg-stone-50→dark:stone-950/50, scrollbars customizadas mapeadas
- library-manager.tsx (56): card principal, lista bg-white→stone-900, badges Livro(amber)/Artigo(emerald)/Publicado/Rascunho, radio de tipo (borda ativa emerald-500/amber-500 mantida, fundos suaves→950/50), capa/upload, erros, hover de exclusão rose
- tracks-manager.tsx (51): mesma base + badge de categoria teal (border-teal-200/bg-teal-50/text-teal-700→dark:teal-900/950-50/300), bloco de mentoria bg-stone-50/60→dark:stone-950/50, lista de itens
- dashboard.tsx (72): EmptyState (círculo stone-100→dark:800), PendingRequestRow (card bg-white→stone-900 com borda amber-200→dark:900), BookingCard (chips Como mentor/aluno, statusMeta fallback stone→dark:800/300, botão Cancelar ghost rose→dark:rose-950-50/400), estrelas de avaliação (fill-stone-200/text-stone-300→dark:800/600; fill-amber-400 mantido), XpJourneyCard (bg-white→stone-900, Flame laranja bg-orange-100→dark:orange-950-50/text→400, amber-600→400, amber-500/trophy mantidos), Card de solicitações (bg-amber-50/70→dark:amber-950/50, border-amber-300→dark:800, text-amber-800/90→dark:amber-300/90), CountPills (emerald-100/amber-100/stone-200→950-50/950-50/800), EnrolledCourseCard/MyTrackCard (badge Concluído, badge teal da trilha, text-stone-500 dos contadores); AlertDialogs bg-rose-600 sólidos e meeting/avatars/gradientes intocados
- BUGFIX próprio no caminho: dashboard line 783 o script anexou dark:bg-amber-950/50 antes do sufixo /70 (virou "/50/70") — corrigido manualmente para bg-amber-50/70 dark:bg-amber-950/50; verificação final das 319 linhas alteradas prova que remover os tokens dark: reproduz a linha original byte a byte (tool-results/verify-additive.mjs → 0 problemas)

Validation (bun lint + tsc + curl):
- bun run lint: 0 erros/0 warnings nos 4 arquivos desta tarefa (os 2 problemas reportados são de navbar.tsx [erro set-state-in-effect do ThemeToggle] e messages-view.tsx [warning unused-disable] — arquivos de outros agentes, fora do meu escopo, não tocados)
- bunx tsc --noEmit: limpo em src/ (só os pré-existentes em examples/websocket e skills/, fora de escopo)
- curl http://localhost:3000/ → 200 (3x seguidas); dev.log sem erros de compilação — hot reload aplicou os 4 arquivos; servidor NÃO foi reiniciado

Stage Summary:
- Área C (painel do mentor com 10 abas + biblioteca + trilhas + minhas sessões do aluno) totalmente dark-ready: superfícies stone-950/900/800, bordas 800/700, texto 50→600, estados emerald/amber/rose/teal/orange suaves em 950/50 com texto 300/400, sólidos emerald/rose mantidos, scrollbars customizadas escuras
- Dif garantidamente aditivo (script + verificador automático): tema claro pixel-idêntico ao anterior
- Pendências p/ orquestrador: lint error pré-existente em navbar.tsx (react-hooks/set-state-in-effect no mount do ThemeToggle) e warning em messages-view.tsx — pertencem às tarefas 14-a/14-b
Report back: onboarding.tsx 347 dark: · library-manager.tsx 56 · tracks-manager.tsx 51 · dashboard.tsx 72 (total 526); lint/tsc limpos nos meus arquivos; intencionalmente intocados: imagens/capas/avatares e avatarGradient, sólidos (bg-emerald-600/700, bg-emerald-950, bg-rose-600, text-white, focus-visible:ring/outline emerald-500/600/700, fill/text-amber-400, text-amber-500, text-orange-500, border-emerald-400/500/600, ring-emerald-500/30, shadow-emerald-600/20), tokens de tema (muted-foreground/bg-background) e qualquer arquivo fora da minha lista.

---
Task ID: 14-c-d
Agent: frontend-styling-expert
Task: Dark mode — área D (classroom, reader, certificate, meeting, mentor-profile, auth)

Work Log:
- Lido worklog.md (Task 14: ThemeProvider next-themes attribute="class" no layout, tokens .dark no globals.css, ThemeToggle no navbar) e os 6 arquivos-alvo por completo antes de editar; padrão de convenção copiado dos agentes paralelos (navbar/messages/footer): dark: classes adicionadas ao FIM da string, dark: antes de data-[...] e de [&::-webkit-scrollbar...], tokens de variante empilhados em qualquer ordem (Tailwind 4)
- APENAS classes dark: adicionadas — nenhuma classe light removida/alterada, nenhum JSX/lógica/texto/aria mudado, nenhum arquivo fora da lista
- auth-view.tsx (46 dark:): página dark:bg-stone-950 (lado do formulário), card do form dark:border-stone-800 dark:bg-stone-900, TabsList dark:bg-stone-800, TabsTrigger dark:data-[state=active]:bg-stone-900/text-stone-50, labels/textos/erros/hints/divisor mapeados, botões olho, link "Esqueceu a senha" (emerald-300), chips de contas demo (dark:hover:bg-emerald-900/30, border-emerald-700) e scrollbar thumb dark:[&...]:bg-stone-700; painel esmeralda da esquerda intocado (gradiente de marca funciona nos 2 temas)
- certificate-view.tsx (20 dark:): só o "chrome" — botões Copiar link/LinkedIn/Imprimir (dark:bg-stone-900 dark:text-stone-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/30), estado "não encontrado" e linha de rodapé; o PAPEL do certificado (<article> com nome em gradiente, selos, caixa de verificação bg-stone-50) permanece BRANCO no dark (documento imprimível) — zero dark: dentro do article
- meeting-room.tsx (26 dark:): banner âmbar PENDING (dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200), caixa de sessão encerrada (dark:bg-stone-800), divisor, inset de duração (dark:bg-stone-950/50), nomes/dicas, card emerald do mentor (dark:bg-emerald-950/50 + textos emerald-200/300); painel de vídeo JÁ era escuro (stone-950/900/800) — intocado
- reader-view.tsx (50 dark:): superfície dark:bg-stone-950, caixas de erro/bloqueio em dark cards, artigo editorial (títulos stone-50, corpo stone-200, descrição stone-400), card do autor, chips de cursos vinculados e cards "Continue lendo" (KIND_META.badge ganhou dark:border-900 dark:bg-x-950/50 dark:text-300 via acréscimo na própria string), thumb bg-stone-800; IFRAME DO PDF e hint de download intocados (páginas do PDF continuam brancas, renderização nativa); top bar esmeralda já escura — badgeDark strings preservadas
- mentor-profile.tsx (100 dark:, className strings APENAS — nenhum botão/elemento adicionado ou removido): banner/capa (bg-stone-900), chips de rating âmbar, 4 badges outline (dark:border-stone-700), botões sociais, TabsList, tiles emerald do "Sobre", cards do mural/cursos/avaliações (border dark), linhas de horários (bg-white→dark:bg-stone-900 / bg-stone-50→dark:bg-stone-950/50), BookingWidget completo (dias/slots inativos dark:bg-stone-900, resumo emerald-950/50, dialog de confirmação), fallback de capa bg-stone-800; capas/avatares/fotos intocados
- classroom.tsx (225 dark:): raiz dark:bg-stone-950 (bate com o overlay dark do page.tsx), sidebar dark:bg-stone-900, todas as superfícies brancas → dark cards (material, Q&A, anotações, quiz, anexos, empty states), TabsList/badges de tipo (rose/amber/violet/emerald soft → dark:bg-x-950/50 + dark:text-x-300/400), aula atual na lista (dark:border-emerald-700 dark:bg-emerald-950/50), opções de quiz (correta/errada/selecionada/travada com ladder 900→200, 800→300, 600/700→400), celebração de 100%, ContentsNav (hovers dark:hover:bg-stone-800, scrollbars dark), dialogs; player de vídeo/LivePanel (já stone-950) e IFRAME do PDF do material intocados; anotações save-state mapeado
- Ladder aplicado (tabela da task): stone 50/100/200→800/900(/60·/50), 300→700 (borda); texto stone-900/950→50, 700/800→200, 600→300, 500→400, 400→500, 300→600; emerald 600→400, 700/800→300, 900→200 (900 sem cobertura na tabela), border 100/200→900, 300/400→700, sólidos intocados; amber/rose/violet soft → x-950/50 com texto 300/400 (900→200); hover:bg-emerald-50→dark:hover:bg-emerald-900/30 (e /40 na variante com opacidade)

Validation (bun run lint + bunx tsc + curl):
- bun run lint: 0 problemas nos 6 arquivos (bunx eslint <os 6 arquivos> limpo). O projeto inteiro reporta 1 erro + 1 warning PRÉ-EXISTENTES de outros agentes — navbar.tsx:145 (react-hooks/set-state-in-effect no ThemeToggle da Task 14-a) e messages-view.tsx:107 (eslint-disable não usado) — fora do meu escopo e proibidos de tocar
- bunx tsc --noEmit: limpo em src/ (só erros pré-existentes em examples/ e skills/)
- Dev server NÃO reiniciado: curl / → 200, /?cert=MH-7FA125CD90 → 200, dev.log sem ⨯/Error
- CSS compilado conferido (chunk do Turbopack, 256KB): dark:bg-stone-900/950, dark:data-[state=active]:bg-stone-900 e :text-stone-50 (regra .dark\:...\:is(.dark *)[data-state="active"] presente), dark:[&::-webkit-scrollbar-thumb]:bg-stone-700, dark:hover:bg-emerald-900/30 e /40, dark:bg-violet-950/50, dark:decoration-stone-600, dark:text-rose-200 — variantes empilhadas compilam corretamente
- Verificação anti-omissão: varredura de todas as linhas com tokens light sem dark: — restantes apenas as intencionais (paper do certificado, iframes de PDF, painéis de vídeo já escuros, brancos sobre gradientes de marca/vídeo)

Stage Summary:
- Área D 100% dark-mode-ready de forma aditiva: sala de aula imersiva (player escuro + sidebar/abas/quiz/notas/anexos em dark cards), leitor (chrome escuro, PDF e artigo mapeados, PDF nativo intacto), certificado público (chrome escuro, papel branco preservado para impressão), sala de reunião, perfil público do mentor com agendamento e login/cadastro split-screen
- 467 classes dark: adicionadas (classroom 225, mentor-profile 100, reader 50, auth 46, meeting 26, certificate 20); light theme bit-a-bit idêntico ao anterior; contratos de cor seguem a tabela compartilhada entre os agentes da Task 14
- Pendências para o orquestrador: erro de lint em navbar.tsx (set-state-in-effect no mounted do ThemeToggle) e warning em messages-view.tsx são dos respectivos agentes, não desta tarefa

---
Task ID: 14-c-b
Agent: frontend-styling-expert
Task: Dark mode — área B (marketplace, course-view, track-view, checkout)

Work Log:
- Lido worklog.md (entradas 14-c-a/c/d: convenção de inserir dark: ao lado do token claro, tabela de cores compartilhada, problemas pré-existentes de lint em navbar/messages-view) e lidos na íntegra os 4 arquivos do escopo antes de editar; inventário completo de tokens de cor via rg (bg/text/border/ring/divide/placeholder/fill/hover:/group-hover:/focus-visible:) nas 4 telas
- ADDITIVE ONLY via script determinístico (tool-results/darkify-b.mjs, fora de src/): insere `dark:*` imediatamente após cada token claro mapeado, com guardas de fronteira de regex (não casa dentro de hover:/dark:/variantes nem subtokens com /opacidade), overrides por linha para os casos contextuais e verificação automática anti-não-aditivo (remover todos os dark: da linha reproduz a linha original byte a byte); git diff -U0 + contador confirmou 0 remoções de conteúdo light, 0 mudanças de JSX/lógica/texto/aria, nenhum outro arquivo tocado
- marketplace.tsx (178 dark:): barra superior dark:bg-stone-950 dark:border-stone-800; controle segmentado de abas (trilho bg-stone-100→dark:800; pílula ativa bg-white text-stone-900→dark:900/dark:stone-50; inativa dark:stone-400 + dark:hover:stone-200); h1/h2/contadores/labels stone→50/400/500; SelectTriggers e Input de busca dark:bg-stone-900 + placeholder dark:500 + focus-visible dark:border-emerald-700/dark:ring-emerald-900/40; botão limpar busca dark:hover:bg-stone-800; pílulas de categoria/áreas (dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300, hovers dark:border-emerald-700 dark:text-emerald-300; ativas emerald-700 sólidas mantidas); 5 empty states (borda dashed dark:stone-700, círculo dark:800, textos); StatTile claro (dark:900/borda 800/ícone emerald-950-50/300); skeletons wrappers dark:border-stone-800; cards Mentor/Course/Track/Library/Author (dark:bg-stone-900 dark:border-stone-800 dark:hover:border-emerald-700), chips emerald/teal/amber soft→950/50 + texto 300, dots e separadores stone-300→dark:600; GridSection "Ver todos" dark:emerald-300→200
- course-view.tsx (107): cards de seção/avaliações/mentor dark:bg-stone-900 dark:border-stone-800; lista de aprendizado e currículo (dividers dark:divide-stone-800, círculos dark:800, títulos dark:stone-200, chips LIVE rose→950-50/400 e READING amber→950-50/400, Locks dark:stone-600); hero do inscrito (emerald-950) e hero com gradiente intocados; box "Mentorias 1:1 inclusas" (dark:border-emerald-900 dark:bg-emerald-950/50, textos emerald-200/300, botão dark:bg-stone-900 dark:hover:bg-emerald-900/40); ReviewFormCard (banner "Você concluiu" amber→dark:900/950-50/300, estrelas inativas dark:stone-600 com fill-amber-400 mantido, Textarea dark:bg-stone-900 dark:border-stone-800, contador dark:500); seção pública de avaliações (resumo dark:bg-stone-950/50, barras bg-amber-400 mantidas sobre trilho dark:800, chip "Você" dark:950-50/300, textos 50/200/400/500)
- track-view.tsx (69): cards "Como funciona"/timeline/mentor dark:900/800; caixa de progresso dark:border-emerald-900 dark:bg-emerald-950/50 (texto emerald-200/300); conectores da timeline dark:border-stone-800; CourseItemCard (dark:bg-stone-900, hover dark:border-emerald-700 + dark:bg-emerald-900/30, título dark:stone-50 com dark:group-hover:emerald-300, badge dark:800/400); MentorshipItemCard (painel dark:emerald-900-950/50, ícone dark:950-50/300, chip branco de sessões → dark:bg-stone-950/50 dark:text-emerald-300 dark:ring-emerald-900); sidebar (badge "Você está inscrito" dark:950-50/300, preço dark:emerald-300/stone-50, lista dark:border-stone-800 com Checks dark:emerald-400); hero com gradiente e badges brancos intocados
- checkout.tsx (96): sucesso (círculo dark:emerald-950-50/400, dl dark:border-stone-800 dark:bg-stone-950/50, total dark:emerald-300); blocos login/já inscrito/gratuito (painéis emerald soft→dark:950/50 com bordas dark:emerald-900, ícones dark:300/400); resumo do pedido (badges dark:950-50/300 e dark:border-stone-700, textos 50/200/400/500); cupom aplicado (box dark:emerald-950-50, chip do código dark:border-emerald-700 dark:bg-stone-950/50, remover dark:hover:bg-stone-950/50); formulário de cupom (ícone dark:500, erro dark:rose-400); aviso demo amber→dark:900/950-50/300; formas de pagamento (selecionado mantém border/ring-emerald-500 com dark:bg-emerald-950/50; não selecionado dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-700); caixa PIX dark:border-stone-700 dark:bg-stone-900/60 com QR dark:stone-600; formulário do cartão dark:bg-stone-900 com labels dark:stone-300 e nota dark:amber-400; rodapé de segurança dark:stone-500 + escudo dark:emerald-400
- Correções manuais pós-script: dark:hover:bg-emerald-950/50 no badge "Você está inscrito" (track), dark:hover:bg-emerald-900/40 no botão "Ver disponibilidade do mentor" (course), dark:ring-emerald-900 no chip de sessões (track), dark:hover:bg-stone-950/50 no botão remover cupom (checkout) — todos aditivos e revalidados
- Intencionalmente intocados: spotlights/heroes emerald-950 sólidos com seus textos emerald-50/100/200/300, chips emerald-400/10 e blobs teal-400/10 + emerald-500/20, placeholders pulsantes bg-emerald-950/90; chips brancos (bg-white, bg-white/90, bg-white/95) sobre capas/hero e dots do spotlight (bg-white/30); botões brancos text-emerald-950 hover:bg-emerald-100; overlay bg-stone-950/55 de capas e badges bg-stone-900/30; estrelas fill-amber-400 e barras bg-amber-400; bg-amber-600/text-amber-500/text-rose-500/bg-rose-500/25; sólidos bg-emerald-600/700, hover:bg-emerald-800, border/ring-emerald-500, focus-visible:outline-emerald-700 e ring-emerald-600/30·/40, shadow-emerald-950/20; imagens/avatares/avatarGradient; componentes ui/* (tokens próprios já adaptam); navbar/messages-view/page/layout/globals (outros agentes)

Validation (bun run lint + bunx tsc + curl + CSS):
- bun run lint: 0 problemas nos 4 arquivos desta tarefa (bunx eslint direto nos 4 → limpo); o projeto reporta apenas o 1 erro (navbar.tsx, react-hooks/set-state-in-effect do ThemeToggle) + 1 warning (messages-view.tsx) PRÉ-EXISTENTES das tarefas 14-a/14-b — fora do meu escopo
- bunx tsc --noEmit: limpo em src/ (só erros pré-existentes em examples/websocket e skills/, fora de escopo)
- Dev server NÃO reiniciado: curl http://localhost:3000/ → 200 (2x), dev.log sem erros; hot reload aplicou os 4 arquivos
- CSS compilado (chunk 257KB) conferido: dark:bg-stone-950/900, dark:placeholder:text-stone-500, dark:hover:bg-emerald-900/40, dark:group-hover:text-emerald-300, dark:focus-visible:ring-emerald-900/40, dark:bg-teal-950/50, dark:ring-emerald-900 e dark:hover:bg-stone-950/50 presentes — variantes empilhadas compilam
- Verificação anti-omissão: varredura final de tokens claros restantes confirma que só restam os intencionais (sólidos de marca, sobre capas/gradientes e tokens de ui/*)

Stage Summary:
- Área B (Explorar com 5 abas/bento/spotlights, página do curso com avaliações, página da trilha com timeline, checkout com cupom/sucesso) 100% dark-mode-ready de forma aditiva: superfícies stone-950 (faixa superior) / stone-900 (cards) / stone-950/50·900/60 (insets), bordas 800/700, texto 50→600, estados emerald/amber/rose/teal suaves em 950/50 com texto 300/400, sólidos de marca e elementos sobre capas preservados
- Tema claro byte a byte idêntico ao anterior (comprovado por verificação automática de aditividade linha a linha)
Report back: 450 classes dark: adicionadas (marketplace 178, course-view 107, track-view 69, checkout 96) em 328 linhas. Lint dos meus arquivos 0/0 (problemas restantes do projeto são de navbar.tsx/messages-view.tsx, tarefas 14-a/14-b); tsc limpo em src/; servidor 200 sem reinício; CSS compilado validado. Deixei intencionamente intocados: sólidos emerald-950/600/700 e seus textos/botões brancos, chips brancos sobre capas e dots de spotlight, estrelas/barras amber-400, ícones rose-500/amber-500, gradientes de marca (avatarGradient), imagens/avatares, componentes ui/* e qualquer arquivo fora da minha lista.
---
Task ID: 14 (orquestrador: 14-a PWA + 14-b base dark + 14-d/14-e chat + 14-f validação)
Agent: main (Z.ai Code) + frontend-styling-expert (14-c-a…14-c-d, entradas próprias acima)
Task: #12 PWA instalável · #13 modo escuro · #9 chat antes da reserva (fecham os 11 itens escolhidos pelo usuário)

Work Log:
- [14-a PWA] Ícone gerado por IA (emerald #047857, cap+bolha) → sharp redimensionou 512/192/apple-touch-180 em public/icons/; manifest.webmanifest (standalone, pt-BR, maskable, theme #047857); public/sw.js com estratégia por query (?cache=0 dev = sempre rede p/ evitar stale chunks Turbopack; ?cache=1 prod = network-first navegação + cache-first estáticos imutáveis); PwaRegister registra com ?cache= conforme NODE_ENV (silencioso se falhar); layout.tsx: metadata manifest + appleWebApp + icons 192/512/apple + viewport com themeColor light/dark e viewportFit cover
- [14-b BASE DARK] next-themes (attribute="class", defaultTheme="light", enableSystem, disableTransitionOnChange) em ThemeProvider no layout; tokens .dark afinados no globals.css (fundo stone quente oklch 0.155/0.205, --primary/ring emerald claro no escuro p/ manter a marca em componentes token-based); ThemeToggle na navbar (Sun/Moon, mounted via useSyncExternalStore — correção de lint set-state-in-effect); dark variants manuais em navbar (busca, sino, menu, pill de navegação) e page.tsx (shell, loaders, overlays classroom/reader)
- [14-c DARK POR ÁREA] 4 subagentes paralelos (especificação de mapeamento única compartilhada): A=footer/landing-mentee/landing-mentor/mentor-lp (354 classes), B=marketplace/course-view/track-view/checkout (450), C=onboarding/library/tracks-manager/dashboard (526), D=classroom/reader/certificate/meeting/mentor-profile/auth (467). Total ~1.797 classes dark: aditivas (verificação mecânica: remover dark: reproduz a linha original byte a byte). Papel do certificado permanece branco no escuro; PDFs nativos intocados
- [14-d CHAT BACKEND] Model DirectMessage (sender/recipient/body/readAt + índices) + relações no User; POST /api/messages (valida par, corta 2000 chars, notify message_new 💬 com linkView messages + refId=remetente); GET /api/messages?userId&peerId (últimas 200, marca recebidas como lidas, devolve peer com headline); GET /api/messages/threads (agrupa por par com last message/unread/sort); GET /api/messages/unread (contagem p/ badge); api.ts +4 métodos, types.ts (MessageDTO/ThreadDTO/MessagesResponseDTO/ThreadsResponseDTO), notify.ts +message_new
- [14-e CHAT FRONTEND] view 'messages' no store (com peerId opcional); messages-view.tsx (code-split): caixa de entrada com filtro + chat 2 painéis (desktop grid, mobile empilhado com voltar), bolhas (emerald p/ próprias, card p/ recebidas, agrupamento <5min), polling 4s thread / 15s lista (pausa em document.hidden), envio otimista com rollback, scroll automático, skeleton/empty states + CTA Explorar; entradas: ícone MessageCircle na navbar com badge emerald (poll 45s), item "Mensagens" no menu do usuário, botão "Conversar com o mentor" no BookingWidget do perfil (!isOwner), notificação message_new navega com peerId; título "Mensagens — MentorHub"; AUTH_REQUIRED +mensagens
- Restart do dev server necessário (Prisma client regenerado em memória); pkill next dev + bun run dev
- Correções de lint no caminho: navbar ThemeToggle useSyncExternalStore em vez de setState em effect; messages-view deps de effect reais (sem disable)

Validation (browser E2E, 1440x900 + 390x844, dark e light):
- DARK: home/hero/marketplace/painel (KPIs+atalhos)/chat/certificado (papel branco preservado)/classroom (badges, sidebar, progresso)/checkout (cupom, PIX, nota demo) todos escuros, legíveis e consistentes; scrollW=clientW em todas
- LIGHT: home idêntica ao original (toggle de volta restaura 1:1); chat light validado na sessão da Ana
- CHAT loop real: Ana→Carlos (badge emerald "1 não lida" + sino "Nova mensagem 💬" + thread com preview) → notificação navega à thread correta (peerId) → Carlos responde (bolha emerald + "Você: ..." na lista + scroll auto) → Ana recebe (badge) → Ana responde → Carlos recebe; abrir thread zera unread local e no banco
- PWA: link[rel=manifest] presente, /manifest.webmanifest 200, /sw.js 200, SW registrado (/sw.js?cache=0 em dev), 2 meta theme-color, apple-touch-icon; ícones 200
- Perfil do Carlos como Ana: botão "Conversar com o mentor" abre Mensagens na thread dele
- Mobile 390 dark: home e chat sem overflow (sw=cw=390), back button do chat, header compacto com todos os ícones
- bun run lint 0 erros/0 warnings; bunx tsc --noEmit limpo em src/; dev.log sem erros; server 200 (não reiniciado durante os subagentes)

Stage Summary:
- Plataforma agora tem os 3 pilares restantes: instalável como app (PWA com ícone próprio, manifest, SW dev-safe), modo escuro completo e consistente (toggle na navbar, ~1.800 classes dark: aditivas, marca emerald preservada, certificado/PDF permanecem claros por design), e chat direto aluno↔mentor (thread persistente, badges, notificações integradas ao sino, polling leve) — o ciclo de pré-venda fecha: ver perfil → conversar → agendar
- Todos os 11 itens escolhidos pelo usuário (1,2,3,5,6,7,8,9,11,12,13) estão entregues e validados
- Pendências conhecidas: contas descartáveis de teste no banco (inofensivas); SW só cacheia em produção (por design, p/ evitar stale no dev)

---
Task ID: A
Agent: Z.ai Code (main)
Task: Pacote A — features de IA: #1 Tutor IA por curso, #2 Resumos automáticos das aulas, #3 Recomendações inteligentes ("Feito para você")

Work Log:
- Schema: novo model AiLessonSummary (lessonId unique, summary, keyPoints JSON, cache de geração 1x p/ todos os alunos) + relação Lesson.aiSummary; bun run db:push + regeneração do client; restart do dev server
- course-serialize.ts (novo): extrai courseBaseInclude()+serializeCourse() de /api/courses para reuso (mesmo padrão de tracks-serialize.ts); courses/route.ts refatorado p/ importar
- API #2 POST /api/lessons/[lessonId]/ai-summary: valida sessão+matrícula (ou dono), devolve cache na hora, senão monta prompt (material da aula próprio ou da Biblioteca, 8k chars) → LLM responde JSON {summary, keyPoints[]} com parse tolerante (extractJson + fallback texto cru) → upsert no cache; normalizeKeyPoints (máx 6×160 chars)
- API #1 POST /api/ai/tutor: valida sessão+matrícula/dono, mensagem ≤1000 chars, histórico ≤10 trocas (sanitizado); contexto = sumário do curso (temas→aulas, 5k) + aula atual (6k) + descrição; system prompt anti-alucinação (só conteúdo do curso, redireciona p/ aba Perguntas, texto puro sem markdown) + sanitização server-side de **/##/crase na resposta
- API #3 GET /api/ai/recommendations: histórico do aluno (inscrições+progresso %) + catálogo (24 cursos, exclui próprios e matriculados) → LLM escolhe 4 com motivo curto; fast-path populares (sem IA) quando sem histórico; fallback popular se IA falhar; cache em memória por usuário (TTL 10 min)
- types.ts: AiLessonSummaryDTO, AiTutorChatMessage, RecommendationDTO, RecommendationsDTO; api.ts: lessonAiSummary/aiTutor/recommendations
- ai-lesson-summary.tsx (novo): aba "Resumo IA" no classroom — gera automático na 1ª abertura (skeleton com contexto), resumo + tópicos-chave em grid, copiar resumo, retry em erro, CTA login p/ convidado
- ai-tutor.tsx (novo): botão flutuante "Tutor IA" no classroom + drawer de chat (overlay blur, painel 420px desktop / folha cheia mobile, spring), bolhas (emerald p/ aluno), typing indicator, 4 chips de sugestão, Enter envia/Shift+Enter quebra, aviso "a IA pode errar", prop raised p/ modo foco (bottom-[5.5rem] evita cobrir "Sair do modo foco")
- classroom.tsx: aba "Resumo IA" (Sparkles) entre Material e Perguntas + <AiTutor> renderizado p/ hasAccess (matriculado ou dono)
- landing-mentee.tsx: seção "Feito para você" (logado, silenciosa em erro) após Continue aprendendo — badge "IA personalizada" quando gerado, grid 1/2/4 colunas, RecommendationCard com capa, chip de categoria, motivo da IA em pill emerald, preço/Gratuito + CTA Ver curso

Validation (bun lint 0/0; tsc limpo em src/; browser E2E 1440×900 + 390×844, light+dark):
- Resumo IA: geração real em 2,5s (aula "O que faz um PM"), cache devolve cached:true instantâneo; aba renderiza resumo+4 tópicos e badge "salvo para todos os alunos" (tool-results/ai-summary-tab.png)
- Tutor IA: pergunta real respondida com conteúdo do curso (descoberta, RICE, 5 perguntas), 2ª resposta sem markdown após sanitização; drawer abre/fecha, sugestões enviam, Enter funciona (ai-tutor-chat.png, ai-mobile-reply.png)
- Modo foco: tutor "raised" sem overlap com "Sair do modo foco" (overlap:false medido via eval)
- Recomendações: Ana viu 3 cursos com motivos personalizados ("Continua jornada em tecnologia com Design Systems", "Combina com Product Manager e marketing") + badge IA PERSONALIZADA; guest não vê a seção; fallback popular coberto por código
- Mobile 390: scrollW=clientW em home e drawer do tutor; chips/composer sem overflow
- Dark: "Feito para você" e Resumo IA legíveis e consistentes (ai-mobile-foryou-dark.png)
- Endpoints 200; dev.log sem erros; server não derrubado durante validação

Stage Summary:
- Plataforma ganhou a camada de IA nos 3 pontos de maior valor: aluno nunca fica travado (Tutor IA com base no conteúdo real do curso), revisão rápida por aula (Resumo IA cacheado — custo de LLM pago 1x por aula) e descoberta personalizada (Feito para você com fallback popular à prova de falhas)
- Acessos e limites validados no servidor (matrícula/dono, 1000 chars/msg, 10 msgs de histórico, cache anti-abuso)
- Custos de IA contidos: resumo gerado 1x por aula (persistido), recomendações em cache de 10 min por usuário, tutor sem persistência (histórico no cliente)

---
Task ID: B
Agent: Z.ai Code (main)
Task: Pacote B (parcial) — #4 Pacotes de cursos (bundles) + #5 Programa de indicação

Work Log:
- Schema: models Bundle + BundleItem (2+ cursos, @@unique bundle/curso) + Referral (referrer/referred @unique, PENDING→REWARDED) + User.referralCode @unique e User.creditCents (centavos) + Order.bundleId e Order.creditsUsed; bun run db:push + regeneração do client + restart do dev server (client antigo em memória causava db.bundle undefined)
- bundle-serialize.ts (novo): bundleBaseInclude + serializeBundle (coursesTotal = soma dos publicados; discountPercent = 1 − price/total) + serializeBundleDetail (myEnrolledCourseIds); avatar do mentor vem de user.avatarUrl (MentorProfile não tem avatarUrl — correção após erro do Prisma)
- APIs bundles: GET /api/bundles (filtros mentorUserId p/ painel, courseId p/ callout, userId p/ estado de matrícula), POST (create/update com validação dono + 2+ cursos próprios + price ≥ 0), GET/DELETE /api/bundles/[id]; correção: mkdir faltou antes do 1º Write (rota 404) — reescrito
- Checkout: branch BUNDLE (409 se já tem todos os cursos, matrícula upsert em todos, order com bundleId), créditos (useCredits → desconto min(saldo, pós-cupom), debita creditCents, grava creditsUsed) em curso/trilha/pacote e rewardPendingReferral() (1ª compra paga → REWARDED + R$ 20 p/ convidante + notificações referral_joined/referral_rewarded)
- /api/referrals GET: gera código (alfabeto sem ambíguos, retry em colisão), stats completos (saldo/convidados/convertidos/ganhos/pendentes)
- register: aceita refCode (valida código existente) → creditCents 1000 (R$ 10 boas-vindas) + Referral PENDING + notify convidante; login/me retornam creditCents; notify.ts +kinds referral_joined/referral_rewarded/bundle_new e linkView 'referrals'
- lib/referral.ts (novo): captureRefCodeFromUrl (?ref= → localStorage 7 dias, mesmo padrão do tracking), get/clear; page.tsx captura no bootstrap
- referrals-view.tsx (novo, view 'referrals' + AUTH_REQUIRED + docTitle): hero emerald com link ?ref=CODE + copiar + compartilhar, 4 KPIs, "Como funciona" 3 passos, lista de convidados com badges "+ R$ 20 creditados"/"Aguardando 1ª compra"; navbar ganhou menu "Indicar amigos" (Gift) e roteamento de notificações p/ referrals
- bundles-manager.tsx (novo): aba "Pacotes" no painel do mentor (PANEL_TABS + atalhos) — lista com badges Publicado/Rascunho, chips de cursos com capa, preço cheio riscado + −%; dialog criar/editar com seleção de cursos (capa+preço), preço e desconto ao vivo (ex.: R$ 318 → 199 = 37%), toggle Publicar, exclusão com confirmação
- Explorar: aba "Pacotes" (segment control) com título/subtítulo próprios, busca e MarketplaceBundles autocontido (skeletons, empty states, cards com mosaico de capas, −% badge, "R$ X à parte"); bento/biblioteca inalterados; correção de estrutura JSX/TS narrowing (branch bundles fora do bloco tab !== 'all')
- checkout.tsx: bundleId prop, badges Pacote + "Economize N%", lista dos cursos com preços riscados, total dinâmico com cupom + créditos, caixa "Usar meus créditos (R$ X)", sucesso com "Ir para meus cursos"; pacote gratuito matricula em todos os cursos; /api/coupons/validate aceita bundleId
- course-view.tsx: BundleCallout na sidebar de visitantes ("Este curso faz parte do pacote X — economize N%") com CTA p/ checkout do pacote
- auth-view: envia refCode no cadastro + toast "R$ 10 de crédito de convite"; limp código após uso

Validation (lint 0/0, tsc 0 erros em src/, browser E2E 1440×900 + 390×844, light+dark):
- APIs reais: bundle criado p/ Carlos (2 cursos R$ 189+129 → R$ 249, −22%); cadastro com convite MH-J76NPE → Lia com creditCents 1000; compra de curso → Referral REWARDED + Carlos creditCents 2000 + notificações (referral_joined + referral_rewarded no banco); compra do pacote com créditos → order 239 (249−10), saldo 0, matrículas = 2 cursos
- ?ref= capturado no localStorage (mh_referral_v1) e guard de checkout leva convidado ao login
- UI desktop: aba Pacotes com card completo (mosaico de capas, −22%, 2 cursos, mentor, R$ 249 / R$ 318 à parte); checkout do pacote com badges, lista de cursos, créditos R$ 20 aplicados (Total 249→229 no toggle, botão Pagar atualiza); referrals com KPIs reais (R$ 20, 1 convite, 1 convertido) + link + código + convidados; painel Pacotes com lista/editar/excluir e dialog com desconto ao vivo (318→199 = 37%)
- UI mobile 390 dark: pacotes/referrals/checkout sem overflow (390x390), cards legíveis; callout do pacote na página do curso (Camila) navegando ao checkout
- Radix: cliques no browser exigem sequência completa pointer/mouse events (tabs/dialog) — mesma técnica das tasks anteriores
- dev.log: ⨯ antigos apenas da janela de criação do referrals-view (inexistente por segundos); após, tudo 200; server não derrubado durante a validação final

Stage Summary:
- Monetização completa: mentor combina 2+ cursos em pacote com desconto implícito (cria no painel, aparece no Explorar, nas páginas dos cursos e no checkout); indicação dupla (convidado entra com R$ 10, convidante ganha R$ 20 na 1ª compra) com código ?ref= de 7 dias, página de convites com saldo e créditos aplicáveis em qualquer checkout
- Todos os valores são calculados no servidor (créditos, descontos, recompensa) — cliente só reflete
- Demo enriquecida: Carlos com 2º curso ("Testes e Qualidade de Código") + pacote "Formação Arquiteto de Software" + indicação real (Lia Teste)
- Pendência conhecida: clique sintético do Playwright precisa da sequência completa de eventos em tabs/dialogs Radix (limitação de teste, não do produto)
---
Task ID: C-b
Agent: Z.ai Code (backend-integration)
Task: #7 Lembretes automáticos (POST /api/reminders/run) + #8 Exportar calendário (.ics + Google Calendar)

Work Log:
- Criado src/app/api/reminders/run/route.ts (POST, force-dynamic): 4 regras na mesma chamada, cada uma isolada em try/catch — welcome (0 notificações E 0 matrículas), session_reminder (bookings PENDING/CONFIRMED como mentee OU mentor via MentorProfile com startsAt na janela [agora, agora+24h], parseNaive → Date local, nome do outro lado via mentee.name/mentor.user.name), streak_risk (studyStreak>0 E lastStudyDate==ontem, refId streak:YYYY-MM-DD), inactive_reminder (≥1 matrícula E max(último XpEvent, última matrícula, lastStudyDate) há >7 dias, refId inactive:YYYY-MM-DD). Dedupe universal: db.notification.findFirst({userId, kind, refId}) antes de criar; títulos/bodies/linkView 'dashboard' conforme spec; 400 sem userId, 404 usuário inexistente; kinds não existiam no union fechado de notify() → cast controlado via Parameters<typeof notify>[0]['kind'] (lib/notify.ts intocado, Notification.kind é String no banco)
- Criado src/app/api/calendar/export/route.ts (GET, force-dynamic): .ics montado manualmente (BEGIN:VCALENDAR/VERSION 2.0/PRODID -//MentorHub//PT-BR/CALSCALE/X-WR-CALNAME MentorHub) — eventos de bookings PENDING/CONFIRMED (SUMMARY "Mentoria: <topic>", LOCATION meetingRoom, DESCRIPTION "Sessão com <outro> — status: X") e aulas LIVE das matrículas (SUMMARY "Aula (ao vivo): <title>", LOCATION meetingUrl, DESCRIPTION course.title); UID mh-<id>-booking|live@mentorhub; DTSTAMP UTC YYYYMMDDTHHMMSSZ; DTSTART/DTEND floating local (sem Z/TZID) derivado do naive, DTEND = start+durationMin; escape RFC5545 de \ ; , e quebras; ordenado por data, limite 300; Content-Type text/calendar; charset=utf-8 + attachment filename="mentorhub.ics"; 400/404 JSON
- page.tsx: gatilho único de lembretes — guard de módulo let remindersRunFor (1x por userId por sessão do navegador) + useEffect [user?.id] chamando api.runReminders(uid).catch(() => {}) após carga/login; nada mais tocado
- dashboard.tsx: no header "Minhas sessões" adicionado botão "Exportar .ics" (Button asChild variant outline → <a href="/api/calendar/export?userId=..." download>, ícone Download, h-11 sm:h-9 p/ toque 44px, label hidden sm:inline + aria-label) ao lado de "Explorar mentores"; no BookingCard link discreto "Google Calendar" (ExternalLink, text-emerald-700, target _blank, aria-label) na linha de metadados, renderizado só p/ PENDING/CONFIRMED futuros, URL render?action=TEMPLATE&text&dates=UTCstart/UTCend&details&location (new Date(naive) → toISOString limpo)

Validation:
- curl reminders/run Lucas (mentee, booking CONFIRMED hoje 14:00): 1ª {"created":1,"kinds":["session_reminder"]} → 2ª {"created":0,"kinds":[]} (dedupe ✓); Ana (mentora do mesmo booking + streak 2/lastStudyDate ontem): 1ª {"created":2,"kinds":["session_reminder","streak_risk"]} → 2ª {"created":0,"kinds":[]}; notificações no banco com título/body/refId corretos ("Sessão amanhã: ... ⏰", "30/08 às 14:00 com Ana Souza. Prepare suas dúvidas!", streak:2026-08-30); 400/404 corretos
- curl export Ana: headers text/calendar; charset=utf-8 + attachment filename="mentorhub.ics", 6 VEVENTs ordenados (2 aulas LIVE + 4 bookings mentee/mentor), DTSTAMP UTC com Z, DTSTART floating; Lucas: 2 VEVENTs; escape validado com booking de teste "Teste, vírgula; p-v \ backslash" → SUMMARY "Teste\, vírgula\; p-v \\ backslash" e DTEND +90min; janela 24h revalidada movendo o booking p/ hoje 09:00 → created 1; booking/notificação de teste REMOVIDOS depois (banco restaurado)
- bun run lint 0/0; bunx tsc: só erro pré-existente em skills/stock-analysis-skill (fora de src/); GET / → 200; dev.log sem erros das novas rotas
- Anti-corrupção "[m": verificador python (chr(91)+'m') nos 4 arquivos — routes/page 100% limpos; dashboard tem ocorrências APENAS nas linhas pré-existentes do HEAD (destructuring "const [mentorProfile..." linha 605 e "const [myTracks..." linha 607, falsos positivos); git diff prova que nenhuma linha ADICIONADA contém a sequência

Stage Summary:
- Ciclo de retenção completo: lembretes idempotentes rodando no boot de cada sessão (welcome, sessão em 24h dos dois lados da mesa, ofensiva em risco, inatividade 7d — todos deduped por refId e diários quando aplicável) + calendário exportável (.ics floating local compatível com Google/Apple/Outlook e atalho "Google Calendar" por sessão futura), fechando o laço agenda↔calendário externo
- Nenhum arquivo compartilhado (types/api/notify) foi editado — integração 100% aditiva; demo com Ana/Lucas/booking CONFIRMED de hoje já exerce as 2 features sem seed extra

---
Task ID: C-a
Agent: Z.ai Code (backend-integration)
Task: #9 Metas semanais (API /api/goals/weekly + widget "Meta semanal" na home do aluno)

Work Log:
- Lido worklog.md (padrões: cast de kind p/ notify fechado feito pelo C-b, verificador anti-corrupção de colchete+m, stone+emerald, seções da landing) e contratos ANTES de codar: types.ts (WeeklyGoalDTO), api.ts (getWeeklyGoal/updateWeeklyGoal), notify.ts, xp.ts (XP LESSON = 1 evento XpEvent kind=LESSON por aula concluída), schema (WeeklyGoal userId @unique), helpers (addDays/dateKey)
- Criado src/app/api/goals/weekly/route.ts (GET+PUT, force-dynamic): função compartilhada weeklyGoalDto (DRY) — monday = segunda 00:00 local ((getDay+6)%7), weekStart = dateKey "YYYY-MM-DD"; history = 4 contagens XpEvent kind=LESSON em janelas semanais fechadas (3 passadas + atual, mais antiga primeiro, limite superior exclusivo); completedLessons = semana atual; meta = weeklyGoal.findUnique (ausente → targetLessons 3 e isCustom false); goalAchieved = completed >= target; notificação idempotente 'goal_achieved': findFirst por userId+kind+refId=weekStart antes do notify (título "Meta semanal batida! 🎉", body "Você concluiu X aulas nesta semana. Parabéns!", linkView dashboard) — kind novo fora do union fechado de notify(): cast controlado via Parameters typeof notify, lib/notify intocado (mesmo padrão do C-b)
- GET: 400 sem userId, 404 usuário inexistente; PUT: body com userId+targetLessons, valida inteiro 1..35 (400) e usuário (404), upsert em weeklyGoal, devolve o DTO recomputado; DTO respondido direto, sem embrulho
- landing-mentee.tsx (único arquivo de frontend): imports Target/Trophy + WeeklyGoalDTO; render condicional ao usuário logado imediatamente após a seção "Continue aprendendo" (antes de "Feito para você"); componente WeeklyGoalCard no fim do arquivo — fetch no mount (padrão active + catch silencioso do arquivo), skeleton (header+barra+4 chips redondos), erro → return null; card rounded-2xl border p-5 sm:p-6 dentro de section py-8/py-10 com mx-auto max-w-6xl px-4 (mesmo container das seções vizinhas); header ícone Target + "Meta semanal" + subtítulo "X de Y aulas nesta semana"; Progress (ui/progress) h-2.5 + rótulo "% da meta"; goalAchieved → Badge emerald "Meta batida! 🎉" com Trophy + mensagem de parabéns; editor com chips 2·3·5·7 (h-11 w-11 rounded-full = 44px de toque, ativo bg-emerald-700 text-white, aria-pressed + aria-label, disabled enquanto salva) chamando api.updateWeeklyGoal com update otimista simples (aplica na hora, reconcilia com a resposta, rollback silencioso); variantes dark: em todos os tokens
- Dev server: 1º GET real devolveu 500 "Cannot read properties of undefined (reading 'findUnique')" em db.weeklyGoal — o client Prisma EM MEMÓRIA do server (iniciado 23:59 de ontem) era anterior à regeneração em disco (01:28, postinstall do bun install do init); restart necessário e feito pelo caminho oficial (script init → dev.sh: bun install + db:push idempotentes → next dev saudável na porta 3000, health check 200)

Validation (lint + tsc + curls reais + anti-corrupção):
- GET Ana Souza (6 XpEvent LESSON nesta semana): {"targetLessons":3,"completedLessons":6,"goalAchieved":true,"weekStart":"2026-08-24","history":[0,0,0,6],"isCustom":false} → PUT targetLessons 5: mesmo DTO com targetLessons 5 e isCustom true → GET de novo: isCustom true (persistido); weekStart 2026-08-24 = segunda da semana corrente (hoje é dom 30/08/2026)
- Notificação criada exatamente 1x após 3 respostas consecutivas com goalAchieved true (count 1; refId 2026-08-24, linkView dashboard) — idempotência ✓; PUT inválidos (0, 36, 2.5, "abc") e sem userId → 400 com mensagem; GET sem userId → 400; userId inexistente → 404
- bun run lint: 0 erros / 0 warnings (exit 0); bunx tsc --noEmit: nenhum erro em src/ (apenas o pré-existente de skills/stock-analysis-skill, fora do projeto)
- Verificador anti-corrupção (probe chr(91)+'m'): route.ts 100% limpo; landing-mentee.tsx tem 5 ocorrências APENAS em linhas pré-existentes do HEAD (useState/useMemo dependentes de mentors e a classe utilitária mask-image do Tailwind) — git diff -U0 + probe prova que nenhuma linha ADICIONADA contém a sequência
- GET / → 200 e o chunk compilado contém "Meta semanal" (src_components_platform_landing-mentee_tsx_*.js) — widget presente no bundle client; dev.log sem erros das novas rotas

Stage Summary:
- Aluno agora tem meta semanal de estudos com progresso calculado no servidor a partir do ledger de XP (à prova de farm), histórico de 4 semanas no DTO, meta customizável (chips 2·3·5·7; API aceita 1..35) e celebração com notificação in-app idempotente 1x por semana — fecha o loop de retenção junto de ofensiva/XP/lembretes
- Widget discreto: skeleton → card, some silenciosamente em erro, mobile-first com toque ≥44px, dark mode completo, aria-pressed/aria-label nos chips; nenhum arquivo compartilhado (types/api/notify) foi editado — integração 100% aditiva
- Estado real deixado no banco p/ demo: Ana Souza com meta 5 (isCustom true) e notificação "Meta semanal batida! 🎉" da semana 2026-08-24
---
Task ID: C-6
Agent: Z.ai Code (main)
Task: #6 Assinatura do mentor (membership mensal: todos os cursos + sessão em grupo)

Work Log:
- Schema: models MentorMembership (mentorId @unique — 1 plano por mentor, price, groupSessionDay/Time, isPublished), MembershipSubscription (ACTIVE|CANCELLED, renewsAt=+30d, cancelledAt, @@unique membership/user) + Order.membershipId + relações User/MentorProfile; db:push + regen client + restart
- notify.ts: +kinds membership_new/membership_subscribed/session_reminder/streak_risk/inactive_reminder/welcome/goal_achieved (pré-add p/ todos os agentes)
- APIs: GET/POST /api/memberships (painel c/ assinantes | público | userId → myStatus/renewsAt + RE-SYNC de matrículas dos planos ACTIVE — cursos futuros entram sozinhos), GET/DELETE /api/memberships/[id], POST /api/memberships/cancel (mantém acesso até renewsAt)
- Checkout: branch MEMBERSHIP no /api/checkout (409 se ACTIVE, upsert reativação, matrícula em todos os cursos publicados, cupom+créditos, tracking purchase, notificações duplas, rewardPendingReferral); /api/coupons/validate aceita membershipId
- UI: checkout.tsx com kind 'membership' (badge CreditCard "Tudo incluído por R$X/mês", lista de benefícios, sucesso c/ CTA perfil, guard de assinante); store/page.tsx com membershipId; painel ganhou aba "Assinatura" (membership-manager.tsx: KPIs assinantes/MRR/cursos, form c/ dia+hora da sessão, prévia emerald, lista de assinantes, excluir c/ confirmação); course-view MembershipCallout p/ visitantes; mentor-profile MembershipCard na aba Sobre (preço/benefícios/Assinar agora | Ativa até dd/mm + cancelar | Reativar)
- Corrupção "[m" do canal contornada: padrão `const xTuple = useState(...)` + verificação python chr(91) após cada write

Validation (lint 0/0, tsc 0 em src/, browser E2E desktop+mobile light):
- API: create → GET painel (subscriberCount, subscribers c/ Ana) ; checkout Ana → 409 na 2ª, subscription ACTIVE renewsAt+30d, matrículas 1→2, order 39.90 PAID, notificações membership_new (Carlos) + membership_subscribed (Ana); cancel → CANCELLED; re-checkout → ACTIVE (reativação)
- UI E2E: aba Assinatura no painel c/ KPIs+form preenchido+prévia+assinantes ("Ana Souza desde 30/08 · renova 29/09"); perfil público c/ card de assinatura (benefícios, "Assinar agora" | Ana vê "Assinatura ativa"+cancelar); callouts do curso p/ guest (pacote + assinatura) → guard login → checkout completo (badge, benefícios, PIX, "Pagamento confirmado!") → Aluno Cupom Teste ACTIVE c/ 2 matrículas; home da Ana passou a listar os 2 cursos do Carlos (sync)
- Bug encontrado e corrigido: gate do card de erro do checkout não conhecia membership (`!course && !track && !bundle` → +`&& !membership`) — fetch ok mas card "Item não encontrado."
- Mobile 390 sem overflow (390=390); dark ok; dev.log sem erros

Stage Summary:
- Receita recorrente end-to-end: mentor cria 1 plano mensal → aluno assina (cupom/créditos funcionam) → acesso imediato a todos os cursos publicados + sessão em grupo mensal + cursos futuros entram via re-sync; cancelamento mantém ciclo pago; tudo validado no servidor
---
Task ID: C-a
Agent: full-stack-developer (subagente)
Task: #9 Metas semanais de estudo

Work Log:
- src/app/api/goals/weekly/route.ts: GET (weekStart=segunda local, completedLessons via XpEvent kind=LESSON, history 4 semanas, meta default 3, notificação goal_achieved idempotente por refId=weekStart) + PUT (target 1..35, upsert) com DTO compartilhado
- landing-mentee.tsx: widget "Meta semanal" após "Continue aprendendo" (só logado) — barra Progress, badge "Meta batida! 🎉" (Trophy), chips 2·3·5·7 (44px, otimista c/ rollback), skeleton, dark completo

Validation: GET/PUT reais (Ana 6/6 → achieved, PUT 5 → isCustom true persistido; 400/409 cobertos); notificação criada 1x em 3 chamadas; lint 0/0; tsc limpo; server reiniciado via script oficial (client Prisma antigo em memória)

Stage Summary:
- Aluno define alvo semanal de aulas; progresso real calculado no servidor (XP ledger à prova de farm); celebração + notificação quando bate
---
Task ID: C-b
Agent: full-stack-developer (subagente)
Task: #7 Lembretes automáticos + #8 Exportar calendário

Work Log:
- src/app/api/reminders/run/route.ts: POST idempotente c/ 4 regras isoladas (welcome se 0 notifs+0 matrículas; session_reminder p/ bookings CONFIRMED/PENDING em ≤24h (mentee e mentor); streak_risk se estudou ontem e não hoje; inactive_reminder >7 dias) — dedupe universal via (userId, kind, refId)
- src/app/api/calendar/export/route.ts: GET .ics (text/calendar; attachment) c/ bookings + aulas LIVE das matrículas, DTSTART/DTEND floating local, escape RFC5545, ordenado
- page.tsx: runReminders 1x por sessão no bootstrap (guard de módulo, falha silenciosa)
- dashboard.tsx: botão "Exportar .ics" (44px toque) no header de sessões + link "Google Calendar" por sessão futura (datas UTC)

Validation: run 2x → created 1→0 (dedupe ✓ p/ Lucas e Ana); .ics c/ 6 VEVENTs, escape de vírgula/ponto-e-vírgula/backslash validado; lint 0/0; tsc limpo; anti-corrupção OK

Stage Summary:
- Retenção automática: lembretes de sessão/ofensiva/inatividade/boas-vindas chegam no sino sem cron externo (idempotentes) e a agenda inteira exportável p/ Google/Apple Calendar

---
Task ID: T1
Agent: Z.ai Code (main)
Task: Trilha "Cibersegurança e Direito Digital" (4 cursos) na conta do mentor Gustavo Novaes Cruz (gustavonv@yandex.com)

Work Log:
- Conta confirmada no banco (já existia com MentorProfile ativo, slug gustavo-novaes-cruz); nenhuma alteração de usuário necessária
- Web-search para vídeos reais do YouTube: confirmados 7 IDs estáveis (NIST CSF PT-BR Q8e-gM142bw, LGPD 4min n3e0HVcNml0, LGPD Explained EWoe_IUmd3A, Equifax qwgEHbr8PhE, ransomware Vkjekr6jacg, IR NIST CSF 2.0 aA2ldOeqycA, resposta a incidente PT-BR j5SY19S3RQ4); aulas restantes em texto simples (conforme pedido do usuário)
- 5 capas geradas com image-generation CLI (1344x768, dark + emerald coerente com a plataforma) em public/uploads/seed/: trilha-cyber-direito.png, course-cyber-fundamentos.png, course-cyber-defensiva.png, course-cyber-pericia.png, course-cyber-direito.png
- Novo script idempotente e atômico prisma/seed-cyber-trilha.ts (não destrutivo; transaction; skip se a trilha já existir): 1 Track + 4 Courses + 10 CourseTheme + 49 Lessons (kind RECORDED/TEXT, content embasado, 7 videoUrl watch?v= compatível com toVideoEmbedUrl) + 7 Quiz (padrão seed.ts: options JSON, correctIndex, explanation) + 4 TrackItem COURSE (order 1..4)
- Conteúdo com bases sólidas pedidas: NIST CSF 2.0 (6 funções), SP 800-53/800-61/800-63B/800-86, ISO/IEC 27001:2022 (SGSI + Anexo A 93 controles) e 27037/27041-27043, LGPD (arts. 6/7/18/39/46/48/52), ANPD (dosimetria 2023, comunicação de incidentes 3 dias úteis 2024, SCCs 2024), CPP arts. 158-A a 158-F, CPC art. 432, Marco Civil arts. 13/15, MP 2.200-2/2001, Lei 14.478/2022, PL 2338/2023; tríade CIA sempre amarrada a casos reais (Equifax, JBS, Colonial Pipeline, vazamentos CadÚnico/SUS 2021, Netshoes, Americanas) com punições judiciais
- Cursos: (1) Cyber Segurança I: Fundamentos, Técnicas e Enquadramento Judicial — INICIANTE R$149, 13 aulas/4 temas; (2) Cyber Segurança Defensiva: Laboratório Prático (Blue Team) — INTERMEDIARIO R$199, 12 aulas/4 temas; (3) Perícia Digital e Aquisição de Provas — INTERMEDIARIO R$249, 12 aulas/4 temas; (4) Direito Digital Aplicado: LGPD, ANPD e Casos Reais — INTERMEDIARIO R$199, 12 aulas/4 temas; trilha INICIANTE R$499 categoria Tecnologia

Validation:
- Seed executado 1x com sucesso (1 trilha · 4 cursos · 10 temas · 49 aulas · 7 vídeos · 7 quizzes); re-execução sai limpa (idempotência)
- bun run lint 0/0; bunx tsc --noEmit sem erros em src/ e prisma/; dev server sem erros (só 200s)
- Browser E2E desktop 1440: login gustavonv@yandex.com ok; Explorar→Trilhas mostra "4 trilhas publicadas" e card "Cibersegurança e Direito Digital · 4 cursos · 15h56min · R$499"; página da trilha lista os 4 cursos com capas em ordem; página do curso 1 mostra os 4 temas com contagens; classroom: aula texto renderiza, aula vídeo carrega iframe youtube-nocookie embed real (DARYUS Talks/NIST), quiz em modo Gabarito (comportamento correto para o dono — código classroom.tsx 1768/1802); painel do mentor: aba Trilhas com editar/despublicar/excluir e aba Cursos com os 4 gerenciáveis; perfil público ?mentor=gustavo-novaes-cruz lista os 4 cursos
- Browser E2E mobile 390x844: home/trilhas/página da trilha/classroom sem overflow (main 390x390, 0 elementos largos); classroom mobile com sidebar de temas e botão Tutor IA no rodapé; dark mode: cards de trilha ok com a capa nova em destaque
- dev server NÃO derrubado durante a validação

Stage Summary:
- Gustavo Novaes Cruz agora é mentor com uma formação completa publicada: trilha "Cibersegurança e Direito Digital" (R$ 499) com 4 cursos encadeados (fundamentos+judicial → defensiva prática → perícia → direito aplicado), 49 aulas estruturadas em 10 módulos, 7 vídeos reais, 7 quizzes e embasamento contínuo NIST/ISO 27001/LGPD/ANPD com casos reais e consequências judiciais — estrutura pronta para ele evoluir conteúdo e vender (cursos, trilha, pacotes, assinatura e mentorias 1:1 já integrados à plataforma)
- Script prisma/seed-cyber-trilha.ts reutilizável e idempotente para reproduzir/estender o conteúdo
