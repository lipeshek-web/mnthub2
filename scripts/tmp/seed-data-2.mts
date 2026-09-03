// Cursos de Design, Carreira, Marketing, Finanças e Idiomas — 8 novos
import type { CourseDef } from './seed-types'

export const careerCourses: CourseDef[] = [
  {
    mentorEmail: 'beatriz@demo.com',
    title: 'UI/UX do Zero: Figma e Protótipos',
    description:
      'Comece do princípio e termine com um protótipo clicável de app no Figma: fundamentos de interface, componentes com auto layout e o processo de UX completo — pesquisa, wireframe e teste com usuários. Sem pré-requisitos: apenas vontade de aprender a desenhar produtos que as pessoas amam usar.',
    category: 'Design',
    level: 'INICIANTE',
    price: 149,
    coverUrl: '/uploads/seed/course-uiux.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'Fundamentos de UI',
        description: 'O que faz uma tela ser boa antes de qualquer ferramenta.',
        lessons: [
          {
            title: 'Os 4 princípios da boa interface',
            description: 'Hierarquia, contraste, proximidade e consistência.',
            durationMin: 14,
            content:
              'Antes do Figma, a base teórica que separa tela amadora de tela profissional.\n\n## 1. Hierarquia visual\nA página deve responder em 3 segundos: o que é mais importante? Três ferramentas: **tamanho** (título maior que texto), **peso** (bold para destaque) e **posição** (topo-esquerda chama primeiro em telas de leitura).\n\n## 2. Contraste\nTexto sobre fundo precisa de contraste suficiente — não é só estética, é acessibilidade. Regra rápida: cinza claro sobre branco falha; use ferramentas de checagem (WebAIM Contrast Checker). Botão principal deve SER o elemento de maior contraste da tela.\n\n## 3. Proximidade\nCoisas relacionadas ficam juntas. O botão "Salvar" pertence ao formulário, não flutua longe. O espaçamento entre grupos deve ser MAIOR que o espaçamento interno do grupo — é assim que o olho entende a estrutura sem explicar nada.\n\n## 4. Consistência\nMesmo botão = mesma aparência em toda a tela. Mesma ação = mesma cor. Inconsistência força o usuário a reaprender a interface a cada clique — cansaço invisível que mata produtos.\n\n## Exercício\nAbra 3 apps que você usa todo dia e identifique na home: o elemento de maior hierarquia, onde o contraste te leva e um exemplo de proximidade bem usada.',
          },
          {
            title: 'Cores, tipografia e espaçamento sem mistério',
            description: 'Sistemas simples que parecem caros.',
            durationMin: 18,
            content:
              '## Cores: a regra 60-30-10\n\n- **60%** — cor neutra dominante (fundo: branco, cinza-claro).\n- **30%** — cor secundária (superfícies, cards, texto).\n- **10%** — cor de destaque (botão principal, links, badges).\n\nNada de 7 cores competindo. Pegue UMA cor de marca e derive tons (emerald-50, 100, 600, 800...) — é exatamente o que fazem Tailwind e os design systems sérios.\n\n## Tipografia: dois pesos e uma escala\n\n- Fonte sem serremif para telas (Inter, Roboto, SF).\n- **Escala**: corpo 16px, legenda 14, título 24-32, hero 36+. Nunca invente tamanhos fora da escala — o caos tipográfico é o sinal nº1 de design amador.\n- Altura de linha ~1.5 para textos corridos.\n\n## Espaçamento: o sistema 4/8\nTodos os espaços múltiplos de 8 (4 para detalhes): 8, 16, 24, 32, 48. Espaçamento consistente é o que dá a sensação de "essa tela foi feita por gente grande".\n\n## Desafio\nRecrie a home de um app simples usando: 1 cor de destaque, 2 pesos de fonte, escala de 4 tamanhos e espaçamentos só de 8/16/24. A limitação é o exercício.',
            quiz: [
              {
                prompt: 'Na regra 60-30-10, onde entra a cor de destaque da marca (ex.: botão principal)?',
                options: ['60% do layout', '30% do layout', '10% do layout', 'Em todas as áreas igualmente'],
                correctIndex: 2,
                explanation:
                  'A cor de destaque ocupa ~10% — escassez é o que a mantém especial. Quando tudo destaca, nada destaca.',
              },
            ],
          },
        ],
      },
      {
        title: 'Figma na prática',
        description: 'Da interface aos componentes reutilizáveis e protótipos.',
        lessons: [
          {
            title: 'Figma: interface e primeiras telas',
            description: 'Frames, shapes, texto e o essencial da barra de ferramentas.',
            durationMin: 20,
            content:
              'O Figma roda no navegador de graça (figma.com) — crie sua conta e um arquivo de design.\n\n## O que você realmente usa (90% do tempo)\n\n- **F (Frame)**: a "tela". Comece com preset iPhone 14 (390×844). Todo design vive dentro de frames.\n- **R (Retângulo), O (Elipse), T (Texto)**: os blocos de construção.\n- **Auto layout (Shift+A)**: O PODEROSO. Transforma um grupo em caixa que organiza os filhos automaticamente (vertical/horizontal, espaçamento, padding). É o "flexbox do design" — aprenda cedo, use sempre.\n\n## Fluxo da primeira tela\n\n1. Frame do celular.\n2. Barra superior: retângulo + textos com auto layout horizontal.\n3. Lista de cards: card modelo com auto layout vertical (imagem, título, descrição, botão).\n4. Duplique o card (Alt+arrastar) 3 vezes — mudou um, muda o padrão do que vem depois.\n\n## Atalhos que valem horas\nAlt+arrastar duplica; Ctrl+D duplica no lugar; Ctrl+G agrupa; Espaço+arrastar move o canvas. Imprima uma cola de atalhos — a velocidade no Figma é músculo, não talento.',
          },
          {
            title: 'Componentes, variantes e protótipo clicável',
            description: 'O sistema que escala e a tela que "funciona".',
            durationMin: 24,
            content:
              '## Componentes: o molde mestre\nSelecione o card → Criar componente (Ctrl+Alt+K). O original fica com losango roxo (master); as cópias (instâncias) herdam toda mudança. Mudou o padding no master? Todas as 40 instâncias atualizam. É o fim do "eu mudei o botão e esqueci 7 telas".\n\n## Variantes: estados no mesmo componente\nUm botão tem estados: padrão, hover, pressionado, desabilitado. Com variantes, tudo vive em um componente com um seletor — o dev agradece: é exatamente como ele vai implementar.\n\n## Auto layout dentro do componente\nCard = auto layout vertical com padding 16, gap 12. O conteúdo cresce e o card se adapta. Texto curto ou longo, nada quebra. É esse comportamento que faz o design "parecer software".\n\n## Protótipo clicável\nModo Prototype → arraste da área do botão até o frame destino → interação "Ao clicar → Navegar para". Conecte as telas do fluxo (home → detalhe → voltar) e clique em Present: você tem um app clicável para testar com pessoas reais antes de escrever UMA linha de código.',
            quiz: [
              {
                prompt: 'Você mudou o raio do botão no componente master. O que acontece com as instâncias?',
                options: [
                  'Nada — precisa mudar uma a uma',
                  'Todas atualizam automaticamente',
                  'Só as novas instâncias atualizam',
                  'O Figma pergunta o que fazer em cada uma',
                ],
                correctIndex: 1,
                explanation:
                  'Instâncias herdam o master por definição — mudança no mestre propaga para todas. É a razão de existir dos componentes.',
              },
            ],
          },
        ],
      },
      {
        title: 'UX de verdade',
        description: 'Pesquisa, wireframe e teste — o processo que destrona achismo.',
        lessons: [
          {
            title: 'Pesquisa rápida com usuários reais',
            description: '5 conversas valem 500 palpites.',
            durationMin: 18,
            content:
              'O erro nº1 de quem começa: projetar para si mesmo. A saída é barata e rápida: conversar com quem usa.\n\n## A entrevista de 20 minutos\n\n1. **Contexto**: "Me conte como você faz X hoje" — deixe a pessoa narrar o processo real.\n2. **Dores**: "Qual a parte mais chata/trabalhosa?" — anote as palavras EXATAS (viram copy depois).\n3. **Workarounds**: "Como você resolve hoje?" — gambiarra existente = oportunidade de produto.\n4. **Nada de "você usaria um app que..."** — pessoas mentem sobre futuro; comportamento passado é o único dado confiável.\n\n## 5 pessoas bastam\nPesquisa da Nielsen: 5 usuários revelam ~80% dos problemas graves de usabilidade. Não precisa de 200 respostas de formulário para começar.\n\n## Sintetizando\nSticky notes: 1 achado por nota. Agrupe o que se parece (affinity mapping). Os 2-3 grupos maiores são suas prioridades reais — não a feature mais divertida de desenhar.\n\n## Desafio\nConverse com 5 pessoas sobre uma tarefa que seu produto resolveria. Traga as citações literais — a próxima aula transforma isso em solução.',
          },
          {
            title: 'Do wireframe ao teste de usabilidade',
            description: 'Fluxo, protótipo e o teste de 15 minutos.',
            durationMin: 22,
            content:
              '## Wireframe: o esqueleto antes da roupa\nSem cor, sem fonte bonita — caixas e textos. O objetivo é validar FLUXO: quantos toques para a tarefa principal? Onde o usuário pode se perder? Ferramenta: o próprio Figma com retângulos cinza. Mudar fluxo aqui custa minutos; depois do visual, custa semanas.\n\n## O teste de usabilidade caseiro\nDê a 5 pessoas o protótipo clicável e UMA tarefa: "inscreva-se no curso X".\n\n- **Não ensine. Não defenda. Observe.** O usuário travou? Anote ONDE e POR QUÊ.\n- Frase mágica: "O que você esperaria que acontecesse ao clicar aqui?"\n- Silêncio é dado: hesitação longa = tela confusa, mesmo que complete.\n\n## Iterando\nRegra prática: se 3/5 pessoas tropeçam no mesmo lugar, o problema é o design — não as pessoas. Corrija, prototipe de novo, teste de novo. Dois ciclos já transformam um fluxo medíocre.\n\n## Projeto final do curso\nFluxo completo no Figma: pesquisa (5 citações) → wireframe do fluxo → protótipo com componentes e variantes → teste com 3 pessoas + lista de ajustes. Poste o link no mural: os melhores recebem revisão em vídeo na mentoria 1:1.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'ana@demo.com',
    title: 'Canva Pro: do Zero ao Portfólio',
    description:
      'Domine o Canva de ponta a ponta e saia com um portfólio visual pronto: posts, apresentações, e-books e um kit de marca completo. Para quem precisa produzir design bonito rápido — empreendedores, social medias, professores e criadores — sem precisar virar designer.',
    category: 'Design',
    level: 'INICIANTE',
    price: 79,
    coverUrl: '/uploads/seed/course-canva.png',
    themes: [
      {
        title: 'Primeiros passos',
        description: 'Conheça o Canva e os princípios que fazem qualquer layout melhor.',
        lessons: [
          {
            title: 'Tour pelo Canva e seu primeiro design',
            description: 'Interface, templates e a buscapor dentro do caos.',
            durationMin: 12,
            content:
              'Crie sua conta em canva.com (o plano gratuito já dá conta do curso; o Pro libera alguns recursos que aponto quando relevante).\n\n## A anatomia da home\nBarra de busca é seu melhor amigo: digite "post instagram", "apresentação", "currículo" — o Canva tem centenas de templates prontos. O segredo não é criar do zero: é **escolher bem e adaptar**.\n\n## Primeiro design em 5 minutos\n\n1. Crie um design → Post do Instagram (1080×1080).\n2. Escolha um template minimalista.\n3. Troque o texto pela sua mensagem.\n4. Troque as cores: clique no elemento → quadradinho de cor → use a paleta que definiremos na próxima aula.\n5. Baixe em PNG.\n\n## O erro do iniciante\nUsar o template como veio: fontes aleatórias, 5 cores, elementos espalhados. Template é ponto de PARTIDA — as próximas aulas te dão os princípios para adaptar com critério.',
          },
          {
            title: 'Princípios de design aplicados ao Canva',
            description: 'Poucos recursos, muito resultado.',
            durationMin: 16,
            content:
              'Os mesmos princípios dos designers, traduzidos para os botões do Canva.\n\n## Cores: use a ferramenta certa\nCrie uma marca: 1 cor principal, 1 neutra escura para texto, 1 neutra clara para fundo. Use o painel "Estilos de marca" (Canva Pro) ou apenas nunca saia dessas 3. Post com 6 cores gritando = spam visual.\n\n## Fontes: a dupla sagrada\nEscolha UMA fonte para títulos e UMA para texto (ex.: Montserrat + Open Sans). Contraste bom: bold + regular, serifada + sem serifa. Duas fontes no máximo. Canva Pro ainda sugere pares combinando — aceite as sugestões.\n\n## Espaço em branco é design\nA tentação do iniciante: encher tudo. O profissional: elementos respirando. Se parece "vazio", aumente o espaçamento e o tamanho do elemento principal — não adicione mais enfeite.\n\n## Alinhamento\nUse as guias roxas que o Canva mostra ao arrastar (smart guides). Elementos alinhados entre si = 80% da percepção de profissionalismo. Ícone fora do eixo do texto é o erro que mais entrega amadorismo.',
            quiz: [
              {
                prompt: 'Qual combinação de fontes costuma funcionar melhor?',
                options: [
                  'Três fontes decorativas diferentes para dar diversidade',
                  'Uma para títulos e outra para textos, com pesos contrastantes',
                  'A mesma fonte em todos os lugares e tamanhos',
                  'A fonte mais engraçada que encontrar',
                ],
                correctIndex: 1,
                explanation:
                  'A dupla título+texto com contraste controlado (bold/regular, sem serifa/serifada) cria hierarquia sem bagunça.',
              },
            ],
          },
        ],
      },
      {
        title: 'Materiais profissionais',
        description: 'Posts, apresentações, e-books e materiais impressos.',
        lessons: [
          {
            title: 'Apresentações e e-books que impressionam',
            description: 'Do template ao material com cara de agência.',
            durationMin: 18,
            content:
              '## Apresentação profissional\n\n1. Comece por "Apresentação" → template minimalista (não o mais colorido!).\n2. **Regra 1 ideia/slide** — slide lotado ninguém lê.\n3. Tamanho do texto: título 32+, corpo nunca abaixo de 18.\n4. Substitua listas por ícones + frases curtas (elementos → ícones → busque "crescimento", "equipe"...).\n5. Capa e encerramento: fundo escuro com a cor da marca — abre e fecha com assinatura.\n\n## E-book/apostila\nCrie um design "Documento A4". Estrutura mínima: capa (título grande + subtítulo), índice simples, 5-10 páginas de conteúdo com margens generosas e rodapé com página. Use o recurso de DUPLICAR página para manter padrão.\n\n## Dica de ouro\nMonte seus 3-4 layouts mestre (capa, conteúdo, citação, encerramento) UMA vez — depois é só duplicar e trocar texto. É assim que social medias produzem 30 peças por dia sem enlouquecer.',
          },
          {
            title: 'Posts, flyers e materiais de venda',
            description: 'Hierarquia que comunica e chama ação.',
            durationMin: 16,
            content:
              '## O post que para o dedo\nHierarquia em 3 níveis, na ordem de leitura:\n\n1. **Gancho** (grande, 5-8 palavras): "O erro que faz você perder clientes"\n2. **Corpo** (médio): 1-2 frases de suporte.\n3. **CTA** (destaque): "Salve este post" / botão visual.\n\nTeste do soco: encolha a imagem para o tamanho de um polegar. Dá para ler o gancho? Se não, está pequeno demais.\n\n## Flyers e impressos\n\n- Tamanho certo desde o início (A5/A4) — esticar depois distorce.\n- Informação de contato em BLOCO no rodapé (endereço, WhatsApp, site juntos).\n- QR code: elementos → QR — aponte para o WhatsApp ou cardápio.\n- Impressão: baixe em **PDF Print** (Canva Pro) com marcas de corte; PNG 300dpi aceito.\n\n## Crie uma vez, reutilize para sempre\nSalve seus 2-3 layouts de post favoritos como templates pessoais (arquivo → salvar como modelo). Sua próxima semana de conteúdo vira 30 minutos de troca de texto.',
          },
        ],
      },
      {
        title: 'Marca pessoal e portfólio',
        description: 'Kit de marca, portfólio visual e o projeto final.',
        lessons: [
          {
            title: 'Kit de marca no Canva',
            description: 'Sua identidade pronta para usar em qualquer peça.',
            durationMin: 18,
            content:
              '## O que é um kit de marca\nA resposta pronta para "quais cores/fontes uso?" — a diferença entre produção rápida e recriar a roda a cada peça.\n\n## Monte o seu (1 hora, uma vez na vida)\n\n1. **Paleta**: 1 cor principal (a sua), 1 escura para texto (quase-preto), 1 neutra clara, 1 apoio opcional. Teste contraste texto/fundo.\n2. **Tipografia**: fonte de títulos + fonte de texto.\n3. **Elementos assinatura**: 1 estilo de ícone (linha? preenchido?), 1 formato de moldura ou background que repete.\n4. **Logotipo simples**: nome + símbolo do Canva, versão clara e escura.\n\n## No Canva Pro\n"Kit de marca" guarda tudo: qualquer template novo se adapta com 2 cliques. No gratuito: crie um documento "Guia da marca" com as amostras e copie os códigos HEX ao trabalhar.\n\n## Consistência > criatividade\nUm feed com 5 cores diferentes tem cara de amador mesmo com peças bonitas isoladas. A paleta repetida é o que cria MEMÓRIA — e memória é o objetivo de qualquer marca.',
          },
          {
            title: 'Projeto final: portfólio visual completo',
            description: 'Site/portfólio no Canva + as 6 peças da marca.',
            durationMin: 24,
            content:
              '## O entregável\nUm portfólio simples no ar + 6 peças produzidas com seu kit de marca.\n\n## As 6 peças (seu portfólio mínimo)\n\n1. Post de Instagram (gancho forte)\n2. Capa de apresentação\n3. Página de e-book\n4. Flyer/promo com CTA\n5. Card de contato com QR code\n6. Capa para LinkedIn ou YouTube\n\n## O portfólio no Canva\nO Canva tem templates de "site" (uma página, publicável com link). Estrutura:\n\n- Capa: nome + uma frase do que você faz.\n- Galeria: as 6 peças em grid com margens generosas.\n- Sobre: 2 linhas humanas (não currículo).\n- Contato: botão WhatsApp + e-mail.\n\nPublique (compartilhar → site → publicar) e você tem um link profissional para bio e currículo.\n\n## Como evoluir\nAdicione 1 peça nova por semana usando o kit — em 2 meses o portfólio vira um corpo de trabalho. Trouxe o seu? Poste o link no mural: reviso os portfólios mais interessantes na mentoria ao vivo.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'rafael@demo.com',
    title: 'Social Media: conteúdo que engaja',
    description:
      'Pare de postar no escuro. Neste curso você monta uma estratégia completa: persona, calendário editorial, copy que prende, design de posts e vídeos curtos — e aprende a medir o que importa para crescer com consistência, não com sorte.',
    category: 'Marketing',
    level: 'INICIANTE',
    price: 99,
    coverUrl: '/uploads/seed/course-socialmedia.png',
    themes: [
      {
        title: 'Estratégia',
        description: 'Fundação: para quem, sobre o quê e com que frequência.',
        lessons: [
          {
            title: 'Persona e posicionamento',
            description: 'Falar com alguém específico (e não com todo mundo).',
            durationMin: 14,
            content:
              'Conta que fala com todo mundo não engaja ninguém. A base do social media profissional é escolher.\n\n## Persona em 30 minutos\nResponda sobre SEU seguidor ideal:\n\n- Quem é (idade, profissão, momento de vida)?\n- Qual problema dele você resolve?\n- O que ele já tentou e falhou?\n- Onde ele está quando consome conteúdo (transporte? pausa do trabalho?)\n\nExemplo real: "Ana, 27, designer júnior, quer migrar para produto, já comprou curso genérico que não aplicou, consome no metrô de manhã." Cada decisão de conteúdo passa por Ana.\n\n## Posicionamento em uma frase\n"Ajudo [persona] a [resultado] através de [como]".\n\n"Ajudo designeras júniors a migrar para produto com planos de estudo semanais."\n\nEssa frase define os 3-4 pilares de conteúdo (ex.: transição, estudos, vagas, histórias reais). Post fora dos pilares? Provavelmente não postar.\n\n## O teste da bio\nSua bio em 3 linhas precisa passar o teste do estranho: chegou agora, entende para quem você fala e o que ganha seguindo? Se não, tudo daqui pra frente constrói sobre areia.',
          },
          {
            title: 'Calendário editorial realista',
            description: 'Consistência vence volume.',
            durationMin: 16,
            content:
              '## A conta que ninguém faz\nQuantos posts você consegue sustentar em uma SEMANA RUIM? Esse é seu número. Prometer 5 posts/semana e entregar 1 destrói o alcance e sua moral. Comece com 2-3 e cresça quando tiver estoque.\n\n## O calendário mínimo viável\n\n| Dia | Pilar | Formato |\n|-----|-------|---------|\n| Seg | Educação | Carrossel |\n| Qui | História/caso real | Reels curto |\n| Sáb | Comunidade | Caixa de perguntas | \n\nPilares fixos eliminam a pergunta diária "o que postar?" — o maior assassino de perfis.\n\n## Produção em lote (batch)\nReserve 2h/semana: escreva TODAS as legendas, produza TODOS os visuais, agende tudo. Conteúdo no dia a dia não escala; produção industrial sim.\n\n## Banco de ideias\nTodo conteúdo que você consome vira nota: pergunta de cliente, sua própria dor da semana, comentário interessante. Nota no celular, 3x por semana. Ideia não nasce na hora de postar — ela é colhida antes.',
            quiz: [
              {
                prompt: 'Você consegue produzir 4 posts/semana em semanas boas, mas não nas ruins. Qual frequência escolher?',
                options: ['4 — mirar alto', '2 — o que sustenta inclusive nas semanas ruins', '5 — algoritmo exige', '0 — melhor não postar nada'],
                correctIndex: 1,
                explanation:
                  'Consistência é o que o algoritmo (e a audiência) recompensam. Frequência que você não sustenta gera gaps que quebram mais que frequência menor estável.',
              },
            ],
          },
        ],
      },
      {
        title: 'Produção',
        description: 'Copy, design e vídeo curto — as três habilidades do dia a dia.',
        lessons: [
          {
            title: 'Copy que prende: gancho, corpo, CTA',
            description: 'As 3 partes de toda legenda que funciona.',
            durationMin: 18,
            content:
              '## O gancho (a linha de vida)\n90% da performance é a primeira linha — é ela que aparece antes do "ver mais". Fórmulas que funcionam:\n\n- **Erro**: "O erro nº1 que faz seu perfil não crescer"\n- **Contraintuitivo**: "Postar todo dia está te deixando menor"\n- **Lista**: "3 ferramentas de análise gratuitas que uso todo dia"\n- **História**: "Perdi meu maior cliente por causa de um story"\n\nNunca comece com "Oi gente, tudo bem?" — você acabou de gastar a linha mais valiosa do post.\n\n## O corpo\nFrases curtas. Uma ideia por parágrafo. Quebre linhas — a legenda de rede social é lida em scrolling, não sentada. Conte o "como" de verdade: conteúdo genérico não gera seguidor; especificidade gera.\n\n## O CTA\nDiga o que fazer a seguir, UM comando: "Salva pra usar na segunda", "Comenta qual você usa", "Compartilha com aquele amigo". Engajamento que o algoritmo lê é engajamento pedido.\n\n## Exercício\nPegue seu post de menor alcance e reescreva APENAS o gancho com uma das fórmulas. Poste os dois no mural — a comunidade vota qual prende mais.',
          },
          {
            title: 'Vídeos curtos: o formato que cresce',
            description: 'Estrutura de Reels/TikTok/Shorts que retém.',
            durationMin: 20,
            content:
              '## A anatomia do vídeo que retém\n\n**0-2s — o segurar**: comece NO meio da ação ou com a promessa. "Fiz isso e dobrei minha agenda" + cena já acontecendo. Sem intro, sem logo, sem "oi gente".\n\n**2-20s — a entrega**: uma ideia só por vídeo. Passo a passo com cortes rápidos (corte = renovação de atenção). Texto na tela acompanhando a fala — 80% assiste sem som.\n\n**Final — o loop ou CTA**: termine conectando com o começo (loop = assiste de novo = sinal forte pro algoritmo) ou com comando único ("salva pra testar").\n\n## Produção sem time\n\n1. Celular apoiado + luz de janela basta. Áudio ruim mata mais vídeo que imagem ruim — grave em ambiente silencioso ou com microfone de lapela barato.\n2. Edite no próprio app (CapCut gratuito): cortes, legenda automática, música da biblioteca.\n3. 15-30s para dica, 30-60s para mini-tutorial. Mais que isso: preciso de razão MUITO boa para continuar.\n\n## Rotina realista\n2 vídeos/semana em lote: grave os dois em uma sessão de 40 min (mesma luz, mesmo cenário), edite no mesmo dia. Reaproveite: todo carrossel bom vira vídeo, todo vídeo bom vira carrossel.',
          },
        ],
      },
      {
        title: 'Resultados',
        description: 'Métricas, primeiros anúncios e o plano dos 90 dias.',
        lessons: [
          {
            title: 'Métricas que importam (e as que não)',
            description: 'Como ler seus números sem se enganar.',
            durationMin: 16,
            content:
              '## Métricas de vaidade (não decidem nada)\nSeguidores totais e curtidas: sobem por motivos que não geram negócio (post viral fora do nicho é o exemplo clássico — 10k curtidas de gente que nunca compraria).\n\n## Métricas de verdade\n\n1. **Salvamentos e compartilhamentos**: o sinal de valor real. Alguém guardou para usar = conteúdo útil de verdade.\n2. **Taxa de retenção em vídeo**: onde as pessoas largam? Segundo 3 é o gancho ruim; segundo 10 é o meio arrastado.\n3. **Cliques no link/perfil**: interesse em além-do-post.\n4. **Conversas iniciadas** (DM/comentário): o topo do funil de venda real.\n\n## A rotina de análise\nUma vez por SEMANA, 15 minutos: quais 2 posts com melhor salvamento? O que tinham em comum (pilar, formato, gancho)? Faça mais disso. Pior desempenho? Entenda se foi tema (descarta) ou execução (melhora).\n\nCrescimento em social media é isso: decisões semanais pequenas baseadas em dados, compostas por 90 dias. Mágica não existe; composto existe.',
            quiz: [
              {
                prompt: 'Qual par de métricas melhor indica conteúdo com valor real?',
                options: [
                  'Seguidores e curtidas',
                  'Salvamentos e compartilhamentos',
                  'Impressões e alcance',
                  'Seguidores e impressões',
                ],
                correctIndex: 1,
                explanation:
                  'Salvar/compartilhar exige esforço do usuário e indica utilidade real — e são sinais fortes para o algoritmo entregar o conteúdo adiante.',
              },
            ],
          },
          {
            title: 'Projeto final: plano de 90 dias',
            description: 'Sua estratégia completa em uma página.',
            durationMin: 22,
            content:
              '## O entregável\nUm documento de UMA página com seu plano completo de 90 dias — o mesmo artefato que uso com clientes que pagam por consultoria.\n\n## As seções\n\n1. **Persona + posicionamento** (da aula 1): "Ajudo X a Y com Z".\n2. **3 pilares de conteúdo** com % de cada (ex.: 50% educação, 30% bastidores, 20% comunidade).\n3. **Calendário semanal** realista: X posts + Y vídeos, dias e horários.\n4. **10 ideias prontas** do banco (título + gancho escrito).\n5. **Metas por métrica certa**: salvamentos/semana, conversas/semana, retenção média >60%.\n6. **Rotina de análise**: dia e hora fixos da revisão semanal.\n\n## Os 90 dias\n\n- **Dias 1-30**: achar o ritmo. Cumpra o calendário 100% — mesmo que ache tudo mediano.\n- **Dias 31-60**: dobrar o que funcionou (dados da revisão semanal mandam).\n- **Dias 61-90**: experimentar 1 formato novo por semana SEM abandonar o que funciona.\n\nPoste seu plano no mural antes de começar — quem posta tem 3x mais chance de completar (público, compromisso). Nos 30, 60 e 90 dias abro thread para dar feedback nos planos da turma.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'rafael@demo.com',
    title: 'SEO na Prática: primeiro no Google',
    description:
      'Como o Google funciona e o que fazer para aparecer: pesquisa de palavras-chave, conteúdo que ranqueia, SEO técnico essencial e SEO local para negócios físicos. Curso direto ao ponto, com o processo que uso para levar páginas à primeira página — sem promessas mágicas.',
    category: 'Marketing',
    level: 'INTERMEDIARIO',
    price: 129,
    coverUrl: '/uploads/seed/course-seo.png',
    themes: [
      {
        title: 'Fundamentos',
        description: 'Como o Google pensa e onde estão as oportunidades.',
        lessons: [
          {
            title: 'Como o Google funciona (e o que ele premia)',
            description: 'Rastrear, indexar, ranquear — e a Era da utilidade.',
            durationMin: 14,
            content:
              '## As três fases\n\n1. **Rastreamento**: robôs (crawlers) descobrem páginas seguindo links.\n2. **Indexação**: a página entra no gigantesco catálogo do Google.\n3. **Ranqueamento**: para cada busca, o algoritmo ordena as páginas indexadas.\n\nSeu trabalho: ser rastreado (site acessível), indexado (páginas com conteúdo claro) e ranqueado (mais útil que os concorrentes).\n\n## O que o Google premia hoje\nA era do "truque" acabou. O Google moderno mede:\n\n- **Intenção atendida**: a página resolve o que a pessoa buscava? (medido por comportamento)\n- **Autoridade**: outros sites confiáveis apontam para você?\n- **Experiência**: carrega rápido, funciona no celular, sem pop-ups agressivos.\n\n## A mentalidade correta\nSEO é marketing de COMPOSTO: um artigo bem posicionado traz visitas por 2-3 anos. Anúncio para quando você paga. Conteúdo ranqueado é ativo — e como todo ativo, exige investimento antes do retorno.\n\n## Expectativa realista\nSite novo: 4-8 meses para tráfego relevante. Site existente: melhorias em semanas. Quem promete primeira página em 30 dias está vendendo ilusão — ou tática que morre no próximo update.',
          },
          {
            title: 'Pesquisa de palavras-chave',
            description: 'Achando as buscas que valem seu esforço.',
            durationMin: 20,
            content:
              'SEO começa ANTES de escrever: qual pergunta exata você quer ser a resposta?\n\n## Tipos de intenção\n\n- **Informacional**: "como fazer pão caseiro" → conteúdo (artigo, vídeo).\n- **Transacional**: "comprar tênis corrida 42" → página de produto.\n- **Navegacional**: "login hotmail" → não vale disputar.\n\nSeu conteúdo precisa casar com a intenção — artigo onde o Google espera produto nunca ranqueia bem.\n\n## Encontrando oportunidades\n\n1. **Google Autocomplete**: digite o tema, anote as sugestões (são buscas REAIS).\n2. **"Pessoas também perguntam"**: mina de ouro para subtemas.\n3. **Parte inferior da SERP**: buscas relacionadas.\n4. **Ferramentas**: Google Keyword Planner (grátis com conta de anúncios), Ubersuggest (cota gratuita).\n\n## A regra do long-tail\n"Marketing" — impossível para 99% dos sites. "marketing digital para salão de beleza pequeno" — conquistável. Comece pelas caudas longas específicas: menos volume, mas você ranqueia de verdade e constrói autoridade para disputar termos maiores depois.',
            quiz: [
              {
                prompt: 'Site novo, autoridade baixa. Qual alvo de palavra-chave na primeira estratégia?',
                options: [
                  '"Empréstimo" — maior volume possível',
                  '"Como abrir MEI como designer freelancer" — long-tail específica',
                  'Termo que o maior concorrente ranqueia',
                  'Termo com mais anúncios patrocinados',
                ],
                correctIndex: 1,
                explanation:
                  'Long-tails específicas têm menos concorrência: você ranqueia de verdade, recebe tráfego qualificado e constrói a autoridade para alvos maiores.',
              },
            ],
          },
        ],
      },
      {
        title: 'Conteúdo que ranqueia',
        description: 'On-page: a página certa para a busca certa.',
        lessons: [
          {
            title: 'Anatomia do artigo que vai à primeira página',
            description: 'Estrutura, títulos e o que o algoritmo lê.',
            durationMin: 22,
            content:
              '## A estrutura vencedora\n\n1. **Title (H1)**: palavra-chave no começo + benefício. "Pão caseiro: receita fácil em 7 passos".\n2. **Primeiro parágrafo**: responda o essencial JÁ (o Google destaca respostas diretas em snippet). Depois aprofunde.\n3. **Subtítulos H2/H3**: um por subtema, com variações da palavra-chave e perguntas reais ("quanto tempo dura o pão caseiro?").\n4. **Listas e tabelas**: o Google adora formatar em featured snippets.\n5. **Encerramento com CTA**: para o próximo passo (produto, serviço, newsletter).\n\n## Densidade e honestidade\nEscreva para a PESSOA. Repetir a palavra-chave 30 vezes (keyword stuffing) pune. Use sinônimos e variações naturais — o Google entende semântica desde 2019.\n\n## Comprimento\nComprimento não é ranking, mas cobrir o assunto é: para "como fazer X", compete contra guias completos — 1.500+ palavras bem organizadas vencem 300 rasas. Cubra as perguntas da seção "Pessoas também perguntam" e terá coberto o tópico.\n\n## Meta description\nNão ranqueia, mas CONVERTE clique: 150 caracteres com benefício claro. "Aprenda a fazer pão caseiro com 4 ingredientes: receita testada, tempo de forno exato e os 3 erros que deixam o pão duro."',
          },
          {
            title: 'Links internos e autoridade',
            description: 'Como seus próprios artigos se fortalecem entre si.',
            durationMin: 16,
            content:
              '## Links internos: o SEO que está na sua mão\nCada artigo novo deve receber links de artigos antigos E apontar para outros. O Google navega seu site como um humano: link claro = página importante.\n\n- Use âncora descritiva: "guia completo de keywords" (nunca "clique aqui").\n- Página pilar: um guia grande que recebe links de 5-8 artigos menores do mesmo tema — concentra autoridade.\n\n## Backlinks: a moeda da autoridade\nLinks de outros sites para o seu são o sinal de confiança mais forte — e o mais difícil. O que FUNCIONA (e não é spam):\n\n1. **Conteúdo referenciável**: dados originais, calculadoras, templates — criam link naturalmente.\n2. **Guest post honesto**: escreva para blog do seu nicho com conteúdo REAL.\n3. **Menção recuperável**: seu conteúdo citado sem link? E-mail simpático pedindo o crédito converte surpreendentemente.\n\n## O que NUNCA fazer\nComprar pacotes de backlinks (50 links por R$99) — caminho mais rápido para a penalidade. Um link de site relevante vale mais que mil de fazendas de link.',
          },
        ],
      },
      {
        title: 'Técnico, local e medição',
        description: 'Velocidade, Google Meu Negócio e o painel de controle.',
        lessons: [
          {
            title: 'SEO local: o ouro do negócio físico',
            description: 'Google Meu Negócio do básico ao topo do mapa.',
            durationMin: 18,
            content:
              'Para negócio físico, o jogo é outro: a disputa é pelo "perto de mim" e pelo mapa.\n\n## Google Meu Negócio (Perfil da Empresa)\n\n1. **Reivindique e complete TUDO**: categorias corretas (são decisivas), horários, fotos reais (fotos de perfil têm 2x mais solicitações), serviços com descrição.\n2. **Avaliações são o ranking**: peça a cada cliente satisfeito (QR code no balcão para o link de avaliação). Responda TODAS — o Google lê as respostas como sinal de negócio ativo.\n3. **Posts semanais** no perfil (novidade, oferta): perfil vivo ranqueia melhor.\n\n## O site local\nCada cidade/região atendida pode ter página própria com conteúdo real ("decoração de eventos em Recife: portfólio, regiões atendidas") — páginas duplicadas com cidade trocada NÃO funcionam; conteúdo local real sim.\n\n## NAP consistente\nNome, Endereço, Telefone idênticos em TODOS os lugares: site, perfil Google, Instagram, diretórios. Inconsistência confunde o Google e derruba o ranque local.',
            quiz: [
              {
                prompt: 'Restaurante novo quer aparecer no mapa do Google. Ação de maior impacto?',
                options: [
                  'Anúncios em jornal',
                  'Completar o Perfil da Empresa e coletar avaliações',
                  'Publicar 100 posts por dia',
                  'Criar 5 perfis falsos',
                ],
                correctIndex: 1,
                explanation:
                  'No SEO local, Perfil completo + avaliações recentes + respostas ativas são os fatores de ranque do mapa mais fortes que você controla.',
              },
            ],
          },
          {
            title: 'Projeto final: sua página no topo do caminho',
            description: 'Plano de SEO completo para UM termo.',
            durationMin: 24,
            content:
              '## O entregável\nEscolha UM termo long-tail relevante para seu negócio/projeto e execute o processo completo do curso.\n\n## O roteiro\n\n1. **Pesquisa**: termo escolhido + 10 variações anotadas do Autocomplete e "Pessoas também perguntam". Documente a intenção.\n2. **Análise da SERP**: quem está na página 1? O que falta no conteúdo deles (comparação honesta, dados atualizados, exemplo prático)? Sua diferença é aí.\n3. **Conteúdo**: artigo com a estrutura da aula — resposta direta no 1º parágrafo, H2 por subtema, lista/tabela, FAQ das perguntas reais.\n4. **Técnico**: título otimizado, meta description com benefício, carregamento rápido, mobile ok.\n5. **Interno**: 2-3 links internos de outras páginas suas com âncora descritiva.\n6. **Medição**: Search Console configurado, URL inspecionada e enviada.\n\n## Acompanhamento\nPosição na semana 1 vs semana 8 no Search Console (Desempenho). Long-tail em site com alguma autoridade: movimento em 2-4 semanas é comum.\n\nPoste o termo escolhido + link no mural. Faço live de análise das submissões — ver páginas reais subindo é o melhor aprendizado que existe.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'david@demo.com',
    title: 'Finanças Pessoais do Zero',
    description:
      'Para quem nunca organizou o dinheiro (ou já tentou e desistiu): descubra para onde seu salário vai, monte um orçamento que funciona na vida real, saia das dívidas com método e construa sua reserva de emergência — sem planilha complicada e sem corte de cafezinho eterno.',
    category: 'Finanças',
    level: 'INICIANTE',
    price: 89,
    coverUrl: '/uploads/seed/course-financas.png',
    themes: [
      {
        title: 'Diagnóstico',
        description: 'Enfrente os números: para onde seu dinheiro vai de verdade.',
        lessons: [
          {
            title: 'O raio-X do seu dinheiro',
            description: '3 meses de extrato valem mais que qualquer teoria.',
            durationMin: 15,
            content:
              'Antes de qualquer plano, a verdade: quanto entra e para onde sai. A maioria das pessoas erra a resposta por 30-40%.\n\n## O exercício de hoje\nAbra o extrato/app do banco dos últimos 90 dias e classifique cada gasto em 4 grupos:\n\n1. **Essenciais fixos**: aluguel, condomínio, luz, internet, escola.\n2. **Essenciais variáveis**: mercado, transporte, farmácia.\n3. **Estilo de vida**: delivery, streaming, roupas, bares, iFood.\n4. **Dívidas**: parcelas, cartão rotativo, empréstimos.\n\n## O que você vai descobrir\nQuase sempre: o grupo 3 é 2-3x maior do que a pessoa imaginava. O delivery de terça não dói; 40 pedidos no mês somam um salário mínimo. Isso não é motivo de culpa — é DADO. Sem diagnóstico, todo orçamento é chute.\n\n## Ferramenta mínima\nNão precisa de app sofisticado: uma nota no celular ou planilha de 4 colunas resolve. O que importa é o hábito de olhar, não a ferramenta bonita. Nos próximos módulos transformamos esse raio-X em plano.',
          },
          {
            title: 'O orçamento 50/30/20 (adaptado à realidade BR)',
            description: 'Um método simples o suficiente para funcionar.',
            durationMin: 18,
            content:
              '## O método\n\n- **50% essenciais**: moradia, contas, alimentação, transporte.\n- **30% estilo de vida**: lazer, delivery, compras — SEM CULPA, planejado.\n- **20% futuro**: reserva, dívidas, investimentos.\n\n## Adaptando ao Brasil real\nCom salário de até ~R$3.000, essenciais frequentemente passam de 50%. Ajuste proporcional: 65/20/15, e a meta de médio prazo é reduzir os essenciais (moradia é o vilão clássico acima de 35% da renda) para se aproximar do 50/30/20.\n\n## Por que o método funciona\nO 30% de estilo de vida é o segredo: método que proíbe tudo morre em 3 semanas. Ter gasto LIVRE planejado sustenta o plano no mês 4 — onde todos os outros já desistiram.\n\n## Implementação em 15 minutos\n\n1. Pague-se PRIMEIRO: no dia do salário, transfira os 20% para conta separada (nunca deixe "o que sobrar" — nunca sobra).\n2. Contas fixas: débito automático agrupado logo após o salário.\n3. Estilo de vida: cartão pré-pago ou conta virtual com o valor do mês — acabou o saldo, acabou o mês de gastos extra.\n\n## Desafio da semana\nMonte seus 3 números (sua versão do 50/30/20) e automatize a transferência do "futuro" no dia do salário.',
            quiz: [
              {
                prompt: 'Por que transferir os 20% no DIA do salário, e não no fim do mês?',
                options: [
                  'O banco rende mais no início do mês',
                  'Pagar-se primeiro garante o futuro antes do estilo de vida consumir tudo',
                  'Para não esquecer a data',
                  'Não faz diferença nenhuma',
                ],
                correctIndex: 1,
                explanation:
                  '"Economizar o que sobrar" nunca sobra: gasto se expande até a renda. Tirar o futuro primeiro inverte a lógica — o resto se adapta ao que ficou.',
              },
            ],
          },
        ],
      },
      {
        title: 'Saindo das dívidas',
        description: 'O plano de saída: negociação, método e proteção.',
        lessons: [
          {
            title: 'O plano de 4 passos para quitar dívidas',
            description: 'Da lista da vergonha à primeira quitação.',
            durationMin: 20,
            content:
              '## Passo 1 — A lista completa (sem se enganar)\nTabela com TODAS as dívidas: credor, valor total, juros ao mês, parcela. A rotativa do cartão (14%+ ao mês) e cheque especial (12%+) lideram — são incêndio, não são "parcela normal".\n\n## Passo 2 — Pare de cavar\nRotativo do cartão zerado (pague o mínimo e NÃO gaste mais no cartão até sair). Cortar o novo é pré-condição: quitar enquanto continua gastando é esvaziar balde com o buraco aberto.\n\n## Passo 3 — Negocie TUDO\n\n- Ligação direta para o credor pedindo desconto à vista (20-70% de desconto em atrasos longos é comum).\n- Feirões de negociação do próprio credor e portais (Serasa Limpa Nome).\n- Regra: desconto só entra se não usar a reserva (próxima aula) nem comprometer o essencial.\n\n## Passo 4 — Ordem de ataque\nMétodo bola de neve: quite a MENOR primeiro (vitória rápida vira combustível) enquanto paga o mínimo nas demais; depois a próxima menor. Alternativa matemática: maior juro primeiro — quita mais rápido, mas exige disciplina de aço. Escolha o que você SUSTENTA: o melhor método é o que termina.',
          },
          {
            title: 'Reserva de emergência: sua máquina de dormir tranquilo',
            description: 'Quanto, onde e como construir.',
            durationMin: 16,
            content:
              '## Quanto\n\n- CLT estável: **3-6 meses de essenciais** (o número do seu raio-X, não do salário bruto).\n- Autônomo/instável: **6-12 meses**. A instabilidade é exatamente por isso que a reserva precisa ser maior.\n\n## Onde\nRequisitos: liquidez imediata + risco zero + render acima da inflação. No Brasil: **Tesouro Selic** e **CDB 100%+ do CDI** com liquidez diária. NUNCA: ações, cripto, fundos multimestrados — reserva não é para enriquecer, é para EXISTIR quando a vida apertar.\n\n## Como construir (mesmo com pouco)\n\n- R$50-100/mês já começam. Constância > valor.\n- Dinheiro "extra" (13º, férias, bônus, venda de coisa usada): 50% direto na reserva.\n- Conta SEPARADA (não a do dia a dia): dinheiro visível é dinheiro gastável.\n\n## A única regra de uso\nEmergência é perda de renda, saúde, conserto essencial. Não é Black Friday, não é "promoção de passagem". Nomeie a conta "só emergências" — parece bobo, funciona de verdade.',
            quiz: [
              {
                prompt: 'Onde NÃO colocar sua reserva de emergência?',
                options: ['Tesouro Selic', 'CDB 100% CDI liquidez diária', 'Ações de empresa sólida', 'Conta poupança separada'],
                correctIndex: 2,
                explanation:
                  'Reserva precisa estar disponível no dia do aperto e sem risco de perda. Ações podem estar 30% abaixo do valor investido exatamente quando você mais precisa.',
              },
            ],
          },
        ],
      },
      {
        title: 'Futuro',
        description: 'Primeiros investimentos, proteção e metas de vida.',
        lessons: [
          {
            title: 'Depois da reserva: seus primeiros investimentos',
            description: 'Do colchão ao crescimento.',
            durationMin: 18,
            content:
              '## A ordem sagrada\n1. Dívidas caras quitadas ✓\n2. Reserva montada ✓\n3. AGORA sim: investir com foco em crescimento.\n\nPular etapas é o erro clássico: investir em ação com cartão rotativo pago a 14%/mês é torcer contra si mesmo.\n\n## O começo sensato\n\n- **Renda fixa continua sendo a base**: Tesouro IPCA+ (proteção real), CDBs de bancos médios (FGC protege até R$250k), LCI/LCA (isentas de IR).\n- **Aportes automáticos mensais** no dia do salário (mesma lógica do pagar-se primeiro).\n- **Meta por objetivo**: cada dinheiro com nome e prazo. Carro em 2 anos ≠ aposentadoria em 30 — bolsos separados, riscos separados.\n\n## Ações e o mercado\nSó entre em renda variável com dinheiro que pode ficar 5+ anos parado e estômago para ver -30% sem vender no pânico. Comece por ETFs (diversificação em 1 clique) em vez de apostar em ações únicas. E desconfie de qualquer promessa de retorno garantido alto — "garantido" e "alto" não moram juntos no mercado sério.',
          },
          {
            title: 'Projeto final: seu plano financeiro de 12 meses',
            description: 'O documento que transforma o curso em vida real.',
            durationMin: 24,
            content:
              '## O entregável\nSeu plano pessoal de 12 meses em uma página — revisado por você a cada trimestre.\n\n## As seções\n\n1. **Raio-X**: renda média, os 4 grupos de gasto (números reais do seu extrato).\n2. **Orçamento**: seus 3 percentuais (ex.: 60/25/15) + dia do mês da transferência automática.\n3. **Dívidas**: lista completa + ordem de ataque escolhida + data-alvo de quitação de cada uma.\n4. **Reserva**: meta em meses de essenciais + valor/mês + produto escolhido (Tesouro Selic/CDB) + conta separada criada.\n5. **Metas com nome**: 3 objetivos com valor e prazo (ex.: viagem R$4.000 em dez/2026, curso R$1.200 em mar/2026).\n6. **Revisão**: dia fixo mensal de 30 minutos para conferir e ajustar.\n\n## O critério de sucesso\nNão é "ficar rico" — é DORMIR diferente. Se em 3 meses você olha o extrato sem ansiedade e as transferências automáticas rodam sozinhas, o curso cumpriu o propósito.\n\nCompartilhe no mural (sem valores se não quiser — a estrutura basta): o compromisso público dobra a execução. E lembre: mentoria 1:1 existe para revisar SEU caso específico com privacidade.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'david@demo.com',
    title: 'Investimentos para Iniciantes',
    description:
      'Do Tesouro Direto às ações, sem jargão e sem promessa de enriquecer rápido: entenda produtos, monte sua primeira carteira diversificada e aprenda a investir todo mês com método — o caminho que o dinheiro de verdade faz, e que ninguém conta no Instagram.',
    category: 'Finanças',
    level: 'INTERMEDIARIO',
    price: 119,
    coverUrl: '/uploads/seed/course-investimentos.png',
    themes: [
      {
        title: 'Base',
        description: 'Conceitos que sustentam toda decisão de investimento.',
        lessons: [
          {
            title: 'Perfil de investidor e horizonte de tempo',
            description: 'A decisão que vem antes de qualquer produto.',
            durationMin: 14,
            content:
              '## As três perguntas antes de qualquer aplicação\n\n1. **Quando vou precisar deste dinheiro?** (horizonte)\n2. **Quanto ele pode oscilar sem eu entrar em pânico?** (tolerância)\n3. **Para que objetivo ele existe?** (propósito)\n\n## O trio que define tudo\n\n- **Curto prazo (até 3 anos)**: segurança e liquidez mandam. Renda fixa pós-fixada (Tesouro Selic, CDB liquidez diária). Ação aqui é APOSTA, não investimento.\n- **Médio (3-10 anos)**: mistura. Tesouro IPCA+, CDBs longos começam a entrar.\n- **Longo (10+ anos)**: o tempo é seu aliado. Bolsa, ETFs, fundos imobiliários têm tempo para oscilar e crescer.\n\n## O teste do sono\nSe -20% na carteira te faria vender tudo às 3 da manhã, o dinheiro está no lugar errado — por mais "correto" que o produto pareça. Perfil não é o que o questionário do banco diz; é o que VOCÊ aguenta ver no extrato num dia vermelho.\n\n## Dinheiro com nome\nCada objetivo tem um bolso: emergência (selic), carro 2027 (IPCA+ 2027), aposentadoria (diversificado longo). Jamais um bolso único — prazo misturado é decisão impossível.',
          },
          {
            title: 'Juros compostos: a oitava maravilha',
            description: 'Por que começar cedo vale mais que investir muito.',
            durationMin: 16,
            content:
              '## A matemática que muda vidas\n\nR$500/mês a 10% ao ano:\n\n- 10 anos: ~R$97 mil (aportou 60 mil)\n- 20 anos: ~R$343 mil (aportou 120 mil)\n- 30 anos: ~R$944 mil (aportou 180 mil)\n\nNos últimos 10 anos, o dinheiro trabalhou MAIS que você: 944 - 343 = R$600 mil de juros. É isso o composto faz quando o tempo joga a seu favor.\n\n## As duas lições práticas\n\n1. **Comece HOJE com pouco** > começar "um dia" com muito. Os primeiros anos são os mais valiosos — cada ano de atraso corta a fatia mágica do final.\n2. **Não interrompa o composto**: resgatar a cada modinha de mercado zera a mágica. O mercado premia tempo NA carteira, não timing.\n\n## A regra do 72\nQuanto tempo para dobrar? 72 ÷ taxa anual. A 6%: 12 anos. A 12%: 6 anos. Regra mental para comparar cenários numa conversa, sem planilha.\n\n## E a inflação?\n10% ao ano com inflação de 6% = ~4% real. Sempre avalie retorno REAL (acima da inflação) — rendimento nominal que não bate a inflação é perder dinheiro com disfarce.',
            quiz: [
              {
                prompt: 'Ana (25) e Bruno (35) investem R$500/mês a 10% até os 60. Quem chega com mais dinheiro?',
                options: ['Bruno — aporta por mais tempo em faixa salarial melhor', 'Ana — os 10 anos extras de composto valem mais que dobrar o tempo final', 'Empatam', 'Depende da bolsa'],
                correctIndex: 1,
                explanation:
                  'Os primeiros anos são os mais poderosos no composto (crescimento exponencial). Ana acumula ~3x mais que Bruno — começar cedo vale mais que aportar mais tarde.',
              },
            ],
          },
        ],
      },
      {
        title: 'Produtos',
        description: 'Tesouro, CDBs, fundos e ações — o que cada um é de verdade.',
        lessons: [
          {
            title: 'Renda fixa descomplicada',
            description: 'Tesouro Direto, CDB, LCI/LCA — a base da carteira BR.',
            durationMin: 22,
            content:
              '## Renda fixa = empréstimo\nVocê empresta (ao governo ou ao banco) e recebe de volta + juros. Simples assim. Os três nomes que você precisa:\n\n## Tesouro Direto (empresta ao governo)\n\n- **Selic 2029**: acompanha a taxa básica. Para reserva e curto prazo.\n- **IPCA+ 2035/2045**: inflação + juro fixo. Proteção real para médio/longo. Mínimo ~R$30.\n- Risco: governo federal — o menor do mercado. Venda antecipada oscila (marque o vencimento!).\n\n## CDB (empresta ao banco)\n\n- Compare pelo % do CDI: banco médio paga 110-120% CDI, grande paga 90-100%.\n- **FGC cobre até R$250 mil** por CPF/instituição — banco médio com FGC é seguro quanto o gigante, pagando melhor.\n- LCI/LCA: isentas de IR, ligeiramente menor no bruto — compare o LÍQUIDO.\n\n## A tabela mental\nReserva → Selic/CDB diário. Meta 3-5 anos → IPCA+ do prazo. Tudo mais longo → mistura com renda variável.\n\n## Pegadinhas\n"Rende 200% do CDI" em promoção de 2 meses (depois cai); taxa de administração comendo o rendimento em fundos (prefira aplicação direta quando começar); prazo de carência escondido no rodapé.',
          },
          {
            title: 'Ações, ETFs e FIIs sem romantismo',
            description: 'Renda variável: o papel, o risco e o começo sensato.',
            durationMin: 24,
            content:
              '## Ação = pedacinho de empresa\nVocê ganha de dois jeitos: valorização e dividendos (parte do lucro distribuída). Você PERDE quando a empresa piora e o preço cai — e cair 40% numa crise é histórico real, não hipótese.\n\n## O problema do iniciante com ação única\nEscolher 3 ações é apostar; diversificar é investir. O caminho do iniciante sensato:\n\n## ETFs: diversificação em 1 clique\nBOVA11 (top ~90 empresas BR), IVVB11 (S&P 500 — as 500 maiores dos EUA). Um título, dezenas/centenas de empresas, rebalanceamento automático, taxa baixa. É o produto que 90% dos iniciantes deveriam usar ANTES de escolher ações sozinhos.\n\n## FIIs (fundos imobiliários)\nGalpões, shoppings, lajes em pedaços. Dividendos mensais isentos de IR, mas COTA oscila. Só com horizonte longo e entendendo que "renda mensal garantida" não existe — o aluguel vem, o preço do papel sobe e desce.\n\n## As regras que salvam\n\n1. Renda variável só com dinheiro de 5+ anos.\n2. Aportes MENSais automáticos (a média de custo trabalha por você).\n3. Nada de operar com dívida caro existente.\n4. Desconfie de dica de "ação que vai explodir" — quem sabe não conta; quem conta não sabe.',
            quiz: [
              {
                prompt: 'Por que ETFs (como BOVA11) são recomendados para quem começa na bolsa?',
                options: [
                  'Rendem mais que qualquer ação',
                  'Não têm risco nenhum',
                  'Diversificam dezenas de empresas em uma compra só, com taxa baixa',
                  'São isentos de imposto',
                ],
                correctIndex: 2,
                explanation:
                  'ETF replica um índice inteiro: erro de escolha de empresa dilui, custo é baixo e o iniciante participa do mercado inteiro enquanto aprende.',
              },
            ],
          },
        ],
      },
      {
        title: 'Carteira',
        description: 'Montagem, aportes e os erros que destroem resultados.',
        lessons: [
          {
            title: 'Montando sua primeira carteira',
            description: 'Três modelos por horizonte — e a disciplina dos aportes.',
            durationMin: 20,
            content:
              '## Três pontos de partida (exemplos didáticos)\n\n**Conservador (metas até 3 anos)**\n100% renda fixa: 60% pós-fixada (Selic/CDB diário) + 40% IPCA+ do prazo da meta.\n\n**Moderado (5-10 anos)**\n70% renda fixa (40% pós + 30% IPCA+) + 30% renda variável (20% ETF bolsa + 10% FIIs).\n\n**Arrojado (10+ anos)**\n50% renda fixa + 50% variável (35% ETFs BR/EUA + 15% FIIs).\n\nNão existe modelo universal — existe o SEU: horizonte, sono e objetivos. Percentuais exatos importam menos que a ESTRUTURA (proteção + crescimento).\n\n## A rotina que faz a mágica\n\n1. Aporte automático no dia do salário (transferência programada).\n2. Divida pelo percentual da sua carteira.\n3. Rebalanceie 1x/ANO: o que cresceu demais, reduz; o que ficou barato, aumenta. Vender alto e comprar baixo por disciplina, não por emoção.\n\n## O inimigo é você\nEstudos de comportamento mostram: o investidor médio ganha MENOS que os próprios fundos em que investe — porque entra tarde (euforia) e sai cedo (pânico). A carteira simples + aportes automáticos + revisão anual existe justamente para tirar você (e suas emoções) do caminho.',
          },
          {
            title: 'Projeto final: carteira + plano de aportes',
            description: 'Sua estratégia documentada e o compromisso de 12 meses.',
            durationMin: 22,
            content:
              '## O entregável\nSua carteira inicial documentada + plano de aportes de 12 meses.\n\n## O documento\n\n1. **Diagnóstico**: objetivos com prazo e valor (emergência ✓/✗ primeiro!).\n2. **Perfil honesto**: horizonte de cada bolso + teste do sono respondido.\n3. **Carteira modelo**: percentuais e produtos escolhidos (com taxa e liquidez anotados) — ex.: 40% Tesouro Selic, 25% CDB 115% CDI 2028, 20% Tesouro IPCA+ 2035, 15% BOVA11.\n4. **Plano de aportes**: valor mensal, dia do mês, divisão automática entre os produtos.\n5. **Regras pessoais de comportamento**: o que faço quando o mercado cair 20% (resposta correta: NADA além do aporte programado); quando rebalanceio (data fixa anual); o que NUNCA faço (investir dinheiro de meta curta em bolsa).\n\n## Simulação obrigatória\nProjete no calculadora-cidadao.br (Tesouro) ou planilha: aporte mensal escolhido → valor estimado em 10/20/30 anos. Ver o composto no SEU número converte mais que qualquer aula.\n\nPoste a estrutura (sem valores, se preferir) no mural. Nas mentorias 1:1 reviso carteiras reais com privacidade total — é o momento de maior valor do curso.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'sofia@demo.com',
    title: 'Espanhol do Zero: sua primeira conversa',
    description:
      'Aprenda espanhol falando desde a primeira aula: pronúncia essencial, frases de sobrevivência para viagem e trabalho, e a gramática mínima que destrava conversas reais. Método de imersão prática — no final você terá sua primeira conversa completa em espanhol.',
    category: 'Idiomas',
    level: 'INICIANTE',
    price: 99,
    coverUrl: '/uploads/seed/course-espanhol.png',
    themes: [
      {
        title: 'Primeiras palavras',
        description: 'Saudações, pronúncia e os números que abrem portas.',
        lessons: [
          {
            title: 'Saudações e apresentações',
            description: 'Suas primeiras 20 frases reais.',
            durationMin: 12,
            content:
              'Vamos falar desde o minuto um. Repita em voz alta — sussurrar não conta: boca precisa de repetição para criar músculo.\n\n## O essencial do dia 1\n\n- **Hola** — Olá\n- **Buenos días / Buenas tardes / Buenas noches** — Bom dia / Boa tarde / Boa noite\n- **¿Cómo estás?** — Como vai? | **Bien, gracias, ¿y tú?** — Bem, e você?\n- **Me llamo...** — Me chamo... | **¿Cómo te llamas?** — Como você se chama?\n- **Mucho gusto** — Muito prazer\n- **Adiós / Chao / Hasta luego** — Tchau\n\n## Repare nos sinais invertidos\nEspanhol usa **¿** no começo da pergunta. E atenção com o **"h"** que NÃO se pronuncia: **hola** = "óla", **hasta** = "asta".\n\n## Cuidado com os falsos amigos\n\n- Embarazada ≠ engravida: é **grávida**.\n- Exquisito ≠ esquisito: é **delicioso**!\n- Vaso = copo (não vaso).\n\n## Desafio de voz\nGrave um áudio de 30 segundos se apresentando: hola, me llamo..., soy de..., mucho gusto. Ouça e compare com um nativo no YouTube ("presentarse en español"). O ouvido cresce comparando, não só repetindo.',
          },
          {
            title: 'Pronúncia essencial: as 5 chaves do espanhol',
            description: 'O mapa dos sons que brasileiros erram (e os que acertam).',
            durationMin: 16,
            content:
              'A boa notícia: brasileiro tem vantagem enorme. A má: o que parece igual costuma ser exatamente onde erramos.\n\n## As 5 chaves\n\n1. **"ll" e "y" soam iguais**: llamar = yamar. "Calle" = "caye".\n2. **"z" e "ce/ci" são "s"** (na América Latina): zapato = sapato, gracias = grassias. O "th" espanhol da Espanha é opcional para você.\n3. **"j" é forte, de garganta**: trabajo, jaje... treina com "rásteras": j-j-j como limpando óculos.\n4. **"r" no início e "rr" são vibrados**: perro ≠ pero. Dica: diga "pedal da água" rápido 10x e sinta a língua vibrar.\n5. **Vogais são puras e curtas**: "e" nunca vira "i", "o" nunca vira "ou". Casa = KA-SA, não "kaiza".\n\n## O erro nº1 do brasileiro\nFalar "portunhol": comer vogais finais e arrastar. O remédio é exagerar as vogais abertas — soa estranho para você, soa CORRETO para o hispânico.\n\n## Rotina de 10 minutos\nUm vídeo curto por dia repetindo EM VOZ ALTA (shadowing): ouve 1 frase, repete imitando ritmo e música. Ritmo importa mais que som isolado.',
            quiz: [
              {
                prompt: 'Como se pronuncia "hola"?',
                options: ['Holá (com H aspirado)', 'Óla (H mudo)', 'Jolá', 'Holra'],
                correctIndex: 1,
                explanation:
                  'O H em espanhol é sempre mudo: hola = "óla", hotel = "otel", hasta = "asta".',
              },
            ],
          },
        ],
      },
      {
        title: 'Situações reais',
        description: 'Restaurante, direções e compras — sobrevivência total.',
        lessons: [
          {
            title: 'No restaurante: pedir sem passar fome',
            description: 'Menu, pedido e a conta sem sustos.',
            durationMin: 18,
            content:
              '## Chegando e pedindo\n\n- **Una mesa para dos, por favor.**\n- **¿Me trae la carta/menú, por favor?**\n- **Quisiera...** (eu quisera = forma educada de pedir): *Quisiera el pescado.*\n- **¿Qué me recomienda?** — O que recomenda? (a pergunta que gera conversa e melhores pratos)\n\n## Entendendo o menu\n\n- **Entrada** = entrada (não "entrada de casa")\n- **Plato principal** = prato principal\n- **Postre** = sobremesa\n- **La cuenta, por favor** — a conta\n- **¿Está incluido el servicio?** — serviço está incluso?\n\n## Sobrevivência alimentar\n\n- Alérgico? **Soy alérgico/a a...** (frutos secos, mariscos, lactosa)\n- **¿Es picante?** — É picante?\n- **Sin hielo, por favor** — sem gelo\n\n## Dialogue completo de treino\nCamarero: ¿Qué desean?\nTú: Quisiera el pollo con arroz y una limonada, por favor.\nCamarero: ¿Algo más?\nTú: No, gracias. ... La cuenta, por favor.\n\nPratique os dois papéis em voz alta — seu cérebro precisa dos DOIS lados da conversa.',
          },
          {
            title: 'Direções, transporte e compras',
            description: 'Se locomover e negociar sem pânico.',
            durationMin: 18,
            content:
              '## Pedindo direções\n\n- **¿Dónde está el baño / la estación / el banco?**\n- Respostas que você vai ouvir: **a la derecha** (à direita), **a la izquierda** (à esquerda), **derecho/recto** (reto), **cerca** (perto), **lejos** (longe).\n- Não entendeu? **¿Puede repetir más despacio, por favor?** — vida salva.\n\n## Transporte\n\n- **¿A qué hora sale el próximo bus?**\n- **Un billete/ticket para el centro, por favor.**\n- **¿Este bus va a...?**\n\n## Comprando\n\n- **¿Cuánto cuesta?** — Quanto custa?\n- **¿Tienen otra talla/color?** — tem outro tamanho/cor?\n- **Solo estoy mirando, gracias** — só estou olhando (a frase que salva do vendedor colado)\n- Feira/market: **¿Me da medio kilo de esto?**\n\n## Números salvadores\nReveja 1-100 rapidamente: uno, dos, tres... precio em **¿cuánto es?** na hora de pagar. Diga o valor com "es" — **son veinte dólares** (no plural!).\n\n## Desafio da semana\nSimule em casa: uma "loja" com objetos e preços. Você comprador, alguém (ou você mesmo no espelho) vendedor. 10 minutos por dia até fluir sem travar.',
          },
        ],
      },
      {
        title: 'Conversação',
        description: 'A gramática mínima e sua primeira conversa completa.',
        lessons: [
          {
            title: 'Presente, passado e a mágica do "me gusta"',
            description: 'A estrutura mínima para narrar sua vida.',
            durationMin: 20,
            content:
              '## Presente: os 3 verbos que puxam tudo\n\n- **Ser** (identidade): Soy brasileño/a. Es profesora.\n- **Estar** (estado/lugar): Estoy cansado. El hotel está cerca.\n- **Tener** (posse/idade): Tengo 30 años. Tengo hambre.\n\nConjugue esses 3 e sobrevive a 80% das conversas. Depois acrescente **querer** (quiero = quero) e **poder** (puedo = posso) — educação e pedidos resolvidos.\n\n## Passado simples de sobrevivência\nO pretérito dos regulares: -ar → **é/aste/ó** (hablé, hablaste, habló); -er/-ir → **í/iste/ió** (comí, viví). Comece com os irregulares famosos: **fui** (fui/fui), **hice** (fiz), **dije** (disse).\n\n*Ayer comí en un restaurante argentino.* — Você já narra o passado.\n\n## "Me gusta" — o erro clássico\n\n- Me gusta el café (1 coisa)\n- Me gustAN los cafés (mais de uma!)\n\nO gosto concorda com a COISA, não com você. E: me gusta + verbo infinitivo: *Me gusta viajar.*\n\n## A conversa de formatura\nResponda em voz alta, em 30s cada: ¿De dónde eres? ¿Qué te gusta hacer los fines de semana? ¿Qué hiciste ayer? Grave, ouça, repita. Essas três respostas fluindo = sua primeira conversa real está pronta.',
            quiz: [
              {
                prompt: 'Complete corretamente: Me ______ los libros.',
                options: ['gusta', 'gustan', 'gusto', 'gustas'],
                correctIndex: 1,
                explanation:
                  '"Los libros" é plural: o verbo concorda com a coisa gostada — me gustAN. No singular seria "me gusta el libro".',
              },
            ],
          },
          {
            title: 'Projeto final: sua primeira conversa em espanhol',
            description: '15 minutos de conversa real — ao vivo ou gravada.',
            durationMin: 24,
            content:
              '## O objetivo\nUma conversa de 15 minutos em espanhol sobre você: de onde é, o que faz, o que gosta, o que fez na semana. Imperfeita, mas REAL.\n\n## Três caminhos para conseguir a conversa\n\n1. **Apps de intercâmbio** (Tandem, HelloTalk): nativos aprendendo português trocam conversa com você — 20 min em espanhol por 20 min em português.\n2. **Sessão com IA**: converse por voz pedindo nível iniciante e correções gentis.\n3. **Mentoria ao vivo**: agende uma sessão comigo (MentorHub) — os alunos do curso têm desconto na primeira sessão.\n\n## Preparação (a semana anterior)\n\n- Escreva suas 10 respostas-base (de onde é, trabalho, família, gostos, rotina, planos).\n- Grave cada uma 3x em voz alta até fluir sem ler.\n- Prepare 5 perguntas PARA FAZER — conversa é vai-e-vem, não monólogo.\n- Aceite travar: "¿Cómo se dice...?" é frase de fluente, não de iniciante.\n\n## Depois da conversa\nAnote: 3 frases que faltaram, 3 que fluíram. As que faltam viram o início do próximo ciclo de estudo. Poste no mural como foi — a comunidade inteira comemora essa primeira conversa com você, e eu respondo cada relato com um feedback de áudio.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'sofia@demo.com',
    title: 'LinkedIn e Currículo que Convertem',
    description:
      'Sua apresentação profissional inteira revisada: perfil de LinkedIn que recrutadores encontram e abrem, currículo que passa no robô (ATS) e chega ao humano, e a estratégia de networking e candidaturas que multiplica respostas. Para quem está buscando vaga, promoção ou transição.',
    category: 'Carreira',
    level: 'INICIANTE',
    price: 69,
    coverUrl: '/uploads/seed/course-linkedin.png',
    themes: [
      {
        title: 'Perfil que atrai',
        description: 'LinkedIn otimizado para ser ENCONTRADO e aberto.',
        lessons: [
          {
            title: 'Os recrutadores procuram por palavras — o SEO do LinkedIn',
            description: 'Headline e habilidades que colocam você na busca.',
            durationMin: 16,
            content:
              'Recrutador não "navega" LinkedIn: ELE BUSCA por palavra-chave. Seu perfil é uma página de SEO — sem os termos certos, você não existe na busca.\n\n## Headline que trabalha por você\nPadrão "Analista na Empresa X" desperdiça o campo mais valioso. Fórmula:\n\n**[Cargo/área] | [o que você faz de melhor] | [diferencial]**\n\nEx.: "Analista de Dados | SQL, Python e dashboards que dirigem decisões | Ex-Big Tech"\n\n## As 5 palavras-chave do seu mercado\nAbra 5 vagas do seu cargo dos sonhos. Anote os termos repetidos (hard skills + ferramentas). Eles DEVEM aparecer em: headline, "Sobre", experiências e habilidades. É literalmente como o recrutador acha você.\n\n## Foto e capa\n\n- Foto: rosto centralizado 60% do quadro, fundo neutro, roupa do seu contexto profissional. Self no espelho mata candidatura antes dela nascer.\n- Capa (banner): não deixe o cinza padrão — uma frase do seu posicionamento ou visual da sua área.\n\n## Modo "Abrir para trabalho"\nAtive o recrutador-only (verde, visível só para recrutadores) se estiver empregado e buscando. Para a troca de Headline com "#OpenToWork" público: só se o contexto ajudar — desconectado de emprego atual é sinal amarelo para alguns recrutadores.',
          },
          {
            title: '"Sobre" e experiências que contam histórias',
            description: 'Das funções aos RESULTADOS.',
            durationMin: 18,
            content:
              '## "Sobre": a primeira impressão longa\nEstrutura de 4 blocos (evite currículo em texto!):\n\n1. **Gancho de 1 linha**: quem você é profissionalmente e o que busca.\n2. **Prova**: 2-3 resultados com número ("reduzi custo de infra em 35%").\n3. **Como trabalho**: ferramentas e metodologias (palavras-chave!).\n4. **CTA**: "Vamos conversar: [email]".\n\n## Experiências: de função a resultado\n\n❌ "Responsável pelas redes sociais da empresa"\n\n✅ "Cresci o Instagram de 8k para 42k seguidores em 14 meses com calendário editorial e conteúdo em vídeo, gerando 120 leads/mês"\n\nFórmula: **verbo de ação + o que fez + métrica + como/contexto**. Sem a métrica exata? Estime honesta ("~30%", "cerca de 200 clientes").\n\n## Recomendações: prova social que recrutador lê\nPeça 3 recomendações (ex-chefe, colega, cliente) com pedido ESPECÍFICO: "poderia destacar o projeto X e o resultado Y?" — recomendação genérica tem 10% do valor da específica. Ofereça recomendar de volta: rede se constrói em ciclo.',
            quiz: [
              {
                prompt: 'Qual descrição de experiência performa melhor?',
                options: [
                  'Responsável pelo time de vendas',
                  'Ajudei muitas pessoas a comprarem mais',
                  'Liderei equipe de 5 vendedores e aumentei a receita em 40% em 1 ano com novo processo de follow-up',
                  'Trabalhei com vendas por 3 anos',
                ],
                correctIndex: 2,
                explanation:
                  'Verbo de ação + escopo + métrica + contexto. Resultados quantificados são o que diferencia currículo de catálogo de responsabilidades.',
              },
            ],
          },
        ],
      },
      {
        title: 'Currículo moderno',
        description: 'ATS, estrutura e a página que gera entrevista.',
        lessons: [
          {
            title: 'O currículo que passa no robô (ATS) e seduz o humano',
            description: '75% dos currículos são descartados antes de um humano ler.',
            durationMin: 20,
            content:
              'A realidade: empresas médias e grandes usam ATS (sistemas que filtram currículos por palavra-chave e formato). Ser descartado no robô é mais comum que ser rejeitado por humano.\n\n## Regras ATS\n\n1. **PDF com texto selecionável** (nunca imagem, nunca design gráfico com caixas).\n2. **Palavras-chave da vaga**: copie termos honestos do anúncio ("gestão de projetos" vs "gerenciamento" — use o termo da vaga).\n3. **Estrutura padrão em 1 página** (2 se sênior 10+ anos): contatos → resumo → experiências (antigo→recente... invertido: RECENTE primeiro) → formação → habilidades.\n4. Nada de foto no Brasil para áreas corporativas (vieses + ATS), nada de tabelas complexas.\n\n## O resumo de 3 linhas\n"Analista de dados com 4 anos em e-commerce. Especialista em SQL e dashboards que reduziram custo de estoque em 20%. Buscando desafios em produtos digitais de alto crescimento."\n\n## O teste da vaga\nAntes de cada candidatura, leia a vaga e seu currículo lado a lado: os 5 termos centrais da vaga aparecem no seu? Ajuste as FRASES (nunca invente). 15 minutos por candidatura personalizada valem mais que 50 genéricas — a taxa de resposta multiplica.',
          },
        ],
      },
      {
        title: 'Networking e candidaturas',
        description: 'A vaga chega por gente — e a candidatura certa.',
        lessons: [
          {
            title: 'Networking sem constrangimento',
            description: '80% das vagas boas circulam antes dos portais.',
            durationMin: 18,
            content:
              'A vaga dos sonhos raramente nasce no portal: nasce de "conheço alguém bom para isso". Networking não é usar gente — é SER lembrável para os certos.\n\n## O que NÃO fazer\nMandar "oi, vi seu perfil, pode me indicar?" para estranhos — o equivalente profissional de xingar no dm. Pedir indicação de quem não te conhece é queimar o contato antes de criá-lo.\n\n## O protocolo do café virtual (funciona de verdade)\n\n1. **Encontre** 10 pessoas no cargo/empresa que você quer (2-3 anos acima de você).\n2. **Interaja de verdade** 2 semanas: comente as publicações com insight (não "parabéns!").\n3. **Peça CONVERSA, não vaga**: "Olá [nome], acompanho seu conteúdo sobre [tema]. Estou migrando para [área] e adoraria 15 min para ouvir sua trajetória. Que dia funciona?" — 40-50% aceitam (gente gosta de falar de si e ajudar quem demonstra interesse real).\n4. **Na conversa**: 90% perguntas sobre a trajetória/dia a dia. NUNCA peça vaga.\n5. **Depois**: agradecimento + manter contato mensal (comente, responda).\n\nQuando a vaga abrir na empresa deles, você é "aquela pessoa interessada e preparada" — não mais um currículo na pilha. É assim que vagas invisíveis chegam até você.',
          },
          {
            title: 'Projeto final: pacote completo de busca',
            description: 'Perfil + currículo + plano de 30 dias de candidaturas.',
            durationMin: 22,
            content:
              '## O entregável\nSeu kit completo de busca revisado + plano de execução de 30 dias.\n\n## Checklist do kit\n\n1. **LinkedIn**: headline com fórmula, foto profissional, "Sobre" em 4 blocos, 3 experiências reescritas com métricas, 5 palavras-chave da vaga-alvo presentes, 2 recomendações pedidas.\n2. **Currículo**: 1 página ATS-friendly, resumo de 3 linhas, 3 experiências com verbo + métrica, termos da vaga-alvo, PDF texto selecionável.\n3. **Plano de 30 dias**:\n\n- **Semana 1**: 10 candidaturas PERSONALIZADAS (15 min cada, termo a termo com a vaga).\n- **Semana 2**: 5 cafés virtuais pedidos + 10 candidaturas.\n- **Semana 3**: follow-up educado nas candidaturas sem resposta (7 dias depois, 1 mensagem curta) + 10 candidaturas.\n- **Semana 4**: revisão: qual taxa de resposta? Ajuste o currículo no que não funcionou.\n\n## A régua do sucesso\nTaxa de resposta saudável em candidatura personalizada: 10-20%. Abaixo de 5% = currículo/vaga desalinhados, não "mercado difícil".\n\nPoste no mural que completou (sem dados sensíveis!) — e quando a vaga vier, comemoramos juntos. Se quiser revisão individual do currículo, a mentoria 1:1 é exatamente para isso.',
          },
        ],
      },
    ],
  },
]
