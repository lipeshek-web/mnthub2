// Cursos das novas áreas — 4 novos mentores, 5 cursos
import type { CourseDef } from './seed-types'

export const newAreaCourses: CourseDef[] = [
  {
    mentorEmail: 'camila@demo.com',
    title: 'Produtividade e Hábitos de Alta Performance',
    description:
      'Pare de depender de força de vontade. Neste curso você entende a ciência dos hábitos, monta um sistema de foco real (deep work, Pomodoro, controle de distrações) e desenha uma rotina que se sustenta nos meses — não nas segundas-feiras animadas. Psicóloga organizacional, ensino o método que aplico com executivos há 8 anos.',
    category: 'Saúde & Bem-estar',
    level: 'INICIANTE',
    price: 79,
    coverUrl: '/uploads/seed/course-habitos.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'A ciência dos hábitos',
        description: 'Como hábitos funcionam e por que força de vontade não basta.',
        lessons: [
          {
            title: 'A anatomia de um hábito',
            description: 'Gatilho, rotina, recompensa — o circuito que governa seus dias.',
            durationMin: 14,
            content:
              '40% do que você faz num dia não é decisão — é hábito. Entender o circuito é o primeiro passo para redesenhá-lo.\n\n## O loop do hábito\n\n1. **Gatilho (deixa)**: o sinal que dispara — hora, lugar, pessoa, emoção ("senti o celular vibrar").\n2. **Rotina**: o comportamento ("abri o Instagram").\n3. **Recompensa**: o que o cérebro ganha ("dopamina da novidade") — é ela que grava o hábito.\n\n## Por que força de vontade falha\nVontade é um recurso finito: acaba no estresse, no cansaço, na fome. Quem "tem disciplina" na verdade montou AMBIENTES que economizam vontade: fruta visível, celular fora do quarto, tênis ao lado da cama.\n\n## O exercício de hoje\nEscolha UM hábito que quer mudar e mapeie o loop: qual o gatilho? qual a recompensa real que ele entrega? Anote por 3 dias. Você não muda o que não enxerga — e gatilhos identificados são gatilhos redesignáveis.\n\n## O princípio diretor do curso\nNão focamos no GOAL ("ler 12 livros no ano"), focamos no SISTEMA ("20 min de leitura após o café, livro no travesseiro"). Metas definem direção; sistemas geram movimento.',
          },
          {
            title: 'As 4 leis para criar (ou quebrar) qualquer hábito',
            description: 'O framework prático de mudança comportamental.',
            durationMin: 18,
            content:
              '## Para CRIAR um hábito, torne-o:\n\n1. **Óbvio**: gatilho visível. Quer meditar? Tapete no meio do quarto. Quer ler? Celular carrega FORA do quarto e livro na mesinha.\n2. **Atrativo**: junte ao que já ama ("podcast favorito só na caminhada").\n3. **Fácil**: reduza o atrito. A regra dos 2 minutos: a versão inicial do hábito deve levar menos de 2 min ("escrever" vira "escrever 1 frase"). Comece pequeno a ponto de ser impossível falhar.\n4. **Satisfatório**: comemore na hora (checklist marcado, célula de hábito preenchida). Recompensa imediata grava melhor que consequência futura.\n\n## Para QUEBRAR um hábito, inverta tudo:\n\n- **Invisível**: app viciante fora da tela inicial, logout, sem notificação.\n- **Desagradável**: associe ao custo ("cada scroll noturno = manhã destruída" — escreva o custo REAL).\n- **Difícil**: atrito extra (senha longa, app em pasta funda, celular fora do quarto).\n- **Insatisfatório**: parceiro de responsabilidade que cobra.\n\n## A regra do nunca-duas-vezes\nFaltar um dia é acidente; faltar dois é o começo de um hábito novo (o de desistir). A régua do curso: nunca falhe 2x seguidas no mesmo hábito.',
            quiz: [
              {
                prompt: 'Quer criar o hábito de ler todo dia. Qual ação tem maior alavancagem?',
                options: [
                  'Comprar 10 livros de uma vez',
                  'Deixar o livro aberto no travesseiro e o celular carregando fora do quarto',
                  'Baixar 5 apps de leitura',
                  'Decidir "a partir de segunda leio 1h por dia"',
                ],
                correctIndex: 1,
                explanation:
                  'Ambiente vence força de vontade: gatilho visível (livro no travesseiro) + atrito no concorrente (celular longe) são as leis da obviedade e da dificuldade trabalhando juntas.',
              },
            ],
          },
        ],
      },
      {
        title: 'Sistema de foco',
        description: 'Deep work, Pomodoro e a guerra contra as distrações.',
        lessons: [
          {
            title: 'Deep work: 2 horas que valem o dia',
            description: 'Trabalho profundo é habilidade treinável — não dom.',
            durationMin: 18,
            content:
              '## A verdade incômoda\n8 horas de trabalho com 30 interrupções produzem menos que 3 horas de foco absoluto. Multitarefa é mito medido: cada troca de contexto custa ~20 minutos de recuperação total. Seu dia está cheio de "custos invisíveis".\n\n## O bloco de deep work\n\n1. **Agende ANTES**: bloco de 90-120 min no calendário, tratado como reunião com o CEO (você).\n2. **Uma tarefa só**: defina na véspera o entregável do bloco ("escrever a proposta até o item 3"). Tarefa definida = menos chance de fugir.\n3. **Ambiente blindado**: celular em outro ambiente (presença física importa mais que silêncio), notificações mortas, uma aba só.\n4. **Ritual de início**: mesma música, mesmo café, mesmo gesto — rituais condicionam o cérebro a "entrar em modo foco" mais rápido com repetição.\n\n## Comece onde você está\nSe 90 min parece impossível, comece com 45. O músculo de atenção TREINA: cada bloco cumprido aumenta a duração natural. Quem chega a 3 blocos/dia de trabalho profundo produz mais que a maioria dos times inteiros.\n\n## O sinal de que está funcionando\nSai do bloco cansado mas COM ORGULHO do entregável. Se sai do bloco "ocupado mas sem entrega", o bloco foi raso — revise a definição da tarefa e a blindagem do ambiente.',
          },
          {
            title: 'Pomodoro, energia e o mapa das distrações',
            description: 'Estrutura de tempo + gestão de energia + inventário pessoal.',
            durationMin: 20,
            content:
              '## Pomodoro para tarefas que você evita\n25 min de trabalho + 5 de pausa, 4 ciclos e uma pausa longa (20-30 min). Onde brilha: tarefas evitadas — "só 25 minutos" engana o cérebro que resiste. Pausa REAL: levantar, água, janela — scroll não é pausa, é troca de estímulo.\n\n## Energia > tempo\nVocê não tem 12 horas iguais por dia: tem 2-4 horas de pico cognitivo. Mapeie por 5 dias (0-10 em cada bloco de 2h) e descobrirá sua janela — para a maioria: manhã. Regra de ouro: **trabalho profundo no pico; e-mails, reuniões e admin no vale**. Quem responde e-mail no pico gasta o melhor combustível em estrada plana.\n\n## O mapa das distrações (exercício)\nPor 3 dias, cada vez que se distrair, anote: hora / o que sentia ANTES (entediado? ansioso? tarefa difícil?)/ para onde fugiu. Padrões surgem em 48h — a distração quase sempre é FUGA de desconforto (tarefa ambígua, medo de errar). Com o padrão visível, o remédio muda: não é "app de bloqueio", é dividir a tarefa assustadora em um próximo passo de 10 minutos.\n\n## O kit mínimo\nLista diária de NO MÁXIMO 3 prioridades (1 grande + 2 médias) — lista de 15 itens é forma de ansiedade, não de organização.',
            quiz: [
              {
                prompt: 'Seu pico de energia é 9h-11h. O que colocar nessa janela?',
                options: [
                  'E-mails e reuniões — bom esvaziar o dia',
                  'O trabalho mais profundo e importante do dia',
                  'Redes sociais — é hora de conteúdo',
                  'Tarefas fáceis para "aquecer"',
                ],
                correctIndex: 1,
                explanation:
                  'Pico cognitivo é recurso escasso: gastos nele, o dia inteiro rende. Admin e e-mails vivem felizes no vale de energia.',
              },
            ],
          },
        ],
      },
      {
        title: 'Rotina que se sustenta',
        description: 'Manhãs, sono e a revisão semanal que prende o sistema.',
        lessons: [
          {
            title: 'A manhã que define o dia (e a noite que define a manhã)',
            description: 'Rituais de abertura e fechamento.',
            durationMin: 16,
            content:
              '## A verdade sobre manhãs\nA "rotina milagrosa às 5h" é marketing. O que importa: as primeiras 60-90 min despachadas SEM input reativo. Celular na mão ao acordar = seu humor do dia é definido pelo feed e pela caixa de entrada — você começa o dia gerenciando a agenda dos outros.\n\n## Abertura (60-90 min, adapte à sua vida)\n\n1. **Luz e água**: sol na pele e copo d\'água antes de qualquer tela (seta o relógio biológico e a energia).\n2. **Movimento leve**: 10-20 min (caminhada, alongar) — não precisa de treino, precisa de corpo acordando.\n3. **A grande pedra**: a prioridade nº1 do dia antes de abrir e-mail. 30 min nela > 3h depois cheias de interrupção.\n\n## O fechamento que garante a abertura (10 min, fim do expediente)\n\n- Feche o dia: 3 entregas marcadas, 3 prioridades de amanhã escritas.\n- Zero abas abertas, mesa limpa — o amanhã começa sem atrito.\n\n## A noite é o treino da manhã\nRotina noturna fixa (telas fora 30-60 min antes, hora consistente) é o que torna a manhã possível. Sono ruim sabota todo o sistema: com 5h de sono, força de vontade e foco caem mais que qualquer ferramenta compensa. Durma. É o hacks mais barato da alta performance.',
          },
          {
            title: 'Projeto final: seu sistema pessoal em uma página',
            description: 'Hábito, foco e rotina documentados para os 90 dias.',
            durationMin: 22,
            content:
              '## O entregável\nSEU sistema de produtividade em uma página — testado por 90 dias com revisão semanal.\n\n## As seções\n\n1. **O hábito-âncora**: UM hábito novo (regra dos 2 minutos + 4 leis aplicadas) — onde está o gatilho, qual a versão mínima, como comemora.\n2. **O hábito a quebrar**: o loop mapeado + as 4 inversões aplicadas (o que fica invisível/difícil?).\n3. **O bloco de deep work**: dias e horários no calendário, tarefa de cada bloco da semana, ritual de início.\n4. **A janela de energia**: seu pico mapeado + o que entra nele (e o que sai dele).\n5. **A rotina de abertura/fechamento**: horários reais, os 3 passos de cada.\n6. **A revisão semanal**: 20 min, domingo ou sexta — 3 perguntas: o que funcionou? o que quebrou? o próximo passo mínimo de ajuste?\n\n## Como acompanhar\nCélula de hábito simples (papel ou app): marcar X no dia cumprido. A corrente de X\'s vira o jogo — o objetivo no mês 1 não é performance, é NUNCA faltar 2x seguidas.\n\n## O critério real de sucesso\nDia 90: o sistema roda SEM força de vontade — é só "como sua vida funciona". Poste sua página no mural (o compromisso público é lei de satisfação do cérebro). Nos encontros ao vivo reviso sistemas da turma — e a mentoria 1:1 desenha o seu do zero se precisar.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'camila@demo.com',
    title: 'Meditação e Mindfulness para o Dia a Dia',
    description:
      'Aprenda a meditar de verdade — sem incenso e sem esvaziar a mente (isso não existe): respiração, body scan, mindfulness no trabalho e o manejo prático da ansiedade do dia a dia. Curso prático, com meditações guiadas de 5 a 15 minutos e um plano de prática para os 30 dias.',
    category: 'Saúde & Bem-estar',
    level: 'INICIANTE',
    price: 59,
    coverUrl: '/uploads/seed/course-meditacao.png',
    themes: [
      {
        title: 'Começando',
        description: 'O que é mindfulness e suas primeiras práticas guiadas.',
        lessons: [
          {
            title: 'O que mindfulness é (e o que não é)',
            description: 'Desmontando os mitos antes da primeira respiração.',
            durationMin: 12,
            content:
              '## O que NÃO é\n\n- **Não é "esvaziar a mente"** — impossível e nem é o objetivo. A mente PENSANDO é sinal de cérebro saudável. O treino é notar e voltar, não silenciar.\n- **Não é religião** — a prática em si é treino de atenção, estudado por neurociência há 40 anos.\n- **Não é relaxamento** — relaxar é efeito frequente, mas o objetivo é CONSCIÊNCIA. Às vezes meditar é ver ansiedade de frente — e isso é o treino funcionando.\n\n## O que é\nPrestar atenção, de propósito, no momento presente, sem julgar. Três peças: intenção (decidi prestar atenção), atenção (onde coloco ela agora), atitude (curiosidade e gentileza — inclusive com o próprio distraction).\n\n## O que a ciência mostra (sem hype)\nPrática consistente está associada a: redução de ansiedade e ruminação, melhora de foco e sono, regulação emocional. Não é cura para tudo, não substitui tratamento — é treino mental com evidência sólida para bem-estar.\n\n## A postura (a dúvida de todo mundo)\nCadeira com pés no chão, coluna ereta mas não rígida, mãos nas coxas, olhos fechados ou semicírios. Sofá deitado = sono garantido (ótimo para dormir, ruim para treinar atenção). Duração inicial: 5 minutos. Pontualidade da prática > duração da prática.',
          },
          {
            title: 'Primeira prática guiada: a respiração âncora',
            description: '5 minutos de prática guiada, passo a passo.',
            durationMin: 10,
            content:
              'Esta aula É uma prática. Sente-se, leia o mapa abaixo e execute (ou grave lendo devagar para guiar você).\n\n## A prática de 5 minutos\n\n1. **Sentar e encostar** (30s): coluna ereta, pés no chão, olhos fechados. Sinta o peso do corpo na cadeira — onde toca? Deixe o corpo descer um milímetro mais na cadeira.\n\n2. **Três respirações profundas** (30s): pelo nariz, soltando pela boca mais longa que a entrada. A expiração longa ativa o "freio" do sistema nervoso — é o interruptor fisiológico do relaxamento.\n\n3. **Respiração natural como âncora** (3-4 min): deixe a respiração voltar ao ritmo natural. Escolha UM ponto onde ela é mais nítida (narinas ou barriga). Preste atenção lá. Cada respiração: uma. Controle mental 1 a 10 e recomece.\n\n4. **Quando a mente vagar — e ela VAI, dezenas de vezes**: isso NÃO é erro, é A PRÁTICA. O momento de notar que saiu = o "rep" do exercício mental. Sem julgamento: "pensou", e volte à âncora, com a mesma gentileza de chamar de volta uma criança distraída.\n\n5. **Encerrar** (30s): ouça os sons do ambiente, sinta o corpo de novo, abra os olhos devagar.\n\n## Debrief obrigatório\n"Minha mente não parou um segundo" = pratigue CORRETAMENTE (notar é o treino). Repita esta prática diária até a próxima aula: mesmo horário, mesmo lugar, 5 minutos.',
            quiz: [
              {
                prompt: 'Meditar e perceber que a mente vagou dezenas de vezes significa que...',
                options: [
                  'Você é ruim de meditação',
                  'A prática falhou',
                  'Você praticou corretamente — notar o desvio e voltar É o exercício',
                  'Deve tentar forçar a mente a parar na próxima',
                ],
                correctIndex: 2,
                explanation:
                  'Cada "notou e voltou" é uma repetição do treino de atenção — como a série na academia. Mente ativa é o equipamento da prática, não o inimigo dela.',
              },
            ],
          },
        ],
      },
      {
        title: 'Prática diária',
        description: 'Body scan, gratidão e o manejo dos pensamentos.',
        lessons: [
          {
            title: 'Body scan: o exame de presença do corpo',
            description: '10 minutos varrendo o corpo — a prática do sono e da tensão.',
            durationMin: 12,
            content:
              'O body scan treina atenção com sensação física e revela a tensão que você carrega sem notar.\n\n## A prática (10 min)\nDeitado ou sentado. Passe a atenção devagar, região por região, apenas NOTANDO (não mudando): pés → tornozelos → pernas → quadril → barriga (o movimento da respiração ali) → peito → mãos (a região mais fácil de sentir — comece por ela se a mente fugir muito) → braços → ombros/nuca (o estoque de tensão do trabalho) → rosto e mandíbula → cabeça inteira.\n\nOnde achar tensão: não force soltar — apenas "respire até lá" e note 3 respirações na região. A exalação costuma fazer o trabalho sozinha.\n\n## Os usos clínicos do body scan\n\n- **Antes de dormir**: deitado, na cama — cai o sono na metade em média. Se dormir: perfeito, era o objetivo.\n- **Dor crônica/tenção**: muda a RELAÇÃO com a sensação (notar sem brigar reduz o sofrimento somado).\n- **Cheque-in do dia**: versão de 60s sentado — "onde estou tenso agora?" antes de reunião difícil.\n\n## Pratique hoje\n10 minutos antes de dormir com o roteiro acima (grave lendo devagar). Amanhã, registre: como dormiu? Qual região estava mais tensa? O autoconhecimento corporal cresce em 3-4 dias de prática.',
          },
          {
            title: 'Lidando com pensamentos: a sala de espera da mente',
            description: 'Notar, nomear e não entrar na conversa.',
            durationMin: 14,
            content:
              '## A técnica da nomeação\nNa prática, quando um pensamento puxar você (vai puxar sempre), nomeie a categoria e volte: "planejando", "relembrando", "preocupando", "julgando". Nomear cria 2cm de distância — você deixa de ESTAR no pensamento e passa a VER o pensamento.\n\n## A imagem da sala de espera\nImagine seus pensamentos como pessoas numa sala de espera: você é o recepcionista. Eles entram, sentam, e você não precisa atender ninguém. "Preocupação com trabalho? Pode sentar, vou te notar e voltar ao meu trabalho aqui." O poder não é impedir de entrar — é não seguir a conversa.\n\n## Para a ansiedade do dia a dia: o exercício dos 5 sentidos (1 min, em qualquer lugar)\nQuando a cabeça acelerar na fila, no trânsito, antes de apresentar:\n\n- 5 coisas que você VÊ\n- 4 que você TOCA (sinta a roupa, a cadeira)\n- 3 que você OUVE\n- 2 que você CHEIRA\n- 1 que você SABOREIA\n\nFunciona porque ansiedade vive no futuro imaginado; os sentidos só existem no agora. Não é mágica — é âncora portátil.\n\n## O hábito do registro (opcional mas poderoso)\nCaderno pequeno: 1 linha por dia — "mente hoje: agitada / calma / media". Sem análise, só o termômetro. Em 30 dias você conhece seus padrões (quinta à noite é tenso, segunda de manhã flui) e a prática vira sob medida.',
            quiz: [
              {
                prompt: 'Na prática, um pensamento de "preciso responder o e-mail" te puxa. O que fazer?',
                options: [
                  'Sair da meditação para responder — é urgente',
                  'Brigar com o pensamento até ele sumir',
                  'Nomear ("planejando") e voltar gentilmente à âncora',
                  'Julgar-se por não conseguir se concentrar',
                ],
                correctIndex: 2,
                explanation:
                  'Nomear cria a distância de observador e o retorno gentil é o rep do treino. Brigar e julgar alimentam exatamente o loop que a prática treina a soltar.',
              },
            ],
          },
        ],
      },
      {
        title: 'Vida plena',
        description: 'Mindfulness no trabalho, escuta plena e seu ritual de 30 dias.',
        lessons: [
          {
            title: 'Mindfulness fora do almofada: trabalho e escuta',
            description: 'A prática que acontece na vida, não só no tapete.',
            durationMin: 16,
            content:
              '## O minuto presencial (a prática mais subestimada)\nAntes de abrir o computador: 60s sentado, sentindo a cadeira e 10 respirações. Antes de entrar em reunião: 3 respirações + intenção ("escutar antes de responder"). A prática formal treina; o dia a dia é onde ela joga.\n\n## Tarefas como prática\nEscolha UMA tarefa diária para fazer 100% presente (café da manhã, louça, caminho do trabalho): sem podcast, sem celular, sem resolver a vida — só a experiência sensorial. Lavando louça, SENTIR a água morna. É o mindfulness clássico dos monges, disponível na sua pia.\n\n## Escuta plena (transforma relacionamentos)\nNa próxima conversa importante, experimente 5 minutos de escuta pura: sem preparar sua resposta enquanto o outro fala, sem interromper, sem consertar. Só escutar e refletir ("então o que mais te incomodou foi..."). Você vai descobrir quão raro é ser realmente ouvido — e o efeito na relação é imediato.\n\n## O anti-roupagem: notificações conscientes\nEscolha 3 janelas fixas por dia para checar mensagens. Entre elas, o celular fica longe do alcance do braço. Cada "só uma olhadinha" custa 20 min de foco — o mindfulness no trabalho começa com essa escolha estrutural, não com mais força de vontade.',
          },
          {
            title: 'Projeto final: seus 30 dias de prática',
            description: 'O plano de prática que consolida o treino.',
            durationMin: 20,
            content:
              '## O plano dos 30 dias\n\n**Semana 1 — Fundação**: respiração âncora 5 min/dia, MESMO horário e lugar (ancoragem de contexto: o cérebro aprende "nesse canto, é hora de parar").\n\n**Semana 2 — Corpo**: body scan 10 min/dia antes de dormir + 1 tarefa diária em presença total.\n\n**Semana 3 — Mente**: 10 min/dia combinando âncora + nomeação + 5 sentidos quando a cabeça acelerar no dia.\n\n**Semana 4 — Vida**: 10 min formal + os micro-práticos (minuto presencial, escuta plena em 1 conversa/dia, janelas de mensagens).\n\n## O registro\nCaderno ou celular, 1 linha/dia: data + minutos + termômetro mental (1-5). O registro É parte da prática: mostra o padrão e vira o combustível da consistência (a corrente de dias).\n\n## A regra da falha\nVai falhar dias. Falhou? O próximo dia recomeça — sem drama, sem "já que estraguei, abandono". Consistência perfeita não é o alvo; prática total de 20+ dias no mês É.\n\n## Como fechar o curso\nPoste no mural seu dia 30: como a prática mudou seu dia a dia (ou como descobriu que precisa ajustar — isso também é resultado honesto). Quem completar os 30 dias recebe convite para o grupo de prática ao vivo semanal da comunidade, onde meditamos juntos por 15 minutos.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'fernanda@demo.com',
    title: 'Confeitaria Básica: bolos e doces que vendem',
    description:
      'Do zero à primeira venda: os fundamentos técnicos que separam bolo bom de bolo profissional, as receitas base que geram dezenas de variações, e o passo a passo do negócio — precificação, embalagem e como conseguir os primeiros clientes. Para quem sonha em transformar confeitaria em renda.',
    category: 'Culinária',
    level: 'INICIANTE',
    price: 99,
    coverUrl: '/uploads/seed/course-confeitaria.png',
    themes: [
      {
        title: 'Fundamentos da cozinha',
        description: 'Ferramentas, medidas e os erros que estragam receita boa.',
        lessons: [
          {
            title: 'Utensílios e ingredientes: o kit mínimo profissional',
            description: 'O que comprar primeiro (e o que NÃO precisa).',
            durationMin: 14,
            content:
              '## O kit de entrada (investimento enxuto)\n\n**Imprescindíveis:**\n- Balança digital (R$30-50) — a ferramenta nº1. Receita de confeitaria é QUÍMICA: copo medidor tem erro de até 20%; balança não erra.\n- Batedeira (de mão resolve para começar)\n- Formas de 20-22cm (2 redondas + 1 retangular)\n- Espátula de silicone, fouet, peneira\n- Rolo de massa + forminhas básicas\n\n**Deixar para depois:** bicos de confeitar profissionais, pistola, termômetro a laser, estufa. Compre conforme a demanda chegar — dinheiro parado em gadget é o erro do entusiasta.\n\n## Ingredientes: a qualidade onde importa\n\n- **Chocolate**: para derreter/vender, use chocolate fracionário de marca boa (barato demais marca na boca e na aparência).\n- **Farinha**: de trigo comum serve, mas veja o TEOR — receitas profissionais às vezes pedem farinha com mais proteína para estrutura.\n- **Fermento fresco vs químico**: químico (bicarbonato/fermento em pó) para bolos; fresco para pães. Confundir estraga tudo.\n\n## A regra de ouro da cozinha\nMise en place: ANTES de começar, separe TUDO medido e pesado (o termo francês que separa o amador do profissional). No meio da massa descobrir que falta ovo é como receita estraga.',
          },
          {
            title: 'Medidas, temperaturas e os 7 erros fatais',
            description: 'A ciência mínima que salva toda receita.',
            durationMin: 18,
            content:
              '## Confeitaria é química — respeite as proporções\nBolo é equilíbrio entre farinha (estrutura), açúcar (doçura + umidade), gordura (maciez), ovos (estrutura + liga) e líquido. Trocar proporção "no olho" é reinventar a química — e a química sempre ganha.\n\n## Temperaturas que importam\n\n- **Ovos e manteiga em temperatura ambiente** na maioria das receitas: emulsionam melhor. Esqueceu? Ovo em água morna 5 min resolve.\n- **Forno PRÉ-AQUECIDO 15 min antes**: bolo em forno subindo não cresce direito.\n- **Termômetro de forno barato (R$20)**: fornos domésticos mentem 20-40°C — a causa nº1 de "queimei e seguiu a receita".\n\n## Os 7 erros que estragam bolo\n\n1. Abrir o forno antes dos 20 min (desaba).\n2. Bater a manteiga com açúcar por menos tempo (a "cremificação" de 5 min é o que dá leveza).\n3. Farinha demais (seco) — pesar, nunca medir em copo.\n4. Misturar demais depois da farinha (glúten desenvolvido = bolo borrachudo).\n5. Desenformar quente (quebra) — espere 10-15 min.\n6. Testar com garfo no meio da assada (furou, escorreu).\n7. Forno na porta aberta para "olhar rapidinho" (choque térmico).\n\n## Desafio prático\nAssine o teste do palito no CORRECTO: 5 min antes do tempo da receita, palito no CENTRO — sai seco, está pronto. Anote o tempo REAL do SEU forno: cada forno tem personalidade, e a nota do seu vale mais que a da receita.',
            quiz: [
              {
                prompt: 'Por que pesar ingredientes com balança em vez de usar copo medidor?',
                options: [
                  'Só para ficar mais bonito',
                  'Receita de bolo é química: copo tem erro de até 20% e a balança garante proporção exata',
                  'Porque balança é mais rápida',
                  'Não faz diferença nenhuma',
                ],
                correctIndex: 1,
                explanation:
                  'Volume varia com como se enche (farinha compactada dobra o peso). Em confeitaria, 10% de erro na farinha já muda a estrutura do bolo.',
              },
            ],
          },
        ],
      },
      {
        title: 'Receitas base',
        description: 'As receitas que geram dezenas de variações.',
        lessons: [
          {
            title: 'Bolo branco perfeito (a base de tudo)',
            description: 'A receita mestre e suas variações infinitas.',
            durationMin: 24,
            content:
              '## A receita base (forma 22cm)\n\n- 300g de farinha de trigo\n- 280g de açúcar\n- 200g de manteiga sem sal (temperatura ambiente)\n- 4 ovos\n- 180ml de leite\n- 15g de fermento em pó\n- 1 pitada de sal\n- 1 colher de chá de essência (baunilha)\n\n## O método (a ordem É a receita)\n\n1. Creme a manteiga com o açúcar por **5 minutos** (não 1!): fica claro e fofo — é aqui que nasce a textura.\n2. Ovos um a um, cada um incorporado antes do próximo.\n3. Alterne farinha+fermento (peneirados) com o leite, começando e terminando na farinha, misturando o MÍNIMO necessário.\n4. Forno 180°C preaquecido, 35-40 min, teste do palito no centro.\n\n## As variações que fazem o catálogo\nEssa MESMA base vira:\n\n- **Laranja**: suco no lugar do leite + raspas.\n- **Coco**: leite de coco + coco ralado.\n- **Fubá**: 1/3 da farinha por fubá mimoso.\n- **Chocolate**: 40g de cacau em pó (reduza 40g de farinha).\n\nUma receita dominada = um catálogo. Pratique ela 3x antes de qualquer outra: a segunda sai melhor, a terceira sai de olhos fechados.',
          },
          {
            title: 'Ganache, coberturas e brigadeiro gourmet',
            description: 'Os acabamentos que multiplicam o preço.',
            durationMin: 20,
            content:
              '## Ganache na proporção certa\n\n- **Recheio macio**: 2 partes de chocolate : 1 de creme de leite\n- **Cobertura brilhante**: 1 : 1\n- **Trufa firme** (para bolinhas): 2 : 1\n\nMétodo: aqueça o creme quase fervendo, desligue, jogue sobre o chocolate picado, espere 2 min, misture do centro para fora. Bateu ou talhou? Creme estava fervendo demais — aqueça 1 colher de leite e misture que volta.\n\n## Brigadeiro gourmet (o produto de maior margem)\n\n- 395g leite condensado\n- 50g chocolate 50%+ (picado) ou cacau de qualidade\n- 20g manteiga\n\nFogo BAIXO, mexendo sempre, até desgrudar do fundo (~10 min). O teste: incline a panela — a massa se move em bloco. Ponto de enrolar: esfriar 4h (ou 30 min no freezer). Fino e brilhante no gourmet: enrolar com manteiga nas mãos, granulado de chocolate (não o arco-íris do mercado) para o acabamento adulto.\n\n## Por que acabamento vale ouro\nO mesmo bolo com ganache lisa, bordas limpas e uma decoração sóbria vende 2-3x mais. O cliente come com os olhos primeiro — e a próxima aula (embalagem e apresentação) aprofunda exatamente isso.',
          },
        ],
      },
      {
        title: 'Do doce ao negócio',
        description: 'Precificação, embalagem e as primeiras vendas.',
        lessons: [
          {
            title: 'Precificação: o erro que quebra confeiteiras',
            description: 'Custo real + margem = preço sustentável.',
            durationMin: 20,
            content:
              '## O erro nº1 do início\nPreço = ingredientes + "um pouco". Esse "um pouco" esquece o que te faz confeiteira: SEU trabalho. Resultado clássico: cheia de pedidos, sem lucro, exausta, desistindo em 6 meses.\n\n## A conta completa\n\n**1. Custo de ingredientes** por unidade (pese TUDO, até o 1g de fermento).\n\n**2. Custo indireto proporcional**: gás/energia, embalagem, transporte, água — estime 15-20% sobre o ingrediente.\n\n**3. Sua hora de trabalho**: defina um valor/hora justo (ex.: R$20-35/h para início). Conta: tempo total da produção (incluindo compra, preparo, lavar louça, entrega?) × valor/hora ÷ unidades produzidas.\n\n**4. Margem de lucro** (o que faz o negócio crescer): 30-50% sobre (1+2+3).\n\n## Exemplo real (brigadeiro gourmet)\nIngrediente R$0,80 + indireto R$0,16 + mão de obra R$0,54 (10 min da hora R$25... wait, ajuste: 12 min) = custo R$1,50. Com margem 100%: **R$3,00-3,50** — e brigadeiro gourmet de qualidade se vende nesse preço em qualquer cidade.\n\n## O teste do preço\nSe seu preço assusta: antes de derrubar, melhore APRESENTAÇÃO e embalagem — muitas vezes o problema não é o preço, é o valor percebido. Derrubar preço é a última alavanca, não a primeira.',
            quiz: [
              {
                prompt: 'Na precificação, o que o erro mais comum de iniciante esquece?',
                options: [
                  'O preço do açúcar',
                  'O custo da própria mão de obra e os custos indiretos (energia, embalagem)',
                  'O sabor da receita',
                  'O imposto de renda',
                ],
                correctIndex: 1,
                explanation:
                  'Cobrar ingredientes + "um pouco" gera trabalho gratuito e prejuízo mascarado. Hora de trabalho e indiretos são parte OBRIGATÓRIA do custo.',
              },
            ],
          },
          {
            title: 'Projeto final: do teste à primeira venda',
            description: 'Catálogo, embalagem e o plano de venda dos 30 dias.',
            durationMin: 24,
            content:
              '## O entregável\nSeu mini-negócio de confeitaria operando: catálogo, precificação, embalagem e as 3 primeiras vendas.\n\n## O roteiro dos 30 dias\n\n**Semana 1 — Domine 3 produtos**: bolo base (1 variação), brigadeiro gourmet, 1 cobertura. Faça cada um 2x. Prove com 5 pessoas diferentes e anote feedback honesto.\n\n**Semana 2 — Precifique e embale**: ficha de custo de cada produto (com sua hora!) + preço final. Kit de embalagem: caixa limpa, fita da sua cor, tag com nome/seu contato (impressão caseira resolve o início) — apresentação é marketing gratuito.\n\n**Semana 3 — Crie a vitrine**: fotos com luz natural de janela (nunca flash!) em fundo limpo; catálogo simples no WhatsApp Business (catálogo nativo) ou Instagram. Peça para 5 pessoas próximas divulgarem com as fotos.\n\n**Semana 4 — Venda**: ofereça ao círculo real (família, trabalho, grupo do prédio): encomenda mínima clara, prazo de 2-3 dias, pagamento antecipado (Pix). Entregue no prazo, embalado, com um brinde pequeno (1 brigadeiro extra) e peça foto + depoimento.\n\n## As 3 regras do início\n\n1. **Poucos produtos, execução impecável** — 3 produtos excelentes vendem mais que 15 medianos.\n2. **Prazo é sagrado** — na confeitaria de encomenda, atraso mata cliente mais que sabor mediano.\n3. **Cada cliente satisfeito é um vendedor** — peça sempre indicação com gentileza.\n\nPoste no mural suas primeiras fotos e o resultado das primeiras vendas — comemoramos cada primeira venda como festival, e as dúvidas de precificação eu reviso individualmente na mentoria 1:1.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'lucas@demo.com',
    title: 'Fotografia com Celular: do clique à venda',
    description:
      'A melhor câmera é a que está com você. Aprenda luz, composição e edição para fotografar produtos, pessoas e comida com o celular — e transforme o skill em renda: fotos para lojas, pequenos negócios e o seu próprio Instagram profissional. Sem equipamento caro: só método e olhar treinado.',
    category: 'Fotografia',
    level: 'INICIANTE',
    price: 89,
    coverUrl: '/uploads/seed/course-fotografia.png',
    themes: [
      {
        title: 'Fundamentos',
        description: 'Luz, composição e o controle da câmera do celular.',
        lessons: [
          {
            title: 'Luz é tudo: o fotografar que ninguém ensina',
            description: 'Janela, sombra e as horas de ouro.',
            durationMin: 16,
            content:
              '## A verdade da fotografia\nCâmera boa não salva luz ruim; luz boa faz celular virar câmera. 80% da qualidade da foto é DECISÃO DE LUZ.\n\n## A janela: seu estúdio gratuito\nLuz de janela é suave, direcional e linda:\n\n- **Objeto a 45-90° da janela** (nunca de costas para ela): cria volume e sombra elegante.\n- Cortina branca/papel vegetal se estiver dura demais.\n- Fundo branco (cartolina) do lado oposto "rebate" luz e suaviza sombras — rebatedor de R$2.\n\n## Luz que EVITAR\n\n- **Flash do celular**: chapada, achata, mata textura. Desligado sempre (salvo emergência).\n- **Sol direto do meio-dia**: sombras duras e sujeito cegado.\n- **Luz de teto à noite**: sombra amarela embaixo dos olhos — por isso "fotos noturnas ruins".\n\n## As horas de ouro\n1h após o nascer e 1h antes do pôr do sol: luz dourada, suave, que favorece QUALQUER assunto. Para retratos ao ar livre: céu nublado é estúdio gigante (nuvem = difusor natural).\n\n## O exercício do dia\nFotografe o MESMO objeto em 4 luzes: janela frontal, lateral 45°, contra-luz, e lâmpada de teto. Compare lado a lado. Seus olhos aprendem mais com esse exercício de 15 min que com 10 vídeos teóricos.',
          },
          {
            title: 'Composição: o enquadramento que encanta',
            description: 'Regra dos terços, linhas e limpeza de fundo.',
            durationMin: 16,
            content:
              '## Regra dos terços\nDivida mentalmente a tela em 3×3. Pontos de interesse nos cruzamentos (não no centro) = foto com respiro e equilíbrio. Ative a GRADE no seu celular (Ajustes → Câmera → Grade): é o treino visual permanente — com semanas, você compõe em terços sem pensar.\n\n## As 5 regras rápidas\n\n1. **Limpe o fundo**: 90% das fotos caseiras morrem no fundo bagunçado. Mova 2 passos, mude o ângulo, uma folha lisa atrás — fundo neutro valoriza qualquer sujeito.\n2. **Chegue mais perto** (ou use a lente 2x): detalhe rende mais que foto geral. "Se a foto não está boa, não chegou perto o suficiente."\n3. **Linhas guias**: estradas, corrimãos, muros — linhas que levam o olho até o sujeito.\n4. **Espaço para respirar**: retrato olhando para o lado? Deixe espaço NA direção do olhar.\n5. **Perspectiva baixa**: fotografe produtos/animais/crianças na ALTURA deles — o ângulo de adulto olhando para baixo achata tudo.\n\n## Lentes do celular\n\n- **1x (principal)**: a melhor qualidade — prioridade sempre.\n- **2x**: ótima para retrato e detalhe.\n- **Zoom digital 3x+**: qualidade despenca — prefira andar.\n- **0.5 ultra-wide**: só para espaços grandes; bordas distorcem rosto.\n\n## Desafio\nReproduza UMA foto que você admira (post, capa) usando: terços, fundo limpo e luz de janela. Depois compare lado a lado e anote 2 diferenças — é assim que o olho cresce.',
            quiz: [
              {
                prompt: 'Fotografando um produto perto de uma janela, a melhor posição é:',
                options: [
                  'Objeto de costas para a janela (luz pela frente)',
                  'Objeto a 45-90° da janela, com fundo limpo',
                  'Objeto no canto escuro do quarto',
                  'Com o flash ligado para compensar',
                ],
                correctIndex: 1,
                explanation:
                  'Luz lateral de janela cria volume e textura; de costas para a janela você fotografa silhueta (ou o celular estoura o fundo tentando compensar).',
              },
            ],
          },
        ],
      },
      {
        title: 'Prática',
        description: 'Produtos, pessoas e comida — os três mercados que pagam.',
        lessons: [
          {
            title: 'Fotografia de produto (o mercado que mais paga)',
            description: 'Fundo, tripé e o padrão que lojas compram.',
            durationMin: 20,
            content:
              'Por que começar por produto? Demanda constante (todo pequeno negócio vende online), não precisa de modelo, e o padrão profissional é reproduzível com método.\n\n## O setup dos R$20\n\n- **Fundo**: papel cartolina A2 branco (ou TNT) colado na parede caindo sobre a mesa — a curva infinita caseira.\n- **Luz**: janela lateral + rebatedor (cartolina branca) do lado oposto.\n- **Tripé ou apoio**: fotos de produto precisam de nitidez absoluta — apoie o celular (ou tripé de R$30).\n- **Timer de 3s**: apertar o botão treme a foto.\n\n## As 4 fotos que todo lojista precisa\n\n1. **Fundo branco limpo** (para catálogo/marketplace): produto centrado, sombra suave.\n2. **Contexto/lifestyle**: produto em uso/ambiente (o batom na mão, o bolo na mesa posta).\n3. **Detalhe macro**: textura do tecido, borda do doce — o que vende é a proximidade.\n4. **Escala**: com referência (mão, moeda) para tamanho real.\n\n## O briefing que o cliente espera\nConsistência: MESMA luz, MESMO ângulo, MESMO fundo em toda a linha de produtos. Catálogo homogêneo parece loja grande — e loja grande paga bem. Esse é o entregável que você vende: 10 produtos × 4 fotos, padronizadas.',
          },
          {
            title: 'Pessoas e comida: retrato e food nos mínimos',
            description: 'Naturalidade e apetite no clique.',
            durationMin: 18,
            content:
              '## Retrato que respeita\n\n- **Luz**: janela lateral; sombra dura na cara = reposicione a pessoa, não insista.\n- **Altura dos olhos** (ou levemente acima para suavizar queixo) — nunca de baixo para cima.\n- **Interaja**: conte piada, peça para se mover ("anda devagar até mim e fala do seu trabalho") — pessoas rígidas viram fotos rígidas. Naturalidade se CONDUZ, não se espera.\n- Modo retrato (desfoque): use com critério — cabelos rebeldes e óculos viram desastre de recorte. Às vezes o 2x normal é melhor.\n\n## Food: a luz da janela e a história\n\n- **Luz lateral de janela** é a regra sagrada — frontal achata, flash mata.\n- **Ângulos**: 45° para pratos com altura (hambúrguer, bolo), 90° (de cima) para mesas postas e bowls, 0° (rasteiro) para bebidas e empilhados.\n- **Imperfeição deliberada**: migalha de farinha, garfo "usado", vapor — comida PERFEITA parece plástica. Desarrume um pouco antes de fotografar.\n- **Frescor é cronômetro**: salada murcha em 5 min sob luz, sorvete derrete — monte TUDO (luz, ângulo, fundo) ANTES, e só então a comida entra em cena.\n\n## O mini-portfólio de cada nicho\nEscolha UM nicho (produto, retrato ou food) para o projeto final: 10 fotos padronizadas com as técnicas deste módulo. Nicho definido = marketing direto = primeiros clientes mais rápido.',
          },
        ],
      },
      {
        title: 'Pós-produção e venda',
        description: 'Edição, portfólio e como cobrar pelos serviços.',
        lessons: [
          {
            title: 'Edição no celular: Lightroom em 6 passos',
            description: 'Do RAW à foto profissional em 2 minutos.',
            durationMin: 18,
            content:
              '## O app\nLightroom Mobile (grátis) — o padrão do mercado. Grave sempre em **HEIF/RAW quando disponível** (Ajustes → Câmera): mais informação para editar.\n\n## A ordem dos 6 ajustes (use sempre a mesma ordem)\n\n1. **Luz**: exposição geral (±0.3 costuma bastar), depois sombras para cima (+10/+20) e altas luzes para baixo (-10/-20): recupera detalhes que o direto não vê.\n2. **Contraste**: leve (+5/+15) — contraste exagerado vira "filtro de rede social".\n3. **Cor**: temperatura (mais frio = profissional em produto; mais quente = acolhedor em comida). Saturação: MUITO leve, vibrância é mais segura (+10).\n4. **Detalhe**: nitidez 20-30, nunca mais — excesso cria halos feios.\n5. **Recorte e endireite**: horizonte torto entregue amador mais que qualquer outra coisa.\n6. **Presets**: achou uma edição que ama? Copie e aplique nas próximas — CONSISTÊNCIA de edição é o que cria identidade (e catálogo homogêneo para o cliente).\n\n## Os 3 pecados da edição\n\n1. Saturação no máximo (o "filtro 2013").\n2. Suavizar pele até virar plástico.\n3. Editar demais a luz — foto que parece editada falhou; a boa parece que "só é bonita".\n\n## A regra final\nEdição refina; não inventa. A foto base boa + edição leve vence foto mediana + edição agressiva em qualquer comparação lado a lado.',
            quiz: [
              {
                prompt: 'Qual sequência de edição segue a ordem profissional?',
                options: [
                  'Filtro chamativo → contraste máximo → nitidez no máximo',
                  'Luz (exposição/sombras/altas luzes) → contraste leve → cor → nitidez → recorte',
                  'Recorte → filtro → saturação no máximo',
                  'Nenhuma edição — profissional não edita',
                ],
                correctIndex: 1,
                explanation:
                  'Luz primeiro (base da imagem), depois contraste e cor, nitidez por último e leve. Toda edição profissional parte da exposição correta.',
              },
            ],
          },
          {
            title: 'Projeto final: portfólio e primeiras vendas',
            description: '10 fotos padronizadas + plano de prospecção.',
            durationMin: 24,
            content:
              '## O entregável\nMini-portfólio de 10 fotos padronizadas em UM nicho + as primeiras prospecções reais.\n\n## Parte 1 — O portfólio (semanas 1-3)\n\n1. Escolha o nicho: produto local, food ou retrato casual.\n2. 10 fotos com consistência total (mesma luz, mesma edição/preset, mesmo recorte). Se produto: 2-3 marcas locais emprestadas em troca das fotos (barter clássico de início de carreira).\n3. Publique no Instagram como "portfólio" (destaques organizados por categoria) — é seu cartão de visitas vivo.\n\n## Parte 2 — Prospecção (semana 4)\n\n1. Liste 10 negócios locais com presença digital fraca (lojas de bairro, confeiteiras, salões, brechós).\n2. O pitch honesto: "Fotografei seu tipo de produto — segue 2 exemplos (fotos). Posso fazer um ensaio teste de 1 produto sem custo; se gostar, trabalho fechado por pacote."\n3. O ensaio teste converte surpreendentemente bem: o lojista VÊ a diferença entre a foto do celular dele e a sua — não precisa de discurso.\n\n## Pricing inicial honesto\nPacote de início: 10 fotos por R$150-300 (nicho produto/food) conforme sua cidade. Suba a cada 3 clientes satisfeitos — preço inicial baixo é ponte, não endereço fixo.\n\n## As regras do negócio\nContrato simples por mensagem (escopo, prazo, entrega, pagamento 50% antecipado). Entregue no prazo SEMPRE — na fotografia local, reputação é o único marketing. Poste seu portfólio no mural: os 3 melhores recebem sessão de feedback ao vivo comigo, e a mentoria 1:1 ajuda a montar seus pacotes de preço.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'thiago@demo.com',
    title: 'Violão do Zero: seus primeiros acordes',
    description:
      'Aprenda violão do absoluto zero: postura, primeiros acordes, batidas e sua primeira música completa em poucas semanas. Método paciente e progressivo — cada aula constrói sobre a anterior, com músicas brasileiras que você já ama. Não precisa saber nada de música: só ter um violão e 20 minutos por dia.',
    category: 'Música',
    level: 'INICIANTE',
    price: 79,
    coverUrl: '/uploads/seed/course-violao.png',
    themes: [
      {
        title: 'Primeiros passos',
        description: 'Conheça o instrumento, sente-se certo e faça o primeiro som.',
        lessons: [
          {
            title: 'Conhecendo seu violão (e o deixando pronto)',
            description: 'Partes, afinação e o ajuste que salva iniciantes.',
            durationMin: 14,
            content:
              '## As partes que importam\n\n- **Cordas**: contadas do mais fino (1ª, a mais aguda) ao mais grosso (6ª). Afinadas em: E-A-D-G-B-E (mi-lá-ré-sol-si-mi).\n- **Casas**: os espaços metálicos no braço. Aperte ENTRE os trastes (perto do traste da frente), não em cima.\n- **Traste**: a barra metálica (não confunda com a casa).\n\n## Afinação: obrigatória todo dia\nViolão desafinado desmotiva mais que qualquer coisa — o ouvido percebe e rejeita. Baixe um app de afinador (GuitarTuna, Cifra Club Tuner): toque a corda solta, o app mostra se está grave (abaixe a tarraxa... ajuste) ou aguda. Ordem: 6ª para a 1ª.\n\n## Nylon ou aço?\n\n- **Nylon (violão clássico)**: mais suave para os dedos — ideal para começar.\n- **Aço**: som mais brilhante, dedos doem mais no início.\nAmbos funcionam para o curso; não compre nada novo por isso.\n\n## O ajuste que salva vidas (ação das cordas)\nCordas altas demais = dor desnecessária e som preso. Se apertar exige força heroica, leve num luthier para regular (R$50-100): é o investimento mais inteligente do iniciante — violão ajustado toca fácil.',
          },
          {
            title: 'Postura, palhetada e seu primeiro som limpo',
            description: 'Os fundamentos que evitam dor e frustação.',
            durationMin: 16,
            content:
              '## A postura correta (direita e canhoto adaptam)\n\n1. Sente na beira da cadeira, coluna ereta relaxada, pés apoiados.\n2. Curva do violão na coxa direita, braço do instrumento levemente para cima (15-20°).\n3. Braço direito apoiado FROUXO sobre o corpo do violão (nunca agarrado).\n4. Punho esquerdo atrás do braço, polegar atrás (âncora), dedos vindo de cima para as cordas.\n\n## A mão direita: dedos com nome\nP = polegar (cordas graves 6-4ª), i = indicador (3ª), m = médio (2ª), a = anelar (1ª).\n\n## Exercício do som limpo (o mais importante da semana)\n\n1. Aperte a 1ª casa da 1ª corda (F): dedo curvedo (bicho-papão), logo ATRÁS do traste, sem tocar as outras cordas.\n2. Toque com "a" — saiu limpo? Repita 10x.\n3. Toque cordas vizinhas: continuam soando limpas? O dedo não pode encostar nelas.\n\n## A palhetada básica (o acompanhamento universal)\nPadrão de dedilhado para TODAS as músicas de este curso:\n\nP (3ª corda) → i → m → a → m → i (contando 1-2-3-4-5-6)\n\nToque lento, cada nota limpa. 10 minutos por dia deste padrão em cordas soltas cria a memória da mão direita — a base de tudo que vem depois.',
            quiz: [
              {
                prompt: 'Onde apertar a corda para o som sair limpo?',
                options: [
                  'Em cima do traste metálico',
                  'Bem longe do traste, no meio da casa',
                  'Logo atrás do traste da frente, com dedo curvado',
                  'Com o polegar da mão esquerda',
                ],
                correctIndex: 2,
                explanation:
                  'Pressão logo atrás do traste exige menos força e evita som abafado/buzzing. Dedo curvado impede encostar nas cordas vizinhas.',
              },
            ],
          },
        ],
      },
      {
        title: 'Acordes e ritmo',
        description: 'Os acordes essenciais e as batidas que tocam o Brasil.',
        lessons: [
          {
            title: 'Seus primeiros acordes: Em, E, Am e D',
            description: 'Quatro formas que abrem centenas de músicas.',
            durationMin: 20,
            content:
              '## Os diagramas (leitura rápida)\nGrade = braço na vertical (cordas de cima para baixo: 6ª...1ª). Número na casa = dedo (1=indicador, 2=médio, 3=anelar, 4=mínimo). O = corda solta, X = não toque.\n\n## Os 4 acordes de entrada\n\n**Em (mi menor)** — o mais fácil do violão:\n2ª corda, 2ª casa (dedo 2) + 3ª corda, 2ª casa (dedo 3). Toque as 6 cordas.\n\n**Am (lá menor)**:\n2ª corda 1ª casa (1), 4ª corda 2ª casa (2), 3ª corda 2ª casa (3). Toque 5 cordas (a partir da 5ª).\n\n**E (mi maior)**:\nIgual ao Am, mas 3ª corda na 1ª casa (dedo 1): 3-2-1 diagonal. 6 cordas.\n\n**D (ré)**:\n3ª corda 2ª casa (1), 1ª corda 2ª casa (2), 2ª corda 3ª casa (3) — o "triangulinho". 4 cordas.\n\n## A rotina de fixação (15 min/dia)\n\n1. Monte o acorde, TOQUE corda por corda: todas limpas? Se buzz, ajuste a pressão/posição antes de prosseguir.\n2. Palhete o padrão P-i-m-a-m-i 4x no acorde.\n3. Troque para o próximo acorde SEM TOCAR (só a mão esquerda voa) — a troca é a habilidade real do violão.\n\n## A verdade sobre a dor\nDedos dóem nas 2 primeiras semanas — normal, diminui com calos (2-3 semanas). Toque DIARIAMENTE 15-20 min (calo se forma com frequência, não com força) e NUNCA toque com dor aguda: descanso de 1 dia resolve.',
          },
          {
            title: 'G, C e a batida simples',
            description: 'Os dois acordes mais usados do Brasil + ritmo de base.',
            durationMin: 22,
            content:
              '## G (sol maior) — o gigante\nVersão completa: 6ª corda 3ª casa (dedo 3... ou 2 na alta), 5ª corda 2ª casa (2), 1ª corda 3ª casa (4 ou 3). Difícil no início? Use a **G simplificada** (só 3 dedos sem a 6ª corda baixa) até a mão crescer.\n\n## C (dó maior)\n5ª corda 3ª casa (3), 4ª corda 2ª casa (2), 2ª corda 1ª casa (1). Diagonal clássica.\n\n## As 4 palavras mágicas\n**G - D - Em - C**: com esses quatro acordes tocam-se CENTENAS de músicas (o famoso "4 chords"). Nesta sequência já existem: "Evidências", dezenas de sertanejo, pop internacional. Seu objetivo da semana: G→D→Em→C em loop, 1 compasso cada, sem parar.\n\n## A batida simples (raiz do violão brasileiro)\nPadrão para baixo no ritmo:\n\n**Baixo (polegar na corda grave do acorde) + ra-para-baixo dos dedos** — conte: 1 (baixo) 2 3 (tapa... leve) 4.\n\nComece SEM o tapa: só baixo + 3 rasqueados para baixo, lento e uniforme. O metrônomo (app) a 60 BPM é seu professor de honestidade: lento e limpo vence rápido e bagunçado SEMPRE.\n\n## Sua primeira "música"\nCante (ou murmure) qualquer música de G-D-Em-C e acompanhe o loop. Vai sair torto — normal! A próxima aula une tudo na música completa.',
            quiz: [
              {
                prompt: 'Na troca de acordes, o que treinar primeiro?',
                options: [
                  'Velocidade máxima de rasqueado',
                  'A troca da mão ESQUERDA sem tocar, devagar e limpa',
                  'Cantar junto',
                  'Aprender 10 acordes novos rápido',
                ],
                correctIndex: 1,
                explanation:
                  'A troca limpa de acorde é a habilidade-gargalo do iniciante. Velocidade vem de repetição lenta e limpa — nunca do contrário.',
              },
            ],
          },
        ],
      },
      {
        title: 'Tocando músicas',
        description: 'Trocas fluidas, sua primeira música completa e ritmos BR.',
        lessons: [
          {
            title: 'Sua primeira música completa',
            description: 'Da cifra ao acompanhamento integral.',
            durationMin: 24,
            content:
              '## Escolha a música certa\nCritérios da primeira música: 3-4 acordes que você JÁ sabe, ritmo lento/constante, você AMA a música (vai repetir ela 100 vezes — amor sustenta a repetição). Sugestões de nível 1: "Deixa Acontecer" (Grupo Revelação... simplifique), canções de GC/vertentes folk, "Pais e Filhos" simplificada. No mural tem a lista com cifras prontas.\n\n## O método das camadas (a técnica da aula)\n\n1. **Camada 1 — Acordes**: toque a sequência da MÚSICA inteira com 1 batida lenta por acorde. Sem ritmo certo, SEM cantar. Repita até ficar automático (2-3 dias).\n2. **Camada 2 — Ritmo**: mesma sequência, batida completa da música. Sem cantar. (2-3 dias)\n3. **Camada 3 — Voz**: cante SOBRE a gravação sua (grave no celular e acompanhe): primeiro só os refrões, depois tudo.\n4. **Camada 4 — Junção**: lento (60-70 BPM). Aumente a velocidade SÓ quando limpa.\n\n## Por que NÃO cantar desde o início\nCantar + tocar é duas tarefas motoras juntas: exige que a mão já seja automática. Quem tenta as duas de uma vez trava as duas. Camadas: a mão aprende sozinha, a voz aprende sozinha, a junção vira fácil.\n\n## A régua da primeira música\nTocar do começo ao fim, no ritmo, sem parar — mesmo com erros pequenos (CONTINUE: parar para corrigir no meio é vício de iniciante; o concerto real não tem pausa de correção). Grave a versão final e guarde: em 3 meses você vai se emocionar comparando.',
          },
          {
            title: 'Projeto final: três músicas e o próximo passo',
            description: 'Seu repertório de formatura do nível zero.',
            durationMin: 20,
            content:
              '## O entregável\nTrês músicas completas tocadas do início ao fim — seu primeiro repertório real.\n\n## O cardápio do formando\n\n1. **A música da camada 4** (aula anterior) — sua primeira.\n2. **Uma música lenta** (para treinar trocas e acordes "novos": um F ou B7... ou apenas mais uma de 4 acordes).\n3. **Uma música BR de ritmo** (samba/partido ou sertanejo com a batida da próxima técnica) — o bônus de estilo.\n\n## O bônus de estilo: a síncopa básica\nRitmo brasileiro mínimo (samba/pagode): padrao de dedilhado com baixo alternado (P na 5ª, depois na 4ª) + acordes menores syncopados. Exercício de 5 min/dia, lento: seu violão começa a SOAR brasileiro mesmo com acordes simples.\n\n## Grave e celebre (a sério)\nGrave as três músicas num único vídeo/áudio. Não poste se não quiser — mas GRAVE. O antes/depois de 3 meses é o melhor motivador que existe, e a turma que posta no mural recebe feedback de áudio meu, nota a nota.\n\n## E agora?\nSeu próximo ciclo: barras (a técnica que destrava o violão inteiro), pentatônica (primeiras notas de solo), e ritmo mais complexo (folk, blues). O curso de nível 2 nasce das dúvidas desta turma — traga as suas no mural e nas mentorias 1:1, onde reviso seu dedo, sua postura e sua troca de acordes ao vivo na câmera.',
          },
        ],
      },
    ],
  },
]
