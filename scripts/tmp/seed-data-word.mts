// Curso: Word do Zero ao Profissional — mentor Camila Rocha
// Conteúdo em nível "produto para venda": apostilas profundas + quizzes.
import type { CourseDef } from './seed-types'

export const wordCourse: CourseDef = {
  mentorEmail: 'camila@demo.com',
  title: 'Word do Zero ao Profissional: documentos que impressionam',
  description:
    'O Word está em toda vaga, todo TCC, todo contrato — e quem domina entrega em minutos o que outros levam horas. Neste curso você sai do "só digitando" para o nível profissional: estilos e sumário automático, formatação ABNT sem sofrimento, mala direta, tabelas impecáveis e os atalhos que separam o amador do pro. São 5 módulos práticos, do primeiro clique ao projeto final completo, com quizzes de fixação e passo a passo validado no Word 2016+, Microsoft 365 e na versão online gratuita. Ao final, você sai com currículo aprovado, modelo de documento reutilizável e confiança para cobrar por esse serviço.',
  category: 'Negócios',
  level: 'INICIANTE',
  price: 109,
  coverUrl: '/uploads/seed/course-word.png',
  themes: [
    {
      title: 'Módulo 1 · Primeiros passos sem medo',
      description:
        'A tela do Word deixa de assustar: você entende cada área, digita e corrige com agilidade, formata sem mistério e nunca mais perde um trabalho por não salvar.',
      lessons: [
        {
          title: 'A tela do Word sem mistério',
          description:
            'Faixa de opções, barra de acesso rápido, régua e barra de status: o mapa completo para você nunca mais procurar um botão às cegas.',
          durationMin: 12,
          content: `O Word abre com uma tela cheia de botões — e a maioria das pessoas usa 5% deles a vida inteira. Nesta aula você mapeia os 95% restantes só o suficiente para saber onde estão quando precisar.

## As 4 áreas da tela
- **Barra de acesso rápido** (lá em cima): salvar, desfazer e refazer. Personalize com o botão da setinha e coloque Impressão Previsível e Ortografia lá — você vai usar todo dia.
- **Faixa de opções**: as abas (Início, Inserir, Layout...) reúnem tudo que existe. A regra de ouro: se você procura um comando, ele está na aba do *tipo de coisa* que ele faz — imagem fica em Inserir, margem fica em Layout.
- **Área de edição** com a **régua**: a régua controla recuos e margens visuais. Arraste o triângulo superior e você desloca a primeira linha do parágrafo (recuo de citação ABNT, por exemplo).
- **Barra de status** (embaixo): página X de Y, contagem de palavras e o idioma. Clique na contagem de palavras para abrir a janela completa — editores de freelance cobram por palavra, e aqui está o número oficial.

## Os modos de exibição
No canto inferior direito ficam os modos: **Layout de Impressão** (o padrão, que mostra o papel) e **Web** (útil só para leitura longa em tela). Existe também o **modo foco/lendo em voz alta** na aba Exibir — ótimo para revisar um texto ouvindo o Word ler para você.

## Fixando o essencial
- A tecla **Alt** revela as **Teclas de Opções**: letras aparecem sobre as abas e comandos, permitindo navegar no teclado puro (Alt + A abre Início, por exemplo). É assim que profissionais trabalham sem tirar a mão do teclado.
- **Ctrl + rolar o mouse** dá zoom. **Ctrl + 0** (com o cursor no texto) volta para 100%... no Word o atalho de zoom reset é Ctrl+roda até 100% ou o slider da barra de status.

## Sua tarefa
Abra um documento em branco e percorra as abas Início, Inserir e Layout só observando. Localize: contagem de palavras, régua e barra de acesso rápido. Cinco minutos de mapa valem horas de busca depois.`,
          quiz: [
            {
              prompt: 'Onde você encontra a contagem de palavras do documento?',
              options: ['Na barra de status, na parte inferior da tela', 'Na aba Inserir', 'Na régua lateral'],
              correctIndex: 0,
              explanation: 'A barra de status mostra páginas e palavras; clicar nela abre a contagem completa.',
            },
            {
              prompt: 'Para inserir uma imagem, qual aba você usa?',
              options: ['Início', 'Inserir', 'Revisão'],
              correctIndex: 1,
              explanation: 'A regra é simples: o comando fica na aba do tipo de objeto — imagens ficam em Inserir.',
            },
          ],
        },
        {
          title: 'Digitar, selecionar e navegar como gente grande',
          description:
            'Seleção por clique/triplo clique, Shift+setas, Ctrl+T/F e o painel de navegação: mova-se no documento na velocidade do pensamento.',
          durationMin: 14,
          content: `Quem usa só o mouse para tudo perde 80% da velocidade no Word. Esta aula coloca no seu dedo os gestos de seleção e navegação que você vai repetir por décadas.

## Seleção sem estresse
- **Duplo clique** seleciona uma palavra; **Ctrl + duplo clique** seleciona a frase inteira.
- **Triplo clique** seleciona o parágrafo; **Ctrl + clique** na margem esquerda seleciona o parágrafo também.
- **Ctrl + A** seleciona tudo — o clássico para mudar a fonte do documento inteiro de uma vez.
- **Shift + setas** seleciona caractere a caractere; **Shift + Ctrl + setas** seleciona palavra a palavra; **Shift + End/Shift + Home** até o fim/início da linha.

## Navegação que poupa horas
- **Ctrl + T** abre o Localizar (painel de navegação). Digite "orçamento" e o Word destaca todas as ocorrências, mostrando miniaturas das páginas onde aparecem. Em um contrato de 40 páginas, isso é a diferença entre 10 segundos e 10 minutos.
- **Ctrl + G** (ou F5) abre **Ir Para**: pule direto para a página 17 digitando o número.
- **Ctrl + End** vai para o fim do documento; **Ctrl + Home** para o início. Sem rolar com o mouse até doer.

## O painel de navegação como sumário vivo
Quando o documento usa estilos (módulo 2!), o painel de navegação lista os títulos como um índice clicável. Você clica em "Metodologia" e pula direto para a seção. Em documentos longos, esse painel vira o seu GPS.

## Desfazer sem medo
**Ctrl + Z** desfaz e **Ctrl + Y** refaz — e a lista do botão de desfazer (setinha ao lado) permite voltar 10 passos de uma vez. Com essa rede de proteção, experimente sem medo: no Word, erro bom é o que se desfaz.

## Sua tarefa
Abra qualquer texto com 3+ páginas e pratique: Ctrl+T buscando uma palavra, Ctrl+G saltando de página, seleção tripla para trocar a fonte de um parágrafo. Repita até sair sem pensar.`,
        },
        {
          title: 'Formatação essencial: fonte, parágrafo e a paleta',
          description:
            'Espaçamento entre linhas, alinhamento, recuo e a regra dos 2 tipos de fonte: o acabamento básico que faz o texto parecer profissional.',
          durationMin: 16,
          content: `Formatação não é enfeite: é legibilidade. Um texto bem formatado passa credibilidade antes da primeira frase ser lida. Aqui está o kit essencial inteiro.

## Fonte: a regra dos 2 tipos
Escolha **no máximo 2 fontes** por documento (uma para títulos, outra para o corpo). Para trabalhos formais no Brasil: **Arial ou Times New Roman 12** — a ABNT exige uma das duas. Para documentos modernos (proposta comercial, currículo criativo): Calibri, Segoe UI ou Lato. O tamanho do corpo fica entre 11 e 12; títulos em 14 a 16 já se destacam sem gritar.

## Parágrafo: onde o texto ganha respiro
O botão do canto da grupo Parágrafo (a setinha diagonal) abre a janela completa — e nela mora o segredo:
- **Espaçamento entre linhas**: 1,5 para trabalhos acadêmicos (padrão ABNT), 1,08–1,15 para documentos corporativos.
- **Espaçamento ANTES e DEPOIS**: 6pt depois do parágrafo dá respiro sem precisar de Enter extra. Nunca use Enter em branco para "espaçar" — isso quebra o documento quando você edita depois.
- **Alinhamento**: justificado (Ctrl+J) para documentos formais; à esquerda (Ctrl+Q) para textos digitais, que ficam mais fáceis de ler.
- **Recuo de primeira linha**: 1,25 cm para ABNT — configure uma vez no estilo e nunca mais meça na régua.

## A paleta com critério
Cor no documento corporativo: preto para o corpo, **uma** cor de destaque (a da marca, azul #2563EB, o que for) para títulos e links. Cores demais parecem panfleto. E atenção: para impressão, evite tons muito claros (amarelo some no papel).

## Copiar formatação (o pincel mágico)
Selecione um trecho formatado do jeito certo, clique no **Pincel de Formatação** (ícone de escova em Início) e arraste sobre o trecho "errado" — a formatação é copiada. **Duplo clique no pincel** trava o modo: você aplica em vários trechos e aperta Esc para sair.

## Sua tarefa
Pegue um texto bagunçado (ou crie um) e aplique: Arial 12, entrelinha 1,5, espaçamento depois 6pt, justificado, recuo 1,25. Compare antes e depois — é esse "depois" que o cliente paga.`,
          quiz: [
            {
              prompt: 'Qual é a forma correta de dar espaço entre parágrafos?',
              options: ['Apertar Enter duas vezes no fim de cada parágrafo', 'Configurar o espaçamento DEPOIS na janela de Parágrafo', 'Colocar espaços no começo do parágrafo'],
              correctIndex: 1,
              explanation: 'Enter extra quebra a formatação em edições futuras; o espaçamento DEPOIS é o caminho profissional.',
            },
            {
              prompt: 'Quantas fontes diferentes um documento profissional deve usar, no máximo?',
              options: ['Uma para cada seção', 'Duas', 'Quantas quiser, desde que coloridas'],
              correctIndex: 1,
              explanation: 'A regra dos 2 tipos: uma para títulos, outra para o corpo. Mais que isso parece amador.',
            },
          ],
        },
        {
          title: 'Salvar, exportar PDF e nunca perder trabalho',
          description:
            'Salvar como, AutoRecuperação, versão final vs. editável e a exportação de PDF com as opções certas (e o que NUNCA esquecer de marcar).',
          durationMin: 12,
          content: `Perder um trabalho de 6 horas por não salvar é dor que você leva para a vida — e não precisa acontecer. Esta aula fecha o módulo com a rotina de segurança do Word.

## A hierarquia do salvar
- **Ctrl + S**: salva no arquivo atual. Faça a cada parágrafo importante — o Ctrl+S é o novo Ctrl+Z.
- **F12** (ou Arquivo → Salvar como): cria uma **nova versão** com outro nome. Use para gerar "Trabalho-v1", "Trabalho-v2"... quando você faz grandes mudanças e quer poder voltar.
- **OneDrive**: ao salvar na nuvem, o Word passa a salvar **automaticamente a cada poucos segundos** e mantém o **Histórico de Versões** (Arquivo → Informações → Histórico de Versões). É seguro eletronicamente voltar a uma versão de ontem à noite.

## AutoRecuperação: o paraquedas
Arquivo → Opções → Salvar: marque "Salvar informações de AutoRecuperação a cada **3 minutos**". Se a luz acabar, o Word reabre o documento do ponto do último autosave. Não substitui o Ctrl+S (a AutoRecuperação é para desastres, não para versões), mas salva vidas.

## PDF: o formato do mundo real
Quando o documento está pronto para ser **enviado** (não editado), exporte em PDF: Arquivo → **Salvar como** → tipo PDF, ou Arquivo → Exportar → Criar PDF/XPS. Antes de salvar, clique em **Opções** e garanta:
- **Criar indicadores usando títulos**: o PDF ganha índice navegável — acabamento de gente grande para TCCs e relatórios.
- **Documento estruturado para acessibilidade**: leitores de tela conseguem ler seu texto (obrigatório em muitos editais públicos).

Atenção ao erro clássico: enviar o PDF com as **alterações Controladas ainda visíveis** (módulo 3 mostra a revisão). Antes de exportar, aceite/rejeite todas as alterações.

## Envio profissional
Ao anexar em e-mail, nomeie como "Curriculo_Nome_Sobrenome.pdf", nunca "documento-final-final2.pdf". O arquivo é a sua primeira impressão — o nome também.

## Sua tarefa
Configure a AutoRecuperação em 3 minutos, salve um documento no OneDrive (ou crie o hábito do Ctrl+S ritmado) e exporte um PDF com marcadores de títulos. Rotina fechada: módulo 1 completo.`,
          quiz: [
            {
              prompt: 'Qual é a função da AutoRecuperação?',
              options: ['Salvar versões finais para envio', 'Restaurar o documento em caso de travamento ou queda de energia', 'Converter o documento em PDF automaticamente'],
              correctIndex: 1,
              explanation: 'AutoRecuperação é o paraquedas para desastres; as versões oficiais você salva com Ctrl+S/F12.',
            },
            {
              prompt: 'Antes de exportar um PDF de um documento revisado, você deve:',
              options: ['Mudar a fonte do documento', 'Aceitar ou rejeitar todas as alterações controladas', 'Apagar o cabeçalho'],
              correctIndex: 1,
              explanation: 'Alterações pendentes podem aparecer no PDF e expor rascunhos e comentários.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 2 · Documentos com cara de profissional',
      description:
        'Estilos, sumário automático, cabeçalho, rodapé e seções: a espinha dorsal que transforma um texto em documento de respeito — e que sustenta tudo nos módulos seguintes.',
      lessons: [
        {
          title: 'Estilos: o recurso que muda tudo',
          description:
            'Título 1, Título 2 e Normal são infraestrutura, não decoração. Entenda por que 90% dos recursos pro (sumário, navegação, ABNT) dependem deles.',
          durationMin: 18,
          content: `Se você levar uma única coisa deste curso, que seja esta aula. **Estilos** são o que separa quem "usa o Word" de quem trabalha com o Word.

## O que é um estilo
Um estilo é um **pacote de formatação com nome**. "Título 1" significa: Arial 16, negrito, azul, espaço antes 12pt. Quando você aplica Título 1, o Word não só formata — ele **marca semanticamente** que aquele parágrafo é um título de seção. Essa marcação alimenta o sumário automático, o painel de navegação, o PDF com indicadores e toda a padronização ABNT.

## O problema do "formatar na mão"
Quem aumenta a fonte e põe negrito manualmente tem um documento bonito e **frágil**: para mudar o título de preto para azul, precisa caçar cada título um por um. Com estilos, você muda o estilo UMA vez e o documento inteiro se atualiza. É a diferença entre 2 horas e 2 segundos.

## Aplicando estilos
Clique no parágrafo → galeria **Estilos** (aba Início) → **Título 1** para seções principais, **Título 2** para subseções, **Título 3** para sub-subseções. O corpo do texto usa **Normal**. Regra ABNT prática: Título 1 para capítulos (1, 2, 3...), Título 2 para seções (1.1, 1.2...), Título 3 para subseções (1.1.1...).

## Modificando um estilo do jeito certo
Não formate o texto na mão: **clique com o botão direito no estilo → Modificar**. Mude fonte, tamanho, cor, espaçamentos — e marque "Nos novos documentos com base neste modelo" se quiser levar a mudança para o futuro. Todos os títulos do documento obedecem na hora.

## Estilos herdam: entenda a cadeia
O Título 2 baseia-se no Título 1, que baseia-se no Normal. Mudou a fonte do Normal, tudo muda junto (a menos que o estilo filho tenha definido a própria fonte). Por isso mude **do pai para o filho**: primeiro Normal, depois títulos.

## Sua tarefa
Num documento de 2 páginas, aplique Título 1 em 3 títulos e Normal no corpo. Depois modifique o Título 1 (botão direito → Modificar) para Arial 16 azul. Veja os três títulos mudarem juntos. Esse é o momento "uau" do Word.`,
          quiz: [
            {
              prompt: 'Por que usar Estilos em vez de formatar manualmente?',
              options: ['Porque fica mais bonito obrigatoriamente', 'Porque permite atualizar o documento inteiro de uma vez e habilita sumário automático e navegação', 'Porque o Word não funciona sem estilos'],
              correctIndex: 1,
              explanation: 'Estilos são marcação semântica: mudança única, sumário e navegação saem de graça.',
            },
            {
              prompt: 'A forma correta de mudar a cor de TODOS os títulos Título 1 é:',
              options: ['Selecionar cada título e mudar a cor um a um', 'Botão direito no estilo Título 1 → Modificar', 'Mudar a cor antes de digitar qualquer coisa'],
              correctIndex: 1,
              explanation: 'Modificar o estilo atualiza todos os parágrafos que o usam, no documento inteiro.',
            },
          ],
        },
        {
          title: 'Sumário automático em 30 segundos',
          description:
            'Referências → Sumário: o índice que se atualiza sozinho, com números de página certos — e como consertar quando ele buga.',
          durationMin: 12,
          content: `Com os estilos do lugar (aula anterior), o sumário — o item que mais assusta em TCC e relatório — leva 30 segundos.

## Criando
1. Clique onde o sumário vai ficar (normalmente após a capa, em página própria).
2. Aba **Referências → Sumário → Sumário Automático 1**.
3. Pronto: o Word lista todos os Título 1/2/3 com o número da página de cada um.

## Atualizando (o hábito pro)
Escreveu mais e o texto correu de página? **Clique no sumário → Atualizar Tabela → Atualizar os números das páginas inteiro** (ou "o índice inteiro", se você mudou títulos). Ou use **F9** com o cursor dentro do sumário. Faça isso ANTES de imprimir/exportar PDF — sempre.

## Personalizando
Referências → Sumário → **Sumário Personalizado**: ali você define até qual nível aparece (só Título 1 e 2 é comum em relatórios enxutos), o preenchimento da linha pontilhada e o alinhamento. Para ABNT estrito, some os travessões e mantenha os números à direita.

## Consertando os 3 bugs clássicos
- **"Não encontrei itens de sumário"**: seus títulos estão formatados na mão, sem estilo. Volte na aula anterior e aplique Título 1/2.
- **Sumário não atualiza**: você clicou no texto dele como se fosse texto normal. Clique DENTRO da tabela e use Atualizar Tabela.
- **Páginas erradas no PDF**: você exportou sem atualizar o sumário. Rotina final: Ctrl+T no sumário → F9 → Atualizar tudo → exportar PDF.

## Sumário manual? Nunca
Sumário digitado à mão quebra na primeira edição. O automático se sustenta sozinho para sempre — mais um motivo da aula de estilos ser a mais importante do curso.

## Sua tarefa
No documento com títulos estilizados, insira o sumário automático, adicione duas páginas de texto no meio e atualize o sumário. Observe os números se ajustarem — essa é a mágica.`,
        },
        {
          title: 'Cabeçalho, rodapé e numeração de páginas',
          description:
            'Logo, nome do trabalho e "Página X de Y" no lugar certo — inclusive com numeração que começa a contar depois da capa.',
          durationMin: 14,
          content: `Cabeçalho e rodapé são as faixas fixas do documento: repetem em todas as páginas o que você precisa que apareça sempre. É o acabamento que o leitor nem nota quando está certo — e repara quando está errado.

## Entrando no modo edição
Duplo clique na área superior ou inferior da página (ou Inserir → Cabeçalho/Rodapé). O corpo do texto escurece: você agora edita só o cabeçalho/rodapé. Duplo clique no corpo para voltar.

## O que colocar em cada um
- **Cabeçalho**: em trabalhos acadêmicos ABNT, nada (a norma não usa); em relatórios e propostas, logo à esquerda + nome do documento à direita. Altura padrão: 1,25 cm — mexa em Layout → Margens → Personalizar se precisar.
- **Rodapé**: numeração de página. Para ABNT, o número fica no canto superior direito (sim, no cabeçalho!) em fonte menor — vamos configurar a seguir.

## Numeração de páginas
Inserir → **Número de Página** → escolha a posição (Fim da Página → direita é o clássico corporativo; Topo da Página → direita para ABNT). Para o formato "Página 3 de 12", use Inserir → **Partes Rápidas → Campo** → NumPages, ou digite e use a galeria "Página X de Y".

## O pulo do gato: não contar a capa
TCC e relatório não numeram a capa. O segredo é **Quebra de Seção** (próxima aula aprofunda):
1. Cursor no fim da capa → Layout → Quebras → **Próxima Página** (seção).
2. Vá ao rodapé da página 2 e **desmarque "Vincular ao Anterior"** (botão na aba Design do cabeçalho).
3. Número de Página → **Formatar Números de Página → Iniciar em 1**.
Resultado: capa sem número, texto começa na página 1.

## Diferente na primeira página
Mais simples ainda, para casos leves: na aba Design do cabeçalho/rodapé, marque **"Diferente na Primeira Página"** — a capa fica limpa sem precisar de seções. O restante do documento numera normal (começando no 2 — use "Iniciar em 0" na capa se quiser que a página 2 mostre 1).

## Sua tarefa
Configure: capa limpa + numeração no topo direito começando em 1 na página 2 (via seção ou "diferente na primeira" com iniciar em 0). Grave esse modelo — ele volta no projeto final ABNT.`,
          quiz: [
            {
              prompt: 'Para a capa não receber número de página, o caminho mais simples é:',
              options: ['Apagar o número da capa manualmente em cada impressão', 'Marcar "Diferente na Primeira Página" (ou usar quebra de seção + iniciar em 1 na página 2)', 'Não numerar o documento nenhum'],
              correctIndex: 1,
              explanation: '"Diferente na Primeira Página" resolve casos leves; seções resolvem os casos completos.',
            },
            {
              prompt: 'Em qual aba se configura "Vincular ao Anterior"?',
              options: ['No Design do Cabeçalho/Rodapé', 'Na aba Referências', 'Na janela de Parágrafo'],
              correctIndex: 0,
              explanation: 'Desvincular é o que permite cada seção ter seu próprio cabeçalho/rodapé e numeração.',
            },
          ],
        },
        {
          title: 'Quebras e seções: o fim da bagunça de páginas',
          description:
            'Quebra de página vs. quebra de seção, orientação paisagem no meio do retrato e por que Enter nunca deve ser usado para pular página.',
          durationMin: 15,
          content: `Documento que "adquire vida própria" — página em branco que não sai, título que pula, capa que desalinha — quase sempre é Enter apertado demais. Esta aula dá o antídoto definitivo.

## Enter não pula página
Cada Enter cria um **parágrafo vazio**. Se você "pula página" com 12 Enters e depois insere uma linha acima, tudo desanda. As ferramentas certas:
- **Ctrl + Enter** = **Quebra de Página**: o texto seguinte começa na próxima página, de verdade. Delete a quebra e o texto volta — sem página fantasma.
- Quebras também têm os tipos de espaço: **Ctrl + Shift + Enter** (quebra de coluna) e quebras de seção (abaixo).

## Quebra de Seção: documento dentro de documento
Uma **seção** é um pedaço do documento com regras próprias: margens, orientação, numeração e cabeçalhos independentes. Layout → Quebras:
- **Próxima Página**: a nova seção começa em página nova (capa → sumário → texto).
- **Contínua**: muda as regras na mesma página (colunas diferentes, por exemplo).

Casos de uso reais:
- **Um anexo em paisagem** no meio do relatório: cursor no fim da página anterior → Quebra Próxima Página → na página do anexo, Layout → Orientação → Paisagem → outra quebra depois → volta para Retrato. Três cliques, zero sofrimento.
- **Numeração romana no pré-texto** (i, ii, iii no sumário) e arábica no texto (1, 2, 3): cada bloco é uma seção com formatação de número própria.
- **Margens diferentes** para uma carta que acompanha o contrato.

## Vendo as quebras (e apagando as fantasmas)
**Ctrl + Shift + 8** exibe marcas de formatação (¶, quebras, espaços). É o raio-X do documento: enxerga o Enter extra, a quebra perdida, o espaço duplo. Profissionais trabalham com ele ligado. Para apagar uma quebra: clique nela (com marcas visíveis) e Delete.

## A regra mental
**Página = quebra de página. Regras diferentes = quebra de seção. Nada de Enter.** Com isso, seu documento fica sólido: edite à vontade que nada desanda.

## Sua tarefa
Crie um documento com capa (seção 1), texto em retrato (seção 2) e um gráfico em paisagem (seção 3). Ligue as marcas de formatação e observe as quebras trabalhando.`,
          quiz: [
            {
              prompt: 'Como pular para a próxima página do jeito certo?',
              options: ['Ctrl + Enter (quebra de página)', 'Apertar Enter até o texto descer', 'Copiar a página e colar em branco'],
              correctIndex: 0,
              explanation: 'Quebra de página é um marcador que se move com o texto — Enters criam parágrafos fantasmas.',
            },
            {
              prompt: 'Preciso de UMA página em paisagem no meio do documento retrato. O que uso?',
              options: ['Girar a impressora', 'Duas quebras de seção com a orientação paisagem entre elas', 'Um Enter grande'],
              correctIndex: 1,
              explanation: 'Seções isolam as regras: antes e depois da página paisagem, uma quebra Próxima Página cada.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 3 · Recursos que impressionam',
      description:
        'Tabelas, imagens, listas multiníveis, referências automáticas e revisão colaborativa: os recursos que fazem o leitor pensar "quem fez isso sabe o que faz".',
      lessons: [
        {
          title: 'Tabelas que organizam qualquer coisa',
          description:
            'Criar, converter texto em tabela, estilos prontos, mesclar células e a tabela que se ajusta ao conteúdo sem quebrar o layout.',
          durationMin: 16,
          content: `Tabela mal feita denuncia amador na hora. Bem feita, organiza cronograma, orçamento, dados de pesquisa — e a ABNT exige formato próprio que você domina aqui.

## Criando do jeito certo
Inserir → **Tabela** → arraste na grade. Depois, com o cursor dentro, aparece a aba contextual **Layout** (e Design): é ali que tudo acontece. Para começar do texto: selecione texto separado por vírgulas/tabs → Inserir → **Tabela → Converter Texto em Tabela** — ótimo para importar de planilhas.

## O acabamento em 4 passos
1. **Estilo**: na guia Design, escolha um estilo de grade limpa. Para ABNT, tabelas usam **linhas horizontais apenas** — escolha um estilo de lista ou formate manualmente: bordas verticais fora.
2. **Largura**: Layout → **AutoAjuste → AutoAjuste ao Conteúdo** faz as colunas obedecerem ao texto (fim da coluna estreita com palavra quebrada feia).
3. **Cabeçalho**: primeira linha com negrito e, em tabelas longas, marque **Repetir Linhas de Título** (Layout) — o cabeçalho reaparece quando a tabela atravessa páginas.
4. **Mesclar**: selecione 2+ células → botão direito → **Mesclar Células** para títulos que atravessam colunas.

## Alinhamento fino
O texto da célula tem parágrafo próprio: selecione a célula → Ctrl+E centraliza. Para a célula inteira (texto na vertical), Layout → **Alinhamento** com os 9 pontos do relógio. Altura das linhas: Layout → Altura.

## Tabela que não quebra o texto
Tabelas flutuantes atrapalham: prefira tabelas **em linha** com o texto. Se precisar mover, arraste pela alça (cruz no canto). E nunca deixe a tabela colada na borda: com ela selecionada, botão direito → Propriedades da Tabela → Alinhamento centralizado.

## O padrão ABNT em 20 segundos
Tabela acadêmica: título acima ("Tabela 1 — ..."), fonte abaixo ("Fonte: elaborada pelo autor, 2025"), linhas horizontais apenas, sem bordas laterais. Salve essa configuração como modelo no módulo 4 e nunca mais refaça.

## Sua tarefa
Monte um cronograma de 4 colunas (Atividade, Responsável, Prazo, Status) com 6 linhas, cabeçalho repetido e estilo ABNT. Trinta linhas de cada vez depois disso vêm naturalmente.`,
          quiz: [
            {
              prompt: 'Uma tabela longa atravessa duas páginas. Para o cabeçalho repetir na segunda página:',
              options: ['Copiar a linha de cabeçalho manualmente', 'Marcar "Repetir Linhas de Título" no Layout', 'Não há como'],
              correctIndex: 1,
              explanation: 'A opção Repetir Linhas de Título automatiza o cabeçalho em todas as páginas da tabela.',
            },
            {
              prompt: 'Para importar texto separado por vírgulas como tabela:',
              options: ['Copiar e colar normalmente', 'Inserir → Tabela → Converter Texto em Tabela', 'Digitar de novo célula a célula'],
              correctIndex: 1,
              explanation: 'O conversor entende separadores (vírgula, tab, ponto e vírgula) e monta a grade sozinho.',
            },
          ],
        },
        {
          title: 'Imagens, formas e texto que contorna',
          description:
            'Inserir, recortar, comprimir e posicionar imagens com o ajuste de texto certo — sem foto fugindo da página nem texto sobreposto.',
          durationMin: 15,
          content: `Imagem certa no lugar certo aumenta em muito a leitura de um documento. O erro é usar o ajuste de texto errado e ver a página virar quebra-cabeça. Aqui está o controle completo.

## Inserir e ajustar do básico
Inserir → **Imagens** (do dispositivo ou online). Ao inserir, clique na imagem e use as **alças** para redimensionar — sempre pelos **cantos**, para não distorcer. No campo Layout → Tamanho você pode digitar a largura exata (ex.: 15 cm para caber nas margens ABNT).

## Recorte e correção rápidos
Com a imagem selecionada, aba **Formato da Imagem**:
- **Recortar**: aparecem alças de corte; recorte antes de redimensionar.
- **Correções**: brilho e nitidez em um clique — recupera foto escurecida.
- **Remover Plano de Fundo**: o Word marca o objeto e apaga o fundo — funciona surpreendentemente bem para fotos de produto simples.

## Ajuste com texto: a decisão mais importante
Clique na imagem → botão direito → **Ajustar**:
- **Em Linha com o Texto** (padrão): a imagem se comporta como uma letra gigante dentro do parágrafo. Estável, alinha com parágrafo, é o que a ABNT quer. A desvantagem: não flutua.
- **Quadrado/Estreito**: o texto contorna a imagem. Use com moderation em materiais visuais.
- **Atrás/Na Frente do Texto**: para marcas d'água e sobreposições — controlo total, risco alto. Com essa opção, use **Ancorar** (o botão de âncora fixa a imagem a um parágrafo).

Regra de bolso: **documento formal = em linha com o texto**. Boletim, folder ou convite = contorno.

## Comprimir antes de enviar
Documento com 5 fotos do celular passa de 20 MB e trava o e-mail. Com uma imagem selecionada → Formato → **Compactar Imagens**: 150 ppp é ótimo para impressão e tela; marque "Excluir áreas cortadas das imagens". O arquivo encolhe 10x sem perda visível.

## Legendas profissionais
Clique com o botão direito na imagem → **Inserir Legenda**: "Figura 1 — ..." numerado automaticamente (e a lista de figuras em Referências fica de graça — mesma lógica do sumário).

## Sua tarefa
Insira uma imagem, recorte, aplique "em linha", legenda automática e compacte o documento. Depois teste o ajuste Quadrado para sentir a diferença de comportamento.`,
        },
        {
          title: 'Listas, marcadores e numeração multinível',
          description:
            'Listas que indentam direito, numeração de tópicos estilo edital e o controle total do multinível para documentos estruturados.',
          durationMin: 12,
          content: `Listas parecem triviais até a numeração sair do controle: subitem virando item principal, indentação diferente em cada tópico. Esta aula resolve de vez.

## O básico bem feito
Aba Início → **marcadores** ou **numeração**. Para indentar um nível, **Tab** com o cursor no item; para voltar, **Shift + Tab**. Nunca use a tecla de espaço ou o botão Aumentar Recuo para "fazer parecer" lista — o Word perde a estrutura.

## Multinível: listas com hierarquia real
Para listas tipo edital — 1 / 1.1 / 1.1.1 — use a galeria **Lista Multinível** (Início). Escolha o modelo "1 / 1.1 / 1.1.1". Cada nível pode ter formatação própria (o nível 1 em negrito, por exemplo). Tab e Shift+Tab navegam entre níveis.

## Vinculando níveis aos Estilos (nível expert)
No menu da Lista Multinível → **Definir Nova Lista Multinível** → botão "Mais" → vincule o nível 1 ao estilo **Título 1**, nível 2 ao **Título 2**... Resultado: seus CAPÍTULOS do documento se numeram sozinhos (1. Introdução, 2. Metodologia...) e a numeração segue os títulos para sempre. É a montagem definitiva do documento ABNT/relatório técnico — e volta no projeto final.

## Recomeçando e pulando números
Lista começando em 5? Clique com o botão direito no primeiro item → **Definir Valor de Numeração → avançar em / iniciar em**. Para listas paralelas que continuam (item 7 de uma lista, depois 7 de outra), botão direito → **Continuar Numeração** ou "Reiniciar em 1".

## Marcadores personalizados
A setinha ao lado de Marcadores → Definir Novo Marcador → Símbolo/Imagem: um traço curto (–) é mais elegante que a bola cheia em documentos corporativos. Para checklists, o marcador de caixinha (☐) deixa claro que é tarefa.

## Sua tarefa
Crie uma lista multinível de 3 níveis com 8 itens, vincule ao Título 1/2 e veja os capítulos se numerarem. Reinicie uma lista em 1 e faça outra continuar da anterior. Controle completo.`,
          quiz: [
            {
              prompt: 'Como indentar um subitem dentro de uma lista?',
              options: ['Apertar a barra de espaço várias vezes', 'Tecla Tab no início do item (Shift+Tab para voltar)', 'Aumentar a fonte'],
              correctIndex: 1,
              explanation: 'Tab/Shift+Tab movem o item entre níveis mantendo a estrutura da lista viva.',
            },
            {
              prompt: 'A configuração que faz os capítulos se numerarem sozinhos (1, 2, 3...) é:',
              options: ['Digitar o número antes de cada título', 'Lista Multinível vinculada aos estilos Título 1/2', 'Um sumário automático'],
              correctIndex: 1,
              explanation: 'Vincular níveis da lista multinível aos estilos automatiza a numeração de todo o documento.',
            },
          ],
        },
        {
          title: 'Citações e bibliografia automáticas',
          description:
            'Fonte de dados, estilo ABNT/APA, citações no texto e bibliografia montada em segundos — o fim do sofrimento de referências.',
          durationMin: 16,
          content: `A parte que mais atrasa TCC e artigo é referência mal formatada. O Word tem um gerenciador completo embutido — e quase ninguém conhece.

## Preparando a fonte de dados
Aba **Referências → Estilo**: escolha **ABNT** (presente no Word moderno) ou APA/ABNT conforme seu curso. Esse padrão vale para citações e bibliografia.

## Cadastrando uma fonte
Referências → **Inserir Citação → Adicionar Nova Fonte**. Preencha: tipo de fonte (Livro, Artigo de Periódico, Site), autor, título, ano, editora... As fontes ficam salvas **no documento** e na fonte de dados mestre (master.xml) — no próximo trabalho, elas já aparecem na lista.

## Citando no texto
Cursor no ponto da citação → Inserir Citação → clique na fonte. Sai "(SILVA, 2023)" formatado no estilo. Para página específica (citação direta), clique na citação inserida → setinha → **Editar Fonte** → página. Autor no corpo do texto ("Segundo Silva (2023)...")? Marque a caixa "Autor" na edição da citação.

## Gerando a bibliografia
Cursor no fim do documento → Referências → **Bibliografia → Bibliografia** (ou "Trabalhos Citados" conforme o estilo). O Word lista todas as fontes usadas, formatadas e em ordem. **F9** atualiza quando você cadastrar fontes novas — mesma lógica do sumário.

## Gerenciando tudo
Referências → **Gerenciar Fontes**: lista mestre (todas as suas) x lista atual (do documento). Importe do mestre para o atual com um clique. Isso transforma referência em acervo: seu TCC alimentará sua monografia futura.

## Limites honestos
Para normas ultra específicas (algumas universidades adaptam a ABNT), confira espaçamentos e itálicos manualmente — o Word cobre 90% e você ajusta o acabamento. Ainda assim, economiza horas e elimina o erro estrutural (ordem, pontuação, ano).

## Sua tarefa
Cadastre 3 fontes (1 livro, 1 artigo, 1 site), insira 2 citações no texto e gere a bibliografia. Atualize com F9. Compare com referências que você já formatou à mão — o tempo economizado é o argumento para vender formatação como serviço.`,
          quiz: [
            {
              prompt: 'Onde você define que as citações seguirão o padrão ABNT?',
              options: ['Referências → Estilo', 'Layout → Margens', 'Revisão → Ortografia'],
              correctIndex: 0,
              explanation: 'O estilo escolhido em Referências vale para citações e bibliografia automaticamente.',
            },
            {
              prompt: 'Depois de cadastrar novas fontes, como atualiza a bibliografia?',
              options: ['Apagar e gerar de novo', 'F9 (ou Atualizar campo) com o cursor na bibliografia', 'Reiniciar o Word'],
              correctIndex: 1,
              explanation: 'Bibliografia e sumário são campos: F9 atualiza com o estado atual do documento.',
            },
          ],
        },
        {
          title: 'Revisão: ortografia, comentários e Controlar Alterações',
          description:
            'O fluxo de revisão que orientadores, clientes e chefes esperam: correções marcadas, comentários respondidos e versão limpa no final.',
          durationMin: 14,
          content: `Documento profissional não é o que nunca tem erro — é o que passa por um **processo de revisão** de verdade. O Word tem esse processo inteiro embutido.

## Camada 1 — Ortografia e gramática
**F7** abre a verificação completa. Os sublinhados vermelho/azul no texto são sugestões em tempo real — botão direito corrige na hora. Configure o idioma certo (Revisão → **Idioma → Definir Idioma de Verificação**) — texto em inglês com corretor português gera 500 falsos erros. E cuidado com o autocorreto: Revisão → Opções → AutoCorreção mostra as trocas automáticas (útil, mas às vezes "corrige" nomes próprios).

## Camada 2 — Comentários
Selecione o trecho → Revisão → **Novo Comentário** (ou Ctrl+Alt+M). Comentários ficam na margem, sem sujar o texto. Responda comentários dentro do próprio balão (encadeia a discussão), resolva com **Resolver** (some, mas fica no histórico) e apague quando encerrar. Em trabalhos de grupo, é o canal de conversa sobre o texto.

## Camada 3 — Controlar Alterações
Revisão → **Controlar Alterações** (ligado): cada edição fica **marcada** — inserções sublinhadas, exclusões riscadas. O orientador edita seu texto ligado, você vê exatamente o que mudou. Para aceitar/rejeitar: clique na alteração → **Aceitar/Rejeitar** (ou Aceitar Todas as Alterações para fechar de uma vez). É o padrão de revisão de TCC, contrato e texto jurídico.

## Comparar versões
Recebeu "Trabalho-v2.docx" e não sabe o que mudou? Revisão → **Comparar** → escolha as duas versões → o Word gera um terceiro documento com todas as diferenças marcadas. Fim do "o que você mudou?" na base do palpite.

## O ritual de finalização
Antes de enviar qualquer documento: F7 → aceitar/rejeitar todas as alterações → **excluir todos os comentários** (eles vazam para o destinatário!) → F9 no sumário → exportar PDF. Guarde esse ritual — é o controle de qualidade que vale como serviço cobrado.

## Sua tarefa
Peça para alguém (ou use um rascunho antigo) revisar um texto com Controlar Alterações ligado. Aceite 3 mudanças, rejeite 1, resolva os comentários e gere a versão limpa em PDF.`,
          quiz: [
            {
              prompt: 'Qual recurso mostra exatamente o que cada revisor alterou no texto?',
              options: ['Ortografia (F7)', 'Controlar Alterações', 'Comentários'],
              correctIndex: 1,
              explanation: 'Controlar Alterações marca inserções, exclusões e formatação — com autoria e possibilidade de aceitar/rejeitar.',
            },
            {
              prompt: 'Antes de enviar o PDF final, você deve:',
              options: ['Deixar os comentários — mostram trabalho', 'Aceitar/rejeitar alterações e excluir todos os comentários', 'Salvar como .docx antigo'],
              correctIndex: 1,
              explanation: 'Comentários e alterações pendentes vão no arquivo e expõem a conversa interna ao destinatário.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 4 · Automação: trabalhe menos, entregue mais',
      description:
        'Mala direta, modelos reutilizáveis, atalhos de velocidade e formulários: o Word trabalhando por você — o diferencial de quem cobra por serviço de documento.',
      lessons: [
        {
          title: 'Mala direta: 200 documentos personalizados em 5 minutos',
          description:
            'Cartas, certificados e etiquetas com nome de cada pessoa — integrando Word + Excel passo a passo, sem erro e sem digitar um por um.',
          durationMin: 20,
          content: `Mala direta (ou "mesclagem") é o recurso que mais impressiona quem vê pela primeira vez: um modelo que gera centenas de documentos personalizados, cada um com nome, endereço e dados certos. Certificado de evento, carta de cobrança, etiqueta de encomenda, convite — sempre a mesma mágica.

## Os 3 ingredientes
1. **O documento principal** (modelo): a carta/certificado com os campos que variam marcados como espaços reservados.
2. **A fonte de dados**: uma planilha Excel com cabeçalho na primeira linha (Nome, Empresa, Cidade...). Uma linha = um documento gerado.
3. **A mesclagem**: o Word casando modelo + linha e gerando a saída.

## Passo a passo completo
1. Abra o modelo. Aba **Correspondências → Iniciar Mala Direta → Cartas** (ou Etiquetas/Envelopes/E-mail).
2. **Selecionar Destinatários → Usar uma Lista Existente** → escolha a planilha. (Se a planilha tiver aba por mês, escolha a aba certa na janela.)
3. Posicione o cursor onde entra o nome e clique **Inserir Campo de Mesclagem → Nome**. Repita para cada variável. Os campos aparecem como «Nome».
4. **Visualizar Resultados** (setinhas navegam entre as pessoas) — confira 2 ou 3 antes de gerar tudo.
5. **Concluir e Mesclar**: "Editar Documentos Individuais" gera um arquivo novo com todas as páginas (imprimível); "Imprimir" sai direto; para e-mail, use **Concluir e Mesclar → Enviar Mensagens de E-mail**.

## Regras que salvam
- Planilha sem surpresas: sem linha em branco no meio, cabeçalho sempre na linha 1, uma informação por coluna (nome separado de sobrenome dá mais controle).
- Datas e moedas saem erradas? Clique no campo → pressione as teclas de campo (Alt+F9) e formate, ou formate a coluna no Excel como texto.
- Etiquetas: Correspondências → Etiquetas → escolha o código da folha (ex.: A4250) antes de selecionar destinatários — o Word calcula a grade sozinha.

## Onde isso vira dinheiro
Igrejas, escolas, condomínios e pequenas empresas vivem de certificados, avisos e correspondências. "Faço seus 300 certificados personalizados em 10 minutos" é um serviço real que este curso te habilita a cobrar.

## Sua tarefa
Crie uma planilha com 5 pessoas, monte um certificado com campos Nome e Curso, e gere o arquivo final com as 5 páginas. Cronometre: menos de 5 minutos.`,
          quiz: [
            {
              prompt: 'Na mala direta, de onde vêm os dados que variam (nomes, cidades)?',
              options: ['Digitados um a um em cada página', 'De uma fonte de dados, geralmente uma planilha Excel', 'Da internet automaticamente'],
              correctIndex: 1,
              explanation: 'A planilha é a fonte: cada linha gera um documento com os campos mesclados.',
            },
            {
              prompt: 'Antes de gerar 300 documentos, o passo prudente é:',
              options: ['Imprimir tudo direto', 'Usar Visualizar Resultados e conferir algumas páginas', 'Apagar a planilha'],
              correctIndex: 1,
              explanation: 'Visualizar Resultados navega entre as pessoas permitindo conferir antes da geração em massa.',
            },
          ],
        },
        {
          title: 'Modelos e Blocos de Construção: monte uma vez, use para sempre',
          description:
            '.dotx, Documentos em destaque e Peças Rápidas: sua identidade visual e seus documentos recorrentes prontos em dois cliques.',
          durationMin: 14,
          content: `Todo serviço de documento tem a parte repetitiva: contrato, proposta, carta padrão, tabela ABNT. Modelos transformam essa repetição em dois cliques — e é aqui que sua produtividade dobra de verdade.

## O que é um modelo (.dotx)
Um modelo é um documento que **não se sobrescreve**: você abre, preenche e salva como .docx — o modelo continua limpo para o próximo uso. Arquivo → Salvar como → tipo **Modelo do Word (*.dotx)**. Ao dar duplo clique no modelo, o Word abre uma cópia nova. É assim que escritórios inteiros padronizam papel timbrado.

## Documentos em destaque (o modelo na cara)
Arquivo → Novo → sua área de modelos pessoais aparece em "Pessoal". Para o modelo estar lá, salve o .dotx na pasta de Modelos Personalizados (Arquivo → Opções → Salvar → Local padrão de modelos pessoais). Resultado: Arquivo → Novo → "Proposta comercial da empresa" em um clique.

## O que todo modelo bom tem dentro
- Estilos modificados (Título 1/2 com a identidade certa — módulo 2).
- Cabeçalho/rodapé e numeração configurados.
- Campos de texto marcados (use **colchetes** ou Controle de Conteúdo: Desenvolvedor → Controle de Conteúdo de Texto Sem Formatação, que guia o preenchimento).
- Página de instruções de uso (apague antes de usar).

## Blocos de Construção: a cola instantânea
Aquele parágrafo jurídico, assinatura com logo ou tabela ABNT que você repete todo dia? Selecione → Alt + F3 → dê um nome ("assinatura-padrao"). Para inserir depois: digite o nome e **F3**, ou Inserir → **Partes Rápidas**. Os Blocos ficam salvos no Word (galeria Partes Rápidas), disponíveis em qualquer documento.

## Estratégia de acervo
Monte um kit: modelo de proposta, modelo de contrato simples, modelo ABNT com sumário e referências configurados, bloco de assinatura, bloco de rodapé institucional. Esse acervo é ativo de trabalho: entregas 10x mais rápido que quem começa do zero — e pode vender o kit pronto.

## Sua tarefa
Crie um modelo .dotx de carta com cabeçalho, estilos e um bloco de assinatura salvo com Alt+F3. Feche o Word, reabra, gere um documento novo do modelo e insira o bloco com F3. Você acabou de industrializar seu próprio trabalho.`,
          quiz: [
            {
              prompt: 'Qual é a vantagem do arquivo .dotx sobre o .docx comum?',
              options: ['É mais leve', 'Ao abrir, cria uma cópia nova — o modelo nunca é sobrescrito', 'Permite salvar em PDF'],
              correctIndex: 1,
              explanation: 'Modelo abre sempre como cópia: o original permanece limpo para reuso infinito.',
            },
            {
              prompt: 'Para salvar um parágrafo+assinatura reutilizável com um nome, usa-se:',
              options: ['Comentário', 'Bloco de Construção (Alt+F3 / Partes Rápidas)', 'Mala direta'],
              correctIndex: 1,
              explanation: 'Blocos de Construção guardam trechos completos na galeria Partes Rápidas, inseríveis por nome + F3.',
            },
          ],
        },
        {
          title: 'Atalhos e truques de velocidade',
          description:
            'Os 20 atalhos que concentram 80% da velocidade, mais os truques de digitação (Shift+F3, F4, AutoTexto) que parecem mágica.',
          durationMin: 12,
          content: `Velocidade no Word não é digitar rápido — é **não tirar a mão do teclado**. Esta é a aula de bolsão: os atalhos que você realmente usa todos os dias, destilados.

## O kit essencial (domine estes 10 primeiro)
- **Ctrl + S / Z / Y** — salvar, desfazer, refazer (a trindade da segurança).
- **Ctrl + B / I / U** — negrito, itálico, sublinhado. (Ctrl+N no Word PT-BR também é negrito; Ctrl+B em alguns teclados.)
- **Ctrl + E / Q / J** — centralizar, alinhar à esquerda, justificar.
- **Ctrl + T** — localizar; **Ctrl + G** — ir para página.
- **Ctrl + Enter** — quebra de página (a aula 4 do módulo 2 agradece).
- **Ctrl + A** — selecionar tudo.

## Truques que parecem mágica
- **Shift + F3** alterna o CASO do texto selecionado: MINÚSCULAS → Maiúsculas → Iniciais Maiúsculas. Acabou digitar de novo o texto que veio todo em caixa alta.
- **F4 repete a última ação**: aplicou negrito? Selecione o próximo trecho e F4. Inseriu linha de tabela? F4 insere igual. É o atalho mais subestimado do Office.
- **Ctrl + Shift + 8** exibe marcas de formatação — o raio-X do documento.
- **Alt + arrastar o mouse** faz seleção em RETÂNGULO (coluna de texto) — perfeito para limpar listas coladas.
- **Ctrl + Shift + V** cola sem formatação (ou cole e escolha "Manter Somente Texto" no botão de opções de colar) — salva quem colou texto da internet.
- **Alt + F3** cria Bloco de Construção; **F3** insere. **F9** atualiza sumário/bibliografia.
- Digite **=rand(3)** e Enter para gerar texto de teste; **=lorem()** para latim. Útil para montar modelos.

## Digitação inteligente
- **AutoCorreção como atalho pessoal**: Arquivo → Opções → AutoCorreção → substitua "sigla" por texto longo. Digite "endz" e o Word escreve seu endereço completo. Cada sigla sua vira uma macro de texto.
- **Traço certo**: Word converte hífen entre palavras em travessão (—) automaticamente quando você continua digitando — a tipografia correta de graça.

## Sua tarefa
Escolha 5 atalhos que você ainda não usa e pratique em texto real por 10 minutos (F4 e Shift+F3 são obrigatórios). Em uma semana eles estarão no seu dedo — e sua entrega, 30% mais rápida.`,
          quiz: [
            {
              prompt: 'O atalho que repete automaticamente a última ação é:',
              options: ['F4', 'F9', 'Ctrl + R'],
              correctIndex: 0,
              explanation: 'F4 repete formatação, inserções e edições — o multiplicador de velocidade mais esquecido.',
            },
            {
              prompt: 'Texto colado todo em CAIXA ALTA. O conserto mais rápido:',
              options: ['Digitar tudo de novo', 'Selecionar e apertar Shift + F3', 'Formatar como lista'],
              correctIndex: 1,
              explanation: 'Shift+F3 alterna o caso do texto selecionado em três estados.',
            },
          ],
        },
        {
          title: 'Formulários e macros: desmistificando o avançado',
          description:
            'Controles de conteúdo com preenchimento guiado e a primeira macro de automação — sem programar de verdade, sem medo.',
          durationMin: 18,
          content: `Duas palavras assustam usuários de Word: "formulário" e "macro". Ambas são mais simples do que parecem — e entregam um salto de profissionalismo.

## Formulários com Controle de Conteúdo
Um formulário é um documento onde outras pessoas **preenchem só os campos certos** — sem poder bagunçar o resto. O fluxo:
1. Habilite a aba: Arquivo → Opções → Personalizar Faixa de Opções → marque **Desenvolvedor**.
2. Monte o documento (contrato, requisição, ficha) e deixe espaço para os campos.
3. Desenvolvedor → **Controle de Conteúdo de Texto Sem Formatação** (ícone Aa) no lugar do nome; **Data** (ícone de calendário) para datas; **Lista Suspensa** para opções (Sim/Não, departamentos).
4. Em cada controle, **Propriedades** define o texto de espaço reservado e as opções da lista.
5. Para travar o resto: Desenvolvedor → **Restringir Edição** → "Preenchimento de formulários" → Sim, Aplicar. O documento inteiro trava, só os campos são editáveis.

Caso real: ficha de admissão que RH distribui; contrato com campos de nome/CPF que cliente preenche. Zero desalinhamento, zero "quebrou meu documento".

## Macros: gravar, não programar
Macro = o Word **gravando seus passos** e repetindo quando você quiser. Nada de código no começo:
1. Exibir → **Macros → Gravar Macro** → nome (sem espaços) → "Atribuir a Teclado" → escolha Ctrl+Shift+7, por exemplo.
2. Faça as ações (ex.: selecionar parágrafo, formatar ABNT, inserir fonte).
3. Clique **Parar Gravação**. Pronto: Ctrl+Shift+7 repete tudo.

Use para sequências que você repete: formatar citação, aplicar padrão de nota de rodapé, montar cabeçalho de tabela. Grave testando antes; se errar, grave de novo por cima.

## Segurança honesta
Macros de internet podem conter vírus — por isso o Word bloqueia macros de arquivos baixados por padrão (marque confiar só em documentos seus). Suas macros gravadas, salvas no modelo Normal.dotm ou no documento, são seguras.

## Sua tarefa
Monte uma ficha com 3 controles (texto, data, lista suspensa), restrinja a edição e teste o preenchimento. Depois grave uma macro de formatação e dispare pelo atalho. Você entrou na camada avançada sem escrever uma linha de código.`,
          quiz: [
            {
              prompt: 'Para o usuário preencher só os campos certos de um formulário:',
              options: ['Escrever instruções no e-mail', 'Controles de Conteúdo + Restringir Edição', 'Salvar em PDF'],
              correctIndex: 1,
              explanation: 'Controles guiam o preenchimento e a restrição trava todo o resto do documento.',
            },
            {
              prompt: 'Criar uma macro básica exige:',
              options: ['Programar em VBA obrigatoriamente', 'Gravar os passos com o Gravador de Macros', 'Instalar um complemento pago'],
              correctIndex: 1,
              explanation: 'O gravador registra as ações e as transforma em macro reexecutável — sem código.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 5 · Projetos reais (e como vender esse dom)',
      description:
        'Currículo que aprova, documento ABNT completo e o pacote final: você sai do curso com peças prontas de portfólio — e a capacidade de cobrar por elas.',
      lessons: [
        {
          title: 'Projeto 1 — Currículo e carta de apresentação que passam no filtro',
          description:
            'Estrutura de currículo moderno no Word, a versão ATS-friendly (máquina de seleção) e a carta de apresentação de meia página que humaniza.',
          durationMin: 18,
          content: `9 em cada 10 processos usam um **rastreador** (ATS) que lê o currículo antes do recrutador. Currículo bonito demais com tabelas e caixas de texto quebra nesse filtro. Aqui está o método que respeita a máquina e impressiona o humano.

## A estrutura que funciona
- **Cabeçalho**: Nome em destaque (Título 1, 20pt) + linha única com telefone, e-mail profissional, LinkedIn e cidade. Nada de endereço completo — é lei antiga.
- **Resumo (3 linhas)**: quem você é + seu diferencial + o que busca. "Analista administrativo com 4 anos em rotinas fiscais; domínio avançado de Excel e Word (este curso!); busco atuar em...".
- **Experiência em ordem inversa**: Empresa — Cargo — Período. 3 a 5 bullets por experiência no formato **verbo + o quê + resultado**: "Reduzi 40% do tempo de emissão de relatórios criando modelo automatizado no Word". Resultado com número é o que prende o olho.
- **Formação** e **Cursos relevantes** (inclua este, com o nome certinho).
- **Habilidades**: linha única com as ferramentas (Word avançado: mala direta, estilos, ABNT...).

## Formatação ATS-safe no Word
Fonte única (Calibri/Lato 11), títulos com **estilos** (o rastreador entende hierarquia), SEM tabelas para estruturar conteúdo, SEM caixas de texto, SEM imagem/foto (a menos que a vissa peça), margens normais, arquivo salvo como PDF com nome "Curriculo_Nome_Sobrenome.pdf". Bullets simples (• ou –) — nada de ícones.

## O modelo de 10 minutos (com o que você já sabe)
Página A4 → margens 2 cm → Título 1 modificado para seu nome → parágrafos com espaçamento DEPOIS 6pt → lista com marcador traço → salvar como **.dotx** (módulo 4). A partir de agora, cada nova vaga = abrir modelo + trocar 3 bullets. Vinte minutos por candidatura, não dois dias.

## A carta de apresentação (meia página que humaniza)
Estrutura: parágrafo 1 — por que essa vaga/empresa (cite algo real dela); parágrafo 2 — sua experiência mais alinhada com 1 resultado numérico; parágrafo 3 — convite para conversa. 150 a 220 palavras. Nunca repita o currículo: a carta conta a história por trás de um bullet.

## Sua tarefa
Monte seu currículo no modelo e escreva a carta para uma vaga real. Rode o teste final: salve em PDF e veja se o texto é selecionável/copiável (prova de que a máquina lê). Se não for, há tabela/caixa de texto sobrando.`,
          quiz: [
            {
              prompt: 'Por que evitar tabelas e caixas de texto em currículo?',
              options: ['Ficam feias', 'Rastreadores (ATS) frequentemente leem o conteúdo fora de ordem ou ignoram', 'Ocupam mais espaço'],
              correctIndex: 1,
              explanation: 'ATS leem fluxo linear: tabelas e caixas embaralham a leitura e podem descartar seu currículo antes do humano.',
            },
            {
              prompt: 'No formato "verbo + o quê + resultado", qual bullet está certo?',
              options: ['Responsável por relatórios', 'Reduzi 40% do tempo de emissão criando modelo automatizado', 'Ajudava na equipe com várias tarefas'],
              correctIndex: 1,
              explanation: 'Verbo de ação + entregável + resultado medido é o padrão que prova impacto.',
            },
          ],
        },
        {
          title: 'Projeto final — Documento ABNT completo, ponta a ponta',
          description:
            'A montagem definitiva: capa, folha de rosto, sumário, seções numeradas, citações, referências e PDF final — tudo integrado em 30 minutos de trabalho.',
          durationMin: 25,
          content: `Hora de juntar TUDO. Este projeto monta um trabalho acadêmico completo nas normas ABNT (adapta-se a qualquer relatório formal). Siga na ordem — cada passo usa uma aula específica do curso.

## A especificação
- Papel A4, margens: superior/esquerda 3 cm, inferior/direita 2 cm (Layout → Margens → Personalizar).
- Fonte Arial 12, cor preta; citações longas e notas: 10.
- Entrelinha 1,5 no texto; recuo de parágrafo 1,25 cm; texto justificado.
- Paginação: sem número na capa; topo direito a partir do texto.

## Passo 1 — Esqueleto de seções
Capa → quebra de seção (Próxima Página) → folha de rosto → quebra → sumário → quebra → texto. Configure "Vincular ao Anterior" desligado a partir da seção do texto e a numeração iniciando em 1 (módulo 2).

## Passo 2 — Estilos antes do conteúdo
Modifique os estilos ANTES de digitar: Normal (Arial 12, 1,5, justificado, recuo 1,25, espaço depois 0), Título 1 (Arial 12 negrito MAIÚSCULO, numerado via lista multinível vinculada), Título 2 (negrito, 1.1), Título 3 (negrito itálico, 1.1.1). Cinco minutos que valem o documento inteiro.

## Passo 3 — Capa e pré-texto
Capa: instituição (cima, centralizado), autor, título no centro em negrito, cidade e ano embaixo — tudo com Ctrl+E e quebras de página entre blocos. Folha de rosto: igual, + natureza do trabalho (nota de 10, recuado 8 cm). Prefere automatizar? Seu modelo .dotx ABNT (módulo 4) faz isso em 1 clique.

## Passo 4 — Texto com tudo que você aprendeu
Digite 2 capítulos de teste: Título 1/2 aplicados (capítulos se numeram sozinhos), uma **citação direta longa** (recuo 4 cm, fonte 10, sem aspas), uma citação com fonte cadastrada (Referências → Inserir Citação, ABNT), uma tabela ABNT (linhas horizontais, título acima, fonte abaixo) e uma figura com legenda automática.

## Passo 5 — Sumário e fechamento
Referências → Sumário automático. Bibliografia automática na última seção. Revisão final: F7, marcas de formatação (Ctrl+Shift+8) para caçar Enter duplo, F9 no sumário, aceitar alterações, exportar **PDF com marcadores**.

## Onde isso vira renda
Formatação ABNT é serviço real: bancas de orientação, colegas de faculdade, grupos de TCC. Um documento desse tipo formatado de zero leva 6-10h de leigo; com seu método, 40 minutos. Precifique por urgência, monte seu modelo-estoque e atenda 5 clientes por semana — este curso se paga no primeiro mês.

## Checklist de entrega (guarde)
Margens 3/2 · Arial 12 · 1,5 · recuo 1,25 · capa sem número · sumário atualizado (F9) · citações no estilo · referências automáticas · PDF com marcadores · nome de arquivo profissional. Cada item é uma aula que você dominou.

**Parabéns**: do primeiro clique ao documento completo, você passou pelos 5 módulos. Seu certificado está a um clique — e o serviço que ele habilita, a um preço.`,
          quiz: [
            {
              prompt: 'As margens ABNT para trabalhos acadêmicos são:',
              options: ['2 cm em todas as bordas', '3 cm superior e esquerda; 2 cm inferior e direita', '3 cm em todas as bordas'],
              correctIndex: 1,
              explanation: 'Regra clássica NBR 14724: superior e esquerda 3 cm; inferior e direita 2 cm.',
            },
            {
              prompt: 'Por que configurar os ESTILOS antes de digitar o texto?',
              options: ['Porque fica mais bonito', 'Porque todo o conteúdo já nasce formatado e a estrutura (sumário, numeração) se monta sozinha', 'Porque o Word exige'],
              correctIndex: 1,
              explanation: 'Estilos primeiro = formatação herdada e estrutura automática; estilos depois = retrabalho.',
            },
            {
              prompt: 'O ritual final antes de exportar o PDF inclui:',
              options: ['Só apertar Ctrl+S', 'F9 no sumário, aceitar alterações, excluir comentários e exportar com marcadores', 'Imprimir uma cópia de teste'],
              correctIndex: 1,
              explanation: 'Atualizar campos e limpar revisão garante PDF correto e sem conteúdo interno exposto.',
            },
          ],
        },
      ],
    },
  ],
}
