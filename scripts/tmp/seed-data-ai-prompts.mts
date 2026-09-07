// Curso 2 de 4 da Trilha IA para Estudantes: Engenharia de Prompts
// Conteúdo em nível "produto para venda": apostilas profundas + quizzes.
import type { CourseDef } from './seed-types'

export const promptsCourse: CourseDef = {
  mentorEmail: 'gustavonv@yandex.com',
  title: 'Engenharia de Prompts: o método profissional para falar com IAs',
  description:
    'Quem já viu alguém pedir a mesma coisa para a IA e receber resultados incomparáveis sabe: o prompt é o produto. Neste curso — o Curso 2 de 4 da Trilha IA para Estudantes — você domina o método profissional de instruir IAs: o framework PCTF, restrições e formato, few-shot, chain-of-thought, personas de crítica, templates reutilizáveis e leitura de documentos longos sem se perder. Depois aplica tudo onde importa: prompts de estudo, escrita profissional, análise de decisões e criação, incluindo a fórmula de prompts de imagem. Cada aula traz apostila direta, quiz de fixação e uma tarefa prática de 5 a 15 minutos. Você sai falando com qualquer IA como quem entende: com método, não com sorte — e com uma biblioteca de 20 prompts prontos para o semestre.',
  category: 'Tecnologia',
  level: 'INTERMEDIARIO',
  price: 99,
  coverUrl: '/uploads/seed/course-ia-prompts.png',
  themes: [
    {
      title: 'Módulo 1 · Do prompt amador ao profissional',
      description:
        'A base que muda qualquer resposta a partir do primeiro uso: por que o prompt decide tudo, o framework PCTF, o poder das restrições e a técnica de ensinar com exemplos.',
      lessons: [
        {
          title: 'Por que a mesma IA responde tão diferente para duas pessoas',
          description:
            'A ferramenta é a mesma; a instrução é que muda. Veja o antes e depois de um prompt real e entenda o retorno de dominar essa habilidade.',
          durationMin: 13,
          content: `Duas pessoas abrem a mesma IA no mesmo dia. Uma recebe um texto genérico que vai ter que reescrever inteiro. A outra recebe quase o material pronto. A ferramenta é idêntica — a diferença inteira está na instrução que cada uma digitou.

## O mesmo pedido, dois mundos
Compare dois prompts para a mesma necessidade:
- "Fale sobre produtividade para estudantes."
- "Você é um coach de estudos. Escreva para um universitário que trabalha de manhã e estuda à noite uma lista de 5 hábitos realistas para a rotina dele, em até 10 linhas, sem frases motivacionais."
O primeiro recebe uma redação de enciclopédia. O segundo recebe algo que ele pode usar hoje. Nada de mágico: o segundo prompt informa papel, público, tarefa, quantidade, tamanho e o que evitar.

## A IA é um espelho do pedido
A resposta que chega é a mais provável para a pergunta que você fez. Um pedido vago obriga a IA a apostar no caso médio — e o caso médio serve mal a qualquer caso real. Cada detalhe que você adiciona (quem é você, para que serve, o que considera bom) remove apostas e aproxima a resposta da sua necessidade.

## Uma habilidade, todas as ferramentas
Assistentes de texto, buscadores com IA, geradores de imagem: todos respondem à mesma lógica de instrução. Quem aprende a escrever prompts leva a habilidade para qualquer ferramenta nova — o oposto de decorar truques de um aplicativo que muda de layout todo mês.

## O retorno concreto
O que você ganha ao dominar isso: a primeira resposta já chega utilizável, o ciclo de "refazer e corrigir" encurta drasticamente e tarefas que você adiava (e-mail difícil, resumo, plano de estudos) passam a custar minutos. Menos tempo digitando instruções ruins, mais tempo usando o resultado.

## Sua tarefa
Escolha uma tarefa real desta semana. Escreva o prompt "preguiçoso" que você digitaria sem pensar e rode. Depois reescreva informando papel, público, formato e tamanho, e rode de novo. Guarde as duas respostas lado a lado: essa comparação é o ponto de partida do curso.`,
          quiz: [
            {
              prompt: 'Duas pessoas usam a mesma IA e recebem respostas de qualidade muito diferente. A explicação mais provável:',
              options: ['A IA funciona melhor em alguns horários', 'A diferença está na forma como cada uma escreveu o prompt', 'Uma das contas tem plano melhor'],
              correctIndex: 1,
              explanation: 'A resposta é reflexo direto da instrução; detalhes como papel, público e formato mudam o resultado inteiro.',
            },
            {
              prompt: 'Por que um pedido vago gera resposta genérica?',
              options: ['Porque a IA não domina o idioma', 'Porque a IA aposta no caso médio, que não serve bem a nenhum caso específico', 'Porque a IA não tem acesso à internet'],
              correctIndex: 1,
              explanation: 'Sem detalhes, a resposta mais provável é a média — e a média não resolve o seu problema particular.',
            },
            {
              prompt: 'O que acontece com a habilidade de escrever prompts quando você muda de ferramenta?',
              options: ['Perde tudo e recomeça do zero', 'Só funciona na ferramenta original', 'Leva a habilidade junto: a lógica de instrução vale para qualquer IA'],
              correctIndex: 2,
              explanation: 'Prompt é linguagem, não atalho de aplicativo — a lógica de papel, contexto, tarefa e formato atravessa ferramentas.',
            },
          ],
        },
        {
          title: 'O framework PCTF: Papel, Contexto, Tarefa, Formato',
          description:
            'O esqueleto completo que cabe em qualquer prompt, com template pronto para preencher e um caso prático montado peça por peça.',
          durationMin: 15,
          content: `Usuários avançados não "escrevem bonito": seguem um esqueleto. PCTF é o nosso — quatro peças que funcionam em qualquer prompt, do simples ao complexo.

## P de Papel
Diga quem a IA deve ser. "Você é um professor de química do ensino médio" muda o vocabulário, a profundidade e os exemplos. O papel é o filtro que define como a tarefa será executada — sem ele, a IA escolhe um tom neutro, sem dono e sem público.

## C de Contexto
Informe a situação: quem você é, para que precisa, o que já tem, qual o público e quais as restrições. "Preciso apresentar amanhã para a turma, tenho 5 minutos e o tema é fotossíntese" vale mais que três parágrafos de pedido solto.

## T de Tarefa
O verbo e o objeto: escreva, compare, liste, revise, critique, simplifique. Uma tarefa por prompt quando possível — pedidos compostos ("resume e depois cria um quiz e também...") diluem a atenção e a resposta sai mediana em tudo.

## F de Formato
Como a resposta deve chegar: tabela, lista numerada, número de itens, tamanho, tom. O formato é o que torna a saída utilizável sem retrabalho.

## O template pronto
"Atue como [PAPEL]. Contexto: [SITUAÇÃO E RESTRICÕES]. Sua tarefa: [O QUE FAZER, COM VERBO CLARO]. Entregue em [FORMATO], com no máximo [TAMANHO], tom [TOM]."
Guarde essa linha. No próximo módulo ela vira template com variáveis — por agora, use-a inteira, preenchendo cada colchete.

## O caso prático, peça por peça
- P: revisor de redação do ensino médio.
- C: "escrevi uma redação dissertativa de 4 parágrafos sobre lixo eletrônico, vou colar abaixo".
- T: "aponte os 3 problemas mais graves de argumentação".
- F: "lista numerada, com um exemplo de correção para cada problema".
Junte as quatro peças em uma única mensagem e você tem um prompt de nível profissional — sem nenhuma frase elegante, só estrutura.

## Sua tarefa
Pegue uma tarefa real desta semana e monte o prompt completando o template PCTF. Rode. Se a resposta vier fraca, identifique qual das 4 peças ficou curta — quase sempre é o Contexto.`,
          quiz: [
            {
              prompt: 'No framework PCTF, o que o Papel faz?',
              options: ['Define o idioma da resposta', 'Define como a tarefa será executada: vocabulário, profundidade e exemplos', 'Define o tamanho máximo do texto'],
              correctIndex: 1,
              explanation: 'O papel é o filtro de execução — professor, revisor e crítico respondem ao mesmo pedido de formas diferentes.',
            },
            {
              prompt: 'A informação "para quem é a resposta" entra em qual peça?',
              options: ['No Papel', 'No Contexto', 'No Formato'],
              correctIndex: 1,
              explanation: 'Público e situação vivem no Contexto; o Papel define quem executa a tarefa.',
            },
            {
              prompt: 'Por que evitar várias tarefas em um único prompt?',
              options: ['Porque a IA responde só à primeira', 'Porque pedidos compostos diluem a atenção e a resposta sai mediana em tudo', 'Porque o formato não funciona em tarefas compostas'],
              correctIndex: 1,
              explanation: 'Uma tarefa por prompt mantém a qualidade; se precisar de várias, encadeie em mensagens separadas.',
            },
          ],
        },
        {
          title: 'Restrições e formato de saída',
          description:
            'Limitar tamanho, tom e estilo; pedir tabela, lista e estrutura fixa; e a instrução que reduz respostas inventadas.',
          durationMin: 14,
          content: `Parece contraditório, mas quanto mais você limita a IA, melhor ela responde. Liberdade total produz texto genérico; restrição bem colocada produz texto utilizável.

## Limite tamanho, tom e estilo
- Tamanho: "em até 8 linhas", "um parágrafo", "uma frase por item". Sem limite, a IA despeja tudo que sabe — e você é obrigado a cortar.
- Tom: "informal mas respeitoso", "adequado para e-mail a professor", "sem gírias e sem jargão".
- Estilo: "frases curtas", "sem adjetivos vazios", "comece direto pelo assunto, sem introdução".
Cada restrição elimina um tipo de resposta que você teria que corrigir depois.

## Peça estrutura, não prosa
- Tabela: "apresente em tabela com as colunas Opção, Custo e Risco".
- Lista numerada: "liste 5 motivos, numerados, do mais importante para o menos".
- Blocos fixos: "responda em 3 blocos com os títulos O que é, Exemplo e Erro comum".
Estrutura fixa deixa a resposta escaneável e permite comparar respostas entre si. É também o que você aproveita quando diz "mantenha o formato, mude só o conteúdo".

## A instrução anti-invenção
Adicione ao prompt: "Se não souber ou não houver informação suficiente, diga que não sabe e diga o que faltaria." Isso muda o comportamento padrão de preencher o vazio com algo plausível — às vezes plausível demais. Complemento útil: "ao assumir algo, marque com a palavra SUPOSIÇÃO."
Uma frase não elimina o erro, mas reduz bastante a resposta inventada e deixa o que é incerto visível para você checar.

## Restrição não é freio
Restrições dizem o que você quer — não limitam a criatividade da IA. "Crie um slogan para uma loja de plantas, com no máximo 5 palavras, tom divertido, sem usar a palavra verde" gera respostas mais criativas que "crie um slogan". O cérebro, humano ou artificial, trabalha melhor dentro de um jogo com regras.

## Sua tarefa
Reescreva um prompt que você usou recentemente adicionando três restrições (tamanho, tom, formato) e a instrução anti-invenção. Rode as duas versões e observe: a diferença aparece no primeiro uso.`,
          quiz: [
            {
              prompt: 'Por que limitar o tamanho da resposta?',
              options: ['Para economizar internet', 'Porque sem limite a IA despeja tudo que sabe e você precisa cortar depois', 'Porque a IA não sabe escrever textos longos'],
              correctIndex: 1,
              explanation: 'Sem limite de tamanho, a resposta vem inflada — e o trabalho de enxugar volta para você.',
            },
            {
              prompt: 'O que a frase "se não souber, diga que não sabe" muda?',
              options: ['A velocidade da resposta', 'Reduz respostas inventadas e deixa o incerto visível', 'Impede a IA de opinar'],
              correctIndex: 1,
              explanation: 'Ela contraria o padrão de preencher o vazio com algo plausível, que é a raiz da resposta falsa.',
            },
            {
              prompt: 'Restrições bem colocadas no prompt...',
              options: ['Empobrecem a resposta', 'Só funcionam em ferramentas pagas', 'Eliminam correções futuras e até aumentam a criatividade dentro das regras'],
              correctIndex: 2,
              explanation: 'Regras apertam o jogo e forçam soluções melhores — o slogan com limite de palavras é o exemplo clássico.',
            },
          ],
        },
        {
          title: 'Few-shot: ensinar com exemplos',
          description:
            'Mostre o padrão em vez de descrevê-lo: como montar 1 a 3 exemplos, quando a técnica vale a pena e as armadilhas que contaminam o resultado.',
          durationMin: 16,
          content: `Descrever o que você quer às vezes é difícil. Mostrar é quase sempre mais fácil. Few-shot é a técnica de incluir exemplos do padrão desejado dentro do prompt — a diferença entre "tente adivinhar" e "siga o modelo".

## Zero-shot vs few-shot
- Zero-shot: só a instrução. "Escreva legendas curtas para o meu projeto de doação de livros."
- Few-shot: instrução + exemplos. "Escreva legendas curtas no mesmo padrão dos exemplos: 1) Um livro doado virou a favorita de outra criança. 2) Hoje separamos os títulos para a caixinha da escola."
Com dois exemplos, a IA entende tamanho, tom e estrutura sem você precisar descrever cada um — o exemplo é a especificação mais curta que existe.

## Como montar
- Separe de 1 a 3 exemplos do padrão (idealmente feitos ou aprovados por você).
- Marque claramente onde começam e terminam: "Exemplos: ... Fim dos exemplos."
- Feche com a instrução: "Siga exatamente esse padrão para o caso a seguir."
- Dê a entrada nova por último — o que vem no final pega mais atenção do modelo.

## Quando vale a pena
- O formato é específico e difícil de descrever (fichas, legendas, correções padronizadas).
- O estilo precisa ser imitado: a sua voz ou o padrão de um projeto.
- A instrução ficaria longa e confusa — um bom exemplo substitui um parágrafo de regras.
Para perguntas simples e fatos diretos, few-shot é exagero: a instrução direta resolve.

## As armadilhas
- Exemplo ruim contamina: se o exemplo tem erro de digitação ou tom inconsistente, a IA copia o erro junto com o padrão. Revise os exemplos antes de enviar.
- Um tipo só de exemplo vira regra: se os 3 exemplos são perguntas, a resposta tende a vir em perguntas. Varie quando o padrão permitir.
- Exemplos demais ocupam espaço e diluem a instrução. Até 3 costuma bastar.

## Sua tarefa
Escolha uma tarefa repetitiva sua (legendas, fichas, resumo em modelo fixo). Monte um prompt few-shot com 2 exemplos seus e rode com uma entrada nova. Confira se a saída seguiu o padrão — se não seguiu, o problema provavelmente está nos exemplos, não na instrução.`,
          quiz: [
            {
              prompt: 'Few-shot significa:',
              options: ['Pedir a resposta em poucas palavras', 'Incluir no prompt de 1 a 3 exemplos do padrão desejado', 'Usar poucos recursos da ferramenta'],
              correctIndex: 1,
              explanation: 'O nome vem do aprendizado por exemplos: poucos "tiros" que mostram o padrão em vez de descrevê-lo.',
            },
            {
              prompt: 'O principal risco de um exemplo mal escrito no few-shot é:',
              options: ['A IA recusar o pedido', 'A IA copiar o erro junto com o padrão', 'A resposta ficar mais longa'],
              correctIndex: 1,
              explanation: 'O exemplo é especificação — erro incluído é erro ensinado. Revise antes de enviar.',
            },
            {
              prompt: 'Em qual situação few-shot brilha?',
              options: ['Perguntas factuais simples', 'Quando o formato ou o estilo é específico e difícil de descrever', 'Contas de matemática'],
              correctIndex: 1,
              explanation: 'Padrão difícil de explicar e fácil de mostrar é o terreno do few-shot.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 2 · Técnicas que separam os profissionais',
      description:
        'Raciocínio passo a passo, personas de crítica com critérios, templates reutilizáveis e o método para analisar documentos longos sem se afogar.',
      lessons: [
        {
          title: 'Chain-of-thought: pedir o raciocínio, não só a resposta',
          description:
            'A frase que muda a resposta, a decomposição de problemas e o mapa de quando o raciocínio explícito ajuda — e quando é exagero.',
          durationMin: 15,
          content: `Quando você pede só a resposta, recebe o resultado final — e se estiver errado, não tem de onde puxar o fio. Quando pede o raciocínio, recebe o caminho: dá para conferir cada degrau e apontar onde a lógica escorregou.

## A frase que muda a resposta
"Resolva passo a passo, mostrando o raciocínio antes da conclusão." Com esse pedido, a IA organiza o problema em etapas visíveis em vez de pular direto para o veredito. Em tarefas com lógica, isso costuma reduzir erro — escrever o passo obriga o modelo a se comprometer com cada parte.

## Decompor antes de resolver
Para problemas maiores, peça a decomposição primeiro:
"Antes de responder, liste as variáveis envolvidas e o que cada uma afeta. Depois resolva etapa por etapa."
Funciona para repartir um orçamento, montar grade de horários, decidir entre duas opções com várias condições. O problema vira pilhas menores — e cada pilha é verificável.

## Quando ajuda de verdade
- Contas, lógica e problemas de múltiplas etapas.
- Decisões com critérios em conflito: custo contra tempo contra qualidade.
- Revisão de argumentos: "verifique cada premissa antes de concluir".
## Quando é exagero
- Fatos diretos: data, tradução simples, definição.
- Resumos e reformulações de texto.
Pedir raciocínio nessas tarefas só adiciona texto — e pode induzir a IA a "justificar" respostas que já estavam prontas, certas ou erradas.

## O bônus: auditar o erro
Com o raciocínio à mostra, o erro ganha endereço. Você lê os passos, encontra o degrau torto ("aqui você assumiu que os dois cursos têm a mesma carga horária") e corrige o ponto exato: "refaça a partir do passo 3, considerando que...".
Muito melhor que recomeçar do zero — e melhor para o seu aprendizado, porque você vê o método, não só o resultado.

## Sua tarefa
Pegue um problema real com lógica: uma conta, um conflito de horários, uma decisão com condições. Rode duas vezes — uma pedindo só a resposta, outra pedindo passo a passo. Compare e aponte um ponto onde o raciocínio revelou algo que a resposta escondia.`,
          quiz: [
            {
              prompt: 'Qual é a frase clássica do chain-of-thought?',
              options: ['Responda o mais rápido possível', 'Resolva passo a passo, mostrando o raciocínio antes da conclusão', 'Responda apenas com a resposta final'],
              correctIndex: 1,
              explanation: 'É o pedido mínimo que expõe as etapas e torna o erro auditável.',
            },
            {
              prompt: 'Em qual situação pedir raciocínio é exagero?',
              options: ['Decisão com critérios em conflito', 'Problema de múltiplas etapas', 'Tradução simples ou fato direto'],
              correctIndex: 2,
              explanation: 'Tarefas diretas não ganham nada com etapas — só ganham texto a mais na frente da resposta.',
            },
            {
              prompt: 'O principal benefício de ver o raciocínio é:',
              options: ['A resposta fica mais longa e parece melhor', 'Poder auditar cada passo e corrigir o ponto exato do erro', 'Gastar menos tempo lendo'],
              correctIndex: 1,
              explanation: 'Com o caminho visível, você corrige o degrau torto em vez de recomeçar do zero.',
            },
          ],
        },
        {
          title: 'Personas avançadas: revisor, crítico e advogado do diabo',
          description:
            'Papéis com critérios explícitos, crítica dura do seu próprio texto e simulação de banca antes de quem realmente avalia.',
          durationMin: 17,
          content: `Persona não é fantasia: é um filtro. "Atue como revisor" faz pouco; "atue como revisor com estes critérios" muda o jogo. Persona avançada é papel + critérios explícitos + formato da saída.

## A persona com critérios
Compare:
- Fraca: "seja um revisor e melhore meu texto."
- Forte: "Atue como um revisor exigente. Revise o texto abaixo buscando: frases longas demais, repetição de palavras, argumento fraco e jargão desnecessário. Não reescreva nada: apenas liste cada problema, cite o trecho e classifique como grave ou leve."
A segunda entrega um diagnóstico em que você confia, porque os critérios estão na mesa — e evita que a IA "melhore" o texto do jeito dela, apagando a sua voz.

## O crítico do seu texto
Fluxo em dois tempos: primeiro só a lista de problemas, ordenada da gravidade maior para a menor. Depois, com a lista na mão, você decide o que corrigir — e só então pede sugestões para os pontos escolhidos. Quem manda na revisão continua sendo você.

## O advogado do diabo
"Você é um avaliador cético. Ataque o plano abaixo: encontre as fraquezas, o que pode dar errado e as perguntas que uma banca faria. Seja duro, sem elogios."
Essa persona encontra o buraco antes do professor, do chefe ou da banca. Rode sempre antes de entregar algo importante — o custo é um prompt; o benefício é corrigir em casa.

## Simulação de banca e entrevista
Peça que a IA viva o examinador: "Simule uma banca de TCC: faça uma pergunta difícil por vez sobre meu projeto, espere minha resposta e só então avalie e faça a próxima."
O formato de ida e volta treina muito mais que receber 10 perguntas de uma vez — você pratica responder sob pressão e leva avaliação imediata.

## Sua tarefa
Pegue um texto seu recente: redação, e-mail ou trabalho. Monte a persona de revisor exigente com 3 critérios seus, peça a lista de problemas sem reescrita, corrija os 2 piores e compare a versão final com a original.`,
          quiz: [
            {
              prompt: 'O que diferencia uma persona avançada de uma simples?',
              options: ['Usar nomes de professores famosos', 'Papel + critérios explícitos + formato de saída definidos', 'Escrever o pedido em inglês'],
              correctIndex: 1,
              explanation: 'Sem critérios explícitos, a persona é só cenário; com eles, vira instrumento de avaliação.',
            },
            {
              prompt: 'Por que pedir a lista de problemas antes de sugestões de reescrita?',
              options: ['Para economizar tempo de leitura', 'Para manter o controle da revisão e proteger a sua voz', 'Porque a IA escreve melhor depois'],
              correctIndex: 1,
              explanation: 'Diagnóstico primeiro, intervenção depois: você escolhe o que corrige e o texto continua sendo seu.',
            },
            {
              prompt: 'A persona "advogado do diabo" serve para:',
              options: ['Desanimar você do projeto', 'Encontrar fraquezas e perguntas difíceis antes do avaliador real', 'Reescrever o texto no estilo dela'],
              correctIndex: 1,
              explanation: 'É ensaio de defesa: melhor levar os golpes em casa do que na frente da banca.',
            },
          ],
        },
        {
          title: 'Templates reutilizáveis: sua biblioteca de prompts',
          description:
            'Transforme seu melhor prompt em template com variáveis, aprenda versionamento caseiro e escolha onde guardar sua biblioteca.',
          durationMin: 14,
          content: `Reescrever um bom prompt do zero toda semana é trabalho de amador. Quem usa IA em nível profissional mantém templates: prompts prontos com espaços para preencher — preencheu, rodou.

## De prompt a template
Pegue o seu melhor prompt e pergunte: o que muda a cada uso? Isso vira variável; o resto fica fixo.
- Fixo: "Atue como revisor de redações do ensino médio. Liste os 3 problemas mais graves, numerados, com um exemplo de correção para cada."
- Variável: o texto, o foco da revisão.
- Template: "Atue como revisor de redações do ensino médio. Revise o texto abaixo focando em [FOCO]. Liste os 3 problemas mais graves, numerados, com exemplo de correção. Texto: [TEXTO]."

## Anatomia de um bom template
- PCTF embutido: papel, contexto e formato já resolvidos no texto fixo.
- De 3 a 5 variáveis, no máximo: [TEMA], [NÍVEL], [TAMANHO]. Variáveis demais viram formulário chato.
- Nome claro: "Revisor redação — foco argumentação, v2". Você precisa achar em 10 segundos daqui a dois meses.

## Versionamento caseiro
Quando um prompt funciona, congele: essa é a versão 1. Quer melhorar? Copie, mude, teste contra a original — se ganhar, vira v2 e a v1 continua arquivada. Nunca edite por cima da versão que funciona: ter o histórico é o que permite voltar quando uma "melhora" piora o resultado.

## Onde guardar
Onde você já olha todo dia: documento simples, bloco de notas, aplicativo de anotações — qualquer lugar serve, contanto que seja um lugar só, com nomes consistentes e separado por categoria. A biblioteca perfeita que você nunca abre perde para o arquivo de texto feio que está sempre à mão.

## A regra de ouro
Todo prompt que você digita mais de uma vez merece virar template. O custo de salvar é 10 segundos; o retorno é não redigir de novo nunca mais.

## Sua tarefa
Pegue o melhor prompt que você criou no módulo 1 e transforme em template com 3 variáveis entre colchetes. Salve no lugar escolhido, com nome e versão — esta é a primeira peça da biblioteca que será seu projeto final do curso.`,
          quiz: [
            {
              prompt: 'Em um template, o que deve virar variável?',
              options: ['Tudo, para ficar flexível', 'O que muda a cada uso; o resto fica fixo', 'Nada — templates não têm variáveis'],
              correctIndex: 1,
              explanation: 'O fixo carrega o PCTF; a variável é só o que muda de tarefa para tarefa.',
            },
            {
              prompt: 'Qual é a boa prática de versionamento?',
              options: ['Editar sempre por cima do original', 'Congelar as versões que funcionam e testar melhorias em cópias', 'Guardar tudo de cabeça'],
              correctIndex: 1,
              explanation: 'Histórico preservado permite voltar quando uma "melhora" piora o resultado.',
            },
            {
              prompt: 'Onde guardar a biblioteca de prompts?',
              options: ['Em um único lugar que você já consulta todo dia, com nomes consistentes', 'Espalhado em vários aplicativos, um para cada tema', 'Só no histórico da ferramenta de IA'],
              correctIndex: 0,
              explanation: 'Um lugar só, sempre à mão: biblioteca que você não abre não é biblioteca.',
            },
          ],
        },
        {
          title: 'Documentos longos: análise por partes',
          description:
            'O limite de contexto na prática e o método em camadas — mapa, detalhe e síntese — para extrair valor de textos e PDFs grandes.',
          durationMin: 18,
          content: `Colar um PDF de 40 páginas e pedir "resuma" é desperdiçar o documento — a resposta costuma vir rasa ou ignorando metade. Documentos longos pedem método: em camadas e por partes.

## O limite de contexto na prática
A IA só "enxerga" o que cabe na janela de contexto da conversa. Textos muito longos podem ser cortados silenciosamente, e o começo da conversa perde força conforme ela cresce. Sintoma clássico: você perguntou sobre o capítulo 1 e a resposta só usa o fim do documento. Não é birra — é memória de trabalho esgotada.

## O método em camadas
- Camada 1 — o mapa: "Abaixo está um documento longo. Liste as seções principais com uma frase sobre o tema de cada uma. Não resuma o conteúdo."
- Camada 2 — o detalhe: com o mapa na mão, escolha a seção que importa: "Agora aprofunde a seção 2: quais argumentos o autor apresenta e quais dados usa?"
- Camada 3 — a síntese: "Com base nas seções 2 e 4, escreva um parágrafo respondendo: o autor sustenta a tese final?"
Cada camada usa a anterior como mapa — você navega no documento junto com a IA, não joga o documento na cara dela.

## Uma seção por mensagem
Em vez de um pedido gigante, um pedido por seção mantém a qualidade alta. Nomeie a seção ("na seção Metodologia...") e, se o documento não tiver títulos, peça primeiro que a IA proponha uma divisão — e use essa divisão como endereçamento.

## Perguntas cirúrgicas
Troque "resuma tudo" pelo que você realmente precisa: "quais limitações o autor reconhece?", "essa fonte confirma ou contradiz a ideia de X?", "há dados numéricos sobre custos?". Pergunta apontada para um alvo responde melhor que pedido genérico — em documento longo, isso vale dobrado.

## Sua tarefa
Pegue um texto ou PDF longo de uma disciplina sua e aplique as 3 camadas: mapa, aprofundamento da seção mais relevante e síntese de um parágrafo com suas palavras. Repare como a camada 1 muda o controle que você tem sobre a camada 2.`,
          quiz: [
            {
              prompt: 'Sintoma clássico de documento longo demais para o contexto:',
              options: ['A IA recusa a responder', 'A resposta ignora o começo do documento', 'A resposta sai em outro idioma'],
              correctIndex: 1,
              explanation: 'Quando a janela de contexto satura, as partes antigas perdem força — a resposta passa a olhar só o fim.',
            },
            {
              prompt: 'Qual é a primeira camada do método?',
              options: ['Pedir o resumo final', 'Pedir o mapa das seções, sem resumir conteúdo', 'Traduzir o documento'],
              correctIndex: 1,
              explanation: 'O mapa barato de tokens vira o endereçamento de tudo que vem depois.',
            },
            {
              prompt: 'Por que "uma seção por mensagem"?',
              options: ['Para gastar mais tempo na conversa', 'Porque mantém a qualidade alta e facilita endereçar cada parte', 'Porque a IA não aceita textos grandes'],
              correctIndex: 1,
              explanation: 'Pedidos menores e nomeados mantêm a atenção do modelo onde você quer — e a qualidade junto.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 3 · Prompts para cada área da sua vida',
      description:
        'Prompts prontos aplicados à rotina real: estudar melhor, escrever com a sua voz, decidir com critério e criar com método — incluindo geração de imagens.',
      lessons: [
        {
          title: 'Prompts de estudo e academia',
          description:
            'Questões por nível de dificuldade, plano de estudos com revisão espaçada, fichamento padronizado e revisão por pares simulada.',
          durationMin: 16,
          content: `A IA é uma das melhores ferramentas de estudo já inventadas — se você pedir as coisas certas. Nesta aula você sai com quatro prompts de academia prontos para adaptar.

## Questões por nível
"Com base no tema [TEMA], crie 6 questões: 2 fáceis de memorização, 2 médias de aplicação e 2 difíceis de análise. Apresente primeiro só as perguntas, numeradas; as respostas comentadas vêm em bloco separado, no final."
Por que funciona: você se testa antes de espiar, e a separação evita a tentação de ler a resposta junto. Depois, cole as suas respostas e peça: "avalie cada uma e aponte o conceito por trás de cada erro".

## Plano de estudos com revisão
"Monte um plano de estudos para [PROVA], considerando que estudo [DIAS] por semana, [HORAS] por sessão. Inclua sessões de revisão dos temas antigos distribuídas ao longo do plano, marque os temas provavelmente mais difíceis e termine cada semana com uma autoavaliação."
O pedido de revisão distribuída é o que separa um plano que funciona de uma lista de temas — sem revisão, tudo evapora.

## Fichamento padronizado
"Leia o texto abaixo e produza um fichamento com os campos: referência, tese central, 3 argumentos de sustentação, 2 citações úteis e 1 crítica possível ao texto."
Formato fixo em todo fichamento: seus materiais ficam comparáveis e empilháveis ao longo do semestre inteiro, em vez de virarem resumos de estilos diferentes.

## Revisão por pares simulada
Cole o rascunho do trabalho e peça: "Atue como um colega crítico de outra área. Aponte onde meu argumento perde força, onde faltam fontes e o que um avaliador questionaria. Não reescreva nada."
É o par de estudo que lê o seu texto às 23h — com critério e sem vergonha de falar.

## Sua tarefa
Escolha o assunto que está mais atrasado agora. Gere 6 questões nos 3 níveis, responda sem consultar nada e depois peça a avaliação. Anote os erros: são eles que definem o seu próximo bloco de estudo.`,
          quiz: [
            {
              prompt: 'Por que pedir que as respostas fiquem em bloco separado das questões?',
              options: ['Para economizar espaço na tela', 'Para se testar antes de espiar a resposta', 'Porque a IA se confunde com respostas junto'],
              correctIndex: 1,
              explanation: 'A separação cria o espaço do auto-teste — responder antes de ler é o que fixa conteúdo.',
            },
            {
              prompt: 'O que um plano de estudos gerado precisa incluir para funcionar?',
              options: ['Só a lista de temas na ordem do edital', 'Sessões de revisão distribuídas ao longo do período', 'Tabelas coloridas por disciplina'],
              correctIndex: 1,
              explanation: 'Sem revisão distribuída, o plano é lista de desejos — o que estudou em janeiro precisa voltar em fevereiro.',
            },
            {
              prompt: 'O fichamento padronizado vale porque:',
              options: ['Deixa os materiais comparáveis e empilháveis ao longo do semestre', 'É mais rápido que ler o texto', 'Substitui a referência bibliográfica'],
              correctIndex: 0,
              explanation: 'Campos fixos transformam fichas soltas em um acervo consultável — e o semestre inteiro conversa.',
            },
          ],
        },
        {
          title: 'Prompts de escrita profissional',
          description:
            'E-mail difícil em duas versões, relatório por seções, a mesma mensagem em 3 tons e a regra da última edição humana.',
          durationMin: 17,
          content: `E-mail que trava, relatório que empilha, proposta que nunca sai: escrita profissional é onde a IA rende mais — desde que a última palavra continue sendo sua.

## O e-mail difícil
Estrutura do prompt: contexto + objetivo + o que evitar + pedido de versões.
"Contexto: preciso avisar o professor que perderei o prazo do trabalho por motivo de saúde. Objetivo: manter a confiança e pedir prazo até sexta. Evite: soar vitimista ou pedir pena. Escreva 2 versões: uma direta e curta, uma mais formal."
Duas versões viram matéria-prima: você mistura o que quiser de cada uma.

## Relatório e proposta: esqueleto primeiro
Não peça o texto completo de uma vez. Primeiro o esqueleto: "monte a estrutura em tópicos de um relatório sobre [ASSUNTO] para [PÚBLICO], com o objetivo de sustentar [DECISÃO]". Ajuste a estrutura, depois peça seção por seção. Texto construído sobre esqueleto aprovado quase nunca é jogado fora.

## A mesma mensagem em 3 tons
"Reescreva o texto abaixo em 3 versões: formal, neutra-profissional e conversacional. Mantenha a informação idêntica em todas."
Serve para calibrar: você descobre o tom certo vendo os três lado a lado, em vez de adivinhar na cabeça.

## Títulos e ganchos
"Liste 10 opções de título para este texto, variando o ângulo: um direto, um com pergunta, um com contraste, um com número." Depois combine os melhores pedaços de títulos diferentes — título bom raramente sai pronto na primeira tentativa, e pedir 10 custa o mesmo que pedir 1.

## A regra da última edição humana
A IA redige, você edita por último. Leia em voz alta, corte o que não é você, ajuste a frase que soa estranha no seu jeito. Texto com a sua voz é o que sustenta credibilidade — e reler é o que impede você de virar retransmissor de um texto que não entende. Nunca envie sem ler: o erro plausível é o mais perigoso de todos.

## Sua tarefa
Escolha aquele e-mail que você está adiando há dias. Monte o prompt com contexto, objetivo e o que evitar, peça 2 versões, edite com a sua mão e envie hoje.`,
          quiz: [
            {
              prompt: 'No e-mail difícil, para que pedir 2 versões (direta e formal)?',
              options: ['Para enviar cada uma para uma pessoa', 'Ter matéria-prima para misturar o que funciona de cada uma', 'Porque uma sempre vai dar errado'],
              correctIndex: 1,
              explanation: 'Versões são insumo, não produto final: você combina direção e forma no seu jeito.',
            },
            {
              prompt: 'Antes de pedir o texto completo de um relatório, você deve:',
              options: ['Aprovar o esqueleto em tópicos e depois preencher seção por seção', 'Pedir direto em outro idioma', 'Escrever tudo sozinho e corrigir depois'],
              correctIndex: 0,
              explanation: 'Esqueleto aprovado evita reescrever: a estrutura é o caro de desfazer.',
            },
            {
              prompt: 'Qual é a regra da última edição humana?',
              options: ['A IA envia o texto por você', 'Você relê e ajusta antes de enviar: a voz final é sua', 'Reler só em textos importantes'],
              correctIndex: 1,
              explanation: 'A IA redige, você assina — e assinar exige ler, cortar e dar o seu tom.',
            },
          ],
        },
        {
          title: 'Prompts de análise e decisão',
          description:
            'Prós e contras com pesos, riscos com plano B, tabela comparativa honesta e a instrução que expõe as suposições escondidas.',
          durationMin: 16,
          content: `Decisões ficam melhores quando a IA organiza o que está misturado na sua cabeça — e piores quando você aceita a primeira resposta como sentença. Nesta aula, prompts para analisar com método.

## Prós e contras com pesos
Lista de prós e contras sem peso é quase inútil: "barato" pesa diferente para cada pessoa. Dê os seus critérios:
"Estou decidindo entre [OPÇÃO A] e [OPÇÃO B]. Meus critérios, em ordem de importância: custo, tempo livre e aprendizado. Monte uma tabela de prós e contras e, no final, aponte qual opção atende melhor os meus dois primeiros critérios."
A ordem de importância é o que transforma lista em análise.

## Análise de riscos
"Liste os 5 maiores riscos deste plano. Para cada um: o gatilho que indica que ele está acontecendo e um plano B simples."
O formato gatilho + plano B é o que torna a lista acionável — risco sem plano B é ansiedade em formato de tabela.

## Tabela comparativa que revela
"Compare as opções em tabela: critérios nas linhas, opções nas colunas. Adicione uma coluna Depende, marcando o que muda conforme o contexto."
A coluna "depende" é a honesta: muita comparação falsa vem de fingir que não existe contexto.

## Suposições declaradas
A instrução mais valiosa desta aula: "Antes de responder, liste as suposições que você está fazendo sobre a minha situação."
Toda análise se apoia em suposições — sobre o seu tempo, o seu dinheiro, a sua prioridade. Explícitas, você corrige as erradas ("não, minha prioridade é outra") e recebe uma análise nova, muito melhor. Escondidas, você aceita conclusões construídas sobre areia.

## Fechamento: quem decide é você
A IA organiza, revela conflitos entre critérios e mostra ângulos que você não viu. A decisão, com os valores e o contexto que só você conhece, continua sendo sua. Use a IA para enxergar melhor, não para delegar a escolha.

## Sua tarefa
Pegue uma decisão real pendente (matéria eletiva, compra, montagem de horário). Monte o prompt de prós e contras com os seus critérios em ordem, adicione o pedido de suposições declaradas e tome a decisão hoje.`,
          quiz: [
            {
              prompt: 'Por que dar a ordem de importância dos critérios?',
              options: ['Porque transforma lista em análise: "barato" pesa diferente para cada pessoa', 'Para o prompt ficar mais longo', 'Porque a IA não sabe o que é importante sozinha'],
              correctIndex: 0,
              explanation: 'Critério com peso é o que permite conclusão — sem isso, é só lista bonita de dois lados.',
            },
            {
              prompt: 'O que fazer com as suposições que a IA declarar?',
              options: ['Ignorar — são só formalidade', 'Corrigir as erradas antes de aceitar a análise', 'Pedir mais suposições para ficar completo'],
              correctIndex: 1,
              explanation: 'Suposição errada é alicerce errado: corrigida a premissa, a análise muda de qualidade.',
            },
            {
              prompt: 'Para que serve a coluna "Depende" na tabela comparativa?',
              options: ['Preencher espaço vazio', 'Marcar o que muda conforme o contexto, evitando comparação falsa', 'Listar os preços de cada opção'],
              correctIndex: 1,
              explanation: 'Reconhecer o que depende do contexto é mais útil que uma resposta falsamente definitiva.',
            },
          ],
        },
        {
          title: 'Prompts criativos e de imagem',
          description:
            'Brainstorm com quantidade e restrição, roteiro em blocos e a fórmula de 4 camadas para prompts de imagem que funcionam.',
          durationMin: 15,
          content: `Criatividade com IA não é pedir "me surpreenda". É quantidade com direção, restrição que aperta e iteração controlada. Nesta aula: brainstorm, roteiro e a fórmula do prompt de imagem.

## Brainstorm estruturado
Pedido fraco: "me dê ideias para o projeto". Pedido estruturado:
"Liste 12 ideias para [OBJETIVO], respeitando 2 restrições: usar apenas [RECURSO DISPONÍVEL] e cada ideia de uma categoria diferente, sem repetir tipo. Marque com asterisco as 3 mais baratas de executar."
Quantidade força variedade; restrição força criatividade de verdade; o marcador final cria curadoria dentro do próprio pedido.

## Roteiro de vídeo e apresentação
"Escreva um roteiro de [DURAÇÃO] para [PÚBLICO] sobre [TEMA], dividido em blocos: gancho nos primeiros segundos, desenvolvimento em 2 a 3 pontos e fecho com chamada clara. Para cada bloco, indique o tempo estimado e uma sugestão visual."
O gancho no começo é o que segura a atenção; o tempo estimado por bloco evita o roteiro de 10 minutos para um vídeo de 2.

## A fórmula do prompt de imagem
Geradores de imagem respondem a quatro camadas:
- Sujeito: o que aparece — "uma raposa de óculos lendo um livro".
- Estilo: como é renderizado — "ilustração flat, aquarela, foto, pixel art".
- Formato: enquadramento e proporção — "quadrado, close-up, vista de cima".
- Detalhes: cor, luz, fundo — "tons de azul e creme, fundo simples".
Junte tudo: "Raposa de óculos lendo um livro, ilustração flat, formato quadrado, tons de azul e creme, fundo simples." A ordem importa menos que a presença das quatro camadas — prompt só de sujeito devolve imagem só de sorte.

## Iteração de verdade
Mude uma variável por vez: mesma cena, outro estilo; mesmo estilo, outro formato. Assim você aprende o que cada camada faz e monta um repertório pessoal de combinações que funcionam para o seu estilo.

## Sua tarefa
Monte um prompt de imagem com a fórmula de 4 camadas para uma necessidade real (capa de trabalho, arte de post). Gere 2 versões mudando apenas o estilo, escolha uma e salve as duas versões do prompt para comparar.`,
          quiz: [
            {
              prompt: 'Qual é a fórmula do prompt de imagem?',
              options: ['Pergunta + resposta + exemplo', 'Sujeito + estilo + formato + detalhes', 'Título + legenda + hashtag'],
              correctIndex: 1,
              explanation: 'As 4 camadas cobrem o quê, como é renderizado, o enquadramento e os acabamentos.',
            },
            {
              prompt: 'O que torna um brainstorm com IA mais forte?',
              options: ['Quantidade definida + restrições claras + critério de destaque', 'Pedir uma única ideia perfeita', 'Não dar nenhuma direção para não limitar'],
              correctIndex: 0,
              explanation: 'Quantidade gera variedade, restrição gera relevância e o marcador gera curadoria — junto, viram método.',
            },
            {
              prompt: 'Na iteração de imagens, o certo é:',
              options: ['Mudar tudo de uma vez a cada tentativa', 'Mudar uma variável por vez para aprender o que cada camada faz', 'Nunca repetir o mesmo prompt'],
              correctIndex: 1,
              explanation: 'Mudança única por tentativa isola o efeito de cada camada — teste controlado também serve para arte.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 4 · Biblioteca profissional e projeto final',
      description:
        'Fechar o ciclo como profissional: avaliar e versionar seus prompts com critérios, proteger seus dados e entregar a biblioteca de 20 prompts.',
      lessons: [
        {
          title: 'Avaliando e melhorando seus prompts',
          description:
            'Os 3 critérios de qualidade, o teste A/B de prompts e o registro que transforma repetição em intuição.',
          durationMin: 16,
          content: `Prompt bom não é o que soa sofisticado: é o que entrega. Nesta aula você aprende a julgar os seus prompts com critérios e a melhorá-los com testes, não com achismo.

## Os 3 critérios de qualidade
- Clareza: outra pessoa entenderia o que você quer, só lendo o prompt? Se você precisa explicar o que "quis dizer", o prompt falhou.
- Restrições: tamanho, tom e formato estão definidos? Prompt sem restrição devolve a resposta média.
- Testabilidade: dá para comparar duas saídas e decidir objetivamente qual é melhor? Se não dá, o pedido está vago demais para melhorar.
Um prompt pode passar nos 3 e ainda entregar mal — mas dificilmente melhora sem eles.

## O teste A/B de prompts
Mesma tarefa, duas versões do prompt, rodadas na mesma conversa: versão A e versão B. Compare as saídas contra os critérios: qual atendeu o formato? Qual precisou de menos correção? Qual soou melhor para o público?
Importante: mude uma coisa por vez entre A e B. Se você mudou papel, formato e tamanho juntos, não sabe o que melhorou — teste controlado também vale para prompts.

## O registro que vira intuição
Uma linha por teste basta: qual prompt, o que mudou, o que melhorou. Em poucas semanas o registro revela os seus padrões — "prompts com exemplo saem melhor", "tabela sempre vence prosa" — e essa é a diferença entre quem acumula anos de uso e quem repete o primeiro mês cem vezes.

## Diagnóstico rápido de resposta ruim
- Resposta genérica? Falta papel e contexto.
- Resposta longa demais? Falta formato e tamanho.
- Resposta inventada? Falta a instrução anti-invenção ("se não souber, diga que não sabe").
- Resposta certa no formato errado? Só o F do PCTF precisa de ajuste.
Quatro sintomas, quatro correções — quase todo prompt ruim cai em um deles.

## Sua tarefa
Pegue um prompt que você usa com frequência e dê nota de 0 a 2 para cada critério (clareza, restrições, testabilidade). Escreva a versão 2 corrigindo as notas baixas, rode A e B na mesma tarefa e registre o resultado em uma linha.`,
          quiz: [
            {
              prompt: 'Um prompt é testável quando:',
              options: ['É curto', 'Dá para comparar duas saídas e decidir objetivamente qual é melhor', 'Já foi usado mais de uma vez'],
              correctIndex: 1,
              explanation: 'Sem critério objetivo de comparação, não existe melhoria — só troca de versão por gosto.',
            },
            {
              prompt: 'Resposta genérica indica, na maioria das vezes:',
              options: ['Falta de papel e contexto no prompt', 'Problema na ferramenta', 'Tema difícil demais'],
              correctIndex: 0,
              explanation: 'Genérico é o caso médio — papel e contexto são o que puxa a resposta para o seu caso.',
            },
            {
              prompt: 'No teste A/B, por que mudar uma coisa por vez?',
              options: ['Para o teste ficar mais rápido', 'Para saber exatamente qual mudança causou a melhora', 'Porque a IA aceita só uma mudança por vez'],
              correctIndex: 1,
              explanation: 'Mudanças isoladas permitem atribuir o resultado — mudou tudo junto, aprendeu nada.',
            },
          ],
        },
        {
          title: 'Segurança, ética e dados sensíveis',
          description:
            'A lista do que nunca colar, como anonimizar material sensível, transparência sobre uso de IA e direitos autorais em linhas gerais.',
          durationMin: 14,
          content: `Prompt é dado que você envia para um serviço externo — em muitos casos, pode ficar armazenado ou ser revisado em situações de abuso da plataforma. Antes de virar power user, feche a base: o que não vai nunca no prompt.

## A lista do nunca
- Senhas, códigos de verificação e dados de acesso. Nenhum pedido justifica.
- Dados pessoais de terceiros: nomes completos, documentos, notas, endereços de outras pessoas.
- Provas e avaliações ainda não aplicadas: colar questões de prova em andamento é fraude, não estudo. Treinar com provas passadas e públicas é outra história.
- Documentos confidenciais de terceiros: contratos, dados de clientes, material interno de trabalho ou estágio.

## Como analisar material sensível com segurança
Anonimize antes de colar: troque nomes por "Cliente A", notas por "[nota]", remova qualquer identificador. E pergunte-se: se esse prompt vazasse amanhã, haveria problema para alguém? Se sim, limpe antes de enviar. O padrão do prompt quase nunca depende do nome real — depende da estrutura da situação.

## Transparência sobre uso de IA
Cada instituição tem regra própria: universidades variam entre proibir, permitir com declaração e liberar; empresas criam políticas próprias. A postura segura: quando o texto importa (trabalho acadêmico, entrega profissional, publicação), conheça a política do lugar e declare o uso quando for esperado. Escondido, o uso de IA vira risco; declarado, vira método.

## Direitos autorais em linhas gerais
Três cuidados práticos, sem aprofundar o jurídico:
- Não peça para "reformular" trechos longos de texto protegido para disfarçar cópia — continua sendo obra de alguém.
- Cite as fontes como sempre citou: a IA acelera o trabalho, não substitui a referência.
- O tratamento legal de material gerado por IA varia entre países e contextos; para algo que vai virar produto, informe-se sobre a regra do seu caso.

## Sua tarefa
Abra o histórico das suas últimas conversas com IA e audite: existe ali algo que você não colocaria num cartaz na rua? Monte a sua lista pessoal de "nunca colar" com pelo menos 5 itens e guarde junto da sua biblioteca de prompts.`,
          quiz: [
            {
              prompt: 'Por que senhas nunca devem ir em prompts?',
              options: ['Porque a IA não entende senhas', 'Porque o prompt é dado enviado a um serviço externo e pode ficar armazenado', 'Porque deixa a resposta lenta'],
              correctIndex: 1,
              explanation: 'O prompt deixa de ser seu no momento do envio — dado de acesso não entra nessa fila.',
            },
            {
              prompt: 'Para analisar documento de terceiros com IA, o caminho seguro é:',
              options: ['Colar tudo rápido e apagar depois', 'Anonimizar nomes e identificadores antes de colar', 'Pedir para a IA esquecer a conversa'],
              correctIndex: 1,
              explanation: 'Anonimizado, o documento mantém a estrutura que interessa e perde o risco que não interessa.',
            },
            {
              prompt: 'Sobre o uso de IA em trabalhos acadêmicos:',
              options: ['Não precisa verificar nada', 'Cada instituição tem regra própria; a postura segura é conhecer a política e declarar quando esperado', 'IA é sempre proibida em qualquer lugar'],
              correctIndex: 1,
              explanation: 'A regra varia por instituição — conhecê-la e declarar o uso transforma risco em método.',
            },
          ],
        },
        {
          title: 'Projeto final: sua biblioteca de 20 prompts',
          description:
            '20 templates em 4 categorias, o padrão de qualidade que separa biblioteca de coleção e a ponte para o próximo curso da trilha.',
          durationMin: 20,
          content: `Chegou a hora de fechar o ciclo: seu projeto final é uma biblioteca pessoal com 20 prompts organizados e testados — o ativo que você vai usar no semestre inteiro e levar para qualquer ferramenta de IA.

## O que entregar
20 templates, 4 categorias, 5 em cada:
- Estudo: questões por nível, plano com revisão, fichamento, simulado de prova, explicador de conceito difícil.
- Escrita: e-mail difícil, relatório por seções, reescrita em 3 tons, títulos e ganchos, revisão com critérios.
- Análise: prós e contras com pesos, riscos com plano B, tabela comparativa, suposições declaradas, resumo em camadas.
- Criatividade: brainstorm estruturado, roteiro em blocos, prompt de imagem (fórmula de 4 camadas), variação de ideia, nomes e slogans.

## O padrão de qualidade
Cada template precisa ter: nome claro, o PCTF completo embutido, de 1 a 3 variáveis entre colchetes e uma anotação de onde funciona melhor ("bom para provas de exatas", "usar a versão com exemplos").
E a regra que separa biblioteca profissional de coleção de prompts: cada template roda pelo menos uma vez antes de ser arquivado. Prompt não testado é rascunho.

## Como montar sem travar
- Resgate os melhores das aulas: quase metade da biblioteca já existe nos seus cadernos deste curso.
- Complete as lacunas por categoria — as que faltarem são justamente as suas áreas menos exploradas.
- Versione desde o primeiro dia: nome, v1, data.

## A rotina que sustenta
Todo prompt que funcionar bem entra na biblioteca no mesmo dia. Uma revisão por mês: apague o que não usa, melhore o que quase funciona. Biblioteca viva vale mais que arquivo perfeito.

## A ponte para o próximo passo
Com a biblioteca no bolso, falta o outro lado da moeda: encontrar e verificar informação com método. É o que você aprende no próximo curso da Trilha IA para Estudantes — Pesquisa Estruturada com IA, o Curso 3 —, onde seus templates de análise e síntese entram em campo para separar fonte boa de ruído.

## Sua tarefa
Monte o arquivo da sua biblioteca com 20 templates organizados nas 4 categorias e rode 3 deles ainda esta semana. Este é o projeto de entrega do curso — e a ferramenta que você mais vai usar daqui para frente.`,
          quiz: [
            {
              prompt: 'Quais são as 4 categorias da biblioteca final?',
              options: ['Estudo, escrita, análise e criatividade', 'Texto, imagem, áudio e vídeo', 'Fácil, médio, difícil e bônus'],
              correctIndex: 0,
              explanation: 'As categorias cobrem as 4 áreas do módulo 3 — 5 templates em cada, 20 no total.',
            },
            {
              prompt: 'O que separa biblioteca profissional de coleção de prompts?',
              options: ['Ter mais de 50 templates', 'Cada template roda pelo menos uma vez antes de ser arquivado', 'Guardar tudo em inglês'],
              correctIndex: 1,
              explanation: 'Prompt testado é ativo; prompt não testado é rascunho com nome bonito.',
            },
            {
              prompt: 'Qual é o próximo curso da Trilha IA para Estudantes?',
              options: ['Edição de Vídeo', 'Pesquisa Estruturada com IA', 'Programação em Python'],
              correctIndex: 1,
              explanation: 'O Curso 3 da trilha ensina a encontrar e verificar informação com método — a outra metade do método.',
            },
          ],
        },
      ],
    },
  ],
}
