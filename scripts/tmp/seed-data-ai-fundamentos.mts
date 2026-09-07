// Curso: Fundamentos de IA para Estudantes — mentor Carlos
// Curso 1 de 4 da Trilha IA para Estudantes. Conteúdo em nível "produto para venda".
import type { CourseDef } from './seed-types'

export const fundamentosCourse: CourseDef = {
  mentorEmail: 'carlos@demo.com',
  title: 'Fundamentos de IA para Estudantes: Copilot, Gemini e prompts na prática',
  description:
    'IA generativa já é ferramenta de estudo — o que muda o jogo é usá-la com método, não no piloto automático. Neste curso (Curso 1 de 4 da Trilha IA para Estudantes) você entende como a IA funciona de verdade — previsão, contexto, alucinação —, configura ChatGPT, Copilot e Gemini nas contas gratuitas e domina o prompt de 4 peças: papel, contexto, tarefa e formato. Em seguida aplica tudo na rotina real de estudante: flashcards e simulados que ensinam, revisão de trabalhos em camadas, cronogramas de prova, imagens e transcrições — sempre com verificação e ética em dia. Você sai sabendo qual ferramenta abrir para cada tarefa, com um kit pessoal de IA por escrito e pronto para o próximo passo: Engenharia de Prompts.',
  category: 'Tecnologia',
  level: 'INICIANTE',
  price: 79,
  coverUrl: '/uploads/seed/course-ia-fundamentos.png',
  themes: [
    {
      title: 'Módulo 1 · Entendendo a IA sem enrolação',
      description:
        'O mapa mental honesto: como a IA funciona, onde ela erra com convicção e quem é quem no mercado — a base para usar qualquer ferramenta sem ser enganado.',
      lessons: [
        {
          title: 'O que é (e o que não é) Inteligência Artificial',
          description:
            'A IA que já trabalha no seu celular, a diferença entre preditiva e generativa e os três mitos de filme que atrapalham quem quer estudar com ela.',
          durationMin: 14,
          content: `Antes de abrir qualquer ferramenta, você precisa de um mapa mental honesto do que é IA. Sem isso, você usa no piloto automático — e erra exatamente nos lugares errados.

## A IA já estava no seu bolso
Inteligência Artificial não nasceu com chatbot. Ela já trabalhava silenciosamente no seu celular:
- **Maps** estima seu tempo de chegada cruzando trânsito em tempo real.
- A **câmera** reconhece rostos e melhora a foto antes de você apertar o botão.
- As **recomendações** de música e vídeo aprendem o que você consome e sugerem o próximo.

Nada disso conversa com você. Mas tudo isso é IA: sistemas que aprendem padrões a partir de dados.

## Preditiva vs generativa
- **IA preditiva** responde perguntas fechadas: isto é spam?, qual rota é mais rápida?, há um rosto nessa foto? Ela classifica e estima.
- **IA generativa** cria conteúdo novo: texto, imagem, áudio, código. Você pede "escreva um e-mail pedindo prazo" e ela redige algo que nunca existiu.

Os chatbots deste curso são generativos. E isso muda tudo: em vez de A resposta certa, você recebe UMA resposta provável — que pode ser ótima ou pode estar errada.

## O robô de filme não existe
Desfaça agora três mitos que custam nota de estudante:
- *Consciência*: a IA não pensa nem sente. Ela calcula a continuação mais provável do seu texto.
- *Intenção*: ela não quer te ajudar nem te enganar. Não tem plano nenhum.
- *Autoridade*: ela não é fonte. É uma ferramenta que redige a partir de padrões — a verificação continua sendo sua.

O enquadramento certo: um **estagiário extremamente rápido, bem lido e sem noção crítica**. Trabalhe assim — peça muito, confira sempre. Este curso inteiro se apoia nessa dupla.

## Sua tarefa
Abra o celular e liste 3 situações do seu dia em que a IA já trabalhou para você sem você perceber (câmera, teclado preditivo, recomendações, navegação). Para cada uma, anote no bloco de notas: era preditiva ou generativa? Guarde a lista — ela é o seu ponto de partida do curso.`,
          quiz: [
            {
              prompt: 'Qual alternativa descreve IA generativa?',
              options: [
                'Sistema que classifica e-mails como spam',
                'Sistema que cria textos, imagens ou áudios novos',
                'Sistema que calcula a rota mais rápida até a faculdade',
              ],
              correctIndex: 1,
              explanation:
                'Generativa é a que CRIA conteúdo novo; classificar e-mail e estimar rota são tarefas de IA preditiva.',
            },
            {
              prompt: 'Qual é a atitude correta diante de uma resposta de IA?',
              options: [
                'Aceitar, porque a IA raramente erra',
                'Tratar como rascunho e verificar as informações importantes',
                'Descartar, porque IA não serve para estudo sério',
              ],
              correctIndex: 1,
              explanation:
                'IA generativa entrega uma resposta provável, não uma verdade conferida: rascunho + verificação é o uso profissional.',
            },
            {
              prompt: 'Por que a comparação com "estagiário rápido e sem noção crítica" é útil?',
              options: [
                'Porque define o valor do pedido generoso e da conferência constante',
                'Porque a IA é contratada como funcionário',
                'Porque estagiários não podem usar IA',
              ],
              correctIndex: 0,
              explanation:
                'A analogia fixa o comportamento certo: delegar muito e conferir sempre — nem confiança cega, nem recusa.',
            },
          ],
        },
        {
          title: "Como uma IA 'escreve': previsão, tokens e contexto",
          description:
            'O autocomplete turbinado por trás do chatbot, por que a resposta soa confiante até quando erra e o papel do contexto da conversa.',
          durationMin: 15,
          content: `Entender como o chatbot funciona muda o jeito de usar. Não é mágica: é previsão — e isso explica tanto os acertos brilhantes quanto os erros desconcertantes.

## Um autocomplete turbinado
Quando você digita "bom dia" e o teclado sugere "tudo bem?", isso é previsão de próxima palavra. Um modelo de linguagem faz a mesma coisa, em escala industrial:
- Você escreve: "O Tratado de Tordesilhas dividiu..."
- O modelo calcula quais palavras continuam esse trecho com mais probabilidade.
- Escolhe uma, escreve, recalcula tudo e escolhe a próxima. E assim até o fim.

A resposta inteira é construída palavra por palavra, como o autocomplete do celular — versão avançada. Não existe banco de respostas prontas lá dentro.

## Tokens: os tijolos do texto
Os modelos não trabalham com palavras completas, e sim com **tokens**: pedaços de palavra ("fun", "da", "men", "tal"). Por isso às vezes tropeçam em trocadilhos, contagem de letras e termos raros — para o modelo, o texto é uma sequência de blocos estatísticos, não de significados. Não é burrice: é arquitetura.

## Por que ela parece tão confiante
Aqui está o detalhe que mais engana estudante: o modelo escreve sempre a continuação mais provável. Quando sabe, soa confiante. Quando não sabe, continua soando confiante — porque o tom de certeza é exatamente a continuação provável de um texto que responde perguntas. **Confiança na voz não é garantia de verdade no conteúdo.** Guarde esta frase; a próxima aula depende dela.

## Contexto: a memória da conversa
Tudo que você escreve na conversa vira **contexto**: o material que o modelo usa para prever as próximas palavras. Consequências práticas:
- Comece com a informação essencial (curso, objetivo, nível) — a resposta nasce melhor.
- Pergunta ambígua gera resposta arbitrária: ela escolhe UMA interpretação e segue.
- Conversa muito longa dilui o começo: se a IA "esquecer" algo, repita o essencial ou abra conversa nova e limpa.

## Sua tarefa
Abra uma conversa nova com qualquer IA e escreva: "Complete esta frase com uma palavra: O descanso do estudante é...". Depois abra OUTRA conversa e complete: "O estudo do estudante é...". Compare as respostas e anote o que mudou com o contexto — é assim que você internaliza que não existe resposta única guardada lá dentro.`,
          quiz: [
            {
              prompt: 'Como o modelo de linguagem constrói a resposta?',
              options: [
                'Consultando um banco de dados de respostas prontas',
                'Prevendo a próxima palavra (token) em cadeia',
                'Copiando a resposta mais votada da internet',
              ],
              correctIndex: 1,
              explanation:
                'O modelo gera a resposta token por token, escolhendo a continuação mais provável — não consulta respostas armazenadas.',
            },
            {
              prompt: 'A IA parece confiante mesmo errando porque:',
              options: [
                'Ela quer te enganar de propósito',
                'O tom de certeza é a continuação provável do texto, mesmo sem saber a verdade',
                'Ela confere tudo antes de enviar',
              ],
              correctIndex: 1,
              explanation:
                'Não há intenção nem checagem: o estilo assertivo é estatisticamente a melhor continuação — por isso a verificação é sua.',
            },
            {
              prompt: 'O que acontece quando a pergunta é ambígua?',
              options: [
                'A IA pede desculpas e encerra a conversa',
                'A IA escolhe uma interpretação qualquer e segue firme nela',
                'A IA responde todas as interpretações por padrão',
              ],
              correctIndex: 1,
              explanation:
                'Sem contexto, o modelo assume UMA leitura e continua — cabe a você dar contexto ou pedir que pergunte antes.',
            },
          ],
        },
        {
          title: 'Alucinação, viés e limites reais',
          description:
            'Citação falsa, referência inexistente, data deslocada: os erros típicos da IA, por que acontecem e o protocolo de verificação que protege sua nota.',
          durationMin: 16,
          content: `Todo usuário de IA precisa carregar um alerta no bolso: o chatbot erra com elegância. Esta aula mostra os erros típicos — e o protocolo para usar IA sem ser enganado.

## Alucinação: erro com cara de verdade
**Alucinação** é quando a IA inventa informação e a entrega com total convicção. Cenários reais que todo estudante encontra:
- **Citação falsa**: você pede frases célebres de um autor e recebe frases plausíveis que ele nunca disse — às vezes com livro e capítulo inventados.
- **Referência inexistente**: pede artigos sobre um tema e a lista vem formatada perfeitamente (autor, ano, revista), mas um ou dois títulos não existem em lugar nenhum.
- **Dado deslocado**: lei com número trocado, fórmula com sinal errado, evento em ano errado — dentro de uma resposta que, no resto, parece ótima.

O padrão é sempre o mesmo: o erro vem **embalado como acerto**. Formatação impecável, tom seguro, detalhes plausíveis.

## Por que isso acontece
Volte à aula anterior: o modelo prevê a continuação mais provável. Quando o tema é raro e os dados de treino são escassos, a "continuação provável" vira invenção coerente. Alucinação não é bug aleatório — é efeito colateral do próprio mecanismo. Por isso ferramentas com acesso à busca reduzem (não eliminam) o problema.

## Viés: o espelho torto dos dados
A IA aprende com texto produzido por gente — e gente carrega preconceito. Consequências práticas:
- Exemplos que reforçam estereótipo de profissão, papel social ou região.
- Cultura concentrada num contexto só (nomes, festas, moedas de um país) tratada como universal.
- Voz majoritária aparecendo como neutra. Em tema sensível, desconfie em dobro.

## O protocolo de verificação
- **Fatos, datas, leis, citações e números**: confirmar sempre em fonte real. Sem exceção.
- **Conceitos e explicações**: cruzar com o material da disciplina quando a nota depender disso.
- **Rascunhos, estruturas e ideias**: baixo risco — é aqui que a IA brilha.
- Regra de ouro: **IA nunca é fonte primária**. Ela pode te levar até a fonte; a fonte é que entra no trabalho.

## Sua tarefa
Peça a qualquer IA: "Cite 3 livros com autor, ano e editora sobre o impacto das redes sociais na atenção". Depois busque cada título no catálogo da biblioteca ou no buscador. Anote o que existia e o que não existia — essa é a sua vacina contra alucinação, aplicada em 10 minutos.`,
          quiz: [
            {
              prompt: 'O que é alucinação de IA?',
              options: [
                'Erro de digitação no texto gerado',
                'Informação inventada entregue com aparência de verdade',
                'Resposta recusada por questões de segurança',
              ],
              correctIndex: 1,
              explanation:
                'Alucinação é invenção coerente e confiante — justamente o tipo de erro mais difícil de notar de passagem.',
            },
            {
              prompt: 'Qual pedido exige verificação obrigatória?',
              options: [
                'Uma estrutura de tópicos para apresentação',
                'Datas e números de leis para um trabalho',
                'Um rascunho de e-mail para o professor',
              ],
              correctIndex: 1,
              explanation:
                'Fatos, datas e números vão direto para o trabalho e precisam de fonte real; rascunho e estrutura são território seguro.',
            },
            {
              prompt: 'A IA pode ser usada como fonte primária no trabalho?',
              options: [
                'Sim, se citar o nome do chatbot no rodapé',
                'Não — ela pode ajudar a encontrar fontes, mas a fonte é que se cita',
                'Sim, desde que seja a versão paga',
              ],
              correctIndex: 1,
              explanation:
                'IA é ponte até a fonte, nunca a fonte. Citar chatbot como referência primária é erro metodológico básico.',
            },
          ],
        },
        {
          title: 'O mapa das IAs de hoje: quem é quem',
          description:
            'ChatGPT, Copilot, Gemini e Claude em um mapa enxuto: pontos fortes de cada um, planos grátis em linhas gerais e qual abrir para cada situação.',
          durationMin: 13,
          content: `Você não precisa decorar o mercado inteiro. Precisa de um mapa enxuto das ferramentas que aparecem na vida de estudante — e de critérios para escolher entre elas.

## As quatro que importam agora
- **ChatGPT (OpenAI)**: o mais conhecido. Conversa longa e fluida, ótimo para explicar conceitos, revisar textos e simular perguntas de prova. É o canivete suíço geral.
- **Copilot (Microsoft)**: a IA integrada ao mundo Microsoft — Windows, navegador Edge, Word, Excel e PowerPoint. Para quem já escreve trabalho no Word e monta slide no PowerPoint, ela vive dentro das suas ferramentas.
- **Gemini (Google)**: a IA do ecossistema Google, conectada à busca e a serviços como Docs e Gmail. Forte quando o assunto pede informação recente.
- **Claude (Anthropic)**: concorrente direto do ChatGPT, reconhecido por textos longos bem escritos e análise de documentos extensos. Vale conhecer; não será o foco do curso.

## Grátis vs pago, sem números
Todas têm plano gratuito com limites: em picos de uso ou em dias intensos, a resposta pode ficar mais lenta, o modelo mais simples assumir ou o acesso pausar até o ciclo reiniciar. Os modelos mais capazes costumam ficar atrás da assinatura. Para este curso, **o grátis é suficiente**: prompt bom, contexto rico e verificação valem igual em qualquer versão. Assine só quando um limite real te travar por semanas.

## Qual abrir para cada situação
- Entender conceito, gerar questões, revisar texto: **ChatGPT** ou qualquer chatbot geral.
- Resumo dentro do Word, fórmula no Excel, esqueleto de slide: **Copilot**.
- Tema quente, edital novo, algo que mudou este mês: **Gemini**, pela conexão com a busca.
- Documento gigante para resumir em partes: **Claude** ou a ferramenta que aceitar o arquivo inteiro.

## A mentalidade certa
Não case com nenhuma. O que você aprende aqui — prompt, contexto, iteração, verificação — **transfere** para todas. Quem domina o método troca de ferramenta sem sofrimento; quem só aperta botão fica preso a uma.

## Sua tarefa
Monte seu "cardápio": escreva as 3 situações mais comuns da sua rotina de estudo (ex.: entender matéria, revisar texto, achar notícia de edital) e escolha a ferramenta inicial de cada uma, usando o mapa da aula. Esse cardápio será usado nos módulos seguintes — deixe-o num bloco de notas à mão.`,
          quiz: [
            {
              prompt: 'Qual IA está integrada ao Word, Excel e PowerPoint?',
              options: ['ChatGPT', 'Copilot', 'Gemini'],
              correctIndex: 1,
              explanation:
                'Copilot é a IA da Microsoft e mora dentro do Office e do Windows — é o diferencial dela para quem produz trabalho acadêmico.',
            },
            {
              prompt: 'Para um assunto que mudou esta semana, qual escolha faz mais sentido?',
              options: ['Gemini, pela conexão com a busca do Google', 'Qualquer uma, pois todas sabem tudo', 'Nenhuma: peça a um colega'],
              correctIndex: 0,
              explanation:
                'Modelos têm data de corte de conhecimento; a conexão com a busca é o que cobre informação recente — com fontes para conferir.',
            },
            {
              prompt: 'Sobre os planos gratuitos:',
              options: [
                'Não servem além de curiosidade',
                'Têm limites, mas bastam para aprender os fundamentos deste curso',
                'São idênticos aos pagos, apenas mais lentos',
              ],
              correctIndex: 1,
              explanation:
                'Os limites existem (velocidade, disponibilidade, modelo mais simples), mas o método ensinado aqui funciona em qualquer versão.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 2 · Suas primeiras ferramentas: Copilot e Gemini',
      description:
        'Conta criada, interface dominada e privacidade afinada: ChatGPT, Copilot e Gemini prontos para o uso real de estudante — tudo no plano gratuito.',
      lessons: [
        {
          title: 'ChatGPT e Copilot: conta, interface e app',
          description:
            'Criar a conta grátis em minutos, entender cada área da interface e levar o app para o celular — a base de tudo que vem depois.',
          durationMin: 12,
          content: `Hora de tirar a ferramenta da gaveta. Nesta aula você cria a conta, aprende a anatomia da interface e deixa o app no celular.

## Criando a conta
Tanto o ChatGPT quanto o Copilot funcionam com conta gratuita:
- Acesse o site oficial pelo navegador e use **Entrar com Google** ou seu e-mail — o Google é mais rápido e evita mais uma senha para esquecer.
- Confirme o e-mail se solicitado. Pronto: já pode conversar.
- O **Copilot** além do site próprio aparece no **Edge** (ícone na lateral) e no **Windows** — com o mesmo login Microsoft que você já usa no Office e no OneDrive.

## Anatomia da interface
As interfaces se parecem mais do que parecem à primeira vista:
- **Nova conversa**: o botão mais importante. Cada conversa é uma folha em branco — mudou de assunto radicalmente, abra outra para não contaminar o contexto.
- **Histórico** (barra lateral): as conversas ficam salvas e podem ser renomeadas. Dê nomes úteis ("Simulado sociologia", "Carta de apresentação estágio") — histórico nomeado é banco de material.
- **Campo de mensagem**: aceita texto longo colado e, nas duas ferramentas, anexar arquivos e imagens (o gratuito já permite o básico).
- **Instruções personalizadas** (no ChatGPT, dentro das configurações): um campo para descrever quem você é e como quer as respostas — preenchemos na aula 8, é peça-chave.

## O app no celular
Instale o aplicativo oficial com a mesma conta — o histórico sincroniza. O uso mobile muda o jogo: você revisa flashcards no ônibus, tira dúvida antes de entrar em sala, dita uma ideia pelo microfone. A IA que está no bolso é a que você realmente usa.

## Limites do plano gratuito, sem sustos
O plano gratuito tem **limites diários**: use com intensidade e, em algum momento, a resposta fica mais lenta ou o modelo mais simples assume até o ciclo reiniciar. Não é bloqueio — é dose. Estratégia de estudante: concentre as tarefas mais importantes no horário livre, e distribua o resto entre as ferramentas, porque cada uma tem o próprio limite.

## Sua tarefa
Crie (ou confirme) sua conta gratuita no ChatGPT, explore a interface por 5 minutos (nova conversa, histórico, configurações) e instale o app no celular. Para fechar: renomeie uma conversa com um nome de verdade — é o primeiro hábito profissional do curso.`,
          quiz: [
            {
              prompt: 'Quando abrir uma NOVA conversa?',
              options: [
                'Quando mudar radicalmente de assunto',
                'Nunca — uma conversa para sempre',
                'Só quando o app pedir',
              ],
              correctIndex: 0,
              explanation:
                'Conversa nova = contexto limpo. Misturar assuntos contamina o contexto e degrada as respostas seguintes.',
            },
            {
              prompt: 'O plano gratuito do ChatGPT:',
              options: [
                'Tem limites diários que podem reduzir velocidade ou o modelo disponível',
                'É idêntico ao plano pago',
                'Só funciona no computador',
              ],
              correctIndex: 0,
              explanation:
                'Os limites são de dose, não de bloqueio: nos dias intensos a resposta fica mais lenta ou o modelo mais simples assume.',
            },
            {
              prompt: 'Por que nomear as conversas no histórico?',
              options: [
                'Para o app funcionar mais rápido',
                'Para transformar o histórico em banco de material organizado',
                'Porque sem nome a conversa apaga sozinha',
              ],
              correctIndex: 1,
              explanation:
                'Histórico nomeado vira arquivo pessoal: reler uma conversa boa do mês passado vale mais que refazer tudo.',
            },
          ],
        },
        {
          title: 'Gemini: a IA que mora no mundo Google',
          description:
            'Por que o Gemini ganha quando o assunto é informação recente, como ele lê imagens e quando ele é a escolha certa na sua rotina.',
          durationMin: 14,
          content: `Se sua vida acadêmica gira em torno de Google — Drive, Docs, Gmail, Classroom —, o Gemini é a IA que já mora no seu prédio. Esta aula mostra quando ele ganha de todos.

## Onde encontrar e como entrar
Acesse **gemini.google.com** com sua conta Google (a mesma do Gmail, sem cadastro novo). No celular existe app próprio — e em vários aparelhos Android ele já atua como assistente principal. Interface familiar: campo de mensagem, histórico de conversas, botão de nova conversa.

## A vantagem que interessa: informação recente
Todo modelo tem uma **data de corte**: o limite do que ele aprendeu no treinamento. Pergunte a um chatbot comum sobre um edital publicado no mês passado e ele pode inventar. O Gemini trabalha conectado à **busca do Google**:
- Perguntas sobre fatos recentes vêm acompanhadas de **fontes linkadas** — você clica e confere, exatamente como manda o protocolo da aula 3.
- Para editais, notícias, preços, datas de prova e qualquer coisa que "mudou agora", é o primeiro da sua lista.

## Integrado ao ecossistema
O valor real aparece nos serviços:
- No **Gmail**, peça resumo de uma thread longa da coordenação ou ajuda para redigir a resposta.
- No **Docs**, peça resumo de um documento compartilhado ou melhoria de um parágrafo sem sair da tela.
- **Anexando imagens**: foto do quadro-branco da aula, print da tabela do professor, página escaneada do livro — o Gemini lê a imagem e explica, transcreve ou extrai os dados.

## Quando Gemini é a escolha certa
- O assunto envolve **informação atual** ou pede fonte clicável.
- O material já está no Google: Docs, Drive, foto de quadro.
- Você quer **conferir a fonte** sem sair da conversa.

E quando não é? Para conversas longas de estudo com muitas idas e voltas, o ChatGPT costuma dar mais conforto — e o Copilot ganha dentro do Office. Daí o cardápio da aula 4: ferramenta certa para cada tarefa.

## Sua tarefa
Abra o Gemini e teste a vantagem recente: pergunte sobre um assunto do seu curso que teve atualização recente (edital, evento, mudança de regra) e observe as fontes exibidas. Depois anexe a foto de um quadro ou página anotada e peça a transcrição. Dois testes, 10 minutos.`,
          quiz: [
            {
              prompt: 'Qual a grande vantagem do Gemini para estudantes?',
              options: [
                'É o único que entende português',
                'Trabalha conectado à busca do Google, cobrindo informação recente com fontes',
                'Não tem limites no plano gratuito',
              ],
              correctIndex: 1,
              explanation:
                'A conexão com a busca cobre a data de corte do modelo — e as fontes linkadas permitem verificar, como manda o protocolo.',
            },
            {
              prompt: 'Você fotografou o quadro-branco da aula. Qual ferramenta aproveita isso melhor?',
              options: [
                'Gemini, analisando a imagem anexada',
                'Nenhuma — IA não lê imagens',
                'Só o Copilot dentro do Excel',
              ],
              correctIndex: 0,
              explanation:
                'Anexar imagem é recurso nativo do Gemini: ele transcreve, explica e extrai dados de fotos e prints.',
            },
            {
              prompt: 'Data de corte do treinamento significa:',
              options: [
                'O horário em que a IA para de responder',
                'O limite temporal do conhecimento embutido no modelo',
                'O prazo de validade da sua conta',
              ],
              correctIndex: 1,
              explanation:
                'O modelo só "sabe" o que estava nos dados de treino; o que veio depois precisa de busca — ou vira alucinação.',
            },
          ],
        },
        {
          title: 'Copilot no Windows e no Office',
          description:
            'Rascunho no Word, fórmula no Excel, esqueleto de slide no PowerPoint e o assistente do Windows: o tour pelo Copilot dentro dos seus programas.',
          durationMin: 16,
          content: `O Copilot tem um superpoder que os outros não têm: morar dentro dos programas onde o trabalho acadêmico acontece. Word, Excel, PowerPoint e o próprio Windows — este é o tour.

## Copilot no Word: rascunho e resumo
Com o documento aberto, o Copilot aparece como um campo de escrita na margem:
- **Gerar rascunho**: descreva o que quer ("resumo de uma página sobre energia renovável para apresentação do 1º período") e ele escreve a primeira versão — que você edita como qualquer rascunho.
- **Resumir**: com um documento extenso aberto, peça o resumo em tópicos. Ótimo para material de disciplina que chega pronto e longo.
- **Ajustar**: selecione um parágrafo e peça versão mais formal ou mais curta, preservando o sentido.

## Copilot no Excel: a fórmula sem decoreba
A dor de todo estudante é a fórmula. Selecione os dados e descreva em português o que você quer ("somar as notas da coluna B apenas se a presença na coluna C for maior que 75%"). O Copilot sugere a fórmula pronta — e explica o que ela faz. Você aprende lendo a fórmula que ele montou, e na próxima já sabe escrever sozinho.

## Copilot no PowerPoint: do zero ao esqueleto
Descreva tema e público, e o Copilot monta um **esqueleto de apresentação** com slides, títulos e estrutura. Ele nunca entrega o trabalho pronto — entrega o esqueleto que você veste com o seu conteúdo. Quem já sofreu com "10 slides para amanhã" entende o valor.

## Copilot do Windows: o assistente do dia a dia
Na barra de tarefas, o Copilot do Windows responde sem você sair do que está fazendo: explicação rápida de um conceito, resumo do que está na tela, comparação com resultados da busca ao lado. É a IA de menor atrito da sua lista — zero troca de aba.

## O que dá para fazer sem pagar
A camada gratuita cobre o essencial: conversas no site e no Windows, e as funções básicas nos apps do Office — rascunho simples, resumo e sugestão de fórmula. Os recursos mais pesados ficam atrás da assinatura. Para o uso de estudante deste curso, o grátis abre todas as portas que vamos usar.

## Sua tarefa
Abra o Word com um texto qualquer da sua disciplina e faça o ciclo: peça um resumo em tópicos, depois selecione um parágrafo e peça versão mais formal. Compare com o original e anote o que a IA melhorou — e o que ela piorou.`,
          quiz: [
            {
              prompt: 'No Excel, a forma mais eficiente de usar o Copilot para fórmulas é:',
              options: [
                'Decorar a fórmula e digitar manualmente',
                'Descrever em português o que você quer calcular e pedir a sugestão',
                'Copiar fórmulas de fóruns sem entender',
              ],
              correctIndex: 1,
              explanation:
                'Você descreve o objetivo, o Copilot monta a fórmula e explica — a leitura da fórmula sugerida é que ensina.',
            },
            {
              prompt: 'O esqueleto de slides gerado pelo Copilot deve ser:',
              options: [
                'Apresentado como está',
                'Ponto de partida para você preencher com seu conteúdo',
                'Descartado, pois IA não sabe estruturar',
              ],
              correctIndex: 1,
              explanation:
                'O esqueleto poupa a estrutura; o conteúdo, os exemplos e a sua voz entram por cima — slides prontos de IA se notam de longe.',
            },
            {
              prompt: 'Sobre o Copilot gratuito:',
              options: [
                'Não existe versão gratuita',
                'Cobre conversas e funções básicas nos apps do Office',
                'Só funciona com assinatura anual',
              ],
              correctIndex: 1,
              explanation:
                'O gratuito dá o essencial para estudante; recursos mais pesados ficam na assinatura — nada disso bloqueia este curso.',
            },
          ],
        },
        {
          title: 'Configurando suas contas como um profissional',
          description:
            'A persona de estudante nas instruções personalizadas, como funciona a memória da conversa e a linha vermelha de privacidade que você nunca cruza.',
          durationMin: 13,
          content: `A diferença entre amador e profissional não está na ferramenta — está na configuração. Nesta aula você afina as contas e aprende a linha vermelha de privacidade.

## Instruções personalizadas: sua persona de estudante
No ChatGPT (Configurações → Instruções personalizadas) e nos equivalentes das outras ferramentas, existe um campo onde você descreve **quem você é e como quer ser atendido**. Toda conversa nova já nasce com esse contexto. Modelo para adaptar:

"Sou estudante de [curso] no [período]. Estudo [principais matérias]. Prefiro respostas em português do Brasil, diretas e com exemplos concretos. Explique conceitos difíceis com uma analogia simples antes do detalhe técnico. Quando eu pedir exercícios, mostre também os passos do raciocínio."

Configure uma vez, colha em todas: você para de repetir "sou calouro, explica devagar" em cada conversa nova.

## A memória da conversa (e seus limites)
Dentro de UMA conversa, a IA lembra de tudo que foi dito — por isso contexto rico melhora as respostas. Mas atenção:
- Entre conversas diferentes, o comportamento volta ao padrão, a menos que a ferramenta tenha recurso de memória ativado — confira nas configurações o que está ligado.
- Conversa longa demais dilui o começo: se a IA "esquecer" uma instrução, recoloque o essencial ou recomece limpo.

## Privacidade: a linha que você não cruza
Antes de colar qualquer coisa, pergunte: **essa informação é minha para compartilhar?** Nunca cole:
- **Dados pessoais seus ou de colegas**: CPF, endereço, telefone, notas com nome, situação de saúde. Sua nota é sua; colada, vira dado em servidores de terceiros.
- **Documentos de terceiros**: trabalho de colega, material de quem você orienta, documento da empresa onde estagia. Colar o material de outra pessoa sem autorização quebra regras e confiança de gente real.
- **Provas e avaliações em andamento**: além da ética, instituições tratam isso como fraude — e detecção existe.

Quando o conteúdo é seu e não identifica ninguém (um parágrafo seu para revisar, um enunciado anônimo), o risco é baixo. É esse uso que o resto do curso vai fazer.

## Sua tarefa
Escreva sua persona de estudante seguindo o modelo da aula (4 a 6 linhas) e cole no campo de instruções personalizadas do ChatGPT. Faça uma conversa teste e veja se o tom já nasce certo. Confira também, nas configurações, o que está ativado de memória.`,
          quiz: [
            {
              prompt: 'Para que servem as instruções personalizadas?',
              options: [
                'Deixam a resposta mais rápida',
                'Dão contexto fixo sobre você em toda conversa nova, sem precisar repetir',
                'Desativam os limites do plano gratuito',
              ],
              correctIndex: 1,
              explanation:
                'É o contexto permanente da sua persona: curso, nível e preferências aplicados automaticamente em cada conversa.',
            },
            {
              prompt: 'Qual item é permitido colar numa IA?',
              options: [
                'O CPF de um colega, para formatar um formulário',
                'Um parágrafo seu, sem dados de identificação',
                'A prova em andamento da disciplina',
              ],
              correctIndex: 1,
              explanation:
                'Conteúdo seu e anônimo é uso de baixo risco; dados pessoais, material de terceiros e avaliação em andamento são linha vermelha.',
            },
            {
              prompt: 'A IA "esqueceu" a instrução do começo de uma conversa longa. O que fazer?',
              options: [
                'Repetir tudo com raiva na mesma conversa',
                'Recolocar o essencial ou abrir conversa nova com contexto limpo',
                'Comprar o plano pago para resolver',
              ],
              correctIndex: 1,
              explanation:
                'Conversas longas diluem o início; reforçar o essencial ou recomeçar limpo devolve a qualidade da resposta.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 3 · Primeiros prompts: conversar bem com a IA',
      description:
        'O prompt de 4 peças, os follow-ups que refinam e os pedidos que ensinam: aqui você aprende a conversar com a IA como quem dá briefing — não como quem chuta.',
      lessons: [
        {
          title: 'A anatomia de um bom prompt',
          description:
            'Papel, contexto, tarefa e formato: o esqueleto de 4 peças, com um prompt ruim reescrito do zero e o antes/depois que você nunca esquece.',
          durationMin: 18,
          content: `Este é o módulo que separa quem "usa IA" de quem trabalha com IA. Um prompt não é pergunta — é briefing. E todo briefing bom tem a mesma anatomia.

## O esqueleto de 4 peças
- **Papel**: quem a IA deve ser. "Você é um professor de cálculo experiente..." — isso ativa o vocabulário e o nível certos.
- **Contexto**: quem você é e qual a situação. "Sou calouro de engenharia, tenho prova na sexta e o conteúdo que mais erro é limite."
- **Tarefa**: o que você quer, com verbo claro. "Crie 5 questões de limite com resolução comentada, do fácil ao difícil."
- **Formato**: como entregar. "Em lista numerada, com a resolução após cada questão, sem usar termos que ainda não estudamos."

Quatro frases. Trinta segundos digitando. A diferença na resposta é brutal.

## Antes e depois, na prática
**Prompt ruim**: "me ajuda com direito constitucional"

Por que falha: sem papel (que nível?), sem contexto (para quê?), tarefa vaga (explicar? resumir? treinar?) e formato nenhum. A IA precisa adivinhar — e adivinha mal.

**Prompt profissional**: "Você é um professor de Direito Constitucional de cursinho. Sou estudante do 3º período com dificuldade em controle de constitucionalidade. Monte um roteiro de estudo de 40 minutos para esta noite, com os conceitos essenciais, um exemplo de cada e 3 perguntas de autoavaliação no final. Formato: tópicos com tempo estimado em cada etapa."

Compare as respostas dos dois e você nunca mais escreve o primeiro.

## Os refinadores que valem ouro
Guarde estes sufixos e use sempre que precisar:
- "...para um estudante do 2º período" — limita o nível.
- "...em no máximo 10 linhas" — limita o tamanho.
- "...com um exemplo do cotidiano de estudante" — concretiza.
- "...se faltar informação, pergunte antes de responder" — mata a adivinhação.

O último é dos melhores: transforma a IA de adivinhadora em parceira que faz perguntas de volta.

## O erro número 1
Prompt longo não é prompt bom — prompt **completo** é. Duas linhas com papel, contexto, tarefa e formato ganham de um parágrafo de desabafo sem direção.

## Sua tarefa
Pegue uma dúvida real que você precisa resolver (matéria, texto para revisar, planejamento) e escreva o prompt com as 4 peças antes de colar na IA. Depois rode o prompt curto original na mesma ferramenta e compare as duas respostas. Guarde as duas — é o material de comparação da próxima aula.`,
          quiz: [
            {
              prompt: 'As 4 peças do prompt completo são:',
              options: [
                'Papel, contexto, tarefa e formato',
                'Pergunta, resposta, exemplo e resumo',
                'Saudação, pedido, agradecimento e despedida',
              ],
              correctIndex: 0,
              explanation:
                'Papel ativa o nível certo, contexto personaliza, tarefa dirige e formato define a entrega — briefing completo em 4 frases.',
            },
            {
              prompt: 'O que falta no prompt "me ajuda com cálculo"?',
              options: ['Educação', 'Tudo: papel, contexto, tarefa específica e formato', 'Nada — curto e direto é o ideal'],
              correctIndex: 1,
              explanation:
                'Sem as peças, a IA adivinha nível, objetivo e entrega — e você recebe a resposta média de todos que já perguntaram isso.',
            },
            {
              prompt: 'O refinador "se faltar informação, pergunte antes de responder" serve para:',
              options: [
                'Deixar a resposta mais longa',
                'Transformar a IA em parceira que esclarece em vez de adivinhar',
                'Agradar o modelo',
              ],
              correctIndex: 1,
              explanation:
                'Ele autoriza a IA a pedir o que falta — o antídoto direto contra a resposta arbitrária para pergunta ambígua.',
            },
          ],
        },
        {
          title: 'Pedir explicações e resumos que ensinam',
          description:
            'O teste dos 12 anos, o resumo com tamanho, nível e formato definidos e o ciclo de questões que transforma o chatbot em professor particular.',
          durationMin: 16,
          content: `A pergunta "explique isso" produz resposta de enciclopédia. A pergunta certa produz resposta que **ensina você**. Esta aula é sobre os pedidos que transformam o chatbot em professor particular.

## O teste dos 12 anos
"Explique como se eu tivesse 12 anos" (ou "use uma analogia simples") força a IA a trocar jargão por ideia. Teste com um conceito do seu curso: a resposta com analogia entra na cabeça; a enciclopédica dorme no histórico. Depois da analogia, peça o degrau seguinte: "agora explique com os termos técnicos corretos". Você sobe do simples ao formal sem perder o chão.

## Resumir um texto que você cola
Cole o texto (ou anexe o arquivo) e especifique três coisas: **tamanho**, **nível** e **formato**. Exemplo:

"Resuma o texto abaixo em no máximo 8 tópicos, mantendo os termos técnicos da disciplina, e destaque no final as 3 ideias mais cobradas em prova."

Repare no "mantendo os termos técnicos": ele evita o resumo que simplifica demais — erro comum quando você só pede "resuma". Para material de prova, acrescente "aponte o que ficou ambíguo ou incompleto no texto": a IA expõe buracos que você nem sabia que existiam.

## Perguntas de estudo sob medida
O pedido genérico "gere questões" gera questões genéricas. O profissional especifica:
- "Gere 5 questões dissertativas curtas sobre o conteúdo acima, do básico ao difícil."
- "Escreva a resposta esperada em 3 linhas depois de cada questão."
- "Depois eu te envio minha resposta — corrija com comentário por tópico."

Esse ciclo (questão → sua resposta → feedback) é o simulado mais barato que existe, e o feedback por ponto é o que aponta se você errou por conceito ou por desatenção.

## Os controles de precisão
- **Tamanho**: "em até 10 linhas", "em 3 tópicos", "em uma tabela" — IA sem limite enche linguiça.
- **Nível**: "para 1º período", "sem usar cálculo", "assumindo que eu já sei estatística básica".
- **Formato**: tabela para comparar, lista para passos, parágrafo para conceito — diga qual.

E se a resposta sair no nível errado? Não recomece do zero: corrija a régua — "reduza o nível técnico" ou "agora assuma que eu entendi a analogia".

## Sua tarefa
Escolha um texto real da sua disciplina (artigo, capítulo, slide em texto), cole na IA e peça o resumo com tamanho, nível e formato definidos, mais as 3 ideias mais cobráveis. Depois gere 3 questões, responda uma e peça o feedback.`,
          quiz: [
            {
              prompt: 'Ao pedir um resumo, o que você deve especificar?',
              options: ['Só o tema', 'Tamanho, nível e formato desejados', 'O nome do professor'],
              correctIndex: 1,
              explanation:
                'Tamanho evita linguiça, nível ajusta a linguagem e formato define a entrega — sem isso sai enciclopédia.',
            },
            {
              prompt: 'Para que serve "explique como se eu tivesse 12 anos"?',
              options: [
                'Trocar jargão por analogia e ganhar o entendimento básico',
                'Deixar a resposta engraçada',
                'Reduzir o tempo de resposta',
              ],
              correctIndex: 0,
              explanation:
                'A analogia cria o alicerce; depois você sobe com "agora use os termos técnicos" — entendeu e aprendeu o vocabulário.',
            },
            {
              prompt: 'O ciclo de estudo mais eficiente mostrado na aula é:',
              options: [
                'Ler a resposta da IA e fechar o app',
                'Gerar questão → responder você → pedir feedback da IA',
                'Pedir a IA para responder tudo por você',
              ],
              correctIndex: 1,
              explanation:
                'Responder antes de ver a correção é o que fixa; o feedback por ponto separa erro de conceito de erro de desatenção.',
            },
          ],
        },
        {
          title: 'Iterar: a resposta inicial nunca é a final',
          description:
            'Follow-ups de 5 segundos que sobem o nível da resposta, o poder de pedir variações e o protocolo de 3 voltas dos profissionais.',
          durationMin: 14,
          content: `A pergunta que define o amador: "a IA respondeu — e agora?" A resposta inicial é um rascunho de conversa. O profissional responde de volta. Isso se chama **iteração**, e é onde mora a qualidade.

## Por que a 1ª resposta sai mediana
Lembre da aula 2: a IA prevê a resposta mais provável para a média das pessoas. Você quer a resposta para VOCÊ — e ela chega em duas ou três voltas de conversa. Aceitar a primeira resposta é contratar um redator e não dar feedback nenhum.

## Os follow-ups que resolvem quase tudo
Depois da resposta inicial, você tem à mão:
- **"Mais curto" / "resuma em 3 tópicos"** — para quando veio novela.
- **"Com um exemplo concreto de estudante"** — para quando veio teoria seca.
- **"Em tópicos" / "em tabela" / "numerado"** — reformata sem refazer.
- **"Simplifique o trecho X"** — cirurgia pontual, sem descartar o resto.
- **"Explique por que essa é a melhor opção"** — expõe o raciocínio e permite crítica.

Cada follow-up custa 5 segundos e sobe um nível a resposta.

## Pedir variações (o superpoder das ideias)
Para tarefa criativa — título de trabalho, abertura de apresentação, abordagem de e-mail — peça em lote: "dê 5 variações, cada uma com uma abordagem diferente (formal, provocativa, prática...)". Depois escolha UMA e peça o desenvolvimento. Variar em lote revela caminhos que a primeira resposta nem considerava.

## O protocolo de 3 voltas
Rotina que vale para quase tudo:
1. **1ª volta**: prompt completo (anatomia da aula 9). Avalie o que está bom e o que está longe.
2. **2ª volta**: follow-up corrigindo a maior distância ("menos técnico", "com exemplo", "mais curto").
3. **3ª volta**: refinamento final do tipo "mantenha tudo, mas mude X" — indicar o que preservar evita regredir.

Três voltas custam 1 minuto e a resposta final fica em outro patamar. Duas dicas de ouro: diga também o que está **bom** ("mantenha o exemplo, só mude o tom") — a IA preserva o que você confirma; e quando a conversa descarrilar de vez, não conserte no tapa: abra conversa nova com o prompt refinado que você já sabe fazer.

## Sua tarefa
Volte à tarefa da aula anterior (resumo + questões). Aplique o protocolo de 3 voltas: avalie a resposta, dê um follow-up de correção e finalize com um refinamento que preserve o que era bom. Compare a versão final com a inicial e anote a diferença em duas linhas.`,
          quiz: [
            {
              prompt: 'Por que NÃO aceitar a primeira resposta?',
              options: [
                'Porque ela é cobrada à parte',
                'Porque ela é a resposta média — a sua chega com iteração',
                'Porque a primeira sempre vem errada',
              ],
              correctIndex: 1,
              explanation:
                'A 1ª resposta mira a média dos usuários; seus follow-ups são o feedback que leva a resposta ao seu caso.',
            },
            {
              prompt: 'Qual follow-up preserva o que já está bom?',
              options: ['Recomeçar do zero', '"Mantenha o exemplo, só ajuste o tom"', '"Responda tudo de novo"'],
              correctIndex: 1,
              explanation:
                'Indicar o que preservar ("mantenha o exemplo") impede que o refinamento desfaça o que já estava ótimo.',
            },
            {
              prompt: 'Para títulos de trabalho e ideias, a tática recomendada é:',
              options: [
                'Pedir 5 variações com abordagens diferentes e escolher uma',
                'Aceitar a primeira ideia',
                'Pedir para outra IA responder igual',
              ],
              correctIndex: 0,
              explanation:
                'Variações em lote abrem caminhos que a resposta única não considera; escolher com critério é o seu papel.',
            },
          ],
        },
        {
          title: 'Gerar ideias e planejar com IA',
          description:
            'Brainstorm com categorias que forçam variação, cronograma de prova com os seus dados reais e checklists que lembram o que você esqueceria.',
          durationMin: 17,
          content: `Explicação e resumo são o básico. O uso que muda a rotina de um estudante é outro: **estruturar decisões** — ideias, planos, cronogramas. Aqui a IA brilha como parceira de raciocínio.

## Brainstorm estruturado (não bagunçado)
Peça assim: "Liste 8 temas possíveis para meu trabalho de [disciplina] sobre [área]. Varie o ângulo: 2 técnicos, 2 com foco em caso prático, 2 polêmicos e 2 ligados à minha região. Para cada um, uma linha explicando o ângulo."

O segredo está em **limitar e variar**: sem as categorias, a IA devolve a mesma ideia com nomes diferentes. Com elas, você recebe um cardápio de verdade. Depois: "ajude a reduzir a 3 finalistas usando o critério de quantidade de material disponível para pesquisa". Escolher com critério é o que transforma lista em decisão.

## Cronograma de estudos para prova
O pedido profissional:
"Minha prova de [matéria] é em [dias restantes]. Tenho [horas livres por dia] e estes conteúdos: [lista]. Monte um cronograma em blocos, deixando os últimos 2 dias para revisão e simulado. Priorize os tópicos em que errei no último teste: [tópicos]."

Note o que entra: prazo real, horas reais, conteúdo real e histórico de erro. A IA devolve um plano que respeita a SUA vida — e você ajusta em conversa ("não estudo às sextas", "faço faculdade de manhã").

## Checklist de projeto e trabalho
Para qualquer entrega (seminário, projeto, relatório): "monte o checklist completo para um seminário de 15 minutos sobre [tema], do roteiro aos slides, incluindo ensaio e plano B para o dia da apresentação. Ordene pelo que precisa começar primeiro, com prazo sugerido para cada item."

O checklist da IA costuma lembrar do que você esqueceria: ensaio em voz alta, teste do projetor, entrega com folga.

## Parceira, não oráculo
Três regras para não se enganar:
- A IA **estrutura** — você **decide**. O critério de escolha é sempre seu.
- Cronograma sem execução é ficção: revise o plano com ela toda semana ("atrasei X, refaça a partir de hoje").
- Para escolhas de vida (carreira, curso, transferência), use a IA para organizar prós e contras — nunca como resposta final.

## Sua tarefa
Escolha a prova ou entrega mais próxima da sua agenda real e gere o plano completo (cronograma ou checklist) com todos os dados da aula: prazo, horas disponíveis, conteúdo e prioridades. Depois identifique o item mais frágil do plano e peça à IA uma alternativa para ele.`,
          quiz: [
            {
              prompt: 'No brainstorm com IA, por que dividir o pedido em categorias?',
              options: [
                'Para a resposta ficar mais longa',
                'Para forçar variação real em vez de ideias parecidas',
                'Para economizar tokens',
              ],
              correctIndex: 1,
              explanation:
                'Sem categorias o modelo repete a mesma ideia com roupas diferentes; com elas, cada grupo empurra para um ângulo novo.',
            },
            {
              prompt: 'Um cronograma de estudos útil exige da IA:',
              options: [
                'Só o nome da matéria',
                'Prazo, horas reais disponíveis, conteúdo e histórico de dificuldades',
                'A nota que você quer tirar',
              ],
              correctIndex: 1,
              explanation:
                'Plano que respeita a sua vida usa os seus dados reais — e o histórico de erro define a prioridade dos blocos.',
            },
            {
              prompt: 'IA no planejamento funciona como:',
              options: [
                'Oráculo que decide por você',
                'Parceira que estrutura; a decisão e o critério são seus',
                'Substituta da sua agenda',
              ],
              correctIndex: 1,
              explanation:
                'A IA organiza opções e estrutura planos; o critério, a escolha e a execução continuam sendo seus.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 4 · IA no dia a dia de estudante',
      description:
        'Flashcards e simulados que ensinam, revisão em camadas, imagens e transcrições, e o kit final por escrito: a IA aplicada à vida real de estudante, com ética em dia.',
      lessons: [
        {
          title: 'Estudar com IA (sem trapacear)',
          description:
            'Flashcards interativos, simulado com correção comentada, método Feynman com correção rigorosa e revisão espaçada — aprender COM a IA, nunca PELA IA.',
          durationMin: 19,
          content: `Aqui está a linha que separa estudante esperto de estudante em apuros: a IA pode fazer POR você ou COM você. Esta aula é o manual do COM — ferramentas que fazem você aprender de verdade.

## Flashcards gerados sob medida
Cole o conteúdo e peça: "gere 10 flashcards em formato pergunta e resposta sobre o texto, um conceito por card, com respostas curtas. Depois me teste um por um: mostre a pergunta, espere minha resposta e me corrija." O modo interativo vale muito mais que a lista pronta — responder antes de ver corrige o que a leitura passiva nunca corrige.

## Simulado com feedback
Além dos cards, monte a prova: "crie um simulado com 5 questões no estilo da minha disciplina; ao final, corrija minhas respostas com avaliação geral e comentário por questão." O comentário por questão é o ouro: ele mostra se você errou por conceito ou por desatenção — e cada erro tem remédio diferente.

## O método Feynman com correção
Físico que explicava tudo de forma simples, método eterno: explique o conceito com suas palavras, como para uma criança, e veja onde trava. Com IA: "vou explicar o que entendi de [conceito]. Aja como professora rigorosa: aponte onde minha explicação está errada, vaga ou incompleta, e me faça uma pergunta que exponha a falha."

Você escreve sua explicação e a IA disseca — as falhas apontadas são exatamente o que estudar a seguir. Nenhuma técnica de estudo localiza seus buracos com essa precisão.

## Revisão espaçada (o anti-decoreba)
Estudar tudo na véspera evapora. Revisão espaçada revisita o conteúdo em intervalos crescentes. Peça: "gere meu plano de revisão espaçada para estes tópicos, com rodadas no dia seguinte, depois de 3 dias e depois de uma semana, marcando o que revisar em cada rodada." Coloque no calendário e siga — 15 minutos por rodada bastam.

## A linha ética (sem hipocrisia)
- IA para **gerar questões, explicar e corrigir**: aprendizado legítimo. Sempre.
- IA para **responder a avaliação por você**: fraude. Não é zona cinzenta.
- Se a dúvida é "isso pode?", use a pergunta-teste: "na prova, eu saberia fazer sem a IA?" Se a resposta é não, use a IA agora para aprender — nunca para pular a etapa.

## Sua tarefa
Pegue o conteúdo da próxima prova e execute o ciclo completo: 10 flashcards interativos + a explicação Feynman de UM conceito com correção rigorosa. Anote as duas falhas que a IA apontou — elas são a sua próxima sessão de estudo.`,
          quiz: [
            {
              prompt: 'O modo mais valioso de usar flashcards de IA é:',
              options: [
                'Ler a lista pronta uma vez',
                'Modo interativo: responder antes de ver a correção',
                'Imprimir e colar na parede',
              ],
              correctIndex: 1,
              explanation:
                'Responder antes de ver força a recuperação da memória — o mecanismo que a leitura passiva não ativa.',
            },
            {
              prompt: 'No método Feynman com IA, o papel dela é:',
              options: [
                'Explicar por você',
                'Dissecar sua explicação e apontar erros, vaguidade e falhas',
                'Gerar o resumo final da matéria',
              ],
              correctIndex: 1,
              explanation:
                'Você explica, a IA corrige como professora rigorosa — as falhas apontadas são o mapa do que estudar.',
            },
            {
              prompt: 'Qual uso é legítimo?',
              options: [
                'IA responder a avaliação por você',
                'IA gerar questões e corrigir suas respostas para você aprender',
                'Colar a resposta da IA direto na prova',
              ],
              correctIndex: 1,
              explanation:
                'A régua é simples: gerar prática e feedback ensina; responder por você pula a etapa que a prova vai cobrar.',
            },
          ],
        },
        {
          title: 'Textos, e-mails e trabalhos com acabamento pro',
          description:
            'Revisão em 3 camadas, adaptação de tom sem perder a sua voz e a regra da transparência sobre uso de IA nas entregas.',
          durationMin: 16,
          content: `Seu texto bom merece acabar ótimo. A diferença entre o trabalho que impressiona professor e o que só "está certo" mora na revisão — etapa que a IA faz muito bem, se você souber pedir.

## Revisão em camadas (nunca de uma vez)
Pedir "revise meu texto" mistura tudo e a saída fica superficial. Passe em camadas:
- **Camada 1 — erros**: "corrija ortografia, pontuação e concordância do texto abaixo. Liste as correções em tabela: trecho original, correção e motivo." A tabela te ensina o erro — na próxima você não comete.
- **Camada 2 — clareza**: "aponte os 3 trechos mais confusos e reescreva cada um, sem mudar o sentido." Clareza é problema pontual, não texto inteiro.
- **Camada 3 — estrutura**: "avalie se a introdução entrega o que a conclusão cumpre." Aí sim, o todo.

## Adaptar o tom sem reescrever o conteúdo
O mesmo conteúdo serve a destinatários diferentes — o que muda é o tom:
- **E-mail formal**: "reescreva este e-mail para um professor: educado, direto, sem gíria, com saudação e despedida. Mantenha meu pedido intacto."
- **Mensagem para o grupo de trabalho**: "versão descontraída e curta, mas clara sobre o prazo."
- **Roteiro de apresentação**: "transforme estes parágrafos em frases curtas que eu possa falar olhando para a turma."

O guarda-chuva em todos os pedidos é "mantenha o sentido" — é ele que impede a IA de reescrever a ideia dela por cima da sua.

## O texto é seu: transparência obrigatória
Regra que protege você: **IA revisa e sugere; a autoria é sua**. E sobre declaração de uso:
- Instituições e professores têm regras próprias sobre IA — **a exigência varia e verificar é sua responsabilidade**. Leia o regulamento antes de cada entrega.
- Quando a instituição exigir, **declare o uso** de forma simples e honesta: "revisão ortográfica e de clareza com auxílio de IA; conteúdo e estrutura de minha autoria."
- Declarar uso permitido nunca prejudica; omitir uso proibido destrói.

## O que NÃO terceirizar
A tese central do trabalho, a conclusão que você defende e a sua voz no texto: é isso que o professor avalia — e o que a IA não pode fabricar por você. Use-a no acabamento, não na essência.

## Sua tarefa
Pegue um texto seu de pelo menos 3 parágrafos e rode as 3 camadas de revisão, na ordem, pedindo a tabela de correções na camada 1. Depois adapte o mesmo conteúdo para dois tons (formal e descontraído) e compare o que mudou entre eles.`,
          quiz: [
            {
              prompt: 'Por que revisar em camadas em vez de pedir "revise meu texto"?',
              options: [
                'Para gastar mais tempo na IA',
                'Porque cada camada (erros, clareza, estrutura) pede análise própria e sai mais profunda',
                'Porque a IA recusa revisão completa',
              ],
              correctIndex: 1,
              explanation:
                'Pedido único gera revisão rasa; camadas separadas produzem tabela de correções, ajustes de clareza e leitura estrutural.',
            },
            {
              prompt: 'O que impede a IA de apagar sua voz ao reescrever?',
              options: [
                'Pedir "mantenha o sentido" e indicar o que preservar',
                'Escrever o pedido em inglês',
                'Usar só a camada 1',
              ],
              correctIndex: 0,
              explanation:
                'O guarda-chuva "mantenha o sentido" + apontar o que preservar mantém a sua ideia e a sua voz intactas.',
            },
            {
              prompt: 'Sobre declarar o uso de IA em trabalhos:',
              options: [
                'Nunca é preciso declarar',
                'Verifique as regras da instituição e declare quando exigido — a responsabilidade é sua',
                'Só declare se descobrirem',
              ],
              correctIndex: 1,
              explanation:
                'A exigência varia por instituição; ler a regra e declarar quando devido é o que protege você.',
            },
          ],
        },
        {
          title: 'IA criativa: imagens, áudio e transcrição',
          description:
            'Imagens coerentes para apresentação, transcrição de aula gravada virando resumo e áudio de revisão para estudar no ônibus — usos práticos e honestos.',
          durationMin: 15,
          content: `Nem tudo no seu estudo é texto. As IAs generativas também criam imagens e voz — e, no caminho inverso, transformam áudio em texto. Este é o módulo criativo (e útil) do kit.

## Imagens para apresentação (e o que evitar)
No Copilot e no Gemini dá para gerar imagens descrevendo a cena: "ilustração simples e minimalista de uma cidade com linhas de energia conectando os prédios, estilo plano, azul e branco, sem texto".

Regras para não virar piada no seminário:
- **Estilo coerente**: peça sempre o mesmo estilo (plano, minimalista) nas imagens de um mesmo trabalho.
- **Sem texto na imagem**: a IA erra letras — texto entra no slide, não na imagem.
- **Uso honesto**: imagem gerada é ilustração, não documento. Em trabalho acadêmico, siga a regra da instituição para indicar quando uma figura foi gerada por IA.

## Transcrição: a aula que você pode reler
Gravou a aula (com autorização do professor — regra básica)? Transcrever manualmente é um domingo perdido. Apps de anotação com gravação e serviços de reunião já convertem áudio em texto nativamente:
- Transcreva e mande o texto para o chatbot: "resuma esta transcrição em tópicos e destaque o que o professor repetiu ou enfatizou — ênfase costuma virar prova".
- Peça também: "liste as dúvidas que a turma fez e as respostas dadas" — é conteúdo que não existe em slide nenhum.

## Áudio de revisão: estudar com os ouvidos
Vários chatbots leem a resposta em voz alta, e apps de IA convertem texto em áudio narrado. A jogada de estudante:
- Pegue o seu resumo (das aulas anteriores) e ouça no ônibus, na academia, na fila.
- Ouça uma vez passivo e outra pausando para antecipar o que vem — a segunda virou revisão ativa.

## Combinações que valem um semestre
- Aula gravada → transcrição → resumo em tópicos → flashcards → áudio de revisão: o mesmo conteúdo em 4 formatos, um para cada momento do dia.
- Imagem gerada para abrir o seminário + diagrama feito à mão no meio: misture sem culpa — ferramenta certa para cada peça.

## Sua tarefa
Escolha UMA das três jogadas e execute hoje: gere uma imagem no estilo do seu próximo seminário (sem texto), ou transcreva um áudio curto seu e peça o resumo, ou converta um resumo em áudio e ouça uma vez. Anote qual delas entrou na sua rotina.`,
          quiz: [
            {
              prompt: 'Ao gerar imagens para um seminário, você deve:',
              options: [
                'Pedir texto dentro da imagem',
                'Manter um estilo coerente e deixar o texto para o slide',
                'Usar um estilo diferente em cada imagem',
              ],
              correctIndex: 1,
              explanation:
                'A IA erra letras e o estilo bagunçado denuncia amador: imagem coerente sem texto, texto no slide.',
            },
            {
              prompt: 'O que pedir ao resumir a transcrição de uma aula?',
              options: [
                'Só "resuma"',
                'Tópicos + o que o professor enfatizou ou repetiu',
                'A lista de presença da turma',
              ],
              correctIndex: 1,
              explanation:
                'Repetição e ênfase costumam virar prova; as dúvidas da turma também rendem conteúdo que não está no slide.',
            },
            {
              prompt: 'Para ouvir resumos como áudio de revisão, a versão ativa é:',
              options: [
                'Ouvir uma vez e dormir',
                'Ouvir pausando para antecipar o que vem depois',
                'Aumentar a velocidade ao máximo',
              ],
              correctIndex: 1,
              explanation:
                'Antecipar o próximo ponto antes de ouvir transforma o áudio de consumo passivo em revisão ativa.',
            },
          ],
        },
        {
          title: 'Projeto final: seu kit pessoal de IA',
          description:
            'O cardápio final de ferramentas, a rotina semanal que sustenta o hábito, o checklist de segurança e ética — e a ponte para Engenharia de Prompts.',
          durationMin: 20,
          content: `Última aula do primeiro curso da trilha. Nada de teoria nova: você sai daqui com o kit montado, testado e por escrito — pronto para rodar no próximo semestre.

## O kit: uma ferramenta, um papel
Recapitule seu cardápio (aula 4) e feche os papéis:
- **ChatGPT**: estúdio de estudo — explicações, flashcards, simulados, Feynman.
- **Copilot**: estúdio de produção — Word, Excel, PowerPoint e o dia a dia do Windows.
- **Gemini**: estúdio de atualidade — informação recente com fontes, imagens e o material que mora no Google.

Uma cobre a outra quando necessário; o que importa é saber qual abrir primeiro.

## Sua rotina semanal (o que o curso te deixa)
O kit vira rotina quando tem horário. Estrutura que funciona:
- **Domingo (15 min)**: gerar o plano da semana — provas, entregas, blocos de estudo.
- **Depois de cada aula (10 min)**: resumo + flashcards do conteúdo do dia (aula 13).
- **Antes de cada entrega (30 min)**: revisão em camadas do texto (aula 14) + checklist (aula 12).
- **Todo dia, no bolso**: áudio de revisão (aula 15).

## Checklist de segurança e ética (cole no seu mural)
- Fatos, datas e citações: **sempre verificar em fonte real**. IA nunca é fonte primária.
- Nunca colar dados pessoais, documento de terceiros ou avaliação em andamento.
- Regras da instituição sobre IA: **verificadas e seguidas**, com declaração de uso quando exigida.
- A 1ª resposta nunca é a final: iterar (aula 11).
- Na dúvida entre copiar e aprender: **aprender**. Sempre.

## O que você já sabe fazer
Você chega aqui com: mapa do mercado de IA, três ferramentas configuradas, o prompt de 4 peças no dedo, o protocolo de iteração, a rotina de estudo assistido e a linha ética clara. Isso é mais método do que a maioria dos usuários de IA.

## A ponte: Engenharia de Prompts
Este curso te ensinou a conversar bem. O próximo da trilha — **Engenharia de Prompts** — ensina a projetar: cadeias de prompts, estruturas reutilizáveis, papéis avançados, saídas em formato rígido e automação de tarefas repetidas. Se aqui você aprendeu a pedir, lá você aprende a especificar como um profissional.

## Sua tarefa (projeto final)
Escreva seu "Kit Pessoal de IA" num documento de uma página: as 3 ferramentas com os papéis que você definiu, a rotina semanal com horários reais, o checklist de ética e os 3 prompts que você mais vai reutilizar (prontos, com as 4 peças). Salve — e comece a usar amanhã.`,
          quiz: [
            {
              prompt: 'No kit pessoal, o papel do Gemini é:',
              options: [
                'Estúdio de atualidade: informação recente com fontes',
                'Estúdio de produção no Office',
                'Substituir os outros dois em tudo',
              ],
              correctIndex: 0,
              explanation:
                'Cada ferramenta tem um papel: Gemini cobre atualidade e fontes clicáveis; produção fica com o Copilot.',
            },
            {
              prompt: 'O que o checklist de ética do curso manda SEMPRE fazer?',
              options: [
                'Verificar fatos e datas em fonte real',
                'Colar só metade da prova na IA',
                'Usar a IA paga em vez da grátis',
              ],
              correctIndex: 0,
              explanation:
                'Verificação em fonte real é a regra inegociável — IA nunca é fonte primária, em nenhum plano.',
            },
            {
              prompt: 'O próximo curso da trilha foca em:',
              options: [
                'Programação de robôs',
                'Engenharia de Prompts: projetar e encadear prompts profissionalmente',
                'Montagem de computadores',
              ],
              correctIndex: 1,
              explanation:
                'Do pedir bem (este curso) para projetar bem: cadeias, estruturas reutilizáveis e formatos rígidos no próximo.',
            },
          ],
        },
      ],
    },
  ],
}
