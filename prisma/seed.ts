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
  await db.trackingEvent.deleteMany()
  await db.order.deleteMany()
  await db.enrollment.deleteMany()
  await db.lesson.deleteMany()
  await db.course.deleteMany()
  await db.review.deleteMany()
  await db.booking.deleteMany()
  await db.contentPost.deleteMany()
  await db.availability.deleteMany()
  await db.mentorProfile.deleteMany()
  await db.user.deleteMany()

  console.log('👤 Criando usuários...')
  const ana = await db.user.create({ data: { name: 'Ana Souza', email: 'ana@demo.com', bio: 'Product designer apaixonada por educação e produto digital.', avatarUrl: '/uploads/seed/avatar-ana.png' } })
  const lucas = await db.user.create({ data: { name: 'Lucas Prado', email: 'lucas@demo.com', bio: 'Dev backend migrando para produto.', avatarUrl: '/uploads/seed/avatar-lucas.png' } })
  const julia = await db.user.create({ data: { name: 'Júlia Mendes', email: 'julia@demo.com', bio: 'Empreendedora, fundadora de um app de bem-estar.', avatarUrl: '/uploads/seed/avatar-julia.png' } })
  const pedro = await db.user.create({ data: { name: 'Pedro Henrique', email: 'pedro@demo.com', bio: 'UX designer júnior em busca de crescimento.', avatarUrl: '/uploads/seed/avatar-pedro.png' } })
  const camila = await db.user.create({ data: { name: 'Camila Rocha', email: 'camila@demo.com', bio: 'Full-stack em transição de carreira.', avatarUrl: '/uploads/seed/avatar-camila.png' } })
  const fernanda = await db.user.create({ data: { name: 'Fernanda Dias', email: 'fernanda@demo.com', bio: 'Estudante de marketing digital.', avatarUrl: '/uploads/seed/avatar-fernanda.png' } })
  const thiago = await db.user.create({ data: { name: 'Thiago Nunes', email: 'thiago@demo.com', bio: 'Product manager em formação.', avatarUrl: '/uploads/seed/avatar-thiago.png' } })

  console.log('🧑‍🏫 Criando mentores...')

  const carlosUser = await db.user.create({ data: { name: 'Carlos Ferreira', email: 'carlos@demo.com', bio: 'Engenheiro de software com 12 anos de experiência em startups e big techs.', avatarUrl: '/uploads/seed/avatar-carlos.png' } })
  const carlosProfile = await db.mentorProfile.create({
    data: {
      userId: carlosUser.id,
      slug: 'carlos-ferreira',
      coverUrl: '/uploads/seed/cover-carlos.png',
      gaMeasurementId: 'G-MHDEMO01',
      metaPixelId: '1029384756101928',
      instagram: 'carlosferreira.dev',
      linkedin: 'https://linkedin.com/in/carlosferreira',
      github: 'carlosferreira',
      website: 'https://carlosferreira.dev',
      headline: 'Engenheiro de Software Sênior · Ex-Nubank',
      description:
        'Sou engenheiro de software há mais de 12 anos, com passagens por grandes fintechs e startups em escala. Ajudo desenvolvedores a evoluírem de júnior para sênior dominando arquitetura de software, React, Node.js e boas práticas de engenharia.\n\nMinhas mentorias são 100% práticas: revisamos seu código juntos, desenhamos arquiteturas de verdade e simulamos entrevistas técnicas para processos nacionais e internacionais. Vou te ajudar a montar um plano de estudos realista e a construir projetos que impressionam recrutadores.',
      categories: JSON.stringify(['Tecnologia', 'Carreira']),
      hourlyRate: 180,
      experienceYears: 12,
      languages: 'Português, Inglês',
    },
  })

  const marinaUser = await db.user.create({ data: { name: 'Marina Costa', email: 'marina@demo.com', bio: 'PM com 9 anos de experiência em produtos digitais de alto crescimento.', avatarUrl: '/uploads/seed/avatar-marina.png' } })
  const marina = await db.mentorProfile.create({
    data: {
      userId: marinaUser.id,
      slug: 'marina-costa',
      coverUrl: '/uploads/seed/cover-marina.png',
      headline: 'Product Manager · Carreira em Produto Digital',
      description:
        'Lidero produtos digitais há 9 anos em empresas de alto crescimento. Já lancei produtos do zero e escalei features usadas por milhões de pessoas.\n\nNa mentoria, te ajudo com: transição de carreira para produto, discovery e priorização (RICE, Jobs to be Done), métricas north star, roadmap e comunicação com stakeholders. Se você está migrando de área ou quer acelerar como PM, montamos juntos um plano de ação com metas de 30/60/90 dias.',
      categories: JSON.stringify(['Tecnologia', 'Carreira', 'Negócios']),
      hourlyRate: 150,
      experienceYears: 9,
      languages: 'Português, Inglês, Espanhol',
      instagram: 'marinacosta.pm',
      linkedin: 'https://linkedin.com/in/marinacosta',
    },
  })

  const rafaelUser = await db.user.create({ data: { name: 'Rafael Almeida', email: 'rafael@demo.com', bio: 'Growth marketer, scalei 3 startups de 0 a 7 dígitos.', avatarUrl: '/uploads/seed/avatar-rafael.png' } })
  const rafael = await db.mentorProfile.create({
    data: {
      userId: rafaelUser.id,
      slug: 'rafael-almeida',
      coverUrl: '/uploads/seed/cover-rafael.png',
      metaPixelId: '2938475610201938',
      headline: 'Estrategista de Growth & Marketing Digital',
      description:
        'Escalei três startups de zero a sete dígitos de receita com estratégias de growth orientadas a dados. Especialista em funis de aquisição, SEO, conteúdo paid media e automação.\n\nNas mentorias, saímos com um plano de growth prático: análise do seu funil, canais prioritários,Quick wins de CRO e um roadmap de experimentos para os próximos 90 dias. Ideal para founders, marketers e criadores que querem crescer com previsibilidade.',
      categories: JSON.stringify(['Marketing', 'Negócios']),
      hourlyRate: 120,
      experienceYears: 8,
      languages: 'Português, Inglês',
      instagram: 'rafaelgrowth',
      website: 'https://rafaelalmeida.com.br',
    },
  })

  const beatrizUser = await db.user.create({ data: { name: 'Beatriz Lima', email: 'beatriz@demo.com', bio: 'UX/UI designer sênior, especialista em design systems.', avatarUrl: '/uploads/seed/avatar-beatriz.png' } })
  const beatriz = await db.mentorProfile.create({
    data: {
      userId: beatrizUser.id,
      slug: 'beatriz-lima',
      coverUrl: '/uploads/seed/cover-beatriz.png',
      headline: 'UX/UI Designer Sênior · Design Systems',
      description:
        'Designer de produto há 10 anos, sou especialista em design systems e experiência de usuário em produtos financeiros e SaaS.\n\nNa mentoria revisamos seu portfólio linha a linha, trabalhamos storytelling de case studies, processo de design, handoff com engenharia e preparação para entrevistas (incluindo whiteboard challenge). Também ajudo times a estruturarem design systems do zero com Figma e tokens.',
      categories: JSON.stringify(['Design', 'Tecnologia']),
      hourlyRate: 140,
      experienceYears: 10,
      languages: 'Português, Inglês',
      instagram: 'beatriz.design',
      linkedin: 'https://linkedin.com/in/beatrizlima',
      website: 'https://behance.net/beatrizlima',
    },
  })

  const davidUser = await db.user.create({ data: { name: 'David Okoye', email: 'david@demo.com', bio: 'Assessor de investimentos CFP®, educador financeiro.', avatarUrl: '/uploads/seed/avatar-david.png' } })
  const david = await db.mentorProfile.create({
    data: {
      userId: davidUser.id,
      slug: 'david-okoye',
      coverUrl: '/uploads/seed/cover-david.png',
      headline: 'Assessor de Investimentos (CFP®) · Finanças Pessoais',
      description:
        'Certificado CFP® com 11 anos de mercado, já ajudei centenas de famílias a saírem das dívidas e construírem patrimônio com planejamento financeiro de verdade.\n\nNa mentoria organizamos sua vida financeira: orçamento, quitação de dívidas, reserva de emergência e alocação de investimentos (renda fixa, fundos, ações e FIIs) alinhada aos seus objetivos. Sem enrolação e sem "achismo": método, planilhas e acompanhamento.',
      categories: JSON.stringify(['Finanças', 'Negócios']),
      hourlyRate: 160,
      experienceYears: 11,
      languages: 'Português',
      linkedin: 'https://linkedin.com/in/davidokoye',
    },
  })

  const sofiaUser = await db.user.create({ data: { name: 'Sofia Santos', email: 'sofia@demo.com', bio: 'Professora de inglês há 14 anos, CELTA pela Cambridge.', avatarUrl: '/uploads/seed/avatar-sofia.png' } })
  const sofia = await db.mentorProfile.create({
    data: {
      userId: sofiaUser.id,
      slug: 'sofia-santos',
      coverUrl: '/uploads/seed/cover-sofia.png',
      headline: 'Professora de Inglês · Business English & Fluência',
      description:
        'Professora de inglês há 14 anos, com CELTA pela Universidade de Cambridge e experiência corporativa com executivos de multinacionais.\n\nAs mentorias são imersivas e personalizadas: preparação para entrevistas em inglês, business english, apresentações e reuniões, ou conversação para destravar a fluência de uma vez. Uso material autêntico e simulações reais do seu dia a dia.',
      categories: JSON.stringify(['Idiomas', 'Carreira']),
      hourlyRate: 90,
      experienceYears: 14,
      languages: 'Português, Inglês, Francês',
      instagram: 'sofia.english',
      website: 'https://sofiasantos.com.br',
    },
  })

  const anaProfile = await db.mentorProfile.create({
    data: {
      userId: ana.id,
      slug: 'ana-souza',
      coverUrl: '/uploads/seed/cover-ana.png',
      headline: 'Lead Product Designer · Design de Produto & Carreira',
      description:
        'Lead de design em produtos digitais com foco em experiências de alto impacto. Já construí design systems, conduzi discoveries e liderei squads multidisciplinares.\n\nMentoro designers em todos os níveis: portfólio, processo de UX, pesquisa com usuários, métricas de design, liderança e transição para produto. Vamos evoluir sua carreira com um plano claro e prático.',
      categories: JSON.stringify(['Design', 'Carreira']),
      hourlyRate: 130,
      experienceYears: 8,
      languages: 'Português, Inglês',
      instagram: 'anadesign',
      linkedin: 'https://linkedin.com/in/anasouza',
      website: 'https://anasouza.design',
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

  // ==================== CURSOS ====================
  console.log('🎓 Cursos, aulas e matrículas...')

  const course = async (
    mentorId: string,
    data: { title: string; description: string; category: string; level: string; price: number; coverUrl?: string },
    lessons: { title: string; description: string; videoUrl?: string; content?: string; durationMin: number }[]
  ) => {
    const c = await db.course.create({ data: { mentorId, ...data } })
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i]
      await db.lesson.create({
        data: {
          courseId: c.id,
          title: l.title,
          description: l.description,
          videoUrl: l.videoUrl ?? null,
          content: l.content ?? null,
          durationMin: l.durationMin,
          order: i + 1,
        },
      })
    }
    return c
  }

  const cursoArquitetura = await course(
    carlosProfile.id,
    {
      title: 'Arquitetura de Software na Prática',
      description:
        'Do caos de pastas à arquitetura em camadas: um curso direto ao ponto para devs que querem escrever sistemas organizados, testáveis e prontos para escalar. Baseado em 12 anos de projetos reais — incluindo os erros que eu cometerei para você não cometer.',
      category: 'Tecnologia',
      level: 'INTERMEDIARIO',
      coverUrl: '/uploads/seed/course-arquitetura.png',
      price: 189,
    },
    [
      {
        title: 'Bem-vindo: como aproveitar este curso',
        description: 'O método do curso, quem é ele para e como extrair o máximo de cada módulo.',
        durationMin: 5,
        content:
          'Bem-vindo!\n\nEste curso nasceu das mentorias 1:1 que eu faço há anos. Percebi que 80% das dúvidas de engenharia giram em torno do mesmo tema: como organizar código para que ele continue crescendo sem virar um monstro.\n\nO formato é simples: cada aula traz um princípio, um exemplo real e um checklist para você aplicar no seu projeto ainda hoje. Recomendo fazer uma aula por dia e aplicar antes de avançar.\n\nPré-requisitos: lógica de programação sólida e alguma experiência com qualquer linguagem (os exemplos usam TypeScript/React, mas os conceitos são universais).\n\nBons estudos — e me conte no mural como está indo!',
      },
      {
        title: 'Camadas e fronteiras: organizando um app real',
        description: 'A divisão em camadas que sobrevive ao crescimento: UI, aplicação, domínio e infraestrutura.',
        durationMin: 20,
        content:
          'O problema de quase todo projeto: tudo misturado\n\nVocê abre o projeto e o componente React chama a API, formata moeda, decide regras de negócio e salva no cache — tudo na mesma função. Funciona... até a segunda tela, o segundo dev ou o segundo ano.\n\nA solução: 4 camadas com responsabilidades claras\n\n1. UI (interface): componentes, telas, estados visuais. Não sabe nada sobre banco de dados ou regras de negócio — só exibe e coleta informação.\n2. Aplicação (use cases): orquestra fluxos. "Criar pedido" é um caso de uso: valida, chama o domínio, persiste, dispara efeitos. É a camada mais importante e a mais esquecida.\n3. Domínio: as regras que fazem seu negócio ser seu negócio. Cálculo de preço, status possíveis de um pedido, invariantes. Puro, sem dependências de framework.\n4. Infraestrutura: HTTP, banco de dados, filas, cache. Detalhe, não protagonista.\n\nA regra de ouro\n\nDependências apontam para dentro: UI → Aplicação → Domínio, e a infraestrutura é plugada na aplicação. O domínio nunca importa React nem o SDK do banco.\n\nChecklist para aplicar hoje\n\n• Escolha UMA regra de negócio que vive espalhada e centralize-a em um módulo próprio.\n• Crie uma pasta de "services" ou "use cases" e mova a orquestração para lá.\n• Seu componente ficou só com display e chamada ao use case? Perfeito.\n\nNa próxima aula, refatoramos um app real gravado ao vivo.',
      },
      {
        title: 'Refatoração ao vivo: do caos à arquitetura limpa',
        description: 'Aula gravada: pegamos um app desorganizado e aplicamos camadas passo a passo, sem quebrar nada.',
        durationMin: 35,
        videoUrl: 'https://www.youtube.com/watch?v=dSX0pLQXI6E',
      },
      {
        title: 'Modelagem de domínio e casos de uso',
        description: 'Como traduzir requisitos em entidades, invariantes e casos de uso com nomes que o time entende.',
        durationMin: 25,
        content:
          'Antes do código: a linguagem\n\nUm dos sinais mais claros de arquitetura saudável é o time conversar usando as mesmas palavras do código. Se o comercial fala "reserva" e o código tem "BookingEntityV2", algo está errado.\n\nEntidades e invariantes\n\nUma entidade tem identidade e regras que devem sempre valer (invariantes). Um pedido não pode existir sem cliente; uma matrícula não pode ser para um curso despublicado. Coloque essas regras NO ENTIDADE ou no caso de uso — nunca espalhadas em ifs pela UI.\n\nCasos de uso: os verbos do sistema\n\nCada caso de uso é uma intenção: InscreverAluno, CancelarAgendamento, PublicarCurso. Nomeie como o negócio nomeia. Um caso de uso:\n\n1. Valida entrada (dados fazem sentido?).\n2. Aplica regras de negócio (é permitido?).\n3. Executa efeitos (persistir, notificar).\n4. Retorna um resultado claro (sucesso ou erro de negócio — não stack trace cru).\n\nExercício\n\nPegue 3 telas do seu sistema e escreva, em português, quais casos de uso elas chamam. Se uma tela chama 7 coisas diferentes, ela provavelmente esconde dois casos de uso que merecem nomes próprios.',
      },
      {
        title: 'Cache e performance no frontend sem mágica',
        description: 'Estratégias de cache em camadas: memoização, SWR, HTTP cache e invalidação que funciona.',
        durationMin: 18,
        content:
          'Performance é arquitetura\n\nGrande parte dos problemas de performance que vejo em mentorias não é algoritmo — é dados sendo buscados e processados mais vezes do que deveriam.\n\nAs 4 camadas de cache que uso\n\n1. Memoização local (useMemo/chave de dependência): para cálculos derivados na renderização.\n2. Cache de estado do servidor (TanStack Query, SWR): deduplica pedidos, mantém dados "frescos por tempo X" e resolve revalidação. É o maior ganho por linha de código do frontend moderno.\n3. HTTP cache: cabeçalhos no backend (Cache-Control, ETag). Muitas equipes ignoram o quanto o browser já ajudaria.\n4. CDN/edge para estáticos: resolvido por padrão na maioria das hospedagens — confira.\n\nInvalidação: a parte difícil\n\nRegra prática: invalide por intenção, não por URL. Quando o usuário publica um comentário, invalide "lista de comentários deste post" — não espere o TTL. Bibliotecas como TanStack Query fazem isso com query keys bem desenhadas: hierárquicas, previsíveis, fáceis de invalidar em lote.\n\nArmadilhas\n\n• Cachear dados que mudam com o contexto do usuário (permissões) em cache global.\n• estados de carregamento sem esqueleto: cache resolve dados, não percepção. Adicione skeletons.\n• TTL infinito "porque nunca muda" — tudo muda.\n\nNa aula final: um checklist para fechar o ciclo.',
      },
      {
        title: 'Encerramento: checklist e próximos passos',
        description: 'O checklist completo de arquitetura para revisar todo projeto novo — e como continuar evoluindo.',
        durationMin: 6,
        content:
          'Parabéns por chegar até aqui!\n\nO checklist de revisão (use em todo projeto novo)\n\n□ As regras de negócio vivem em um lugar só?\n□ Os componentes UI chamam casos de uso (ou hooks que os envolvem) — e nada mais?\n□ As dependências apontam para dentro (domínio não importa framework)?\n□ Existe uma estratégia de cache escrita em uma linha por tipo de dado?\n□ Erros de negócio são diferenciados de erros técnicos?\n□ O time usa os mesmos nomes do código nas conversas?\n\nPróximos passos\n\n1. Aplique o checklist no seu projeto atual e liste 3 dívidas de arquitetura priorizadas por dor real.\n2. Refatore UMA por semana, com testes por perto.\n3. Traga o resultado para uma mentoria 1:1 — revisamos juntos e destravamos o que travar.\n\nObrigado pela jornada. Agora é prática!',
      },
    ]
  )

  const cursoPM = await course(
    marina.id,
    {
      title: 'Do Zero a Product Manager',
      description:
        'Curso gratuito e direto: o que um PM faz de verdade, como fazer discovery que gera insight, priorizar com RICE e montar seu plano de transição em 90 dias. O mesmo conteúdo que uso nas mentorias com quem está migrando para produto.',
      category: 'Carreira',
      level: 'INICIANTE',
      coverUrl: '/uploads/seed/course-product-manager.png',
      price: 0,
    },
    [
      {
        title: 'O que faz (e o que não faz) um PM',
        description: 'Desmistificando a função: responsabilidade sem autoridade, e por que isso é um superpoder.',
        durationMin: 12,
        content:
          'A definição que uso\n\nProduct Manager é responsável por maximizar o impacto gerado pelo time de produto — normalmente sem autoridade direta sobre ninguém. Parece contradição? É justamente aí que mora o trabalho.\n\nO que um PM faz no dia a dia\n\n• Descoberta: conversa com usuários, entende problemas e valida se valem a pena.\n• Priorização: escolhe o que fazer (e, mais importante, o que NÃO fazer).\n• Contexto: garante que engenharia e design entendam o "porquê" de cada entrega.\n• Métricas: define como o sucesso será medido e acompanha depois do lançamento.\n• Comunicação: alinha stakeholders que têm interesses diferentes.\n\nO que NÃO é responsabilidade do PM\n\n• Especificar cada detalhe de tela (isso é design + engenharia).\n• Ser "o dono das ideias" — as melhores soluções quase nunca vêm do PM.\n• Gerenciar pessoas (PM não é gerente de gente, apesar do nome).\n\nTeste rápido: se no seu trabalho você passa mais tempo escrevendo tarefas do que falando com usuários e olhando métricas, você provavelmente virou um "gerente de backlog". O curso vai te ajudar a voltar ao essencial.',
      },
      {
        title: 'Discovery: entrevistas que geram insight',
        description: 'O roteiro de entrevistas que uso: perguntas sobre comportamento passado, não opiniões sobre o futuro.',
        durationMin: 18,
        content:
          'O erro clássico\n\n"Você usaria um app que faz X?" — Se você já fez essa pergunta, sabe que todo mundo diz sim por educação. Entrevista de discovery não busca opinião sobre ideias; busca EVIDÊNCIA sobre comportamento.\n\nO roteiro em 4 blocos\n\n1. Contexto: "Me conte como você faz X hoje, passo a passo." Deixe a pessoa narrar — interrupções são ouro, mas só depois da história completa.\n2. Dor: "Qual a parte mais chata/trabalhosa desse processo?" Peça o ÚLTIMO episódio concreto, não a regra geral.\n3. Workarounds: "O que você já tentou para resolver?" Quem paga por solução é quem já improvisou uma (planilha no Excel conta).\n4. Fechamento: "Se você pudesse mudar uma coisa, qual?" — e anote; é priorização de graça.\n\nQuantas entrevistas?\n\n5 a 8 por tema costuma saturar: as histórias começam a se repetir. Mais que isso, você já está coletando opinião, não evidência.\n\nSíntese\n\nDepois de cada rodada, escreva as dores em cards (uma dor por card) e agrupe por tema. Dores com workaround + frequência alta = candidatos a problema de produto. Na próxima aula, priorizamos o que resolver primeiro.',
      },
      {
        title: 'Priorização com RICE na prática',
        description: 'Como pontuar iniciativas com Reach, Impact, Confidence e Effort — e os erros que distorcem o resultado.',
        durationMin: 15,
        content:
          'RICE em 60 segundos\n\nRICE = (Reach × Impact × Confidence) / Effort\n\n• Reach: quantas pessoas/entidades afetadas por período (usuários/mês, sessões/mês).\n• Impact: quanto cada uma é afetada (escala: 0.25 mínimo, 0.5 baixo, 1 médio, 2 alto, 3 massivo).\n• Confidence: sua confiança nas estimativas (100% alta, 80% média, 50% baixa — abaixo disso nem entre na lista).\n• Effort: pessoas-mês de trabalho (quanto maior, pior).\n\nOs 3 erros que distorcem tudo\n\n1. Inflar Impact: todo mundo acha sua iniciativa é "massiva". Exija evidência (entrevistas, dados) antes de pontuar acima de 1.\n2. Effort otimista: multiplique a primeira estimativa de engenharia por 1.5 e pergunte "o que precisa ser verdade para dar certo?"\n3. Tratar o score como sentença: RICE ordena a conversa, não substitui. Números próximos (dentro de 20%) são empates — decida com estratégia.\n\nExercício\n\nPegue as dores da aula anterior e pontue 5 iniciativas candidatas com RICE. Leve a tabela para a mentoria — revisamos os números juntos.',
      },
      {
        title: 'Métricas north star: vídeo comentado',
        description: 'Como definir a métrica certa, evitar métricas de vaidade e conectar o roadmap ao impacto.',
        durationMin: 20,
        videoUrl: 'https://www.youtube.com/watch?v=8nMKRTaD4-E',
      },
      {
        title: 'Seu plano de transição em 90 dias',
        description: 'O plano mês a mês que mais funcionou com mentorados vindo de engenharia, design e marketing.',
        durationMin: 14,
        content:
          'Transição é processo, não salto\n\nPlano de 90 dias (ajuste ao seu ritmo; 5–8h/semana):\n\nMês 1 — Fundamentos e vocabulário\n\n• Estude os conceitos deste curso e o material complementar (Inspired, do Marty Cagan, e os blogs de Lenny Rachitsky e Julie Zhuo).\n• Reescreva seu currículo em linguagem de produto: impacto e métricas, não tarefas.\n• Marque 2 mentorias para calibrar narrativa (posso ajudar aqui!).\n\nMês 2 — Experiência prática\n\n• Adote produto no trabalho atual: ofereça-se para um discovery, uma análise de métricas ou um teste A/B — mesmo sem o cargo.\n• Escreva 1 case documentado: problema → processo → resultado (números!).\n• Participe de comunidades de produto; ajude alguém com menos bagagem (ensinar consolida).\n\nMês 3 — Posicionamento e entrevistas\n\n• Ajuste LinkedIn para a vaga-alvo (título e headline contam mais que você imagina).\n• Ensaios de entrevista: product sense, métricas e comportamental — simule com colegas e com mentor.\n• Aplique para 5–10 vagas com case adaptado por empresa. Qualidade > volume.\n\nRegra de ouro: ninguém é contratado por "querer ser PM". É contratado por evidência de que já pensa como PM. Este plano é exatamente sobre gerar essa evidência.',
      },
    ]
  )

  const cursoDS = await course(
    beatriz.id,
    {
      title: 'Design Systems do Zero ao Ship',
      description:
        'Tokens, componentes, governança e handoff: construa um design system que engenharia ama usar e que sobrevive ao crescimento do produto. Para designers e times enxutos que querem consistência sem burocracia.',
      category: 'Design',
      level: 'INTERMEDIARIO',
      coverUrl: '/uploads/seed/course-design-systems.png',
      price: 199,
    },
    [
      {
        title: 'Fundamentos: tokens primitivos e semânticos',
        description: 'A base de tudo: como estruturar cores, tipografia e espaçamento em duas camadas de tokens.',
        durationMin: 22,
        content:
          'Dois tipos de tokens — e por que separar\n\nTokens primitivos: a paleta bruta. emerald.500, stone.100, spacing.4, radius.lg. São nomes neutros, sem opinião de uso. Servem como matéria-prima.\n\nTokens semânticos: significado de uso. color.bg.surface, color.text.primary, spacing.card.gap, radius.button. Referenciam os primitivos e carregam a intenção.\n\nPor que a separação importa: quando o rebranding chegar (vai chegar), você troca os primitivos e todos os semânticos atualizam. E quando o dark mode chegar, você troca apenas os VALORES dos semânticos por tema — nada de caçar hex code por 40 telas.\n\nEstrutura mínima que recomendo\n\n• Cor: surface (fundo), text (primário/secundário/desabilitado), border, feedback (success/warning/danger/info), brand (primário/hover).\n• Tipografia: escala de 6–8 tamanhos com peso e linha definidos por uso (display, title, body, caption) — não por pixel solto.\n• Espaçamento: escala única (4, 8, 12, 16, 24, 32, 48, 64) e proibição de valores fora dela.\n\nRegra anti-caos\n\nTodo token semântico novo precisa de uma justificativa de uso em uma linha. Se você não consegue escrever quando usar, ele não deve existir.',
      },
      {
        title: 'Componentizando no Figma: vídeo prático',
        description: 'Variantes, propriedades e auto layout na prática: do botão simples ao padrão composto.',
        durationMin: 28,
        videoUrl: 'https://www.youtube.com/watch?v=bEKmDQAIvfM',
      },
      {
        title: 'Governança para times enxutos',
        description: 'Como decidir o que entra no sistema, contribuições e versionamento — sem virar comitê.',
        durationMin: 18,
        content:
          'O paradoxo da governança\n\nDesign system sem regras vira selo postal (ninguém contribui); com regras pesadas vira gargalo. A saída: governança proporcional ao time.\n\nModelo que aplico em times pequenos (2–10 designers)\n\n1. Um owner claro (você) e um canal público de pedidos. Toda contribuição nasce ali.\n2. Trilhos de decisão: componente novo → precisa de caso de uso real + demanda em 2 telas + revisão do owner. Mudança em componente existente → proposta com antes/depois, owner aprova em até 48h.\n3. Release notes curtas por atualização (o "changelog" do Figma). Quem usa precisa saber o que mudou sem entrar em reunião.\n\nO que NÃO entra no sistema\n\n• Componente usado em UMA tela (mantenha no arquivo do projeto).\n• Componente "futuro" sem uso atual (você vai redesenhá-lo de qualquer forma quando o caso real chegar).\n• Exceções disfarçadas de variantes ("botão-azul-só-para-checkout"). Se é exceção, é conversa — não variante.\n\nSinal de saúde: se o time contribui mais do que consome, o sistema está vivo. Se só você publica, trate isso como alerta e vá atrás dos porquês.',
      },
      {
        title: 'Handoff com engenharia sem atrito',
        description: 'Especificações que engenharia precisa de verdade, e como trabalhar com storybook e tokens exportados.',
        durationMin: 16,
        content:
          'Handoff não é entrega — é tradução\n\nO designer entrega intenção; a engenharia entrega implementação. O atrito nasce quando a intenção fica implícita e a implementação precisa adivinhar.\n\nO que engenharia realmente precisa\n\n1. Tokens exportados (não hex codes soltos): a mesma fonte de verdade, processada por ferramenta, com nomes idênticos ao do código.\n2. Estados completos: default, hover, focus, ativo, desabilitado, loading, vazio, erro, com dado longo (o texto que quebra o layout sempre existe). A ausência de estados é a maior fonte de retrabalho.\n3. Comportamento responsivo definido como regra ("em telas < 768px, colunas viram empilhado"), não como 3 telas desenhadas.\n4. Critério de aceite visual: o que é "pronto"? Uma frase por componente resolve 90% das discussões de QA.\n\nStorybook como contrato\n\nSe o time usa Storybook, o componente publicado É a especificação. Design revisa o story, não a tela desenhada. Isso soa radical e economiza semanas: o que está no story é o que roda.\n\nChecklist final de handoff\n\n□ Tokens sincronizados?\n□ Todos os estados desenhados ou escritos?\n□ Regra responsiva em texto?\n□ Critério de aceite por componente?\n□ Canal combinado para dúvidas durante a implementação?',
      },
    ]
  )

  const cursoGrowth = await course(
    rafael.id,
    {
      title: 'Growth: Aquisição Previsível',
      description:
        'Pare de apostar em campanhas isoladas: construa um sistema de aquisição com funil instrumentado, experimentos priorizados e canais que compostam. O playbook que usei para escalar 3 startups de 0 a 7 dígitos.',
      category: 'Marketing',
      level: 'INTERMEDIARIO',
      coverUrl: '/uploads/seed/course-growth.png',
      price: 149,
    },
    [
      {
        title: 'Anatomia de um funil que converte',
        description: 'Visita → cadastro → ativação → retenção: onde está seu gargalo real e como instrumentar.',
        durationMin: 20,
        content:
          'Funil não é marketing — é diagnóstico\n\nAntes de "fazer growth", você precisa saber ONDE o sistema vaza. O funil básico:\n\nVisitante → Cadastro → Ativação → Retenção\n\nA armadilha mais comum: investir em topo (tráfego) quando o vazamento está na ativação. Comprar mais visitas para um funil que perde 90% no primeiro uso é pagar para encher uma banheira sem tampa.\n\nComo instrumentar (mesmo simples)\n\n1. Defina o evento de ativação: a ação que, quando o usuário faz, a chance de reter dispara (ex.: no Notion, criar a primeira página; no seu produto, o equivalente). Descubra o seu olhando os usuários retidos vs. os que churnaram.\n2. Taxa de conversão por etapa, por semana. Planilha resolve; ferramenta facilita.\n3. Segmento por canal de origem desde o dia 1. "Conversão de 3%" sem canal é número de vaidade.\n\nDiagnóstico em 3 perguntas\n\n• Cadastro → ativação < 25%? Problema de onboarding, não de tráfego.\n• Ativação alta mas retenção cai no mês 2? Problema de valor recorrente.\n• Topo pequeno e etapas saudáveis? Aí sim: canais de aquisição (próximas aulas).\n\nTraga seus números para a mentoria — diagnosticamos juntos.',
      },
      {
        title: '25 experimentos de CRO: vídeo ao vivo',
        description: 'Biblioteca de experimentos de conversão com priorização por ICE e exemplos reais comentados.',
        durationMin: 42,
        videoUrl: 'https://www.youtube.com/watch?v=FBnJklzWqtU',
      },
      {
        title: 'SEO e conteúdo: o canal que compõe',
        description: 'Como construir uma máquina de conteúdo que gera clientes enquanto você dorme — sem virar fábrica de texto.',
        durationMin: 22,
        content:
          'Por que SEO?\n\nTodo canal pago para de funcionar quando você para de pagar. SEO compõe: o artigo certo gera clientes por anos. O custo é tempo e consistência — a moeda de quem está começando.\n\nA estratégia mínima viável\n\n1. Head de cauda longa: busque perguntas específicas que seu comprador digita ("como cobrar mentoria", "template de plano de estudos"). Volumem baixo, intenção alta, concorrência baixa. Vencer 20 keywords de cauda longa > perder 1 head term.\n2. Página por dor, não por keyword: cada artigo resolve UMA dor com profundidade real. Conteúdo raso destrói a autoridade do domínio.\n3. Prova e produto no meio: CTA contextual, não banner genérico no rodapé.\n\nCadência que sobrevive\n\n1 artigo bom/semana durante 6 meses vale mais que 30 no primeiro mês e silêncio depois. Calendário realista + batch de produção (escreva 2 por sessão) é o que sustenta.\n\nMétricas honestas\n\n• Tráfego orgânico por artigo (não total — por artigo você aprende padrão).\n• Conversão artigo → cadastro (2–5% é saudável com CTA bom).\n• Clientes vindos de orgânico por mês (o número que paga as contas).\n\nSEO é lento... até ser rápido. Comece hoje; em 90 dias você tem dados, em 12 meses, ativo.',
      },
      {
        title: 'Seu roadmap de experimentos',
        description: 'Montando o ciclo de experimentos: hipótese, priorização por ICE, threshold de decisão e cadência.',
        durationMin: 15,
        content:
          'Growth é processo, não inspiração\n\nO motor do growth é o ciclo de experimentos: idear → priorizar → testar → aprender → repetir. Sem cadência, tudo vira opinião.\n\nO template de hipótese (copie e use)\n\n"Como [área do funil] está com [problema medido], acreditamos que [mudança específica] vai [efeito esperado]. Saberemos que funcionou se [métrica] subir de X para Y em [prazo]."\n\nPriorização por ICE\n\nImpact (1–10) × Confidence (1–10) × Ease (1–10) = score. Diferente do RICE de produto, ICE é rápido de propósito: o objetivo é ordenar a fila em 15 minutos, não achismar.\n\nThreshold de decisão (defina ANTES de testar)\n\n• Resultado ≥ meta: scale (dobrar a aposta).\n• Resultado neutro: iterar uma variável do mesmo experimento.\n• Resultado negativo: matar sem drama e documentar o aprendizado.\n\nCadência\n\n2–3 experimentos por semana em time pequeno. Documente TUDO numa planilha viva (hipótese, score, resultado, aprendizado). Em 12 semanas você terá o ativo mais valioso de marketing: conhecimento sobre SEU público que nenhum concorrente copia.\n\nPróximo passo: monte sua primeira fila com 10 hipóteses usando o template — e leve para revisarmos na mentoria.',
      },
    ]
  )

  const cursoIngles = await course(
    sofia.id,
    {
      title: 'Inglês para Entrevistas Internacionais',
      description:
        'Prepare-se para processos em inglês com o método que uso com executivos há 14 anos: STAR method, vocabulário de alto impacto e rotina de prática de 20 minutos. Simulações reais, feedback e material autêntico.',
      category: 'Idiomas',
      level: 'INICIANTE',
      coverUrl: '/uploads/seed/course-english.png',
      price: 89,
    },
    [
      {
        title: 'Mapeando seus pontos fracos',
        description: 'Auto-diagnóstico guiado: fluência, vocabulário, pronúncia ou nervosismo — onde focar primeiro?',
        durationMin: 10,
        content:
          'Antes de estudar mais, estude melhor\n\nA maior perda de tempo em preparação é treinar o que você JÁ sabe bem. Este diagnóstico rápido direciona seu esforço:\n\nGrave-se respondendo "Tell me about yourself" por 90 segundos. Depois avalie honestamente:\n\n1. Fluência: você travou mais de 3 vezes? Preencheu silêncios com "äh/né"? → priorize fluência (aula 4).\n2. Vocabulário: repetiu as mesmas 10 palavras? Não soube dizer suas realizações? → priorize vocabulário (aula 2).\n3. Estrutura: a resposta foi circular, sem começo/meio/fim? → priorize método STAR (aula 2 e 3).\n4. Pronúncia: o gravador entendeu você? Peça para alguém ouvir 30 segundos e repetir de volta.\n5. Nervosismo: a versão gravada ficou pior que a sua versão mental? → simule mais (aula 3).\n\nRotina mínima que funciona\n\n20 minutos por dia, 5 dias por semana: 10 min de input (ouvir/shadowing), 10 min de output (responder perguntas em voz alta, gravando). Consistência vence intensidade — sempre.\n\nE não esqueça: o objetivo não é inglês perfeito. É inglês CLARO o suficiente para o seu talento aparecer.',
      },
      {
        title: 'STAR method e vocabulário de alto impacto',
        description: 'A estrutura que entrevistadores esperam + as palavras que fazem suas respostas soar sênior.',
        durationMin: 18,
        content:
          'STAR: a estrutura universal\n\nSituation → Task → Action → Result\n\n• Situation (1 frase): contexto mínimo. "Our team was migrating a legacy checkout with 40k daily users."\n• Task (1 frase): SEU desafio específico. "I was responsible for zero-downtime traffic migration."\n• Action (60% da resposta): o que VOCÊ fez, com verbos de ação. Aqui mora a avaliação.\n• Result (números!): "Migration completed with zero incidents; conversion improved 4%."\n\nO erro nº1 dos brasileiros: gastar 80% do tempo em Situation/Task (contexto) e 20% em Action/Result. Inverta.\n\nVocabulário de alto impacto\n\nTroque isso → por isso:\n\n• "I helped with..." → "I led / drove / owned..."\n• "We did a lot of things" → "I shipped X, which reduced Y by Z%"\n• "It was hard" → "The main challenge was X, so I..."\n• "I think / maybe" → "The data showed / Based on that, I decided"\n\nFrases-ponte para ganhar tempo sem parecer travado\n\n• "That\'s a great question — let me think for a second."\n• "There are two angles here; let me start with the first."\n\nExercício: escreva 3 histórias suas no formato STAR (em inglês), grave, ouça, reescreva. Na próxima aula, vemos isso em ação numa simulação comentada.',
      },
      {
        title: 'Mock interview comentada',
        description: 'Simulação real de entrevista técnica em inglês, com erros comuns e correções ao vivo.',
        durationMin: 25,
        videoUrl: 'https://www.youtube.com/watch?v=1tUxwfDKv24',
      },
      {
        title: 'Rotina de prática de 20 minutos',
        description: 'O plano diário de shadowing e output que destrava a fala em 30 dias — com material autêntico.',
        durationMin: 12,
        content:
          'A rotina dos 20 minutos (5 dias/semana)\n\nMinutos 0–10: INPUT ATIVO (shadowing)\n\n1. Escolha 1–2 minutos de áudio autêntico do SEU contexto (entrevistas no YouTube, podcasts de produto/engenharia em inglês).\n2. Ouça uma vez entendendo o geral.\n3. Shadowing: ouça frase por frase e repita IMITANDO ritmo, entonação e pausas — não só as palavras. 4–5 repetições por frase.\n4. Grave sua última repetição e compare com o original.\n\nMinutos 10–20: OUTPUT DIRIGIDO\n\n1. Responda UMA pergunta de entrevista em voz alta (1–2 min), gravando.\n2. Ouça e marque: travadas, muletas ("like", "äh"), uma palavra que você quis dizer e não soube.\n3. Responda DE NOVO a mesma pergunta, melhorando. A segunda versão é sempre visivelmente melhor — esse é o mecanismo de evolução.\n\nBanco de perguntas (rote por temas)\n\n• Tell me about yourself • A project you\'re proud of • A conflict with a colleague • A failure and what you learned • Why this company?\n\nComo acompanhar progresso\n\nGuarde a gravação do dia 1. No dia 30, ouça as duas. A diferença é o seu combustível para os próximos 30 dias.\n\nE quando quiser simulação com correção humana ao vivo — você sabe onde me encontrar: agende uma mentoria e simulamos seu processo real.',
      },
    ]
  )

  // Matrículas com progresso
  console.log('✏️  Matrículas...')
  const lessonsPM = await db.lesson.findMany({ where: { courseId: cursoPM.id }, orderBy: { order: 'asc' } })
  const lessonsArq = await db.lesson.findMany({ where: { courseId: cursoArquitetura.id }, orderBy: { order: 'asc' } })
  const lessonsGrowth = await db.lesson.findMany({ where: { courseId: cursoGrowth.id }, orderBy: { order: 'asc' } })

  await db.enrollment.createMany({
    data: [
      { courseId: cursoPM.id, studentId: ana.id, completedLessonIds: JSON.stringify([lessonsPM[0].id, lessonsPM[1].id]) },
      { courseId: cursoArquitetura.id, studentId: lucas.id, completedLessonIds: JSON.stringify([lessonsArq[0].id, lessonsArq[1].id, lessonsArq[2].id]) },
      { courseId: cursoGrowth.id, studentId: thiago.id, completedLessonIds: JSON.stringify([lessonsGrowth[0].id]) },
    ],
  })

  // ==================== TRÁFEGO (demonstração) ====================
  console.log('📈 Tráfego e pedidos demo...')

  // Pedidos pagos (compras) + evento de conversão correspondente
  const paidOrders = [
    { course: cursoArquitetura, mentor: carlosProfile, student: lucas, method: 'PIX', daysAgo: 11, utm: { source: 'instagram', medium: 'cpc', campaign: 'arquitetura-boost-01', fbclid: 'IwARDemoFbClick001' }, channel: 'paid_social', landing: 'mentor_lp' },
    { course: cursoArquitetura, mentor: carlosProfile, student: julia, method: 'CREDIT_CARD', daysAgo: 5, utm: { source: 'instagram', medium: 'cpc', campaign: 'arquitetura-boost-01', fbclid: 'IwARDemoFbClick002' }, channel: 'paid_social', landing: 'mentor_lp' },
    { course: cursoDS, mentor: beatriz, student: pedro, method: 'PIX', daysAgo: 8, utm: { source: null, medium: null, campaign: null }, channel: 'direct', landing: 'platform' },
    { course: cursoGrowth, mentor: rafael, student: fernanda, method: 'PIX', daysAgo: 3, utm: { source: 'google', medium: 'cpc', campaign: 'growth-course', gclid: 'EAIaIQobDemoGclId001' }, channel: 'paid_search', landing: 'platform' },
    { course: cursoIngles, mentor: sofia, student: camila, method: 'CREDIT_CARD', daysAgo: 1, utm: { source: 'instagram', medium: 'bio', campaign: null }, channel: 'social', landing: 'mentor_lp' },
  ]

  for (const o of paidOrders) {
    const when = new Date()
    when.setDate(when.getDate() - o.daysAgo)
    when.setHours(12, 30, 0, 0)
    await db.order.create({
      data: {
        courseId: o.course.id,
        studentId: o.student.id,
        mentorId: o.mentor.id,
        amount: o.course.price,
        paymentMethod: o.method,
        status: 'PAID',
        utmSource: o.utm.source,
        utmMedium: o.utm.medium,
        utmCampaign: o.utm.campaign,
        gclid: o.utm.gclid ?? null,
        fbclid: o.utm.fbclid ?? null,
        channel: o.channel,
        landingPage: o.landing,
        createdAt: when,
      },
    })
    await db.trackingEvent.create({
      data: {
        name: 'purchase',
        mentorId: o.mentor.id,
        courseId: o.course.id,
        userId: o.student.id,
        valueCents: Math.round(o.course.price * 100),
        utmSource: o.utm.source,
        utmMedium: o.utm.medium,
        utmCampaign: o.utm.campaign,
        gclid: o.utm.gclid ?? null,
        fbclid: o.utm.fbclid ?? null,
        channel: o.channel,
        path: o.landing === 'mentor_lp' ? '/?mentor=slug' : '/?course=id',
        createdAt: when,
      },
    })
  }

  // Funil de eventos (page_view → view_item → begin_checkout) espalhado nos últimos 14 dias
  const funnelMentors = [
    { profile: carlosProfile, courses: [cursoArquitetura], weight: 34 },
    { profile: marina, courses: [cursoPM], weight: 18 },
    { profile: rafael, courses: [cursoGrowth], weight: 22 },
    { profile: beatriz, courses: [cursoDS], weight: 16 },
    { profile: sofia, courses: [cursoIngles], weight: 14 },
  ]
  const channelsDemo: { channel: string; utm: Record<string, string | null> }[] = [
    { channel: 'direct', utm: {} },
    { channel: 'social', utm: { utmSource: 'instagram', utmMedium: 'bio' } },
    { channel: 'paid_social', utm: { utmSource: 'instagram', utmMedium: 'cpc', utmCampaign: 'boost-lp-01', fbclid: 'IwARDemoFunnel' } },
    { channel: 'paid_search', utm: { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'mentores-2025', gclid: 'EAIaDemoFunnel' } },
    { channel: 'referral', utm: { utmSource: 'linkedin', utmMedium: 'post' } },
    { channel: 'email', utm: { utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'aula-aberta' } },
  ]

  let dayCursor = 0
  for (const m of funnelMentors) {
    for (let i = 0; i < m.weight; i++) {
      const ch = channelsDemo[i % channelsDemo.length]
      const when = new Date()
      when.setDate(when.getDate() - (dayCursor % 14))
      when.setHours(9 + (i % 10), (i * 7) % 60, 0, 0)
      dayCursor += 3

      const base = {
        mentorId: m.profile.id,
        utmSource: ch.utm.utmSource ?? null,
        utmMedium: ch.utm.utmMedium ?? null,
        utmCampaign: ch.utm.utmCampaign ?? null,
        gclid: ch.utm.gclid ?? null,
        fbclid: ch.utm.fbclid ?? null,
        channel: ch.channel,
        createdAt: when,
      }

      await db.trackingEvent.create({ data: { ...base, name: 'page_view', path: '/?mentor=slug' } })

      // Aproximadamente metade dos visitantes viu um curso; um terço disso iniciou checkout
      if (i % 2 === 0) {
        await db.trackingEvent.create({
          data: { ...base, name: 'view_item', courseId: m.courses[i % m.courses.length].id, path: '/?mentor=slug' },
        })
        if (i % 6 === 0) {
          await db.trackingEvent.create({
            data: { ...base, name: 'begin_checkout', courseId: m.courses[i % m.courses.length].id, path: '/?mentor=slug' },
          })
        }
      }
    }
  }

  console.log('✅ Seed concluído!')
  console.log({ ana: ana.email, mentors: 7, cursos: 5, bookings: 11, reviews: 6 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
