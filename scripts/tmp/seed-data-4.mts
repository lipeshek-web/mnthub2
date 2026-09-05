// Cursos Acadêmico/Carreira/Negócios (Camila, Marina, Thiago, David) — 6 novos + recape de 5 cursos + biblioteca TCC (1 livro + 4 artigos)
import type { CourseDef, LessonDef } from './seed-types'

// Formas copiadas de scripts/tmp/seed-lib-data.mts (BookDef / ArticleDef)
export type BookDef4 = {
  mentorEmail: string
  title: string
  description: string
  category: string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO'
  coverUrl: string
  pdfSlug: string
  subtitle: string
  author: string
  pages: { heading: string; body: string }[]
}

export type ArticleDef4 = {
  mentorEmail: string
  title: string
  description: string
  category: string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO'
  coverUrl: string
  readingMin: number
  content: string
}

export const academicCourses: CourseDef[] = [
  {
    mentorEmail: 'camila@demo.com',
    title: 'Manual do TCC: do Tema à Defesa',
    description:
      'O caminho completo do seu trabalho de conclusão, sem enrolação: escolha e delimitação do tema, projeto de pesquisa que aprova, levantamento bibliográfico com técnica, escrita nas normas ABNT e a defesa diante da banca com roteiro pronto. Cada aula entrega um passo concreto para você sair travado e terminar o TCC com tranquilidade.',
    category: 'Acadêmico',
    level: 'INICIANTE',
    price: 129,
    coverUrl: '/uploads/seed/course-tcc-manual.png',
    mentorshipCount: 2,
    themes: [
      {
        title: 'Escolhendo o tema e o orientador',
        description: 'Antes de escrever uma linha: o tema certo, bem recortado, e a pessoa certa do outro lado da mesa.',
        lessons: [
          {
            title: 'Como escolher um tema que você aguenta por 1 ano',
            description: 'Critérios práticos para achar um tema viável — e eliminar os que parecem bonitos mas não sobrevivem ao semestre.',
            durationMin: 14,
            content:
              'TCC não é sobre escolher o tema mais impressionante — é sobre escolher um tema que você vai conseguir olhar por 12 meses sem odiar.\n\n## O teste das 3 perguntas\n1. Eu tenho curiosidade REAL sobre isso? Se você já lê sobre o assunto por diversão, ótimo sinal.\n2. Existe material publicado? Pesquise 10 minutos no Google Scholar. Zero resultados relevantes = tema inviável para nível de graduação.\n3. Eu tenho acesso ao "terreno"? Se a pesquisa exige entrevistas com gestores de hospital, você tem contato?\n\n## Os 3 erros clássicos\n- Tema grande demais: "a educação no Brasil" não é tema, é biblioteca inteira.\n- Tema emprestado: o assunto que o orientador ama, mas você não. Você vai escrever, não ele.\n- Tema que depende de dados que você não consegue: "impacto de X" sem acesso aos números morre no capítulo 3.\n\n## Exercício da aula\nEscreva 5 temas possíveis e aplique o teste das 3 perguntas em cada um. Sobreviveram 2? Você já tem candidatos reais para a próxima aula.',
          },
          {
            title: 'Delimitação: recortar o tema para caber no prazo',
            description: 'A fórmula do recorte que transforma um assunto impossível em um TCC concluído.',
            durationMin: 16,
            content:
              'Delimitar é responder: qual fatia exata deste assunto eu vou estudar? O erro nº 1 de projeto reprovado é tema sem recorte.\n\n## A fórmula do recorte\nTema delimitado = assunto + público/lugar + período + recorte teórico.\n\nExemplo: "marketing digital" vira "uso de WhatsApp Business no atendimento ao cliente de pequenas padarias de Belo Horizonte, entre 2023 e 2024, sob a ótica do marketing de relacionamento".\n\nCada recorte corta meses de trabalho: menos universo a estudar, menos entrevistas, menos literatura para dominar.\n\n## O teste do título\nSe o título do seu TCC cabe em uma frase com "em X lugar, com X público, no período X", você delimitou. Se precisa de "e..." mais de uma vez, ainda está largo.\n\n## Recorte não é empobrecimento\nQuem teme "ficar pequeno demais" escolhe tema gigante e não termina. Banca prefere um estudo profundo de fatia pequena a um raso de fatia larga. Profundidade impressiona; amplitude vaga não.\n\n## Exercício da aula\nPegue seu tema candidato e aplique a fórmula completa. Escreva o título delimitado em uma linha — é o texto que vai no seu projeto.',
            quiz: [
              {
                prompt: 'Qual das opções é um tema BEM delimitado para um TCC de administração?',
                options: [
                  'O comércio eletrônico no mundo',
                  'A gestão de estoque em uma farmácia de bairro em Curitiba entre 2023 e 2024',
                  'A economia brasileira',
                  'Marketing e vendas no século XXI',
                ],
                correctIndex: 1,
                explanation:
                  'Delimitar é reduzir assunto + lugar + período + público: quanto mais específico o recorte, mais viável concluir dentro do prazo e com profundidade.',
              },
              {
                prompt: 'Por que a banca prefere um estudo profundo de fatia pequena a um raso de fatia larga?',
                options: [
                  'Porque fatia larga é impossível de pesquisar hoje em dia',
                  'Porque profundidade com rigor mostra domínio de método; amplitude vaga não sustenta conclusões',
                  'Porque a norma ABNT limita o tamanho do tema',
                  'Porque temas pequenos são mais baratos de imprimir',
                ],
                correctIndex: 1,
                explanation:
                  'A avaliação acadêmica premia rigor e argumentação sobre um recorte controlado — amplitude sem profundidade não permite conclusão sólida.',
              },
            ],
          },
          {
            title: 'Encontrando e abordando o orientador',
            description: 'Como escolher quem orienta seu TCC e escrever o primeiro e-mail que não é ignorado.',
            durationMin: 12,
            content:
              'O orientador certo acelera seu TCC em meses; o errado trava tudo. A escolha merece mais pesquisa do que a maioria dos alunos dedica.\n\n## Como escolher\n1. Leia os artigos mais recentes dos professores do seu curso — quem publica no seu tema é candidato natural.\n2. Pergunte a alunos mais adiantados: responde e-mail? Devolve capítulo em quanto tempo? Disponibilidade vale mais que fama.\n3. Prefira orientador com tempo real: professor supercongestionado que some por 2 meses te custa um semestre.\n\n## O primeiro e-mail (que não é ignorado)\n- Assunto claro: "Candidatura a orientação de TCC — [seu tema resumido]".\n- 1 parágrafo: quem você é, o tema delimitado em uma linha, por que ele (cite um artigo dele — mostra que você fez a lição).\n- Anexe o projeto de 2 páginas; não peça "conversar quando você puder".\n\n## Gerenciando a relação\nAceite críticas como entrega de trabalho, não ataque pessoal. E confirme as regras logo de início: prazo de devolução, formato (rascunho no Google Docs? Word com alterações?) e frequência de reuniões. Regra combinada evita 90% dos conflitos.',
          },
        ],
      },
      {
        title: 'Projeto de pesquisa',
        description: 'Problema, hipótese, objetivos, justificativa e cronograma: as páginas que aprovam seu TCC antes dele existir.',
        lessons: [
          {
            title: 'Problema, hipótese e pergunta de pesquisa',
            description: 'A fundação de todo TCC: uma pergunta específica, respondível e sem resposta óbvia.',
            durationMin: 15,
            content:
              'Todo TCC começa com uma pergunta — não com um título. Quem escreve sem pergunta clara produz texto que "fala sobre" sem concluir nada.\n\n## Problema de pesquisa\nÉ o vazio que seu trabalho preenche, em uma frase: "não se sabe como X afeta Y em Z contexto". Não precisa resolver a fome mundial — precisa ser específico e respondível.\n\n## Pergunta de pesquisa\nTransforme o problema em pergunta direta: "como o uso do WhatsApp Business afeta a fidelização de clientes de padarias em Belo Horizonte?"\n\nRegras:\n1. Começa com "como", "qual" ou "quais" (não com "por que" — leva a respostas especulativas).\n2. Dá para responder com o que você vai coletar.\n3. Não tem resposta óbvia de senso comum.\n\n## Hipótese\nA aposta da resposta, que a pesquisa vai testar (ou discutir): "padarias que respondem pedidos em até 10 minutos fidelizam mais clientes". Em TCC qualitativo, a hipótese pode virar "proposição" — e tudo bem.\n\n## O teste do espelho\nLeia sua pergunta em voz alta: um colega entende sem você explicar? Se precisa de 3 minutos de contexto, ela ainda está vaga.',
            quiz: [
              {
                prompt: 'Qual alternativa é uma pergunta de pesquisa bem formulada?',
                options: [
                  'Por que as empresas não vendem mais?',
                  'Como o atendimento via WhatsApp afeta a fidelização de clientes de padarias de Belo Horizonte?',
                  'Tudo sobre marketing digital',
                  'A economia é importante?',
                ],
                correctIndex: 1,
                explanation:
                  'Pergunta de pesquisa é específica, começa com "como/qual" e pode ser respondida com os dados que você vai coletar — não é opinativa nem genérica.',
              },
              {
                prompt: 'Qual elemento NÃO pertence à formulação do problema de pesquisa?',
                options: [
                  'O vazio que o trabalho preenche',
                  'O contexto específico (quem, onde)',
                  'Uma promessa de resolver a fome mundial',
                  'Uma frase específica e respondível',
                ],
                correctIndex: 2,
                explanation:
                  'Problema de pesquisa é um recorte concreto e respondível — promessas grandiosas sem recorte são o oposto de um problema bem formulado.',
              },
            ],
          },
          {
            title: 'Justificativa e objetivos que convencem a banca',
            description: 'As duas páginas que decidem se o projeto é aprovado — e como escrevê-las sem clichê.',
            durationMin: 14,
            content:
              'A justificativa responde "por que este TCC importa?" e os objetivos respondem "o que exatamente ele vai fazer?". Duas páginas que decidem se o projeto é aprovado.\n\n## Justificativa: 3 ângulos\n1. Relevância prática: quem usa esse resultado? ("pequenos varejistas podem aplicar o roteiro de atendimento")\n2. Lacuna acadêmica: "os estudos sobre WhatsApp Business focam grandes redes; o contexto de padarias de bairro não foi investigado".\n3. Conexão pessoal (curta, 2 linhas): sua vivência dá legitimidade, mas não é o argumento principal.\n\nFuja do clichê "pela importância do tema no mundo atual" — não justifica nada.\n\n## Objetivos: geral vs específicos\nGeral (1): mirar a pergunta de pesquisa. "Analisar a relação entre resposta via WhatsApp e fidelização de clientes."\n\nEspecíficos (3-5): são os degraus — cada um vira uma seção ou capítulo depois:\n1. Mapear as práticas de atendimento das padarias estudadas.\n2. Identificar os fatores de fidelização segundo os clientes.\n3. Relacionar tempo de resposta e recompra.\n\n## O truque dos verbos\nUse verbos mensuráveis (analisar, comparar, mapear) e evite "compreender a fundo" ou "conhecer mais sobre" — a banca corta isso de canivete.',
          },
          {
            title: 'Cronograma realista do TCC',
            description: 'Por que dobrar estimativas, como distribuir 10 meses e o detalhe que separa plano de desejo.',
            durationMin: 12,
            content:
              'O cronograma do projeto de pesquisa costuma ser ficção: "mês 1: leitura; mês 2: coleta; mês 3: escrita". Quem segue cronograma realista termina; quem segue ficção entrega atrasado ou desiste.\n\n## A regra do dobro\nPegue sua estimativa honesta de cada etapa e dobre a duração. Levantamento bibliográfico "2 semanas"? Marque 4. Coleta "3 semanas"? 6. O imprevisto não é possibilidade — é certeza: respondente que some, revisão que demora, semana de provas.\n\n## Um cronograma de 10 meses que funciona\n- Meses 1-2: projeto + leitura de base (6-8 fontes centrais).\n- Meses 3-4: levantamento completo + fichamento.\n- Meses 5-6: coleta de dados.\n- Meses 7-9: escrita (capítulo por capítulo — nunca "começo a escrever no mês 9").\n- Mês 10: revisão, formatação ABNT e ensaio da defesa.\n\n## O detalhe que salva\nColoque o cronograma NO CALENDÁRIO, com blocos semanais, e um marco de checagem por mês ("fim do mês 3: fichas das 8 fontes prontas"). Marco sem dono no calendário é desejo, não plano.\n\n## Reserva de emergência\nGuarde 2 semanas de folga no final. Sempre.',
            quiz: [
              {
                prompt: 'Por que dobrar a estimativa de tempo de cada etapa do cronograma?',
                options: [
                  'Para o orientador ficar impressionado com o prazo longo',
                  'Porque imprevistos são certos — respondente some, revisão demora, semana de provas acontece',
                  'Porque a universidade exige o dobro de tempo',
                  'Para procrastinar com a consciência limpa',
                ],
                correctIndex: 1,
                explanation:
                  'Estimativa otimista é a maior causa de atraso no TCC: imprevisto é regra, não exceção. Dobrar a estimativa cria margem real sem exigir heroísmo.',
              },
            ],
          },
        ],
      },
      {
        title: 'Pesquisa e escrita',
        description: 'Fontes de qualidade, fichamento que economiza meses e metodologia que a banca não consegue derrubar.',
        lessons: [
          {
            title: 'Levantamento bibliográfico: Google Scholar, SciELO e Portal CAPES',
            description: 'Os 3 portais que resolvem, a técnica da bola de neve e como filtrar fontes sem culpa.',
            durationMin: 18,
            content:
              'Levantamento bibliográfico não é "colocar citações no trabalho" — é mapear o que já se sabe para posicionar o que você vai dizer. Feito bem, ele escreve metade da sua fundamentação teórica.\n\n## Os 3 portais que resolvem\n1. Google Scholar (scholar.google.com): busca ampla e o link "Citado por" — ótimo para encontrar trabalhos mais novos.\n2. SciELO: periódicos científicos da América Latina, texto completo gratuito.\n3. Portal CAPES: acervo completo pelo login da sua universidade — use antes de pagar qualquer artigo.\n\n## A técnica da bola de neve\nAche 3-5 artigos centrais (os mais citados do seu tema). Depois: leia as referências deles (para trás) e veja quem os cita (para frente). Em duas horas você tem 30 fontes relevantes — sem buscar "no feeling".\n\n## Filtre sem culpa\n- Priorize os últimos 5 anos (exceto clássicos teóricos).\n- Revista com corpo editorial e avaliação por pares vale mais que blog e site institucional.\n- Dissertações e teses ajudam a ver estrutura, mas não sustentam citação principal.\n\n## Organize desde o dia 1\nCrie uma planilha: autor, ano, título, link e "para qual capítulo serve". Dez minutos por artigo agora = semanas salvas na escrita.',
          },
          {
            title: 'Fichamento e organização das fontes',
            description: 'O fichamento de 3 campos que evita reabrir 40 PDFs no capítulo 4 — e mata o plágio por preguiça.',
            durationMin: 15,
            content:
              'Fichamento é ler uma vez e usar para sempre. Quem não faz reabre o PDF inteiro no capítulo 4 tentando lembrar "onde era aquela frase".\n\n## O fichamento de 3 campos\nPara cada fonte, registre:\n1. A tese central do autor em 2-3 frases suas (se não conseguir, você não entendeu ainda).\n2. As citações úteis COM número de página (citação sem página é dor de cabeça na hora do ABNT).\n3. Sua anotação: "contradiz o autor Y", "bom para o capítulo de metodologia".\n\nFormato: um arquivo por autor ou planilha — tanto faz. O que importa é ser buscável (Ctrl+F resolve anos depois).\n\n## A regra do parafraseie-agora\nAo fichar, escreva a ideia com suas palavras E copie a citação original, separadas. Na escrita você escolhe: parafraseia (com citação do autor) ou cita direto (com página). As duas versões prontas matam o plágio por preguiça.\n\n## Quantas fontes?\nTCC de graduação: 20-40 referências costuma ser o intervalo saudável. 10 é pouco para a fundamentação; 80 é sinal de que você coleciona em vez de lê.',
            quiz: [
              {
                prompt: 'O que NÃO pode faltar em um fichamento útil para a escrita do TCC?',
                options: [
                  'A cor da capa do artigo',
                  'Número da página das citações que você pretende usar',
                  'O preço do livro',
                  'Resumo decorado de todos os capítulos',
                ],
                correctIndex: 1,
                explanation:
                  'Citação sem número de página vira caça ao tesouro na hora da formatação ABNT — registrar a página no fichamento economiza horas e evita erro na citação.',
              },
            ],
          },
          {
            title: 'Metodologia: como justificar suas escolhas',
            description: 'A regra de ouro do capítulo que a banca mais questiona: toda escolha vem com o porquê.',
            durationMin: 17,
            content:
              'Capítulo de metodologia não é burocracia: é o argumento de que seus resultados são confiáveis. A regra é uma só — toda escolha vem com o PORQUÊ.\n\n## A estrutura que funciona\n1. Abordagem: qualitativa, quantitativa ou mista? Justifique pela pergunta ("a pergunta busca compreender percepções — logo, abordagem qualitativa").\n2. Tipo de pesquisa: descritiva? estudo de caso? Explique e cite um autor de metodologia (Gil e Prodanov são os clássicos de graduação).\n3. Participantes/amostra: quantos, quem, como escolhidos. "Entrevistei 6 donos de padarias escolhidos por acessibilidade, pois o objetivo é profundidade, não generalização."\n4. Instrumento: questionário? roteiro de entrevista? Cole o roteiro completo no apêndice.\n5. Análise: como os dados viram resultados? (análise de conteúdo por categorias? estatística descritiva?)\n\n## O teste da banca\nUm avaliador deve conseguir REPLICAR sua pesquisa lendo só o capítulo de metodologia. Se falta o "como escolhi", o "quando" ou o "com quê", ele vai perguntar na defesa.\n\n## Não filosofe\nMeia página de "epistemologia da ciência" não soma nada. Direto ao ponto: o que fez, como, com quem e por quê — em 3-4 páginas bem amarradas.',
          },
        ],
      },
      {
        title: 'ABNT, defesa e finalização',
        description: 'Formatação sem sofrimento, introdução e conclusão que a banca elogia, e a defesa ensaiada em 10 minutos.',
        lessons: [
          {
            title: 'Formatação ABNT essencial: margens, fontes, citações e referências',
            description: 'As 10 regras que você realmente usa — configuradas uma vez, mantidas para sempre.',
            durationMin: 16,
            content:
              'ABNT em excesso assusta; ABNT essencial cabe em uma aula. Configure uma vez e só mantenha.\n\n## A página\n- Margens: 3 cm (esquerda e superior), 2 cm (direita e inferior).\n- Fonte: Arial ou Times New Roman 12; citações longas (mais de 3 linhas), notas e legendas em 10.\n- Espaçamento: 1,5 no texto; simples em citações longas e referências.\n- Parágrafo: recuo de 1,25 cm na primeira linha — ou texto justificado sem recuo, conforme o manual da sua universidade. Baixe o modelo oficial.\n\n## Citações diretas\n- Até 3 linhas: no corpo do texto, entre aspas, com (AUTOR, ano, p. X).\n- Mais de 3 linhas: recuo de 4 cm, fonte 10, SEM aspas, espaçamento simples.\n\n## Citações indiretas (paráfrase)\nSem aspas, com (AUTOR, ano). Parafraseou sem citar autor = plágio, mesmo com suas palavras.\n\n## Referências (NBR 6023)\nOrdem alfabética, alinhadas à esquerda, espaço simples entre elas. Padrão de artigo: SOBRENOME, Nome. Título do artigo. Nome da Revista, cidade, v. X, n. X, p. XX-XX, ano.\n\n## A dica que vale a aula\nUse o gerador de citações do Word/Google Docs ou o modelo oficial da sua universidade desde a primeira página — formatar 90 páginas no final é o desespero clássico de dezembro.',
            quiz: [
              {
                prompt: 'Uma citação direta de 5 linhas deve ser formatada como?',
                options: [
                  'Entre aspas no corpo do texto, fonte 12',
                  'Recuo de 4 cm, fonte 10, sem aspas, espaçamento simples',
                  'Em negrito, centralizada',
                  'Como nota de rodapé em itálico',
                ],
                correctIndex: 1,
                explanation:
                  'Na NBR 10520, citação longa (mais de 3 linhas) sai do corpo do texto: recuo de 4 cm, fonte menor, sem aspas e espaçamento simples.',
              },
            ],
          },
          {
            title: 'Redigindo introdução e conclusão sem travar',
            description: 'As partes mais lidas da banca são estrutura pura — siga os blocos e nunca mais trave nelas.',
            durationMin: 14,
            content:
              'Introdução e conclusão são as partes mais lidas pela banca — e onde mais gente trava. O segredo: elas são ESTRUTURA, não inspiração.\n\n## A introdução em 5 parágrafos\n1. Contexto: o mundo do tema em 3-4 linhas ("o WhatsApp virou canal principal de venda no varejo...").\n2. O recorte: exatamente o que você estuda e onde.\n3. O problema: a pergunta de pesquisa, destacada.\n4. O objetivo geral e um resumo dos específicos.\n5. O mapa: "o trabalho se divide em quatro capítulos..." (2 linhas, ninguém quer ficção aqui).\n\nEscreva a introdução POR ÚLTIMO (ou reescreva no fim) — só no fim você sabe o que o trabalho virou.\n\n## A conclusão em 3 blocos\n1. Resposta direta à pergunta de pesquisa em uma frase clara — é o que a banca procura primeiro.\n2. Os achados por objetivo específico (1 parágrafo cada, com dado de apoio).\n3. Limitações + pesquisas futuras. Honestidade ganha pontos: "a amostra foi pequena; estudos com mais casos podem testar..."\n\n## Para de travar\nNão comece pelo capítulo 1. Comece pela seção mais fácil — momentum gera texto, e texto gera correção.',
          },
          {
            title: 'Preparando slides e a defesa diante da banca',
            description: 'O roteiro dos 10 minutos, os 10-12 slides certos e as 5 perguntas prováveis da banca.',
            durationMin: 20,
            content:
              'A defesa é um jogo com regras conhecidas — e quem ensaia as regras ganha.\n\n## O roteiro dos 10 minutos\nA maioria das bancas dá 10-20 minutos. Estrutura pronta:\n1. (1 min) Cumprimento + tema + por que ele importa.\n2. (2 min) Problema e pergunta de pesquisa.\n3. (2 min) Metodologia em 4 frases.\n4. (4 min) Os 3-4 principais achados — o coração da defesa.\n5. (1 min) Conclusão e limitações.\n\n## Slides: 10-12 no máximo\nUm por ideia. Título em frase (não em palavra), gráfico grande em vez de tabela ilegível, máximo 20 palavras por slide. Se o slide tem parágrafo, a banca lê o slide — e para de escutar você.\n\n## Prepare as 5 perguntas prováveis\n1. "Por que esse tema/recorte?"\n2. "Por que essa metodologia e não outra?"\n3. "Sua amostra é representativa?" (resposta honesta: "não é generalizável; a contribuição é exploratória")\n4. "Qual a contribuição prática disso?"\n5. "O que você faria diferente?"\n\n## No dia\n- Ensaiar em voz alta 3 vezes com cronômetro — grave áudio e escute uma delas.\n- Chegue com o TCC impresso e post-its nas páginas-chave: responder com página aberta é impressionante.\n- Não sabe a resposta? "Não explorei esse ângulo; é uma limitação que registro e uma sugestão de pesquisa futura." Resposta de adulto — nunca inventar.',
            quiz: [
              {
                prompt: 'O que fazer quando um membro da banca faz uma pergunta que você não sabe responder?',
                options: [
                  'Inventar uma resposta plausível na hora',
                  'Dizer que a pergunta não cabe no escopo e mudar de assunto',
                  'Reconhecer que não explorou o ângulo, registrar como limitação e sugerir como pesquisa futura',
                  'Ficar em silêncio até alguém te salvar',
                ],
                correctIndex: 2,
                explanation:
                  'Inventar destrói sua credibilidade em segundos. Reconhecer o limite com maturidade — "não explorei, registro como limitação e sugestão futura" — é resposta de pesquisador e a banca respeita.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'marina@demo.com',
    title: 'Metodologia Científica sem Mistério',
    description:
      'Entenda de uma vez como a pesquisa científica funciona: tipos de estudo, escolha entre abordagem quantitativa e qualitativa, população e amostra, instrumentos de coleta, validade e confiabilidade, e análise básica de resultados. O curso para projetar — e defender — qualquer trabalho acadêmico com segurança.',
    category: 'Acadêmico',
    level: 'INICIANTE',
    price: 89,
    coverUrl: '/uploads/seed/course-metodologia.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'Planejando a pesquisa',
        description: 'Do tipo de estudo à amostra: as decisões que definem todo o resto do projeto.',
        lessons: [
          {
            title: 'Tipos de pesquisa: exploratória, descritiva e experimental',
            description: 'A decisão que define método, amostra e o que você pode (e não pode) afirmar.',
            durationMin: 14,
            content:
              'Antes de coletar qualquer dado, você precisa responder: que tipo de estudo é este? A resposta define método, amostra e o que você pode (e não pode) afirmar.\n\n## Exploratória\nQuando o tema é pouco estudado e você quer entender o terreno. Métodos comuns: entrevista, estudo de caso, levantamento inicial. Resultado: hipóteses e insights — NÃO generalizações. "Estudo inicial sobre como freelancers se organizam financeiramente" é exploratório.\n\n## Descritiva\nDescreve características de um grupo ou fenômeno: quanto, como, com quem. Perfil de consumidores, surveys, estudos observacionais. Responde "como é", não "por que é".\n\n## Experimental\nVocê manipula uma variável e mede o efeito em outra, com controle: grupo que recebe o tratamento vs grupo que não recebe. É o único desenho que sustenta afirmações de CAUSALIDADE forte ("treino X melhorou desempenho Y").\n\n## Como escolher\nVolte à sua pergunta de pesquisa: "o que é / como é?" → descritiva. "quais dimensões existem aqui?" → exploratória. "X causa Y?" → experimental (ou quase-experimental, quando não dá para randomizar).\n\nErrar o tipo cedo custa o semestre: quem promete causalidade com pesquisa descritiva leva nota vermelha na banca.',
            quiz: [
              {
                prompt: 'Um aluno quer saber SE um aplicativo de meditação CAUSA redução de estresse. Que tipo de pesquisa ele precisa?',
                options: [
                  'Exploratória, com entrevistas',
                  'Descritiva, com survey',
                  'Experimental, com grupo controle',
                  'Bibliográfica, com resenha',
                ],
                correctIndex: 2,
                explanation:
                  'Afirmar causalidade exige manipular a variável (usar ou não o app) e comparar grupos — só o desenho experimental sustenta a afirmação "X causa Y".',
              },
            ],
          },
          {
            title: 'Quantitativa vs qualitativa: escolhendo a abordagem',
            description: 'Números ou significados? A escolha certa é a que responde à SUA pergunta — não a mais fácil.',
            durationMin: 15,
            content:
              'A guerra "quantitativo é ciência, qualitativo é conversa" é bobagem: são lentes diferentes para perguntas diferentes. A escolha certa é a que responde à SUA pergunta.\n\n## Quantitativa\nNúmeros, escala, medição. Questionário fechado, estatística descritiva ou inferencial. Fortaleza: medir, comparar, generalizar (com amostra adequada). Exemplo: "42% dos alunos da faculdade X trabalham e estudam".\n\nEscolha quando sua pergunta mede frequência, quantia ou relação entre variáveis.\n\n## Qualitativa\nPalavras, significados, profundidade. Entrevista aberta, observação, análise de conteúdo. Fortaleza: compreender o PORQUÊ e o COMO por trás dos números. Exemplo: "por que alunos que trabalham evadem mais — quais vivências estão por trás disso?"\n\n## Mista (o melhor dos dois)\nQuando o resultado quantitativo pede explicação: survey com 200 pessoas → entrevistas com 8 delas para entender os números. Sequência clássica: QUAN → qual.\n\n## Erros que derrubam projeto\n- Amostra de 10 pessoas + teste estatístico de significância (número não dá para isso).\n- Entrevista com 40 perguntas fechadas rotulada de "qualitativa".\n- Escolher abordagem pelo medo da estatística, não pela pergunta.\n\nRegra de bolso: quer QUANTO? Quantitativa. Quer POR QUÊ? Qualitativa. Quer os dois, em sequência? Mista.',
          },
          {
            title: 'População e amostra',
            description: 'Censo, amostra probabilística e por conveniência — o que cada uma permite afirmar.',
            durationMin: 13,
            content:
              'População é todo mundo que interessa à sua pesquisa; amostra é o pedaço que você consegue estudar. A diferença entre amostra boa e ruim decide se seus resultados valem alguma coisa.\n\n## Conceitos em 1 minuto\n- População: todos os clientes da empresa, todos os alunos do curso.\n- Censo: medir todos (raro e caro).\n- Amostra: subconjunto que representa a população.\n\n## Probabilística (a que permite generalizar)\n- Aleatória simples: sorteio puro.\n- Estratificada: divide a população em grupos (curso, turno, região) e sorteia de cada um — garante representação das minorias.\n\n## Não probabilística (comum em TCC, com limites claros)\n- Por conveniência: quem está disponível ("clientes da loja na terça de manhã"). Válida, MAS você não pode generalizar — escreva isso na limitação.\n- Bola de neve: um participante indica outro (útil para públicos difíceis de alcançar).\n\n## Quanto é suficiente?\nRegra honesta para graduação: no quantitativo, busque ao menos ~100 casos quando possível (há calculadoras de amostra para o rigor); no qualitativo, 5-15 entrevistas OU até a saturação — quando novas entrevistas param de trazer tema novo.\n\nAmostra pequena não invalida o TCC: invalidar é prometer o que ela não entrega.',
            quiz: [
              {
                prompt: 'Um aluno entrevistou 8 gestores indicados uns pelos outros. Que tipo de amostra ele usou?',
                options: [
                  'Aleatória simples',
                  'Estratificada',
                  'Bola de neve (não probabilística)',
                  'Censo',
                ],
                correctIndex: 2,
                explanation:
                  'Quando cada participante indica o próximo, a amostra é "bola de neve" — útil para públicos difíceis, mas não permite generalização estatística.',
              },
            ],
          },
        ],
      },
      {
        title: 'Coletando e analisando dados',
        description: 'Instrumentos que funcionam, confiabilidade que se prova e resultados que respondem à pergunta.',
        lessons: [
          {
            title: 'Instrumentos: questionário, entrevista e observação',
            description: 'A ferramenta que transforma o mundo em dados — e as regras para ela não estragar tudo.',
            durationMin: 16,
            content:
              'Instrumento é a ferramenta que transforma o mundo em dados. Instrumento ruim = dados ruins = TCC que não sustenta conclusão.\n\n## Questionário (quantitativo)\n- Perguntas fechadas: múltipla escolha e escala Likert (1 = discordo totalmente ... 5 = concordo totalmente).\n- Máximo 15-20 perguntas — cada pergunta extra derruba respondentes.\n- Regras de ouro: uma ideia por pergunta ("você acha o curso bom e barato?" são DUAS perguntas); sem pergunta indutiva ("você concorda que X é excelente?"); teste piloto com 5 pessoas antes.\n\n## Entrevista (qualitativo)\n- Roteiro SEMIESTRUTURADO: 8-12 perguntas abertas de partida, com liberdade para aprofundar ("conte como foi", "por que você acha que...").\n- Grave SEMPRE, com consentimento por escrito (termo de consentimento é obrigatório).\n- Transcreva logo: áudio esquecido é áudio perdido.\n\n## Observação\nRegistrar comportamento real (não o declarado). Use grade prévia: o que observar, quando, como registrar. Fortaleza: pega a diferença entre o que as pessoas dizem que fazem e o que fazem de verdade.\n\n## A combinação clássica\nQuestionário para medir + entrevista para explicar os números + observação para checar a prática. Três instrumentos bem usados valem mais que um gigante.',
            quiz: [
              {
                prompt: 'Qual pergunta está CERTA para um questionário quantitativo?',
                options: [
                  'Você concorda que nosso curso é o melhor da região?',
                  'O que você sente quando pensa no futuro da humanidade?',
                  'Com que frequência você usa o app? ( ) Diariamente ( ) Semanalmente ( ) Raramente ( ) Nunca',
                  'O curso é bom e barato?',
                ],
                correctIndex: 2,
                explanation:
                  'A pergunta certa é fechada, com uma única ideia, sem indução e com opções exaustivas. As outras induzem resposta, são vagas demais ou juntam duas perguntas em uma.',
              },
            ],
          },
          {
            title: 'Validade e confiabilidade',
            description: 'Os dois medos de toda banca — e como respondê-los com instrumento adaptado, piloto e alfa de Cronbach.',
            durationMin: 14,
            content:
              'Dois medos de toda banca: "seu instrumento mede o que diz medir?" (validade) e "ele dá o mesmo resultado em outra hora?" (confiabilidade).\n\n## Validade\nO grau em que o instrumento mede o conceito pretendido. Medir "satisfação do cliente" com uma pergunta "você compraria de novo?" é medir recompra, não satisfação — conceito mais amplo.\n\nComo fortalecer no TCC de graduação:\n1. Baseie as perguntas em instrumentos já validados na literatura (cite a fonte: "escala adaptada de X, 2020").\n2. Juízes: 2-3 pessoas da área avaliam se as perguntas fazem sentido para o construto.\n3. Piloto: aplique em 5-10 pessoas do público-alvo e ajuste as que confundem.\n\n## Confiabilidade\nConsistência da medida. O teste mais comum em escalas é o alfa de Cronbach (calculável no Excel, SPSS ou Google Sheets com extensão): acima de 0,7 é aceitável em pesquisa exploratória.\n\nPara entrevistas, o equivalente é a triangulação: dois avaliadores codificam o mesmo trecho e comparam categorias — divergências viram discussão e refinamento.\n\n## Na prática\nUma frase honesta na metodologia — "o instrumento foi adaptado de X e testado em piloto com N pessoas" — vale mais que três parágrafos de teoria sem aplicação.',
            quiz: [
              {
                prompt: 'O alfa de Cronbach mede qual qualidade de um instrumento?',
                options: [
                  'Validade de conteúdo',
                  'Confiabilidade (consistência interna da escala)',
                  'Tamanho da amostra',
                  'Tempo de resposta',
                ],
                correctIndex: 1,
                explanation:
                  'O alfa de Cronbach avalia a consistência interna: se os itens da escala medem o mesmo construto. Valores acima de 0,7 são considerados aceitáveis em pesquisa exploratória.',
              },
            ],
          },
          {
            title: 'Análise básica de resultados',
            description: 'Do dado bruto à resposta da pergunta: 3 camadas no quantitativo e 4 passos no qualitativo.',
            durationMin: 17,
            content:
              'Coletou os dados? Agora começa o trabalho de verdade — e é mais simples do que parece se você seguir a sequência.\n\n## Dados quantitativos: 3 camadas\n1. Limpeza: remova respostas incompletas ou contraditórias; padronize formatos (datas, textos).\n2. Estatística descritiva: frequências, médias e medianas por pergunta ("62% dos respondentes usam o app diariamente"). Tabelas simples + um gráfico por achado.\n3. Cruzamentos: as relações que respondem à sua pergunta ("quem treina 3x+ avalia melhor o app?"). No Excel, a Tabela Dinâmica resolve 90% dos cruzamentos de um TCC de graduação.\n\nCuidado: correlação não é causalidade — diga "associa-se a", nunca "causa", sem experimento.\n\n## Dados qualitativos: análise de conteúdo\n1. Transcreva as entrevistas (transcrição automática ajuda, mas revise).\n2. Codifique: leia e marque trechos com rótulos ("dificuldade de preço", "confiança no vendedor").\n3. Agrupe códigos parecidos em CATEGORIAS (3-6 por entrevista em média).\n4. Presente cada categoria com o tema + 2-3 citações ilustrativas entre aspas, com código do participante (E3).\n\n## A regra de ouro da apresentação\nCada tabela, gráfico ou citação precisa responder (ou refinar) a pergunta de pesquisa. Dado que não conversa com a pergunta é enfeite — e banca corta enfeite.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'marina@demo.com',
    title: 'Redação Científica: do Parágrafo ao Artigo',
    description:
      'Aprenda a escrever textos acadêmicos que a banca (e os periódicos) aprovam: estrutura IMRD, parágrafos com afirmação e evidência, resumo que vende a pesquisa, revisão de linguagem, submissão às normas do periódico e a resposta aos revisores que decide a publicação.',
    category: 'Acadêmico',
    level: 'INTERMEDIARIO',
    price: 99,
    coverUrl: '/uploads/seed/course-redacao-cientifica.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'Estrutura e estilo',
        description: 'IMRD, o parágrafo que sustenta argumento e o resumo que abre portas.',
        lessons: [
          {
            title: 'A estrutura IMRD: o esqueleto de todo artigo',
            description: 'Introdução, métodos, resultados e discussão: o contrato que acaba com a página em branco.',
            durationMin: 14,
            content:
              'Artigos científicos seguem um esqueleto chamado IMRD — e dominá-lo resolve metade da angústia de escrever, porque você sempre sabe "o que vai nesta seção".\n\n## Introdução\nResponde "qual é o problema e por que importa?" em funil: contexto amplo → o que já se sabe → a lacuna → o que este trabalho faz (objetivo explícito no fim). 10-15% do artigo.\n\n## Métodos\nResponde "como você fez?" com precisão replicável: desenho, participantes/amostra, instrumentos, análise. Nada de resultados aqui.\n\n## Resultados\nResponde "o que você encontrou?" — dados, sem interpretação. Tabelas e figuras carregam o peso; o texto destaca o essencial de cada uma.\n\n## Discussão\nResponde "o que isso significa?": interprete os achados, compare com a literatura ("confirma X; contraria Y, possivelmente porque..."), admita limitações e feche com a contribuição.\n\n## Por que funciona\nO leitor científico lê em ordem de interesse (resumo → resultados → métodos) — a estrutura IMRD permite essa leitura não linear sem perder ninguém. E para você, autor: cada seção tem um contrato claro, então nunca fica a página em branco sem saber o que escrever.\n\nTCC, monografia e artigo compartilham o mesmo esqueleto — muda o tamanho, não a lógica.',
            quiz: [
              {
                prompt: 'Onde NÃO cabe interpretar os resultados encontrados?',
                options: [
                  'Na discussão',
                  'Na conclusão',
                  'Na seção de resultados',
                  'No resumo',
                ],
                correctIndex: 2,
                explanation:
                  'Resultados apresentam dados puros ("o grupo A teve média maior"); a interpretação (o que isso significa, por quê) pertence à discussão. Misturar as duas seções é erro clássico que revisor aponta.',
              },
              {
                prompt: 'Qual sequência reflete o funil correto da introdução científica?',
                options: [
                  'Resultado → método → contexto',
                  'Contexto amplo → o que já se sabe → lacuna → objetivo',
                  'Objetivo → contexto → lacuna',
                  'Lacuna → resultado → discussão',
                ],
                correctIndex: 1,
                explanation:
                  'A introdução é um funil: do contexto amplo para o que a literatura já estabeleceu, revelando a lacuna — e fechando com o objetivo do seu trabalho.',
              },
            ],
          },
          {
            title: 'O parágrafo academicamente forte: afirmação + evidência',
            description: 'A anatomia de 3 peças que transforma bloco de texto em argumento — com antes e depois.',
            durationMin: 15,
            content:
              'Um parágrafo acadêmico não é um bloco de texto qualquer: é um argumento em miniatura, com contrato de três peças.\n\n## A anatomia\n1. Afirmação (a ideia do parágrafo, em uma frase clara — geralmente a primeira).\n2. Evidência (dado, citação, exemplo ou raciocínio que sustenta a afirmação).\n3. Fechamento/ponte (a implicação ou a ligação com o próximo parágrafo).\n\n## Antes e depois\n\nFraco: "As redes sociais são muito importantes para o marketing moderno."\n\nForte: "As redes sociais concentraram a atenção do consumidor brasileiro: 9 em cada 10 usuários de internet acessam ao menos uma rede diariamente (Fonte, 2024). Para o varejo, isso desloca o ponto de contato da loja física para o feed — e exige presença ativa, não apenas catálogo."\n\nA diferença? A segunda versão tem AFIRMAÇÃO específica + EVIDÊNCIA + IMPLICAÇÃO.\n\n## Regras práticas\n- Um parágrafo, uma ideia. Se começou a falar de outra coisa, quebre.\n- Todo "é importante", "é fundamental" e "está comprovado" precisa de evidência logo em seguida — ou sai do texto.\n- Citação direta longa NÃO substitui seu raciocínio: banca lê parágrafo de 8 linhas entre aspas como preguiça.\n- Leia o primeiro parágrafo de cada página do seu texto: só com eles, o argumento inteiro deve aparecer. Se não aparece, os parágrafos não estão contratando.\n\n## Exercício\nPegue um parágrafo seu e rotule: onde está a afirmação? a evidência? o fechamento? O que faltar é o que consertar.',
          },
          {
            title: 'Resumo e palavras-chave: a porta de entrada',
            description: 'A parte mais lida do artigo em 5 frases — e os 4 pecados que reprovam um abstract.',
            durationMin: 12,
            content:
              'Ninguém lê seu artigo do começo: o leitor decide em 30 segundos se continua — e a decisão acontece no resumo. Palavra por palavra, é a parte mais valiosa do texto.\n\n## O resumo estruturado (150-250 palavras, 1 parágrafo)\nA sequência que funciona em quase toda área:\n1. Contexto em 1 frase (o problema).\n2. Objetivo em 1 frase ("este trabalho analisa...").\n3. Método em 1-2 frases (o que, com quem, como).\n4. Principais resultados em 1-2 frases COM números ("a taxa caiu de 12% para 7%").\n5. Implicação em 1 frase ("os resultados sugerem que...").\n\n## Os 4 pecados do resumo\n- Prometer e não entregar ("trata-se de um estudo profundo" — mostre o dado!).\n- Citar referências e usar siglas sem explicar (o resumo viaja sozinho em bancos de dados).\n- Frases-venta ("este imprescindível estudo...") — tom de publicidade mata credibilidade.\n- Copiar frases do corpo do texto coladas (o resumo é reescrito, não recortado).\n\n## Palavras-chave\n3 a 5 termos que um pesquisador do seu tema digitaria no Google Scholar. Misture termo específico e termo buscável: "marketing de relacionamento; WhatsApp Business; pequenas empresas; fidelização".\n\nTeste final: o resumo responde sozinho — qual problema, o que foi feito, o que foi achado e por que importa?',
            quiz: [
              {
                prompt: 'Qual elemento NÃO deve aparecer em um resumo acadêmico?',
                options: [
                  'O objetivo do trabalho',
                  'Citações de referências bibliográficas',
                  'Os principais resultados com números',
                  'O método utilizado',
                ],
                correctIndex: 1,
                explanation:
                  'O resumo precisa ser autossuficiente e viajar sozinho em bases de dados: citações bibliográficas e siglas não explicadas não pertencem a ele.',
              },
            ],
          },
        ],
      },
      {
        title: 'Revisão e publicação',
        description: 'Linguagem revisada, normas do periódico e a conversa com revisores que decide a publicação.',
        lessons: [
          {
            title: 'Revisão de linguagem: clareza, impessoalidade e tempo verbal',
            description: 'Três ajustes que tornam seu texto invisível — no bom sentido: quem lê pensa no conteúdo.',
            durationMin: 16,
            content:
              'Texto científico bom é texto INVISÍVEL: quem lê pensa no conteúdo, não na prosa. Três ajustes transformam qualquer rascunho.\n\n## Clareza: corte o excesso\nAntes: "É de extrema importância ressaltar que, de uma maneira geral, de modo considerável, os resultados obtidos demonstraram..."\nDepois: "Os resultados mostram..."\n\nPasso a passo da revisão de clareza:\n1. Delete aberturas vazias ("é importante destacar", "cabe salientar").\n2. Troque voz passiva + verbo fraco por voz ativa onde possível.\n3. Frase acima de 3 linhas? Divida.\n\n## Impessoalidade sem ser robô\nA norma tradicional prefere "observou-se", "constatou-se" a "eu observei". Truque: deixe o trabalho como agente ("a análise revelou", "os dados indicam"). Evite cadeias de "foi realizado" — viram mola de frase engessada; use com moderação.\n\n## Tempo verbal\n- Revisão de literatura: presente ("Gil (2019) define...") ou pretérito perfeito.\n- Seus procedimentos: passado ("aplicou-se o questionário").\n- Resultados: passado ("a média subiu").\n- Verdades científicas e conclusões vigentes: presente ("o design influencia a decisão").\n\n## O método dos 3 passos\n1. Revise ESTRUTURA (ordem das seções) antes de frase.\n2. Revise parágrafos (uma ideia; afirmação + evidência).\n3. Só então frase por frase — e leia em voz alta: onde você tropeça, o leitor tropeça.',
          },
          {
            title: 'Submissão e normas de periódicos',
            description: 'Escolher onde publicar, o checklist que evita rejeição instantânea e o fluxo real da avaliação.',
            durationMin: 15,
            content:
              'Publicar é um processo com etapas claras — e a maioria das rejeições "instantâneas" (desk rejection) acontece antes de qualquer avaliação científica: por desrespeito às normas ou resumo ruim.\n\n## Escolhendo o periódico\n1. Liste os periódicos onde você leu os artigos da sua fundamentação (público natural do seu tema).\n2. Verifique no site: escopo, normas e taxa. Muitos são gratuitos — NUNCA pague para publicar em revista que promete "publicação rápida" sem peer review: é fábrica de artigo, dinheiro jogado fora e mancha no currículo.\n3. Cheque qualis/indexação se o objetivo é currículo (para graduação, periódicos de universidade são porta de entrada honesta).\n\n## Antes de submeter (checklist)\n- [ ] Normas do periódico aplicadas ao pé da letra (modelo oficial do site).\n- [ ] Resumo nos limites de palavras.\n- [ ] Tabelas e figuras nos formatos pedidos, com fontes.\n- [ ] Referências 100% na norma (o revisor percebe NBR 6023 vs APA de primeira olhada).\n- [ ] Coautor/orientador aprovou a versão final.\n- [ ] Ineditismo garantido: texto submetido não pode estar publicado em outro lugar.\n\n## O fluxo típico\nSubmissão → triagem do editor (1-4 semanas) → avaliação por pares (2-6 meses) → decisão: aceito / aceito com alterações / rejeitado com sugestões. "Aceito com alterações" é vitória — a próxima aula ensina responder os revisores.',
            quiz: [
              {
                prompt: 'Qual é a causa mais comum de rejeição imediata (antes da avaliação científica)?',
                options: [
                  'Falta de gráficos coloridos',
                  'Desrespeito às normas do periódico e resumo fraco',
                  'Uso de voz ativa no texto',
                  'Citar autores brasileiros',
                ],
                correctIndex: 1,
                explanation:
                  'O editor elimina na triagem o que foge das normas, extrapola limites do resumo ou está claramente fora do escopo — a revisão por pares nem começa.',
              },
            ],
          },
          {
            title: 'Respondendo aos revisores',
            description: 'A carta ponto por ponto que transforma "alterações requeridas" em artigo aceito.',
            durationMin: 16,
            content:
              '"Alterações menores/maiores requeridas" não é rejeição — é convite para negociar com profundidade. A resposta aos revisores decide a publicação tanto quanto o artigo original.\n\n## A regra mental\nRevisor não é inimigo: é o leitor mais atento que seu texto terá na vida. Trate cada comentário como dado, não como ataque.\n\n## A carta de resposta (ponto por ponto)\nFormato que funciona: repita cada comentário, responda abaixo e diga ONDE o texto mudou.\n\nComentário 1: "A amostra parece pequena para as conclusões."\nResposta: "Concordamos parcialmente. Ampliamos a discussão das limitações (p. 12) e reescrevemos a conclusão para explicitar o caráter exploratório. Não foi possível ampliar a amostra no prazo, o que registramos como sugestão de pesquisa futura."\n\n## Como responder cada tipo\n- Concordo: agradeça, mude, aponte a página.\n- Discordo: responda COM EVIDÊNCIA e sem ironia ("mantivemos a escolha de X porque...", com referência). Discordar com argumento é respeitado; com birra, não.\n- Comentário confuso: peça esclarecimento ao editor — evita resposta atrapalhada e atrito.\n\n## Prazo e final\nResponda TODAS as sugestões, mesmo as "menores" (vírgula, referência faltando). Ignorar comentário trivial é o que mais irrita revisor. E revise a carta na mesma régua do artigo: ela também é avaliada.\n\nArtigo aceito? Comemore — e guarde a carta: é seu melhor material de estudo para o próximo.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'thiago@demo.com',
    title: 'Oratória para Trabalhos, Defesas e Apresentações',
    description:
      'Fale em público sem desmontar: técnicas comprovadas para controlar o nervosismo, abrir com força, montar slides que apoiam, comandar voz e postura, controlar o tempo e responder as perguntas difíceis — da sala de aula à defesa de TCC e às apresentações no trabalho.',
    category: 'Carreira',
    level: 'INICIANTE',
    price: 79,
    coverUrl: '/uploads/seed/course-oratoria.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'Preparação que vence o medo',
        description: 'Nervosismo controlado, estrutura clara e slides que trabalham por você.',
        lessons: [
          {
            title: 'Vencendo o nervosismo: respiração e ancoragem',
            description: 'O corpo reage antes da fala — aprenda a regular o medo pela fisiologia, não pela força de vontade.',
            durationMin: 13,
            content:
              'Nervosismo não é defeito — é o corpo injetando energia para uma situação importante. O objetivo não é eliminá-lo: é colocá-lo para trabalhar a seu favor.\n\n## Por que o corpo reage\nO cérebro interpreta "todo mundo olhando" como ameaça: coração acelera, boca seca, voz treme. Como não dá para argumentar com a amígdala, você regula pelo corpo.\n\n## A respiração 4-6\nAntes de apresentar: inspire pelo nariz contando até 4, expire pela boca contando até 6. Repita 5 vezes. A expiração longa ativa o sistema parassimpático — o freio natural do corpo. É a mesma técnica de atletas antes da prova.\n\n## Ancoragem: a postura que engana o cérebro\n2 minutos antes: pés afastados na largura dos ombros, ombros abertos, olhar no horizonte. A postura expansiva reduz a sensação de ameaça — o corpo informa o cérebro que está tudo bem (é o inverso do que você pensa).\n\n## Os 3 primeiros minutos decorados\nNervosismo cai com previsibilidade: decore DE COR as duas primeiras frases. Depois que a abertura sai, o fluxo vem — e o pico de ansiedade (sempre nos primeiros 90 segundos) já passou.\n\n## O que NÃO fazer\nCafeína em dobro antes de falar, ensaio mental de desastre ("e se eu travar?") e esconder atrás do púlpito. Troque por: água por perto, visualização de sucesso e passos no palco.',
            quiz: [
              {
                prompt: 'Por que a respiração com expiração longa (inspirar em 4, expirar em 6) acalma antes de apresentar?',
                options: [
                  'Aumenta a oxigenação do cérebro e elimina o nervosismo para sempre',
                  'A expiração longa ativa o sistema parassimpático, o freio natural do corpo',
                  'Distrai você do público',
                  'Substitui o ensaio da apresentação',
                ],
                correctIndex: 1,
                explanation:
                  'A expiração prolongada ativa o sistema parassimpático, que reduz batimentos e sensação de ameaça. Não elimina o nervosismo (nem precisa), mas o traz para níveis úteis.',
              },
            ],
          },
          {
            title: 'Estrutura da apresentação: a abertura forte',
            description: 'Os 30 segundos que decidem tudo: 4 aberturas prontas, 3 blocos e o fechamento que colhe.',
            durationMin: 14,
            content:
              'O público decide te ouvir (ou checar o celular) nos primeiros 30 segundos. Abertura forte não é charme: é engenharia.\n\n## Aberturas que funcionam\n1. Pergunta provocante: "Quantos TCCs são entregues atrasados todo ano no Brasil? Mais da metade — e hoje eu mostro por quê."\n2. Dado de impacto: "Cada hora de reunião improdutiva custa R$ 400 para esta empresa."\n3. História curta (20 segundos, real): "Na minha primeira apresentação, eu esqueci o próprio nome. O que aprendi com isso salvou as próximas 200."\n4. A frase-ponte: "Daqui a 10 minutos, você vai sair daqui sabendo fazer X."\n\nNunca abra com "então... meu trabalho é sobre..." (desperdiça o pico de atenção) nem pedindo desculpas ("não preparei slides bonitos...").\n\n## O corpo: 3 blocos, não 12\nEstrutura memorável: problema → solução/método → resultado/aplicação. Três blocos que o público reconstrói depois. Em cada bloco: 1 ideia central + 1 exemplo concreto.\n\n## O fechamento que colhe\nTermine com a mensagem-única ("se você levar uma coisa daqui: comece pelo recorte do tema") e um convite claro. Nunca "é isso... obrigado?" — a última frase é a primeira a ser lembrada.\n\n## Regra dos 10%\nPrepare abertura e fechamento palavra por palavra; o meio, em tópicos. É aí que a "improvisação planejada" acontece.',
          },
          {
            title: 'Slides que apoiam (em vez de competir)',
            description: 'A regra dos números, o título-conclusão e o teste do slide morto que salva sua apresentação.',
            durationMin: 15,
            content:
              'O slide é apoio visual, não teleprompter. Quando ele compete com você, o público lê — e para de ouvir (leitura e escuta não dividem bem o mesmo canal).\n\n## A regra dos números\n- 1 slide = 1 ideia.\n- Máximo 6 linhas por slide, ~8 palavras por linha.\n- 10 slides para 10 minutos é um teto saudável.\n- Fonte mínima 24 pt (título 36+): quem está na última fileira precisa ler.\n\n## Conteúdo que trabalha\n- Título em FRASE-CONCLUSÃO, não em rótulo: "Vendas caíram 30% no inverno" vence "Gráfico de vendas".\n- Gráfico > tabela. Tabela longa no slide = tabela no apêndice.\n- Uma cor de destaque, no máximo duas fontes. Nada de transição animada.\n\n## Cite a fonte\nDado no slide pede fonte em rodapé pequeno — banca olha isso. Foto genérica de banco de imagem soma menos que um gráfico seu.\n\n## O teste do slide morto\nImprima os slides e cubra você: se os slides SOZINHOS contam a história inteira, você é dispensável — sobrou demais. Se não dá para entender NADA sem você, faltou apoio. O equilíbrio é: slides mostram estrutura e dados; você conta a história.\n\nE confira o projetor ANTES (cabos, fonte, PDF de backup) — falha técnica no começo destrói a abertura forte.',
            quiz: [
              {
                prompt: 'Qual é o melhor título para um slide que mostra queda de vendas no inverno?',
                options: [
                  'Slide 4 — Vendas',
                  'Gráfico de vendas por mês',
                  'Vendas caíram 30% nos meses de inverno',
                  'Análise quantitativa do movimento sazonal de vendas',
                ],
                correctIndex: 2,
                explanation:
                  'Título de slide deve ser a conclusão que você quer que o público retire — frase com o achado —, não um rótulo descritivo que obriga todos a decifrar o gráfico.',
              },
            ],
          },
        ],
      },
      {
        title: 'Execução: do ensaio ao Q&A',
        description: 'Voz, tempo, ensaio e as perguntas difíceis: o que fazer no palco.',
        lessons: [
          {
            title: 'Voz e postura no palco',
            description: 'Volume, pausa e variação + os gestos que transmitem autoridade (e os que entregam o nervoso).',
            durationMin: 14,
            content:
              'Sua voz e seu corpo falam antes (e mais alto) que o conteúdo. Três ajustes mudam a percepção de segurança.\n\n## Voz: volume, pausa, variação\n- Volume: fale 20% mais alto do que o normal da conversa — salas engolem voz. "Falar para a última fileira" resolve.\n- A pausa é a ferramenta mais subestimada: 2 segundos de silêncio após a frase importante fazem ela afundar. Preencher todo silêncio com "então", "né", "é..." é o sintoma do nervoso — substitua por pausa.\n- Variação: mesma entonação por 10 minutos = berço. Mude o ritmo nas transições ("agora, a parte mais importante...") e desacelere nas conclusões.\n\n## Postura e movimento\n- Pés fixos na largura dos ombros quando você fala a ideia central (estabilidade transmite autoridade) — e MOVIMENTO nas transições (andar 2 passos marca o capítulo).\n- Mãos: acima da cintura e visíveis. Mãos escondidas (bolso, costas, cruzadas) lêem como insegurança.\n- Contato visual: 3-5 segundos por pessoa/setor, varrendo a sala em zigue-zague. Falar só para o professor ou para o projetor desconecta o resto.\n\n## Dica de treino\nGrave um áudio da sua apresentação e ESCUTE: você corrige em 10 minutos o que 10 conselhos não consertam — seu ouvido detecta os "é", "então", a monotonia e a pressa melhor que qualquer checklist.',
          },
          {
            title: 'Ensaio e controle de tempo',
            description: 'O protocolo dos 3 ensaios, os marcos de tempo e o que cortar (com antecedência) quando o relógio aperta.',
            durationMin: 13,
            content:
              'A diferença entre apresentação amadora e profissional é ensaio — não talento. E o ensaio certo tem método.\n\n## O protocolo de 3 ensaios\n1. Ensaio de estrutura (sozinho, sem slides): passe pelos 3 blocos falando do jeito natural. Objetivo: fixar o ESQUELETO.\n2. Ensaio com slides, cronometrado: fale em voz alta, com o tempo real. Estourou 20%? Corte conteúdo — nunca fale mais rápido.\n3. Ensaio de ponta a ponta (com 1-2 pessoas de feedback honesto): com pausas, transições e o fechamento decorado.\n\n## Controle de tempo no dia\n- Saiba os seus MARCOS: "aos 3 minutos devo estar entrando no bloco 2". Chegou no bloco 2 aos 5? Corte um exemplo do bloco 3 — e saiba de antemão O QUE cortar.\n- Nunca decore frase por frase: decore ABERTURA, FECHAMENTO e as transições. O resto flui do esqueleto — e soa vivo.\n\n## Armadilhas\n- Ensaio mental (pensar a apresentação deitado) não substitui ensaio em voz alta — a boca precisa treinar.\n- Cronometrar na véspera só revela o problema sem tempo de consertar. Cronometre 3 dias antes.\n\nPúblico perdoa slide feio; não perdoa apresentação de 40 minutos num espaço de 15.',
            quiz: [
              {
                prompt: 'Você percebe no meio da apresentação que está 5 minutos atrasado. O que fazer?',
                options: [
                  'Falar cada vez mais rápido até o fim',
                  'Cortar o conteúdo previsto (exemplos secundários) usando os cortes preparados no ensaio',
                  'Pular o fechamento, que é o que menos importa',
                  'Estourar o tempo — o conteúdo é mais importante que a regra',
                ],
                correctIndex: 1,
                explanation:
                  'Acelerar destrói a clareza e estourar o tempo desrespeita a banca/espectadores. O ensaio deve preparar antecipadamente O QUE cortar — e o fechamento é a última coisa a ser sacrificada.',
              },
            ],
          },
          {
            title: 'Perguntas difíceis da banca e do público',
            description: 'As 5 perguntas prováveis, a técnica do gancho e as respostas honestas que pontuam.',
            durationMin: 15,
            content:
              'A sessão de perguntas é onde a apresentação deixa de ser espetáculo e vira conversa técnica — e onde a banca de fato avalia você. Trate-a como parte planejada, não como ameaça.\n\n## Prepare as 5 prováveis\nElas quase sempre se repetem: "por que esse recorte?", "por que essa metodologia?", "e se o cenário mudar?", "qual a aplicação prática?", "o que você faria diferente?". Escreva a resposta de 30 segundos para cada e leve no papel.\n\n## A técnica do gancho\nAntes de responder, reestruture a pergunta em voz alta: "então a pergunta é: com amostra pequena, o que sustenta a conclusão? Ótima questão..." Você ganha 5 segundos para pensar, mostra que ouviu e corrige o ângulo se a pergunta veio distorcida.\n\n## Respostas honestas que pontuam\n- Não sabe? "Não tenho esse dado hoje; pelo que analisei, minha hipótese seria X — e registro isso como limitação."\n- Pergunta fora do escopo? "Interessante e fora do recorte deste trabalho — valeria uma pesquisa própria. No escopo que tracei, o que posso dizer é..."\n- Discorda do questionador? "Entendo a leitura; eu diverjo porque..." + evidência. Sem birra e sem capitulação.\n\n## O fechamento da sessão\nAgradeça a pergunta difícil ("isso fortaleceu o trabalho"). Banca esquece slide, mas não esquece postura — e nunca responda com arrogância nem peça desculpas por existir.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'david@demo.com',
    title: 'Excel do Zero: Planilhas que Impressionam',
    description:
      'Domine o Excel do primeiro clique à tabela dinâmica: fórmulas essenciais (SOMA, SE, PROCX), gráficos que comunicam, limpeza de dados, formatação condicional e um projeto final de painel de controle para você usar de verdade na segunda-feira seguinte.',
    category: 'Negócios',
    level: 'INICIANTE',
    price: 99,
    coverUrl: '/uploads/seed/course-excel.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'Fundamentos e fórmulas',
        description: 'Da interface às fórmulas que resolvem 90% do trabalho do dia a dia.',
        lessons: [
          {
            title: 'Interface e sua primeira planilha',
            description: 'O mapa da tela, os gestos essenciais e a primeira fórmula em 12 minutos.',
            durationMin: 12,
            content:
              'Excel assusta pela tela cheia — mas o que você precisa dominar no primeiro dia cabe em uma aula.\n\n## O mapa da tela\n- Célula: o quadradinho. Referenciada por coluna+linha (B4). É a unidade de tudo.\n- Barra de fórmulas: mostra o conteúdo REAL da célula (o que você digitou) vs o que aparece formatado na planilha.\n- Abas: o arquivo é a pasta de trabalho; cada aba é uma folha.\n\n## Primeiros gestos\n- Enter confirma, Esc cancela, F2 edita a célula (você vai usar o F2 100 vezes por dia).\n- Preencher série: digite "Janeiro" na A1 e arraste a alça de preenchimento (quadradinho inferior direito) até A12 — o Excel completa os meses. Funciona com datas, dias da semana e números em sequência.\n- Formato de célula: Ctrl+1 abre a caixa onde você define moeda (R$), porcentagem e data. Sempre formate — "0,15" sem formato de % confunde todo mundo.\n\n## Sua primeira mini-planilha\nColunas: Item, Valor. Linhas: 5 gastos do mês. Some com =SOMA(B2:B6) — sua primeira fórmula, que a próxima aula expande para valer um salário.',
          },
          {
            title: 'Fórmulas essenciais: SOMA, MÉDIA, SE e PROCX',
            description: 'As 4 famílias que resolvem a maioria dos pedidos de planilha no trabalho — com exemplos prontos.',
            durationMin: 18,
            content:
              'Quatro famílias de fórmula resolvem a maioria dos pedidos de planilha no trabalho. Domine estas e você sai do Excel "calculadora" para o Excel ferramenta.\n\n## Agregações\n=SOMA(B2:B100), =MÉDIA(B2:B100), =MÁXIMO, =MÍNIMO, =CONT.VALORES (conta preenchidos). Atalho sagrado: Alt+= insere a SOMA automática do bloco acima.\n\n## A condicional rainha: SE\n=SE(B2>=70;"Aprovado";"Reprovado")\n\nLeitura: SE a condição é verdadeira, faça X; senão, Y. Para várias faixas, use SES:\n=SES(B2>=90;"Excelente";B2>=70;"Bom";VERDADEIRO;"Atenção")\n\n## Contar e somar com critério\n=CONT.SE(C2:C100;"Pago") — quantas células têm "Pago".\n=SOMASE(D2:D100;"Sudeste";B2:B100) — soma os valores (coluna B) onde a região (coluna D) é Sudeste. Essas duas valem uma promoção no primeiro mês.\n\n## Procurar valores: PROCX (o novo PROCV)\n=PROCX(E2;A:A;C:C;"Não encontrado")\n\nTradução: procure o valor de E2 na coluna A e me devolva o correspondente na coluna C. O PROCX substitui o PROCV sem a limitação "só busca para a direita". Em versões antigas, o PROCV resolve: =PROCV(E2;A:C;3;FALSO) — coluna 3 da tabela, correspondência exata (FALSO).\n\n## Dica de ouro\nF4 trava a referência ($A$2) ao editar a fórmula — 90% dos erros de iniciante são fórmula que "escorrega" ao arrastar.',
            quiz: [
              {
                prompt: 'Qual fórmula soma apenas os valores da coluna B onde a coluna D contém "Sudeste"?',
                options: [
                  '=SOMA(B:B;D:D)',
                  '=SOMASE(D:D;"Sudeste";B:B)',
                  '=SE(D:D="Sudeste";SOMA(B:B))',
                  '=CONT.SE(D:D;"Sudeste")',
                ],
                correctIndex: 1,
                explanation:
                  'A SOMASE soma um intervalo (B) condicionado ao critério em outro (D = "Sudeste"). A SOMA não filtra, a CONT.SE conta (não soma) e a sintaxe da opção C não existe.',
              },
              {
                prompt: 'O que a tecla F4 faz ao editar uma fórmula?',
                options: [
                  'Salva o arquivo',
                  'Trava a referência da célula ($A$2) para não escorregar ao copiar',
                  'Abre a tabela dinâmica',
                  'Desfaz a última ação',
                ],
                correctIndex: 1,
                explanation:
                  'F4 alterna a referência relativa/absoluta. Travar a referência é essencial quando a fórmula aponta para uma taxa ou constante fixa e você vai arrastá-la.',
              },
            ],
          },
          {
            title: 'Gráficos que comunicam',
            description: 'O gráfico certo para cada pergunta + os 4 ajustes que profissionalizam qualquer visual.',
            durationMin: 15,
            content:
              'Gráfico ruim esconde a informação; gráfico bom conta a história em 3 segundos. A escolha certa depende do tipo de pergunta.\n\n## O gráfico certo para cada pergunta\n- Comparação entre categorias → BARRAS (colunas). "Vendas por região" — sempre ordene do maior para o menor.\n- Evolução no tempo → LINHA. "Receita mês a mês" — e nunca use gráfico 3D.\n- Composição de um total → COLUNA EMPILHADA ou PIZZA (só com até 4 fatias; pizza de 8 fatias ninguém lê).\n- Relação entre duas variáveis → DISPERSÃO. "Preço x unidades vendidas".\n\n## Como criar (e arrumar)\nSelecione os dados → Inserir → Gráfico recomendado. Depois, os 4 ajustes que profissionalizam:\n1. DELETE o que não comunica (grade demais, moldura, sombra, legenda óbvia).\n2. Título que CONCLUI ("churn caiu 30% após o onboarding novo").\n3. Destaque UMA barra/fatia com cor diferente — o olho vai direto ao ponto.\n4. Rótulos de dados nos pontos-chave em vez de eixo inchado.\n\n## Armadilha do eixo\nEixo Y que não começa em zero exagera diferenças — legítimo só quando o foco é a variação, e sempre com nota. Em apresentação para chefe ou banca: comece em zero e durma tranquilo.',
          },
          {
            title: 'Tabelas dinâmicas: resumos em 60 segundos',
            description: 'Linhas, colunas, valores e filtros: o relatório que levava uma hora em 3 arrastes.',
            durationMin: 18,
            content:
              'A tabela dinâmica é a ferramenta que separa quem usa Excel de quem domina Excel: ela responde em 60 segundos perguntas que exigiriam fórmulas gigantes.\n\n## Prepare o terreno\nA base de dados precisa estar crua e limpa: 1 linha de cabeçalho, sem células mescladas, sem linhas vazias no meio, 1 tipo de dado por coluna. Base que passa nisso já está 80% pronta.\n\n## Criando (o fluxo é sempre o mesmo)\n1. Clique em qualquer célula da base → Inserir → Tabela Dinâmica.\n2. Arraste campos para as áreas:\n- LINHAS: o que você quer listar (região, produto, vendedor).\n- VALORES: o que você quer somar/contar/média (valor da venda).\n- COLUNAS: a segunda dimensão (mês).\n- FILTROS: o corte geral (ano).\n\nExemplo: Linhas = Produto, Colunas = Mês, Valores = Soma de Vendas → relatório anual em 3 arrastes.\n\n## Os ajustes que valem a aula\n- Botão direito em VALORES → "Configurações de campo de valor": troque SOMA por MÉDIA/CONTAGEM e formate moeda.\n- Segmentação de Dados (Slicer): botões de filtro que qualquer chefe clica feliz.\n- Atualizar: a tabela dinâmica NÃO atualiza sozinha quando os dados mudam — Alt+F5 (ou Dados → Atualizar). Esquecer isso é o clássico relatório com número velho.\n\n## Regra de segurança\nNúmero de apresentação sai de tabela dinâmica, não de soma "no olho" — quando o dado muda, sua apresentação não mente.',
            quiz: [
              {
                prompt: 'Você atualizou os dados brutos, mas a tabela dinâmica continua com os números antigos. Por quê?',
                options: [
                  'A tabela dinâmica travou o arquivo',
                  'Tabela dinâmica não se atualiza sozinha — precisa de Atualizar (Alt+F5)',
                  'Você precisa recriar a tabela do zero',
                  'O Excel salvou uma cópia automática antiga',
                ],
                correctIndex: 1,
                explanation:
                  'A tabela dinâmica é um resumo em cache: após mudar os dados de origem, clique nela e use Atualizar (Alt+F5). Esquecer esse passo é fonte clássica de relatório com números errados.',
              },
            ],
          },
        ],
      },
      {
        title: 'Planilhas profissionais',
        description: 'Dados limpos, validação contra erro humano e o painel final que junta tudo.',
        lessons: [
          {
            title: 'Formatação condicional e validação de dados',
            description: 'A planilha que mostra alerta quando algo sai do trilho — e freia o erro antes de acontecer.',
            durationMin: 15,
            content:
              'Planilha profissional é a que evita erro antes dele acontecer — e mostra alerta quando ele já aconteceu. Duas ferramentas fazem isso com poucos cliques.\n\n## Formatação condicional (visual inteligente)\nPágina Inicial → Formatação Condicional. Os usos que valem por dia:\n1. Escala de cor em valores (verde alto → vermelho baixo): mapa de calor instantâneo de desempenho.\n2. Regra "menor que 0" em vermelho: prejuízo pula aos olhos.\n3. Realçar duplicados: pega cadastro repetido antes de virar dor de cabeça.\n4. Barras de dados: mini-gráficos dentro da célula, ótimos para listas de progresso.\n\nRegra de bom senso: 2 regras visuais por planilha, no máximo. Planilha de Natal (tudo colorido) comunica menos que a monocromática com 2 destaques certos.\n\n## Validação de dados (freio de erro humano)\nDados → Validação de Dados:\n- Lista suspensa: restrinja "Status" a (Pago, Pendente, Cancelado) — acabou o "pago", "PAGO" e "pg" na mesma coluna.\n- Número entre limites: desconto entre 0% e 30% — o colega digita 300 e o Excel bloqueia.\n- Data no intervalo do projeto.\n\n## Combinação matadora\nLista suspensa + PROCX: a pessoa escolhe o produto no menu e a planilha preenche preço, estoque e fornecedor sozinha. É o "sistema" que impressiona qualquer gestor — e leva 10 minutos para montar.',
          },
          {
            title: 'Limpeza de dados: duplicados, texto para colunas e mais',
            description: 'As ferramentas do menu Dados que resolvem 60% do trabalho de análise — com as regras de segurança.',
            durationMin: 16,
            content:
              'Dados reais chegam sujos: nomes com espaço sobrando, datas como texto, cidade escrita de 4 jeitos diferentes. Limpar bem é 60% do trabalho de análise — e o Excel tem as ferramentas certas.\n\n## Remover duplicados\nSelecione a faixa → Dados → Remover Duplicados. CUIDADO: ele DELETA linhas — trabalhe em uma CÓPIA da base primeiro (ou use Formatação Condicional → Duplicados para ver antes de apagar).\n\n## Texto para colunas\nNome completo "Ana Silva Costa" em uma célula → Dados → Texto para Colunas → Delimitado por espaço → 3 colunas. Resolve também CSV que veio tudo junto por vírgula e código com prefixo ("BR-1234" vira "BR" e "1234").\n\n## ARRUMAR, MINÚSCULA, MAIÚSCULA\n=ARRUMAR(B2) tira espaços duplos e das pontas; =MINÚSCULA padroniza e-mails; =MAIÚSCULA para siglas. Faça em coluna auxiliar e cole como valores (Colar Especial → Valores) — nunca escreva por cima da original sem backup.\n\n## Datas que não são datas\nData "vinda como texto" não ordena nem filtra. Teste: alinhada à esquerda = texto; à direita = data. Corrija com Texto para Colunas (avançar até Concluir, sem delimitador) ou com DIVIDIR.TEXTOS.\n\n## A regra que salva\nAntes de QUALQUER limpeza: salve a versão original ou duplique a aba. Limpeza sem backup é limpeza que você vai refazer do zero.',
            quiz: [
              {
                prompt: 'Antes de usar "Remover Duplicados" em uma base importante, qual é o passo de segurança?',
                options: [
                  'Ordenar a planilha em ordem alfabética',
                  'Trabalhar em uma cópia da base (ou salvar backup), pois a ação DELETA linhas',
                  'Aplicar formatação condicional em verde',
                  'Converter tudo para texto',
                ],
                correctIndex: 1,
                explanation:
                  'Remover Duplicados apaga linhas sem pedir confirmação — com a base original preservada (aba duplicada ou arquivo salvo), o erro é reversível; sem backup, não.',
              },
            ],
          },
          {
            title: 'Projeto final: seu painel de controle pessoal',
            description: 'A arquitetura de 3 abas que junta tudo do curso em um dashboard que você usa de verdade.',
            durationMin: 20,
            content:
              'Hora de juntar tudo em um projeto que você usa na segunda-feira: um painel de controle (dashboard) pessoal. Escolha UM dos três temas: finanças pessoais, controle de estudos ou acompanhamento de metas da equipe.\n\n## A arquitetura de 3 abas\n1. ABA DADOS: onde entra o dado cru — 1 linha por lançamento (data, categoria, valor, status). Formatação mínima. É a única aba que você alimenta no dia a dia.\n2. ABA ANÁLISE: tabelas dinâmicas (categoria x mês; status; top 5) + as fórmulas do curso (SOMASE para totais por categoria, CONT.SE para contagem de pendências).\n3. ABA PAINEL: a vitrine — 3-4 gráficos ligados às tabelas dinâmicas + 3 indicadores grandes (total do mês, média por semana, % de cumprimento) + segmentação de dados para filtrar por período.\n\n## Regras do painel profissional\n- Zero digitação na aba PAINEL: tudo atualiza sozinho (tabela dinâmica → Atualizar).\n- 1 tela, sem rolagem: painel que pede scroll morre de desuso.\n- Formatação condicional nos indicadores (meta batida = verde).\n\n## Checklist de entrega\n[ ] 20+ lançamentos de dados reais (planilha sem dado real não ensina nada)\n[ ] 2+ tabelas dinâmicas\n[ ] 3+ gráficos com título-conclusão\n[ ] Lista suspensa validando a coluna de categoria\n\nPoste o print do seu painel no mural da plataforma — e traga à mentoria 1:1: revisamos estrutura, não só fórmula.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'camila@demo.com',
    title: 'Gestão do Tempo para Estudantes',
    description:
      'Pare de correr atrás do prazo: descubra para onde seu tempo vai de verdade, priorize com a matriz de Eisenhower, proteja blocos de estudo no calendário, aplique o Pomodoro ao estudo e prepare provas sem virar a noite — com métodos feitos para a rotina real de quem estuda e trabalha.',
    category: 'Carreira',
    level: 'INICIANTE',
    price: 69,
    coverUrl: '/uploads/seed/course-gestao-tempo.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'Diagnóstico e prioridade',
        description: 'Audite seu tempo real e aprenda a decidir o que vem primeiro.',
        lessons: [
          {
            title: 'Auditoria do seu tempo: para onde ele vai de verdade',
            description: 'O registro de 3 dias que desmente sua sensação — e as 3 perguntas que transformam dados em decisão.',
            durationMin: 14,
            content:
              'Todo mundo acha que sabe onde gasta o tempo — e todo mundo erra. A sensação diz "fiquei o dia estudando"; o registro mostra 47 minutos e 2h40 de scroll. Antes de otimizar, meça.\n\n## A auditoria de 3 dias\nPor 3 dias (1 dia útil, 1 dia de aula, 1 fim de semana), registre o dia em blocos de 30 minutos. Papel, nota do celular ou planilha — o formato não importa; a honestidade sim. Anote o que VOCÊ estava fazendo, não o que pretendia fazer.\n\n## As 3 perguntas da análise\n1. Quanto tempo foi para o que eu declarei prioridade? (Estudo? TCC? Trabalho?)\n2. Quais são os 3 maiores "ladrões invisíveis"? Clássicos: transições ("só 5 minutinhos" 12 vezes ao dia), notificações e o horário morto pós-jantar.\n3. Em que horário minha energia é melhor? Você tem 2-3 horas de pico por dia — onde elas estão indo hoje?\n\n## O que fazer com o resultado\nNão corte tudo de uma vez: escolha UM ladrão para reduzir nesta semana (ex.: notificações off + celular fora do alcance na sessão de estudo) e UM horário de pico para blindar. Auditoria sem decisão é passatempo; com decisão, ela devolve 5-10 horas por semana.',
          },
          {
            title: 'Matriz de prioridades para prazos acadêmicos',
            description: 'Urgente não é importante: os 4 quadrantes aplicados a provas, TCC e demanda de terceiros.',
            durationMin: 15,
            content:
              'Urgente e importante não são a mesma coisa — e confundir os dois é por que a semana inteira vira resposta de e-mail e a prova fica para a véspera.\n\n## A matriz (Eisenhower aplicada ao estudante)\n- URGENTE + IMPORTANTE → FAZER AGORA: prova de amanhã, entrega de TCC, pedido do orientador com prazo.\n- IMPORTANTE + NÃO URGENTE → AGENDAR (a região que muda sua vida): revisão semanal, leitura da fundamentação, exercícios — é o que evita que tudo vire urgente.\n- URGENTE + NÃO IMPORTANTE → NEGOCIAR/DELEGAR: responder grupo no máximo 2x ao dia, tarefa que outra pessoa podia fazer sem prejuízo.\n- NEM URGENTE NEM IMPORTANTE → ELIMINAR: scroll por inércia, maratonar série no meio da tarde de estudo.\n\n## O diagnóstico honesto\nMostre sua semana da auditoria anterior: onde ficaram os blocos? Estudante típico vive no quadrante 1 (apagando incêndio) e no 4 (descanso malfeito). A diferença de quem entrega tudo em paz: tempo CONSISTENTE no quadrante 2.\n\n## Na prática, toda segunda-feira\nListe as tarefas da semana → classifique cada uma nos 4 quadrantes → as do quadrante 2 ganham BLOCO no calendário (próxima aula). Tarefa importante sem horário no calendário é desejo, não plano.',
            quiz: [
              {
                prompt: 'Ler a fundamentação teórica do TCC com 2 meses de antecedência se encaixa em qual quadrante?',
                options: [
                  'Urgente e importante — fazer agora em modo pânico',
                  'Importante e não urgente — agendar bloco no calendário',
                  'Urgente e não importante — fazer rápido e seguir',
                  'Nem urgente nem importante — eliminar',
                ],
                correctIndex: 1,
                explanation:
                  'Leitura antecipada é o quadrante 2: alta importância, zero urgência — exatamente o que vira incêndio se ninguém agendar. Bloco no calendário transforma planejamento em realidade.',
              },
            ],
          },
          {
            title: 'Bloqueio de tempo no calendário',
            description: 'A técnica que decide por você: blocos nomeados, duração certa e a revisão de sexta sem culpa.',
            durationMin: 14,
            content:
              'Lista de tarefas diz O QUE fazer; calendário diz QUANDO. Estudante que só tem lista nunca acha o momento — o calendário decide por você.\n\n## O método\n1. Abra o calendário da semana (Google Agenda ou papel — o que você de fato olha).\n2. Bloqueie PRIMEIRO os compromissos fixos: aula, trabalho, sono, refeições.\n3. Nos espaços restantes, marque os blocos de estudo com nome ESPECÍFICO: "TCC — escrever metodologia", e não "estudar". Tarefa específica entra no bloco e roda; "estudar" genérico morre na decisão de por onde começar.\n4. Blindagem: notificações off, celular em outro cômodo, fone como sinal de "não me chame".\n\n## Regras de duração\n- Blocos de 50-90 minutos com pausa real de 10 (levantar, água, janela — abrir Instagram não é pausa).\n- Tarefas grandes quebradas em blocos pequenos: "capítulo 3" não é bloco; "metodologia — parágrafos 1 e 2" é.\n- 20% da carga de folga: semana com agenda 100% lotada quebra no primeiro imprevisto.\n\n## O detalhe que muda tudo\nReveja na sexta (10 minutos): o que caiu fora? Reagrande IMEDIATAMENTE para a próxima semana, sem culpa. Bloco perdido não é fracasso — é dado da próxima agenda.',
          },
        ],
      },
      {
        title: 'Execução: estudar de verdade',
        description: 'Pomodoro adaptado ao estudo e preparação de prova que dispensa madrugada.',
        lessons: [
          {
            title: 'O método Pomodoro aplicado ao estudo',
            description: 'Por que o timer vence a preguiça de começar — e como adaptar os ciclos à leitura densa.',
            durationMin: 13,
            content:
              'Pomodoro é simples: 25 minutos de foco total + 5 de pausa; a cada 4 ciclos, pausa de 15-30 minutos. Simples não é trivial — o que o faz funcionar é a aplicação certa.\n\n## Por que funciona no estudo\n- O compromisso é pequeno (só 25 minutos), o que vence a barreira de começar — o maior gargalo de quem estuda.\n- O timer cria urgência artificial que afasta a distração ("posso olhar o celular DEPOIS do pomodoro").\n- A pausa programada evita a fadiga que derruba a retenção depois de 40-50 minutos.\n\n## Como aplicar (o guia prático)\n1. Defina UMA tarefa concreta antes de apertar o timer ("resolver 5 questões de estatística").\n2. Papel ao lado: ideia ou lembrança que aparecer, anote e volte — é o "estacionamento mental".\n3. Pausa DE VERDADE: levantar, água, alongar. Trocar de tela não é pausa.\n4. No fim do ciclo, registre um ✓. Quatro ✓ = pausa longa.\n\n## Adaptações honestas\n- Leitura densa (fundamentação, lei seca): experimente 50/10 — o pomodoro de 25 é curto demais para entrar no texto.\n- Encaixe com o ebook "Hábitos de Estudo Eficientes" da plataforma: o pomodoro é o motor do hábito de sessão diária — 2 pomodoros por dia batem 10 horas de véspera, sempre.\n\nNão conte pomodoros, conte PROGRESSO: a régua é a tarefa que saiu, não o sino que tocou.',
            quiz: [
              {
                prompt: 'Durante um pomodoro de 25 minutos, surge uma ideia importante ("preciso responder aquele e-mail"). O que o método recomenda?',
                options: [
                  'Responder agora — leva 1 minuto',
                  'Anotar em um papel ao lado (estacionamento mental) e voltar ao foco',
                  'Abandonar o pomodoro e recomeçar depois',
                  'Guardar na memória para depois',
                ],
                correctIndex: 1,
                explanation:
                  'Anotar limpa a memória de trabalho sem quebrar o foco. Responder "só 1 minuto" abre a porta da distração — e o pomodoro perdido vira recomeço do zero.',
              },
            ],
          },
          {
            title: 'Estudar para prova sem virar a noite',
            description: 'O plano de 7 dias com recuperação ativa — e por que dormir é parte do método, não recompensa.',
            durationMin: 15,
            content:
              'Véspera virada é matemática ruim: você troca 8 horas de estudo ruim por um dia seguinte de cérebro lento — e a retenção despenca. O plano que dispensa madrugada começa 7 dias antes.\n\n## O plano de 7 dias\n- D-7 a D-5: mapa da prova. Junte o que cai (slides, anotações, listas) e divida pelos dias. Meta diária POR TÓPICO ("segunda: cap. 1 e 2"), nunca "estudar matéria X".\n- D-4 a D-2: RECUPERAÇÃO ATIVA — o que separa quem aprende de quem só relê:\n1. Explique cada tópico de olhos fechados, sem consultar nada.\n2. Resolva questões antigas/provas passadas sem olhar material — errar aqui é treinar, não fracassar.\n3. Flashcards (papel ou app) para o que é decoreba pura: fórmulas, datas, definições.\n- D-1: revisão leve do que VOCÊ errou nas questões + simulação cronometrada. Dormir 7-8 horas é o último item de estudo, não opcional.\n\n## Na prova\nResolva primeiro as fáceis (ganha pontos e confiança), marque as difíceis e volte. Distribua o tempo pelo valor da questão, não pela ordem.\n\n## A regra de ouro\nQuem estuda 1h30 por dia nos 7 dias aprende mais que quem estuda 10h na véspera — retenção exige dormir ENTRE as sessões: é no sono que a memória consolida. Virar a noite é apagar o próprio trabalho.',
            quiz: [
              {
                prompt: 'Qual atividade tem maior retorno comprovado de aprendizado na preparação de prova?',
                options: [
                  'Reler o slide 4 vezes com marca-texto colorido',
                  'Recuperação ativa: explicar o conteúdo de olhos fechados e resolver questões sem consultar',
                  'Copiar o resumo à mão várias vezes',
                  'Estudar 10 horas seguidas na véspera',
                ],
                correctIndex: 1,
                explanation:
                  'Reler e copiar dão sensação de aprendizado (fluência ilusória) sem retenção. Recuperação ativa — explicar sem olhar e testar-se — é a técnica com maior evidência na pesquisa sobre estudo.',
              },
            ],
          },
        ],
      },
    ],
  },
]

// Recape: cursos com poucas aulas ganham reforço (5 cursos, 12 novas aulas)
export const topupLessons: { courseTitle: string; lessons: LessonDef[] }[] = [
  {
    courseTitle: 'Testes e Qualidade de Código',
    lessons: [
      {
        title: 'TDD na prática: red, green, refactor',
        description: 'O ciclo que transforma teste em ferramenta de design — não em obrigação depois do código pronto.',
        durationMin: 18,
        content:
          'TDD inverte a ordem: o teste vem ANTES do código. O ciclo tem três batidas — e a disciplina delas é o que gera o benefício.\n\n## Red: escreva o teste que falha\nEscreva o MENOR teste possível para o comportamento que ainda não existe. Ele falha (vermelho) — e a falha confirma que o teste está testando algo. test("desconto de 10% acima de 100") antes de calcularDesconto existir.\n\n## Green: faça passar do jeito mais simples\nEscreva o mínimo que faz o teste passar — mesmo que pareça "gambiarra honesta" (return 180 se o teste exige 180). O objetivo agora não é elegância: é verde em 30 segundos.\n\n## Refactor: melhore com rede de proteção\nCom verde, melhore: elimine duplicação, nomeie melhor, extraia função. Os testes garantem que a melhoria não quebrou comportamento. Refatorar sem testes é cirurgia sem anestesia.\n\n## O efeito colateral de design\nO verdadeiro presente do TDD: código que é difícil de testar é código mal projetado (funções gigantes, dependências escondidas). Testar primeiro FORÇA funções pequenas, injeção de dependências e interfaces claras.\n\n## Quando não usar\nCódigo exploratório de descoberta (spike), protótipos descartáveis e camada visual pura. TDD brilha em regra de negócio e lógica — onde os bugs moram.',
        quiz: [
          {
            prompt: 'No ciclo TDD, o que significa a etapa "refactor" e qual é a condição para fazê-la?',
            options: [
              'Reescrever o teste para ficar mais difícil — a qualquer momento',
              'Melhorar o código sem mudar comportamento, com os testes verdes como proteção',
              'Apagar o código e começar de novo — só antes do primeiro teste',
              'Adicionar mais funcionalidades enquanto os testes falham',
            ],
            correctIndex: 1,
            explanation:
              'Refactor melhora a ESTRUTURA mantendo o COMPORTAMENTO — e só é seguro com a suíte verde. Com testes falhando, o impacto de cada mudança fica invisível.',
          },
        ],
      },
      {
        title: 'Testes de integração e mocks',
        description: 'Testando se as peças conversam de verdade — e mockando só as fronteiras certas.',
        durationMin: 20,
        content:
          'Teste unitário verifica a peça isolada; o de integração verifica se as peças CONVERSAM — rota + serviço + banco + validação. É onde moram os bugs que o unitário não pega (serialização, SQL errado, transação faltando).\n\n## O teste de integração mínimo (API + banco)\nPadrão em Node/TypeScript:\n1. Suba o ambiente de teste (banco em memória como SQLite, ou container efêmero com Docker).\n2. Rode as migrações/seed.\n3. Chame a rota real (supertest): await request(app).post("/pedidos").send({ ... }).\n4. Afirme DUAS camadas: a resposta HTTP (status 201, corpo) e o EFEITO no banco (registro criado com o campo certo).\n5. Limpe entre testes (truncate) — teste que depende do anterior é bomba-relógio.\n\n## Mocks: onde (e onde não) usar\n- MOCKE fronteiras externas: gateway de pagamento, envio de e-mail, API de terceiro, relógio. Motivos: custo, lentidão, não-determinismo.\n- NÃO mocke o que está testando: mockar o repositório no teste de integração do fluxo completo mata o propósito — aí o teste virou unitário fantasiado.\n- Prefira stubs simples (mockResolvedValue) a mocks sofisticados que verificam chamadas internas: eles acoplam o teste à implementação e quebram a cada refatoração.\n\n## A proporção saudável\nMuitos unitários (milissegundos), dezenas de integração (minutos), pouquíssimos E2E. Suíte que passa em menos de 5 minutos é suíte que roda de verdade.',
      },
      {
        title: 'Cobertura de código honesta',
        description: 'O que o percentual diz, o que ele esconde e como usar a métrica sem virar refém dela.',
        durationMin: 15,
        content:
          'Cobertura mede quais linhas seus testes EXECUTARAM — não quais comportamentos eles VERIFICARAM. A diferença é a armadilha clássica.\n\n## O teste que mente\nawait criarPedido(dados) sem nenhum expect roda 100% das linhas e verifica 0%. Cobertura alta com afirmação nula é teatro — pior que cobertura baixa, porque dá falsa segurança. Regra: linha executada sem assert não conta como teste.\n\n## Números honestos\n- 100% de cobertura é mito caro: código de configuração, tipos e glue code inflam o número sem proteger nada.\n- 60-80% na lógica de negócio é faixa saudável para a maioria dos produtos reais.\n- O que importa mais que o total: a cobertura dos ARQUIVOS CRÍTICOS. 70% geral com 95% no módulo de pagamento vale mais que 90% uniforme com pagamento em 70%.\n\n## Usando a métrica a favor\n1. Cobertura como tendência, não como meta: caiu no último mês? Alguém parou de testar. Investigue.\n2. Diff coverage em code review: código novo precisa de teste (ferramentas mostram a % do que o PR adicionou).\n3. Bug em produção = teste que reproduz o bug antes do fix: cada incidente deixa cobertura REAL (de comportamento) para trás.\n\n## O antídoto\nPergunte no review: "se essa função quebrar, qual teste grita?" Se a resposta é "nenhum", o percentual não importa — o módulo está desprotegido.',
        quiz: [
          {
            prompt: 'Por que 100% de cobertura de código não garante qualidade dos testes?',
            options: [
              'Porque a ferramenta de cobertura sempre erra 5%',
              'Porque cobertura mede linhas EXECUTADAS, não comportamentos VERIFICADOS — um teste sem asserts alcança 100% sem testar nada',
              'Porque 100% só é possível em TypeScript',
              'Porque cobertura não conta arquivos de teste',
            ],
            correctIndex: 1,
            explanation:
              'Cobertura é métrica de execução, não de verificação. O antídoto é exigir asserts significativos e olhar a cobertura dos módulos críticos, não o número global.',
          },
        ],
      },
    ],
  },
  {
    courseTitle: 'Design Systems do Zero ao Ship',
    lessons: [
      {
        title: 'Design tokens: cor, espaçamento e tipografia',
        description: 'A linguagem compartilhada entre Figma e código: variáveis que garantem consistência em escala.',
        durationMin: 16,
        content:
          'Design tokens são as decisões atômicas do produto — nomeadas uma vez e usadas em todos os lugares. Eles são o contrato entre o Figma e o código.\n\n## Os 3 conjuntos fundamentais\n1. COR: uma escala com papéis, não cores soltas. Primitivo (blue-500: #3B82F6) → semântico (bg-primary, text-danger, surface-disabled). O componente NUNCA usa hex: usa papel. Trocou a marca? Trocou o token, não 400 arquivos.\n2. ESPAÇAMENTO: escala de 4 (4, 8, 12, 16, 24, 32, 48...). Espaço entre título e texto é space-2 (8px), padding do card é space-4 (16px) — nunca "13px porque ficou bonito hoje".\n3. TIPOGRAFIA: escala fechada (display 48, h1 32, h2 24, body 16, caption 13) com peso e line-height definidos por estilo, não por gosto.\n\n## Do Figma ao código\nNo Figma: Variables/Styles com os MESMOS nomes. No código: CSS variables ou Tailwind config (--color-primary, --space-4). Ferramentas como Style Dictionary exportam os tokens para web, iOS e Android a partir de uma única fonte.\n\n## O teste do token\nAbra um componente: toda cor, espaço e tamanho referenciam um token? Se tem um "margin: 14px" solto, o sistema começou a apodrecer — corrija no PR seguinte, ou em 6 meses você tem 27 tons de cinza.',
        quiz: [
          {
            prompt: 'Por que componentes devem usar tokens semânticos (ex.: bg-primary) em vez de cores cruas (ex.: #3B82F6)?',
            options: [
              'Porque hex quebra o build do React',
              'Porque o papel semântico desacopla o componente da cor: redefinir o token atualiza tudo, inclusive temas',
              'Porque hex não funciona em CSS moderno',
              'Porque tokens são só para documentação',
            ],
            correctIndex: 1,
            explanation:
              'Token semântico é camada de abstração: o componente pede um PAPEL (primário, perigo, desabilitado) e o tema resolve o valor — troca de marca, dark mode e acessibilidade viram ajuste de token, não rework de componente.',
          },
        ],
      },
      {
        title: 'Componentes acessíveis: ARIA básico na prática',
        description: 'HTML semântico, teclado e ARIA só onde necessário: o tripé do componente utilizável por todos.',
        durationMin: 18,
        content:
          'Acessibilidade não é feature extra: é parte da definição de "componente pronto". E 80% dela vem de três hábitos.\n\n## Hábito 1: HTML semântico primeiro\nA primeira regra do ARIA é NÃO usar ARIA. O <button> nativo já dá foco, Enter, Espaço e leitor de tela de graça. Um <div onClick> exige recriar tudo isso manualmente — e ninguém recria. Antes de adicionar role, pergunte: existe tag nativa para isso?\n\n## Hábito 2: tudo funciona por teclado\nNavegue seu componente SÓ com Tab, Shift+Tab, Enter, Espaço e setas:\n- Todo interativo é alcançável (nada de elemento focável invisível).\n- Ordem de foco segue a ordem visual.\n- Modal: o foco entra no modal, não escapa para o fundo (focus trap), e Esc fecha.\n- O anel de foco (:focus-visible) NUNCA é removido — "outline: none" sem substituto é o erro mais comum (e mais barato de corrigir).\n\n## Hábito 3: ARIA só para o que o HTML não cobre\n- aria-label em botões de ícone: <button aria-label="Fechar">×</button>.\n- aria-expanded no gatilho de menu/accordion.\n- aria-live="polite" em mensagens que aparecem (toast, contador de resultados).\n- Alt em imagem de conteúdo; alt="" em imagem decorativa.\n\n## No design system\nAcessibilidade vira critério de aceite do componente: "abre por teclado? foco visível? leitor de tela anuncia o estado?" — checklist no PR, não auditoria no fim do projeto.',
        quiz: [
          {
            prompt: 'Qual é a "primeira regra do ARIA"?',
            options: [
              'Sempre adicionar role="button" em todos os elementos clicáveis',
              'Não usar ARIA quando existe um elemento HTML nativo que já faz o papel',
              'Usar aria-label em todas as imagens',
              'Remover o outline de foco para deixar o design limpo',
            ],
            correctIndex: 1,
            explanation:
              'Elementos nativos (button, input, select) já trazem semântica, foco e teclado de graça. ARIA duplica o que o HTML dá — e mal implementado atrapalha em vez de ajudar. Outline de foco nunca deve ser removido sem substituto.',
          },
        ],
      },
      {
        title: 'Documentação viva do sistema',
        description: 'A página que faz o design system ser usado (ou ignorado): casos, estados, do/don\'t e versionamento.',
        durationMin: 15,
        content:
          'Design system sem documentação é biblioteca sem catálogo: existe, mas ninguém acha nada — e todo mundo reinventa. A boa notícia: documentação viva é mais barata do que parece.\n\n## A regra: docs junto do componente\nPágina de documentação criada NO MESMO PR do componente (Storybook, Zeroheight ou MDX no repositório). Documentação posterior ao launch nunca chega — o "depois" vira nunca.\n\n## O que cada página precisa (o mínimo viável)\n1. Quando USAR: 2-3 frases ("use Button para ações primárias; use Link para navegação").\n2. Todos os ESTADOS renderizados: default, hover, focus, disabled, loading, erro. Estado que não aparece na doc não existe — e alguém vai improvisar.\n3. Props/tokens com exemplo copiável: código que o dev cola e funciona.\n4. Do & Don\'t: 1 de cada já resolve 80% do uso errado ("Don\'t: Button como link externo").\n\n## Viva, não morta\n- Docs geradas do código (props extraídas automaticamente) envelhecem menos que texto manual.\n- CHANGELOG com breaking changes: quem usa precisa saber que Button v2 trocou "variant" por "intent".\n- Canal de feedback visível no rodapé da doc ("algo faltou? abra issue") — sistema que não ouve o time vira sistema ignorado.\n\n## O teste da quinta-feira\nUma pessoa nova monta uma tela comum usando só a documentação, sem perguntar nada. Conseguiu em 1 hora? Sua documentação está viva. Não conseguiu? A lacuna que ela encontrou é sua próxima tarefa.',
      },
    ],
  },
  {
    courseTitle: 'Growth: Aquisição Previsível',
    lessons: [
      {
        title: 'O funil de aquisição e as métricas que importam: CAC e LTV',
        description: 'As 4 etapas do funil, os vazamentos invisíveis e a conta LTV/CAC que decide se você escala ou sangra.',
        durationMin: 16,
        content:
          'Growth previsível começa com um funil visível: você não pode otimizar o que não mede. E duas contas — CAC e LTV — dizem se o negócio escala ou sangra.\n\n## O funil em 4 etapas\n1. ALCANCE: quantos te conhecem (visitas, alcance, impressões).\n2. ATIVAÇÃO: quantos fazem a primeira ação de valor (cadastro, orçamento, teste do produto).\n3. CONVERSÃO: quantos compram.\n4. RETENÇÃO: quantos voltam/compram de novo.\n\nMeça a TAXA entre etapas, não só os totais: 10.000 visitas e 50 cadastros (0,5%) é problema de ativação, não de alcance — mais tráfego só multiplica o vazamento.\n\n## As duas contas do orçamento\n- CAC (custo de aquisição): quanto custa 1 cliente. R$1.000 de anúncios + R$500 de ferramentas + R$500 de agência em um mês que trouxe 40 clientes = CAC de R$50.\n- LTV (valor do ciclo de vida): quanto 1 cliente deixa ao longo do relacionamento. Ticket de R$100 x 8 compras = LTV de R$800.\n\n## A régua de sanidade\nLTV ≥ 3x CAC é o ponto de partida saudável (recupera o custo, paga operação, sobra margem). LTV menor? Ou baixe o CAC (canal mais barato, conversão melhor) ou aumente o LTV (recorrência, upsell, retenção). Escalar anúncio com LTV < 3x CAC não é growth — é incêndio de orçamento.\n\n## Exercício\nCalcule SEU CAC e LTV do último trimestre (mesmo com planilha simples). Não tem os dados? Essa é a primeira métrica a instrumentar — a próxima aula mostra como transformar isso em experimentos.',
        quiz: [
          {
            prompt: 'Um negócio tem CAC de R$200 e LTV de R$250. Qual o diagnóstico correto?',
            options: [
              'Ótimo — pode dobrar o orçamento de anúncios hoje',
              'Atenção: LTV/CAC de 1,25 está abaixo do saudável (3x) — melhorar conversão, retenção ou canal antes de escalar',
              'LTV e CAC não têm relação entre si',
              'O problema está necessariamente no produto',
            ],
            correctIndex: 1,
            explanation:
              'A régua mínima de saúde é LTV ≥ 3x CAC. Com 1,25, cada real investido em aquisição mal se paga — escalar o gasto amplia o prejuízo. Primeiro: melhorar conversão, retenção ou trocar de canal.',
          },
        ],
      },
      {
        title: 'Experimentos semanais de growth: hipótese → teste → decisão',
        description: 'O ciclo que transforma ideias em resultado: score ICE, teste pequeno e decisão com prazo marcado.',
        durationMin: 16,
        content:
          'Growth não vem de uma ideia genial — vem de muitas ideias médias testadas com disciplina. O time que roda 3 experimentos por semana aprende 150 vezes por ano; o que roda 3 por trimestre aprende 12.\n\n## O ciclo em 4 passos\n1. HIPÓTESE (formato fixo): "acreditamos que [mudança X] vai causar [efeito Y] em [métrica M], porque [insight Z]". Vaga demais para escrever = vaga demais para testar.\n2. PRIORIZE (score ICE): Impacto (1-10: o quanto mexe na métrica) x Confiança (1-10: evidência de que funciona) x Facilidade (1-10: quão rápido de testar). Rode os 2-3 maiores scores da semana, não os mais emocionantes.\n3. TESTE PEQUENO: mudança mínima, prazo curto, UMA métrica. Trocar o título da página de preços por 2 semanas vale mais que "refazer o site" por 6 meses.\n4. DECIDA com prazo marcado: no dia D, olha o número e escolhe — escala (dobrar a aposta), itera (ajusta e testa de novo) ou mata (documenta o aprendizado e segue). Experimento sem decisão agendada vira debate eterno.\n\n## O caderno de experimentos\nPlanilha simples: data, hipótese, ICE, resultado, decisão. Em 3 meses você tem o ativo mais valioso do growth: a lista do que FUNCIONA no SEU negócio — que ninguém copia de blog nenhum.\n\n## A regra de ouro\nTaxa de acerto de experimento saudável é 20-30%. Errar 70% das vezes não é desperdício — é o custo da descoberta; desperdício é não testar nada e apostar tudo numa campanha de feeling.',
      },
    ],
  },
  {
    courseTitle: 'Inglês para Entrevistas Internacionais',
    lessons: [
      {
        title: 'STAR in English: telling your stories with impact',
        description: 'A estrutura STAR aplicada ao inglês falado: verbos de ação, números e as frases-guia de cada etapa.',
        durationMin: 16,
        content:
          'Perguntas comportamentais ("Tell me about a time when...") decidem entrevistas — e a resposta forte tem estrutura: STAR. Em inglês, a estrutura também protege sua gramática: frases curtas, verbos de ação, passado simples.\n\n## A estrutura STAR\n- Situation (1-2 frases): "In 2023, I was the only developer on a small e-commerce team."\n- Task (1 frase): "Our checkout was failing for 20% of customers during peak hours."\n- Action (3-4 frases — o coração): "I analyzed the logs, identified a database bottleneck, and proposed a caching layer. I presented the plan with estimated costs and got approval within a week."\n- Result (1-2 frases, COM números): "Checkout failures dropped from 20% to 2%, and we recovered about $15,000 in monthly sales."\n\n## A linguagem que vende\n- Verbos de ação no passado simples: "I led...", "I redesigned...", "I negotiated..." — nunca "I was involved in..." (passivo soa fraco).\n- Números em tudo: "reduced by 40%", "saved 10 hours a week", "served 5,000 users".\n- Frases para ganhar tempo: "That\'s a great question — let me give you a concrete example..."\n\n## Prepare 5 histórias, não 40 respostas\nQuase toda pergunta comportamental encaixa em uma de 5 histórias: um conflito, uma falha, uma liderança, um prazo apertado, uma curva de aprendizado. Escreva cada uma em inglês (meia página), ensaie EM VOZ ALTA 3 vezes e grave o áudio. Ensaio no papel não treina a boca — a fala só melhora falando.\n\nNão decore palavra por palavra: decore o esqueleto (números + verbos) e deixe as frases respirarem.',
        quiz: [
          {
            prompt: 'In a STAR answer, what makes the "Result" part strong?',
            options: [
              'Using advanced vocabulary and long sentences',
              'Ending with a quantified outcome — numbers, percentages, time saved',
              'Talking more about the team than about yourself',
              'Explaining the situation in great detail',
            ],
            correctIndex: 1,
            explanation:
              'The Result closes the story with measurable impact ("dropped from 20% to 2%"). Numbers are the most memorable part — and they survive accents, nerves and translation.',
          },
        ],
      },
      {
        title: 'Mock interview: perguntas e frases prontas',
        description: 'As 5 perguntas certas, as frases de cortesia e gancho para não travar — e o protocolo de treino gravado.',
        durationMin: 18,
        content:
          'A mock interview (entrevista simulada) é o treino que separa quem conhece inglês de quem CONVERSA em inglês sob pressão. O método: as perguntas certas + as frases-guia + repetição em voz alta.\n\n## The top questions (prepare sua resposta de 60 segundos para cada)\n1. "Tell me about yourself." (presente → passado → futuro: "I\'m a developer focused on... Before that, I... Now I\'m looking to...")\n2. "Why do you want to work here?" (cite 1 fato real da empresa)\n3. "What\'s your greatest strength/weakness?" (fraqueza honesta + o que você faz sobre ela)\n4. "Tell me about a conflict with a coworker." (seu STAR pronto)\n5. "Where do you see yourself in five years?" (ambição plausível, não poesia)\n\n## Phrases that save you in real time\n- Ganhar tempo: "That\'s a great question. Let me think for a second..."\n- Pedir para repetir (100% permitido): "Could you repeat that, please?" / "Just to make sure I understood — you\'d like to know about..."\n- Quando não sabe: "I haven\'t worked with that tool yet, but I\'m a fast learner — for example, ..."\n- Fechar forte: "I\'m really excited about this opportunity. Is there anything about my background you\'d like me to expand on?"\n\n## O protocolo do mock\n1. Escolha 5 perguntas e escreva o esqueleto (não o texto decorado).\n2. Grave respostas de 60 segundos no celular. Escute: onde você trava? Ali está seu treino.\n3. Faça 2 mocks com alguém (professor, amigo, IA por voz) — cronometrados.\n4. Repita a gravação até a terceira rodada fluir. Três rodadas batem dez horas de estudo passivo.\n\nFrases prontas não são muleta: são o andaime que segura a conversa enquanto seu inglês de verdade aparece.',
      },
    ],
  },
  {
    courseTitle: 'LinkedIn e Currículo que Convertem',
    lessons: [
      {
        title: 'O algoritmo do LinkedIn: como funciona o alcance',
        description: 'Sinais, janela crítica e o que a prática mostra que funciona (e o que virou truque velho).',
        durationMin: 15,
        content:
          'Entender o algoritmo do LinkedIn muda o jogo: você para de postar no vácuo e passa a publicar com intenção. O funcionamento muda com frequência, mas os princípios observados se mantêm estáveis.\n\n## Como o feed decide\nQuando você publica, o post é mostrado para uma pequena amostra (suas conexões mais próximas e interativas). Nas primeiras 60-90 minutos, o algoritmo mede o ENGAJAMENTO inicial — comentários pesam mais que curtidas; salvamentos e compartilhamentos pesam mais que curtidas. Boa resposta inicial → alcance expandido para conexões de 2º grau e além.\n\n## O que isso implica na prática\n- A janela crítica é o primeiro intervalo: responda TODOS os comentários nos primeiros 60 minutos — cada resposta sua gera notificação e reengajamento.\n- Consistência vence explosão: 2-3 posts por semana batem 1 por dia seguido de sumiço de 3 semanas. O algoritmo (e a audiência) premia presença regular.\n- Comentário de valor nos posts de gente grande da sua área também constrói alcance: é a "visibilidade emprestada" — funciona antes de você ter audiência própria.\n\n## O que não funciona mais\nMassa de hashtags genéricas (3-5 específicas bastam, e o peso caiu), marcar quem não tem relação com o conteúdo (o algoritmo lê engajamento forçado) e link externo no corpo do post (coloque no primeiro comentário — post com link cru tende a ter alcance menor).\n\n## A régua honesta\nNão persiga o algoritmo: ele premia o que é bom para o usuário — conteúdo específico, útil ou com história real. Post que gera conversa de verdade é o que o sistema sempre empurra para cima.',
        quiz: [
          {
            prompt: 'Qual ação tem maior impacto no alcance inicial de um post no LinkedIn?',
            options: [
              'Usar 15 hashtags populares no final',
              'Comentários genuínos na primeira hora — e o autor respondendo a todos',
              'Publicar 5 posts no mesmo dia',
              'Marcar 20 conexões aleatórias na publicação',
            ],
            correctIndex: 1,
            explanation:
              'O engajamento inicial (especialmente comentários, com o autor mantendo a conversa) é o sinal que decide se o post expande para além das suas conexões próximas. Hashtags em massa e marcações forçadas não geram conversa real.',
          },
        ],
      },
      {
        title: 'Conteúdo de autoridade: posts que geram oportunidades',
        description: 'Os 4 formatos que recrutadores e clientes respondem, a anatomia do post e a rotina sustentável de 90 dias.',
        durationMin: 16,
        content:
          'Autoridade no LinkedIn não vem de bio bonita: vem de posts que mostram como você pensa e trabalha. E a boa notícia: os formatos que geram oportunidade são poucos e repetíveis.\n\n## Os 4 formatos que geram oportunidade\n1. LIÇÃO DE TRABALHO REAL: "um erro que cometi ao liderar meu primeiro projeto — e o que mudou depois". História + lição. É o formato que mais gera conexão porque prova experiência vivida.\n2. TUTORIAL/MICRO-CASO: "como estruturamos o onboarding em 3 passos e reduzimos churn em 25%". Antes/depois com número — recrutador de produto ama, cliente em potencial copia.\n3. OPINIÃO COM ARGUMENTO: "por que eu não contrataria por stack técnica isolada". Toma posição, justifica com experiência e abre espaço para discordância — discordância gera comentário, comentário gera alcance.\n4. BASTIDOR/PROCESSO: como você faz o que faz (checklist, template, print da planilha). Conteúdo prático é SALVO — e salvamento é um dos sinais mais fortes para o algoritmo.\n\n## Anatomia do post que conversa\n- A primeira linha é o gancho (é ela que aparece antes do "ver mais"): dado, afirmação provocante ou pergunta.\n- Parágrafos de 1-3 linhas (mobile é o feed principal).\n- Uma ideia por post — o que sobrou vira o próximo post.\n- Fechamento com pergunta genuína ("como vocês fazem isso no time de vocês?") — CTA de conversa, não de vaidade.\n\n## A rotina sustentável\n1 post por semana por 6 meses vence 5 posts por semana por 1 mês. Guarde ideias numa nota durante a semana ("isso viraria post"), escreva em 30 minutos no domingo, poste e responda comentários na primeira hora. Em 90 dias o feed começa a trabalhar por você — o recrutador pesquisa seu nome antes de toda entrevista, e o que ele encontra passa a ser o seu melhor currículo.',
      },
    ],
  },
]

// Biblioteca: guia do TCC (livro) + 4 artigos acadêmicos
export const tccBooks: BookDef4[] = [
  {
    mentorEmail: 'camila@demo.com',
    title: 'Guia Prático do TCC',
    description:
      'O caminho completo do TCC em um guia direto: como escolher e delimitar o tema, montar o projeto que aprova de primeira, criar rotina de escrita de 30 minutos por dia, resolver a ABNT sem dor e chegar à defesa com um script pronto. Feito para quem está travado — ou assustado.',
    category: 'Acadêmico',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/livro-guia-tcc.png',
    pdfSlug: 'livro-guia-tcc.pdf',
    subtitle: 'Um mapa passo a passo para escrever o trabalho de conclusão sem sofrimento',
    author: 'Camila Rocha',
    pages: [
      {
        heading: '1. Por que o TCC assusta (e por que não precisa)',
        body:
          'O TCC é a única entrega que quase todo mundo faz uma vez na vida — por isso tudo nele parece território desconhecido. O medo vem dos mitos; a realidade é mais mansa.\n\n## Mito 1: "preciso descobrir algo novo"\nNão. TCC de graduação mostra que você SABE FAZER pesquisa: escolher método, coletar dados, argumentar. Não precisa revolucionar a ciência — precisa executar um recorte pequeno com rigor.\n\n## Mito 2: "quem escreve bem escreve fácil"\nEscritor profissional também trava. A diferença: ele escreve mal primeiro e corrige depois. TCC não se escreve — se REESCREVE. E ninguém lê seu primeiro rascunho.\n\n## Mito 3: "só termina quem tem 4 horas livres por dia"\nA rotina de 30 minutos diários (capítulo 4) fecha capítulo. Quem espera o dia perfeito não termina nunca.\n\n## Mito 4: "a banca quer me derrubar"\nA banca quer aprovar um trabalho bem-feito com o mínimo de esforço. Defesa é roteiro preparável (capítulo 6), não emboscada.\n\n## A realidade\nTCC é um projeto com etapas conhecidas: tema, projeto, pesquisa, escrita, formatação, defesa. Cada etapa tem técnica. Quem aprende a técnica anda; quem espera inspiração fica parado.',
      },
      {
        heading: '2. Tema e delimitação em 1 semana',
        body:
          'Uma semana basta para sair do "não sei o tema" para um tema delimitado — se você seguir o exercício dia a dia.\n\n## Segunda e terça: a lista longa\nEscreva 10 temas candidatos, sem filtrar. Regras: despertar curiosidade mínima e ter algo a ver com seu curso. Gatilhos: disciplinas que você gostou, problemas do seu trabalho, perguntas que você já fez.\n\n## Quarta: o teste de viabilidade\nPara cada tema, responda: (1) existe literatura? (busque 10 min no Google Scholar); (2) consigo acessar os dados/pessoas necessários?; (3) aguento esse assunto por 1 ano? Sobrevivem 3-4 candidatos.\n\n## Quinta: o recorte\nPegue os finalistas e aplique a fórmula: assunto + público + lugar + período. "Redes sociais e marketing" vira "Instagram como canal de vendas de lojas de roupas de bairro em Fortaleza, 2023-2024".\n\n## Sexta: validação dupla\nMostre o título delimitado para: 1 colega (entende sem explicação?) e 1 professor possível orientador (é viável no prazo do curso?). Ajuste o que os dois apontarem.\n\n## Sábado: o compromisso\nEscreva a versão final do tema em UMA frase e guarde no lugar visível. Tema delimitado é metade do caminho — e você acabou de andá-la em uma semana, não em um semestre.',
      },
      {
        heading: '3. O projeto de pesquisa que aprova de primeira',
        body:
          'O projeto de pesquisa é seu TCC em miniatura — 8 a 15 páginas que convencem a universidade de que o trabalho é viável. Aprovar de primeira é questão de preencher os blocos certos.\n\n## Os 6 blocos do projeto\n1. TEMA E TÍTULO: a frase delimitada do capítulo 2.\n2. PROBLEMA: o vazio em uma frase ("não se sabe como X afeta Y em Z").\n3. HIPÓTESE ou proposição: sua aposta de resposta.\n4. JUSTIFICATIVA: por que importa — relevância prática + lacuna na literatura (nada de "pela importância do tema no mundo atual").\n5. OBJETIVOS: geral (espelha a pergunta) + 3-5 específicos mensuráveis (analisar, comparar, mapear).\n6. METODOLOGIA E CRONOGRAMA: abordagem, participantes, instrumento, análise — cada escolha com o porquê; cronograma com estimativas DOBRADAS.\n\n## Os 3 erros que reprova projeto\n- Tema largo demais ("a educação no Brasil").\n- Objetivo com verbo vago ("conhecer melhor", "compreender a fundo").\n- Cronograma de ficção ("mês 1: toda a teoria; mês 2: toda a prática").\n\n## Dica de submissão\nAntes de entregar, leia os objetivos em voz alta: cada um deve parecer um capítulo do futuro trabalho. Se não parece, o projeto ainda não fechou — e é 10x mais fácil fechar AGORA do que no capítulo 3.',
      },
      {
        heading: '4. Rotina de escrita: 30 minutos por dia bastam',
        body:
          'A matemática do TCC é simples: 30 minutos por dia x 5 dias = 2h30 semanais — em 6 meses, 65 horas, mais do que a maioria dos TCCs precisa. O segredo não é volume: é frequência.\n\n## A regra do próximo parágrafo\nNunca sente para "escrever o TCC". Sente para escrever O PRÓXIMO PARÁGRAFO definido na sessão anterior ("hoje: 2 parágrafos da amostra da metodologia"). Tarefa pequena e específica vence a resistência; tarefa gigante convoca a procrastinação.\n\n## O ritual de 30 minutos\n1. (2 min) Releia o parágrafo anterior — aquece o contexto.\n2. (24 min) Escreva SEM editar. Vale rascunho feio; não vale voltar para consertar vírgula.\n3. (4 min) Anote onde retomar amanhã + 1 frase do próximo trecho.\n\n## A regra do fim no meio\nPare no MEIO de um parágrafo fácil — amanhã você retoma em movimento, sem página em branco. Hemingway fazia isso com romance; funciona com monografia também.\n\n## O dia ruim\nTrinta minutos viraram 15? 15 viraram 10? Escreva UMA frase útil e marque presença. A régua é não faltar 2 dias seguidos: presença mantém o hábito vivo; volume vem depois.',
      },
      {
        heading: '5. ABNT essencial: só o que você realmente usa',
        body:
          'A ABNT parece monstro porque é apresentada inteira. Na prática, você usa 10 regras — configure uma vez e só mantenha.\n\n## A página\n- Margens: 3 cm (esquerda e topo), 2 cm (direita e fundo).\n- Fonte 12 (Arial ou Times), citações longas e notas em 10.\n- Espaçamento 1,5; citações longas e referências em espaço simples.\n- Baixe o MODELO OFICIAL da sua universidade no primeiro dia — as variações locais de capa e elementos pré-textuais são o que mais gera correção.\n\n## Citações (NBR 10520)\n- Indireta (paráfrase): (SILVA, 2021) no fim da ideia.\n- Direta até 3 linhas: entre aspas no texto, com (SILVA, 2021, p. 45).\n- Direta acima de 3 linhas: recuo de 4 cm, fonte 10, sem aspas, espaço simples.\n- Regra de bolso: 80% parafraseado (com citação!) e 20% direto.\n\n## Referências (NBR 6023)\nAlfabética, à esquerda, espaço simples. Os dois padrões que você mais usará:\n\nLivro: SOBRENOME, Nome. Título em negrito. Edição. Cidade: Editora, ano.\nArtigo: SOBRENOME, Nome. Título do artigo. Nome da Revista, v. X, n. X, p. XX-XX, ano.\n\n## O atalho legal\nUse o gerador de citações do Word/Google Docs ou o modelo da biblioteca. E formate DESDE A PRIMEIRA PÁGINA — formatar 90 páginas em dezembro é o desespero que este capítulo existe para impedir.',
      },
      {
        heading: '6. A defesa: script de 10 minutos + perguntas prováveis',
        body:
          'A defesa é o único momento em que TODO o seu trabalho é resumido em 10 minutos de fala. Por isso, o que decide não é o TCC inteiro — é o seu script.\n\n## O roteiro dos 10 minutos\n1. (1 min) Cumprimento + tema + por que ele importa.\n2. (2 min) Problema e pergunta de pesquisa.\n3. (2 min) Metodologia em 4 frases.\n4. (4 min) Os 3-4 principais achados — o coração.\n5. (1 min) Conclusão e limitações.\n\nEnsaiar em voz alta 3 vezes com cronômetro. Gravar e ouvir uma dessas vezes — seu ouvido corrige o que o espelho não mostra.\n\n## As 5 perguntas que sempre vêm\n1. "Por que esse tema e esse recorte?"\n2. "Por que essa metodologia e não outra?"\n3. "Sua amostra é representativa?" — resposta honesta: "não é generalizável; a contribuição é exploratória."\n4. "Qual a aplicação prática dos resultados?"\n5. "O que você faria diferente?"\n\nEscreva a resposta de 30 segundos para cada uma e leve o TCC impresso com post-its nas páginas-chave: responder com página aberta é impressionante.\n\n## E se eu não souber?\n"Não explorei esse ângulo; registro como limitação e sugestão de pesquisa futura." Resposta de pesquisador — a banca respeita maturidade muito mais que improviso.',
      },
    ],
  },
]

export const tccArticles: ArticleDef4[] = [
  {
    mentorEmail: 'camila@demo.com',
    title: 'TCC sem pânico: o mapa completo do começo ao fim',
    description:
      'A jornada completa do TCC em um só lugar: as 6 etapas em ordem, os prazos realistas de cada uma, os erros que travam 80% dos alunos e o checklist de acompanhamento — para você parar de temer e começar a executar.',
    category: 'Acadêmico',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/artigo-tcc-sem-panico.png',
    readingMin: 12,
    content:
      'Todo TCC travado que já vi tinha a mesma causa: não um problema de inteligência, mas de mapa. A pessoa não sabia qual era o próximo passo — então escolhia não dar nenhum. Este artigo é o mapa: as seis etapas, em ordem, com o que cada uma exige.\n\n## Etapa 1 — Tema e delimitação (2 semanas)\nEscolha um tema que você aguenta olhar por um ano (critérios: curiosidade real, literatura existente, acesso aos dados). Depois recorte: assunto + público + lugar + período. "Marketing digital" vira "WhatsApp Business no atendimento de pequenas padarias de Belo Horizonte, 2023-2024". Recorte é o que transforma projeto impossível em projeto concluído.\n\n## Etapa 2 — Projeto de pesquisa (1 mês)\nSeis blocos: tema/título, problema, hipótese, justificativa, objetivos e metodologia com cronograma. Os verbos dos objetivos são mensuráveis (analisar, comparar, mapear). O cronograma tem estimativas DOBRADAS — imprevisto no TCC não é risco, é certeza.\n\n## Etapa 3 — Levantamento bibliográfico (4-6 semanas, em paralelo)\nParta de 3-5 artigos centrais e use a bola de neve: as referências deles para trás, o "citado por" para frente. Use Google Scholar, SciELO e o Portal CAPES da sua universidade. Fichamento desde o dia 1: tese do autor em suas palavras + citações com página + para qual capítulo serve. Meta saudável para graduação: 20-40 fontes.\n\n## Etapa 4 — Coleta de dados (2-3 meses)\nAplique o instrumento definido no projeto (questionário, entrevistas, observação). Consentimento por escrito sempre. Transcreva e organize na mesma semana da coleta — dado coletado e não organizado é dado que some.\n\n## Etapa 5 — Escrita (3-4 meses, sem esperar "acabar a pesquisa")\nA rotina que fecha capítulo: 30 minutos por dia, uma tarefa específica por sessão ("2 parágrafos da metodologia"), escrevendo sem editar e corrigindo em bloco separado. Comece pelo capítulo mais fácil, não pelo capítulo 1 — introdução e conclusão se reescrevem no fim, quando você sabe o que o trabalho virou.\n\n## Etapa 6 — Formatação e defesa (1 mês)\nABNT essencial configurada desde a primeira página (modelo oficial da universidade + citações com página anotadas no fichamento). Slides: 10-12, uma ideia por slide. Script de defesa de 10 minutos ensaiado 3 vezes em voz alta, com as 5 perguntas prováveis respondidas por escrito: por que o tema, por que o método, representatividade da amostra, aplicação prática e o que faria diferente.\n\n## O checklist de acompanhamento\n- [ ] Tema delimitado em uma frase (público, lugar, período)\n- [ ] Projeto aprovado\n- [ ] Fichamento com 20+ fontes (citações com página)\n- [ ] Coleta concluída e dados organizados\n- [ ] Capítulos com rascunho completo\n- [ ] Formatação ABNT conferida com o modelo da instituição\n- [ ] Script de defesa ensaiado 3x com cronômetro\n\n## Os 3 erros que mais travam\n1. Esperar o momento perfeito para começar a escrever (não existe — comece feio).\n2. Tema largo demais, que transforma qualquer semestre em insuficiente.\n3. Cronograma otimista, que desmonta no primeiro imprevisto e derruba a motivação junto.\n\nO TCC não recompensa inteligência — recompensa método. Seis etapas, uma por vez, com prazo realista: é assim que ele termina. E se quiser ajuda para aplicar o mapa ao SEU momento (tema travado, projeto recusado, capítulo parado), é exatamente o que fazemos nas mentorias — traga seu material e a gente desbloqueia juntos.',
  },
  {
    mentorEmail: 'camila@demo.com',
    title: 'ABNT na prática: formate sem dor de cabeça',
    description:
      'O manual de bolso da ABNT: as regras que você realmente usa (margens, fonte, espaçamento, citações diretas e indiretas), exemplos prontos para copiar e o sistema para nunca mais formatar em cima da entrega.',
    category: 'Acadêmico',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/artigo-abnt.png',
    readingMin: 9,
    content:
      'A ABNT assusta porque é apresentada como norma inteira. Na prática, um TCC de graduação usa um conjunto pequeno de regras — e elas cabem neste artigo. Configure uma vez, siga os exemplos e formate desde a primeira página (nunca em cima da entrega).\n\n## A página (NBR 14724)\n- Papel A4; margens 3 cm (esquerda e superior), 2 cm (direita e inferior).\n- Fonte 12 para o texto (Arial ou Times New Roman, conforme o modelo da sua instituição).\n- Tamanho menor (10) para: citações longas, notas de rodapé, legendas e paginação.\n- Espaçamento 1,5 entre linhas no corpo do texto; simples em citações longas, notas e referências.\n- Parágrafo: recuo de 1,25 cm na primeira linha.\n- Baixe o MODELO OFICIAL da sua universidade — as variações locais (capa, folha de rosto, elementos pré-textuais) são o que mais gera correção.\n\n## Citações diretas (NBR 10520)\nAté 3 linhas: fica no corpo do texto, entre aspas, com autor, ano e página.\n\nSegundo Silva (2021, p. 45), "o atendimento rápido é o principal fator de fidelização no varejo local".\n\nMais de 3 linhas: recuo de 4 cm, fonte 10, espaçamento simples, SEM aspas.\n\nO autor conclui que o canal de mensagens instantâneas alterou a expectativa de resposta do consumidor, que passou a avaliar o tempo de devolutiva como critério de qualidade do serviço (SILVA, 2021, p. 47).\n\n## Citações indiretas (paráfrase) — as que você mais usará\nSem aspas, com autor e ano. A boa paráfrase reescreve a ideia com a sua estrutura (não troca duas palavras e mantém a frase).\n\nOriginal: "A fidelização no varejo local depende principalmente da velocidade do atendimento."\nParáfrase correta: Para Silva (2021), no comércio de bairro, responder rápido é o que traz o cliente de volta.\nParáfrase errada (plágio disfarçado): Silva (2021) diz que a fidelização no varejo local depende principalmente da velocidade do atendimento.\n\n## Referências (NBR 6023)\nLista em ordem alfabética, alinhada à esquerda, espaçamento simples entre uma e outra. Os dois modelos que você mais usará:\n\nLivro: SILVA, João. Atendimento e fidelização no varejo. 3. ed. São Paulo: Atlas, 2021.\n\nArtigo: SILVA, João. Canais digitais no comércio de bairro. Revista de Administração Contemporânea, Rio de Janeiro, v. 25, n. 2, p. 120-135, 2021.\n\n## O sistema anti-sofrimento\n1. Use o estilo ABNT do Word/Google Docs ou o modelo da biblioteca desde o dia 1 — formatação aplicada junto com a escrita custa minutos; aplicada no fim, custa semanas.\n2. Toda citação que você anotar no fichamento já vem COM página — metade do desespero de formatação é caçar páginas em dezembro.\n3. Use um gerador de referências confiável e CONFERE cada item gerado: geradores erram campos (especialmente capítulo de livro e artigo com DOI).\n\nFormatar é habilidade mecânica, não artística: dez regras, aplicadas cedo. O tempo que você economiza aqui é o tempo que vai para o que a banca de fato avalia — o conteúdo.',
  },
  {
    mentorEmail: 'marina@demo.com',
    title: 'Citações e referências sem plágio',
    description:
      'O que é plágio de verdade (incluindo o acidental), como parafrasear sem cair na cópia disfarçada, quando usar autor-data ou sistema numérico e exemplos prontos na NBR 10520 — para citar com segurança e passar em qualquer verificação.',
    category: 'Acadêmico',
    level: 'INTERMEDIARIO',
    coverUrl: '/uploads/seed/artigo-citacoes.png',
    readingMin: 10,
    content:
      'Plágio raramente é má-fé: na maioria dos casos é preguiça de anotação — a ideia lida em algum lugar, guardada sem a fonte, reaparecida meses depois como se fosse sua. O antídoto não é paranoico: é um sistema. Aqui está ele.\n\n## O que é plágio (incluindo o acidental)\n- Copiar frase sem aspas e sem citação: plágio claro.\n- Trocar algumas palavras mantendo a estrutura da frase original sem citar: plágio disfarçado (os detectores pegam).\n- Usar ideia ou argumento de outro autor sem atribuir, MESMO com suas palavras: plágio de ideia — o mais comum entre estudantes.\n- Reaproveitar entrega anterior sua sem avisar (autoplagio) em contexto que exige ineditismo.\n\nNão é plágio: dado público (censo, estatística oficial), senso comum da área e suas próprias análises e conclusões.\n\n## Os dois sistemas de citação\n- Autor-data (o mais comum em ciências humanas e aplicadas, e o padrão ABNT): (SILVA, 2021) ou Silva (2021) — o texto flui com o nome do autor.\n- Numérico (comum em engenharias e saúde): chamada por número [3], ligada à lista de referências na ordem de aparição.\n\nRegra prática: siga a norma do periódico ou o manual da sua instituição — e use UM sistema no trabalho inteiro, nunca os dois misturados.\n\n## Exemplos na ABNT (NBR 10520)\n- Paráfrase: A fidelização no varejo local depende da velocidade do atendimento (SILVA, 2021).\n- Paráfrase com autor no início: Para Silva (2021), responder rápido é o que traz o cliente de volta.\n- Citação direta curta (até 3 linhas): Segundo Silva (2021, p. 45), "o atendimento rápido é o principal fator de fidelização".\n- Citação direta longa (mais de 3 linhas): recuo de 4 cm, fonte 10, sem aspas, com página ao final.\n- Citação de citação (use com parcimônia): (SILVA, 2021 apud COSTA, 2019) — só quando o original é inacessível.\n\n## Parafrasear sem cair na cópia (o método de 3 passos)\n1. Feche o original. Leia a ideia e feche o arquivo — escreva com o texto fechado.\n2. Reescreva com estrutura diferente: se o original generaliza antes de exemplificar, você exemplifica antes de generalizar.\n3. Confira sobrepondo mentalmente: se a frase tem a mesma "espinha" (mesma ordem de termos), reescreva de novo. Depois cite a fonte — paráfrase também leva (AUTOR, ano).\n\n## O sistema que evita o acidente\nFichamento com aspas explícitas ("texto original") separadas da sua anotação ("minha leitura"). O erro nasce quando as duas coisas se misturam no mesmo caderno. E adote uma biblioteca de citações (Zotero, Mendeley) desde o primeiro dia: a referência nasce pronta, e esquecer a fonte fica impossível.\n\nCitação não é formalidade: é o mecanismo que distingue seu pensamento do pensamento que você herdou — e mostra à banca exatamente qual dos dois é novo.',
  },
  {
    mentorEmail: 'camila@demo.com',
    title: 'Como escolher o tema do TCC em 7 perguntas',
    description:
      'Um método de perguntas — não de inspiração — para sair do "não sei o tema": as 7 perguntas que filtram candidatos, com exemplos reais de temas mal delimitados e bem delimitados para você comparar.',
    category: 'Acadêmico',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/artigo-tema-tcc.png',
    readingMin: 7,
    content:
      '"Não sei o tema" quase nunca é falta de ideia — é falta de filtro. Você não precisa de inspiração: precisa de um método que elimine os temas errados até sobrar o certo. Sete perguntas resolvem.\n\n## As 7 perguntas do filtro\n1. Eu tenho curiosidade REAL por isso? Não "é interessante" — é "eu leria sobre isso por escolha própria". Você vai conviver com o tema por 12 meses.\n2. Existe literatura? Busque 10 minutos no Google Scholar. Zero trabalhos relevantes não significa "lacuna brilhante" — significa terreno sem trilha, inviável para TCC de graduação.\n3. Consigo acessar os dados? Entrevistas com gestores, registros de empresa, usuários de um serviço: se você não tem como chegar, o tema morre no capítulo 3.\n4. O tema tem recorte natural? Dá para dividir por público, lugar ou período? Tema indivisível ("a economia brasileira") é tema impossível.\n5. Cabe no prazo e no formato do meu curso? Pesquisa quantitativa com 2 meses de coleta? Sem acesso a amostra grande, mude o desenho — ou o tema.\n6. Gera uma PERGUNTA respondível? Se você não consegue escrever a pergunta de pesquisa em uma frase, ainda é assunto, não tema.\n7. Empatou? Dois temas finalistas: escolha o que tem orientador potencial publicado no assunto — orientação especializada vale mais que preferência de 5%.\n\n## Mal delimitados vs bem delimitados\n- "As redes sociais na educação" → "O uso de grupos de WhatsApp como apoio à aprendizagem em turmas do 9º ano de duas escolas públicas de Recife, em 2024".\n- "Marketing digital em pequenas empresas" → "Instagram como canal de vendas de lojas de roupas de bairro em Fortaleza entre 2023 e 2024".\n- "Sustentabilidade" → "Práticas de logística reversa em farmácias de bairro: o caso do descarte de medicamentos em João Pessoa".\n\nRepare: os bem-delimitados respondem automaticamente as perguntas 3, 4 e 6 — público, lugar e período já apontam dados, recorte e pergunta.\n\n## O erro que sobra\nO tema "importante demais". Aluno escolhe grande para parecer sério e afunda em amplitude. Banca avalia profundidade, não amplitude: um estudo pequeno bem-executado supera um estudo grande raso — sempre.\n\n## Próximo passo\nEscreva 5 candidatos hoje, aplique as 7 perguntas em cada (uma folha por tema, respondida sem enrolação) e leve os 2 sobreviventes ao possível orientador. Em uma semana você sai da paralisia para o tema — e o semestre começa a trabalhar para você, não contra.',
  },
]
