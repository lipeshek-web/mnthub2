import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function at(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return fmt(d)
}

async function main() {
  console.log('🌱 Limpando banco...')
  await db.review.deleteMany()
  await db.booking.deleteMany()
  await db.contentPost.deleteMany()
  await db.availability.deleteMany()
  await db.mentorProfile.deleteMany()
  await db.user.deleteMany()

  console.log('👤 Criando usuários...')
  const ana = await db.user.create({ data: { name: 'Ana Souza', email: 'ana@demo.com', bio: 'Product designer apaixonada por educação e produto digital.' } })
  const lucas = await db.user.create({ data: { name: 'Lucas Prado', email: 'lucas@demo.com', bio: 'Dev backend migrando para produto.' } })
  const julia = await db.user.create({ data: { name: 'Júlia Mendes', email: 'julia@demo.com', bio: 'Empreendedora, fundadora de um app de bem-estar.' } })
  const pedro = await db.user.create({ data: { name: 'Pedro Henrique', email: 'pedro@demo.com', bio: 'UX designer júnior em busca de crescimento.' } })
  const camila = await db.user.create({ data: { name: 'Camila Rocha', email: 'camila@demo.com', bio: 'Full-stack em transição de carreira.' } })
  const fernanda = await db.user.create({ data: { name: 'Fernanda Dias', email: 'fernanda@demo.com', bio: 'Estudante de marketing digital.' } })
  const thiago = await db.user.create({ data: { name: 'Thiago Nunes', email: 'thiago@demo.com', bio: 'Product manager em formação.' } })

  console.log('🧑‍🏫 Criando mentores...')

  const carlosUser = await db.user.create({ data: { name: 'Carlos Ferreira', email: 'carlos@demo.com', bio: 'Engenheiro de software com 12 anos de experiência em startups e big techs.' } })
  const carlosProfile = await db.mentorProfile.create({
    data: {
      userId: carlosUser.id,
      headline: 'Engenheiro de Software Sênior · Ex-Nubank',
      description:
        'Sou engenheiro de software há mais de 12 anos, com passagens por grandes fintechs e startups em escala. Ajudo desenvolvedores a evoluírem de júnior para sênior dominando arquitetura de software, React, Node.js e boas práticas de engenharia.\n\nMinhas mentorias são 100% práticas: revisamos seu código juntos, desenhamos arquiteturas de verdade e simulamos entrevistas técnicas para processos nacionais e internacionais. Vou te ajudar a montar um plano de estudos realista e a construir projetos que impressionam recrutadores.',
      categories: JSON.stringify(['Tecnologia', 'Carreira']),
      hourlyRate: 180,
      experienceYears: 12,
      languages: 'Português, Inglês',
    },
  })

  const marinaUser = await db.user.create({ data: { name: 'Marina Costa', email: 'marina@demo.com', bio: 'PM com 9 anos de experiência em produtos digitais de alto crescimento.' } })
  const marina = await db.mentorProfile.create({
    data: {
      userId: marinaUser.id,
      headline: 'Product Manager · Carreira em Produto Digital',
      description:
        'Lidero produtos digitais há 9 anos em empresas de alto crescimento. Já lancei produtos do zero e escalei features usadas por milhões de pessoas.\n\nNa mentoria, te ajudo com: transição de carreira para produto, discovery e priorização (RICE, Jobs to be Done), métricas north star, roadmap e comunicação com stakeholders. Se você está migrando de área ou quer acelerar como PM, montamos juntos um plano de ação com metas de 30/60/90 dias.',
      categories: JSON.stringify(['Tecnologia', 'Carreira', 'Negócios']),
      hourlyRate: 150,
      experienceYears: 9,
      languages: 'Português, Inglês, Espanhol',
    },
  })

  const rafaelUser = await db.user.create({ data: { name: 'Rafael Almeida', email: 'rafael@demo.com', bio: 'Growth marketer, scalei 3 startups de 0 a 7 dígitos.' } })
  const rafael = await db.mentorProfile.create({
    data: {
      userId: rafaelUser.id,
      headline: 'Estrategista de Growth & Marketing Digital',
      description:
        'Escalei três startups de zero a sete dígitos de receita com estratégias de growth orientadas a dados. Especialista em funis de aquisição, SEO, conteúdo paid media e automação.\n\nNas mentorias, saímos com um plano de growth prático: análise do seu funil, canais prioritários,Quick wins de CRO e um roadmap de experimentos para os próximos 90 dias. Ideal para founders, marketers e criadores que querem crescer com previsibilidade.',
      categories: JSON.stringify(['Marketing', 'Negócios']),
      hourlyRate: 120,
      experienceYears: 8,
      languages: 'Português, Inglês',
    },
  })

  const beatrizUser = await db.user.create({ data: { name: 'Beatriz Lima', email: 'beatriz@demo.com', bio: 'UX/UI designer sênior, especialista em design systems.' } })
  const beatriz = await db.mentorProfile.create({
    data: {
      userId: beatrizUser.id,
      headline: 'UX/UI Designer Sênior · Design Systems',
      description:
        'Designer de produto há 10 anos, sou especialista em design systems e experiência de usuário em produtos financeiros e SaaS.\n\nNa mentoria revisamos seu portfólio linha a linha, trabalhamos storytelling de case studies, processo de design, handoff com engenharia e preparação para entrevistas (incluindo whiteboard challenge). Também ajudo times a estruturarem design systems do zero com Figma e tokens.',
      categories: JSON.stringify(['Design', 'Tecnologia']),
      hourlyRate: 140,
      experienceYears: 10,
      languages: 'Português, Inglês',
    },
  })

  const davidUser = await db.user.create({ data: { name: 'David Okoye', email: 'david@demo.com', bio: 'Assessor de investimentos CFP®, educador financeiro.' } })
  const david = await db.mentorProfile.create({
    data: {
      userId: davidUser.id,
      headline: 'Assessor de Investimentos (CFP®) · Finanças Pessoais',
      description:
        'Certificado CFP® com 11 anos de mercado, já ajudei centenas de famílias a saírem das dívidas e construírem patrimônio com planejamento financeiro de verdade.\n\nNa mentoria organizamos sua vida financeira: orçamento, quitação de dívidas, reserva de emergência e alocação de investimentos (renda fixa, fundos, ações e FIIs) alinhada aos seus objetivos. Sem enrolação e sem "achismo": método, planilhas e acompanhamento.',
      categories: JSON.stringify(['Finanças', 'Negócios']),
      hourlyRate: 160,
      experienceYears: 11,
      languages: 'Português',
    },
  })

  const sofiaUser = await db.user.create({ data: { name: 'Sofia Santos', email: 'sofia@demo.com', bio: 'Professora de inglês há 14 anos, CELTA pela Cambridge.' } })
  const sofia = await db.mentorProfile.create({
    data: {
      userId: sofiaUser.id,
      headline: 'Professora de Inglês · Business English & Fluência',
      description:
        'Professora de inglês há 14 anos, com CELTA pela Universidade de Cambridge e experiência corporativa com executivos de multinacionais.\n\nAs mentorias são imersivas e personalizadas: preparação para entrevistas em inglês, business english, apresentações e reuniões, ou conversação para destravar a fluência de uma vez. Uso material autêntico e simulações reais do seu dia a dia.',
      categories: JSON.stringify(['Idiomas', 'Carreira']),
      hourlyRate: 90,
      experienceYears: 14,
      languages: 'Português, Inglês, Francês',
    },
  })

  const anaProfile = await db.mentorProfile.create({
    data: {
      userId: ana.id,
      headline: 'Lead Product Designer · Design de Produto & Carreira',
      description:
        'Lead de design em produtos digitais com foco em experiências de alto impacto. Já construí design systems, conduzi discoveries e liderei squads multidisciplinares.\n\nMentoro designers em todos os níveis: portfólio, processo de UX, pesquisa com usuários, métricas de design, liderança e transição para produto. Vamos evoluir sua carreira com um plano claro e prático.',
      categories: JSON.stringify(['Design', 'Carreira']),
      hourlyRate: 130,
      experienceYears: 8,
      languages: 'Português, Inglês',
    },
  })

  console.log('📅 Disponibilidades...')
  // [Seg, Ter, Qua, Qui, Sex, Sáb, Dom] como pares [weekday, startHour, endHour]
  const avail = async (mentorId: string, slots: [number, number, number][]) =>
    Promise.all(slots.map(([weekday, startHour, endHour]) => db.availability.create({ data: { mentorId, weekday, startHour, endHour } })))

  await avail(carlosProfile.id, [[1, 8, 12], [2, 14, 18], [3, 8, 12], [4, 14, 18], [5, 8, 12], [6, 9, 12]])
  await avail(marina.id, [[1, 9, 12], [3, 9, 12], [4, 14, 18], [5, 9, 17], [6, 10, 13]])
  await avail(rafael.id, [[1, 14, 18], [2, 9, 12], [3, 14, 18], [4, 9, 12], [5, 14, 18]])
  await avail(beatriz.id, [[1, 9, 13], [2, 9, 13], [4, 14, 19], [5, 14, 19], [6, 9, 12]])
  await avail(david.id, [[1, 18, 21], [2, 18, 21], [3, 18, 21], [6, 9, 13]])
  await avail(sofia.id, [[1, 7, 10], [2, 7, 10], [3, 7, 10], [4, 7, 10], [5, 7, 10], [6, 9, 13]])
  await avail(anaProfile.id, [[1, 9, 12], [2, 9, 12], [3, 9, 12], [4, 9, 12], [5, 9, 12], [1, 14, 18], [3, 14, 18]])

  console.log('📚 Mural de conteúdos...')
  const content = (mentorId: string, data: { title: string; description: string; tags: string[]; type: string; level: string; durationMin: number }) =>
    db.contentPost.create({ data: { mentorId, ...data, tags: JSON.stringify(data.tags) } })

  await Promise.all([
    content(carlosProfile.id, { title: 'Como passar em entrevistas técnicas de sênior', description: 'Guia completo: estruturas de dados na prática, system design em 4 etapas e como narrar suas decisões com o método STAR.', tags: ['Entrevistas', 'System Design', 'Carreira'], type: 'ARTICLE', level: 'AVANCADO', durationMin: 15 }),
    content(carlosProfile.id, { title: 'Workshop: arquitetura limpa em aplicações React', description: 'Aula prática gravada onde refatoramos um app real para arquitetura em camadas, com clean architecture e testes.', tags: ['React', 'Arquitetura', 'Clean Code'], type: 'WORKSHOP', level: 'INTERMEDIARIO', durationMin: 90 }),
    content(carlosProfile.id, { title: 'Trilha do zero ao dev sênior em 18 meses', description: 'Roteiro de estudos semana a semana com projetos, leituras e marcos de evolução de carreira.', tags: ['Plano de Estudos', 'Carreira'], type: 'TRAIL', level: 'INICIANTE', durationMin: 30 }),
    content(marina.id, { title: 'Discovery de verdade: do problema à oportunidade', description: 'Framework que uso para conduzir discovery com squads: entrevistas, síntese e priorização com confidence level.', tags: ['Discovery', 'PM', 'Frameworks'], type: 'WORKSHOP', level: 'INTERMEDIARIO', durationMin: 75 }),
    content(marina.id, { title: 'Como migrar de UX/Engenharia para Product Manager', description: 'Os 5 movimentos que mais funcionaram com mentorados, incluindo como reposicionar o currículo e a narrativa.', tags: ['Carreira', 'Transição'], type: 'ARTICLE', level: 'INICIANTE', durationMin: 12 }),
    content(marina.id, { title: 'Métricas north star na prática', description: 'Vídeo curto: como definir a métrica certa, evitar métricas de vaidade e conectar o roadmap ao impacto.', tags: ['Métricas', 'Estratégia'], type: 'VIDEO', level: 'INTERMEDIARIO', durationMin: 22 }),
    content(rafael.id, { title: 'Funil de aquisição para SaaS em 2025', description: 'Anatomia de um funil que converte: lead magnet, onboarding de email e ativação em 7 dias.', tags: ['Growth', 'SaaS', 'Funil'], type: 'ARTICLE', level: 'INTERMEDIARIO', durationMin: 18 }),
    content(rafael.id, { title: 'Workshop de CRO: 25 experimentos que funcionam', description: 'Biblioteca viva de experimentos de conversão com priorização por ICE score e exemplos reais.', tags: ['CRO', 'Experimentos'], type: 'WORKSHOP', level: 'AVANCADO', durationMin: 120 }),
    content(beatriz.id, { title: 'Portfólio que aprova: anatomia de um case sênior', description: 'Estrutura de storytelling para cases de UX: contexto, decisões, trade-offs e resultado de negócio.', tags: ['Portfólio', 'UX', 'Storytelling'], type: 'ARTICLE', level: 'INTERMEDIARIO', durationMin: 14 }),
    content(beatriz.id, { title: 'Design systems do zero com Figma e tokens', description: 'Série em vídeo: fundamentos, componentes, tokens semânticos e governança para times enxutos.', tags: ['Design System', 'Figma', 'UI'], type: 'VIDEO', level: 'AVANCADO', durationMin: 65 }),
    content(david.id, { title: 'Saindo das dívidas: método em 4 passos', description: 'Do diagnóstico ao plano de quitação: bola de neve vs. juros, renegociação e como criar colchão de segurança.', tags: ['Planejamento', 'Dívidas'], type: 'TRAIL', level: 'INICIANTE', durationMin: 45 }),
    content(david.id, { title: 'Alocação de carteira por perfil de risco', description: 'Como montar carteira entre renda fixa, multimercado, ações e FIIs conforme objetivos e horizonte.', tags: ['Investimentos', 'Carteira'], type: 'ARTICLE', level: 'INTERMEDIARIO', durationMin: 16 }),
    content(sofia.id, { title: 'Destrave a conversação em 30 dias', description: 'Método de imersão ativa: shadowing, input compreensível e rotina de 20 minutos por dia.', tags: ['Fluência', 'Conversação'], type: 'TRAIL', level: 'INICIANTE', durationMin: 40 }),
    content(sofia.id, { title: 'Business English para reuniões executivas', description: 'Frases prontas, tom e postura para liderar reuniões, negociar e apresentar KPIs em inglês.', tags: ['Business English', 'Reuniões'], type: 'ARTICLE', level: 'AVANCADO', durationMin: 11 }),
    content(anaProfile.id, { title: 'Checklist de auditoria UX rápida', description: 'O roteiro que uso para auditar produtos em 1 hora: heurísticas, jornada crítica e oportunidades priorizadas.', tags: ['UX', 'Auditoria', 'Checklist'], type: 'ARTICLE', level: 'INTERMEDIARIO', durationMin: 13 }),
    content(anaProfile.id, { title: 'Do júnior ao lead: crescendo na carreira de design', description: 'Videoaula sobre expectativas de cada nível, como demonstrar impacto e negociar promoções.', tags: ['Carreira', 'Liderança'], type: 'VIDEO', level: 'INTERMEDIARIO', durationMin: 28 }),
  ])

  console.log('⭐ Reviews...')
  const review = (data: { bookingId: string; mentorId: string; authorId: string; rating: number; comment: string }) => db.review.create({ data })

  // Agendamentos
  console.log('📌 Agendamentos...')
  const b1 = await db.booking.create({ data: { mentorId: carlosProfile.id, menteeId: ana.id, startsAt: at(1, 10), durationMin: 60, topic: 'Revisão de arquitetura do meu app React', notes: 'Gostaria de validar a estrutura de pastas e caching.', status: 'CONFIRMED', meetingRoom: 'mentorhub-room-carlos-ana', price: 180 } })
  const b2 = await db.booking.create({ data: { mentorId: marina.id, menteeId: ana.id, startsAt: at(5, 15), durationMin: 60, topic: 'Transição de design para product management', notes: 'Quero entender os primeiros passos.', status: 'PENDING', meetingRoom: 'mentorhub-room-marina-ana', price: 150 } })
  const b3 = await db.booking.create({ data: { mentorId: beatriz.id, menteeId: ana.id, startsAt: at(-6, 14), durationMin: 60, topic: 'Portfólio: storytelling de case studies', status: 'COMPLETED', meetingRoom: 'mentorhub-room-bea-ana', price: 140 } })
  const b4 = await db.booking.create({ data: { mentorId: rafael.id, menteeId: ana.id, startsAt: at(-12, 11), durationMin: 60, topic: 'Growth para produto digital de design', status: 'COMPLETED', meetingRoom: 'mentorhub-room-raf-ana', price: 120 } })
  const b5 = await db.booking.create({ data: { mentorId: anaProfile.id, menteeId: lucas.id, startsAt: at(2, 14), durationMin: 60, topic: 'Começando no design de produto vindo do backend', status: 'PENDING', meetingRoom: 'mentorhub-room-ana-lucas', price: 130 } })
  const b6 = await db.booking.create({ data: { mentorId: anaProfile.id, menteeId: julia.id, startsAt: at(1, 16), durationMin: 60, topic: 'Auditoria de UX no meu app de bem-estar', status: 'CONFIRMED', meetingRoom: 'mentorhub-room-ana-julia', price: 130 } })
  const b7 = await db.booking.create({ data: { mentorId: anaProfile.id, menteeId: pedro.id, startsAt: at(-4, 10), durationMin: 60, topic: 'Design system do zero', status: 'COMPLETED', meetingRoom: 'mentorhub-room-ana-pedro', price: 130 } })
  const b8 = await db.booking.create({ data: { mentorId: carlosProfile.id, menteeId: camila.id, startsAt: at(-8, 9), durationMin: 60, topic: 'Simulação de entrevista técnica', status: 'COMPLETED', meetingRoom: 'mentorhub-room-carlos-camila', price: 180 } })
  const b9 = await db.booking.create({ data: { mentorId: sofia.id, menteeId: thiago.id, startsAt: at(-3, 8), durationMin: 60, topic: 'Preparação para entrevista em inglês', status: 'COMPLETED', meetingRoom: 'mentorhub-room-sofia-thiago', price: 90 } })
  const b10 = await db.booking.create({ data: { mentorId: david.id, menteeId: fernanda.id, startsAt: at(-2, 18), durationMin: 60, topic: 'Organização financeira para autônomos', status: 'COMPLETED', meetingRoom: 'mentorhub-room-david-fernanda', price: 160 } })
  const b11 = await db.booking.create({ data: { mentorId: marina.id, menteeId: thiago.id, startsAt: at(-1, 9), durationMin: 60, topic: 'Priorização de roadmap com RICE', status: 'COMPLETED', meetingRoom: 'mentorhub-room-marina-thiago', price: 150 } })

  await Promise.all([
    review({ bookingId: b3.id, mentorId: beatriz.id, authorId: ana.id, rating: 5, comment: 'A Beatriz revisou meu portfólio ponto a ponto e me deu um feedback honesto e acionável. Saí da sessão com 12 melhorias priorizadas. Recomendo demais!' }),
    review({ bookingId: b7.id, mentorId: anaProfile.id, authorId: pedro.id, rating: 5, comment: 'Mentoria incrível! A Ana tem um método claro para estruturar design systems e ainda compartilhou templates próprios. Muito generosa com o conhecimento.' }),
    review({ bookingId: b8.id, mentorId: carlosProfile.id, authorId: camila.id, rating: 5, comment: 'A simulação de entrevista com o Carlos foi mais difícil que as reais 😅. Feedback cirúrgico sobre comunicação e complexidade algorítmica. Vale cada centavo.' }),
    review({ bookingId: b9.id, mentorId: sofia.id, authorId: thiago.id, rating: 5, comment: 'A Sofia é uma professora excepcional. Em uma hora mapeei meus principais erros de pronúncia e recebi um plano de 30 dias personalizado.' }),
    review({ bookingId: b10.id, mentorId: david.id, authorId: fernanda.id, rating: 4, comment: 'Ótima mentoria financeira, bem prática. Saí com minha planilha de orçamento pronta e 3 ações imediatas. Só achei que poderia ter um material de follow-up.' }),
    review({ bookingId: b11.id, mentorId: marina.id, authorId: thiago.id, rating: 5, comment: 'A Marina domina priorização como ninguém. trouxe exemplos reais de roadmap dela e adaptou tudo ao meu contexto. Solicitei mais 3 sessões!' }),
  ])

  console.log('✅ Seed concluído!')
  console.log({ ana: ana.email, mentors: 7, bookings: 11, reviews: 6 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
