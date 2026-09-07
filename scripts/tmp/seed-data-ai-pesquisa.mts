// Curso: Pesquisa Estruturada com IA — mentor Marina Duarte
// Curso 3 de 4 da Trilha IA para Estudantes. Conteúdo nível "produto para venda".
import type { CourseDef } from './seed-types'

export const pesquisaCourse: CourseDef = {
  mentorEmail: 'marina@demo.com',
  title: 'Pesquisa Estruturada com IA: do tema à defesa do TCC',
  description:
    'O TCC não trava por falta de inteligência — trava por falta de método. Neste curso a IA vira sua assistente de pesquisa: afinar o tema, caçar fontes de verdade no Google Scholar e no Portal CAPES, montar o referencial com fichamento organizado e escrever cada capítulo sem plagiar e sem entregar texto genérico. Tudo com integridade: caça às referências falsas, regras da sua universidade e declaração transparente de uso de IA. É o Curso 3 de 4 da Trilha IA para Estudantes — a etapa em que a ferramenta da moda vira método de pesquisa. Ao final, você sai com o fluxo completo testado no SEU tema: da pergunta de pesquisa ao ensaio de defesa simulado com banca de IA.',
  category: 'Tecnologia',
  level: 'INICIANTE',
  price: 109,
  coverUrl: '/uploads/seed/course-ia-pesquisa.png',
  themes: [
    {
      title: 'Módulo 1 · Pesquisar na era da IA',
      description:
        'A base de tudo: entender o que a IA pode e o que ela NÃO pode, escolher um tema viável, achar fontes de verdade e blindar o trabalho contra referências inventadas.',
      lessons: [
        {
          title: 'O que a IA pode — e o que ela NÃO pode — na sua pesquisa',
          description:
            'O contrato do curso inteiro em uma aula: IA como assistente de processamento, nunca como fonte de verdade — e o mapa completo do fluxo que você vai dominar.',
          durationMin: 14,
          content: `A IA generativa mudou o jogo da pesquisa — mas a maioria dos estudantes usa errado: pede trabalho pronto, recebe texto genérico com referências inventadas e queima a confiança do orientador. Esta aula estabelece o contrato que vale para as 14 aulas seguintes.

## IA é assistente de processamento, não fonte de verdade
Um modelo de linguagem prevê palavras — ele não consulta o mundo. Por isso:
- **Pode**: estruturar ideias, sugerir recortes, resumir textos que VOCÊ anexou, reformular parágrafos, gerar perguntas de estudo, criticar o seu rascunho.
- **Não pode**: garantir que um fato exista, que uma citação seja real, que uma amostra seja válida. Quando não sabe, ele responde com a mesma confiança — e é aí que nasce a referência fantasma.

## A regra de ouro
Todo fato citado no seu trabalho precisa de fonte verificável: artigo, livro, documento oficial, página ou dado que outra pessoa possa conferir. Se a IA afirmou algo e você não achou a fonte, o fato não entra. Simples assim — e é essa disciplina que separa quem usa IA de quem é usado por ela.

## O fluxo completo (o mapa do curso)
- **Tema**: IA ajuda a brainstormar e a testar escopo (aqui no Módulo 1).
- **Fontes**: IA resume PDFs baixados por você — nunca cria fontes.
- **Projeto**: problema, hipótese e metodologia afinados em diálogo.
- **Escrita**: IA rascunha seções, você decide e assina.
- **Análise**: IA tabula e sugere gráficos, você confere cada número.
- **Defesa**: IA simula a banca, você treina as respostas.

Perceba o padrão: em todas as etapas a IA acelera o processamento, e a decisão é sempre sua. Quem entende isso produz mais E aprende mais; quem delega tudo produz texto oco e descobre isso na banca, quando é tarde.

## Sua tarefa
Abra seu chat de IA e teste a regra de ouro: peça 3 "fatos" sobre seu campo de estudo, com fontes. Confira cada fonte citada, uma a uma. Anote o que aconteceu — essa experiência de 10 minutos vale mais que qualquer teoria.`,
          quiz: [
            {
              prompt: 'Qual é a regra de ouro do curso sobre fatos e IA?',
              options: ['Todo fato citado precisa de fonte verificável que você conferiu', 'Fatos gerados por IA não precisam de fonte se soarem verdadeiros', 'Basta pedir à IA que jure que a informação é verdadeira'],
              correctIndex: 0,
              explanation: 'A IA processa, você verifica: sem fonte conferida, o fato não entra no trabalho.',
            },
            {
              prompt: 'Quando a IA "não sabe" algo, o que ela tende a fazer?',
              options: ['Responder que não sabe, sempre', 'Responder com a mesma confiança, podendo inventar', 'Parar de responder e pedir outro prompt'],
              correctIndex: 1,
              explanation: 'Modelos de linguagem completam padrões — a resposta confiante não é garantia de verdade.',
            },
            {
              prompt: 'Qual é o papel correto da IA na etapa de análise de dados?',
              options: ['Decidir a conclusão do trabalho por você', 'Inventar dados que faltaram na coleta', 'Tabular e sugerir gráficos, com você conferindo cada número'],
              correctIndex: 2,
              explanation: 'Em todas as etapas o padrão é o mesmo: IA acelera o processamento, a decisão e a conferência são suas.',
            },
          ],
        },
        {
          title: 'Encontrando e afinando o tema com IA',
          description:
            'Brainstorm dirigido, teste de escopo e viabilidade na vida real: o método de diálogo que tira você do "não sei que tema escolher" em uma tarde.',
          durationMin: 13,
          content: `"Quero um tema" é o ponto mais travado de qualquer TCC. A IA é excelente parceira de brainstorm — desde que você conduza o diálogo em vez de aceitar a primeira sugestão.

## Brainstorm dirigido
Não peça "me dá um tema". Dê contexto: área do curso, disciplinas que você curtiu, contato profissional prévio, acesso a dados ou a pessoas. Prompt modelo: "Curso X, me interesso por Y e Z, já tive contato com W. Liste 10 temas de pesquisa possíveis, cada um com uma pergunta central e o tipo de fonte necessário."

## O teste de escopo
Todo tema fica entre dois defeitos:
- **Grande demais**: "A influência das redes sociais na sociedade" — impossível de responder em 40 páginas. Sintoma: a pergunta usa palavras genéricas (sociedade, educação, tecnologia) sem nenhum recorte.
- **Estreito demais**: "O uso de um app específico num único bairro, entre 14h e 16h" — sem fonte, sem relevância, sem interlocutor. Sintoma: nem o orientador conhece a discussão.

Peça à IA: "Esse tema está grande ou estreito para um TCC de graduação? Sugira 3 versões com recortes diferentes (população, período, contexto)." Recorte é o que transforma opinião em pesquisa.

## Viabilidade na vida real
Tema bonito sem dados é tema morto. Cheque: existem artigos suficientes sobre isso? Você consegue acesso aos respondentes (alunos, lojas, servidores) ou aos documentos? O prazo do seu calendário cabe no método escolhido? A IA ajuda a listar esses riscos, mas a checagem de acesso é sua — escreva para as pessoas, verifique o acervo da biblioteca, confira se o formulário vai chegar a alguém.

## Os 3 critérios para decidir
1. **Interesse real**: você vai conviver com esse tema por meses — antipatia vira abandono.
2. **Material disponível**: fontes acessíveis hoje, não "em teoria".
3. **Contribuição clara**: você consegue dizer em uma frase o que seu trabalho mostra que ainda estava pouco estudado no seu contexto.

## Sua tarefa
Rode o prompt de brainstorm com o seu contexto real, escolha 3 temas candidatos e peça o teste de escopo para cada um. Avalie os 3 pelos critérios e escolha o tema oficial — escreva-o em uma única frase.`,
          quiz: [
            {
              prompt: 'Qual sintoma indica um tema GRANDE demais?',
              options: ['Nenhum artigo existe sobre o assunto', 'A pergunta usa termos genéricos sem recorte, impossíveis de responder no espaço do trabalho', 'O orientador já conhece o tema'],
              correctIndex: 1,
              explanation: 'Tema grande demais padece de generalidade: falta recorte de população, período ou contexto.',
            },
            {
              prompt: 'O que é checagem de viabilidade do tema?',
              options: ['Verificar se o tema é bonito no título', 'Confirmar que existem fontes e acesso real a dados, pessoas ou documentos hoje', 'Pedir à IA que garanta que o tema é viável'],
              correctIndex: 1,
              explanation: 'Viabilidade é condição prática: sem acesso a material, o tema morre no meio do caminho.',
            },
          ],
        },
        {
          title: 'Fontes confiáveis: Google Scholar, SciELO e Portal CAPES',
          description:
            'Operadores de busca, filtros e o uso correto da IA no fim do processo: triagem de artigos em minutos, sem nunca inventar fonte.',
          durationMin: 16,
          content: `Boa pesquisa nasce de boa fonte. O trio Google Scholar, SciELO e Portal CAPES cobre praticamente tudo que um trabalho de graduação precisa — e é de graça. Esta aula ensina a buscar bem e a usar a IA só no final, no lugar certo.

## Google Scholar com operadores
No scholar.google.com, busque como quem filtra, não como quem conversa:
- **aspas** ("gestão do conhecimento") buscam a expressão exata.
- **OR** combina termos; o sinal de menos exclui ("marketing digital" -redes).
- Filtre por **ano** na barra lateral para priorizar o que é recente.
- Clique em **"Citar"** abaixo do artigo para ver quem citou aquele trabalho — a mina de ouro para achar pesquisas mais novas sobre o mesmo tema.

## SciELO e Portal CAPES
- **SciELO** (scielo.org): periódicos científicos da América Latina em texto completo e gratuito — forte em saúde, educação e ciências sociais.
- **Portal CAPES**: reúne dezenas de bases internacionais; o acesso usa o login da sua universidade (geralmente via Comunidade Acadêmica Federada). Vale pelo acervo de periódicos pagos que sua instituição já contratou.
- Diferencie **artigo publicado** (passou por revisão por pares, tem DOI, pertence a um periódico) de **preprint** (versão prévia postada em repositório, sem revisão formal). Preprint serve para se informar; cite com cautela e sinalize o status.

## IA para RESUMIR, nunca para inventar
Aqui a regra do curso aparece de novo: a IA entra DEPOIS que a fonte existe. Fluxo seguro:
1. Baixe o PDF do artigo (ou salve o link oficial).
2. Anexe o PDF ao chat e peça: "Resuma o problema, o método, os principais achados e as limitações em 8 linhas. Indique a seção de onde tirou cada item."
3. Leia o resumo CONFERINDO no original — o resumo é mapa de leitura, não substituto.

Com esse fluxo você avalia muito mais artigos por hora sem entregar seu trabalho a alucinações: quem decide o que entra na pesquisa continua sendo você.

## Sua tarefa
Escolha seu tema e encontre 3 artigos: um no Google Scholar, um no SciELO e um no Portal CAPES. Salve os PDFs e gere o resumo de um deles com o fluxo acima, conferindo item a item no texto original.`,
          quiz: [
            {
              prompt: 'No Google Scholar, para que serve clicar em "Citar" em um artigo?',
              options: ['Para formatar a referência e ver quem citou aquele trabalho', 'Para baixar o PDF automaticamente', 'Para traduzir o artigo'],
              correctIndex: 0,
              explanation: 'Além de gerar a referência, "Citar" mostra as publicações mais recentes que citaram o artigo.',
            },
            {
              prompt: 'Qual é a diferença entre artigo publicado e preprint?',
              options: ['Preprint é sempre melhor porque é mais novo', 'Nenhuma, são sinônimos', 'Artigo publicado passou por revisão por pares; preprint é versão prévia sem essa revisão'],
              correctIndex: 2,
              explanation: 'O preprint ainda não passou pela revisão formal do periódico — informativo, mas pede cautela ao citar.',
            },
            {
              prompt: 'Qual é o fluxo CORRETO de uso de IA com fontes?',
              options: ['Pedir à IA a lista de artigos e usar direto', 'Baixar o PDF você mesmo e usar a IA só para resumir o que você anexou', 'Nunca usar IA perto de fontes'],
              correctIndex: 1,
              explanation: 'A IA resume fontes que existem e que você tem em mãos — ela nunca é a origem das fontes.',
            },
          ],
        },
        {
          title: 'A caça às referências falsas',
          description:
            'Por que LLMs inventam citações convincentes e o checklist de verificação (DOI, autores, revista) que salva sua defesa em 20 minutos.',
          durationMin: 15,
          content: `Já existem trabalhos reprovados por referência inexistente — o orientador digitou a citação no Scholar e não achou nada. Esta aula instala o antivírus mental: toda referência sugerida por IA é suspeita até a verificação passar.

## Por que LLMs inventam citações
O modelo aprendeu como REFERÊNCIAS se parecem: nome. (ano). Título em itálico. Revista. Volume, páginas. Ele é perfeitamente capaz de gerar uma referência com autores reais, revista real e título plausível — que nunca existiu. É a chamada alucinação: não é mentira consciente, é o modelo completando padrão. E quanto mais específico o pedido ("3 artigos de 2021 sobre gamificação"), mais provável a resposta inventada, porque menos exemplos reais combinam com todos os critérios ao mesmo tempo.

## O checklist de verificação
Para cada referência sugerida, confira:
- **DOI existe?** Cole o DOI em doi.org. Se não abrir o artigo, é sinal vermelho.
- **Os autores batem?** Busque o nome do autor + palavra-chave do título no Google Scholar. Autores reais publicam sobre o tema da citação.
- **A revista existe?** Verifique o periódico no site oficial e se ele publica nessa área.
- **O título existe?** Busque o título inteiro, entre aspas. Zero resultados é quase certeza de fantasma.
- **Os detalhes conferem?** Ano, volume, páginas. Erro de detalhe pode ser só digitação — corrija na fonte original, nunca "de cabeça".

## A rotina antes de qualquer citação
Três passos que viram hábito: 1) toda citação que entrar no texto vem de um PDF ou link que VOCÊ abriu; 2) o arquivo vai para a sua pasta de fontes (o Módulo 2 organiza isso); 3) na revisão final, refaça a verificação de DOI de todas as referências — minutos que salvam meses.

Se a IA citar algo que você não encontra, não tente adaptar: vá ao Scholar com as palavras-chave do tema e procure o trabalho real equivalente. A referência certa quase sempre existe — só não saiu da boca da IA.

## Sua tarefa
Peça à IA 3 referências sobre o seu tema. Rode o checklist completo em cada uma e anote quantas existem de verdade — e que cara as falsas tinham.`,
          quiz: [
            {
              prompt: 'Por que LLMs inventam referências que parecem reais?',
              options: ['Porque querem enganar o estudante de propósito', 'Porque aprenderam o formato de referências e completam padrões plausíveis (alucinação)', 'Porque copiam referências de outros trabalhos sem conferir'],
              correctIndex: 1,
              explanation: 'O modelo reproduz a forma de uma referência perfeitamente — sem garantia nenhuma de que o conteúdo exista.',
            },
            {
              prompt: 'Qual é o primeiro passo do checklist de verificação?',
              options: ['Ver se a referência está bonita no formato ABNT', 'Conferir se o DOI existe em doi.org', 'Perguntar à própria IA se a referência é real'],
              correctIndex: 1,
              explanation: 'O DOI que abre o artigo é o sinal mais objetivo de existência — e a IA não pode atestar a própria fonte.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 2 · Estruturando o trabalho',
      description:
        'Do problema ao fichamento: o projeto de pesquisa ganha forma com diálogo assistido, matriz de literatura e notas organizadas por eixo temático.',
      lessons: [
        {
          title: 'Problema, hipótese e objetivos com IA',
          description:
            'A pergunta de pesquisa afinada em diálogo iterativo, a justificativa sem clichê e a tabela que alinha cada objetivo a um capítulo do trabalho.',
          durationMin: 15,
          content: `Com tema e fontes em mãos, a etapa que define a nota é o projeto de pesquisa: problema, hipótese, justificativa e objetivos. É aqui que a IA mais brilha — como espelho que afina o seu pensamento em diálogo iterativo.

## A pergunta de pesquisa em conversa
Um problema bem formulado é uma pergunta que dá para responder com o método escolhido. Fluxo de diálogo:
1. Descreva o tema em 3 linhas para a IA.
2. Peça: "Gere 5 perguntas de pesquisa possíveis a partir disso, com níveis diferentes de recorte."
3. Critique cada uma: "A 2 está ampla demais e a 4 depende de dados que não tenho. Refine as outras três."
4. Quando uma sobreviver, peça contraprova: "Quais fraquezas você enxerga nessa pergunta, olhando como membro de uma banca?"

O segredo é iterar: a primeira resposta nunca é a boa; a terceira ou a quarta costuma estar perto.

## Hipótese sem mistério
Em trabalhos qualitativos, trabalha-se mais com a questão e com suposições; em quantitativos, a hipótese é uma resposta provisória testável: "estudantes que usam X tendem a Y". Peça à IA para redigir a hipótese a partir da pergunta e depois testar duas coisas: ela é específica? Dá para verificar com os dados que você vai coletar? Se não, refine pergunta e hipótese juntas — as duas precisam se encaixar.

## Justificativa convincente
A IA ajuda a estruturar o porquê em três frentes: relevância acadêmica (o que a literatura ainda não respondeu — use sua matriz de fontes), relevância prática (quem se beneficia do resultado) e viabilidade (por que VOCÊ consegue fazer). Peça o rascunho e depois corte todo clichê: "tema de grande relevância nos dias atuais" é frase que qualquer banca cruza de caneta.

## Objetivos alinhados com capítulos
- **Objetivo geral**: um só, espelhando a pergunta de pesquisa.
- **Objetivos específicos**: 3 ou 4, cada um virando uma seção do desenvolvimento.

Peça à IA a tabela: objetivo específico ↔ capítulo ↔ fonte principal. Objetivo sem capítulo correspondente é enfeite — corte. Esse alinhamento é o que faz a banca dizer que o trabalho "tem fio condutor".

## Sua tarefa
Rode o diálogo da pergunta de pesquisa com pelo menos 4 rodadas de refinamento e produza: a pergunta, a hipótese (ou suposição), a justificativa em 5 linhas sem clichê e 3 objetivos específicos mapeados nos capítulos.`,
          quiz: [
            {
              prompt: 'O que torna uma pergunta de pesquisa bem formulada?',
              options: ['Ser longa e recheada de termos técnicos', 'Ser respondível com o método e os dados que você consegue obter', 'Ter a resposta óbvia desde o início'],
              correctIndex: 1,
              explanation: 'Problema de pesquisa é pergunta com caminho de resposta: método disponível, dados acessíveis, recorte claro.',
            },
            {
              prompt: 'Como devem se relacionar objetivos específicos e capítulos?',
              options: ['Cada objetivo específico corresponde a uma seção do desenvolvimento', 'Objetivos e capítulos são coisas independentes', 'Todos os objetivos viram um único capítulo final'],
              correctIndex: 0,
              explanation: 'O mapa objetivo ↔ capítulo ↔ fonte é o que garante o fio condutor que a banca procura.',
            },
            {
              prompt: 'Qual frase deve ser eliminada de qualquer justificativa?',
              options: ['"Este tema é de grande relevância nos dias atuais"', '"Poucos estudos abordaram o tema neste contexto específico"', '"O estudo se justifica pelos resultados práticos esperados"'],
              correctIndex: 0,
              explanation: 'Relevância genérica diz nada; a justificativa boa mostra a lacuna, quem se beneficia e por que você consegue.',
            },
          ],
        },
        {
          title: 'Metodologia assistida por IA',
          description:
            'Quali vs quanti sem trauma, questionário e roteiro de entrevista rascunhados com IA — e os pontos de ética (TCLE) que não podem faltar.',
          durationMin: 17,
          content: `Metodologia é a parte que mais assusta e a que menos precisa assustar. Em termos simples: você define como vai responder à sua pergunta e por que esse caminho é confiável. A IA acelera os instrumentos; a decisão do método é sua.

## Quali ou quanti (sem trauma)
- **Pesquisa quantitativa**: mede. Questionários com escala, números, média, percentual, gráfico. Responde perguntas do tipo "quanto", "quantos", "qual relação".
- **Pesquisa qualitativa**: compreende. Entrevistas, observação, análise de conteúdo — profundidade em vez de número. Responde "como" e "por que".
Existem ainda os caminhos mistos. Regra prática: pergunta com "quanto" ou "qual efeito" puxa para quanti; pergunta com "como" ou "por que" puxa para quali. Peça à IA: "Minha pergunta é [X]. Argumente 2 parágrafos a favor de quali e 2 a favor de quanti, com as limitações de cada escolha." A decisão final considera tempo, acesso e o que os trabalhos do seu referencial fizeram.

## IA para rascunhar instrumentos
- **Questionário**: peça de 8 a 10 questões alinhadas aos objetivos, misturando escala (1 a 5) e múltipla escolha, sem induzir resposta. Depois revise: cada pergunta responde a qual objetivo? Elimine as órfãs.
- **Roteiro de entrevista**: peça de 6 a 8 perguntas abertas em ordem crescente de profundidade, começando pelo contexto. Teste com um colega e corte o que gerar resposta de sim ou não.
Revisão humana obrigatória: pergunta mal formulada contamina todos os dados — e é erro que a banca encontra em 30 segundos.

## Amostra e ética em linhas gerais
- **Amostra**: quem entra no estudo e como é escolhido. Em quanti, pense no mínimo viável para o seu contexto; em quali, poucas pessoas bem escolhidas valem mais que muitas rasas. Descreva o critério com honestidade — a banca pergunta "por que essas pessoas?".
- **Ética (TCLE)**: pesquisa com seres humanos passa pelo comitê de ética da sua instituição e usa o TCLE, o termo em que o participante concorda, por escrito, sabendo o que será feito com os dados. Anonimize nomes e dados sensíveis desde a coleta. Comece cedo: aprovação leva tempo e o calendário do TCC não espera.

## Sua tarefa
Escreva em 4 linhas o seu método (quali ou quanti, com quem, como). Peça à IA o rascunho do instrumento (questionário ou roteiro), revise cada item contra seus objetivos e liste o que depende do comitê de ética.`,
          quiz: [
            {
              prompt: 'Qual pergunta puxa a pesquisa para o caminho QUANTITATIVO?',
              options: ['"Como os alunos vivenciam o ensino híbrido?"', '"Qual a relação entre horas de estudo e nota média?"', '"Por que os professores adotaram essa prática?"'],
              correctIndex: 1,
              explanation: 'Perguntas de quanto e qual relação pedem números, escalas e estatística descritiva.',
            },
            {
              prompt: 'Qual é o papel da IA na hora do instrumento de coleta?',
              options: ['Rascunhar questões, que passam por revisão humana obrigatória', 'Aplicar o questionário e coletar as respostas', 'Aprovar o instrumento no lugar do comitê de ética'],
              correctIndex: 0,
              explanation: 'A IA acelera o rascunho; a revisão contra os objetivos é humana — pergunta ruim contamina tudo.',
            },
            {
              prompt: 'O que é o TCLE?',
              options: ['O formato ABNT de citação em tabela', 'O termo escrito em que o participante concorda em participar, sabendo o uso dos dados', 'O relatório final entregue à banca'],
              correctIndex: 1,
              explanation: 'TCLE é o Termo de Consentimento Livre e Esclarecido — peça central da ética em pesquisa com seres humanos.',
            },
          ],
        },
        {
          title: 'Referencial teórico: mapeando o debate',
          description:
            'A matriz de literatura (autor/ano/achado) construída com IA a partir de PDFs lidos — e a lacuna que transforma seu trabalho em resposta, não em resumo.',
          durationMin: 16,
          content: `O referencial teórico não é um resumo de cinco artigos em sequência — é um mapa do debate em que o seu trabalho entra. A ferramenta que muda tudo aqui é a matriz de literatura, construída com IA a partir de PDFs que você realmente leu.

## A matriz de literatura
Monte uma tabela com colunas simples:
- **Autor/ano**: quem escreveu e quando.
- **Foco**: o que o trabalho investigou.
- **Método**: como investigou (quanti, quali, revisão).
- **Achado principal**: a conclusão em uma frase.
- **Limitação**: o que o trabalho não respondeu.

Como produzir rápido: anexe cada PDF lido ao chat e peça "Preencha a matriz para este artigo". A IA extrai; você confere no texto. Ao juntar de 8 a 12 linhas, o debate fica visível: quem concorda com quem, onde as conclusões divergem, que método domina o campo.

## A lacuna que justifica seu trabalho
Com a matriz na frente dos olhos, pergunte à IA: "Com base nessa matriz, quais questões ninguém respondeu ainda? Onde os achados conflitam?" A lacuna aparece em três formas clássicas: **contexto não estudado** (o tema foi investigado, mas não no seu cenário ou população), **método não usado** (todos quantitativos, ninguém aprofundou o qualitativo) ou **contradição aberta** entre achados. Sua justificativa nasce daí — e ganha força na defesa, porque você mostra a tabela que sustenta a frase "ninguém fez isso aqui".

## Nunca citar sem ler
A matriz só funciona com PDFs que passaram pelas suas mãos. Citação de segunda mão tem cheiro na banca: o orientador pergunta um detalhe do método e a resposta não vem. Se o artigo é central para seu trabalho, leia ao menos introdução, metodologia e conclusão; se é periférico, a matriz ajuda a decidir se ele merece entrar. A IA pode extrair — não pode ler no seu lugar.

## Da matriz para o capítulo
O referencial bem escrito vai em blocos temáticos, não autor por autor: agrupe as linhas por debate ("abordagens que defendem X", "críticas a X") e escreva cada bloco apoiado nas fichas da próxima aula. A matriz vira índice; o texto vira discussão.

## Sua tarefa
Com 3 artigos já baixados, construa a matriz completa (as 5 colunas), usando a IA para extrair e olhos humanos para conferir. Depois peça a identificação de 2 possíveis lacunas e anote qual delas sustenta o seu trabalho.`,
          quiz: [
            {
              prompt: 'O que é a matriz de literatura?',
              options: ['Uma tabela com autor/ano, foco, método, achado e limitação de cada artigo lido', 'Um gráfico de citações por ano', 'A lista de referências formatada em ABNT'],
              correctIndex: 0,
              explanation: 'A matriz transforma leitura espalhada em mapa comparável — é dela que a lacuna do seu trabalho emerge.',
            },
            {
              prompt: 'Qual NÃO é uma forma clássica de lacuna de pesquisa?',
              options: ['Contexto ou população ainda não estudados', 'Método diferente do que o campo costuma usar', 'O artigo tem mais páginas do que os outros'],
              correctIndex: 2,
              explanation: 'Lacuna é pergunta aberta no debate — tamanho de artigo não tem nada a ver com isso.',
            },
            {
              prompt: 'Por que "nunca citar sem ler"?',
              options: ['Porque a ABNT proíbe leitura de resumo', 'Porque a banca pergunta detalhes que só quem leu sabe responder', 'Porque ler tudo garante nota máxima automaticamente'],
              correctIndex: 1,
              explanation: 'Citação de segunda mão cai na primeira pergunta de detalhe — e derruba a credibilidade do capítulo inteiro.',
            },
          ],
        },
        {
          title: 'Fichamento e notas inteligentes',
          description:
            'A ficha padrão com citações e páginas, IA como assistente de extração e o sistema (Zotero ou planilha) que evita reler 12 PDFs na semana da entrega.',
          durationMin: 14,
          content: `Você leu 12 artigos e daqui a dois meses não lembra o que cada um disse. Quem não ficha, reescreve o referencial do zero na semana da entrega. Fichamento é o seguro de vida da pesquisa — e a IA transforma a parte chata em algo rápido.

## A ficha padrão
Uma ficha por artigo, sempre com os mesmos campos:
- **Referência completa**: autor, ano, título, revista, DOI.
- **Ideia-chave**: a tese central em 2 linhas, escrita com as suas palavras.
- **Citações úteis**: de 2 a 4 trechos, marcados como **citação direta** (texto exato, com página) ou **citação indireta** (paráfrase — que também leva página).
- **Conexões**: com quais outros autores este trabalho conversa ou briga.
- **Nota de uso**: em qual capítulo ou argumento ele entra no seu trabalho.

## IA como assistente de fichamento
Anexe o PDF e peça: "Gere a ficha deste artigo nos campos X, Y, Z. Para cada citação sugerida, indique a página." A IA acha os trechos; você valida página e sentido no original — às vezes o trecho "perfeito" muda de significado fora do parágrafo em que nasceu. Guarde tudo num lugar único: planilha (uma linha por ficha, com filtro por eixo) ou gerenciador de referências.

## Organize por eixo temático
Fichas na ordem de leitura viram bagunça. Crie eixos — por exemplo: "definições do tema", "métodos usados", "críticas" — e etiquete cada ficha. Na hora de escrever o capítulo, você filtra o eixo e tem o debate inteiro na tela, em vez de reler 12 PDFs corridos.

## O fluxo com Zotero ou planilha
- **Zotero** (gratuito): guarda PDFs, extrai metadados, insere citações no Word e no Google Docs no estilo configurado; a extensão do navegador salva o artigo com um clique e as notas ficam anexadas ao item.
- **Mendeley**: alternativa popular, com forte integração ao ecossistema Elsevier e descoberta de artigos relacionados.
- **Planilha**: simples e infalível — colunas da ficha, filtro por eixo, link para o PDF na nuvem.
Escolha UM sistema e use até o fim: trocar de ferramenta no meio da pesquisa é a maior perda de tempo possível.

## Sua tarefa
Fiche um artigo que você já leu usando a ficha completa, com ao menos 1 citação direta com página. Salve no seu sistema (Zotero ou planilha) e etiquete com o eixo temático correto.`,
          quiz: [
            {
              prompt: 'Qual campo NÃO pode faltar em uma citação direta na ficha?',
              options: ['A página exata de onde o trecho saiu', 'A cor da capa do artigo', 'O preço da assinatura da revista'],
              correctIndex: 0,
              explanation: 'Citação direta sem página não fecha na ABNT — e você perde o rastro quando for escrever.',
            },
            {
              prompt: 'Por que organizar as fichas por eixo temático?',
              options: ['Porque fica bonito no Drive', 'Porque ao escrever o capítulo você filtra o eixo e tem o debate inteiro à mão', 'Porque o Zotero exige eixos para funcionar'],
              correctIndex: 1,
              explanation: 'Eixo temático conecta ficha com capítulo: é o atalho entre o acervo e o texto que você vai escrever.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 3 · Escrevendo com integridade',
      description:
        'Parafrasear sem plagiar, escrever capítulo a capítulo mantendo a sua voz, formatar citações ABNT com conferência e cumprir as regras da sua instituição.',
      lessons: [
        {
          title: 'Resumir e parafrasear sem plagiar',
          description:
            'A diferença entre parafrasear e copiar disfarçado, o fluxo de 4 passos que protege seu texto e por que detectores de IA e plágio não são prova.',
          durationMin: 14,
          content: `Plágio não é só copiar com Ctrl+C. Paráfrase disfarçada — trocar duas palavras e manter a estrutura da frase alheia — também é plágio, e detector nenhum vai te salvar. Esta aula instala o método que protege de verdade.

## Parafrasear não é trocar sinônimos
Imagine um trecho de artigo (fictício, só para o exemplo): "A gamificação aumenta o engajamento dos alunos no ensino superior."
- **Copiar**: o trecho literal, sem crédito. Plágio evidente.
- **Plágio disfarçado**: "A gamificação eleva o engajamento dos estudantes no ensino superior." — mesma estrutura, palavras trocadas.
- **Parafrasear de verdade**: reconstruir a ideia com a sua sintaxe e o seu objetivo, mantendo o crédito: "Entre universitários, elementos de jogo aparecem associados a maior participação nas aulas (AUTOR, ano, p. X)." — com a referência real do artigo que você leu no lugar do AUTOR.

A diferença está na estrutura: se a frase alheia e a sua têm o mesmo esqueleto, é plágio mesmo com palavras diferentes.

## O fluxo de 4 passos
1. **Ler** o trecho até entender sem olhar para o texto.
2. **Fechar** o artigo — de verdade: fechar a janela.
3. **Escrever** a ideia de memória, com suas palavras e o propósito dela dentro do seu parágrafo.
4. **Conferir** contra o original: estrutura diferente? Crédito com página? Sentido preservado?

O passo 2 é o antivírus: sem o texto na frente dos olhos, a frase que sai só pode ser sua.

## E os detectores de IA e de plágio?
Não são prova de nada. Detectores de plágio comparam o texto com o que já está publicado — paráfrase bem feita passa. Detectores de IA erram nos dois sentidos: acusam texto humano e aprovam texto de IA editado. Banca séria julga pela leitura: vocabulário que você nunca usa, generalidade vazia, parágrafos que não conversam com o resto do trabalho. O antídoto é sempre o mesmo: escreva você, com fonte lida e crédito dado.

## Sua tarefa
Escolha um parágrafo de um artigo do seu referencial. Aplique o fluxo de 4 passos e produza a sua paráfrase com crédito. Depois compare os dois textos lado a lado: o esqueleto é o mesmo? Se sim, refaça.`,
          quiz: [
            {
              prompt: 'Qual situação é plágio disfarçado?',
              options: ['Manter a estrutura da frase alheia trocando algumas palavras, sem crédito claro', 'Reconstruir a ideia com sua sintaxe e citar autor, ano e página', 'Citar um trecho literal entre aspas, com página'],
              correctIndex: 0,
              explanation: 'Trocar sinônimo mantendo o esqueleto é plágio — a estrutura é que denuncia a cópia.',
            },
            {
              prompt: 'Por que "fechar o artigo" antes de escrever?',
              options: ['Para poupar bateria do notebook', 'Porque sem o texto na frente, a frase só pode sair com a sua estrutura', 'Porque a ABNT exige tela fechada durante a escrita'],
              correctIndex: 1,
              explanation: 'O passo 2 do fluxo obriga a reconstrução de memória — o antídoto contra a cópia de estrutura.',
            },
            {
              prompt: 'Como tratar o resultado de um detector de IA?',
              options: ['Como prova definitiva de autoria', 'Como indício sem valor probatório — ele erra nos dois sentidos', 'Como substituto da revisão por pares'],
              correctIndex: 1,
              explanation: 'Detectores acusam humanos e aprovam máquinas editadas; o julgamento é pela leitura e pelo processo.',
            },
          ],
        },
        {
          title: 'Escrevendo cada capítulo com IA ao seu lado',
          description:
            'O que a IA faz na introdução, no desenvolvimento e na conclusão — e o jeito de usar que preserva a sua voz e a regra que nunca muda: IA rascunha, VOCÊ decide.',
          durationMin: 16,
          content: `Chegou a hora de escrever o trabalho. A posição da IA aqui é bem definida: ela rascunha, estrutura e critica — a voz, as decisões e a responsabilidade são suas. Vamos capítulo a capítulo.

## Onde a IA ajuda em cada capítulo
- **Introdução**: contextualizar o tema, apresentar problema, justificativa, objetivos e a estrutura do trabalho. A IA ajuda a ordenar e a enxugar; a pergunta já é sua (Módulo 2).
- **Desenvolvimento**: referencial teórico (com as suas fichas) e metodologia. A IA ajuda a dar coesão entre blocos temáticos e a explicar o método com clareza — mas cada afirmação teórica precisa de fonte que você leu.
- **Conclusão**: retomar objetivos, responder à pergunta com os dados, apontar limitações e trabalhos futuros. Aqui a IA ajuda MENOS: conclusão é o seu resultado, ela não sabe o que você descobriu — conte a ela.

## Como manter a sua voz
- Escreva o **parágrafo-guia** (a ideia do trecho em 1 frase, de cabeça) antes de pedir qualquer rascunho.
- Peça rascunho por SEÇÃO, nunca o capítulo inteiro — texto de IA longo demais vira sopa genérica.
- Edite como quem revisa um estagiário: corte adjetivos, generalize menos, insira os seus exemplos do campo.
- Leia em voz alta: o que não sai da sua boca com naturalidade, refaça.

## A regra de ouro: IA rascunha, VOCÊ decide
Nenhuma frase entra no trabalho sem que você entenda e defenda. Na banca ninguém pergunta "quem escreveu isso?" — perguntam "por que você afirmou isso?". A resposta precisa existir para cada parágrafo. Não é burocracia: é a diferença entre entregar um texto e aprender a pensar.

Dica prática que economiza horas: peça à IA o esqueleto do capítulo (tópicos + o que cada um precisa conter), escreva o primeiro parágrafo de cada tópico você mesmo e só então use a IA para expandir trechos mecânicos — descrição de procedimentos, transições, reformulações.

## Sua tarefa
Escolha uma seção do seu trabalho (por exemplo, um objetivo específico) e escreva o parágrafo-guia. Peça o rascunho da IA, edite cortando generalidades e inserindo um exemplo seu, e compare a versão final com o rascunho original.`,
          quiz: [
            {
              prompt: 'Em qual capítulo a IA ajuda MENOS — e por quê?',
              options: ['Na introdução, porque ela não conhece o tema', 'Na conclusão, porque ela não sabe o que você descobriu', 'No desenvolvimento, porque ela não lê PDFs'],
              correctIndex: 1,
              explanation: 'Conclusão é o seu resultado: quem responde à pergunta de pesquisa com os dados é você.',
            },
            {
              prompt: 'O que é o parágrafo-guia?',
              options: ['O resumo gerado pela IA antes de escrever', 'A frase com a ideia do trecho, escrita por você antes de pedir rascunho', 'O primeiro parágrafo do resumo do TCC'],
              correctIndex: 1,
              explanation: 'Definir a ideia primeiro mantém o rascunho da IA a serviço do SEU argumento, não o contrário.',
            },
            {
              prompt: 'Qual é a pergunta da banca que você precisa conseguir responder para cada parágrafo?',
              options: ['"Em que programa você escreveu isso?"', '"Por que você afirmou isso?"', '"Quantas vezes você usou a IA?"'],
              correctIndex: 1,
              explanation: 'IA rascunha, você decide: cada afirmação precisa de fundamento que você conhece e defende.',
            },
          ],
        },
        {
          title: 'Citações e referências ABNT com IA',
          description:
            'IA formata, você confere no manual: o ritual que evita devolução, o papel de Zotero e Mendeley e o erro número um — o "apud" desnecessário.',
          durationMin: 13,
          content: `A parte mais mecânica do TCC — citações e referências — é também a que mais reprova por detalhe. A IA formata rápido; a conferência no manual oficial é inegociável. Aqui está o sistema completo.

## Pedir formatação à IA (e conferir depois)
Você pode colar a referência e pedir: "Formate no padrão ABNT NBR 6023, referência de artigo de periódico." A IA acerta o formato geral — e erra detalhes: pontuação, itálico, o "In:" de capítulo, edição, páginas. Então o ritual é: gerar com IA → CONFERIR item a item no manual da biblioteca (muitas universidades publicam o deles) ou na norma → corrigir. Dez referências conferidas custam minutos; uma versão devolvida pela banca custa semanas.

## Zotero e Mendeley: o jeito profissional
Ferramentas de gestão de referências fazem o que a IA faz, só que a partir dos metadados corretos do artigo:
- **Zotero**: gratuito, salva o artigo direto do navegador, guarda o PDF junto e insere citações no Word e no Google Docs no estilo configurado.
- **Mendeley**: alternativa popular, com integração forte ao ecossistema Elsevier e sugestão de artigos relacionados.

Fluxo recomendado: toda fonte que entra na pesquisa entra no gerenciador no MESMO dia. Na hora de escrever, cite pelo plugin e a bibliografia se monta sozinha. A IA fica para os casos de borda (documento oficial, vídeo, fonte estranha) — sempre conferida depois.

## O erro número 1: o "apud" desnecessário
"Apud" (citado por) serve quando você NÃO teve acesso à fonte original e cita por meio de uma obra que leu. O erro clássico: o estudante leu um artigo recente que cita um autor clássico e escreve "Clássico (ano original apud Artigo, ano)" — sem nunca ter aberto a obra original. Se o autor é acessível, vá à fonte e cite direto; reserve o apud para fontes realmente inacessíveis, dizendo que é o caso. Banca percebe apud em cadeia e pergunta justamente o que você não leu.

## Coerência é o que a banca procura
Mesmo padrão do início ao fim: se você usa "et al." a partir de 3 autores, use em todas; se o ano vem entre parênteses, não misture formato. Uma passada dedicada SÓ a citações na revisão final (Módulo 4) fecha o cerco.

## Sua tarefa
Formate 3 referências suas com IA, confira cada campo no manual da sua universidade e anote os erros encontrados. Depois cadastre as 3 no Zotero e gere a bibliografia automática para comparar.`,
          quiz: [
            {
              prompt: 'Depois de pedir formatação ABNT à IA, o que você faz?',
              options: ['Cola direto no trabalho — a IA nunca erra formato', 'Conferência item a item no manual da biblioteca ou na norma', 'Pedir a outra IA para validar a formatação'],
              correctIndex: 1,
              explanation: 'A IA acerta o geral e erra detalhes: pontuação, itálico, "In:", edição. A conferência é inegociável.',
            },
            {
              prompt: 'Quando o "apud" é justificável?',
              options: ['Quando o autor original é famoso', 'Quando você não teve acesso à obra original e cita por meio de uma obra que leu', 'Quando a citação é longa demais'],
              correctIndex: 1,
              explanation: 'Apud é exceção para fonte inacessível — se dá para ir à fonte original, cite direto.',
            },
            {
              prompt: 'Qual é a vantagem central do Zotero sobre formatar à mão?',
              options: ['Ele escreve o TCC por você', 'Ele insere citações no editor e monta a bibliografia a partir dos metadados corretos', 'Ele bloqueia plágio automaticamente'],
              correctIndex: 1,
              explanation: 'Gerenciadores trabalham com metadados certos do artigo — menos erro de digitação e bibliografia automática.',
            },
          ],
        },
        {
          title: 'As regras da sua instituição sobre IA',
          description:
            'Onde a norma da sua universidade está, como escrever a declaração transparente de uso de IA e por que fraude acadêmica custa caro de verdade.',
          durationMin: 15,
          content: `Usar IA no TCC sem olhar as regras da sua instituição é dirigir sem habilitação: pode dar tudo certo por um tempo — e dar muito errado na pior hora possível. Esta aula é sobre o rigor burocrático que protege meses de trabalho.

## Por que cada universidade tem norma própria
Não existe uma regra nacional única e definitiva sobre IA em trabalhos acadêmicos. Cada instituição — e às vezes cada programa ou professor — define o que é permitido: alguns restringem o uso na escrita, outros exigem apenas declaração, outros regulamentam etapa por etapa. E atenção: o professor da disciplina pode ter regra própria que valha mais que o regulamento geral. Na prática, a norma mais restritiva do caminho costuma ser a que vale.

## Onde procurar (nessa ordem)
1. **Edital ou regulamento do TCC** do seu curso — a maioria já tem seção sobre ferramentas de IA.
2. **Coordenação e orientador**: pergunte direto "posso usar IA para X?" e guarde a resposta por escrito, em e-mail.
3. **Manual de trabalhos acadêmicos** da biblioteca: instruções de formatação e citação costumam tratar do assunto.
4. **Resoluções oficiais** publicadas no site da instituição, se existirem.

## Declaração transparente de uso
A tendência é exigir uma declaração explícita, geralmente nas notas iniciais ou finais, do tipo: "Ferramentas de IA generativa foram utilizadas para [finalidade: revisão gramatical, organização de tópicos, sugestão de estrutura], sob revisão e responsabilidade do autor." Escreva a sua com precisão: o que a IA fez, onde e em quê. Transparência converte uso proibido em uso declarado; ocultação converte uso permitido em fraude.

## Consequências reais de fraude
Trabalho reprovado, processo disciplinar e, nos casos graves, risco à validade do título. Detectar texto integral de IA é difícil — mas o que derruba trabalhos é o combo: referências falsas (Módulo 1), trechos que o autor não sabe explicar e declaração ausente quando o regulamento exigia. A banca não precisa de detector: basta perguntar.

Postura recomendada: use a IA como o curso ensinou — assistente de processo, fontes próprias, tudo conferido —, declare o uso e durma tranquilo.

## Sua tarefa
Investigue a regra da sua instituição: encontre o regulamento do TCC (ou pergunte à coordenação por e-mail) e anote o que diz sobre IA. Depois redija a declaração de uso de IA do seu trabalho, mesmo que em rascunho.`,
          quiz: [
            {
              prompt: 'Qual é a primeira fonte onde procurar a regra sobre IA?',
              options: ['Grupos de alunos no mensageiro', 'O edital ou regulamento do TCC do seu curso', 'Blogs de tecnologia'],
              correctIndex: 1,
              explanation: 'O regulamento do TCC é o documento formal do seu curso — e depois disso, coordenação e orientador por escrito.',
            },
            {
              prompt: 'O que uma declaração de uso de IA bem feita contém?',
              options: ['A lista de todos os prompts usados, obrigatoriamente', 'A finalidade do uso, onde foi usado e a responsabilidade do autor pela revisão', 'Uma garantia de que a IA não foi usada em nada'],
              correctIndex: 1,
              explanation: 'Transparência é dizer o quê, onde e com qual controle — sob responsabilidade do autor.',
            },
            {
              prompt: 'O que costuma derrubar trabalhos com IA mal usada?',
              options: ['Apenas detectores automáticos de IA', 'O combo de referências falsas, trechos que o autor não sabe explicar e declaração ausente', 'Uso de IA só na revisão gramatical'],
              correctIndex: 1,
              explanation: 'A banca investiga perguntando: fonte que não existe e parágrafo sem explicação valem mais que qualquer detector.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 4 · Análise, apresentação e entrega',
      description:
        'Da planilha à banca: análise de dados com conferência humana, revisão em camadas e o ensaio de defesa que transforma nervosismo em roteiro.',
      lessons: [
        {
          title: 'Analisando dados com IA',
          description:
            'Tabular respostas, escolher o gráfico certo e calcular média e frequência com conferência humana: o arsenal descritivo que a maioria dos TCCs precisa.',
          durationMin: 17,
          content: `Dados coletados, chega a parte boa: transformar respostas em achados. Para o nível de um TCC de graduação, IA + planilha resolvem a análise com segurança — desde que cada número passe pelos seus olhos.

## Tabulando respostas de questionário
Se você coletou por formulário, exporte a planilha (CSV ou Excel). Com os dados no Excel ou no Google Sheets:
- Peça à IA integrada (Copilot no Excel, Gemini no Sheets): "Conte a frequência de cada resposta da coluna B e monte uma tabela resumo."
- Para entrevistas (quali), use a IA para agrupar por tema: cole as transcrições anonimizadas e peça "agrupe os trechos por tema recorrente, indicando qual participante disse o quê". Você valida se o agrupamento faz sentido e recorta os trechos que entrarão no texto.

## Gráficos simples que valem nota
Regra de escolha: **barra** para comparar categorias, **linha** para evolução no tempo, **pizza** apenas para poucas partes de um mesmo todo. No Excel com Copilot ou no Sheets com Gemini, descreva o gráfico em português e peça o tipo certo, com título e rótulos. Gráfico bom se explica sozinho: o título diz o que é, o eixo diz a unidade, a fonte diz de onde veio.

## Estatística descritiva com conferência
O arsenal suficiente para a maioria dos TCCs:
- **Frequência**: quantos responderam cada opção.
- **Média**: o valor típico de respostas numéricas (escala de 1 a 5, por exemplo).
- **Distribuição**: mínimo, máximo e amplitude — quem desconfia de média enganosa.

Peça os cálculos à IA, MAS confira os três primeiros à mão na planilha (contagem, soma dividida pelo total). Erro clássico: média calculada incluindo respostas em branco ou texto digitado errado — um "5 " com espaço extra pode virar texto e contaminar o cálculo. Fórmula errada nessa escala se propaga para todos os gráficos e para a conclusão.

O resultado vira os capítulos de resultados e discussão: tabela ou gráfico → frase com o número → leitura do que isso significa contra o seu referencial.

## Sua tarefa
Pegue (ou simule) uma planilha com 20 respostas: peça à IA a frequência de cada opção e a média de uma escala, confira um cálculo à mão e gere um gráfico de barras com título e fonte.`,
          quiz: [
            {
              prompt: 'Qual gráfico é adequado para comparar categorias?',
              options: ['Gráfico de barras', 'Gráfico de linha', 'Gráfico de pizza com 20 fatias'],
              correctIndex: 0,
              explanation: 'Barra compara categorias; linha mostra evolução no tempo; pizza só para poucas partes de um todo.',
            },
            {
              prompt: 'Por que conferir os cálculos da IA na planilha?',
              options: ['Porque a IA nunca calcula certo', 'Porque erro de célula (branco, texto com espaço) contamina médias e se propaga à conclusão', 'Porque a banca exige cálculo manual de tudo'],
              correctIndex: 1,
              explanation: 'Um dado sujo ou fórmula errada se espalha por gráficos e conclusão — a conferência humana é o controle de qualidade.',
            },
          ],
        },
        {
          title: 'Revisão final em camadas',
          description:
            'Ortografia, gramática, estilo e norma ABNT — uma camada por passada — e a IA crítica como banca: clareza, coesão e argumentação sob ataque.',
          durationMin: 15,
          content: `Ninguém escreve bem de primeira — escreve-se mal com estilo e corrige-se com método. A revisão em camadas troca a leitura infinita "procurando erro" por passadas focadas, cada uma com um objetivo só. A IA acelera cada camada.

## Uma camada por passada
Corrigir tudo ao mesmo tempo é a receita para não corrigir nada. Faça uma passada por camada, nesta ordem:
1. **Ortografia**: peça à IA "liste APENAS erros de grafia e acentuação, com a correção" — sem reescrever nada.
2. **Gramática**: concordância, regência, pontuação. Peça em formato lista: trecho original → versão corrigida → motivo.
3. **Estilo**: frases longas, voz passiva em excesso, repetição de palavra, muletas ("pode-se dizer que", "é importante ressaltar"). Peça: "aponte os 10 piores trechos de estilo, sem mexer no conteúdo".
4. **Norma ABNT**: formatos de citação, numeração, títulos e referências — uma passada olhando SÓ isso, com o manual ao lado.

Aceite ou recuse cada sugestão conscientemente: correção aceita no automático é texto que você deixa de conhecer — e o que você não conhece, não defende.

## A IA como banca simulada
Depois das camadas mecânicas, a revisão de fundo: cole um capítulo e peça "Atue como banca examinadora rigorosa: critique clareza, coesão e argumentação deste capítulo. Liste as 5 perguntas que você faria na defesa." A IA aponta onde o argumento pende de fonte, onde o parágrafo não conecta com o anterior e onde a conclusão não segue do que foi mostrado. As perguntas antecipadas valem ouro: cada uma é um treino gratuito de defesa — e material para a aula final.

## Rotina prática
- Revise com folga: uma camada por dia vence dez camadas na véspera.
- Leia em voz alta na camada de estilo — o ouvido pega o que os olhos correm.
- Guarde a versão de cada camada (v1-ortografia, v2-gramática...) para poder voltar atrás.
- Confira sumário, numeração de páginas e figuras por último, já na versão final em PDF.

## Sua tarefa
Escolha um capítulo pronto e rode as 4 camadas com a IA, uma por vez, respeitando a ordem. Anote quantas correções cada camada encontrou — e quantas você recusou, com o motivo.`,
          quiz: [
            {
              prompt: 'Qual é o princípio da revisão em camadas?',
              options: ['Procurar todos os tipos de erro na mesma leitura', 'Uma passada por objetivo: ortografia, depois gramática, estilo e norma', 'Revisar tudo na véspera da entrega, de uma vez'],
              correctIndex: 1,
              explanation: 'Passada focada enxerga mais: misturar objetivos na mesma leitura dilui a atenção e deixa erro passar.',
            },
            {
              prompt: 'Por que pedir à IA que critique "como banca"?',
              options: ['Para receber elogios motivacionais', 'Para antecipar perguntas de clareza, coesão e argumentação antes da defesa real', 'Para substituir o orientador'],
              correctIndex: 1,
              explanation: 'A crítica simulada expõe pontos fracos cedo — e cada pergunta antecipada é treino de defesa gratuito.',
            },
          ],
        },
        {
          title: 'Projeto final: ensaio de defesa simulado',
          description:
            'A IA no papel de banca com perguntas difíceis baseadas no SEU texto, treino de respostas, roteiro de slides e o checklist de entrega da trilha.',
          durationMin: 20,
          content: `Última aula: a defesa. O projeto final do curso simula a situação que mais aperta o estômago do estudante — responder perguntas na frente da banca — usando a IA como adversária de treino. Quem ensaia, defende.

## A IA no papel de banca
Cole seu trabalho (ou a seção mais sensível) e peça: "Atue como banca de TCC. Faça 10 perguntas difíceis sobre este trabalho: metodologia, limitações, escolhas teóricas e consequências práticas dos resultados. Numere e não dê as respostas." A IA vai atacar exatamente onde seu texto é fraco — e é isso que você quer descobrir ANTES da defesa real, com tempo de arrumar a casa.

## Treinando as respostas
- Responda cada pergunta por escrito, em 4 a 6 linhas, sem olhar o trabalho.
- Depois peça: "Avalie minha resposta a cada pergunta: ela responde o que foi perguntado? Soa segura ou defensiva? O que faltaria?"
- Repita as perguntas que você errou, em voz alta. Defesa é performance: a frase pronta na cabeça e o tom calmo se constroem em ensaio, não em improviso.

Regra da hora H: não sabe? Diga "não tenho esse dado coletado; seria um caminho de trabalho futuro". Isso é diferente de conjeturar — banca respeita limite honesto e detesta invenção.

## Roteiro de slides e apresentação
Peça: "Gere roteiro de 8 a 10 slides para defender este trabalho em 15 minutos: problema, justificativa, método, resultados, conclusão." Corte para 1 ideia por slide, troque texto por figura — um gráfico dos seus dados vale dez bullets — e ensaie com cronômetro. Estourar o tempo é a falha mais comum e a mais fácil de eliminar.

## Checklist de entrega
- Versão final conferida em PDF: sumário atualizado, figuras numeradas, páginas certas.
- Referências verificadas de novo, DOI a DOI, no padrão do manual.
- Declaração de uso de IA incluída, se exigida pelo regulamento.
- Arquivo entregue no formato e canal pedidos, com folga de prazo.
- Slides no pendrive E na nuvem — com backup do PDF.

## Ponte para o próximo curso
Com o TCC defendido, falta mostrar o que você fez ao mundo: no próximo curso da trilha (Sites com IA) você constrói um site que apresenta seus projetos e resultados. A pesquisa vira vitrine.

## Sua tarefa
Rode o ensaio completo: 10 perguntas da banca-IA, respostas por escrito, avaliação das respostas e uma nova rodada das que você errou. Depois gere o roteiro de slides e apresente uma vez com cronômetro.`,
          quiz: [
            {
              prompt: 'Como a IA deve ser usada no ensaio de defesa?',
              options: ['Respondendo as perguntas da banca por você', 'Como banca simulada que faz perguntas difíceis baseadas no seu texto', 'Reescrevendo o trabalho na véspera'],
              correctIndex: 1,
              explanation: 'A banca-IA ataca onde o texto é fraco: treinar as respostas antes vale mais que qualquer dica de improviso.',
            },
            {
              prompt: 'Na defesa, se você não sabe uma resposta, o melhor é:',
              options: ['Inventar uma resposta plausível', 'Dizer que não há o dado coletado e apontar como trabalho futuro', 'Ficar em silêncio até passarem para outra pergunta'],
              correctIndex: 1,
              explanation: 'Limite honesto gera respeito; invenção derruba a credibilidade construída no trabalho inteiro.',
            },
            {
              prompt: 'Qual é a regra de ouro dos slides de defesa?',
              options: ['Máximo de texto para parecer completo', '1 ideia por slide, trocando texto por figura sempre que possível', 'Só o slide de capa, sem conteúdo'],
              correctIndex: 1,
              explanation: 'Slide é apoio visual, não teleprompter: um gráfico seu comunica mais que dez bullets.',
            },
          ],
        },
      ],
    },
  ],
}
